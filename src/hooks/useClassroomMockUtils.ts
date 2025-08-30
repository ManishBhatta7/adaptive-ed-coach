
import { Classroom, Assignment, SubjectArea } from "@/types";

// Generates mock assignments for testing
export const generateMockAssignments = (): Assignment[] => {
  return [
    {
      id: `assignment-${Date.now()}-1`,
      title: 'Weekly Problem Set',
      description: 'Complete the problem set from chapter 5',
      subjectArea: SubjectArea.MATH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
    },
    {
      id: `assignment-${Date.now()}-2`,
      title: 'Research Paper',
      description: 'Write a 5-page paper on a topic of your choice',
      subjectArea: SubjectArea.LITERATURE,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
    }
  ];
};

// Generates mock classrooms for a user (teacher or student)
export const generateMockClassrooms = (userId: string, isTeacher: boolean): Classroom[] => {
  if (isTeacher) {
    return [
      {
        id: 'classroom-1',
        name: 'Mathematics 101',
        description: 'Introduction to basic mathematics concepts',
        teacherId: userId,
        studentIds: ['student-1', 'student-2', 'student-3'],
        assignments: generateMockAssignments(),
        joinCode: 'MAT101',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'classroom-2',
        name: 'Physics for Beginners',
        description: 'Learn the fundamentals of physics',
        teacherId: userId,
        studentIds: ['student-2', 'student-4', 'student-5'],
        assignments: generateMockAssignments(),
        joinCode: 'PHY101',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  } else {
    return [
      {
        id: 'classroom-1',
        name: 'Mathematics 101',
        description: 'Introduction to basic mathematics concepts',
        teacherId: 'teacher-1',
        studentIds: [userId, 'student-2', 'student-3'],
        assignments: generateMockAssignments(),
        joinCode: 'MAT101',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'classroom-3',
        name: 'Biology 201',
        description: 'Advanced biological concepts and theories',
        teacherId: 'teacher-2',
        studentIds: [userId, 'student-6', 'student-7'],
        assignments: generateMockAssignments(),
        joinCode: 'BIO201',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
};
