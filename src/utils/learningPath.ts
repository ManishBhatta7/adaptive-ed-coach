import { LearningStyle } from '../types/learningStyles';

export interface LearningStyleFit {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

export interface LearningResource {
  id: string;
  title: string;
  type: string;
  description: string;
  url?: string;
  difficulty: string;
  duration: number;
  tags: string[];
  style: LearningStyle;
  progress?: number;
  learningStyleFit: LearningStyleFit;
  subtype?: 'pre' | 'formative' | 'summative';
}

export interface LearningPathAssessments {
  preAssessment: LearningResource | undefined;
  formativeAssessments: LearningResource[];
  summativeAssessment: LearningResource | undefined;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  resources: LearningResource[];
  difficulty: string;
  style: LearningStyle;
  totalDuration: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  subject?: string;
  assessments?: LearningPathAssessments;
  adaptivityRules?: string[];
}

export type LearningResourceMap = Record<LearningStyle, LearningResource[]>;

export function calculateTotalDuration(resources: LearningResource[]): number {
  return resources.reduce((total, resource) => total + (resource.duration || 0), 0);
}

export function calculateProgress(resources: LearningResource[]): number {
  if (resources.length === 0) return 0;
  const totalProgress = resources.reduce((sum, resource) => sum + (resource.progress || 0), 0);
  return Math.round((totalProgress / resources.length) * 100);
}