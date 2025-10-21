import { supabase } from './supabase';

export interface AdaptiveContent {
  promptTemplate: string;
  hintLevel: 'minimal' | 'moderate' | 'extensive';
  scaffoldingType: 'worked_examples' | 'guided_questions' | 'challenge_tasks';
  reflectionQuestions: string[];
  encouragementLevel: 'high' | 'medium' | 'low';
}

export interface MetacogProfile {
  score: number;
  preferred_strategies: Record<string, number>;
  total_reflections: number;
  recent_performance: number;
}

/**
 * Get adaptive content based on student's metacognition profile
 */
export async function getAdaptiveContent(
  userId: string, 
  activityType: string = 'general',
  subjectArea?: string
): Promise<AdaptiveContent> {
  try {
    // Get user's current metacog profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('metacog_score, preferred_strategies, total_reflections')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return getDefaultContent();
    }

    const metacogScore = profile.metacog_score || 0;
    const totalReflections = profile.total_reflections || 0;

    // Determine content adaptation tier
    if (metacogScore < 0.35) {
      return getLowMetacogContent(totalReflections, subjectArea);
    } else if (metacogScore < 0.65) {
      return getMediumMetacogContent(totalReflections, subjectArea);
    } else {
      return getHighMetacogContent(totalReflections, subjectArea);
    }

  } catch (error) {
    console.error('Error getting adaptive content:', error);
    return getDefaultContent();
  }
}

/**
 * Content for students with low metacognition scores (< 0.35)
 * Focus: Extensive scaffolding, worked examples, explicit strategy instruction
 */
function getLowMetacogContent(totalReflections: number, subjectArea?: string): AdaptiveContent {
  const templates = [
    "Let's work through this step by step. First, read the problem carefully and identify what you know and what you need to find.",
    "I'll show you how to approach this. Follow along with each step and think about why we're doing it.",
    "Before we start, let's recall a similar problem we've seen before. This will help guide our thinking."
  ];

  const reflectionPrompts = totalReflections < 3 
    ? [
        "What was the first thing you did when you saw this problem?",
        "Which step felt most difficult? Why?",
        "What would you tell a friend about how to start this problem?"
      ]
    : [
        "Explain each step you took, even if it didn't work.",
        "What strategy did you use? Why did you choose it?",
        "If you got stuck, what helped you move forward?"
      ];

  return {
    promptTemplate: templates[Math.floor(Math.random() * templates.length)],
    hintLevel: 'extensive',
    scaffoldingType: 'worked_examples',
    reflectionQuestions: reflectionPrompts,
    encouragementLevel: 'high'
  };
}

/**
 * Content for students with medium metacognition scores (0.35 - 0.65)
 * Focus: Balanced guidance, self-explanation prompts, strategy choice
 */
function getMediumMetacogContent(totalReflections: number, subjectArea?: string): AdaptiveContent {
  const templates = [
    "Think about which strategy might work best for this type of problem. What are your options?",
    "Before diving in, take a moment to plan your approach. What's your strategy?",
    "You've solved similar problems before. What approach worked well then?"
  ];

  const reflectionPrompts = [
    "Describe your problem-solving process in 2-3 sentences.",
    "What made you choose this particular strategy?",
    "How did you know when you were on the right track?",
    "What would you do differently if you solved this again?"
  ];

  return {
    promptTemplate: templates[Math.floor(Math.random() * templates.length)],
    hintLevel: 'moderate',
    scaffoldingType: 'guided_questions',
    reflectionQuestions: reflectionPrompts,
    encouragementLevel: 'medium'
  };
}

/**
 * Content for students with high metacognition scores (≥ 0.65)
 * Focus: Challenge tasks, cross-topic connections, peer teaching
 */
