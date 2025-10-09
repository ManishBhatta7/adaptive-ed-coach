import { LearningStyle } from './learningStyles';

export interface LearningPathMetadata {
  grade: string;
  subject: string;
  topic: string;
  lessonNumber: string;
  isPublic: boolean;
  tags: string[];
}

export interface LearningPathStep {
  id: string;
  type: 'video' | 'conversation' | 'game' | 'experiment';
  content: {
    message?: string;
    videoUrl?: string;
    title?: string;
    timestamp?: number;
    interaction?: {
      type: 'choice';
      options: string[];
    };
    gameType?: 'click' | 'drag' | 'match';
    experimentSteps?: string[];
  };
  rewards: {
    points: number;
  };
}

export interface LearningPath extends LearningPathMetadata {
  id: string;
  title: string;
  description: string;
  steps: LearningPathStep[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  learningStyle?: LearningStyle;
  learningStyleFit?: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export type LearningResourceType = 
  | 'video'
  | 'animation'
  | 'simulation'
  | 'audio'
  | 'presentation'
  | 'infographic'
  | 'quiz'
  | 'exercise'
  | 'experiment'
  | 'song'
  | 'game';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  duration: string;
  objectives: string[];
  prerequisites?: string[];
  targetLearningStyle: {
    primary: string;
    secondary: string;
  };
  resources: LearningResource[];
  assessments: {
    preAssessment?: LearningResource;
    formativeAssessments: LearningResource[];
    summativeAssessment: LearningResource;
  };
  adaptivityRules?: {
    ifScoreBelow?: number;
    thenProvide: LearningResource[];
  }[];
}