
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface QuizOptionProps {
  children: ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const QuizOption = ({ children, isSelected, onClick }: QuizOptionProps) => {
  return (
    <div
      className={cn(
        "edu-quiz-option",
        isSelected && "edu-quiz-option-selected"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isSelected 
              ? "border-primary bg-primary" 
              : "border-gray-300"
          )}>
            {isSelected && (
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            )}
          </div>
          <div className="text-sm font-medium">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default QuizOption;
