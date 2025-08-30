
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProcessingProgressProps {
  progressValue: number;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ progressValue }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>Processing...</span>
      <span>{Math.round(progressValue)}%</span>
    </div>
    <Progress value={progressValue} className="h-2" />
    <p className="text-xs text-center text-gray-500 mt-2">
      Our AI is analyzing your report card
    </p>
  </div>
);

export default ProcessingProgress;
