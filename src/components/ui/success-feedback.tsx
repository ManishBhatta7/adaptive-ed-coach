
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessFeedbackProps {
  title: string;
  description?: string;
  className?: string;
}

export const SuccessFeedback = ({ title, description, className }: SuccessFeedbackProps) => {
  return (
    <div className={cn(
      "bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in",
      className
    )}>
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-green-900">{title}</p>
        {description && (
          <p className="text-sm text-green-700">{description}</p>
        )}
      </div>
    </div>
  );
};
