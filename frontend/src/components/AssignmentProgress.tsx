import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Github,
  Bot,
  User,
  Clock,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { ProgressSection, Session, SessionDetailEntry } from "@/data/mockData";
import { mockProgressByAssignmentId } from "@/data/mockData";

function formatTimeRange(start: string, end: string): string {
  const d = new Date(start);
  const sameDay = start.slice(0, 10) === end.slice(0, 10);
  if (sameDay) {
    return `${format(d, "MMM d, yyyy")} · ${format(d, "h:mm a")} – ${format(new Date(end), "h:mm a")}`;
  }
  return `${format(d, "MMM d, h:mm a")} – ${format(new Date(end), "MMM d, h:mm a")}`;
}

function SessionDetailRow({
  entry,
  showUser,
}: {
  entry: SessionDetailEntry;
  showUser: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      {showUser && (
        <td className="py-2 pl-4 pr-2 text-sm text-muted-foreground whitespace-nowrap">
          {entry.githubUsername ? (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />@{entry.githubUsername}
            </span>
          ) : (
            "—"
          )}
        </td>
      )}
      <td className="py-2 px-2 text-sm whitespace-nowrap">
        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
      </td>
      <td className="py-2 px-2 text-sm tabular-nums">{entry.locChanged} LOC</td>
      <td className="py-2 px-2">
        {entry.aiUsed ? (
          <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-800 border-0">
            <Bot className="h-3 w-3" /> AI used
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No AI</span>
        )}
      </td>
    </tr>
  );
}

function SessionRow({
  session,
  isGroup,
}: {
  session: Session;
  isGroup: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium flex-1 min-w-0">
            {formatTimeRange(session.startTime, session.endTime)}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums shrink-0">
            {session.locChanged} LOC
          </span>
          {session.aiUsed ? (
            <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-800 border-0 shrink-0">
              <Bot className="h-3 w-3" /> AI
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground shrink-0">No AI</span>
          )}
          {isGroup && session.githubUsernames && session.githubUsernames.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              @{session.githubUsernames.join(", @")}
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {isGroup && (
                    <th className="text-left py-2 pl-4 pr-2 font-medium text-muted-foreground">User</th>
                  )}
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">LOC</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">AI</th>
                </tr>
              </thead>
              <tbody>
                {session.details.map((entry, i) => (
                  <SessionDetailRow key={i} entry={entry} showUser={isGroup} />
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SectionCard({
  section,
  isGroup,
  defaultOpen,
}: {
  section: ProgressSection;
  isGroup: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{section.label}</span>
          {section.repoLink && (
            <a
              href={section.repoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="h-4 w-4" /> Repo
            </a>
          )}
          {isGroup && section.members && section.members.length > 0 && (
            <span className="text-xs text-muted-foreground">
              @{section.members.join(", @")}
            </span>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {section.sessions.length} session{section.sessions.length !== 1 ? "s" : ""}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border">
            {section.sessions.map((session) => (
              <SessionRow key={session.id} session={session} isGroup={isGroup} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface AssignmentProgressProps {
  assignmentId: string;
  isGroup: boolean;
  /** Controlled search: when set from parent (e.g. after clicking a student in Invited), filters to that student's work. */
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function AssignmentProgress({
  assignmentId,
  isGroup,
  search: searchProp,
  onSearchChange,
}: AssignmentProgressProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp !== undefined ? searchProp : internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const allSections = mockProgressByAssignmentId[assignmentId] ?? mockProgressByAssignmentId["demo"];
  const sections = useMemo(() => {
    if (!allSections) return [];
    const q = search.trim().toLowerCase();
    if (!q) return allSections;
    return allSections.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.members?.some((m) => m.toLowerCase().includes(q)),
    );
  }, [allSections, search]);

  if (!allSections || allSections.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
          No progress data yet. Progress is tracked in real time; sessions and timeline will appear here.
        </p>
      </div>
    );
  }
  const isDemo = !mockProgressByAssignmentId[assignmentId];
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden flex flex-col" style={{ maxHeight: "min(calc(100vh - 18rem), 520px)" }}>
      {isDemo && (
        <p className="text-sm text-amber-700 bg-amber-50 border-b border-amber-200 px-4 py-1.5">
          Showing demo data (no progress recorded for this assignment yet).
        </p>
      )}
      <p className="text-sm text-muted-foreground px-4 pt-2 pb-1 shrink-0">
        Timeline of code changes by {isGroup ? "group" : "student"}. Expand sections for sessions, then sessions for timestamps and LOC.
      </p>
      <div className="p-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-border"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No sections match your search.
          </p>
        ) : (
          sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              isGroup={isGroup}
              defaultOpen={i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
