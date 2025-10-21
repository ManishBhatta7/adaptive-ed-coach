import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  BookOpen,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  Layers,
  HelpCircle,
  ArrowRight,
  Star,
  Eye
} from 'lucide-react';

interface DifficultyLevel {
  level_number: number;
  level_name: string;
  min_metacog_score: number;
  max_metacog_score: number;
  description: string;
}

interface AdaptiveContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  difficulty_level: number;
  subject_area: string;
  learning_objective: string;
  metacog_strategies: string[];
  estimated_time_minutes: number;
  is_recommended?: boolean;
  recommendation_reason?: string;
  confidence_score?: number;
}

interface ContentInteraction {
  id: string;
  content_id: string;
  interaction_type: string;
  performance_score: number;
  time_spent_seconds: number;
  help_requests: number;
  hints_used: number;
  created_at: string;
}

export const ContentScaffolding: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('recommended');
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<AdaptiveContent[]>([]);
  const [allContent, setAllContent] = useState<AdaptiveContent[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<ContentInteraction[]>([]);
  const [currentContent, setCurrentContent] = useState<AdaptiveContent | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [showingHints, setShowingHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [helpRequests, setHelpRequests] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [userLevel, setUserLevel] = useState<DifficultyLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser) {
      loadContentData();
    }
  }, [state.currentUser]);

  const loadContentData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDifficultyLevels(),
        loadRecommendedContent(),
        loadAllContent(),
        loadRecentInteractions(),
        determineUserLevel()
      ]);
    } catch (error) {
      console.error('Error loading content data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDifficultyLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('content_difficulty_levels')
        .select('*')
        .order('level_number', { ascending: true });

      if (error) {
        console.error('Error loading difficulty levels:', error);
        return;
      }

      setDifficultyLevels(data || []);

    } catch (error) {
      console.error('Error loading difficulty levels:', error);
    }
  };

  const loadRecommendedContent = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase.rpc(
        'get_recommended_content_for_student',
        { student_uuid: state.currentUser.id }
      );

      if (error) {
        console.error('Error loading recommended content:', error);
        return;
      }

      const recommendations: AdaptiveContent[] = (data || []).map((item: any) => ({
        id: item.content_id,
        content_type: item.content_type,
        title: item.content_title,
        content: '', // Will be loaded when needed
        difficulty_level: item.difficulty_level,
        subject_area: '',
        learning_objective: '',
        metacog_strategies: [],
        estimated_time_minutes: 0,
        is_recommended: true,
        recommendation_reason: item.recommendation_reason,
        confidence_score: item.confidence_score
      }));

      setRecommendedContent(recommendations);

    } catch (error) {
      console.error('Error loading recommended content:', error);
    }
  };

  const loadAllContent = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('adaptive_content')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) {
        console.error('Error loading all content:', error);
        return;
      }

      setAllContent(data || []);

    } catch (error) {
      console.error('Error loading all content:', error);
    }
  };

  const loadRecentInteractions = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('student_content_interactions')
        .select(`
          *,
          adaptive_content (
            title,
            content_type,
            difficulty_level
          )
        `)
        .eq('student_id', state.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading interactions:', error);
        return;
      }

      const interactions = (data || []).map((interaction: any) => ({
        id: interaction.id,
        content_id: interaction.content_id,
        interaction_type: interaction.interaction_type,
        performance_score: interaction.performance_score,
        time_spent_seconds: interaction.time_spent_seconds,
        help_requests: interaction.help_requests,
        hints_used: interaction.hints_used,
        created_at: interaction.created_at,
        content_title: interaction.adaptive_content?.title,
        content_type: interaction.adaptive_content?.content_type,
        difficulty_level: interaction.adaptive_content?.difficulty_level
      }));

      setRecentInteractions(interactions);

    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const determineUserLevel = async () => {
    if (!state.currentUser) return;

    const userScore = state.currentUser.metacog_score || 0;
    const level = difficultyLevels.find(l => 
      userScore >= l.min_metacog_score && userScore <= l.max_metacog_score
    );

    setUserLevel(level || null);
  };

  const startContent = async (content: AdaptiveContent) => {
    // Load full content details
    const { data, error } = await supabase
      .from('adaptive_content')
      .select('*')
      .eq('id', content.id)
      .single();

    if (error) {
      console.error('Error loading content details:', error);
      return;
    }

    setCurrentContent(data);
    setStartTime(new Date());
    setUserResponse('');
    setShowingHints(false);
    setHintsUsed(0);
    setHelpRequests(0);

    // Log content view
    await logInteraction(content.id, 'viewed', 0);
  };

  const logInteraction = async (
    contentId: string, 
    interactionType: string, 
    performanceScore: number = 0
  ) => {
    if (!state.currentUser || !startTime) return;

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      const { error } = await supabase
        .from('student_content_interactions')
        .insert({
          student_id: state.currentUser.id,
          content_id: contentId,
          interaction_type: interactionType,
          performance_score: performanceScore,
          time_spent_seconds: timeSpent,
          help_requests: helpRequests,
          hints_used: hintsUsed
        });

      if (error) {
        console.error('Error logging interaction:', error);
      }

    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  const submitResponse = async () => {
    if (!currentContent || !userResponse.trim()) return;

    // Simple scoring based on response length and keywords (in real implementation, use more sophisticated analysis)
    const responseLength = userResponse.trim().length;
    const keywordMatches = currentContent.metacog_strategies.filter(strategy =>
      userResponse.toLowerCase().includes(strategy.toLowerCase())
    ).length;
    
    const performanceScore = Math.min(1, (responseLength / 100 + keywordMatches * 0.2) / 2);

    await logInteraction(currentContent.id, 'completed', performanceScore);
    await loadRecentInteractions();

    // Show completion feedback
    alert(`Great work! You scored ${(performanceScore * 100).toFixed(0)}%`);
    
    setCurrentContent(null);
    setUserResponse('');
  };

  const requestHelp = () => {
    setHelpRequests(prev => prev + 1);
    setShowingHints(true);
  };

  const useHint = () => {
    setHintsUsed(prev => prev + 1);
    // In a real implementation, this would show progressive hints
    alert('Hint: Break the problem down into smaller steps and think about what strategy might work best.');
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800 border-green-300';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 4: return 'bg-orange-100 text-orange-800 border-orange-300';
      case 5: return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyName = (level: number) => {
    const diffLevel = difficultyLevels.find(l => l.level_number === level);
    return diffLevel?.level_name || `Level ${level}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Recommended Content Tab
  const RecommendedTab = () => (
    <div className="space-y-6">
      {userLevel && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            Based on your current metacognition score ({(state.currentUser?.metacog_score || 0).toFixed(2)}), 
            you're at the <strong>{userLevel.level_name}</strong> level. 
            Here's content tailored for you:
          </AlertDescription>
        </Alert>
      )}

      {recommendedContent.length > 0 ? (
        <div className="space-y-4">
          {recommendedContent.map((content) => (
            <Card key={content.id} className="border-l-4 border-blue-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {content.content_type === 'problem' && <Target className="w-6 h-6 text-blue-600" />}
                    {content.content_type === 'hint' && <Lightbulb className="w-6 h-6 text-yellow-600" />}
                    {content.content_type === 'scaffold' && <Layers className="w-6 h-6 text-green-600" />}
                    {content.content_type === 'reflection_prompt' && <Brain className="w-6 h-6 text-purple-600" />}
                    <div>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getDifficultyColor(content.difficulty_level)}>
                          {getDifficultyName(content.difficulty_level)}
                        </Badge>
                        <Badge variant="outline">{content.content_type.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Confidence: {((content.confidence_score || 0) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Reason: {content.recommendation_reason?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <div className="font-medium">{content.estimated_time_minutes || 10} minutes</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Focus:</span>
                    <div className="font-medium">{content.learning_objective || 'Problem solving'}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-1">
                    {content.metacog_strategies?.map((strategy, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {strategy}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => startContent(content)}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
            <p className="text-gray-600">Complete some activities to get personalized content recommendations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Progress Tab
  const ProgressTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Level</p>
                <p className="text-2xl font-bold">{userLevel?.level_name || 'Unknown'}</p>
              </div>
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {recentInteractions.filter(i => i.interaction_type === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {recentInteractions.length > 0 ? 
                    Math.round(recentInteractions.reduce((sum, i) => sum + (i.performance_score * 100), 0) / recentInteractions.length) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Level */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {difficultyLevels.map((level) => {
              const levelInteractions = recentInteractions.filter(i => i.difficulty_level === level.level_number);
              const completedCount = levelInteractions.filter(i => i.interaction_type === 'completed').length;
              const avgScore = levelInteractions.length > 0 ? 
                levelInteractions.reduce((sum, i) => sum + i.performance_score, 0) / levelInteractions.length * 100 : 0;

              return (
                <div key={level.level_number} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(level.level_number)}>
                        {level.level_name}
                      </Badge>
                      <span className="text-sm text-gray-600">{level.description}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {completedCount} completed, {avgScore.toFixed(0)}% avg
                    </div>
                  </div>
                  <Progress value={Math.min(100, (completedCount / 5) * 100)} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInteractions.length > 0 ? (
            <div className="space-y-3">
              {recentInteractions.slice(0, 5).map((interaction) => (
                <div key={interaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {interaction.interaction_type === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {interaction.interaction_type === 'viewed' && <Eye className="w-5 h-5 text-blue-600" />}
                    {interaction.interaction_type === 'attempted' && <Target className="w-5 h-5 text-orange-600" />}
                    <div>
                      <div className="font-medium">{interaction.content_title}</div>
                      <div className="text-sm text-gray-600">
                        {interaction.content_type.replace('_', ' ')} • {formatTime(interaction.time_spent_seconds)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {Math.round(interaction.performance_score * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(interaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Content Viewer for when working on content
  if (currentContent) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentContent.content_type === 'problem' && <Target className="w-6 h-6 text-blue-600" />}
            {currentContent.content_type === 'hint' && <Lightbulb className="w-6 h-6 text-yellow-600" />}
            {currentContent.content_type === 'scaffold' && <Layers className="w-6 h-6 text-green-600" />}
            {currentContent.content_type === 'reflection_prompt' && <Brain className="w-6 h-6 text-purple-600" />}
            <div>
              <h1 className="text-2xl font-bold">{currentContent.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getDifficultyColor(currentContent.difficulty_level)}>
                  {getDifficultyName(currentContent.difficulty_level)}
                </Badge>
                <Badge variant="outline">{currentContent.subject_area}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setCurrentContent(null)} variant="outline">
            Exit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentContent.content_type.replace('_', ' ')}</CardTitle>
            <p className="text-gray-600">{currentContent.learning_objective}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap font-sans">{currentContent.content}</pre>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Response:</label>
                <Textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Explain your thinking process and solution..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={requestHelp} variant="outline" size="sm" className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help ({helpRequests})
                  </Button>
                  <Button onClick={useHint} variant="outline" size="sm" className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Hint ({hintsUsed})
                  </Button>
                </div>
                <Button 
                  onClick={submitResponse} 
                  disabled={!userResponse.trim()}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit
                </Button>
              </div>

              {showingHints && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Think about what metacognitive strategies you're using. Consider planning, monitoring, and evaluation steps.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-1">
                {currentContent.metacog_strategies?.map((strategy, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {strategy}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access adaptive content.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adaptive Learning</h1>
          <p className="text-gray-600 mt-2">
            Personalized content that adapts to your metacognitive development
          </p>
        </div>
        {userLevel && (
          <div className="text-center">
            <Badge className={`${getDifficultyColor(userLevel.level_number)} text-lg px-3 py-1`}>
              {userLevel.level_name}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Your Level</div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Recommended ({recommendedContent.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="mt-6">
          <RecommendedTab />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTab />
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading content...</p>
        </div>
      )}
    </div>
  );
};