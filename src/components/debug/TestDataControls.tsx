
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTestDataMode } from '@/hooks/useTestDataMode';
import { TestDataValidator, MockDataInjector, EdgeCaseLogger } from '@/utils/testHelpers';
import { Bug, Database, Zap, TestTube, RotateCcw } from 'lucide-react';

const TestDataControls = () => {
  const { testMode, enableTestMode, disableTestMode, generateTestSubmission, logTestState } = useTestDataMode();
  const [selectedScenario, setSelectedScenario] = useState<string>('edge-cases');

  const handleEnableTestMode = () => {
    enableTestMode(selectedScenario as any);
  };

  const runValidationTests = () => {
    console.clear();
    console.log('🧪 Running Edge Case Validation Tests...');
    
    const emailTests = TestDataValidator.validateEmailEdgeCases();
    EdgeCaseLogger.logValidationResults('Email Validation', emailTests);
    
    const passwordTests = TestDataValidator.validatePasswordEdgeCases();
    EdgeCaseLogger.logValidationResults('Password Validation', passwordTests);
    
    const performanceTests = TestDataValidator.validatePerformanceEdgeCases();
    EdgeCaseLogger.logValidationResults('Performance Data', performanceTests);
    
    const submissionTests = TestDataValidator.validateSubmissionEdgeCases();
    EdgeCaseLogger.logValidationResults('Form Submissions', submissionTests);
    
    console.log('✅ All validation tests completed. Check console for results.');
  };

  const generateStressTest = () => {
    console.time('Stress Test Generation');
    const stressData = TestDataValidator.generatePerformanceStressTests();
    EdgeCaseLogger.logDataCharacteristics(stressData.largeDataSets.manyPerformances, 'Performance Records');
    EdgeCaseLogger.logDataCharacteristics(stressData.largeDataSets.manyStudents, 'Student Records');
    console.timeEnd('Stress Test Generation');
  };

  const testLayoutBreakers = () => {
    const layoutTests = TestDataValidator.generateLayoutStressTests();
    console.group('🎨 Layout Stress Tests');
    Object.entries(layoutTests.longTexts).forEach(([key, value]) => {
      console.log(`${key}: ${value.slice(0, 50)}... (${value.length} chars)`);
    });
    Object.entries(layoutTests.layoutBreakers).forEach(([key, value]) => {
      console.log(`${key}: ${value.slice(0, 50)}... (${value.length} chars)`);
    });
    console.groupEnd();
  };

  const scenarios = [
    { value: 'edge-cases', label: 'Edge Cases', description: 'Long names, special characters, extreme values' },
    { value: 'minimal', label: 'Minimal Data', description: 'Bare minimum required data' },
    { value: 'bulk-data', label: 'Bulk Data', description: 'Large datasets for performance testing' },
    { value: 'stress-test', label: 'Stress Test', description: 'Maximum data load testing' }
  ];

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Data Controls
          {testMode.enabled && (
            <Badge variant="secondary" className="bg-orange-100">
              {testMode.scenario}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Generate edge case data and run validation tests for development and debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!testMode.enabled ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Scenario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      <div>
                        <div className="font-medium">{scenario.label}</div>
                        <div className="text-xs text-gray-500">{scenario.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleEnableTestMode} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Enable Test Data Mode
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Test data mode is active: <strong>{testMode.scenario}</strong>
              </p>
              {testMode.studentProfile && (
                <p className="text-xs text-green-600 mt-1">
                  Using profile: {testMode.studentProfile.name} ({testMode.studentProfile.performances.length} performances)
                </p>
              )}
            </div>
            
            <Button onClick={disableTestMode} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Disable Test Mode
            </Button>
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Validation Tests</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={runValidationTests} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <Bug className="h-3 w-3 mr-1" />
              Run All Tests
            </Button>
            
            <Button 
              onClick={generateStressTest} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Stress Test
            </Button>
            
            <Button 
              onClick={testLayoutBreakers} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              🎨 Layout Test
            </Button>
            
            <Button 
              onClick={logTestState} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              📊 Log State
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Open browser console to see test results</p>
          <p>• Add ?test-mode=edge-cases to URL for auto-enable</p>
          <p>• Test data persists until disabled or page refresh</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataControls;
