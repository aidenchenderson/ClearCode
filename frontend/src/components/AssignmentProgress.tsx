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
  Plus,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { ProgressSection, Session, SessionDetailEntry } from "@/data/mockData";

function formatTimeRange(start: string, end: string): string {
  const d = new Date(start);
  const sameDay = start.slice(0, 10) === end.slice(0, 10);
  if (sameDay) {
    return `${format(d, "MMM d, yyyy")} · ${format(d, "h:mm a")} – ${format(new Date(end), "h:mm a")}`;
  }
  return `${format(d, "MMM d, h:mm a")} – ${format(new Date(end), "MMM d, h:mm a")}`;
}

function SessionDetailRow({ entry }: { entry: SessionDetailEntry }) {
  const [showCode, setShowCode] = useState(false);
  const hasCode = entry.lineContent != null && entry.lineContent !== "";
  const colCount = 5;
  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="py-2 pl-4 pr-2 text-sm text-muted-foreground whitespace-nowrap">
          {entry.githubUsername ? (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />@{entry.githubUsername}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="py-2 px-2 text-sm whitespace-nowrap">
          {format(new Date(entry.timestamp), "MMM d, h:mm a")}
        </td>
        <td className="py-2 px-2 text-sm tabular-nums">
          {entry.lineNumber != null ? entry.lineNumber : "—"}
        </td>
        <td className="py-2 px-2 text-sm text-muted-foreground max-w-[200px] truncate" title={entry.filePath ?? undefined}>
          {entry.filePath ?? "—"}
        </td>
        <td className="py-2 pr-4 pl-2 text-right w-10">
          {hasCode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCode((v) => !v);
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              aria-label={showCode ? "Hide code" : "Show code"}
            >
              {showCode ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </td>
      </tr>
      {showCode && hasCode && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={colCount} className="py-2 px-4">
            <pre className="text-xs font-mono bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
              {entry.lineContent}
            </pre>
          </td>
        </tr>
      )}
    </>
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
                  <th className="text-left py-2 pl-4 pr-2 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Line #</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">File</th>
                  <th className="text-right py-2 pr-4 pl-2 font-medium text-muted-foreground w-10" />
                </tr>
              </thead>
              <tbody>
                {session.details.map((entry, i) => (
                  <SessionDetailRow key={i} entry={entry} />
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
          <span className="font-medium text-foreground">
            {section.members && section.members.length > 0
              ? section.members.map((m) => `@${m}`).join(", ")
              : section.label}
          </span>
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
  /** Sections from progress API (null = not loaded yet). */
  sections?: ProgressSection[] | null;
  /** True while fetching progress. */
  loading?: boolean;
}

export function AssignmentProgress({
  assignmentId,
  isGroup,
  search: searchProp,
  onSearchChange,
  sections: sectionsProp = null,
  loading = false,
}: AssignmentProgressProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp !== undefined ? searchProp : internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const allSections = useMemo(
    () => (sectionsProp ?? []).filter((s) => (s.sessions?.length ?? 0) > 0),
    [sectionsProp],
  );
  const sections = useMemo(() => {
    if (!allSections.length) return [];
    const q = search.trim().toLowerCase();
    if (!q) return allSections;
    return allSections.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.members?.some((m) => (m || "").toLowerCase().includes(q)),
    );
  }, [allSections, search]);

  if (loading && sectionsProp === null) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Loading progress…</p>
      </div>
    );
  }
  if (!allSections.length) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          No progress data yet. Progress is tracked in real time; sessions and timeline will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden flex flex-col" style={{ maxHeight: "min(calc(100vh - 18rem), 520px)" }}>
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
