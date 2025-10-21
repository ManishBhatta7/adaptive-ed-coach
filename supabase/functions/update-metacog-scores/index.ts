import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetacogEvent {
  event_type: string;
  payload: any;
  created_at: string;
}

interface UserProfile {
  id: string;
  metacog_score: number;
  preferred_strategies: Record<string, number>;
  metacog_history: Array<{ date: string; score: number }>;
  reflection_quality: { positive: number; total: number };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req;
    
    if (method !== 'POST') {
      throw new Error(`Method ${method} not allowed`);
    }

    console.log('Starting metacognition score update job...');

    // Get all users who have submitted reflections in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('metacog_events')
      .select('user_id')
      .eq('event_type', 'reflection_submitted')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch active users: ${usersError.message}`);
    }

    const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    console.log(`Processing ${uniqueUserIds.length} active users...`);

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each user
    for (const userId of uniqueUserIds) {
      try {
        await updateUserMetacogScore(supabaseClient, userId);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        errors.push(`User ${userId}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      message: 'Metacognition score update completed',
      processed_users: uniqueUserIds.length,
      updated_users: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Update job completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in update-metacog-scores:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});

async function updateUserMetacogScore(supabaseClient: any, userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user's current profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, metacog_score, preferred_strategies, metacog_history, reflection_quality')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  // Get user's events from last 30 days
  const { data: events, error: eventsError } = await supabaseClient
    .from('metacog_events')
    .select('event_type, payload, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to fetch events: ${eventsError.message}`);
  }

  // Get teacher ratings for this user
  const { data: teacherRatings, error: ratingsError } = await supabaseClient
    .from('reflections')
    .select('teacher_rating')
    .eq('student_id', userId)
    .not('teacher_rating', 'is', null)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (ratingsError) {
    throw new Error(`Failed to fetch teacher ratings: ${ratingsError.message}`);
  }

  // Calculate new scores
  const newProfile = calculateMetacogProfile(profile, events, teacherRatings || []);

  // Update profile
  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update({
      metacog_score: newProfile.metacog_score,
      preferred_strategies: newProfile.preferred_strategies,
      metacog_history: newProfile.metacog_history,
      reflection_quality: newProfile.reflection_quality
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  console.log(`Updated user ${userId}: score ${profile.metacog_score} -> ${newProfile.metacog_score}`);
}

function calculateMetacogProfile(
  userProfile: UserProfile, 
  events: MetacogEvent[], 
  teacherRatings: Array<{ teacher_rating: number }>
): UserProfile {
  // Filter events by type
  const reflections = events.filter(e => e.event_type === 'reflection_submitted');
  const microActions = events.filter(e => e.event_type === 'micro_action_performed');

  // Calculate reflection quality scores
  const qualityScores = reflections.map(r => {
    const payload = r.payload;
    let quality = 0.0;

    // Length score
    const wordCount = (payload.reflection_text || '').split(' ').length;
    if (wordCount >= 5) quality += 0.5;

    // Explanatory words
    const hasExplanatoryWords = /because|since|therefore|however|although|so|then|when|if|why|how/i
      .test(payload.reflection_text || '');
    if (hasExplanatoryWords) quality += 0.3;

    // Helpfulness
    if (payload.helpful_flag) quality += 0.2;

    return Math.min(quality, 1.0);
  });

  const avgQuality = qualityScores.length > 0 
    ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
    : userProfile.metacog_score * 0.5;

  // Teacher influence
  const teacherScores = teacherRatings.map(r => r.teacher_rating);
  const avgTeacherRating = teacherScores.length > 0 
    ? teacherScores.reduce((sum, r) => sum + r, 0) / teacherScores.length
    : 0;
  const teacherAdj = avgTeacherRating / 2.0; // Normalize to 0-1

  // Success on retry actions
  const retryActions = microActions.filter(e => e.payload.action_type === 'retry');
  const successAdj = sigmoid(retryActions.length * 0.1); // Encourage retry behavior

  // Combine scores (weights can be tuned)
  const newMetacogScore = clamp(
    userProfile.metacog_score * 0.7 + 
    avgQuality * 0.15 + 
    teacherAdj * 0.1 + 
    successAdj * 0.05,
    0, 1
  );

  // Update strategy preferences
  const strategyCounts: Record<string, number> = {};
  reflections.forEach(r => {
    const strategy = r.payload.strategy_choice;
    if (strategy) {
      strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    }
  });

  const totalStrategies = Object.values(strategyCounts).reduce((sum, count) => sum + count, 0);
  const newPreferredStrategies = { ...userProfile.preferred_strategies };
  
  // Decay existing preferences and add new ones
  Object.keys(newPreferredStrategies).forEach(strategy => {
    newPreferredStrategies[strategy] = decay(newPreferredStrategies[strategy], 0.9);
  });

  Object.entries(strategyCounts).forEach(([strategy, count]) => {
    if (totalStrategies > 0) {
      newPreferredStrategies[strategy] = 
        (newPreferredStrategies[strategy] || 0) + 0.1 * (count / totalStrategies);
    }
  });

  // Update history
  const today = new Date().toISOString().split('T')[0];
  const history = Array.isArray(userProfile.metacog_history) ? [...userProfile.metacog_history] : [];
  
  // Remove old entry for today if it exists, then add new one
  const filteredHistory = history.filter(h => h.date !== today);
  filteredHistory.push({ date: today, score: newMetacogScore });
  
  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentHistory = filteredHistory
    .filter(h => new Date(h.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update reflection quality stats
  const positiveReflections = qualityScores.filter(q => q >= 0.7).length;
  const totalReflections = qualityScores.length;
  
  const qualityStats = userProfile.reflection_quality || { positive: 0, total: 0 };
  const newQualityStats = {
    positive: Math.max(qualityStats.positive, positiveReflections),
    total: Math.max(qualityStats.total, totalReflections)
  };

  return {
    ...userProfile,
    metacog_score: newMetacogScore,
    preferred_strategies: newPreferredStrategies,
    metacog_history: recentHistory,
    reflection_quality: newQualityStats
  };
}

// Helper functions
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function decay(value: number, factor: number): number {
  return value * factor;
}