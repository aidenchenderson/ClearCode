import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbTitles } from "@/contexts/BreadcrumbContext";

const Breadcrumbs = () => {
  const location = useLocation();
  const { titles } = useBreadcrumbTitles();
  const path = location.pathname;

  // Dashboard only
  if (path === "/dashboard" || path === "/dashboard/") {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Dashboard</span>
      </nav>
    );
  }

  // Dashboard -> Assignment: name
  const assignmentMatch = path.match(/^\/dashboard\/assignments\/([^/]+)$/);
  if (assignmentMatch) {
    const label = titles.assignmentName
      ? `Assignment: ${titles.assignmentName}`
      : "Assignment";
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{label}</span>
      </nav>
    );
  }

  // Dashboard -> Assignment: name -> Group: name
  const groupMatch = path.match(/^\/dashboard\/assignments\/([^/]+)\/groups\/([^/]+)$/);
  if (groupMatch) {
    const [, aId, gId] = groupMatch;
    const assignmentLabel = titles.assignmentName
      ? `Assignment: ${titles.assignmentName}`
      : "Assignment";
    const groupLabel = titles.groupName ? `Group: ${titles.groupName}` : "Group";
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          to={`/dashboard/assignments/${aId}`}
          className="hover:text-foreground transition-colors"
        >
          {assignmentLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{groupLabel}</span>
      </nav>
    );
  }

  // Dashboard -> Classroom: name
  const classroomMatch = path.match(/^\/dashboard\/classrooms\/([^/]+)$/);
  if (classroomMatch) {
    const label = titles.classroomName
      ? `Classroom: ${titles.classroomName}`
      : "Classroom";
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{label}</span>
      </nav>
    );
  }

  // Fallback: generic segment-based breadcrumbs (no link to /dashboard/assignments)
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [];
  let accumulated = "";
  const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    classrooms: "Classrooms",
    groups: "Groups",
  };
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = routeLabels[seg] || decodeURIComponent(seg).replace(/-/g, " ");
    crumbs.push({ label, path: accumulated });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
