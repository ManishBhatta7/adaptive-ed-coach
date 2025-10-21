import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Bot,
  Brain,
  Lightbulb,
  Target,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Settings,
  BarChart3,
  Sparkles,
  Timer,
  Award,
  FileText,
  Users,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface AITutorSession {
  id: string;
  session_type: string;
  context_data: any;
  current_problem: string;
  learning_objectives: string[];
  difficulty_level: number;
  status: string;
  created_at: string;
  total_interactions: number;
  success_rate: number;
}

interface AIInteraction {
  id: string;
  interaction_type: string;
  student_input: string;
  ai_response: string;
  response_quality_score: number;
  student_satisfaction?: number;
  helped_learning?: boolean;
  metacognitive_prompt?: string;
  created_at: string;
  confidence_score: number;
}

interface AIKnowledge {
  id: string;
  concept_name: string;
  description: string;
  difficulty_level: number;
  prerequisites: string[];
  learning_strategies: any;
  common_misconceptions: any;
  example_problems: any;
  scaffolding_templates: any;
}

interface LearningPath {
  id: string;
  concept: string;
  mastery_level: number;
  time_spent: number;
  success_rate: number;
  last_interaction: string;
  next_recommended_action: string;
}

export const AITutorSystem: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('tutor');
  const [currentSession, setCurrentSession] = useState<AITutorSession | null>(null);
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<AIKnowledge[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [sessionGoal, setSessionGoal] = useState('');
  const [tutorPersonality, setTutorPersonality] = useState('encouraging');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackInteraction, setFeedbackInteraction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.currentUser && state.currentUser.role === 'student') {
      loadTutorData();
    }
  }, [state.currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [interactions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTutorData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadCurrentSession(),
        loadKnowledgeBase(),
        loadLearningPath()
      ]);
    } catch (error) {
      console.error('Error loading tutor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSession = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('ai_tutor_sessions')
        .select('*')
        .eq('student_id', state.currentUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading session:', error);
        return;
      }

      if (data && data.length > 0) {
        const session = data[0] as AITutorSession;
        setCurrentSession(session);
        await loadSessionInteractions(session.id);
      }

    } catch (error) {
      console.error('Error loading current session:', error);
    }
  };

  const loadSessionInteractions = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_tutor_interactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading interactions:', error);
        return;
      }

      const interactionList: AIInteraction[] = (data || []).map((interaction: any) => ({
        id: interaction.id,
        interaction_type: interaction.interaction_type,
        student_input: interaction.student_input || '',
        ai_response: interaction.ai_response,
        response_quality_score: interaction.response_quality_score || 0,
        student_satisfaction: interaction.student_satisfaction,
        helped_learning: interaction.helped_learning,
        metacognitive_prompt: interaction.metacognitive_prompt,
        created_at: interaction.created_at,
        confidence_score: interaction.confidence_score || 0
      }));

      setInteractions(interactionList);

    } catch (error) {
      console.error('Error loading session interactions:', error);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tutor_knowledge')
        .select('*')
        .order('difficulty_level', { ascending: true });

      if (error) {
        console.error('Error loading knowledge base:', error);
        return;
      }

      const knowledgeList: AIKnowledge[] = (data || []).map((knowledge: any) => ({
        id: knowledge.id,
        concept_name: knowledge.concept_name,
        description: knowledge.description,
        difficulty_level: knowledge.difficulty_level,
        prerequisites: knowledge.prerequisites || [],
        learning_strategies: knowledge.learning_strategies || {},
        common_misconceptions: knowledge.common_misconceptions || {},
        example_problems: knowledge.example_problems || {},
        scaffolding_templates: knowledge.scaffolding_templates || {}
      }));

      setKnowledgeBase(knowledgeList);

    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  };

  const loadLearningPath = async () => {
    if (!state.currentUser) return;

    try {
      // Generate learning path based on user's metacognitive data and interactions
      // This is a simplified version - in production, this would use ML algorithms
      const conceptProgress: LearningPath[] = [
        {
          id: '1',
          concept: 'Metacognitive Awareness',
          mastery_level: 75,
          time_spent: 120,
          success_rate: 0.8,
          last_interaction: new Date(Date.now() - 86400000).toISOString(),
          next_recommended_action: 'Practice self-reflection techniques'
        },
        {
          id: '2',
          concept: 'Problem Decomposition',
          mastery_level: 45,
          time_spent: 90,
          success_rate: 0.6,
          last_interaction: new Date(Date.now() - 172800000).toISOString(),
          next_recommended_action: 'Work on breaking down complex problems'
        },
        {
          id: '3',
          concept: 'Strategy Selection',
          mastery_level: 30,
          time_spent: 60,
          success_rate: 0.5,
          last_interaction: new Date(Date.now() - 259200000).toISOString(),
          next_recommended_action: 'Learn about different problem-solving strategies'
        }
      ];

      setLearningPath(conceptProgress);

    } catch (error) {
      console.error('Error loading learning path:', error);
    }
  };

  const startNewSession = async () => {
    if (!state.currentUser || !selectedTopic || !sessionGoal) return;

    try {
      // End any active sessions first
      await supabase
        .from('ai_tutor_sessions')
        .update({ status: 'completed' })
        .eq('student_id', state.currentUser.id)
        .eq('status', 'active');

      // Create new session
      const { data, error } = await supabase
        .from('ai_tutor_sessions')
        .insert({
          student_id: state.currentUser.id,
          session_type: 'adaptive_tutoring',
          context_data: {
            topic: selectedTopic,
            goal: sessionGoal,
            difficulty_level: difficultyLevel,
            tutor_personality: tutorPersonality,
            previous_sessions: currentSession ? [currentSession.id] : []
          },
          current_problem: '',
          learning_objectives: [sessionGoal],
          difficulty_level: difficultyLevel,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setCurrentSession(data as AITutorSession);
      setInteractions([]);

      // Send welcome message
      await sendToTutor('Hi! I\'m ready to start learning.', 'greeting');

    } catch (error) {
      console.error('Error starting new session:', error);
    }
  };

  const sendToTutor = async (input: string, interactionType: string = 'question') => {
    if (!currentSession || !state.currentUser) return;

    setIsTyping(true);
    setCurrentInput('');

    try {
      // Generate AI response using the database function
      const { data, error } = await supabase.rpc('generate_ai_tutor_response', {
        session_id_param: currentSession.id,
        student_input_param: input,
        interaction_type_param: interactionType
      });

      if (error) {
        console.error('Error generating AI response:', error);
        return;
      }

      // Reload interactions to get the new one
      await loadSessionInteractions(currentSession.id);

    } catch (error) {
      console.error('Error sending to tutor:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const getHint = async () => {
    if (!currentSession) return;
    await sendToTutor(currentInput || 'I need a hint for this problem.', 'hint');
  };

  const getExplanation = async () => {
    if (!currentSession) return;
    await sendToTutor(currentInput || 'Can you explain this concept?', 'explanation');
  };

  const provideFeedback = async (interactionId: string, satisfaction: number, helped: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_tutor_interactions')
        .update({
          student_satisfaction: satisfaction,
          helped_learning: helped
        })
        .eq('id', interactionId);

      if (error) {
        console.error('Error providing feedback:', error);
        return;
      }

      setShowFeedbackDialog(false);
      setFeedbackInteraction(null);

      // Reload interactions to reflect changes
      if (currentSession) {
        await loadSessionInteractions(currentSession.id);
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('ai_tutor_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('Error ending session:', error);
        return;
      }

      setCurrentSession(null);
      setInteractions([]);
      await loadLearningPath(); // Refresh learning path

    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'hint': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'explanation': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'feedback': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'scaffold': return <Target className="w-4 h-4 text-purple-500" />;
      case 'assessment': return <BarChart3 className="w-4 h-4 text-orange-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // AI Tutor Chat Tab
  const AITutorTab = () => (
    <div className="space-y-6">
      {currentSession ? (
        <>
          {/* Session Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      AI Learning Coach
                      <Badge variant="default" className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Active
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Topic: {currentSession.context_data?.topic || 'General Learning'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(currentSession.difficulty_level)}>
                    Level {currentSession.difficulty_level}
                  </Badge>
                  <Button onClick={endSession} variant="outline" size="sm">
                    End Session
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chat Interface */}
          <Card className="flex-1">
            <CardContent className="p-0">
              <div className="h-96 p-4 overflow-y-auto space-y-4 border-b">
                {interactions.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to your AI Learning Coach!</h3>
                    <p className="text-gray-600">I'm here to help you learn and reflect on your thinking. Ask me anything!</p>
                  </div>
                )}

                {interactions.map((interaction) => (
                  <div key={interaction.id} className="space-y-4">
                    {/* Student Message */}
                    {interaction.student_input && (
                      <div className="flex gap-3 justify-end">
                        <div className="max-w-xs bg-blue-600 text-white p-3 rounded-lg">
                          <p className="text-sm">{interaction.student_input}</p>
                          <div className="text-xs opacity-75 mt-1">
                            {formatTimeAgo(interaction.created_at)}
                          </div>
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{state.currentUser?.name?.[0] || 'S'}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* AI Response */}
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 max-w-xs bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getInteractionIcon(interaction.interaction_type)}
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {interaction.interaction_type}
                          </span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs">
                              {(interaction.confidence_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{interaction.ai_response}</p>
                        
                        {interaction.metacognitive_prompt && (
                          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                            <p className="text-xs text-purple-700">
                              <Brain className="w-3 h-3 inline mr-1" />
                              Reflect: {interaction.metacognitive_prompt}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            onClick={() => {
                              setFeedbackInteraction(interaction.id);
                              setShowFeedbackDialog(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            {interaction.student_satisfaction ? (
                              <>
                                <Star className="w-3 h-3 mr-1" />
                                Rated
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Rate
                              </>
                            )}
                          </Button>
                          <div className="text-xs text-gray-500">
                            {formatTimeAgo(interaction.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={getHint}
                    variant="outline"
                    size="sm"
                    disabled={isTyping}
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Hint
                  </Button>
                  <Button
                    onClick={getExplanation}
                    variant="outline"
                    size="sm"
                    disabled={isTyping}
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Explain
                  </Button>
                  <Button
                    onClick={() => sendToTutor(currentInput, 'assessment')}
                    variant="outline"
                    size="sm"
                    disabled={isTyping}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Assess
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Ask a question, describe what you're working on, or share your thoughts..."
                    className="min-h-[80px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (currentInput.trim()) {
                          sendToTutor(currentInput.trim());
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => currentInput.trim() && sendToTutor(currentInput.trim())}
                    disabled={!currentInput.trim() || isTyping}
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Session Setup
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Start AI Tutoring Session
            </CardTitle>
            <p className="text-gray-600">
              Configure your personalized learning session with the AI coach.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Learning Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeBase.map((knowledge) => (
                      <SelectItem key={knowledge.id} value={knowledge.concept_name}>
                        {knowledge.concept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <Select value={difficultyLevel.toString()} onValueChange={(value) => setDifficultyLevel(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Beginner</SelectItem>
                    <SelectItem value="2">Level 2 - Novice</SelectItem>
                    <SelectItem value="3">Level 3 - Intermediate</SelectItem>
                    <SelectItem value="4">Level 4 - Advanced</SelectItem>
                    <SelectItem value="5">Level 5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session Goal</label>
              <Textarea
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="What would you like to learn or work on in this session?"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tutor Personality</label>
              <Select value={tutorPersonality} onValueChange={setTutorPersonality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encouraging">Encouraging & Supportive</SelectItem>
                  <SelectItem value="challenging">Challenging & Direct</SelectItem>
                  <SelectItem value="patient">Patient & Methodical</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={startNewSession}
              disabled={!selectedTopic || !sessionGoal.trim()}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Learning Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Learning Path Tab
  const LearningPathTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Your Learning Journey</h3>
        <p className="text-gray-600">Track your progress across different metacognitive concepts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningPath.map((path) => (
          <Card key={path.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{path.concept}</CardTitle>
                  <Badge variant="outline" className={getDifficultyColor(Math.ceil(path.mastery_level / 20))}>
                    {path.mastery_level}% Mastered
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {path.mastery_level}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{path.mastery_level}%</span>
                </div>
                <Progress value={path.mastery_level} className="h-2" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Spent</span>
                  <span className="font-medium">{path.time_spent} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium">{(path.success_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Practice</span>
                  <span className="font-medium">{formatTimeAgo(path.last_interaction)}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-3">Next Action:</p>
                <p className="text-sm font-medium mb-3">{path.next_recommended_action}</p>
                <Button 
                  onClick={() => {
                    setSelectedTopic(path.concept);
                    setSessionGoal(path.next_recommended_action);
                    setActiveTab('tutor');
                  }}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  Continue Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Available Learning Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeBase.map((knowledge) => (
              <div key={knowledge.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{knowledge.concept_name}</h4>
                  <Badge variant="outline" className={getDifficultyColor(knowledge.difficulty_level)}>
                    Level {knowledge.difficulty_level}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{knowledge.description}</p>
                
                {knowledge.prerequisites.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Prerequisites:</p>
                    <div className="flex flex-wrap gap-1">
                      {knowledge.prerequisites.map((prereq, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => {
                    setSelectedTopic(knowledge.concept_name);
                    setDifficultyLevel(knowledge.difficulty_level);
                    setActiveTab('tutor');
                  }}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Start Learning
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!state.currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the AI tutoring system.</p>
        </CardContent>
      </Card>
    );
  }

  if (state.currentUser.role !== 'student') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Student Access Only</h3>
          <p className="text-gray-600">The AI tutoring system is available for students only.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Learning Coach</h1>
          <p className="text-gray-600 mt-2">
            Get personalized help and develop your metacognitive skills with AI guidance
          </p>
        </div>
        {currentSession && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-2">
              <Timer className="w-3 h-3" />
              {currentSession.total_interactions} interactions
            </Badge>
            <Badge variant="outline">
              {(currentSession.success_rate * 100 || 0).toFixed(0)}% success rate
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tutor" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Tutor Chat
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Learning Path
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutor" className="mt-6">
          <AITutorTab />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <LearningPathTab />
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate AI Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                How satisfied were you with this AI response?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    onClick={() => feedbackInteraction && provideFeedback(feedbackInteraction, rating, true)}
                    variant="outline"
                    size="sm"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    {rating}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Did this response help your learning?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => feedbackInteraction && provideFeedback(feedbackInteraction, 5, true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes, it helped
                </Button>
                <Button
                  onClick={() => feedbackInteraction && provideFeedback(feedbackInteraction, 2, false)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  No, not helpful
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading AI Tutor...</p>
        </div>
      )}
    </div>
  );
};