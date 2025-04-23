
import type { StudentProfile } from "./studentProfile";
import type { Classroom } from "./classroom";

// App context state
export interface AppState {
  currentUser: StudentProfile | undefined;
  classrooms: Classroom[];
  isAuthenticated: boolean;
  isTeacher: boolean;
  isLoading: boolean;
}
