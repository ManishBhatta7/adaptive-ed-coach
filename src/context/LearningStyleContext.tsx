
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LearningStyle, QuizQuestion, QuestionType, StudentProfile } from '@/types';
import { useAppContext } from './AppContext';

// Learning style quiz questions
const learningStyleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'When learning a new concept, I prefer to:',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      'See diagrams, charts, or visual representations',
      'Hear it explained verbally',
      'Read about it and take notes',
      'Try it out through hands-on practice',
      'Understand the logical patterns behind it'
    ],
    learningStyleMapping: {
      'See diagrams, charts, or visual representations': LearningStyle.VISUAL,
      'Hear it explained verbally': LearningStyle.AUDITORY,
      'Read about it and take notes': LearningStyle.READING_WRITING,
      'Try it out through hands-on practice': LearningStyle.KINESTHETIC,
      'Understand the logical patterns behind it': LearningStyle.LOGICAL
    }
  },
  {
    id: 'q2',
    text: 'When I\'m stuck on a difficult problem, I usually:',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      'Sketch out the problem or create a diagram',
      'Talk through it with someone else',
      'Write down everything I know about the problem',
      'Take a break and move around to think better',
      'Break it down into logical steps'
    ],
    learningStyleMapping: {
      'Sketch out the problem or create a diagram': LearningStyle.VISUAL,
      'Talk through it with someone else': LearningStyle.SOCIAL,
      'Write down everything I know about the problem': LearningStyle.READING_WRITING,
      'Take a break and move around to think better': LearningStyle.KINESTHETIC,
      'Break it down into logical steps': LearningStyle.LOGICAL
    }
  },
  {
    id: 'q3',
    text: 'I remember information best when:',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      'I see it written down or in a chart',
      'I hear it or say it aloud',
      'I read it repeatedly and take detailed notes',
      'I act it out or use physical objects',
      'I understand how it connects to other concepts'
    ],
    learningStyleMapping: {
      'I see it written down or in a chart': LearningStyle.VISUAL,
      'I hear it or say it aloud': LearningStyle.AUDITORY,
      'I read it repeatedly and take detailed notes': LearningStyle.READING_WRITING,
      'I act it out or use physical objects': LearningStyle.KINESTHETIC,
      'I understand how it connects to other concepts': LearningStyle.LOGICAL
    }
  },
  {
    id: 'q4',
    text: 'When studying for a test, I typically:',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      'Create colorful mind maps or visual summaries',
      'Record myself reading notes and listen to them',
      'Rewrite my notes and create written summaries',
      'Move around while reviewing or use flashcards',
      'Organize information into a structured system'
    ],
    learningStyleMapping: {
      'Create colorful mind maps or visual summaries': LearningStyle.VISUAL,
      'Record myself reading notes and listen to them': LearningStyle.AUDITORY,
      'Rewrite my notes and create written summaries': LearningStyle.READING_WRITING,
      'Move around while reviewing or use flashcards': LearningStyle.KINESTHETIC,
      'Organize information into a structured system': LearningStyle.LOGICAL
    }
  },
  {
    id: 'q5',
    text: 'I prefer to work on assignments:',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      'Alone in a quiet space',
      'With a group discussing ideas',
      'By myself but with background noise or music'
    ],
    learningStyleMapping: {
      'Alone in a quiet space': LearningStyle.SOLITARY,
      'With a group discussing ideas': LearningStyle.SOCIAL,
      'By myself but with background noise or music': LearningStyle.AUDITORY
    }
  }
];

// Context type definition
interface LearningStyleContextType {
  quizQuestions: QuizQuestion[];
  quizResponses: Record<string, string>;
  setQuizResponse: (questionId: string, response: string) => void;
  resetQuiz: () => void;
  calculateLearningStyle: () => {
    primaryStyle: LearningStyle;
    secondaryStyle: LearningStyle;
    styleStrengths: Record<LearningStyle, number>;
  };
  isQuizCompleted: boolean;
  saveQuizResults: () => void;
}

