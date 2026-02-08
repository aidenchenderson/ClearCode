export interface Student {
  githubUsername: string;
  avatarUrl?: string;
  name?: string;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  students: Student[];
}

export interface Assignment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  dueDate: string;
  isGroup: boolean;
  maxGroupSize?: number;
  groups: Group[];
  /** Number of students invited/assigned (from API list). */
  invitedCount?: number;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  status: "active" | "submitted" | "graded";
  activityLog: ActivityEntry[];
  /** GitHub repo URL for this group's submission (real-time; no formal submission). */
  repoLink?: string;
}

/** One granular change/event within a session (expandable detail row). */
export interface SessionDetailEntry {
  timestamp: string; // ISO
  locChanged: number;
  aiUsed: boolean;
  /** For group work: which user made this change. */
  githubUsername?: string;
  /** Line number in the file (1-based). When merged, start of range. */
  lineNumber?: number | null;
  /** When merged consecutive lines: end of range (e.g. 2 and 4 → "2–4"). */
  lineNumberEnd?: number | null;
  /** File path (e.g. src/index.ts). */
  filePath?: string | null;
  /** Full line of code text; expand with + to see. */
  lineContent?: string | null;
}

/** Citation attached to a session (from extension). */
export interface SessionCitation {
  type: "agent prompt" | "external ai prompt" | "external source (manual)";
  githubUsername: string;
  timestamp: string;
  text?: string | null;
}

/** A coding session: date + time range, with expandable detail entries. */
export interface Session {
  id: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  /** Total lines of code changed in this session. */
  locChanged: number;
  /** Whether AI was used at all during this session. */
  aiUsed: boolean;
  /** Granular timeline entries when expanded. */
  details: SessionDetailEntry[];
  /** For group work: which user(s) this session belongs to (can be one or many). */
  githubUsernames?: string[];
  /** Citations for this session (by type: agent prompt, external ai prompt, external source). */
  citations?: SessionCitation[];
}

/** One "section" of progress: either a solo student or a group (identified by repo). */
export interface ProgressSection {
  id: string;           // group id or githubUsername
  label: string;        // group name or display name / username
  /** GitHub repo link if associated. */
  repoLink?: string;
  /** For groups: member usernames. */
  members?: string[];
  sessions: Session[];
}

export interface ActivityEntry {
  timestamp: string;
  githubUsername: string;
  action: string;
}

/** Invited user (assignment or classroom). Populated from Firebase in production. */
export interface InvitedUser {
  id?: string;
  githubUsername: string;
  avatarUrl?: string;
  name?: string;
  invitedAt?: string;
  status?: "pending" | "accepted" | "declined";
}

/** Mock invited users per assignment. Replace with Firebase (e.g. collection assignments/{id}/invited) when backend is ready. */
export const mockInvitedByAssignmentId: Record<string, InvitedUser[]> = {
  a1: [
    {
      id: "inv1",
      githubUsername: "alice-dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      name: "Alice Dev",
      invitedAt: "2026-02-01T10:00:00Z",
    },
    {
      id: "inv2",
      githubUsername: "bob-codes",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      name: "Bob Codes",
      invitedAt: "2026-02-01T11:00:00Z",
    },
  ],
  a2: [
    {
      id: "inv3",
      githubUsername: "charlie-git",
      avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
      name: "Charlie Git",
      invitedAt: "2026-02-02T09:00:00Z",
    },
  ],
};

export const mockClassrooms: Classroom[] = [
  {
    id: "c1",
    name: "CS 301 — Software Engineering",
    description: "Fall 2026 undergraduate software engineering course.",
    students: [
      { githubUsername: "alice-dev" },
      { githubUsername: "bob-codes" },
      { githubUsername: "charlie-git" },
      { githubUsername: "diana-py" },
      { githubUsername: "eve-ml" },
    ],
  },
  {
    id: "c2",
    name: "CS 440 — Distributed Systems",
    description: "Graduate-level distributed systems seminar.",
    students: [
      { githubUsername: "frank-rs" },
      { githubUsername: "grace-go" },
      { githubUsername: "hank-cpp" },
    ],
  },
];

