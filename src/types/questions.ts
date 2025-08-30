
// Quiz question types
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  RATING = "rating",
  OPEN_ENDED = "open_ended"
}

// Quiz question interface
import type { LearningStyle } from "./learningStyles";

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  learningStyleMapping?: Record<string, LearningStyle>;
}
