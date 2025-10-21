import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  RotateCcw, 
  Target, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Clock,
  Lightbulb,
  Award
} from 'lucide-react';

interface RetrySession {
  id: string;
  problem_id: string;
  problem_title: string;
  strategy_used: string;
  original_attempt_score: number;
  retry_attempts: RetryAttempt[];
  created_at: string;
}

interface RetryAttempt {
  attempt_number: number;
  strategy_changed: boolean;
  new_strategy?: string;
  score: number;
  time_spent: number;
  confidence_level: number;
  reflection_notes?: string;
  timestamp: string;
}

interface RetryStats {
  total_retries: number;
  success_rate: number;
  avg_improvement: number;
  strategy_switches: number;
  most_effective_strategy: string;
}

export const RetryTracker: React.FC<{ problemId?: string; onRetryComplete?: (improvement: number) => void }> = ({ 
  problemId, 
  onRetryComplete 
}) => {
  const { state } = useAppContext();
  const [currentSession, setCurrentSession] = useState<RetrySession | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStats, setRetryStats] = useState<RetryStats | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [reflectionNotes, setReflectionNotes] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (problemId) {
      loadRetrySession();
    }
    loadRetryStats();
  }, [problemId]);

  const loadRetrySession = async () => {
    if (!problemId || !state.currentUser) return;

    try {
      // Check if there's an existing retry session for this problem
      const { data: events, error } = await supabase
        .from('metacog_events')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .eq('event_type', 'retry_started')
        .contains('payload', { problem_id: problemId })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading retry session:', error);
        return;
      }

      if (events && events.length > 0) {
        const sessionEvent = events[0];
        
        // Load all retry attempts for this session
        const { data: attempts, error: attemptsError } = await supabase
          .from('metacog_events')
          .select('*')
          .eq('user_id', state.currentUser.id)
          .in('event_type', ['retry_attempt', 'retry_completed'])
          .contains('payload', { problem_id: problemId })
          .gte('created_at', sessionEvent.created_at)
          .order('created_at', { ascending: true });

        if (attemptsError) {
          console.error('Error loading retry attempts:', attemptsError);
          return;
        }

        // Build retry session object
        const session: RetrySession = {
          id: sessionEvent.id,
          problem_id: problemId,
          problem_title: sessionEvent.payload.problem_title || 'Problem',
          strategy_used: sessionEvent.payload.original_strategy || '',
          original_attempt_score: sessionEvent.payload.original_score || 0,
          retry_attempts: (attempts || []).map((attempt, index) => ({
            attempt_number: index + 1,
            strategy_changed: attempt.payload.strategy_changed || false,
            new_strategy: attempt.payload.new_strategy,
            score: attempt.payload.score || 0,
            time_spent: attempt.payload.time_spent || 0,
            confidence_level: attempt.payload.confidence_level || 3,
            reflection_notes: attempt.payload.reflection_notes,
            timestamp: attempt.created_at
          })),
          created_at: sessionEvent.created_at
        };

        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Error loading retry session:', error);
    }
  };

  const loadRetryStats = async () => {
    if (!state.currentUser) return;

    try {
      // Get all retry events for the user
      const { data: retryEvents, error } = await supabase
        .from('metacog_events')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .in('event_type', ['retry_started', 'retry_attempt', 'retry_completed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading retry stats:', error);
        return;
      }

      if (!retryEvents || retryEvents.length === 0) return;

      // Process statistics
      const sessions = new Map<string, any>();
      const strategies = new Map<string, { attempts: number; total_improvement: number }>();

      let totalRetries = 0;
      let successfulRetries = 0;
      let totalImprovement = 0;
      let strategyChanges = 0;

      retryEvents.forEach(event => {
        const problemId = event.payload.problem_id;
        
        if (!sessions.has(problemId)) {
          sessions.set(problemId, {
            original_score: event.payload.original_score || 0,
            attempts: [],
            start_strategy: event.payload.original_strategy || 'unknown'
          });
        }

        if (event.event_type === 'retry_attempt' || event.event_type === 'retry_completed') {
          const session = sessions.get(problemId);
          const score = event.payload.score || 0;
          const improvement = score - session.original_score;
          
          session.attempts.push({
            score,
            improvement,
            strategy: event.payload.new_strategy || session.start_strategy,
            strategy_changed: event.payload.strategy_changed || false
          });

          totalRetries++;
          if (improvement > 0) successfulRetries++;
          totalImprovement += improvement;

          if (event.payload.strategy_changed) strategyChanges++;

          // Track strategy effectiveness
          const strategy = event.payload.new_strategy || session.start_strategy;
          if (!strategies.has(strategy)) {
            strategies.set(strategy, { attempts: 0, total_improvement: 0 });
          }
          const strategyStats = strategies.get(strategy)!;
          strategyStats.attempts++;
          strategyStats.total_improvement += improvement;
        }
      });

      // Find most effective strategy
      let mostEffectiveStrategy = 'none';
      let bestAvgImprovement = -Infinity;

      strategies.forEach((stats, strategy) => {
        const avgImprovement = stats.total_improvement / stats.attempts;
        if (avgImprovement > bestAvgImprovement) {
          bestAvgImprovement = avgImprovement;
          mostEffectiveStrategy = strategy;
        }
      });

      setRetryStats({
        total_retries: totalRetries,
        success_rate: totalRetries > 0 ? successfulRetries / totalRetries : 0,
        avg_improvement: totalRetries > 0 ? totalImprovement / totalRetries : 0,
        strategy_switches: strategyChanges,
        most_effective_strategy: mostEffectiveStrategy
      });

    } catch (error) {
      console.error('Error calculating retry stats:', error);
    }
  };

  const startRetry = async (originalScore: number, problemTitle: string, originalStrategy: string) => {
    if (!state.currentUser || !problemId) return;

    setIsRetrying(true);
    setStartTime(new Date());
    setCurrentStrategy(originalStrategy);

    try {
      // Log retry started event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'retry_started',
        p_user_id: state.currentUser.id,
        p_payload: {
          problem_id: problemId,
          problem_title: problemTitle,
          original_score: originalScore,
          original_strategy: originalStrategy
        }
      });

      // Create new session
      const newSession: RetrySession = {
        id: Date.now().toString(),
        problem_id: problemId,
        problem_title: problemTitle,
        strategy_used: originalStrategy,
        original_attempt_score: originalScore,
        retry_attempts: [],
        created_at: new Date().toISOString()
      };

      setCurrentSession(newSession);

    } catch (error) {
      console.error('Error starting retry:', error);
      setIsRetrying(false);
    }
  };

  const submitRetryAttempt = async (newScore: number) => {
    if (!currentSession || !state.currentUser || !startTime) return;

    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
    const strategyChanged = currentStrategy !== currentSession.strategy_used;
    const improvement = newScore - currentSession.original_attempt_score;

    try {
      // Log retry attempt event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'retry_attempt',
        p_user_id: state.currentUser.id,
        p_payload: {
          problem_id: currentSession.problem_id,
          attempt_number: currentSession.retry_attempts.length + 1,
          score: newScore,
          improvement: improvement,
          time_spent: timeSpent,
          strategy_changed: strategyChanged,
          new_strategy: strategyChanged ? currentStrategy : null,
          confidence_level: confidenceLevel,
          reflection_notes: reflectionNotes
        }
      });

      // Update current session
      const newAttempt: RetryAttempt = {
        attempt_number: currentSession.retry_attempts.length + 1,
        strategy_changed: strategyChanged,
        new_strategy: strategyChanged ? currentStrategy : undefined,
        score: newScore,
        time_spent: timeSpent,
        confidence_level: confidenceLevel,
        reflection_notes: reflectionNotes,
        timestamp: new Date().toISOString()
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        retry_attempts: [...prev.retry_attempts, newAttempt]
      } : null);

      // Reset for next attempt
      setReflectionNotes('');
      setStartTime(new Date());

      // Call completion callback
      if (onRetryComplete) {
        onRetryComplete(improvement);
      }

      // Reload stats
      await loadRetryStats();

    } catch (error) {
      console.error('Error submitting retry attempt:', error);
    }
  };

  const completeRetrySession = async () => {
    if (!currentSession || !state.currentUser) return;

    try {
      const totalImprovement = currentSession.retry_attempts.reduce((sum, attempt) => {
        return sum + (attempt.score - currentSession.original_attempt_score);
      }, 0);

      await supabase.rpc('log_metacog_event', {
        p_event_type: 'retry_completed',
        p_user_id: state.currentUser.id,
        p_payload: {
          problem_id: currentSession.problem_id,
          total_attempts: currentSession.retry_attempts.length,
          total_improvement: totalImprovement,
          final_score: currentSession.retry_attempts[currentSession.retry_attempts.length - 1]?.score || currentSession.original_attempt_score
        }
      });

      setIsRetrying(false);
      setCurrentSession(null);
      
    } catch (error) {
      console.error('Error completing retry session:', error);
    }
  };

  // Component for retry statistics
  const RetryStatsCard = () => {
    if (!retryStats) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Retry Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{retryStats.total_retries}</div>
              <div className="text-sm text-gray-600">Total Retries</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(retryStats.success_rate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Avg Improvement:</span>
              <span className={`font-medium ${retryStats.avg_improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {retryStats.avg_improvement > 0 ? '+' : ''}{retryStats.avg_improvement.toFixed(1)} points
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Strategy Changes:</span>
              <span className="font-medium">{retryStats.strategy_switches}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Best Strategy:</span>
              <Badge variant="secondary">{retryStats.most_effective_strategy}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // If no problem ID, show stats only
  if (!problemId) {
    return (
      <div className="space-y-6">
        <RetryStatsCard />
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Retry tracking is automatically enabled when you work on problems. 
            Come back after attempting some problems to see your retry patterns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Retry Session: {currentSession.problem_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Original Score: {currentSession.original_attempt_score}</div>
                <div className="text-sm text-gray-600">Strategy: {currentSession.strategy_used}</div>
              </div>
              <Badge variant="outline">
                {currentSession.retry_attempts.length} attempts
              </Badge>
            </div>

            {/* Retry Attempts */}
            {currentSession.retry_attempts.map((attempt, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    attempt.score > currentSession.original_attempt_score 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}>
                    {attempt.attempt_number}
                  </div>
                  <div>
                    <div className="font-medium">Score: {attempt.score}</div>
                    <div className="text-sm text-gray-600">
                      {attempt.strategy_changed ? `Strategy: ${attempt.new_strategy}` : 'Same strategy'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    attempt.score > currentSession.original_attempt_score ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {attempt.score > currentSession.original_attempt_score ? '+' : ''}
                    {attempt.score - currentSession.original_attempt_score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.floor(attempt.time_spent / 60)}:{(attempt.time_spent % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}

            {isRetrying && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium">Record Your Next Attempt</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Strategy (if changed):</label>
                    <input
                      type="text"
                      value={currentStrategy}
                      onChange={(e) => setCurrentStrategy(e.target.value)}
                      placeholder="Enter new strategy if different"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confidence Level: {confidenceLevel}/5
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reflection Notes:</label>
                    <textarea
                      value={reflectionNotes}
                      onChange={(e) => setReflectionNotes(e.target.value)}
                      placeholder="What did you learn? What would you do differently?"
                      className="w-full p-2 border rounded-md h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // This would be called with the actual new score from the problem component
                      // For demo purposes, using a random improvement
                      const improvement = Math.random() * 20 - 5; // -5 to +15 points
                      const newScore = Math.max(0, currentSession.original_attempt_score + improvement);
                      submitRetryAttempt(newScore);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Attempt
                  </Button>
                  <Button onClick={completeRetrySession} variant="outline">
                    End Session
                  </Button>
                </div>
              </div>
            )}

            {!isRetrying && (
              <Button 
                onClick={() => setIsRetrying(true)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Start Retry Button (if no current session) */}
      {!currentSession && (
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Retry?</h3>
            <p className="text-gray-600 mb-4">
              Track your improvement as you work through this problem again with different strategies.
            </p>
            <Button 
              onClick={() => {
                // This would be called with actual problem data
                startRetry(75, "Sample Problem", "Trial and Error");
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Start Retry Session
            </Button>
          </CardContent>
        </Card>
      )}

      <RetryStatsCard />
    </div>
  );
};