import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Send, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Classroom, Assignment, SubjectArea } from '@/types';

interface AssignmentDistributionProps {
  classrooms: Classroom[];
  onAssignmentCreated?: (assignment: Assignment) => void;
}

interface AssignmentForm {
  title: string;
  description: string;
  assignmentType: string;
  subjectArea: SubjectArea;
  dueDate: Date | undefined;
  totalPoints: number;
  selectedClassrooms: string[];
}

export const AssignmentDistribution = ({ classrooms, onAssignmentCreated }: AssignmentDistributionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [form, setForm] = useState<AssignmentForm>({
    title: '',
    description: '',
    assignmentType: 'homework',
    subjectArea: SubjectArea.OTHER,
    dueDate: undefined,
    totalPoints: 100,
    selectedClassrooms: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.description.trim() || !form.dueDate || form.selectedClassrooms.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and select at least one classroom',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: form.title,
          description: form.description,
          assignment_type: form.assignmentType,
          due_date: form.dueDate.toISOString(),
          total_points: form.totalPoints,
          teacher_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Distribute to selected classrooms
      const classroomAssignments = form.selectedClassrooms.map(classroomId => ({
        classroom_id: classroomId,
        assignment_id: assignment.id,
      }));

      const { error: distributionError } = await supabase
        .from('classroom_assignments')
        .insert(classroomAssignments);

      if (distributionError) throw distributionError;

      toast({
        title: 'Assignment Distributed!',
        description: `Assignment "${form.title}" has been distributed to ${form.selectedClassrooms.length} classroom(s)`,
      });

      // Call callback if provided
      if (onAssignmentCreated) {
        const newAssignment: Assignment = {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          assignmentType: assignment.assignment_type as any,
          subjectArea: form.subjectArea,
          dueDate: assignment.due_date,
          totalPoints: assignment.total_points || 100,
          createdAt: assignment.created_at,
          teacherId: assignment.teacher_id,
          isActive: assignment.is_active || true,
        };
        onAssignmentCreated(newAssignment);
      }

      // Reset form
      setForm({
        title: '',
        description: '',
        assignmentType: 'homework',
        subjectArea: SubjectArea.OTHER,
        dueDate: undefined,
        totalPoints: 100,
        selectedClassrooms: [],
      });
      setIsOpen(false);

    } catch (error: any) {
      console.error('Error distributing assignment:', error);
      toast({
        title: 'Distribution Failed',
        description: error.message || 'Failed to distribute assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClassroomSelection = (classroomId: string) => {
    setForm(prev => ({
      ...prev,
      selectedClassrooms: prev.selectedClassrooms.includes(classroomId)
        ? prev.selectedClassrooms.filter(id => id !== classroomId)
        : [...prev.selectedClassrooms, classroomId]
    }));
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create & Distribute Assignment
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Create & Distribute Assignment
            </DialogTitle>
            <DialogDescription>
              Create a new assignment and distribute it to your selected classrooms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter assignment title"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the assignment requirements..."
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Assignment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Assignment Type</Label>
                <Select 
                  value={form.assignmentType} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, assignmentType: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Area</Label>
                <Select 
                  value={form.subjectArea} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, subjectArea: value as SubjectArea }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SubjectArea).map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dueDate ? format(form.dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dueDate}
                      onSelect={(date) => setForm(prev => ({ ...prev, dueDate: date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Total Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={form.totalPoints}
                  onChange={(e) => setForm(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="1000"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Classroom Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Classrooms * ({form.selectedClassrooms.length} selected)
              </Label>
              
              {classrooms.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No classrooms available</p>
                    <p className="text-sm text-gray-500">Create a classroom first to distribute assignments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {classrooms.map(classroom => (
                    <Card 
                      key={classroom.id} 
                      className={`cursor-pointer transition-all ${
                        form.selectedClassrooms.includes(classroom.id) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleClassroomSelection(classroom.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{classroom.name}</h4>
                            <p className="text-sm text-gray-600">
                              {classroom.studentIds.length} students
                            </p>
                          </div>
                          {form.selectedClassrooms.includes(classroom.id) && (
                            <Badge variant="default">Selected</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || classrooms.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isSubmitting ? 'Distributing...' : 'Distribute Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};