import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Plus, Calendar, Users, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import CreateAssignmentDialog from "@/components/CreateAssignmentDialog";
import CreateClassroomDialog from "@/components/CreateClassroomDialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchClassrooms, fetchAssignments } from "@/lib/firestore";
import { toast } from "sonner";
import type { Assignment, Classroom } from "@/data/mockData";

const Dashboard = () => {
  const { user, getAccessToken } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [classroomSearch, setClassroomSearch] = useState("");

  const filteredAssignments = useMemo(() => {
    const q = assignmentSearch.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)),
    );
  }, [assignments, assignmentSearch]);

  const filteredClassrooms = useMemo(() => {
    const q = classroomSearch.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [classrooms, classroomSearch]);

  const refetch = async () => {
    const token = await getAccessToken(true);
    if (!token) throw new Error("Not authenticated");
    const [classList, assignList] = await Promise.all([
      fetchClassrooms(token),
      fetchAssignments(token),
    ]);
    setClassrooms(classList);
    setAssignments(assignList);
  };

  useEffect(() => {
    if (!user?.uid) return;
    void refetch().catch((err) => {
      console.error("Failed to load dashboard data:", err);
      setClassrooms([]);
      setAssignments([]);
      toast.error(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    });
  }, [user?.uid]);

  const handleAssignmentCreated = (_assignment: Assignment) => {
    void refetch();
  };

  const handleClassroomCreated = (_classroom: Classroom) => {
    void refetch();
  };

  return (
    <div className="min-h-screen flex flex-col gradient-bg relative overflow-hidden">
      <TopBar />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8 relative z-10 w-full">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your assignments and classrooms.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Assignments */}
          <section
            className="animate-fade-in-up rounded-2xl border border-border bg-white shadow-lg overflow-hidden flex flex-col"
            style={{ animationDelay: "0.1s", maxHeight: "min(calc(100vh - 14rem), 520px)" }}
          >
            <div className="p-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Assignments
              </h2>
              <CreateAssignmentDialog onCreated={handleAssignmentCreated} onSuccess={refetch}>
                <Button
                  size="sm"
                  className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4" /> New Assignment
                </Button>
              </CreateAssignmentDialog>
            </div>
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assignments…"
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  className="pl-9 h-9 bg-white border-border placeholder:text-muted-foreground/80"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {filteredAssignments.map((a, i) => (
                <div key={a.id} className="relative">
                  <Link to={`/dashboard/assignments/${a.id}`} className="block group">
                    <Card className="rounded-xl border border-border bg-white/90 backdrop-blur-sm soft-shadow card-hover transition-all duration-300 cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base group-hover:underline">{a.name}</CardTitle>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <Badge
                              variant={a.isGroup ? "default" : "secondary"}
                              className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            >
                              {a.isGroup ? "Group" : "Solo"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0"
                            >
                              <UserCheck className="h-3 w-3 mr-0.5" />
                              {a.invitedCount ?? 0} assigned
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-1">
                          {a.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Due {a.dueDate}
                        </span>
                        <span>Created {a.createdAt}</span>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
              {filteredAssignments.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {assignmentSearch.trim() ? "No assignments match your search." : "No assignments yet."}
                </p>
              )}
            </div>
          </section>

          {/* Classrooms */}
          <section
            className="animate-fade-in-up rounded-2xl border border-border bg-white shadow-lg overflow-hidden flex flex-col"
            style={{ animationDelay: "0.15s", maxHeight: "min(calc(100vh - 14rem), 520px)" }}
          >
            <div className="p-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Classrooms
              </h2>
              <CreateClassroomDialog onCreated={handleClassroomCreated} onSuccess={refetch}>
                <Button
                  size="sm"
                  className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4" /> New Classroom
                </Button>
              </CreateClassroomDialog>
            </div>
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search classrooms…"
                  value={classroomSearch}
                  onChange={(e) => setClassroomSearch(e.target.value)}
                  className="pl-9 h-9 bg-white border-border placeholder:text-muted-foreground/80"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {filteredClassrooms.map((c) => (
                <div key={c.id} className="relative">
                  <Link to={`/dashboard/classrooms/${c.id}`} className="block group">
                    <Card className="rounded-xl border border-border bg-white/90 backdrop-blur-sm soft-shadow card-hover transition-all duration-300 cursor-pointer">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base group-hover:underline">{c.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {c.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{c.students.length} students</span>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
              {filteredClassrooms.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {classroomSearch.trim() ? "No classrooms match your search." : "No classrooms yet."}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Decorative elements */}
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div
        className="fixed -bottom-40 -left-40 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl pointer-events-none animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
    </div>
  );
};

export default Dashboard;
