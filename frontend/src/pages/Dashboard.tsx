import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const refetch = async () => {
    const token = await getAccessToken(true);
    if (!token) return;
    try {
      const [classList, assignList] = await Promise.all([
        fetchClassrooms(token),
        fetchAssignments(token),
      ]);
      setClassrooms(classList);
      setAssignments(assignList);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setClassrooms([]);
      setAssignments([]);
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard data");
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void refetch();
  }, [user?.uid]);

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-8 relative z-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Professor Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your assignments and classrooms.</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Assignments */}
          <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
              <CreateAssignmentDialog onCreated={() => void refetch()}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"><Plus className="h-4 w-4" /> New Assignment</Button>
              </CreateAssignmentDialog>
            </div>
            <div className="space-y-3">
              {assignments.map((a, i) => (
                <Link key={a.id} to={`/dashboard/assignments/${a.id}`} className="block" style={{ animation: `fadeInUp 0.6s ease-out ${0.2 + i * 0.05}s both` }}>
                  <Card className="glass-card border-white/40 bg-white/50 backdrop-blur-xl soft-shadow card-hover transition-all duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{a.name}</CardTitle>
                        <Badge variant={a.isGroup ? "default" : "secondary"} className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                          {a.isGroup ? "Group" : "Solo"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1">{a.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due {a.dueDate}</span>
                      <span>Created {a.createdAt}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Classrooms */}
          <section className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Classrooms</h2>
              <CreateClassroomDialog onCreated={() => void refetch()}>
                <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"><Plus className="h-4 w-4" /> New Classroom</Button>
              </CreateClassroomDialog>
            </div>
            <div className="space-y-3">
              {classrooms.map((c, i) => (
                <Link key={c.id} to={`/dashboard/classrooms/${c.id}`} className="block" style={{ animation: `fadeInUp 0.6s ease-out ${0.25 + i * 0.05}s both` }}>
                  <Card className="glass-card border-white/40 bg-white/50 backdrop-blur-xl soft-shadow card-hover transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{c.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{c.students.length} students</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Decorative elements */}
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: "1s" }}></div>
    </div>
  );
};

export default Dashboard;
