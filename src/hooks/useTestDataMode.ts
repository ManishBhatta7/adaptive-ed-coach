
import { useState, useEffect } from 'react';
import { StudentProfile, SubjectArea } from '@/types';
import { 
  generateEdgeCaseStudentProfiles, 
  generateBulkTestData,
  createSeededRandomGenerator 
} from '@/utils/testDataGenerators';
import { MockDataInjector } from '@/utils/testHelpers';

export interface TestDataMode {
  enabled: boolean;
  scenario: 'edge-cases' | 'bulk-data' | 'stress-test' | 'minimal' | 'off';
  studentProfile?: StudentProfile;
}

export const useTestDataMode = () => {
  const [testMode, setTestMode] = useState<TestDataMode>({
    enabled: false,
    scenario: 'off'
  });

  // Check for test mode from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testParam = urlParams.get('test-mode');
    const localTestMode = localStorage.getItem('test-data-mode');
    
    if (testParam || localTestMode) {
      const scenario = (testParam || localTestMode) as TestDataMode['scenario'];
      enableTestMode(scenario);
    }
  }, []);

  const enableTestMode = (scenario: TestDataMode['scenario']) => {
    let profile: StudentProfile | undefined;

    switch (scenario) {
      case 'edge-cases':
        profile = MockDataInjector.createEdgeCaseProfile('maximal');
        break;
      case 'minimal':
        profile = MockDataInjector.createEdgeCaseProfile('minimal');
        break;
      case 'bulk-data':
        profile = generateBulkTestData(1, 12345)[0] as StudentProfile;
        break;
      case 'stress-test':
        profile = generateBulkTestData(1, 54321)[0] as StudentProfile;
        // Add many performances for stress testing
        const rng = createSeededRandomGenerator(54321);
        profile.performances = Array.from({ length: 100 }, (_, i) => ({
          id: `stress-${i}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          subjectArea: SubjectArea.MATH,
          title: `Stress Test Performance ${i}`,
          score: rng.randomInt(0, 100),
          feedback: 'Generated for stress testing. '.repeat(10),
          strengths: Array.from({ length: 5 }, (_, j) => `Strength ${j}`),
          weaknesses: Array.from({ length: 3 }, (_, j) => `Weakness ${j}`),
          recommendations: Array.from({ length: 4 }, (_, j) => `Recommendation ${j}`)
        }));
        break;
      default:
        profile = undefined;
    }

    setTestMode({
      enabled: scenario !== 'off',
      scenario,
      studentProfile: profile
    });

    // Persist to localStorage
    if (scenario !== 'off') {
      localStorage.setItem('test-data-mode', scenario);
      console.log(`Test data mode enabled: ${scenario}`);
    } else {
      localStorage.removeItem('test-data-mode');
      console.log('Test data mode disabled');
    }
  };

  const disableTestMode = () => {
    enableTestMode('off');
  };

  const generateTestSubmission = () => {
    const rng = createSeededRandomGenerator();
    
    return {
      title: testMode.scenario === 'minimal' 
        ? 'Min Title' 
        : `Test Submission ${rng.randomInt(1, 1000)}`,
      content: testMode.scenario === 'minimal'
        ? 'Minimum content for testing.'
        : 'This is a test submission generated for edge case testing. '.repeat(
            testMode.scenario === 'stress-test' ? 50 : 5
          ),
      subjectArea: SubjectArea.MATH,
      coachingMode: 'quick_feedback' as const
    };
  };

  // Helper to log current test state
  const logTestState = () => {
    console.group('Test Data Mode Status');
    console.log('Enabled:', testMode.enabled);
    console.log('Scenario:', testMode.scenario);
    if (testMode.studentProfile) {
      console.log('Profile ID:', testMode.studentProfile.id);
      console.log('Performance count:', testMode.studentProfile.performances.length);
    }
    console.groupEnd();
  };

  return {
    testMode,
    enableTestMode,
    disableTestMode,
    generateTestSubmission,
    logTestState
  };
};
