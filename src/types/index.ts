// Learning style types
export enum LearningStyle {
  VISUAL = "visual",
  AUDITORY = "auditory",
  READING_WRITING = "reading_writing",
  KINESTHETIC = "kinesthetic",
  LOGICAL = "logical",
  SOCIAL = "social",
  SOLITARY = "solitary"
}

// Learning style descriptions and recommendations
export const learningStyleInfo = {
  [LearningStyle.VISUAL]: {
    title: "Visual Learner",
    description: "You learn best through images, colors, and spatial organization.",
    recommendations: [
      "Use charts, diagrams, and illustrations",
      "Color-code your notes",
      "Create mind maps for complex topics",
      "Watch educational videos and demonstrations"
    ],
    icon: "eye"
  },
  [LearningStyle.AUDITORY]: {
    title: "Auditory Learner",
    description: "You learn best through listening and speaking.",
    recommendations: [
      "Record lectures and listen to them again",
      "Discuss topics with others",
      "Read content aloud to yourself",
      "Use mnemonic devices and rhythmic patterns"
    ],
    icon: "ear"
  },
  [LearningStyle.READING_WRITING]: {
    title: "Reading/Writing Learner",
    description: "You learn best through words, reading, and writing.",
    recommendations: [
      "Take detailed notes",
      "Rewrite key concepts in your own words",
      "Create lists and outlines",
      "Use textbooks and written materials"
    ],
    icon: "file-text"
  },
  [LearningStyle.KINESTHETIC]: {
    title: "Kinesthetic Learner",
    description: "You learn best through hands-on activities and physical movement.",
    recommendations: [
      "Participate in role-playing exercises",
      "Use physical objects and models",
      "Take frequent breaks to move around",
      "Apply concepts to real-world situations"
    ],
    icon: "activity"
  },
  [LearningStyle.LOGICAL]: {
    title: "Logical Learner",
    description: "You learn best through reasoning, systems, and patterns.",
    recommendations: [
      "Look for patterns and relationships",
      "Break complex processes into steps",
      "Create flowcharts and decision trees",
      "Use categorization and classification"
    ],
    icon: "brain"
  },
  [LearningStyle.SOCIAL]: {
    title: "Social Learner",
    description: "You learn best in groups and by interacting with others.",
    recommendations: [
      "Form or join study groups",
      "Teach concepts to others",
      "Engage in group discussions",
      "Collaborate on projects"
    ],
    icon: "users"
  },
  [LearningStyle.SOLITARY]: {
    title: "Solitary Learner",
    description: "You learn best through self-study and working alone.",
    recommendations: [
      "Create a quiet, distraction-free study space",
      "Set personal goals and deadlines",
      "Keep a learning journal",
      "Use self-paced learning resources"
    ],
    icon: "user"
  }
};

// Subject areas for tracking
export enum SubjectArea {
  MATH = "math",
  SCIENCE = "science",
  LITERATURE = "literature",
  HISTORY = "history",
  LANGUAGE = "language",
  ART = "art",
  MUSIC = "music",
  COMPUTER_SCIENCE = "computer_science",
  PHYSICAL_EDUCATION = "physical_education",
  OTHER = "other"
}

// Quiz question types
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  RATING = "rating",
  OPEN_ENDED = "open_ended"
}

// Quiz question interface
export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  learningStyleMapping?: Record<string, LearningStyle>;
}

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

// Assignment/submission types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectArea: SubjectArea;
  dueDate: string;
  createdAt: string;
  attachments?: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  submittedAt: string;
  feedback?: string;
  score?: number;
}

// Classroom types
export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  assignments: Assignment[];
  joinCode: string;
  createdAt: string;
}

// AI Coach modes
export enum CoachingMode {
  QUICK_FEEDBACK = "quick_feedback",
  DETAILED_INSIGHT = "detailed_insight",
  PROGRESS_ANALYSIS = "progress_analysis",
  STYLE_SPECIFIC = "style_specific"
}

// App context state
export interface AppState {
  currentUser?: StudentProfile;
  classrooms: Classroom[];
  isAuthenticated: boolean;
  isTeacher: boolean;
  isLoading: boolean;
}
