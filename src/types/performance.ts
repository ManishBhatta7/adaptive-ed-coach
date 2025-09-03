
import type { SubjectArea } from "./subjects";

// Student performance record
export interface PerformanceRecord {
  id: string;
  userId?: string;
  date: string;
  subjectArea?: SubjectArea | string;
  assignmentType?: string;
  title: string;
  score?: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timeSpent?: number;
  accuracy?: number;
  completionRate?: number;
}
