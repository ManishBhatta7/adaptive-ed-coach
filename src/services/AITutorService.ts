import { supabase } from '@/integrations/supabase/client';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  response: string;
  model: string;
  tokens?: number;
  error?: string;
}

interface Interaction {
  student_input?: string;
  ai_response?: string;
}

export class AITutorService {
  /**
   * Call Gemini API through Supabase Edge Function
   */
  static async callGemini(
    prompt: string,
    sessionId: string,
    systemContext?: string,
    temperature: number = 0.7
  ): Promise<AIResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt,
          sessionId,
          systemContext,
          temperature,
        },
      });

      if (error) {
        console.error('Gemini API error:', error);
        return {
          response: 'Sorry, I encountered an error. Please try again.',
          model: 'gemini',
          error: error instanceof Error ? error.message : String(error),
        };
      }

      return {
        response: data?.response || data?.choices?.[0]?.message?.content || 'No response',
        model: 'gemini',
        tokens: data?.usage?.total_tokens,
      };
    } catch (err) {
      console.error('Gemini call failed:', err);
      return {
        response: 'Failed to connect to Gemini. Please check your connection.',
        model: 'gemini',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Call OpenAI GPT API through Supabase Edge Function
   */
  static async callOpenAI(
    prompt: string,
    sessionId: string,
    systemContext?: string,
    temperature: number = 0.7
  ): Promise<AIResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          prompt,
          sessionId,
          systemContext,
          temperature,
          model: 'gpt-4-turbo-preview',
        },
      });

      if (error) {
        console.error('OpenAI API error:', error);
        return {
          response: 'Sorry, I encountered an error. Please try again.',
          model: 'gpt-4',
          error: error instanceof Error ? error.message : String(error),
        };
      }

      return {
        response: data?.response || data?.choices?.[0]?.message?.content || 'No response',
        model: 'gpt-4',
        tokens: data?.usage?.total_tokens,
      };
    } catch (err) {
      console.error('OpenAI call failed:', err);
      return {
        response: 'Failed to connect to GPT-4. Please check your connection.',
        model: 'gpt-4',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Unified call method that routes to the selected model
   */
  static async callAI(
    prompt: string,
    model: 'gemini' | 'gpt',
    sessionId: string,
    systemContext?: string,
    temperature: number = 0.7
  ): Promise<AIResponse> {
    if (model === 'gemini') {
      return this.callGemini(prompt, sessionId, systemContext, temperature);
    } else {
      return this.callOpenAI(prompt, sessionId, systemContext, temperature);
    }
  }

  /**
   * Generate a tutor-specific system context
   */
  static generateTutorContext(
    topic: string,
    learningStyle: string,
    difficultyLevel: number,
    personality: string
  ): string {
    return `You are an expert educational AI tutor for RetainLearn. 
    
Topic: ${topic}
Student Learning Style: ${learningStyle}
Difficulty Level: ${difficultyLevel}/5
Tutor Personality: ${personality}

Guidelines:
- Adapt your teaching to the student's learning style
- Provide clear, step-by-step explanations
- Use relevant examples and analogies
- Encourage critical thinking and metacognition
- Ask clarifying questions when needed
- Provide constructive feedback
- Keep responses concise but thorough
- Break complex topics into manageable parts

Remember to:
1. Check student understanding frequently
2. Provide hints before giving full answers
3. Connect new concepts to prior knowledge
4. Encourage reflection on the learning process`;
  }

  /**
   * Save interaction to database for tracking
   * TODO: Implement when ai_tutor_interactions table is available in Supabase
   */
  static async saveInteraction(
    sessionId: string,
    userId: string,
    userInput: string,
    aiResponse: string,
    model: string,
    confidenceScore: number = 0.9,
    tokens?: number
  ): Promise<boolean> {
    try {
      // Track interaction locally for now
      console.log('Interaction tracked:', {
        sessionId,
        userId,
        userInput,
        aiResponse,
        model,
        confidenceScore,
        tokens,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error('Error tracking interaction:', err);
      return false;
    }
  }

  /**
   * Create a new tutoring session
   * TODO: Implement database persistence when ai_tutor_sessions table is available
   */
  static async createSession(
    userId: string,
    topic: string,
    goal: string,
    difficultyLevel: number,
    personality: string
  ): Promise<string | null> {
    try {
      // Generate client-side session ID for now
      const sessionId = `session_${userId}_${Date.now()}`;
      console.log('Session created:', {
        sessionId,
        userId,
        topic,
        goal,
        difficultyLevel,
        personality,
        timestamp: new Date().toISOString(),
      });
      return sessionId;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  }

  /**
   * Get session history
   * TODO: Implement when ai_tutor_interactions table is available in Supabase
   */
  static async getSessionHistory(sessionId: string): Promise<AIMessage[]> {
    try {
      console.log('Fetching session history for:', sessionId);
      // Return empty for now - will be populated when database is available
      return [];
    } catch (err) {
      console.error('Error fetching session history:', err);
      return [];
    }
  }
}

export default AITutorService;
