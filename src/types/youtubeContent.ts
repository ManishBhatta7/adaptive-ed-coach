export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  isShort?: boolean;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
  videos: YouTubeVideo[];
}

export interface ContentMetadata {
  title: string;
  description: string;
  subject_area: string;
  grade_level: string;
  difficulty_level: string;
  learning_objectives: string[];
  keywords: string[];
  video_url: string;
  transcript?: string;
  ai_summary?: string;
  ai_key_points?: string[];
  ai_quiz_questions?: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }[];
}