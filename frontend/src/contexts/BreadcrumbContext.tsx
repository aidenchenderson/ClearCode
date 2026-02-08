import { createContext, useContext, useState, type ReactNode } from "react";

export interface BreadcrumbTitles {
  assignmentName?: string | null;
  assignmentId?: string | null;
  classroomName?: string | null;
  classroomId?: string | null;
  groupName?: string | null;
  groupId?: string | null;
}

const defaultTitles: BreadcrumbTitles = {};

const BreadcrumbContext = createContext<{
  titles: BreadcrumbTitles;
  setTitles: (t: BreadcrumbTitles | ((prev: BreadcrumbTitles) => BreadcrumbTitles)) => void;
}>({
  titles: defaultTitles,
  setTitles: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [titles, setTitles] = useState<BreadcrumbTitles>(defaultTitles);
  return (
    <BreadcrumbContext.Provider value={{ titles, setTitles }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbTitles() {
  return useContext(BreadcrumbContext);
}
