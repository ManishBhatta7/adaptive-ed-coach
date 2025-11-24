// src/hooks/useTestDataMode.ts
import { useState } from 'react';
import { StudentProfile } from '@/types';

export interface TestDataMode {
  enabled: boolean;
  scenario: 'off';
  studentProfile?: StudentProfile;
}

export const useTestDataMode = () => {
  // Permanently set to disabled
  const [testMode] = useState<TestDataMode>({
    enabled: false,
    scenario: 'off'
  });

  // Simplified functions that do nothing
  const enableTestMode = () => console.log('Test mode is disabled in production');
  const disableTestMode = () => {};
  const generateTestSubmission = () => ({});
  const logTestState = () => console.log('Test mode disabled');

  return {
    testMode,
    enableTestMode,
    disableTestMode,
    generateTestSubmission,
    logTestState
  };
};