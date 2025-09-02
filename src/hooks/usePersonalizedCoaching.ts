import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfile, CoachingMode } from '@/types';
import { ProgressAnalysisService, PersonalizedCoachingContext } from '@/services/ProgressAnalysisService';

export interface PersonalizedFeedback {
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
  personalizedRecommendations: string[];
  learningStyleTips: string[];
  progressAcknowledgment?: string;
}

export const usePersonalizedCoaching = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonalizedFeedback = useCallback(async (
    studentProfile: StudentProfile,
    submissionData: any,
    coachingMode: CoachingMode = CoachingMode.DETAILED_INSIGHT
  ): Promise<PersonalizedFeedback | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create personalized coaching context
      const coachingContext = await ProgressAnalysisService.createCoachingContext(
        studentProfile,
        coachingMode
      );

      // Generate personalized prompt
      const personalizedPrompt = ProgressAnalysisService.generatePersonalizedCoachingPrompt(
        coachingContext,
        submissionData
      );

      // Enhanced prompt for structured response
      const enhancedPrompt = `${personalizedPrompt}

## REQUIRED RESPONSE FORMAT:
Please structure your response as a JSON object with these exact fields:

{
  "feedback": "Main feedback paragraph that feels personal and acknowledges their learning journey",
  "strengths": ["List of specific strengths observed in this submission"],
  "improvementAreas": ["Areas that need attention, framed constructively"],
  "personalizedRecommendations": ["Specific actions tailored to their learning style and history"],
  "learningStyleTips": ["Tips specifically for their ${coachingContext.learningStyle.primary} learning style"],
  "progressAcknowledgment": "How this submission relates to their learning journey and progress"
}

Make the feedback feel personal, encouraging, and show that you understand their learning journey. Reference their ${coachingContext.performanceHistory.length} previous submissions and ${coachingContext.learningStyle.primary} learning style.`;

      // Call the Gemini agent with personalized context
      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          message: enhancedPrompt,
          context: 'personalized_coaching',
          studentContext: {
            learningStyle: coachingContext.learningStyle,
            performanceCount: coachingContext.performanceHistory.length,
            recentTrend: coachingContext.recentTrends.overall,
            strugglingAreas: coachingContext.strugglingAreas,
            strengths: coachingContext.strengths
          }
        }
      });

      if (error) {
        console.error('Error getting personalized feedback:', error);
        setError('Failed to generate personalized feedback');
        return null;
      }

      // Parse the response
      let parsedFeedback: PersonalizedFeedback;
      
      try {
        // Try to parse as JSON first
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedFeedback = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create structured response from plain text
          parsedFeedback = parseUnstructuredResponse(data.response, coachingContext);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback:', parseError);
        parsedFeedback = parseUnstructuredResponse(data.response, coachingContext);
      }

      return parsedFeedback;

    } catch (err) {
      console.error('Error in personalized coaching:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getQuickCoachingTip = useCallback(async (
    studentProfile: StudentProfile,
    subject?: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const coachingContext = await ProgressAnalysisService.createCoachingContext(
        studentProfile,
        CoachingMode.QUICK_FEEDBACK
      );

      const prompt = `Based on this student's profile, give a quick personalized learning tip:

Learning Style: ${coachingContext.learningStyle.primary}
Recent Trend: ${coachingContext.recentTrends.overall > 0 ? 'Improving' : 'Needs focus'}
${subject ? `Subject: ${subject}` : ''}
Struggling Areas: ${coachingContext.strugglingAreas.join(', ') || 'None identified'}

Provide a concise, encouraging tip (1-2 sentences) that's personalized to their learning style and current progress.`;

      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          message: prompt,
          context: 'quick_tip'
        }
      });

      if (error) {
        setError('Failed to get coaching tip');
        return null;
      }

      return data.response;

    } catch (err) {
      console.error('Error getting coaching tip:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getPersonalizedFeedback,
    getQuickCoachingTip,
    isLoading,
    error
  };
};

// Helper function to parse unstructured responses
function parseUnstructuredResponse(
  response: string, 
  context: PersonalizedCoachingContext
): PersonalizedFeedback {
  return {
    feedback: response,
    strengths: extractBulletPoints(response, ['strength', 'good', 'well done', 'excellent']),
    improvementAreas: extractBulletPoints(response, ['improve', 'work on', 'focus on', 'consider']),
    personalizedRecommendations: extractBulletPoints(response, ['recommend', 'suggest', 'try', 'next step']),
    learningStyleTips: context.learningStyle.primary ? 
      [`As a ${context.learningStyle.primary.replace('_', ' ')} learner, focus on methods that work best for your style.`] : [],
    progressAcknowledgment: context.performanceHistory.length > 0 ? 
      `Based on your ${context.performanceHistory.length} previous submissions, you're making progress.` : undefined
  };
}

function extractBulletPoints(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return sentences
    .filter(sentence => 
      keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .map(sentence => sentence.trim())
    .slice(0, 3); // Limit to 3 items
}