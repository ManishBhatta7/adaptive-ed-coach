import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Play, 
  Star, 
  Gift, 
  Youtube,
  Clock,
  BookOpen,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveStep {
  id: string;
  type: 'conversation' | 'video' | 'game' | 'quiz' | 'experiment';
  content: {
    message?: string;
    videoUrl?: string;
    timestamp?: number;
    gameType?: 'click' | 'drag' | 'match';
    gameConfig?: any;
    experimentSteps?: string[];
  };
  rewards?: {
    points: number;
    badge?: string;
    achievement?: string;
  };
  interaction?: {
    type: 'choice' | 'input' | 'click';
    options?: string[];
    correctAnswer?: string;
  };
}

interface InteractiveLearningPathProps {
  pathId: string;
  studentId: string;
  title: string;
  description: string;
  steps: InteractiveStep[];
}

export const InteractiveLearningPath = ({
  pathId,
  studentId,
  title,
  description,
  steps
}: InteractiveLearningPathProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStep = steps[currentStepIndex];

  const handleStepComplete = (reward?: { points: number; badge?: string }) => {
    if (reward) {
      setPoints(prev => prev + reward.points);
      if (reward.badge) {
        setBadges(prev => [...prev, reward.badge!]);
        triggerConfetti();
      }
    }
    setProgress((currentStepIndex + 1) / steps.length * 100);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStepIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 500);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const renderVideoContent = (url: string, timestamp?: number) => {
    const videoId = url.split('v=')[1];
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}${timestamp ? `?start=${timestamp}` : ''}`}
          allowFullScreen
          className="absolute inset-0"
        />
      </div>
    );
  };

  const renderExperiment = (steps: string[]) => (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-lg">Experiment Steps</h3>
      <ol className="list-decimal pl-5 space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="text-gray-700">{step}</li>
        ))}
      </ol>
    </div>
  );

  const renderInteractiveGame = (gameType: string, config: any) => {
    switch (gameType) {
      case 'click':
        return (
          <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-4">
            {/* Add click-based game implementation */}
            <motion.div
              className="absolute cursor-pointer"
              whileHover={{ scale: 1.1 }}
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`
              }}
              onClick={() => handleStepComplete(currentStep.rewards)}
            >
              <Star className="w-8 h-8 text-yellow-500" />
            </motion.div>
          </div>
        );
      // Add more game types here
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {points} Points
            </Badge>
            {badges.map((badge, index) => (
              <Badge key={index} variant="secondary">{badge}</Badge>
            ))}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            {currentStep.type === 'conversation' && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{currentStep.content.message}</p>
                  {currentStep.interaction && (
                    <div className="mt-4 space-x-4">
                      {currentStep.interaction.options?.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleStepComplete(currentStep.rewards)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep.type === 'video' && currentStep.content.videoUrl && (
              <div className="space-y-4">
                {renderVideoContent(currentStep.content.videoUrl, currentStep.content.timestamp)}
                <Button 
                  className="mt-4"
                  onClick={() => handleStepComplete(currentStep.rewards)}
                >
                  Continue
                </Button>
              </div>
            )}

            {currentStep.type === 'game' && currentStep.content.gameType && (
              renderInteractiveGame(currentStep.content.gameType, currentStep.content.gameConfig)
            )}

            {currentStep.type === 'experiment' && currentStep.content.experimentSteps && (
              <div>
                {renderExperiment(currentStep.content.experimentSteps)}
                <Button 
                  className="mt-4"
                  onClick={() => handleStepComplete(currentStep.rewards)}
                >
                  Complete Experiment
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InteractiveLearningPath;