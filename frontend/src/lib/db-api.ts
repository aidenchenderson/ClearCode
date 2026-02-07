/**
 * DB operations via Flask backend (Firestore). All requests require Bearer token.
 */
const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  "http://localhost:5000";
const API_PREFIX = "/api/v1";

import type { Classroom, Assignment, InvitedUser } from "@/data/mockData";

function headers(
  token: string | null | undefined,
  method: "GET" | "POST" | "PATCH" = "GET",
): HeadersInit {
  const h: HeadersInit = {};
  if (method !== "GET") h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  token: string | null | undefined,
  body?: object,
): Promise<T> {
  const url = `${API_BASE}${API_PREFIX}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: headers(token, method),
      ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    const msg =
      err instanceof TypeError && err.message === "Failed to fetch"
        ? `Cannot reach the API at ${url}. Is the server running?`
        : err instanceof Error
          ? err.message
          : "Network error";
    throw new Error(msg);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (data?.error as string) || `Request failed (${res.status})`,
    );
  return data as T;
}

export async function fetchClassrooms(
  token: string | null | undefined,
): Promise<Classroom[]> {
  if (!token) return [];
  return request<Classroom[]>("GET", "/classrooms", token);
}

export async function fetchClassroom(
  token: string | null | undefined,
  id: string,
): Promise<Classroom | null> {
  if (!token) return null;
  try {
    return await request<Classroom>("GET", `/classrooms/${id}`, token);
  } catch {
    return null;
  }
}

export async function createClassroom(
  token: string | null | undefined,
  data: Omit<Classroom, "id">,
): Promise<Classroom> {
  if (!token) throw new Error("Sign in required");
  return request<Classroom>("POST", "/classrooms", token, {
    name: data.name,
    description: data.description,
    students: data.students ?? [],
  });
}

export async function updateClassroom(
  token: string | null | undefined,
  id: string,
  data: Partial<Pick<Classroom, "name" | "description" | "students">>,
): Promise<Classroom> {
  if (!token) throw new Error("Sign in required");
  return request<Classroom>("PATCH", `/classrooms/${id}`, token, data);
}

export async function fetchAssignments(
  token: string | null | undefined,
): Promise<Assignment[]> {
  if (!token) return [];
  return request<Assignment[]>("GET", "/assignments", token);
}

export async function fetchAssignment(
  token: string | null | undefined,
  id: string,
): Promise<Assignment | null> {
  if (!token) return null;
  try {
    return await request<Assignment>("GET", `/assignments/${id}`, token);
  } catch {
    return null;
  }
}

export async function createAssignment(
  token: string | null | undefined,
  data: Omit<Assignment, "id">,
): Promise<Assignment> {
  if (!token) throw new Error("Sign in required");
  return request<Assignment>("POST", "/assignments", token, {
    name: data.name,
    description: data.description,
    createdAt: data.createdAt,
    dueDate: data.dueDate,
    isGroup: data.isGroup,
    maxGroupSize: data.maxGroupSize ?? undefined,
    groups: data.groups ?? [],
  });
}

export async function updateAssignment(
  token: string | null | undefined,
  id: string,
  data: Partial<
    Pick<Assignment, "name" | "description" | "dueDate" | "groups">
  >,
): Promise<void> {
  if (!token) throw new Error("Sign in required");
  await request("PATCH", `/assignments/${id}`, token, data);
}

export async function fetchInvitedStudents(
  token: string | null | undefined,
  assignmentId: string,
): Promise<InvitedUser[]> {
  if (!token) return [];
  try {
    return await request<InvitedUser[]>(
      "GET",
      `/assignments/${assignmentId}/invited`,
      token,
    );
  } catch {
    return [];
  }
}

export async function inviteStudent(
  token: string | null | undefined,
  assignmentId: string,
  data: { githubUsername: string; avatarUrl?: string; name?: string },
): Promise<InvitedUser> {
  if (!token) throw new Error("Sign in required");
  return request<InvitedUser>(
    "POST",
    `/assignments/${assignmentId}/invite`,
    token,
    data,
  );
}

export async function fetchAssignmentsForUser(
  githubUsername: string,
): Promise<Assignment[]> {
  try {
    return await request<Assignment[]>(
      "GET",
      `/assignments/user/${githubUsername}`,
      undefined,
    );
  } catch {
    return [];
  }
}

export async function deleteAssignment(
  token: string | null | undefined,
  assignmentId: string,
): Promise<void> {
  if (!token) throw new Error("Sign in required");
  await request("DELETE", `/assignments/${assignmentId}`, token);
}

export async function deleteInvite(
  token: string | null | undefined,
  assignmentId: string,
  inviteId: string,
): Promise<void> {
  if (!token) throw new Error("Sign in required");
  await request(
    "DELETE",
    `/assignments/${assignmentId}/invite/${inviteId}`,
    token,
  );
}

export async function deleteClassroom(
  token: string | null | undefined,
  classroomId: string,
): Promise<void> {
  if (!token) throw new Error("Sign in required");
  await request("DELETE", `/classrooms/${classroomId}`, token);
}
