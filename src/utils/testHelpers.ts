
import { StudentProfile, PerformanceRecord } from '@/types';
import { 
  generateEdgeCaseStrings, 
  generateInvalidEmails, 
  generateEdgeCasePasswords,
  generateEdgeCasePerformanceRecords,
  generateEdgeCaseStudentProfiles,
  generateEdgeCaseSubmissions,
  generateEdgeCaseFiles
} from './testDataGenerators';

// Test helper functions for validating edge cases
export class TestDataValidator {
  // Validate email edge cases
  static validateEmailEdgeCases() {
    const invalidEmails = generateInvalidEmails();
    const edgeStrings = generateEdgeCaseStrings();
    
    return {
      invalidEmails,
      validEdgeCases: [
        'test@example.com',
        'user.name+tag@example-domain.co.uk',
        'x@x.co'
      ],
      lengthTests: {
        maxLength: 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com',
        tooLong: 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com'
      }
    };
  }

  // Validate password edge cases
  static validatePasswordEdgeCases() {
    const edgePasswords = generateEdgeCasePasswords();
    
    return {
      ...edgePasswords,
      validEdgeCases: [
        'Password1!',
        'ComplexP@ssw0rd123',
        'Min8Ch@r'
      ],
      securityTests: {
        commonPasswords: ['password123', '123456789', 'qwerty123'],
        weakPasswords: ['12345678', 'abcdefgh', 'Password'],
        strongPasswords: ['MyStr0ng!P@ssw0rd', 'C0mpl3x&S3cur3!']
      }
    };
  }

  // Test performance data edge cases
  static validatePerformanceEdgeCases() {
    const edgeRecords = generateEdgeCasePerformanceRecords();
    
    return {
      records: edgeRecords,
      scenarios: {
        perfectScores: edgeRecords.filter(r => r.score === 100),
        zeroScores: edgeRecords.filter(r => r.score === 0),
        noScores: edgeRecords.filter(r => r.score === undefined),
        oldRecords: edgeRecords.filter(r => new Date(r.date) < new Date('2022-01-01')),
        futureRecords: edgeRecords.filter(r => new Date(r.date) > new Date()),
        longContent: edgeRecords.filter(r => r.feedback.length > 500)
      }
    };
  }

  // Test form submission edge cases
  static validateSubmissionEdgeCases() {
    const submissions = generateEdgeCaseSubmissions();
    const files = generateEdgeCaseFiles();
    
    return {
      submissions,
      files,
      validationTests: {
        titleLengths: submissions.map(s => ({ title: s.title, length: s.title.length })),
        contentLengths: submissions.map(s => ({ content: s.content, length: s.content.length })),
        fileTypes: Object.entries(files).map(([name, file]) => ({ name, type: file.type, size: file.size }))
      }
    };
  }

  // Test UI layout with long content
  static generateLayoutStressTests() {
    const edgeStrings = generateEdgeCaseStrings();
    
    return {
      longTexts: {
        veryLongSingleWord: 'supercalifragilisticexpialidocious'.repeat(10),
        longWordWithSpaces: 'word '.repeat(100),
        mixedContent: `${edgeStrings.nonEnglish} ${edgeStrings.specialChars} ${edgeStrings.mixed}`,
        repeatedContent: 'Test content. '.repeat(50),
        numbersAndText: '1234567890 '.repeat(30)
      },
      layoutBreakers: {
        noSpaces: 'Thisisaverylongstringwithoutanyspacesthatcouldpotentiallybreakthelayout',
        allCaps: 'THIS IS ALL CAPS TEXT THAT MIGHT AFFECT LAYOUT',
        specialCharSequence: '!@#$%^&*()_+{}|:"<>?[]\\;\',./',
        unicodeStress: '🌟✨💫🎉🚀🎯🏆📚💡🔥❤️'.repeat(20)
      }
    };
  }

  // Memory and performance stress tests
  static generatePerformanceStressTests() {
    return {
      largeDataSets: {
        manyPerformances: Array.from({ length: 1000 }, (_, i) => ({
          id: `stress-perf-${i}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          subjectArea: 'math' as const,
          title: `Performance ${i}`,
          score: Math.floor(Math.random() * 101),
          feedback: `Feedback ${i}`,
          strengths: [`Strength ${i}`],
          weaknesses: [`Weakness ${i}`],
          recommendations: [`Recommendation ${i}`]
        })),
        manyStudents: Array.from({ length: 500 }, (_, i) => ({
          id: `stress-student-${i}`,
          name: `Student ${i}`,
          email: `student${i}@test.com`,
          performances: [],
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }))
      }
    };
  }
}

// Mock data injection helpers
export class MockDataInjector {
  // Inject edge case data into a student profile
  static injectEdgeCaseData(profile: StudentProfile): StudentProfile {
    const edgePerformances = generateEdgeCasePerformanceRecords();
    
    return {
      ...profile,
      performances: [...profile.performances, ...edgePerformances]
    };
  }

  // Create a profile with specific edge case characteristics
  static createEdgeCaseProfile(type: 'minimal' | 'maximal' | 'special-chars' | 'long-content'): StudentProfile {
    const profiles = generateEdgeCaseStudentProfiles();
    
    switch (type) {
      case 'minimal':
        return profiles.find(p => p.id === 'student-minimal')!;
      case 'maximal':
        return profiles.find(p => p.id === 'student-long-name')!;
      case 'special-chars':
        return profiles.find(p => p.id === 'student-special-chars')!;
      case 'long-content':
        return profiles.find(p => p.id === 'student-long-name')!;
      default:
        return profiles[0];
    }
  }

  // Generate realistic but edge-case form data
  static generateFormTestData() {
    const edgeStrings = generateEdgeCaseStrings();
    
    return {
      validBoundary: {
        title: 'abc', // minimum valid length
        content: 'a'.repeat(10), // minimum valid length
        email: 'a@b.co', // minimum valid email
        password: 'Aa1!' + 'a'.repeat(4) // minimum valid password
      },
      invalidBoundary: {
        title: edgeStrings.tooShort,
        content: edgeStrings.tooShort,
        email: 'invalid-email',
        password: 'weak'
      },
      maxBoundary: {
        title: 'a'.repeat(100), // maximum valid length
        content: 'a'.repeat(5000), // maximum valid length
        email: 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com',
        password: 'Aa1!' + 'a'.repeat(96) // long but valid password
      }
    };
  }
}

// Console logging helpers for debugging edge cases
export class EdgeCaseLogger {
  static logValidationResults(testName: string, results: any) {
    console.group(`Edge Case Test: ${testName}`);
    console.table(results);
    console.groupEnd();
  }

  static logPerformanceMetrics(operation: string, startTime: number) {
    const endTime = performance.now();
    console.log(`${operation} took ${(endTime - startTime).toFixed(2)}ms`);
  }

  static logDataCharacteristics(data: any[], label: string) {
    console.group(`Data Characteristics: ${label}`);
    console.log(`Count: ${data.length}`);
    console.log(`Memory usage (approx): ${JSON.stringify(data).length} bytes`);
    console.groupEnd();
  }
}
