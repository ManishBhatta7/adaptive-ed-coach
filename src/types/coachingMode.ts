
export enum CoachingMode {
  QUICK_FEEDBACK = "quick_feedback",
  DETAILED_INSIGHT = "detailed_insight",
  PROGRESS_ANALYSIS = "progress_analysis",
  STYLE_SPECIFIC = "style_specific"
}

// Progress analysis configuration types
export interface ProgressAnalysisOptions {
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  compareWithPrevious: boolean;
  groupBySubject: boolean;
  showTrends: boolean;
}

export interface ProgressTrend {
  trendType: 'improving' | 'declining' | 'stable';
  percentageChange: number;
  timeSpan: string;
  subjectArea?: string;
}

