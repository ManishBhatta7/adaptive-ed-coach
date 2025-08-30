
export enum LearningStyle {
  VISUAL = "visual",
  AUDITORY = "auditory",
  READING_WRITING = "reading_writing",
  KINESTHETIC = "kinesthetic",
  LOGICAL = "logical",
  SOCIAL = "social",
  SOLITARY = "solitary"
}

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
}
