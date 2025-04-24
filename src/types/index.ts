
// Barrel exports for convenience
export * from "./learningStyles";
export * from "./subjects";
export * from "./questions";
export * from "./performance";
export * from "./assignment";
export * from "./classroom";
export * from "./studentProfile";
export * from "./appState";
export * from "./coachingMode"; // Add this export

// AI Coach modes (not grouped above)
export enum CoachingMode {
  QUICK_FEEDBACK = "quick_feedback",
  DETAILED_INSIGHT = "detailed_insight",
  PROGRESS_ANALYSIS = "progress_analysis",
  STYLE_SPECIFIC = "style_specific"
}
