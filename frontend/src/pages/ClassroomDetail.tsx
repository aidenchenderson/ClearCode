import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import TopBar from "@/components/TopBar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGitHubUser } from "@/lib/api";
import { fetchClassroom, updateClassroom } from "@/lib/firestore";
import { GitHubUserSearch } from "@/components/GitHubUserSearch";
import { UserAvatarName } from "@/components/UserAvatarName";
import type { GitHubUser } from "@/lib/api";
import type { Student } from "@/data/mockData";

const ClassroomDetail = () => {
  const { classroomId } = useParams();
  const { getAccessToken } = useAuth();
  const [classroom, setClassroom] = useState<{ id: string; name: string; description: string; students: Student[] } | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    setClassroom(undefined);
    getAccessToken().then((token) => fetchClassroom(token, classroomId).then((c) => setClassroom(c ?? null)));
  }, [classroomId, getAccessToken]);

  if (!classroomId) return <div className="p-8 text-center text-muted-foreground">Classroom not found.</div>;
  if (classroom === null) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const base = classroom;
  const students = base.students;

  const addStudentFromUser = useCallback(
    async (user: GitHubUser) => {
      const normalized = user.login.toLowerCase();
      if (students.some((s) => s.githubUsername.toLowerCase() === normalized)) {
        toast({ title: "Already added", description: `@${normalized} is already in this classroom.`, variant: "destructive" });
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
        const updated = await updateClassroom(token, classroomId, { students: [...students, newStudent] });
        setClassroom(updated);
        setQuery("");
        toast({ title: "Student added", description: `@${full.login} (${full.name}) added.` });
      } catch (e) {
        const newStudent: Student = {
          githubUsername: user.login,
          avatarUrl: user.avatar_url,
          name: user.name,
        };
        const token = await getAccessToken();
        const updated = await updateClassroom(token, classroomId, { students: [...students, newStudent] });
        setClassroom(updated);
        setQuery("");
        toast({ title: "Student added", description: `@${user.login} added.` });
      } finally {
        setAdding(false);
      }
    },
    [classroomId, students, getAccessToken]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setQuery("");
    setDialogOpen(open);
  }, []);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{base.name}</h1>
        <p className="mt-1 text-muted-foreground">{base.description}</p>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Students ({students.length})</h2>
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Student</DialogTitle>
                <DialogDescription>Search by GitHub username — results appear when you type.</DialogDescription>
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

        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>GitHub Username</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.githubUsername}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <UserAvatarName githubUsername={s.githubUsername} avatarUrl={s.avatarUrl} name={s.name} size="sm" />
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
