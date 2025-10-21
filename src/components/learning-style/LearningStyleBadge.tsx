import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, Sparkles, Eye, Headphones, Hand, Users, Lightbulb, Book } from 'lucide-react';
import { LearningStyle } from '@/types';
import { learningStyleInfo } from '@/types/learningStyles';
import { motion } from 'framer-motion';

interface LearningStyleBadgeProps {
  learningStyle: LearningStyle;
  showTooltip?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  animated?: boolean;
  className?: string;
}

const styleIcons: Record<LearningStyle, React.ElementType> = {
  [LearningStyle.VISUAL]: Eye,
  [LearningStyle.AUDITORY]: Headphones,
  [LearningStyle.KINESTHETIC]: Hand,
  [LearningStyle.READING_WRITING]: Book,
  [LearningStyle.LOGICAL]: Brain,
  [LearningStyle.SOCIAL]: Users,
  [LearningStyle.SOLITARY]: Lightbulb,
};

const styleColors: Record<LearningStyle, { bg: string; text: string; border: string }> = {
  [LearningStyle.VISUAL]: { 
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50', 
    text: 'text-purple-700', 
    border: 'border-purple-200' 
  },
  [LearningStyle.AUDITORY]: { 
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200' 
  },
  [LearningStyle.KINESTHETIC]: { 
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50', 
    text: 'text-green-700', 
    border: 'border-green-200' 
  },
  [LearningStyle.READING_WRITING]: { 
    bg: 'bg-gradient-to-r from-orange-50 to-amber-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200' 
  },
  [LearningStyle.LOGICAL]: { 
    bg: 'bg-gradient-to-r from-indigo-50 to-violet-50', 
    text: 'text-indigo-700', 
    border: 'border-indigo-200' 
  },
  [LearningStyle.SOCIAL]: { 
    bg: 'bg-gradient-to-r from-rose-50 to-pink-50', 
    text: 'text-rose-700', 
    border: 'border-rose-200' 
  },
  [LearningStyle.SOLITARY]: { 
    bg: 'bg-gradient-to-r from-slate-50 to-gray-50', 
    text: 'text-slate-700', 
    border: 'border-slate-200' 
  },
};

export const LearningStyleBadge: React.FC<LearningStyleBadgeProps> = ({
  learningStyle,
  showTooltip = true,
  variant = 'default',
  animated = true,
  className = '',
}) => {
  const styleInfo = learningStyleInfo[learningStyle];
  const Icon = styleIcons[learningStyle];
  const colors = styleColors[learningStyle];

  const badgeContent = (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {variant === 'compact' ? (
        <Badge 
          className={`${colors.bg} ${colors.text} ${colors.border} border flex items-center gap-1.5 px-2 py-1`}
        >
          <Icon className="h-3 w-3" />
          <Sparkles className="h-2.5 w-2.5 opacity-70" />
        </Badge>
      ) : variant === 'detailed' ? (
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-3 space-y-2`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md bg-white/80 ${colors.text}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${colors.text}`}>{styleInfo.title}</span>
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <p className="text-xs text-gray-600">AI-Optimized Feedback</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">{styleInfo.description}</p>
        </div>
      ) : (
        <Badge 
          className={`${colors.bg} ${colors.text} ${colors.border} border flex items-center gap-2 px-3 py-1.5`}
        >
          <Icon className="h-4 w-4" />
          <span className="font-medium">{styleInfo.title}</span>
          <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
        </Badge>
      )}
    </motion.div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">AI-Optimized for Your Learning Style</span>
            </div>
            <p className="text-sm text-gray-600">
              This feedback is personalized for <strong>{styleInfo.title}</strong> learners,
              using strategies that work best for your learning preferences.
            </p>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-gray-700 mb-1">Key Strategies:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {styleInfo.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LearningStyleBadge;
