
import type { SubjectArea } from "./subjects";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectArea: SubjectArea;
  assignmentType: string;
  dueDate: string;
  createdAt: string;
  teacherId: string;
  totalPoints: number;
  isActive: boolean;
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
