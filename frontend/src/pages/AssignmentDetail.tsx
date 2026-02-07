import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Users, UserPlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import TopBar from "@/components/TopBar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGitHubUser } from "@/lib/api";
import { fetchAssignment } from "@/lib/firestore";
import { GitHubUserSearch } from "@/components/GitHubUserSearch";
import { UserAvatarName } from "@/components/UserAvatarName";
import { mockInvitedByAssignmentId } from "@/data/mockData";
import type { Assignment } from "@/data/mockData";
import type { GitHubUser } from "@/lib/api";

const statusColor: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  submitted: "secondary",
  graded: "secondary",
};

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(undefined);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const { getAccessToken } = useAuth();

  useEffect(() => {
    if (!assignmentId) return;
    setAssignment(undefined);
    getAccessToken().then((token) => fetchAssignment(token, assignmentId).then((a) => setAssignment(a ?? null)));
  }, [assignmentId, getAccessToken]);

  if (!assignmentId) return <div className="p-8 text-center text-muted-foreground">Assignment not found.</div>;
  if (assignment === undefined) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (assignment === null) return <div className="p-8 text-center text-muted-foreground">Assignment not found.</div>;

  const invitedUsers = mockInvitedByAssignmentId[assignmentId] ?? [];

  const inviteUserFromSearch = async (user: GitHubUser) => {
    setInviteLoading(true);
    try {
      const full = await getGitHubUser(user.login);
      setInviteOpen(false);
      setInviteQuery("");
      toast({ title: "Invitation sent", description: `Invited @${full.login} (${full.name}) via GitHub.` });
    } catch {
      setInviteOpen(false);
      setInviteQuery("");
      toast({ title: "Invitation sent", description: `Invited @${user.login} via GitHub.` });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteOpenChange = (open: boolean) => {
    if (!open) setInviteQuery("");
    setInviteOpen(open);
  };

  const inviteClassroom = () => toast({ title: "Invitation sent", description: "Invited classroom." });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{assignment.name}</h1>
            <p className="mt-1 text-muted-foreground">{assignment.description}</p>
          </div>
          <Badge variant={assignment.isGroup ? "default" : "secondary"}>
            {assignment.isGroup ? `Group (max ${assignment.maxGroupSize})` : "Solo"}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Due {assignment.dueDate}</span>
          <span>Created {assignment.createdAt}</span>
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
                <DialogDescription>Search by GitHub username — results appear when you type.</DialogDescription>
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
          <Button variant="outline" size="sm" className="gap-1" onClick={() => inviteClassroom()}>
            <Send className="h-4 w-4" /> Invite Classroom
          </Button>
        </div>

        {/* Invited users (mock; will be Firebase) */}
        {invitedUsers.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-semibold text-foreground">Invited</h2>
            <div className="mt-3 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GitHub User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitedUsers.map((inv) => (
                    <TableRow key={inv.id ?? inv.githubUsername}>
                      <TableCell>
                        <UserAvatarName githubUsername={inv.githubUsername} avatarUrl={inv.avatarUrl} name={inv.name} size="sm" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Groups Table */}
        <h2 className="mt-8 text-lg font-semibold text-foreground">{assignment.isGroup ? "Groups" : "Students"}</h2>
        <div className="mt-3 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{assignment.isGroup ? "Group" : "Student"}</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignment.groups.map(g => (
                <TableRow key={g.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/dashboard/assignments/${assignment.id}/groups/${g.id}`} className="font-medium text-primary hover:underline">
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="flex items-center gap-1 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {g.members.map(m => `@${m}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor[g.status] ?? "secondary"} className="capitalize">{g.status}</Badge>
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

export default AssignmentDetail;
