import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { Reflection, MetacogStrategy } from '@/types/metacog';
import { 
  Loader2, 
  Star, 
  Clock, 
  User, 
  BookOpen, 
  Filter,
  Download,
  Brain,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { TeacherAnalytics } from './TeacherAnalytics';

interface ReflectionWithStudent extends Reflection {
  student_name?: string;
  student_email?: string;
}

const RATING_DESCRIPTIONS = [
  { value: 0, label: 'Needs Improvement', description: 'Basic response, lacks depth', color: 'text-red-600' },
  { value: 1, label: 'Good', description: 'Clear thinking, some detail', color: 'text-yellow-600' },
  { value: 2, label: 'Excellent', description: 'Deep reflection, clear reasoning', color: 'text-green-600' }
];

const STRATEGY_COLORS: Record<MetacogStrategy, string> = {
  'Visualize': 'bg-purple-100 text-purple-800',
  'Formula': 'bg-blue-100 text-blue-800',
  'Example': 'bg-green-100 text-green-800',
  'Trial-and-error': 'bg-orange-100 text-orange-800',
  'Break-down': 'bg-pink-100 text-pink-800',
  'Other': 'bg-gray-100 text-gray-800'
};

export const MetacogDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [reflections, setReflections] = useState<ReflectionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRating, setUpdatingRating] = useState<string | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reflections' | 'analytics'>('reflections');
  
  // Filters
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  
  // Local state for teacher feedback
  const [teacherFeedback, setTeacherFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.currentUser && state.isTeacher) {
      fetchReflections();
    }
  }, [state.currentUser, state.isTeacher, selectedClassroom]);

  const fetchReflections = async () => {
    if (!state.currentUser) return;

    setLoading(true);
    try {
      // Get teacher's classrooms first
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', state.currentUser.id);

      if (!classrooms || classrooms.length === 0) {
        setReflections([]);
        return;
      }

      const classroomIds = classrooms.map(c => c.id);
      
      let query = supabase
        .from('reflections')
        .select(`
          *,
          student:profiles!reflections_student_id_fkey(name, email)
        `)
        .in('classroom_id', classroomIds)
        .order('created_at', { ascending: false });

      // Apply classroom filter if not 'all'
      if (selectedClassroom !== 'all') {
        query = query.eq('classroom_id', selectedClassroom);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reflections:', error);
        toast({
          title: 'Error',
          description: 'Failed to load student reflections.',
          variant: 'destructive'
        });
        return;
      }

      // Transform the data to include student info
      const transformedData = data?.map(reflection => ({
        ...reflection,
        student_name: reflection.student?.name || 'Unknown Student',
        student_email: reflection.student?.email || ''
      })) || [];

      setReflections(transformedData);
    } catch (error) {
      console.error('Error fetching reflections:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading reflections.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReflectionRating = async (reflectionId: string, rating: number) => {
    if (!state.currentUser) return;

    setUpdatingRating(reflectionId);
    try {
      const updateData: any = {
        teacher_rating: rating,
        teacher_id: state.currentUser.id,
        updated_at: new Date().toISOString()
      };

      // Include teacher feedback if provided
      if (teacherFeedback[reflectionId]) {
        updateData.teacher_feedback = teacherFeedback[reflectionId];
      }

      const { error } = await supabase
        .from('reflections')
        .update(updateData)
        .eq('id', reflectionId);

      if (error) {
        console.error('Error updating rating:', error);
        toast({
          title: 'Error',
          description: 'Failed to update reflection rating.',
          variant: 'destructive'
        });
        return;
      }

      // Update local state
      setReflections(prev => prev.map(r => 
        r.id === reflectionId 
          ? { ...r, teacher_rating: rating, teacher_id: state.currentUser!.id, teacher_feedback: teacherFeedback[reflectionId] || r.teacher_feedback }
          : r
      ));

      toast({
        title: 'Rating Updated',
        description: 'Student reflection rating has been saved.',
      });
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingRating(null);
    }
  };

  const generateAIFeedback = async (reflectionId: string) => {
    const reflection = reflections.find(r => r.id === reflectionId);
    if (!reflection) return;

    setGeneratingFeedback(reflectionId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-metacog-feedback', {
        body: {
          reflectionId,
          reflection: {
            problem_description: reflection.problem_description,
            strategy_used: reflection.strategy_used,
            reflection_text: reflection.reflection_text,
            was_helpful: reflection.was_helpful,
            difficulty_rating: reflection.difficulty_rating,
            teacher_rating: reflection.teacher_rating
          }
        }
      });

      if (error) {
        console.error('Error generating AI feedback:', error);
        toast({
          title: 'AI Feedback Error',
          description: 'Failed to generate AI feedback. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Update local state with AI feedback
      setReflections(prev => prev.map(r => 
        r.id === reflectionId 
          ? { ...r, ai_feedback: data.feedback, feedback_generated_at: new Date().toISOString() }
          : r
      ));

      toast({
        title: 'AI Feedback Generated',
        description: 'AI feedback has been added to the student\'s reflection.',
      });
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while generating feedback.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingFeedback(null);
    }
  };

  const exportData = () => {
    const csvData = reflections.map(r => ({
      'Student Name': r.student_name,
      'Date': new Date(r.created_at || '').toLocaleDateString(),
      'Subject': r.subject_area,
      'Strategy': r.strategy_used,
      'Reflection': r.reflection_text,
      'Helpful': r.was_helpful ? 'Yes' : 'No',
      'Difficulty': r.difficulty_rating,
      'Teacher Rating': r.teacher_rating ?? 'Not Rated',
      'AI Feedback Available': r.ai_feedback ? 'Yes' : 'No'
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metacognition-reflections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply filters
  const filteredReflections = reflections.filter(r => {
    if (selectedSubject !== 'all' && r.subject_area !== selectedSubject) return false;
    if (ratingFilter === 'unrated' && r.teacher_rating !== null) return false;
    if (ratingFilter === 'rated' && r.teacher_rating === null) return false;
    return true;
  });

  const subjects = [...new Set(reflections.map(r => r.subject_area))];
  const stats = {
    total: reflections.length,
    unrated: reflections.filter(r => r.teacher_rating === null).length,
    avgRating: reflections.filter(r => r.teacher_rating !== null).reduce((sum, r) => sum + (r.teacher_rating || 0), 0) / reflections.filter(r => r.teacher_rating !== null).length || 0
  };

  if (!state.isTeacher) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">This dashboard is only available for teachers.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading student reflections...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant="default" 
          className="flex items-center gap-2"
          onClick={() => setActiveTab('reflections')}
        >
          <BookOpen className="w-4 h-4" />
          Student Reflections
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-4 h-4" />
          Class Analytics
        </Button>
      </div>

      {activeTab === 'analytics' ? (
        <TeacherAnalytics />
      ) : (
        <>
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Metacognition Dashboard
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Review and rate student reflections on their problem-solving strategies
              </p>
            </div>
            <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Reflections</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unrated}</p>
                <p className="text-sm text-gray-600">Need Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Classroom</Label>
              <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {state.classrooms.map(classroom => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rating Status</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reflections</SelectItem>
                  <SelectItem value="unrated">Need Rating</SelectItem>
                  <SelectItem value="rated">Already Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reflections List */}
      <div className="space-y-4">
        {filteredReflections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No student reflections found matching the current filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredReflections.map(reflection => (
            <Card key={reflection.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{reflection.student_name}</span>
                      <Badge variant="outline">{reflection.subject_area}</Badge>
                      <Badge className={STRATEGY_COLORS[reflection.strategy_used]}>
                        {reflection.strategy_used}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(reflection.created_at || '').toLocaleString()}
                    </p>
                  </div>
                  {reflection.teacher_rating !== null && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {reflection.teacher_rating}/2
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Problem Description */}
                <div>
                  <h4 className="font-medium mb-2">Problem:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{reflection.problem_description}</p>
                </div>

                {/* Student Reflection */}
                <div>
                  <h4 className="font-medium mb-2">Student's Reflection:</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded">{reflection.reflection_text}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>Strategy was {reflection.was_helpful ? 'helpful' : 'not helpful'}</span>
                    {reflection.difficulty_rating && (
                      <span>Difficulty: {reflection.difficulty_rating}/5</span>
                    )}
                  </div>
                </div>

                {/* Teacher Rating */}
                <div>
                  <Label className="text-sm font-medium">Rate this reflection (0-2):</Label>
                  <div className="flex gap-2 mt-2">
                    {RATING_DESCRIPTIONS.map(rating => (
                      <Button
                        key={rating.value}
                        variant={reflection.teacher_rating === rating.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateReflectionRating(reflection.id, rating.value)}
                        disabled={updatingRating === reflection.id}
                        className="flex flex-col items-center p-3 h-auto"
                      >
                        <span className="font-medium">{rating.value}</span>
                        <span className="text-xs">{rating.label}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    0: Needs Improvement | 1: Good | 2: Excellent
                  </p>
                </div>

                {/* Teacher Feedback */}
                <div>
                  <Label htmlFor={`feedback-${reflection.id}`} className="text-sm font-medium">
                    Teacher Feedback (Optional):
                  </Label>
                  <Textarea
                    id={`feedback-${reflection.id}`}
                    placeholder="Provide specific feedback to help the student improve their reflection skills..."
                    value={teacherFeedback[reflection.id] || reflection.teacher_feedback || ''}
                    onChange={(e) => setTeacherFeedback(prev => ({ 
                      ...prev, 
                      [reflection.id]: e.target.value 
                    }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* AI Feedback */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI-Generated Feedback
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAIFeedback(reflection.id)}
                      disabled={generatingFeedback === reflection.id}
                      className="flex items-center gap-2"
                    >
                      {generatingFeedback === reflection.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Generate AI Feedback
                    </Button>
                  </div>
                  {reflection.ai_feedback ? (
                    <div className="bg-purple-50 p-3 rounded text-sm">
                      <p>{reflection.ai_feedback}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated {new Date(reflection.feedback_generated_at || '').toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No AI feedback generated yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )})
      </div>
        </>
      )}
    </div>
  );
};
