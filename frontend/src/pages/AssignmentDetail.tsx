import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Calendar, Users, UserPlus, Send, Trash2, Pencil, Loader2, UserCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopBar from "@/components/TopBar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBreadcrumbTitles } from "@/contexts/BreadcrumbContext";
import { getGitHubUser } from "@/lib/api";
import {
  fetchAssignment,
  fetchInvitedStudents,
  inviteStudent,
  deleteInvite,
  deleteAssignment,
  updateAssignment,
  fetchClassrooms,
} from "@/lib/firestore";
import { GitHubUserSearch } from "@/components/GitHubUserSearch";
import { UserAvatarName } from "@/components/UserAvatarName";
import { AssignmentProgress } from "@/components/AssignmentProgress";
import type { Assignment, Classroom, InvitedUser } from "@/data/mockData";
import type { GitHubUser } from "@/lib/api";

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(
    undefined,
  );
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [classroomInviteOpen, setClassroomInviteOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomInviteLoading, setClassroomInviteLoading] = useState(false);
  const [editingField, setEditingField] = useState<"name" | "description" | "dueDate" | "maxGroupSize" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [invitedSearch, setInvitedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("progress");
  const [progressSearch, setProgressSearch] = useState("");
  const { getAccessToken } = useAuth();

  const filteredInvitedUsers = useMemo(() => {
    const q = invitedSearch.trim().toLowerCase();
    if (!q) return invitedUsers;
    return invitedUsers.filter(
      (inv) =>
        inv.githubUsername.toLowerCase().includes(q) ||
        (inv.name?.toLowerCase().includes(q)),
    );
  }, [invitedUsers, invitedSearch]);
  const { setTitles } = useBreadcrumbTitles();

  useEffect(() => {
    if (!assignmentId) return;
    setAssignment(undefined);
    getAccessToken().then((token) =>
      fetchAssignment(token, assignmentId).then((a) => {
        setAssignment(a ?? null);
        setTitles(
          a
            ? { assignmentName: a.name, assignmentId: a.id }
            : {},
        );
      }),
    );
  }, [assignmentId, setTitles]);

  useEffect(() => {
    if (!assignmentId) return;
    getAccessToken().then((token) => {
      if (token) {
        fetchInvitedStudents(token, assignmentId).then((users) =>
          setInvitedUsers(users),
        );
      }
    });
  }, [assignmentId]);

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const token = await getAccessToken();
      if (!token || !assignmentId) throw new Error("Not authenticated");

      await deleteInvite(token, assignmentId, inviteId);

      // Refetch invited students
      const updated = await fetchInvitedStudents(token, assignmentId);
      setInvitedUsers(updated);

      toast({
        title: "Invite removed",
        description: "The student invitation has been removed.",
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to remove invite";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      setDeleting(true);
      const token = await getAccessToken();
      if (!token || !assignmentId) throw new Error("Not authenticated");

      await deleteAssignment(token, assignmentId);

      setDeleteDialogOpen(false);
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted.",
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete assignment";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (!assignmentId)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Assignment not found.
      </div>
    );
  if (assignment === undefined)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
  if (assignment === null)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Assignment not found.
      </div>
    );

  const inviteUserFromSearch = async (user: GitHubUser) => {
    setInviteLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const full = await getGitHubUser(user.login);
      await inviteStudent(token, assignmentId!, {
        githubUsername: full.login,
        avatarUrl: full.avatar_url,
        name: full.name,
      });

      const updated = await fetchInvitedStudents(token, assignmentId!);
      setInvitedUsers(updated);

      setInviteOpen(false);
      setInviteQuery("");
      toast({
        title: "Invitation sent",
        description: `Invited @${full.login} (${full.name}) via GitHub.`,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to invite user";
      setInviteOpen(false);
      setInviteQuery("");
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteOpenChange = (open: boolean) => {
    if (!open) setInviteQuery("");
    setInviteOpen(open);
  };

  const handleClassroomInviteOpenChange = (open: boolean) => {
    if (open) {
      getAccessToken().then((token) => {
        if (token) fetchClassrooms(token).then(setClassrooms);
      });
    }
    setClassroomInviteOpen(open);
  };

  const startEdit = (field: "name" | "description" | "dueDate", value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!assignmentId || !assignment || editingField === null) return;
    setSavingField(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const payload =
        editingField === "dueDate"
          ? { dueDate: editValue.trim() }
          : editingField === "maxGroupSize"
            ? { maxGroupSize: Math.max(2, parseInt(editValue, 10) || 2) }
            : editingField === "name"
              ? { name: editValue.trim() }
              : { description: editValue.trim() };
      const updated = await updateAssignment(token, assignmentId, payload);
      setAssignment(updated);
      if (editingField === "name") {
        setTitles({ assignmentName: updated.name, assignmentId: updated.id });
      }
      setEditingField(null);
      setEditValue("");
      toast({ title: "Saved", description: "Assignment updated." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSavingField(false);
    }
  };

  const inviteClassroomStudents = async (classroom: Classroom) => {
    if (!assignmentId) return;
    setClassroomInviteLoading(true);
    const alreadyInvited = new Set(
      invitedUsers.map((u) => u.githubUsername.toLowerCase()),
    );
    let added = 0;
    let skipped = 0;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const students = classroom.students ?? [];
      for (const student of students) {
        const login = (student.githubUsername || "").trim().toLowerCase();
        if (!login) continue;
        if (alreadyInvited.has(login)) {
          skipped += 1;
          continue;
        }
        try {
          await inviteStudent(token, assignmentId, {
            githubUsername: login,
            avatarUrl: student.avatarUrl,
            name: student.name,
          });
          added += 1;
          alreadyInvited.add(login);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.toLowerCase().includes("already invited")) {
            skipped += 1;
            alreadyInvited.add(login);
          } else {
            throw err;
          }
        }
      }

      const updated = await fetchInvitedStudents(token, assignmentId);
      setInvitedUsers(updated);
      setClassroomInviteOpen(false);

      if (added === 0 && skipped === 0) {
        toast({
          title: "No students to invite",
          description: `${classroom.name} has no students.`,
        });
      } else if (added === 0) {
        toast({
          title: "Classroom already invited",
          description: `All ${skipped} student(s) from ${classroom.name} were already invited.`,
        });
      } else {
        toast({
          title: "Classroom invited",
          description: `Added ${added} student(s) from ${classroom.name}${skipped > 0 ? ` (${skipped} already invited, skipped)` : ""}.`,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to invite classroom";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setClassroomInviteLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editingField === "name" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-2xl font-bold max-w-md"
                  placeholder="Assignment name"
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
                <h1 className="text-2xl font-bold text-foreground">
                  {assignment.name}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
                  onClick={() => startEdit("name", assignment.name)}
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
                <p className="text-muted-foreground flex-1 min-w-0">
                  {assignment.description}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
                  onClick={() => startEdit("description", assignment.description)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{assignment.name}&quot; and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDeleteAssignment();
                    }}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {editingField === "dueDate" ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={savingField}
                className="w-auto"
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
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Due {assignment.dueDate}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 group-hover:opacity-100"
                onClick={() => startEdit("dueDate", assignment.dueDate)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <span>Created {assignment.createdAt}</span>
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0"
          >
            <UserCheck className="h-3 w-3 mr-1" />
            {invitedUsers.length} assigned
          </Badge>
          <Badge
            variant={assignment.isGroup ? "default" : "secondary"}
            className="shrink-0 text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0"
          >
            {assignment.isGroup
              ? `Group (max ${assignment.maxGroupSize ?? "—"})`
              : "Solo"}
          </Badge>
          {assignment.isGroup && (
            editingField === "maxGroupSize" ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={savingField}
                  className="w-20"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-70 group-hover:opacity-100"
                  onClick={() => startEdit("maxGroupSize", String(assignment.maxGroupSize ?? 2))}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          )}
        </div>

        {/* Invite Section */}
        <div className="mt-8 flex items-center gap-3">
          <Dialog open={inviteOpen} onOpenChange={handleInviteOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <UserPlus className="h-4 w-4" /> Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite by GitHub username</DialogTitle>
                <DialogDescription>
                  Search by GitHub username — results appear when you type.
                </DialogDescription>
              </DialogHeader>
              <GitHubUserSearch
                value={inviteQuery}
                onChange={setInviteQuery}
                onSelect={(u) => void inviteUserFromSearch(u)}
                disabled={inviteLoading}
                placeholder="Search GitHub username…"
                searchOnlyOnChange
              />
            </DialogContent>
          </Dialog>
          <Dialog
            open={classroomInviteOpen}
            onOpenChange={handleClassroomInviteOpenChange}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Send className="h-4 w-4" /> Invite Classroom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite classroom</DialogTitle>
                <DialogDescription>
                  Choose a classroom to invite all its students to this assignment. Students already invited are skipped.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[280px] overflow-y-auto space-y-2">
                {classrooms.length === 0 && !classroomInviteLoading && (
                  <p className="text-sm text-muted-foreground py-4">
                    No classrooms found. Create one from the dashboard first.
                  </p>
                )}
                {classrooms.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                    onClick={() => inviteClassroomStudents(c)}
                    disabled={classroomInviteLoading}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {c.students?.length ?? 0} students
                    </span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs: Progress (first) and Invited */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="bg-muted">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="invited">Invited</TabsTrigger>
          </TabsList>
          <TabsContent value="progress" className="mt-3">
            <AssignmentProgress
              assignmentId={assignment.id}
              isGroup={assignment.isGroup}
              search={progressSearch}
              onSearchChange={setProgressSearch}
            />
          </TabsContent>
          <TabsContent value="invited" className="mt-3">
            <div className="rounded-xl border border-border bg-white overflow-hidden flex flex-col" style={{ maxHeight: "min(calc(100vh - 18rem), 480px)" }}>
              <div className="p-3 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search invited users…"
                    value={invitedSearch}
                    onChange={(e) => setInvitedSearch(e.target.value)}
                    className="pl-9 h-9 bg-white border-border"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {filteredInvitedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {invitedSearch.trim() ? "No invited users match your search." : "No one invited yet. Use the buttons above to invite users or a classroom."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GitHub User</TableHead>
                        <TableHead className="w-20">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvitedUsers.map((inv) => (
                        <TableRow key={inv.id ?? inv.githubUsername}>
                          <TableCell
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setProgressSearch(inv.githubUsername);
                              setActiveTab("progress");
                            }}
                          >
                            <UserAvatarName
                              githubUsername={inv.githubUsername}
                              avatarUrl={inv.avatarUrl}
                              name={inv.name}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                inv.id && handleDeleteInvite(inv.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AssignmentDetail;
