import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TopBar from "@/components/TopBar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBreadcrumbTitles } from "@/contexts/BreadcrumbContext";
import { getGitHubUser } from "@/lib/api";
import { fetchClassroom, updateClassroom, deleteClassroom } from "@/lib/firestore";
import { GitHubUserSearch } from "@/components/GitHubUserSearch";
import { UserAvatarName } from "@/components/UserAvatarName";
import type { GitHubUser } from "@/lib/api";
import type { Student } from "@/data/mockData";

const ClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const { setTitles } = useBreadcrumbTitles();
  const [classroom, setClassroom] = useState<
    | { id: string; name: string; description: string; students: Student[] }
    | null
    | undefined
  >(undefined);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<"name" | "description" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    setClassroom(undefined);
    getAccessToken().then((token) =>
      fetchClassroom(token, classroomId).then((c) => {
        setClassroom(c ?? null);
        setTitles(
          c
            ? { classroomName: c.name, classroomId: c.id }
            : {},
        );
      }),
    );
  }, [classroomId, setTitles]);

  const addStudentFromUser = useCallback(
    async (user: GitHubUser) => {
      if (!classroom || classroom === null) return;
      const students = classroom.students;
      const normalized = user.login.toLowerCase();
      if (students.some((s) => s.githubUsername.toLowerCase() === normalized)) {
        toast({
          title: "Already added",
          description: `@${normalized} is already in this classroom.`,
          variant: "destructive",
        });
        return;
      }
      setAdding(true);
      try {
        const full = await getGitHubUser(user.login);
        const newStudent: Student = {
          githubUsername: full.login,
          avatarUrl: full.avatar_url,
          name: full.name,
        };
        const token = await getAccessToken();
        const updated = await updateClassroom(token, classroomId, {
          students: [...students, newStudent],
        });
        setClassroom(updated);
        setQuery("");
        setDialogOpen(false);
        toast({
          title: "Student added",
          description: `@${full.login} (${full.name}) added.`,
        });
      } catch (e) {
        const newStudent: Student = {
          githubUsername: user.login,
          avatarUrl: user.avatar_url,
          name: user.name,
        };
        const token = await getAccessToken();
        const updated = await updateClassroom(token, classroomId, {
          students: [...students, newStudent],
        });
        setClassroom(updated);
        setQuery("");
        setDialogOpen(false);
        toast({ title: "Student added", description: `@${user.login} added.` });
      } finally {
        setAdding(false);
      }
    },
    [classroomId, classroom, getAccessToken],
  );

  const handleRemoveStudent = useCallback(
    async (githubUsername: string) => {
      if (!classroom || classroom === null) return;
      const token = await getAccessToken();
      if (!token) return;
      try {
        const students = classroom.students;
        const updated = await updateClassroom(token, classroomId, {
          students: students.filter(
            (s) => s.githubUsername.toLowerCase() !== githubUsername.toLowerCase(),
          ),
        });
        setClassroom(updated);
        toast({
          title: "Student removed",
          description: `@${githubUsername} has been removed.`,
        });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to remove student",
          variant: "destructive",
        });
      }
    },
    [classroomId, classroom, getAccessToken],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setQuery("");
    setDialogOpen(open);
  }, []);

  const handleDeleteClassroom = useCallback(async () => {
    if (!classroomId) return;
    try {
      setDeleting(true);
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      await deleteClassroom(token, classroomId);
      setDeleteDialogOpen(false);
      toast({ title: "Classroom deleted", description: "The classroom has been deleted." });
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete classroom",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [classroomId, getAccessToken, navigate]);

  const startEdit = useCallback((field: "name" | "description", value: string) => {
    setEditingField(field);
    setEditValue(value);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(
    async () => {
      if (!classroomId || !classroom || editingField === null) return;
      setSavingField(true);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Not authenticated");
        const payload =
          editingField === "name"
            ? { name: editValue.trim() }
            : { description: editValue.trim() };
        const updated = await updateClassroom(token, classroomId, payload);
        setClassroom(updated);
        if (editingField === "name") {
          setTitles({ classroomName: updated.name, classroomId: updated.id });
        }
        setEditingField(null);
        setEditValue("");
        toast({ title: "Saved", description: "Classroom updated." });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to save",
          variant: "destructive",
        });
      } finally {
        setSavingField(false);
      }
    },
    [classroomId, classroom, editingField, editValue, getAccessToken, setTitles],
  );

  if (!classroomId)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Classroom not found.
      </div>
    );
  if (classroom === undefined)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
  if (classroom === null)
    return (
      <div className="p-8 text-center text-muted-foreground">Classroom not found.</div>
    );
  
  const base = classroom;
  const students = base.students;

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {editingField === "name" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-2xl font-bold max-w-md"
              placeholder="Classroom name"
              disabled={savingField}
            />
            <Button size="sm" onClick={saveEdit} disabled={savingField || !editValue.trim()}>
              {savingField ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={savingField}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-2xl font-bold text-foreground">{base.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
              onClick={() => startEdit("name", base.name)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
        {editingField === "description" ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Description"
              disabled={savingField}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={savingField}>
                {savingField ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={savingField}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 mt-1 group">
            <p className="text-muted-foreground flex-1 min-w-0">{base.description}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
              onClick={() => startEdit("description", base.description)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Students ({students.length})
          </h2>
          <div className="flex items-center gap-2">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete classroom
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete classroom?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{base.name}&quot; and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDeleteClassroom();
                    }}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Student
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Student</DialogTitle>
                <DialogDescription>
                  Search by GitHub username — results appear when you type.
                </DialogDescription>
              </DialogHeader>
              <GitHubUserSearch
                value={query}
                onChange={setQuery}
                onSelect={(u) => void addStudentFromUser(u)}
                disabled={adding}
                placeholder="Search GitHub username…"
                searchOnlyOnChange
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>GitHub Username</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.githubUsername}>
                  <TableCell className="text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <UserAvatarName
                      githubUsername={s.githubUsername}
                      avatarUrl={s.avatarUrl}
                      name={s.name}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRemoveStudent(s.githubUsername)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default ClassroomDetail;
