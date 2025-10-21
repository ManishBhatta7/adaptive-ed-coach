import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { Reflection } from '@/types/metacog';
import { 
  BookOpen, 
  Download, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Brain,
  FileText,
  BarChart3,
  Share
} from 'lucide-react';

interface WeeklyData {
  weekStart: Date;
  weekEnd: Date;
  reflections: Reflection[];
  metacogScore: number;
  strategiesUsed: Record<string, number>;
  averageQuality: number;
  insights: string[];
}

interface JournalEntry {
  week: string;
  data: WeeklyData;
  exportFormat?: 'pdf' | 'text' | 'json';
}

export const WeeklyJournal: React.FC = () => {
  const { state } = useAppContext();
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [journalData, setJournalData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser) {
      fetchWeeklyData(selectedWeek);
    }
  }, [state.currentUser, selectedWeek]);

  const getWeekBounds = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  const fetchWeeklyData = async (weekDate: Date) => {
    if (!state.currentUser) return;

    setLoading(true);
    try {
      const { start: weekStart, end: weekEnd } = getWeekBounds(weekDate);

      // Fetch reflections for the week
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflections')
        .select('*')
        .eq('student_id', state.currentUser.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: true });

      if (reflectionsError) {
        console.error('Error fetching reflections:', reflectionsError);
        return;
      }

      // Get user's profile for metacog score
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('metacog_score')
        .eq('id', state.currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Process weekly data
      const weeklyData = processWeeklyData(
        weekStart, 
        weekEnd, 
        reflections || [], 
        profile?.metacog_score || 0
      );

      setJournalData(weeklyData);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (
    weekStart: Date, 
    weekEnd: Date, 
    reflections: Reflection[], 
    metacogScore: number
  ): WeeklyData => {
    // Calculate strategy usage
    const strategiesUsed: Record<string, number> = {};
    reflections.forEach(r => {
      if (r.strategy_used) {
        strategiesUsed[r.strategy_used] = (strategiesUsed[r.strategy_used] || 0) + 1;
      }
    });

    // Calculate average quality (simplified)
    const qualityScores = reflections.map(r => {
      let quality = 0;
      if (r.reflection_text && r.reflection_text.length > 50) quality += 0.3;
      if (r.reflection_text && /because|since|therefore|however|although/i.test(r.reflection_text)) quality += 0.3;
      if (r.was_helpful) quality += 0.2;
      if (r.teacher_rating !== null) quality += r.teacher_rating * 0.2;
      return quality;
    });

    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length 
      : 0;

    // Generate insights
    const insights = generateWeeklyInsights(reflections, strategiesUsed, averageQuality);

    return {
      weekStart,
      weekEnd,
      reflections,
      metacogScore,
      strategiesUsed,
      averageQuality,
      insights
    };
  };

  const generateWeeklyInsights = (
    reflections: Reflection[], 
    strategies: Record<string, number>, 
    avgQuality: number
  ): string[] => {
    const insights: string[] = [];

    if (reflections.length === 0) {
      insights.push("No reflections this week. Consider reflecting on your problem-solving approaches!");
      return insights;
    }

    // Reflection frequency insight
    if (reflections.length >= 5) {
      insights.push("🎉 Excellent reflection habit! You reflected consistently this week.");
    } else if (reflections.length >= 3) {
      insights.push("👍 Good reflection frequency. Try to reflect daily for deeper insights.");
    } else {
      insights.push("📝 Consider reflecting more often to build stronger metacognitive skills.");
    }

    // Strategy diversity insight
    const uniqueStrategies = Object.keys(strategies).length;
    if (uniqueStrategies >= 4) {
      insights.push("🎯 Great strategy diversity! You're exploring different problem-solving approaches.");
    } else if (uniqueStrategies >= 2) {
      insights.push("🔄 You used multiple strategies. Try experimenting with more approaches next week.");
    } else {
      insights.push("💡 Consider trying different strategies to expand your problem-solving toolkit.");
    }

    // Quality insight
    if (avgQuality > 0.7) {
      insights.push("⭐ High-quality reflections! Your explanations show deep thinking.");
    } else if (avgQuality > 0.4) {
      insights.push("📈 Your reflections are developing. Try explaining 'why' more often.");
    } else {
      insights.push("🎓 Focus on explaining your reasoning to improve reflection quality.");
    }

    // Most used strategy insight
    const topStrategy = Object.entries(strategies).sort(([,a], [,b]) => b - a)[0];
    if (topStrategy) {
      insights.push(`🔧 Your go-to strategy this week was "${topStrategy[0]}" (${topStrategy[1]} times).`);
    }

    // Helpfulness pattern
    const helpfulCount = reflections.filter(r => r.was_helpful).length;
    const helpfulRate = helpfulCount / reflections.length;
    if (helpfulRate > 0.8) {
      insights.push("✅ Most strategies were helpful! You're choosing effective approaches.");
    } else if (helpfulRate < 0.5) {
      insights.push("🤔 Many strategies weren't helpful. Consider why and try different approaches.");
    }

    return insights;
  };

  const exportJournal = async (format: 'pdf' | 'text' | 'json' = 'text') => {
    if (!journalData) return;

    setExportLoading(true);
    try {
      const weekRange = `${journalData.weekStart.toLocaleDateString()} - ${journalData.weekEnd.toLocaleDateString()}`;
      
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify({
            week: weekRange,
            reflections: journalData.reflections,
            metacogScore: journalData.metacogScore,
            strategiesUsed: journalData.strategiesUsed,
            averageQuality: journalData.averageQuality,
            insights: journalData.insights
          }, null, 2);
          filename = `metacognition-journal-${weekRange.replace(/[/\\]/g, '-')}.json`;
          mimeType = 'application/json';
          break;

        case 'text':
        default:
          content = generateTextReport(journalData, weekRange);
          filename = `metacognition-journal-${weekRange.replace(/[/\\]/g, '-')}.txt`;
          mimeType = 'text/plain';
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export event
      if (state.currentUser) {
        await supabase.rpc('log_metacog_event', {
          p_event_type: 'journal_exported',
          p_user_id: state.currentUser.id,
          p_payload: {
            format,
            week: weekRange,
            reflections_count: journalData.reflections.length
          }
        });
      }

    } catch (error) {
      console.error('Error exporting journal:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const generateTextReport = (data: WeeklyData, weekRange: string): string => {
    return `
METACOGNITION WEEKLY JOURNAL
${weekRange}

OVERVIEW
========
Reflections This Week: ${data.reflections.length}
Metacognition Score: ${data.metacogScore.toFixed(2)}
Average Reflection Quality: ${(data.averageQuality * 100).toFixed(1)}%

STRATEGY USAGE
==============
${Object.entries(data.strategiesUsed)
  .sort(([,a], [,b]) => b - a)
  .map(([strategy, count]) => `${strategy}: ${count} times`)
  .join('\n')}

INSIGHTS
========
${data.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

REFLECTIONS DETAIL
==================
${data.reflections.map((r, i) => `
${i + 1}. ${new Date(r.created_at || '').toLocaleDateString()}
   Strategy: ${r.strategy_used}
   Problem: ${r.problem_description}
   Reflection: ${r.reflection_text}
   Helpful: ${r.was_helpful ? 'Yes' : 'No'}
   ${r.teacher_rating !== null ? `Teacher Rating: ${r.teacher_rating}/2` : ''}
   ${r.ai_feedback ? `AI Feedback: ${r.ai_feedback}` : ''}
`).join('\n')}

Generated on ${new Date().toLocaleString()}
    `.trim();
  };

  const shareJournal = async () => {
    if (!journalData) return;

    const weekRange = `${journalData.weekStart.toLocaleDateString()} - ${journalData.weekEnd.toLocaleDateString()}`;
    const summary = `My metacognition journey this week (${weekRange}):
📊 ${journalData.reflections.length} reflections
🎯 Score: ${journalData.metacogScore.toFixed(2)}
💡 Top strategy: ${Object.entries(journalData.strategiesUsed).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}

Growing as a learner! 🌱 #Metacognition #Learning`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Metacognition Weekly Journal',
          text: summary,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(summary);
      alert('Summary copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Week Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Weekly Metacognition Journal
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Reflect on your learning journey and track your growth over time
              </p>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {journalData ? 
                      `${journalData.weekStart.toLocaleDateString()} - ${journalData.weekEnd.toLocaleDateString()}`
                      : 'Select Week'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedWeek}
                    onSelect={(date) => date && setSelectedWeek(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      {journalData && (
        <>
          {/* Weekly Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{journalData.reflections.length}</p>
                    <p className="text-sm text-gray-600">Reflections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{journalData.metacogScore.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Metacog Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(journalData.averageQuality * 100).toFixed(0)}%</p>
                    <p className="text-sm text-gray-600">Quality Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Object.keys(journalData.strategiesUsed).length}</p>
                    <p className="text-sm text-gray-600">Strategies Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {journalData.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategy Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(journalData.strategiesUsed).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(journalData.strategiesUsed)
                    .sort(([,a], [,b]) => b - a)
                    .map(([strategy, count]) => (
                      <div key={strategy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{strategy}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-4">
                  No strategies recorded this week
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Reflections */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              {journalData.reflections.length > 0 ? (
                <div className="space-y-4">
                  {journalData.reflections.slice(0, 5).map((reflection) => (
                    <div key={reflection.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{reflection.strategy_used}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(reflection.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{reflection.problem_description}</p>
                      <p className="text-sm text-gray-600">{reflection.reflection_text}</p>
                      {reflection.teacher_rating !== null && (
                        <Badge className="mt-2">Teacher: {reflection.teacher_rating}/2 ⭐</Badge>
                      )}
                    </div>
                  ))}
                  {journalData.reflections.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {journalData.reflections.length - 5} more reflections...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">
                  No reflections this week. Start reflecting to see your progress!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Share Your Progress</CardTitle>
              <p className="text-sm text-gray-600">
                Export your weekly journal or share your metacognition journey
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => exportJournal('text')}
                  disabled={exportLoading}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as Text
                </Button>
                <Button 
                  onClick={() => exportJournal('json')}
                  disabled={exportLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </Button>
                <Button 
                  onClick={shareJournal}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Share Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};