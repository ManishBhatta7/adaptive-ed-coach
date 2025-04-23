
import type { LearningStyle } from "./learningStyles";
import type { PerformanceRecord } from "./performance";

// Student profile
export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  primaryLearningStyle?: LearningStyle;
  secondaryLearningStyle?: LearningStyle;
  learningStyleStrengths?: Record<LearningStyle, number>;
  performances: PerformanceRecord[];
  joinedAt: string;
  lastActive: string;
}