// Create the context
export const LearningStyleContext = createContext<LearningStyleContextType>({
  quizQuestions: [],
  quizResponses: {},
  setQuizResponse: () => {},
  resetQuiz: () => {},
  calculateLearningStyle: () => ({
    primaryStyle: LearningStyle.VISUAL,
    secondaryStyle: LearningStyle.AUDITORY,
    styleStrengths: {} as Record<LearningStyle, number>
  }),
  isQuizCompleted: false,
  saveQuizResults: () => {}
});

// Context provider
export const LearningStyleProvider = ({ children }: { children: ReactNode }) => {
  const { state, updateUserProfile } = useAppContext();
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({});
  
  // Check if all questions have been answered
  const isQuizCompleted = learningStyleQuestions.every(q => quizResponses[q.id]);
  
  // Set a response for a specific question
  const setQuizResponse = (questionId: string, response: string) => {
    setQuizResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };
  
  // Reset the quiz
  const resetQuiz = () => {
    setQuizResponses({});
  };
  
  // Calculate learning style from quiz responses
  const calculateLearningStyle = () => {
    // Initialize counts for each learning style
    const styleCounts: Record<LearningStyle, number> = {
      [LearningStyle.VISUAL]: 0,
      [LearningStyle.AUDITORY]: 0,
      [LearningStyle.READING_WRITING]: 0,
      [LearningStyle.KINESTHETIC]: 0,
      [LearningStyle.LOGICAL]: 0,
      [LearningStyle.SOCIAL]: 0,
      [LearningStyle.SOLITARY]: 0
    };
    
    // Count each learning style preference from the responses
    Object.entries(quizResponses).forEach(([questionId, response]) => {
      const question = learningStyleQuestions.find(q => q.id === questionId);
      if (question && question.learningStyleMapping && question.learningStyleMapping[response]) {
        const style = question.learningStyleMapping[response];
        styleCounts[style] += 1;
      }
    });
    
    // Determine primary and secondary learning styles
    let primaryStyle = LearningStyle.VISUAL;
    let secondaryStyle = LearningStyle.AUDITORY;
    let maxCount = 0;
    let secondMaxCount = 0;
    
    Object.entries(styleCounts).forEach(([style, count]) => {
      if (count > maxCount) {
        secondaryStyle = primaryStyle;
        secondMaxCount = maxCount;
        primaryStyle = style as LearningStyle;
        maxCount = count;
      } else if (count > secondMaxCount) {
        secondaryStyle = style as LearningStyle;
        secondMaxCount = count;
      }
    });
    
    // Calculate percentage strengths for each style
    const totalResponses = Object.keys(quizResponses).length;
    const styleStrengths: Record<LearningStyle, number> = {} as Record<LearningStyle, number>;
    
    Object.entries(styleCounts).forEach(([style, count]) => {
      styleStrengths[style as LearningStyle] = Math.round((count / totalResponses) * 100);
    });
    
    return {
      primaryStyle,
      secondaryStyle,
      styleStrengths
    };
  };
  
  // Save quiz results to user profile
  const saveQuizResults = () => {
    if (state.currentUser) {
      const { primaryStyle, secondaryStyle, styleStrengths } = calculateLearningStyle();
      
      updateUserProfile({
        primaryLearningStyle: primaryStyle,
        secondaryLearningStyle: secondaryStyle,
        learningStyleStrengths: styleStrengths
      });
    }
  };
  
  return (
    <LearningStyleContext.Provider
      value={{
        quizQuestions: learningStyleQuestions,
        quizResponses,
        setQuizResponse,
        resetQuiz,
        calculateLearningStyle,
        isQuizCompleted,
        saveQuizResults
      }}
    >
      {children}
    </LearningStyleContext.Provider>
  );
};

// Custom hook for using the learning style context
export const useLearningStyle = () => useContext(LearningStyleContext);
