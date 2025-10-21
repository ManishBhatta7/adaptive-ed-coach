import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  Clock,
  BarChart3
} from 'lucide-react';
import { StudentProfile, CoachingMode } from '@/types';
import { ProgressAnalysisService, ProgressInsight } from '@/services/ProgressAnalysisService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { LearningStyleBadge } from '@/components/learning-style/LearningStyleBadge';

interface PersonalizedInsightsProps {
  studentProfile: StudentProfile;
  timeRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  coachingMode?: CoachingMode;
  className?: string;
}

export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  studentProfile,
  timeRange = 'month',
  coachingMode = CoachingMode.DETAILED_INSIGHT,
  className = ''
}) => {
  const [insights, setInsights] = useState<ProgressInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    const generateInsights = async () => {
      setIsLoading(true);
      try {
        const generatedInsights = await ProgressAnalysisService.generateProgressInsights(
          studentProfile,
          timeRange
        );
        setInsights(generatedInsights);
      } catch (error) {
        console.error('Error generating insights:', error);
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [studentProfile, timeRange]);

  const getInsightIcon = (category: ProgressInsight['category']) => {
    switch (category) {
      case 'strength':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'improvement':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'pattern':
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-purple-600" />;
    }
  };

  const getCategoryColor = (category: ProgressInsight['category']) => {
    switch (category) {
      case 'strength':
        return 'bg-green-50 border-green-200';
      case 'improvement':
        return 'bg-orange-50 border-orange-200';
      case 'pattern':
        return 'bg-blue-50 border-blue-200';
      case 'recommendation':
        return 'bg-purple-50 border-purple-200';
    }
  };

  const getCategoryBadgeVariant = (category: ProgressInsight['category']) => {
    switch (category) {
      case 'strength':
        return 'default';
      case 'improvement':
        return 'secondary';
      case 'pattern':
        return 'outline';
      case 'recommendation':
        return 'secondary';
    }
  };

  const getPriorityInsights = () => {
    return insights.filter(insight => 
      insight.category === 'improvement' || 
      (insight.category === 'recommendation' && insight.confidence > 80)
    ).slice(0, 2);
  };

  const getStrengthInsights = () => {
    return insights.filter(insight => insight.category === 'strength').slice(0, 2);
  };

  const getPatternInsights = () => {
    return insights.filter(insight => 
      insight.category === 'pattern' || 
      (insight.category === 'recommendation' && insight.confidence <= 80)
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Generating Personalized Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Personalized Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Complete more assignments to unlock personalized insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your Learning Insights
            </div>
            <Badge variant="outline" className="text-xs">
              {timeRange} view • {insights.length} insights
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Priority Areas */}
          {getPriorityInsights().length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Priority Areas
              </h3>
              <div className="space-y-3">
                {getPriorityInsights().map((insight, index) => (
                  <Card key={`priority-${index}`} className={getCategoryColor(insight.category)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getInsightIcon(insight.category)}
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <Progress value={insight.confidence} className="h-2 flex-1" />
                              <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                            </div>
                            <div className="space-y-1">
                              {insight.actionItems.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getCategoryBadgeVariant(insight.category)}>
                          {insight.timeframe}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {getStrengthInsights().length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Your Strengths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getStrengthInsights().map((insight, index) => (
                  <Card key={`strength-${index}`} className={getCategoryColor(insight.category)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {getInsightIcon(insight.category)}
                        <h4 className="font-medium">{insight.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={insight.confidence} className="h-2 flex-1" />
                        <span className="text-xs text-gray-500">{insight.confidence}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Learning Patterns & Recommendations */}
          {getPatternInsights().length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Learning Patterns & Recommendations
              </h3>
              <div className="space-y-3">
                {getPatternInsights().map((insight, index) => (
                  <Collapsible key={`pattern-${index}`}>
                    <Card className={getCategoryColor(insight.category)}>
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getInsightIcon(insight.category)}
                              <div>
                                <h4 className="font-medium">{insight.title}</h4>
                                <p className="text-sm text-gray-600">{insight.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getCategoryBadgeVariant(insight.category)}>
                                {insight.confidence}%
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4">
                          <div className="border-t pt-3">
                            <h5 className="text-sm font-medium mb-2">Recommended Actions:</h5>
                            <div className="space-y-1">
                              {insight.actionItems.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}

          {/* Learning Style Integration */}
          {studentProfile.primaryLearningStyle && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">Learning Style Optimization</h4>
                  </div>
                  <LearningStyleBadge 
                    learningStyle={studentProfile.primaryLearningStyle} 
                    variant="compact"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Your insights are personalized for {studentProfile.primaryLearningStyle.replace('_', ' ')} learners.
                </p>
                <Button variant="outline" size="sm" className="text-purple-600 border-purple-200">
                  View Full Learning Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};