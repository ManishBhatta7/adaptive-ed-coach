
import type { SubjectArea } from "./subjects";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectArea: SubjectArea;
  dueDate: string;
  createdAt: string;
  attachments?: string[];
  maxScore?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  submittedAt: string;
  feedback?: string;
  score?: number;
}
