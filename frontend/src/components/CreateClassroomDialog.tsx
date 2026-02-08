import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGitHubUser } from "@/lib/api";
import { createClassroom } from "@/lib/firestore";
import { GitHubUserSearch } from "@/components/GitHubUserSearch";
import { UserAvatarName } from "@/components/UserAvatarName";
import type { GitHubUser } from "@/lib/api";
import type { Classroom, Student } from "@/data/mockData";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

interface Props {
  onCreated: (c: Classroom) => void;
  /** Called after create; can return a Promise (e.g. refetch). Dialog awaits before closing. */
  onSuccess?: () => void | Promise<void>;
  children: React.ReactNode;
}

const CreateClassroomDialog = ({ onCreated, onSuccess, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, getAccessToken } = useAuth();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "" } });

  const addUserFromSearch = async (ghUser: GitHubUser) => {
    const login = ghUser.login.toLowerCase();
    if (students.some((s) => s.githubUsername.toLowerCase() === login)) {
      toast({ title: "Already added", description: `@${login} is already in the list.`, variant: "destructive" });
      return;
    }
    setValidating(true);
    try {
      const full = await getGitHubUser(ghUser.login);
      const newStudent: Student = { githubUsername: full.login, avatarUrl: full.avatar_url, name: full.name };
      setStudents((prev) => [...prev, newStudent]);
      setTagInput("");
    } catch {
      const newStudent: Student = { githubUsername: ghUser.login, avatarUrl: ghUser.avatar_url, name: ghUser.name };
      setStudents((prev) => [...prev, newStudent]);
      setTagInput("");
    } finally {
      setValidating(false);
    }
  };

  const removeStudent = (githubUsername: string) => {
    setStudents((prev) => prev.filter((s) => s.githubUsername !== githubUsername));
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user?.uid) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const created = await createClassroom(token, {
        name: values.name,
        description: values.description,
        students,
      });
      onCreated(created);
      await onSuccess?.();
      toast({ title: "Classroom created", description: created.name });
      form.reset();
      setStudents([]);
      setTagInput("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create classroom",
        variant: "destructive",
      });
      return;
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTagInput("");
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Classroom</DialogTitle>
          <DialogDescription>
            Set up a new classroom and add students by GitHub username. This is just for you and not visible to students.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Classroom Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} placeholder="e.g. CS101 or course code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    disabled={isLoading}
                    placeholder="e.g. semester, class size, section, or other notes…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Add students (GitHub)</label>
              <GitHubUserSearch
                value={tagInput}
                onChange={setTagInput}
                onSelect={(u) => void addUserFromSearch(u)}
                disabled={validating || isLoading}
                placeholder="Search GitHub username…"
                searchOnlyOnChange
              />
              {students.length > 0 && (
                <ul className="flex flex-col gap-2 pt-2 max-h-[10.5rem] overflow-y-auto">
                  {students.map((s) => (
                    <li key={s.githubUsername} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <UserAvatarName githubUsername={s.githubUsername} avatarUrl={s.avatarUrl} name={s.name} size="sm" />
                      <button type="button" onClick={() => removeStudent(s.githubUsername)} disabled={isLoading} className="rounded p-1 hover:bg-destructive/20 hover:text-destructive disabled:opacity-50">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Classroom"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassroomDialog;
