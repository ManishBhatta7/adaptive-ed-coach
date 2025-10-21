import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  FileText,
  CheckCircle2,
  Clock,
  Star,
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  Award,
  Calendar,
  Download,
  Upload,
  Settings,
  Users,
  Lightbulb,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Timer,
  BookOpen,
  Zap,
  CheckSquare,
  Circle,
  Square,
  MessageSquare,
  PenTool,
  Sliders
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  assessment_type: string;
  created_by: string;
  classroom_id: string;
  instructions: string;
  time_limit_minutes?: number;
  total_points: number;
  passing_score: number;
  rubric: any;
  adaptive_scoring: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answers: any;
  points: number;
  difficulty_level: number;
  metacognitive_dimension?: string;
  order_index: number;
  required: boolean;
  feedback_template?: string;
}

interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_score: number;
  percentage_score: number;
  time_spent_minutes?: number;
  metacognitive_insights: any;
  feedback_generated?: string;
  improvement_suggestions: any;
}

interface AssessmentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  response_data: any;
  is_correct?: boolean;
  points_earned: number;
  confidence_level?: number;
  time_spent_seconds?: number;
  reflection_notes?: string;
}

export const ComprehensiveAssessment: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('take');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [studentAttempts, setStudentAttempts] = useState<AssessmentAttempt[]>([]);
  
  // Teacher/Creation states
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    assessment_type: 'metacognitive',
    instructions: '',
    time_limit_minutes: 30,
    passing_score: 70,
    adaptive_scoring: false
  });
  const [newQuestions, setNewQuestions] = useState<Partial<AssessmentQuestion>[]>([]);

  useEffect(() => {
    if (state.currentUser) {
      loadAssessments();
    }
  }, [state.currentUser]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentAttempt && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev ? prev - 1 : 0);
      }, 1000);
    } else if (timeRemaining === 0) {
      submitAssessment();
    }
    return () => clearInterval(interval);
  }, [currentAttempt, timeRemaining]);

  const loadAssessments = async () => {
    if (!state.currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comprehensive_assessments')
        .select(`
          *,
          profiles:created_by (
            name
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assessments:', error);
        return;
      }

      const assessmentList: Assessment[] = (data || []).map((assessment: any) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        assessment_type: assessment.assessment_type,
        created_by: assessment.created_by,
        classroom_id: assessment.classroom_id,
        instructions: assessment.instructions || '',
        time_limit_minutes: assessment.time_limit_minutes,
        total_points: assessment.total_points || 0,
        passing_score: assessment.passing_score || 70,
        rubric: assessment.rubric || {},
        adaptive_scoring: assessment.adaptive_scoring || false,
        is_published: assessment.is_published,
        created_at: assessment.created_at,
        updated_at: assessment.updated_at
      }));

      setAssessments(assessmentList);

    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssessmentQuestions = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading questions:', error);
        return;
      }

      const questionList: AssessmentQuestion[] = (data || []).map((q: any) => ({
        id: q.id,
        assessment_id: q.assessment_id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || {},
        correct_answers: q.correct_answers || {},
        points: q.points || 1,
        difficulty_level: q.difficulty_level || 1,
        metacognitive_dimension: q.metacognitive_dimension,
        order_index: q.order_index || 0,
        required: q.required !== false,
        feedback_template: q.feedback_template
      }));

      setQuestions(questionList);

    } catch (error) {
      console.error('Error loading assessment questions:', error);
    }
  };

  const startAssessment = async (assessment: Assessment) => {
    if (!state.currentUser) return;

    try {
      // Create new attempt
      const { data, error } = await supabase
        .from('assessment_attempts')
        .insert({
          assessment_id: assessment.id,
          student_id: state.currentUser.id,
          attempt_number: 1, // TODO: Calculate proper attempt number
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting assessment:', error);
        return;
      }

      setCurrentAssessment(assessment);
      setCurrentAttempt(data as AssessmentAttempt);
      setCurrentQuestionIndex(0);
      setResponses({});
      setShowResults(false);
      
      if (assessment.time_limit_minutes) {
        setTimeRemaining(assessment.time_limit_minutes * 60);
      }

      await loadAssessmentQuestions(assessment.id);

    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

  const saveResponse = async (questionId: string, responseData: any, confidenceLevel?: number) => {
    if (!currentAttempt) return;

    try {
      // Save response to database
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          attempt_id: currentAttempt.id,
          question_id: questionId,
          response_data: responseData,
          confidence_level: confidenceLevel,
          time_spent_seconds: 60 // TODO: Calculate actual time spent
        });

      if (error) {
        console.error('Error saving response:', error);
        return;
      }

      // Update local state
      setResponses(prev => ({
        ...prev,
        [questionId]: {
          data: responseData,
          confidence: confidenceLevel
        }
      }));

    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const submitAssessment = async () => {
    if (!currentAttempt || !currentAssessment) return;

    try {
      // Calculate score using database function
      const { data, error } = await supabase.rpc('calculate_assessment_score', {
        attempt_id_param: currentAttempt.id
      });

      if (error) {
        console.error('Error calculating score:', error);
        return;
      }

      // Load updated attempt data
      const { data: attemptData, error: attemptError } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('id', currentAttempt.id)
        .single();

      if (attemptError) {
        console.error('Error loading attempt results:', error);
        return;
      }

      setCurrentAttempt(attemptData as AssessmentAttempt);
      setShowResults(true);
      setTimeRemaining(null);

    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  const createAssessment = async () => {
    if (!state.currentUser || !newAssessment.title.trim()) return;

    try {
      // Create assessment
      const { data, error } = await supabase
        .from('comprehensive_assessments')
        .insert({
          title: newAssessment.title,
          description: newAssessment.description,
          assessment_type: newAssessment.assessment_type,
          created_by: state.currentUser.id,
          classroom_id: null, // TODO: Get from context
          instructions: newAssessment.instructions,
          time_limit_minutes: newAssessment.time_limit_minutes,
          passing_score: newAssessment.passing_score,
          adaptive_scoring: newAssessment.adaptive_scoring,
          is_published: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assessment:', error);
        return;
      }

      const assessment = data as Assessment;

      // Create questions
      for (let i = 0; i < newQuestions.length; i++) {
        const question = newQuestions[i];
        await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: assessment.id,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options,
            correct_answers: question.correct_answers,
            points: question.points || 1,
            difficulty_level: question.difficulty_level || 1,
            metacognitive_dimension: question.metacognitive_dimension,
            order_index: i,
            required: question.required !== false
          });
      }

      // Reset form
      setNewAssessment({
        title: '',
        description: '',
        assessment_type: 'metacognitive',
        instructions: '',
        time_limit_minutes: 30,
        passing_score: 70,
        adaptive_scoring: false
      });
      setNewQuestions([]);
      setIsCreatingAssessment(false);

      await loadAssessments();

    } catch (error) {
      console.error('Error creating assessment:', error);
    }
  };

  const addQuestion = () => {
    setNewQuestions([...newQuestions, {
      question_text: '',
      question_type: 'multiple_choice',
      options: { choices: ['', '', '', ''] },
      correct_answers: { correct_choice: 0 },
      points: 1,
      difficulty_level: 1,
      required: true
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...newQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setNewQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = newQuestions.filter((_, i) => i !== index);
    setNewQuestions(updated);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="w-4 h-4" />;
      case 'short_answer': return <PenTool className="w-4 h-4" />;
      case 'essay': return <FileText className="w-4 h-4" />;
      case 'reflection': return <Brain className="w-4 h-4" />;
      case 'strategy_selection': return <Target className="w-4 h-4" />;
      case 'self_assessment': return <CheckSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'metacognitive': return 'bg-purple-100 text-purple-800';
      case 'formative': return 'bg-blue-100 text-blue-800';
      case 'summative': return 'bg-green-100 text-green-800';
      case 'diagnostic': return 'bg-yellow-100 text-yellow-800';
      case 'peer_assessment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = (question: AssessmentQuestion) => {
    const response = responses[question.id] || {};
    
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <RadioGroup 
              value={response.data?.selected_choice?.toString()}
              onValueChange={(value) => saveResponse(question.id, { selected_choice: parseInt(value) })}
            >
              {question.options.choices?.map((choice: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`q${question.id}_${index}`} />
                  <Label htmlFor={`q${question.id}_${index}`}>{choice}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 'short_answer':
        return (
          <Input
            value={response.data?.text || ''}
            onChange={(e) => saveResponse(question.id, { text: e.target.value })}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );
      
      case 'essay':
      case 'reflection':
        return (
          <Textarea
            value={response.data?.text || ''}
            onChange={(e) => saveResponse(question.id, { text: e.target.value })}
            placeholder="Write your response..."
            className="min-h-[120px] w-full"
          />
        );
      
      case 'strategy_selection':
        return (
          <div className="space-y-2">
            {question.options.strategies?.map((strategy: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`strategy_${question.id}_${index}`}
                  checked={response.data?.selected_strategies?.includes(index)}
                  onCheckedChange={(checked) => {
                    const current = response.data?.selected_strategies || [];
                    const updated = checked 
                      ? [...current, index]
                      : current.filter((i: number) => i !== index);
                    saveResponse(question.id, { selected_strategies: updated });
                  }}
                />
                <Label htmlFor={`strategy_${question.id}_${index}`}>{strategy}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'self_assessment':
        return (
          <div className="space-y-4">
            <div>
              <Label>Rate your understanding (1-5):</Label>
              <Select 
                value={response.data?.understanding_rating?.toString()}
                onValueChange={(value) => saveResponse(question.id, { 
                  ...response.data, 
                  understanding_rating: parseInt(value) 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][rating - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Confidence level (1-5):</Label>
              <Select 
                value={response.data?.confidence_rating?.toString()}
                onValueChange={(value) => saveResponse(question.id, { 
                  ...response.data, 
                  confidence_rating: parseInt(value) 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select confidence" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {['Not Confident', 'Slightly Confident', 'Somewhat Confident', 'Confident', 'Very Confident'][rating - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return (
          <Input
            value={response.data?.text || ''}
            onChange={(e) => saveResponse(question.id, { text: e.target.value })}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );
    }
  };

  // Take Assessment Tab
  const TakeAssessmentTab = () => {
    if (currentAssessment && currentAttempt && !showResults) {
      const currentQuestion = questions[currentQuestionIndex];
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

      return (
        <div className="space-y-6">
          {/* Assessment Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentAssessment.title}</CardTitle>
                  <p className="text-gray-600 mt-1">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {timeRemaining !== null && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-red-500" />
                      <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-600'}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline">
                    {currentAssessment.assessment_type}
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
          </Card>

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getQuestionTypeIcon(currentQuestion.question_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {currentQuestion.question_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary">
                        {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {currentQuestion.question_text}
                    </h3>
                    {currentQuestion.metacognitive_dimension && (
                      <Badge variant="outline" className="mb-4">
                        {currentQuestion.metacognitive_dimension}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderQuestionInput(currentQuestion)}
                
                {/* Confidence Level */}
                <div className="border-t pt-4">
                  <Label className="text-sm">How confident are you in this answer?</Label>
                  <Select 
                    value={responses[currentQuestion.id]?.confidence?.toString()}
                    onValueChange={(value) => {
                      const currentResponse = responses[currentQuestion.id]?.data || {};
                      saveResponse(currentQuestion.id, currentResponse, parseInt(value));
                    }}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} - {['Very Unsure', 'Unsure', 'Neutral', 'Confident', 'Very Confident'][level - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={submitAssessment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assessment
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (showResults && currentAttempt && currentAssessment) {
      return (
        <div className="space-y-6">
          {/* Results Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Assessment Complete!
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{currentAssessment.title}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentAttempt.percentage_score?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentAttempt.total_score} / {currentAssessment.total_points} points
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-purple-600">
                    {currentAttempt.time_spent_minutes || 0}
                  </div>
                  <div className="text-sm text-gray-600">Minutes spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {currentAttempt.percentage_score && currentAttempt.percentage_score >= currentAssessment.passing_score ? 'Passed' : 'Needs Review'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600">
                    {currentAttempt.attempt_number}
                  </div>
                  <div className="text-sm text-gray-600">Attempt number</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          {currentAttempt.feedback_generated && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Personalized Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p>{currentAttempt.feedback_generated}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvement Suggestions */}
          {currentAttempt.improvement_suggestions && Object.keys(currentAttempt.improvement_suggestions).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(currentAttempt.improvement_suggestions).map(([area, suggestions]: [string, any]) => (
                    <div key={area} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold capitalize">{area.replace('_', ' ')}</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {Array.isArray(suggestions) ? suggestions.map((suggestion: string, index: number) => (
                          <li key={index}>{suggestion}</li>
                        )) : (
                          <li>{suggestions}</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => {
                setCurrentAssessment(null);
                setCurrentAttempt(null);
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setResponses({});
              }}
              variant="outline"
            >
              Take Another Assessment
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Available Assessments</h3>
          <p className="text-gray-600">Choose an assessment to evaluate your metacognitive skills.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <Badge variant="outline" className={getAssessmentTypeColor(assessment.assessment_type)}>
                      {assessment.assessment_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {assessment.time_limit_minutes && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {assessment.time_limit_minutes} min
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{assessment.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      Passing: {assessment.passing_score}%
                    </span>
                    {assessment.adaptive_scoring && (
                      <Badge variant="secondary" className="text-xs">
                        Adaptive
                      </Badge>
                    )}
                  </div>
                  <span className="text-gray-500">
                    {assessment.total_points} points
                  </span>
                </div>

                {assessment.instructions && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Instructions:</p>
                    <p>{assessment.instructions}</p>
                  </div>
                )}

                <Button
                  onClick={() => startAssessment(assessment)}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {assessments.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Assessments Available</h3>
              <p className="text-gray-600">Check back later for new assessments from your teachers.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Create Assessment Tab (for teachers)
  const CreateAssessmentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Create Assessment</h3>
          <p className="text-gray-600">Build comprehensive assessments to evaluate student metacognitive development.</p>
        </div>
        <Button
          onClick={() => setIsCreatingAssessment(!isCreatingAssessment)}
          variant="outline"
        >
          {isCreatingAssessment ? 'Cancel' : 'New Assessment'}
        </Button>
      </div>

      {isCreatingAssessment ? (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Assessment title"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newAssessment.assessment_type}
                  onValueChange={(value) => setNewAssessment(prev => ({ ...prev, assessment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metacognitive">Metacognitive</SelectItem>
                    <SelectItem value="formative">Formative</SelectItem>
                    <SelectItem value="summative">Summative</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="peer_assessment">Peer Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newAssessment.description}
                onChange={(e) => setNewAssessment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and content of this assessment"
              />
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea
                value={newAssessment.instructions}
                onChange={(e) => setNewAssessment(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions for students taking this assessment"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  value={newAssessment.time_limit_minutes}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div>
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  value={newAssessment.passing_score}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="adaptive"
                  checked={newAssessment.adaptive_scoring}
                  onCheckedChange={(checked) => setNewAssessment(prev => ({ ...prev, adaptive_scoring: !!checked }))}
                />
                <Label htmlFor="adaptive">Adaptive Scoring</Label>
              </div>
            </div>

            {/* Questions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Questions</h4>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {newQuestions.map((question, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Question {index + 1}</Badge>
                        <Button
                          onClick={() => removeQuestion(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div>
                        <Label>Question Text</Label>
                        <Textarea
                          value={question.question_text || ''}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          placeholder="Enter the question"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                              <SelectItem value="essay">Essay</SelectItem>
                              <SelectItem value="reflection">Reflection</SelectItem>
                              <SelectItem value="strategy_selection">Strategy Selection</SelectItem>
                              <SelectItem value="self_assessment">Self Assessment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={question.points || 1}
                            onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label>Difficulty (1-5)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={question.difficulty_level || 1}
                            onChange={(e) => updateQuestion(index, 'difficulty_level', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      {/* Question-specific options */}
                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <Label>Answer Choices</Label>
                          {(question.options?.choices || ['', '', '', '']).map((choice: string, choiceIndex: number) => (
                            <div key={choiceIndex} className="flex items-center gap-2 mt-2">
                              <Input
                                value={choice}
                                onChange={(e) => {
                                  const choices = [...(question.options?.choices || ['', '', '', ''])];
                                  choices[choiceIndex] = e.target.value;
                                  updateQuestion(index, 'options', { ...question.options, choices });
                                }}
                                placeholder={`Choice ${choiceIndex + 1}`}
                              />
                              <Checkbox
                                checked={question.correct_answers?.correct_choice === choiceIndex}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateQuestion(index, 'correct_answers', { correct_choice: choiceIndex });
                                  }
                                }}
                              />
                              <Label className="text-sm">Correct</Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setIsCreatingAssessment(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={createAssessment}
                disabled={!newAssessment.title.trim() || newQuestions.length === 0}
              >
                Create Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Assessment Creation in Progress</h3>
          <p className="text-gray-600">Click "New Assessment" to start building a comprehensive evaluation.</p>
        </div>
      )}
    </div>
  );

  if (!state.currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the assessment system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Assessment</h1>
          <p className="text-gray-600 mt-2">
            Advanced evaluation tools for metacognitive development
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            {assessments.length} Assessments Available
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="take" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Take Assessment
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {state.currentUser.role === 'teacher' ? 'Create Assessment' : 'My Results'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="take" className="mt-6">
          <TakeAssessmentTab />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          {state.currentUser.role === 'teacher' ? (
            <CreateAssessmentTab />
          ) : (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Assessment Results</h3>
              <p className="text-gray-600">View your completed assessment results and progress here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading assessments...</p>
        </div>
      )}
    </div>
  );
};