function getHighMetacogContent(totalReflections: number, subjectArea?: string): AdaptiveContent {
  const templates = [
    "Now that you've mastered this, can you explain it in a way that connects to other topics?",
    "Challenge yourself: How would you teach this concept to someone who's never seen it?",
    "Think beyond this problem: Where else might you use this same reasoning?"
  ];

  const challengePrompts = [
    "Explain this problem using exactly 15 words, then expand to help someone who's confused.",
    "What's the 'big idea' behind this problem? How does it connect to other topics?",
    "If you were the teacher, what question would you ask to make students think deeper?",
    "How is this problem similar to something in a completely different subject?"
  ];

  const metaphysicsPrompts = getMetaphysicsPrompts(subjectArea);

  return {
    promptTemplate: templates[Math.floor(Math.random() * templates.length)],
    hintLevel: 'minimal',
    scaffoldingType: 'challenge_tasks',
    reflectionQuestions: [...challengePrompts, ...metaphysicsPrompts],
    encouragementLevel: 'low'
  };
}

/**
 * Cross-topic metaphysics prompts for high performers
 */
function getMetaphysicsPrompts(subjectArea?: string): string[] {
  const basePrompts = [
    "What patterns do you see that appear in other subjects too?",
    "How does this relate to the concept of 'balance' or 'conservation'?",
    "Where else have you seen this type of reasoning or logic?"
  ];

  const subjectSpecific: Record<string, string[]> = {
    'Math': [
      "How is this mathematical relationship like something in physics or chemistry?",
      "What real-world systems follow similar patterns or rules?"
    ],
    'Science': [
      "How is this scientific principle like a rule in math or economics?",
      "What everyday examples demonstrate this same concept?"
    ],
    'English': [
      "How do the analysis skills you used here apply to understanding data or arguments?",
      "What connections do you see between this text and scientific thinking?"
    ]
  };

  return [...basePrompts, ...(subjectSpecific[subjectArea || ''] || [])];
}

/**
 * Default content when profile can't be loaded
 */
function getDefaultContent(): AdaptiveContent {
  return {
    promptTemplate: "Take your time to think through this problem. What approach feels right to you?",
    hintLevel: 'moderate',
    scaffoldingType: 'guided_questions',
    reflectionQuestions: [
      "What strategy did you use to solve this?",
      "How well did your approach work?",
      "What would you do differently next time?"
    ],
    encouragementLevel: 'medium'
  };
}

/**
 * Get personalized hint based on metacog score and attempt count
 */
export async function getPersonalizedHint(
  userId: string,
  problemContext: string,
  attemptCount: number = 1
): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('metacog_score')
      .eq('id', userId)
      .single();

    const score = profile?.metacog_score || 0.5;
    
    if (score < 0.35) {
      // Low scorers get explicit, step-by-step hints
      const lowHints = [
        "Let me break this down into smaller steps. First, identify what information you have.",
        "Think about this step-by-step: What do you know? What do you need to find? What connects them?",
        "Try using the strategy we practiced: [specific strategy]. Here's how to start..."
      ];
      return lowHints[Math.min(attemptCount - 1, lowHints.length - 1)];
    } else if (score < 0.65) {
      // Medium scorers get guiding questions
      const medHints = [
        "What strategy are you thinking of using? Why does that seem like a good choice?",
        "You're on the right track. What's the next logical step?",
        "Consider: Have you seen a similar problem before? How did you approach it then?"
      ];
      return medHints[Math.min(attemptCount - 1, medHints.length - 1)];
    } else {
      // High scorers get minimal, thought-provoking hints
      const highHints = [
        "Trust your instincts. What does your mathematical intuition tell you?",
        "Think about the underlying principle here. How does it connect to what you know?",
        "You have the skills for this. What approach feels most elegant?"
      ];
      return highHints[Math.min(attemptCount - 1, highHints.length - 1)];
    }
  } catch (error) {
    console.error('Error getting personalized hint:', error);
    return "Think about what you know and what you need to find. What strategy might help bridge the gap?";
  }
}

/**
 * Log adaptive content usage for analysis
 */
export async function logAdaptiveContentUsage(
  userId: string,
  contentType: string,
  effectiveness: 'helpful' | 'not_helpful' | 'neutral'
) {
  try {
    await supabase.rpc('log_metacog_event', {
      p_event_type: 'adaptive_content_shown',
      p_user_id: userId,
      p_payload: {
        content_type: contentType,
        effectiveness,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging adaptive content usage:', error);
  }
}