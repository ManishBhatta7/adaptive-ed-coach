import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, School, Users, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingOption {
  value: string;
  label: string;
  icon?: JSX.Element;
  description?: string;
}

const userTypes: OnboardingOption[] = [
  {
    value: 'student',
    label: 'Student',
    icon: <GraduationCap className="w-6 h-6" />,
    description: 'I want to improve my learning and academic performance'
  },
  {
    value: 'teacher',
    label: 'Teacher',
    icon: <School className="w-6 h-6" />,
    description: 'I want to use AI to enhance my teaching and reduce workload'
  },
  {
    value: 'parent',
    label: 'Parent',
    icon: <Users className="w-6 h-6" />,
    description: 'I want to support my child\'s learning journey'
  }
];

const boards: OnboardingOption[] = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'state', label: 'State Board' },
  { value: 'other', label: 'Other' }
];

const subjects: OnboardingOption[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'other', label: 'Other' }
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [board, setBoard] = useState('');
  const [subject, setSubject] = useState('');

  const progress = (step / 3) * 100;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save onboarding data
      const onboardingData = {
        userType,
        board,
        subject,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return !userType;
      case 2:
        return !board;
      case 3:
        return !subject;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">Step {step} of 3</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Welcome! Let's personalize your experience"}
                  {step === 2 && "Which board are you following?"}
                  {step === 3 && "What subject do you want to focus on first?"}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <RadioGroup
                  value={
                    step === 1 ? userType :
                    step === 2 ? board :
                    subject
                  }
                  onValueChange={
                    step === 1 ? setUserType :
                    step === 2 ? setBoard :
                    setSubject
                  }
                  className="space-y-3"
                >
                  {(step === 1 ? userTypes :
                    step === 2 ? boards :
                    subjects).map((option) => (
                    <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          {option.icon}
                          <div>
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-sm text-gray-500">{option.description}</div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                >
                  {step === 3 ? 'Get Started' : 'Continue'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 mt-4">
          You can always change these preferences later in your settings
        </p>
      </div>
    </div>
  );
}