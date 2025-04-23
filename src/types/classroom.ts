
import type { Assignment } from "./assignment";

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  assignments: Assignment[];
  joinCode: string;
  createdAt: string;
}
