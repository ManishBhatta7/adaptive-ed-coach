
import { 
  StudentProfile, 
  PerformanceRecord, 
  Classroom, 
  Assignment, 
  SubjectArea, 
  LearningStyle, 
  CoachingMode 
} from '@/types';

// Edge case generators for form validation testing
export const generateEdgeCaseStrings = () => ({
  empty: '',
  tooShort: 'ab',
  tooLong: 'a'.repeat(200),
  specialChars: '!@#$%^&*()_+{}|:"<>?[]\\;\',./',
  sqlInjection: "'; DROP TABLE users; --",
  xssAttempt: '<script>alert("xss")</script>',
  unicodeChars: '🌟✨💫🎉🚀',
  onlySpaces: '   ',
  leadingTrailingSpaces: '  valid content  ',
  newlines: 'line1\nline2\rline3\r\n',
  tabs: 'content\twith\ttabs',
  nullBytes: 'content\0with\0nulls',
  nonEnglish: 'مرحبا 你好 привет ñoño çağ',
  numbers: '12345',
  mixed: 'Test123!@# 你好'
});

// Generate invalid email formats
export const generateInvalidEmails = () => [
  'plainaddress',
  '@missingdomain.com',
  'missing@.com',
  'missing@domain',
  'spaces @domain.com',
  'multiple@@domain.com',
  'toolong' + 'a'.repeat(250) + '@domain.com',
  'special!#$%&@domain.com',
  '',
  '   ',
  'user@',
  '@domain.com'
];

// Generate edge case passwords
export const generateEdgeCasePasswords = () => ({
  tooShort: '1aA!',
  noUppercase: 'password123!',
  noLowercase: 'PASSWORD123!',
  noNumbers: 'Password!',
  noSpecialChars: 'Password123',
  onlySpaces: '        ',
  empty: '',
  tooLong: 'A1a!' + 'a'.repeat(200),
  allSameChar: 'AAAAAAAA',
  commonPassword: 'password123'
});

