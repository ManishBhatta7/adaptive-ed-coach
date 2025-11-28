import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, Ear, Eye, Hand, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { state, updateUserProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Micro Assessment State
  const [learningPref, setLearningPref] = useState<'Visual' | 'Auditory'>('Visual');
  const [actionPref, setActionPref] = useState<'Kinesthetic' | 'Read/Write'>('Kinesthetic');
  const [hardestSubject, setHardestSubject] = useState('');

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Determine Learning Style (Simple Logic for Micro Assessment)
      // If they prefer Visual + Kinesthetic -> Visual
      // If they prefer Auditory + Read/Write -> Auditory (Simplified)
      // Real logic can be more complex, but this is for Day 1 speed.
      const dominantStyle = learningPref; 

      // 2. Save Profile Data
      const updates = {
        primaryLearningStyle: dominantStyle,
        hardestSubject: hardestSubject,
        preferredCoachingMode: 'Encouraging' as const, // Default for new users
        currentStreak: 1 // Instant gratification
      };
      
      await updateUserProfile(updates);

      // 3. THE MAGIC MOMENT: Generate "Visual Roadmap"
      // We simulate a submission so the dashboard isn't empty
      const roadmapPrompt = `Create a text-based visual roadmap for learning ${hardestSubject} for a ${dominantStyle} learner. Use emojis and arrows (->) to visualize the path.`;
      
      // Call Agent to generate content
      const { data: agentData } = await supabase.functions.invoke('gemini-agent', {
        body: {
          messages: [{ role: 'user', content: roadmapPrompt }],
          mode: 'tutor',
          studentProfile: { ...state.currentUser, ...updates }
        }
      });

      // Create a "Submission" record so the dashboard has data
      if (state.currentUser?.id && agentData?.reply) {
        await supabase.from('submissions').insert({
          user_id: state.currentUser.id,
          assignment_type: 'roadmap',
          score: 100, // First win!
          content_data: { 
            title: `Roadmap: ${hardestSubject}`,
            notes: "AI Generated Study Plan" 
          },
          ai_feedback: {
            overall_feedback: agentData.reply,
            strengths: ["Taking Initiative", "Goal Setting"],
            improvements: ["Follow the roadmap step-by-step"]
          },
          status: 'processed',
          submitted_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        });
      }

      // 4. Redirect to Dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error("Onboarding Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-xl border-0">
        
        {/* STEP 1: PREFERENCE */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>How do you prefer to learn?</CardTitle>
              <CardDescription>Help us tailor the experience for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={learningPref} onValueChange={(v) => setLearningPref(v as any)}>
                <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${learningPref === 'Visual' ? 'border-purple-500 bg-purple-50' : ''}`}>
                  <RadioGroupItem value="Visual" id="visual" />
                  <Label htmlFor="visual" className="flex items-center gap-2 cursor-pointer w-full">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Charts & Diagrams</div>
                      <div className="text-xs text-gray-500">I like to see things mapped out.</div>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${learningPref === 'Auditory' ? 'border-purple-500 bg-purple-50' : ''}`}>
                  <RadioGroupItem value="Auditory" id="auditory" />
                  <Label htmlFor="auditory" className="flex items-center gap-2 cursor-pointer w-full">
                    <Ear className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Podcasts & Lectures</div>
                      <div className="text-xs text-gray-500">I learn best by listening.</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={() => setStep(2)} className="w-full">Next <ArrowRight className="ml-2 w-4 h-4"/></Button>
            </CardContent>
          </>
        )}

        {/* STEP 2: ACTIVITY */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>How do you engage?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={actionPref} onValueChange={(v) => setActionPref(v as any)}>
                <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${actionPref === 'Kinesthetic' ? 'border-purple-500 bg-purple-50' : ''}`}>
                  <RadioGroupItem value="Kinesthetic" id="kinesthetic" />
                  <Label htmlFor="kinesthetic" className="flex items-center gap-2 cursor-pointer w-full">
                    <Hand className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">Hands-on</div>
                      <div className="text-xs text-gray-500">I learn by doing and building.</div>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${actionPref === 'Read/Write' ? 'border-purple-500 bg-purple-50' : ''}`}>
                  <RadioGroupItem value="Read/Write" id="readwrite" />
                  <Label htmlFor="readwrite" className="flex items-center gap-2 cursor-pointer w-full">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Reading & Writing</div>
                      <div className="text-xs text-gray-500">I take notes and read articles.</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Next <ArrowRight className="ml-2 w-4 h-4"/></Button>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 3: CONTEXT & MAGIC MOMENT */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>One last thing...</CardTitle>
              <CardDescription>What is your hardest subject right now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input 
                  placeholder="e.g. Calculus, Organic Chemistry, History"
                  value={hardestSubject}
                  onChange={(e) => setHardestSubject(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleFinish} 
                disabled={!hardestSubject || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Building your {hardestSubject} Roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create My Learning Plan
                  </>
                )}
              </Button>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
};