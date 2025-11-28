import { LearningStyle } from "./index";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  school?: string;
  grade?: string;
  
  // Student Fields
  primaryLearningStyle?: LearningStyle;
  secondaryLearningStyle?: LearningStyle;
  learningStyleStrengths?: Record<LearningStyle, number>;
  hardestSubject?: string;
  preferredCoachingMode?: 'Encouraging' | 'Analytical' | 'Creative' | 'Structured';
  
  // === NEW: TEACHER FIELDS ===
  teachingSubjects?: string[];
  gradingStyle?: 'Strict' | 'Lenient' | 'Balanced' | 'Growth-Oriented';
  classroomGoals?: string; // e.g. "Prepare for SATs"
  
  // Gamification
  currentStreak?: number;
  totalXP?: number;
  level?: number;
  
  createdAt?: string;
  lastActive?: string;
  
  performances?: any[];
}