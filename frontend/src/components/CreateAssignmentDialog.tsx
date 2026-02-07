import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAssignment } from "@/lib/firestore";
import type { Assignment } from "@/data/mockData";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date({ required_error: "Due date is required" }),
  isGroup: z.boolean(),
  maxGroupSize: z.coerce.number().min(2).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreated: (a: Assignment) => void;
  children: React.ReactNode;
}

const CreateAssignmentDialog = ({ onCreated, children }: Props) => {
  const [open, setOpen] = useState(false);
  const { user, getAccessToken } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", isGroup: false },
  });

  const isGroup = form.watch("isGroup");

  const onSubmit = async (values: FormValues) => {
    if (!user?.uid) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const assignmentData = {
      name: values.name,
      description: values.description,
      createdAt: new Date().toISOString().slice(0, 10),
      dueDate: format(values.dueDate, "yyyy-MM-dd"),
      isGroup: values.isGroup,
      maxGroupSize: values.isGroup ? values.maxGroupSize : undefined,
      groups: [],
    };
    const token = await getAccessToken();
    const created = await createAssignment(token, assignmentData);
    onCreated(created);
    toast({ title: "Assignment created", description: created.name });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>Fill out the details for the new assignment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Assignment Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel>
                <Popover><PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent></Popover><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isGroup" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-0">Group Assignment</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            {isGroup && (
              <FormField control={form.control} name="maxGroupSize" render={({ field }) => (
                <FormItem><FormLabel>Max Group Size</FormLabel><FormControl><Input type="number" min={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <Button type="submit" className="w-full">Create Assignment</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;
