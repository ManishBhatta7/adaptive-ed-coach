export interface OnboardingData {
  userType: string;
  board: string;
  subject: string;
  completedAt: string;
}

export interface UserPreferences extends OnboardingData {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent';
  school?: string; // Optional school name
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}