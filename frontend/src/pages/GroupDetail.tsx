import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { fetchAssignment } from "@/lib/firestore";
import type { Assignment } from "@/data/mockData";

const GroupDetail = () => {
  const { assignmentId, groupId } = useParams();
  const { getAccessToken } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!assignmentId) return;
    setAssignment(undefined);
    getAccessToken().then((token) =>
      fetchAssignment(token, assignmentId).then((a) =>
        setAssignment(a ?? null),
      ),
    );
  }, [assignmentId]);

  const group =
    assignment && typeof assignment === "object"
      ? assignment.groups.find((g) => g.id === groupId)
      : undefined;

  if (!assignmentId || !groupId)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Group not found.
      </div>
    );
  if (assignment === undefined)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
  if (assignment === null || !group)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Group not found.
      </div>
    );

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assignment: {assignment.name}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {group.members.map((m) => (
            <Badge key={m} variant="secondary" className="gap-1">
              <Github className="h-3 w-3" />@{m}
            </Badge>
          ))}
        </div>

        {/* Activity Timeline */}
        <h2 className="mt-10 text-lg font-semibold text-foreground">
          Activity Timeline
        </h2>
        <div className="relative mt-4 ml-4 border-l-2 border-border pl-6 space-y-6">
          {group.activityLog.map((entry, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[calc(1.5rem+5px)] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary" />
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.timestamp), "MMM d, yyyy · h:mm a")}
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                <span className="font-medium">@{entry.githubUsername}</span>{" "}
                <span className="text-muted-foreground">{entry.action}</span>
              </p>
            </div>
          ))}
          {group.activityLog.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;
