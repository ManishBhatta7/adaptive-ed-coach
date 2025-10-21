import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { Reflection, MetacogStrategy } from '@/types/metacog';
import { Loader2, CheckCircle2, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';

interface ReflectionCardProps {
  problemDescription?: string;
  subjectArea?: string;
  assignmentId?: string;
  classroomId?: string;
  onReflectionSubmitted?: (reflection: Reflection) => void;
}

const STRATEGIES: { value: MetacogStrategy; label: string; description: string }[] = [
  { value: 'Visualize', label: 'Visualize', description: 'Drew diagrams, charts, or mental pictures' },
  { value: 'Formula', label: 'Formula', description: 'Applied formulas or equations' },
  { value: 'Example', label: 'Example', description: 'Used examples or analogies' },
  { value: 'Trial-and-error', label: 'Trial & Error', description: 'Tried different approaches' },
  { value: 'Break-down', label: 'Break Down', description: 'Split into smaller parts' },
  { value: 'Other', label: 'Other', description: 'Used a different strategy' }
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Very Hard' }
];

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  problemDescription = '',
  subjectArea = '',
  assignmentId,
  classroomId,
  onReflectionSubmitted
}) => {
  const { state } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showStrategyTips, setShowStrategyTips] = useState(false);
  const [strategyTips, setStrategyTips] = useState<string[]>([]);
  const [showRetryOption, setShowRetryOption] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    problemDescription,
    subjectArea,
    strategy: '' as MetacogStrategy,
    reflectionText: '',
    wasHelpful: 'true',
    difficultyRating: '3'
  });

  // Fetch strategy tips when strategy changes
  useEffect(() => {
    if (formData.strategy) {
      fetchStrategyTips(formData.strategy);
    }
  }, [formData.strategy]);

  const fetchStrategyTips = async (strategy: MetacogStrategy) => {
    try {
      const { data, error } = await supabase.rpc('get_strategy_suggestions', {
        p_strategy: strategy,
        p_subject_area: formData.subjectArea || null,
        p_limit: 2
      });

      if (error) {
        console.error('Error fetching strategy tips:', error);
        return;
      }

      setStrategyTips(data?.map((tip: any) => tip.tip_text) || []);
      setShowStrategyTips(true);
      
      // Log strategy suggestion shown event
      if (state.currentUser) {
        await supabase.rpc('log_metacog_event', {
          p_event_type: 'strategy_suggestion_shown',
          p_user_id: state.currentUser.id,
          p_payload: {
            strategy,
            tips_count: data?.length || 0,
            subject_area: formData.subjectArea
          }
        });
      }
    } catch (error) {
      console.error('Error fetching strategy tips:', error);
    }
  };

  const handleRetryAction = async () => {
    if (!state.currentUser) return;

    try {
      // Log micro-action event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'micro_action_performed',
        p_user_id: state.currentUser.id,
        p_payload: {
          action_type: 'retry',
          strategy_used: formData.strategy,
          activity_id: assignmentId || 'general'
        }
      });

      toast({
        title: 'Great Decision! 🔄',
        description: 'Trying again with a new strategy shows growth mindset!',
      });

      // Reset form for retry
      setFormData(prev => ({
        ...prev,
        strategy: '' as MetacogStrategy,
        reflectionText: '',
        wasHelpful: 'true'
      }));
      setShowStrategyTips(false);
      setShowRetryOption(false);
    } catch (error) {
      console.error('Error logging retry action:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a reflection.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.strategy || !formData.reflectionText.trim() || !formData.problemDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reflectionData = {
        student_id: state.currentUser.id,
        assignment_id: assignmentId || null,
        classroom_id: classroomId || null,
        problem_description: formData.problemDescription,
        subject_area: formData.subjectArea || 'General',
        strategy_used: formData.strategy,
        reflection_text: formData.reflectionText,
        was_helpful: formData.wasHelpful === 'true',
        difficulty_rating: parseInt(formData.difficultyRating)
      };

      const { data, error } = await supabase
        .from('reflections')
        .insert([reflectionData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting reflection:', error);
        toast({
          title: 'Submission Failed',
          description: 'Failed to submit your reflection. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setIsSubmitted(true);
      setShowRetryOption(formData.wasHelpful === 'false'); // Show retry if strategy wasn't helpful
      
      toast({
        title: 'Reflection Submitted! 🎉',
        description: 'Your reflection has been saved. You earned the Reflector badge!',
        variant: 'default'
      });

      // Call the callback if provided
      if (onReflectionSubmitted && data) {
        onReflectionSubmitted(data as Reflection);
      }

      // Reset form after a delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          problemDescription: '',
          subjectArea: '',
          strategy: '' as MetacogStrategy,
          reflectionText: '',
          wasHelpful: 'true',
          difficultyRating: '3'
        });
      }, 3000);

    } catch (error) {
      console.error('Error submitting reflection:', error);
      toast({
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reflection Submitted!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for taking time to reflect on your problem-solving approach.
          </p>
            <Badge variant="secondary" className="mb-4">
              🤔 Reflector Badge Earned
            </Badge>
            <p className="text-sm text-gray-500">
              Your teacher will review and rate your reflection soon.
            </p>
            
            {showRetryOption && (
              <Button 
                onClick={handleRetryAction}
                variant="outline"
                className="mt-4 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try a Different Strategy
              </Button>
            )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤔 Learning Reflection
          <Badge variant="outline">Metacognition</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Reflect on how you approached solving this problem. This helps you become a better learner!
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Problem Description */}
          <div className="space-y-2">
            <Label htmlFor="problem">Problem Description *</Label>
            <Textarea
              id="problem"
              placeholder="Describe the problem you were working on..."
              value={formData.problemDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Subject Area */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Area</Label>
            <Select 
              value={formData.subjectArea} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subjectArea: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Math">Math</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategy Used */}
          <div className="space-y-3">
            <Label>Which strategy did you use to solve this problem? *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STRATEGIES.map((strategy) => (
                <div
                  key={strategy.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-blue-300 ${
                    formData.strategy === strategy.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, strategy: strategy.value }))}
                >
                  <div className="font-medium">{strategy.label}</div>
                  <div className="text-sm text-gray-600">{strategy.description}</div>
                </div>
              ))}
            </div>
            
            {/* Strategy Tips */}
            {showStrategyTips && strategyTips.length > 0 && (
              <Alert className="mt-3">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Tips for {formData.strategy}:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {strategyTips.map((tip, index) => (
                      <li key={index} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Reflection Text */}
          <div className="space-y-2">
            <Label htmlFor="reflection">Your Reflection *</Label>
            <Textarea
              id="reflection"
              placeholder="Explain how you used this strategy and what you learned from it. What worked well? What would you do differently?"
              value={formData.reflectionText}
              onChange={(e) => setFormData(prev => ({ ...prev, reflectionText: e.target.value }))}
              rows={4}
              required
            />
            <div className="text-sm text-gray-500">
              Tip: Use words like "because", "therefore", "however" to explain your thinking clearly.
            </div>
          </div>

          {/* Was Helpful */}
          <div className="space-y-3">
            <Label>Was this strategy helpful for solving the problem?</Label>
            <RadioGroup
              value={formData.wasHelpful}
              onValueChange={(value) => setFormData(prev => ({ ...prev, wasHelpful: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="helpful-yes" />
                <Label htmlFor="helpful-yes">Yes, it helped</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="helpful-no" />
                <Label htmlFor="helpful-no">No, it didn't help</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Difficulty Rating */}
          <div className="space-y-3">
            <Label>How difficult was this problem for you?</Label>
            <Select 
              value={formData.difficultyRating} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, difficultyRating: value }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Reflection...
              </>
            ) : (
              'Submit Reflection'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};