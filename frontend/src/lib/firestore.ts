/**
 * DB operations go through the Flask backend (Firestore). Re-exports from db-api.
 * All functions require a Firebase ID token (from getAccessToken()); no more direct Firestore.
 */
export {
  fetchClassrooms,
  fetchClassroom,
  createClassroom,
  updateClassroom,
  fetchAssignments,
  fetchAssignment,
  createAssignment,
  updateAssignment,
} from "@/lib/db-api";