/** Mock progress (sections → sessions → details) per assignment. Key = assignment id. */
export const mockProgressByAssignmentId: Record<string, ProgressSection[]> = {
  a1: [
    {
      id: "g1",
      label: "Group Alpha",
      repoLink: "https://github.com/alice-dev/library-api",
      members: ["alice-dev", "bob-codes", "charlie-git"],
      sessions: [
        {
          id: "s1",
          startTime: "2026-02-01T09:00:00Z",
          endTime: "2026-02-01T11:30:00Z",
          locChanged: 120,
          aiUsed: false,
          githubUsernames: ["alice-dev"],
          details: [
            { timestamp: "2026-02-01T09:15:00Z", locChanged: 45, aiUsed: false, githubUsername: "alice-dev" },
            { timestamp: "2026-02-01T10:00:00Z", locChanged: 52, aiUsed: false, githubUsername: "alice-dev" },
            { timestamp: "2026-02-01T11:00:00Z", locChanged: 23, aiUsed: false, githubUsername: "alice-dev" },
          ],
        },
        {
          id: "s2",
          startTime: "2026-02-01T13:00:00Z",
          endTime: "2026-02-01T15:45:00Z",
          locChanged: 88,
          aiUsed: true,
          githubUsernames: ["bob-codes"],
          details: [
            { timestamp: "2026-02-01T13:30:00Z", locChanged: 30, aiUsed: true, githubUsername: "bob-codes" },
            { timestamp: "2026-02-01T14:45:00Z", locChanged: 58, aiUsed: true, githubUsername: "bob-codes" },
          ],
        },
        {
          id: "s3",
          startTime: "2026-02-02T08:30:00Z",
          endTime: "2026-02-02T10:00:00Z",
          locChanged: 34,
          aiUsed: false,
          githubUsernames: ["charlie-git"],
          details: [
            { timestamp: "2026-02-02T08:45:00Z", locChanged: 20, aiUsed: false, githubUsername: "charlie-git" },
            { timestamp: "2026-02-02T09:30:00Z", locChanged: 14, aiUsed: false, githubUsername: "charlie-git" },
          ],
        },
      ],
    },
    {
      id: "g2",
      label: "Group Beta",
      repoLink: "https://github.com/diana-py/distributed-auth",
      members: ["diana-py", "eve-ml"],
      sessions: [
        {
          id: "s4",
          startTime: "2026-02-01T07:00:00Z",
          endTime: "2026-02-01T09:00:00Z",
          locChanged: 200,
          aiUsed: true,
          githubUsernames: ["diana-py"],
          details: [
            { timestamp: "2026-02-01T07:20:00Z", locChanged: 80, aiUsed: true, githubUsername: "diana-py" },
            { timestamp: "2026-02-01T08:15:00Z", locChanged: 120, aiUsed: true, githubUsername: "diana-py" },
          ],
        },
        {
          id: "s5",
          startTime: "2026-02-02T12:00:00Z",
          endTime: "2026-02-02T14:30:00Z",
          locChanged: 95,
          aiUsed: false,
          githubUsernames: ["eve-ml"],
          details: [
            { timestamp: "2026-02-02T12:30:00Z", locChanged: 50, aiUsed: false, githubUsername: "eve-ml" },
            { timestamp: "2026-02-02T13:45:00Z", locChanged: 45, aiUsed: false, githubUsername: "eve-ml" },
          ],
        },
      ],
    },
  ],
  a2: [
    {
      id: "alice-dev",
      label: "alice-dev",
      repoLink: "https://github.com/alice-dev/sorting-report",
      sessions: [
        {
          id: "s6",
          startTime: "2026-02-06T08:00:00Z",
          endTime: "2026-02-06T10:15:00Z",
          locChanged: 150,
          aiUsed: false,
          details: [
            { timestamp: "2026-02-06T08:20:00Z", locChanged: 60, aiUsed: false },
            { timestamp: "2026-02-06T09:30:00Z", locChanged: 90, aiUsed: false },
          ],
        },
      ],
    },
    {
      id: "bob-codes",
      label: "bob-codes",
      repoLink: "https://github.com/bob-codes/algo-analysis",
      sessions: [
        {
          id: "s7",
          startTime: "2026-02-01T11:00:00Z",
          endTime: "2026-02-01T12:30:00Z",
          locChanged: 80,
          aiUsed: false,
          details: [
            { timestamp: "2026-02-01T11:15:00Z", locChanged: 80, aiUsed: false },
          ],
        },
        {
          id: "s8",
          startTime: "2026-02-04T15:00:00Z",
          endTime: "2026-02-04T16:00:00Z",
          locChanged: 40,
          aiUsed: true,
          details: [
            { timestamp: "2026-02-04T15:20:00Z", locChanged: 25, aiUsed: true },
            { timestamp: "2026-02-04T15:45:00Z", locChanged: 15, aiUsed: false },
          ],
        },
      ],
    },
  ],
  /** Fallback demo data so you can test the Progress UI on any assignment (e.g. newly created). */
  demo: [
    {
      id: "kristiandiana",
      label: "kristiandiana",
      repoLink: "https://github.com/kristiandiana/assignment-demo",
      sessions: [
        {
          id: "demo-k1",
          startTime: "2026-02-05T10:00:00Z",
          endTime: "2026-02-05T12:15:00Z",
          locChanged: 95,
          aiUsed: false,
          details: [
            { timestamp: "2026-02-05T10:20:00Z", locChanged: 40, aiUsed: false, githubUsername: "kristiandiana" },
            { timestamp: "2026-02-05T11:00:00Z", locChanged: 35, aiUsed: false, githubUsername: "kristiandiana" },
            { timestamp: "2026-02-05T11:50:00Z", locChanged: 20, aiUsed: false, githubUsername: "kristiandiana" },
          ],
        },
        {
          id: "demo-k2",
          startTime: "2026-02-06T14:00:00Z",
          endTime: "2026-02-06T15:30:00Z",
          locChanged: 62,
          aiUsed: true,
          details: [
            { timestamp: "2026-02-06T14:15:00Z", locChanged: 30, aiUsed: true, githubUsername: "kristiandiana" },
            { timestamp: "2026-02-06T14:45:00Z", locChanged: 32, aiUsed: false, githubUsername: "kristiandiana" },
          ],
        },
      ],
    },
    {
      id: "iainmac32",
      label: "iainmac32",
      repoLink: "https://github.com/iainmac32/project-demo",
      sessions: [
        {
          id: "demo-i1",
          startTime: "2026-02-05T09:00:00Z",
          endTime: "2026-02-05T11:00:00Z",
          locChanged: 120,
          aiUsed: true,
          details: [
            { timestamp: "2026-02-05T09:30:00Z", locChanged: 55, aiUsed: true, githubUsername: "iainmac32" },
            { timestamp: "2026-02-05T10:15:00Z", locChanged: 65, aiUsed: false, githubUsername: "iainmac32" },
          ],
        },
        {
          id: "demo-i2",
          startTime: "2026-02-07T13:00:00Z",
          endTime: "2026-02-07T14:45:00Z",
          locChanged: 78,
          aiUsed: false,
          details: [
            { timestamp: "2026-02-07T13:20:00Z", locChanged: 40, aiUsed: false, githubUsername: "iainmac32" },
            { timestamp: "2026-02-07T14:00:00Z", locChanged: 38, aiUsed: false, githubUsername: "iainmac32" },
          ],
        },
      ],
    },
    {
      id: "aidenchenderson",
      label: "aidenchenderson",
      repoLink: "https://github.com/aidenchenderson/code-demo",
      sessions: [
        {
          id: "demo-a1",
          startTime: "2026-02-06T08:00:00Z",
          endTime: "2026-02-06T10:30:00Z",
          locChanged: 88,
          aiUsed: true,
          details: [
            { timestamp: "2026-02-06T08:25:00Z", locChanged: 42, aiUsed: true, githubUsername: "aidenchenderson" },
            { timestamp: "2026-02-06T09:40:00Z", locChanged: 46, aiUsed: false, githubUsername: "aidenchenderson" },
          ],
        },
        {
          id: "demo-a2",
          startTime: "2026-02-08T11:00:00Z",
          endTime: "2026-02-08T12:15:00Z",
          locChanged: 54,
          aiUsed: false,
          details: [
            { timestamp: "2026-02-08T11:15:00Z", locChanged: 28, aiUsed: false, githubUsername: "aidenchenderson" },
            { timestamp: "2026-02-08T11:50:00Z", locChanged: 26, aiUsed: false, githubUsername: "aidenchenderson" },
          ],
        },
      ],
    },
  ],
};

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    name: "REST API Design",
    description:
      "Design and implement a RESTful API for a library management system.",
    createdAt: "2026-01-15",
    dueDate: "2026-02-28",
    isGroup: true,
    maxGroupSize: 3,
    groups: [
      {
        id: "g1",
        name: "Group Alpha",
        members: ["alice-dev", "bob-codes", "charlie-git"],
        status: "active",
        repoLink: "https://github.com/alice-dev/library-api",
        activityLog: [
          {
            timestamp: "2026-02-01T10:23:00Z",
            githubUsername: "alice-dev",
            action: "Pushed 3 commits to main",
          },
          {
            timestamp: "2026-02-01T14:05:00Z",
            githubUsername: "bob-codes",
            action: "Opened PR #4 — Add user endpoints",
          },
          {
            timestamp: "2026-02-02T09:12:00Z",
            githubUsername: "charlie-git",
            action: "Modified src/routes/books.py",
          },
          {
            timestamp: "2026-02-03T16:45:00Z",
            githubUsername: "alice-dev",
            action: "Merged PR #4 into main",
          },
          {
            timestamp: "2026-02-04T11:30:00Z",
            githubUsername: "bob-codes",
            action: "Added unit tests for user endpoints",
          },
        ],
      },
      {
        id: "g2",
        name: "Group Beta",
        members: ["diana-py", "eve-ml"],
        status: "submitted",
        repoLink: "https://github.com/diana-py/distributed-auth",
        activityLog: [
          {
            timestamp: "2026-02-01T08:00:00Z",
            githubUsername: "diana-py",
            action: "Initialized project repository",
          },
          {
            timestamp: "2026-02-02T13:20:00Z",
            githubUsername: "eve-ml",
            action: "Pushed 5 commits to feature/auth",
          },
          {
            timestamp: "2026-02-05T10:00:00Z",
            githubUsername: "diana-py",
            action: "Submitted final version",
          },
        ],
      },
    ],
  },
  {
    id: "a2",
    name: "Algorithm Analysis Report",
    description:
      "Individual report analyzing the time complexity of sorting algorithms.",
    createdAt: "2026-01-20",
    dueDate: "2026-03-10",
    isGroup: false,
    groups: [
      {
        id: "g3",
        name: "alice-dev",
        members: ["alice-dev"],
        status: "active",
        activityLog: [
          {
            timestamp: "2026-02-06T09:00:00Z",
            githubUsername: "alice-dev",
            action: "Pushed initial draft to main",
          },
        ],
      },
      {
        id: "g4",
        name: "bob-codes",
        members: ["bob-codes"],
        status: "graded",
        activityLog: [
          {
            timestamp: "2026-02-01T12:00:00Z",
            githubUsername: "bob-codes",
            action: "Pushed report.md",
          },
          {
            timestamp: "2026-02-04T15:30:00Z",
            githubUsername: "bob-codes",
            action: "Updated analysis section",
          },
        ],
      },
    ],
  },
];
