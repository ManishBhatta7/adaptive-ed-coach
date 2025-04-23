
import type { SubjectArea } from "./subjects";

// Student performance record
export interface PerformanceRecord {
  id: string;
  date: string;
  subjectArea: SubjectArea;
  title: string;
  score?: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