// Generate edge case performance records
export const generateEdgeCasePerformanceRecords = (): PerformanceRecord[] => {
  const baseDate = new Date();
  
  return [
    // Perfect score
    {
      id: 'perf-perfect',
      date: new Date(baseDate.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      subjectArea: SubjectArea.MATH,
      title: 'Perfect Math Test',
      score: 100,
      feedback: 'Absolutely perfect work!',
      strengths: ['Everything'],
      weaknesses: [],
      recommendations: ['Keep up the excellent work']
    },
    
    // Zero score
    {
      id: 'perf-zero',
      date: new Date(baseDate.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      subjectArea: SubjectArea.SCIENCE,
      title: 'Failed Science Quiz',
      score: 0,
      feedback: 'This needs significant improvement.',
      strengths: [],
      weaknesses: ['Understanding of basic concepts', 'Problem solving'],
      recommendations: ['Review fundamentals', 'Seek additional help']
    },
    
    // No score (undefined)
    {
      id: 'perf-no-score',
      date: new Date(baseDate.getTime() - 1000 * 60 * 60 * 72).toISOString(),
      subjectArea: SubjectArea.LITERATURE,
      title: 'Ungraded Essay',
      feedback: 'Good effort, still being reviewed.',
      strengths: ['Creative thinking'],
      weaknesses: ['Grammar'],
      recommendations: ['Proofread more carefully']
    },
    
    // Very long content
    {
      id: 'perf-long-content',
      date: new Date(baseDate.getTime() - 1000 * 60 * 60 * 96).toISOString(),
      subjectArea: SubjectArea.HISTORY,
      title: 'Very Long Assignment Title That Exceeds Normal Length Expectations and Should Test UI Wrapping',
      score: 85,
      feedback: 'This is an extremely long feedback message that would test how the UI handles very lengthy text content. '.repeat(10),
      strengths: Array(10).fill('A very long strength description that tests UI handling'),
      weaknesses: Array(8).fill('A very long weakness description that tests UI handling'),
      recommendations: Array(12).fill('A very long recommendation that tests UI handling')
    },
    
    // Edge case dates
    {
      id: 'perf-old-date',
      date: new Date('2020-01-01').toISOString(),
      subjectArea: SubjectArea.ART,
      title: 'Very Old Assignment',
      score: 75,
      feedback: 'This is from a long time ago.',
      strengths: ['Historical perspective'],
      weaknesses: ['Outdated techniques'],
      recommendations: ['Learn modern approaches']
    },
    
    // Future date (edge case)
    {
      id: 'perf-future-date',
      date: new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      subjectArea: SubjectArea.COMPUTER_SCIENCE,
      title: 'Future Assignment',
      score: 90,
      feedback: 'This assignment is from the future!',
      strengths: ['Time travel'],
      weaknesses: ['Temporal paradox'],
      recommendations: ['Check your calendar']
    }
  ];
};

// Generate edge case student profiles
export const generateEdgeCaseStudentProfiles = (): StudentProfile[] => {
  return [
    // Minimal profile
    {
      id: 'student-minimal',
      name: 'A',
      performances: [],
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    },
    
    // Profile with very long name
    {
      id: 'student-long-name',
      name: 'Christopher Alexander Montgomery Fitzgerald-Wellington III Esq.',
      email: 'verylongemailaddress.that.tests.ui.handling@extremelylongdomainname.organization',
      avatar: '/placeholder.svg',
      primaryLearningStyle: LearningStyle.VISUAL,
      secondaryLearningStyle: LearningStyle.AUDITORY,
      learningStyleStrengths: {
        [LearningStyle.VISUAL]: 100,
        [LearningStyle.AUDITORY]: 90,
        [LearningStyle.READING_WRITING]: 80,
        [LearningStyle.KINESTHETIC]: 70,
        [LearningStyle.LOGICAL]: 60,
        [LearningStyle.SOCIAL]: 50,
        [LearningStyle.SOLITARY]: 40
      },
      performances: generateEdgeCasePerformanceRecords(),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    },
    
    // Profile with special characters
    {
      id: 'student-special-chars',
      name: 'José María Ñoño-Çağlar 李明',
      email: 'josé.maría@ñoño-çağlar.com',
      primaryLearningStyle: LearningStyle.KINESTHETIC,
      performances: [],
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    },
    
    // Profile with extreme learning style distribution
    {
      id: 'student-extreme-styles',
      name: 'Extreme Learner',
      email: 'extreme@example.com',
      primaryLearningStyle: LearningStyle.LOGICAL,
      secondaryLearningStyle: LearningStyle.SOLITARY,
      learningStyleStrengths: {
        [LearningStyle.VISUAL]: 0,
        [LearningStyle.AUDITORY]: 5,
        [LearningStyle.READING_WRITING]: 10,
        [LearningStyle.KINESTHETIC]: 15,
        [LearningStyle.LOGICAL]: 100,
        [LearningStyle.SOCIAL]: 2,
        [LearningStyle.SOLITARY]: 95
      },
      performances: [],
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }
  ];
};

// Generate edge case assignments
export const generateEdgeCaseAssignments = (): Assignment[] => {
  const now = new Date();
  
  return [
    // Assignment due in the past
    {
      id: 'assignment-overdue',
      title: 'Overdue Assignment',
      description: 'This assignment was due yesterday',
      subjectArea: SubjectArea.MATH,
      dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      maxScore: 100
    },
    
    // Assignment due very far in the future
    {
      id: 'assignment-far-future',
      title: 'Far Future Assignment',
      description: 'This assignment is due in 10 years',
      subjectArea: SubjectArea.SCIENCE,
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(),
      createdAt: now.toISOString(),
      maxScore: 200
    },
    
    // Assignment with very long title and description
    {
      id: 'assignment-long-content',
      title: 'This is an Extremely Long Assignment Title That Should Test How the UI Handles Very Long Text Content and Whether It Wraps Properly or Causes Layout Issues',
      description: 'This is an extremely long description that should test how the UI handles very lengthy text content. '.repeat(20),
      subjectArea: SubjectArea.LITERATURE,
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      createdAt: now.toISOString(),
      maxScore: 150,
      attachments: ['file1.pdf', 'file2.doc', 'file3.jpg', 'file4.png', 'file5.txt']
    },
    
    // Assignment with zero max score
    {
      id: 'assignment-zero-score',
      title: 'No Points Assignment',
      description: 'This assignment has no points',
      subjectArea: SubjectArea.ART,
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      createdAt: now.toISOString(),
      maxScore: 0
    },
    
    // Assignment with special characters
    {
      id: 'assignment-special-chars',
      title: 'Matemáticas Avançadas: Análisis de Funcções 函数分析',
      description: 'Étude des fonctions mathématiques avec caractères spéciaux: ñ, ç, ü, é, à, 中文',
      subjectArea: SubjectArea.MATH,
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      createdAt: now.toISOString(),
      maxScore: 100
    }
  ];
};

// Generate edge case classrooms
export const generateEdgeCaseClassrooms = (): Classroom[] => {
  return [
    // Classroom with no students
    {
      id: 'classroom-empty',
      name: 'Empty Classroom',
      description: 'A classroom with no students',
      teacherId: 'teacher-1',
      studentIds: [],
      assignments: [],
      joinCode: 'EMPTY1',
      createdAt: new Date().toISOString()
    },
    
    // Classroom with many students
    {
      id: 'classroom-crowded',
      name: 'Overcrowded Classroom',
      description: 'A classroom with too many students',
      teacherId: 'teacher-1',
      studentIds: Array.from({ length: 100 }, (_, i) => `student-${i + 1}`),
      assignments: generateEdgeCaseAssignments(),
      joinCode: 'CROWD1',
      createdAt: new Date().toISOString()
    },
    
    // Classroom with very long name and description
    {
      id: 'classroom-long-content',
      name: 'Advanced Quantum Mechanics and Theoretical Physics for Undergraduate Students in the Modern Era',
      description: 'This is an extremely long classroom description that should test how the UI handles very lengthy text content. '.repeat(15),
      teacherId: 'teacher-1',
      studentIds: ['student-1', 'student-2'],
      assignments: [],
      joinCode: 'LONG12',
      createdAt: new Date().toISOString()
    },
    
    // Classroom with special characters
    {
      id: 'classroom-special-chars',
      name: 'Español & Français 中文课堂',
      description: 'Aula para estudiantes de múltiples idiomas: español, français, 中文, العربية',
      teacherId: 'teacher-1',
      studentIds: ['student-1'],
      assignments: [],
      joinCode: 'INTL01',
      createdAt: new Date().toISOString()
    }
  ];
};

// Generate edge case form submission data
export const generateEdgeCaseSubmissions = () => {
  const edgeCases = generateEdgeCaseStrings();
  
  return [
    // Minimum valid submission
    {
      title: 'abc',
      content: 'abcdefghij',
      subjectArea: SubjectArea.MATH,
      coachingMode: CoachingMode.QUICK_FEEDBACK
    },
    
    // Maximum length submission
    {
      title: 'a'.repeat(100),
      content: 'a'.repeat(5000),
      subjectArea: SubjectArea.LITERATURE,
      coachingMode: CoachingMode.DETAILED_INSIGHT
    },
    
    // Submission with special characters
    {
      title: edgeCases.nonEnglish,
      content: edgeCases.nonEnglish + ' ' + edgeCases.specialChars,
      subjectArea: SubjectArea.LANGUAGE,
      coachingMode: CoachingMode.STYLE_SPECIFIC
    },
    
    // Invalid submissions for testing validation
    {
      title: edgeCases.empty,
      content: edgeCases.tooShort,
      subjectArea: SubjectArea.OTHER,
      coachingMode: CoachingMode.PROGRESS_ANALYSIS
    },
    
    {
      title: edgeCases.tooLong,
      content: edgeCases.tooLong,
      subjectArea: SubjectArea.SCIENCE,
      coachingMode: CoachingMode.QUICK_FEEDBACK
    }
  ];
};

// File upload edge cases
export const generateEdgeCaseFiles = () => ({
  // Create mock file objects for testing
  validPdf: new File(['pdf content'], 'document.pdf', { type: 'application/pdf' }),
  validImage: new File(['image content'], 'image.jpg', { type: 'image/jpeg' }),
  oversizedFile: new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' }), // 11MB
  invalidType: new File(['text content'], 'document.txt', { type: 'text/plain' }),
  noExtension: new File(['content'], 'noextension', { type: 'application/pdf' }),
  specialCharsName: new File(['content'], 'file with spaces & símbolos.pdf', { type: 'application/pdf' }),
  veryLongName: new File(['content'], 'a'.repeat(200) + '.pdf', { type: 'application/pdf' }),
  emptyFile: new File([], 'empty.pdf', { type: 'application/pdf' })
});

// Random data generator with seed for reproducible tests
export const createSeededRandomGenerator = (seed: number = 12345) => {
  let current = seed;
  
  const random = () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
  
  const randomInt = (min: number, max: number) => {
    return Math.floor(random() * (max - min + 1)) + min;
  };
  
  const randomChoice = <T>(array: T[]): T => {
    return array[randomInt(0, array.length - 1)];
  };
  
  const randomString = (length: number, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    return Array.from({ length }, () => randomChoice([...chars])).join('');
  };
  
  return { random, randomInt, randomChoice, randomString };
};

// Generate bulk test data
export const generateBulkTestData = (count: number = 50, seed?: number) => {
  const rng = createSeededRandomGenerator(seed);
  const subjects = Object.values(SubjectArea);
  const learningStyles = Object.values(LearningStyle);
  
  return Array.from({ length: count }, (_, i) => ({
    id: `bulk-student-${i}`,
    name: `Test Student ${i + 1}`,
    email: `teststudent${i + 1}@example.com`,
    primaryLearningStyle: rng.randomChoice(learningStyles),
    secondaryLearningStyle: rng.randomChoice(learningStyles),
    performances: Array.from({ length: rng.randomInt(0, 20) }, (_, j) => ({
      id: `bulk-perf-${i}-${j}`,
      date: new Date(Date.now() - rng.randomInt(0, 365) * 24 * 60 * 60 * 1000).toISOString(),
      subjectArea: rng.randomChoice(subjects),
      title: `Assignment ${j + 1}`,
      score: rng.randomInt(0, 100),
      feedback: `Feedback for assignment ${j + 1}`,
      strengths: [`Strength ${j + 1}`],
      weaknesses: [`Weakness ${j + 1}`],
      recommendations: [`Recommendation ${j + 1}`]
    })),
    joinedAt: new Date(Date.now() - rng.randomInt(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - rng.randomInt(0, 7) * 24 * 60 * 60 * 1000).toISOString()
  }));
};
