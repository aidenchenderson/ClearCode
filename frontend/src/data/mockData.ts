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
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  status: "active" | "submitted" | "graded";
  activityLog: ActivityEntry[];
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
