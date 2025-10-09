
import { useState } from 'react';
import { useLearningStyle } from '@/context/LearningStyleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import QuizOption from './QuizOption';
import { LearningStyle, learningStyleInfo } from '@/types';

const LearningStyleQuiz = () => {
  const { quizQuestions, quizResponses, setQuizResponse, isQuizCompleted, calculateLearningStyle, saveQuizResults } = useLearningStyle();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const totalQuestions = quizQuestions.length;
  
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (isQuizCompleted) {
      setShowResults(true);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleOptionSelect = (option: string) => {
    setQuizResponse(currentQuestion.id, option);
  };
  
  const handleSubmit = async () => {
    try {
      await saveQuizResults();
      setShowResults(true);
    } catch (error) {
      console.error('Failed to save quiz results:', error);
      alert('Failed to save your learning style results. Please try again.');
    }
  };
  
  if (showResults) {
    const { primaryStyle, secondaryStyle, styleStrengths } = calculateLearningStyle();
    const primaryInfo = learningStyleInfo[primaryStyle];
    const secondaryInfo = learningStyleInfo[secondaryStyle];
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Learning Style Results</CardTitle>
            <CardDescription>
              Based on your responses, we've identified your primary and secondary learning styles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-edu-primary">Primary Learning Style: {primaryInfo.title}</h3>
              <p className="text-gray-700">{primaryInfo.description}</p>
              
              <h4 className="text-lg font-medium mt-4">Recommendations for your primary style:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {primaryInfo.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-xl font-semibold text-edu-secondary">Secondary Learning Style: {secondaryInfo.title}</h3>
              <p className="text-gray-700">{secondaryInfo.description}</p>
              
              <h4 className="text-lg font-medium mt-4">Recommendations for your secondary style:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {secondaryInfo.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold mb-4">Your Learning Style Profile</h3>
              
              <div className="space-y-3">
                {Object.entries(styleStrengths).map(([style, percentage]) => (
                  percentage > 0 && (
                    <div key={style} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{learningStyleInfo[style as LearningStyle].title}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-edu-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Continue to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Learning Style Quiz</CardTitle>
          <CardDescription>
            Answer the following questions to discover your learning style preferences.
            This will help us provide personalized recommendations and feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% complete</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-edu-primary rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <QuizOption
                  key={option}
                  isSelected={quizResponses[currentQuestion.id] === option}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </QuizOption>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!quizResponses[currentQuestion.id]}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isQuizCompleted}
            >
              Complete Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default LearningStyleQuiz;
