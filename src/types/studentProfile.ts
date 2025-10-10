
import type { LearningStyle } from "./learningStyles";
import type { PerformanceRecord } from "./performance";

// Student profile
export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  primaryLearningStyle?: LearningStyle;
  secondaryLearningStyle?: LearningStyle;
  learningStyleStrengths?: Record<LearningStyle, number>;
  performances: PerformanceRecord[];
  joinedAt: string;
  lastActive: string;
  preferences?: {
    userType: string;
    board: string;
    subject: string;
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
  };
}
