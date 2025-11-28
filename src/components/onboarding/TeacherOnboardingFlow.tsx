import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Scale, Users, Sparkles, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const TeacherOnboardingFlow = () => {
  const navigate = useNavigate();
  const { state, updateUserProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Teacher State
  const [subject, setSubject] = useState('');
  const [gradingStyle, setGradingStyle] = useState<'Strict' | 'Balanced' | 'Growth-Oriented'>('Balanced');

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Save Teacher Profile
      await updateUserProfile({
        teachingSubjects: [subject],
        gradingStyle: gradingStyle,
        // Map grading style to coaching mode for the Chat Agent
        preferredCoachingMode: gradingStyle === 'Strict' ? 'Analytical' : 
                             gradingStyle === 'Growth-Oriented' ? 'Encouraging' : 'Structured'
      });

      // 2. MAGIC MOMENT: Generate "Class Welcome & Grading Policy"
      // This shows the teacher immediate value from the AI
      const prompt = `
        Write a warm, professional welcome announcement for a ${subject} class.
        My grading style is ${gradingStyle}. 
        Explain to students how they will be graded and motivate them to do their best.
        Use emojis and clear headings.
      `;

      const { data: agentData } = await supabase.functions.invoke('gemini-agent', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          mode: 'coach',
          studentProfile: { name: state.currentUser?.name, role: 'teacher' }
        }
      });

      // 3. Save as a "Sample Assignment" (Class Announcement)
      if (state.currentUser?.id && agentData?.reply) {
        await supabase.from('assignments').insert({
          teacher_id: state.currentUser.id,
          title: "🎉 Class Welcome & Policy",
          description: agentData.reply, // The AI generated policy
          status: 'published'
        });
      }

      // 4. Redirect
      navigate('/teacher-dashboard');

    } catch (error) {
      console.error("Onboarding Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-xl border-0">
        
        {/* STEP 1: SUBJECT */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Welcome, Educator!</CardTitle>
              <CardDescription>Let's set up your AI Teaching Assistant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>What subject do you teach?</Label>
                <Input 
                  placeholder="e.g. Physics, History, Literature"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!subject}
                className="w-full"
              >
                Next <ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
            </CardContent>
          </>
        )}

        {/* STEP 2: GRADING PHILOSOPHY */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>What is your grading style?</CardTitle>
              <CardDescription>This calibrates the AI Smart Grader for your class.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={gradingStyle} onValueChange={(v) => setGradingStyle(v as any)}>
                
                <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${gradingStyle === 'Strict' ? 'border-red-500 bg-red-50' : ''}`}>
                  <RadioGroupItem value="Strict" id="strict" className="mt-1" />
                  <Label htmlFor="strict" className="cursor-pointer w-full">
                    <div className="font-medium flex items-center gap-2">
                      <Scale className="w-4 h-4 text-red-600" /> Strict & Precise
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Focus on accuracy, keywords, and technical correctness. No partial marks for vague answers.
                    </div>
                  </Label>
                </div>

                <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${gradingStyle === 'Balanced' ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <RadioGroupItem value="Balanced" id="balanced" className="mt-1" />
                  <Label htmlFor="balanced" className="cursor-pointer w-full">
                    <div className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Balanced
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Standard academic grading. Rewards logic even if some details are missed.
                    </div>
                  </Label>
                </div>

                <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${gradingStyle === 'Growth-Oriented' ? 'border-green-500 bg-green-50' : ''}`}>
                  <RadioGroupItem value="Growth-Oriented" id="growth" className="mt-1" />
                  <Label htmlFor="growth" className="cursor-pointer w-full">
                    <div className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-600" /> Growth-Oriented
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Prioritizes effort and understanding over technical precision. Generous partial credit.
                    </div>
                  </Label>
                </div>

              </RadioGroup>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={handleFinish} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calibrating AI Grader...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Complete Setup</>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};