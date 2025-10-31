import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Clock, 
  Calendar, 
  Plus, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { Assignment, SubjectArea } from '@/types';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubmissionStatus {
  studentId: string;
  studentName: string;
  submittedAt?: string;
  status: 'submitted' | 'pending' | 'late';
  score?: number;
  feedback?: string;
}

interface AssignmentWithSubmissions extends Assignment {
  submissions?: SubmissionStatus[];
  totalStudents?: number;
  submittedCount?: number;
}

interface NewAssignmentForm {
  title: string;
  description: string;
  subjectArea: SubjectArea;
  dueDate: string;
  classroomId: string;
  maxPoints: number;
  instructions: string;
  descriptionImages: string[];
}

const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  // Adjust for timezone offset so datetime-local displays correctly
  const offsetInMinutes = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offsetInMinutes);
  return date.toISOString().slice(0, 16);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const SubmissionCard = ({ submission }: { submission: SubmissionStatus }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          submission.status === 'submitted' ? 'bg-green-100' :
          submission.status === 'late' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {submission.status === 'submitted' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : submission.status === 'late' ? (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        
        <div>
          <p className="font-medium">{submission.studentName}</p>
          <p className="text-sm text-gray-500">
            {submission.submittedAt 
              ? `Submitted: ${new Date(submission.submittedAt).toLocaleString()}` 
              : 'Not submitted'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {submission.score !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{submission.score}</p>
            <p className="text-xs text-gray-500">/ 100</p>
          </div>
        )}
        
        {submission.status !== 'pending' && (
          <Button size="sm" variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Review
          </Button>
        )}
      </div>
    </div>
    
    {submission.feedback && (
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700">{submission.feedback}</p>
      </div>
    )}
  </Card>
);

const Assignments = () => {
  const { state } = useAppContext();
  const { toast: showToast } = useToast();
  const navigate = useNavigate();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithSubmissions[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithSubmissions[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  
  // Teacher-specific states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmissions | null>(null);
  const [isViewSubmissionsOpen, setIsViewSubmissionsOpen] = useState(false);
  
  // Form states for creating assignment
  const [newAssignment, setNewAssignment] = useState<NewAssignmentForm>(() => ({
    title: '',
    description: '',
    subjectArea: SubjectArea.OTHER,
    dueDate: getDefaultDueDate(),
    classroomId: '',
    maxPoints: 100,
    instructions: '',
    descriptionImages: []
  }));

  useEffect(() => {
    loadAssignments();
  }, []); // Only load on mount
  
  const loadAssignments = async () => {
    try {
      if (state.isTeacher) {
        // Load assignments created by teacher with submission stats
        await loadTeacherAssignments();
      } else {
        // Load assignments for student
        await loadStudentAssignments();
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive'
      });
    }
  };

  const loadTeacherAssignments = async () => {
    // Simulate loading teacher's assignments with submission tracking
    const assignments: AssignmentWithSubmissions[] = [];
    
    for (const classroom of state.classrooms) {
      for (const assignment of classroom.assignments) {
        const totalStudents = 30; // This should come from classroom.students.length
        const submittedCount = Math.floor(Math.random() * totalStudents);
        
        assignments.push({
          ...assignment,
          descriptionImages: assignment.descriptionImages || [],
          totalStudents,
          submittedCount,
          submissions: generateMockSubmissions(totalStudents, assignment)
        });
      }
    }
    
    setAllAssignments(assignments);
  };

  const loadStudentAssignments = async () => {
    // Load assignments for student
    const assignments: Assignment[] = [];
    state.classrooms.forEach(classroom => {
      classroom.assignments.forEach(assignment => {
        assignments.push({
          ...assignment,
          descriptionImages: assignment.descriptionImages || []
        });
      });
    });
    
    setAllAssignments(assignments);
  };

  const generateMockSubmissions = (totalStudents: number, assignment: Assignment): SubmissionStatus[] => {
    const submissions: SubmissionStatus[] = [];
    const submittedCount = Math.floor(Math.random() * totalStudents);
    
    for (let i = 0; i < totalStudents; i++) {
      const isSubmitted = i < submittedCount;
      const isLate = isSubmitted && Math.random() > 0.7;
      
      submissions.push({
        studentId: `student-${i}`,
        studentName: `Student ${i + 1}`,
        status: isSubmitted ? (isLate ? 'late' : 'submitted') : 'pending',
        submittedAt: isSubmitted ? new Date().toISOString() : undefined,
        score: isSubmitted ? Math.floor(Math.random() * 100) : undefined,
        feedback: isSubmitted ? 'Good work!' : undefined
      });
    }
    
    return submissions;
  };
  
  useEffect(() => {
    let filtered = allAssignments;
    const now = new Date();
    
    // Filter by time
    if (filter === 'upcoming') {
      filtered = filtered.filter(assignment => new Date(assignment.dueDate) >= now);
    } else if (filter === 'past') {
      filtered = filtered.filter(assignment => new Date(assignment.dueDate) < now);
    }
    
    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.subjectArea === subjectFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredAssignments(filtered);
  }, [allAssignments, filter, subjectFilter, searchQuery]);

  const handleDeleteAssignment = useCallback(async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      // In a real app, this would call Supabase
      showToast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive'
      });
    }
  }, [showToast]);

  const resetForm = useCallback(() => {
    setNewAssignment({
      title: '',
      description: '',
      subjectArea: SubjectArea.OTHER,
      dueDate: getDefaultDueDate(),
      classroomId: '',
      maxPoints: 100,
      instructions: '',
      descriptionImages: []
    });
  }, []);

  const handleInputChange = useCallback(
    (field: keyof Omit<NewAssignmentForm, 'descriptionImages'>, value: string | number) => {
      const nextValue = typeof value === 'string' ? value : value;
      setNewAssignment(prev => ({ ...prev, [field]: nextValue }));
    },
    []
  );

  const handleDescriptionImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      try {
        const remainingSlots = Math.max(0, 5 - newAssignment.descriptionImages.length);
        if (remainingSlots <= 0) {
          showToast({
            title: 'Image limit reached',
            description: 'You can add up to 5 reference images per assignment.',
            variant: 'destructive'
          });
          return;
        }

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const uploads = await Promise.all(filesToProcess.map(readFileAsDataUrl));

        setNewAssignment(prev => ({
          ...prev,
          descriptionImages: [...prev.descriptionImages, ...uploads]
        }));

        if (files.length > remainingSlots) {
          showToast({
            title: 'Extra files skipped',
            description: 'Only the first few images were added to keep within the 5 image limit.',
          });
        }
      } catch (error) {
        console.error('Error adding images to assignment:', error);
        showToast({
          title: 'Image upload failed',
          description: 'We could not read one of the selected image files. Please try again.',
          variant: 'destructive'
        });
      }
    },
    [newAssignment.descriptionImages.length, showToast]
  );

  const handleRemoveDescriptionImage = useCallback((index: number) => {
    setNewAssignment(prev => ({
      ...prev,
      descriptionImages: prev.descriptionImages.filter((_, idx) => idx !== index)
    }));
  }, []);

  const handleDescriptionImageInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleDescriptionImageUpload(event.target.files);
      event.target.value = '';
    },
    [handleDescriptionImageUpload]
  );

  const validateNewAssignment = useCallback(() => {
    if (state.classrooms.length === 0) {
      showToast({
        title: 'No classrooms found',
        description: 'Create a classroom before assigning work to students.',
        variant: 'destructive'
      });
      return false;
    }

    const missingFields: string[] = [];

    if (!newAssignment.title.trim()) missingFields.push('Title');
    if (!newAssignment.classroomId) missingFields.push('Classroom');
    if (!newAssignment.dueDate) missingFields.push('Due date');

    if (missingFields.length > 0) {
      showToast({
        title: 'Missing information',
        description: `Please add: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return false;
    }

    const dueDateValue = new Date(newAssignment.dueDate);
    if (Number.isNaN(dueDateValue.getTime())) {
      showToast({
        title: 'Invalid due date',
        description: 'Please choose a valid due date and time.',
        variant: 'destructive'
      });
      return false;
    }

    if (dueDateValue.getTime() <= Date.now()) {
      showToast({
        title: 'Due date in the past',
        description: 'Set the due date to a future time so students can respond.',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  }, [newAssignment, showToast, state.classrooms.length]);

  const handleCreateAssignment = useCallback(async () => {
    try {
      if (!validateNewAssignment()) return;

      const dueDateValue = new Date(newAssignment.dueDate);
      const selectedClassroom = state.classrooms.find((classroom) => classroom.id === newAssignment.classroomId);
      const totalStudents = selectedClassroom?.studentIds?.length ?? 0;
      const newAssignmentRecord: AssignmentWithSubmissions = {
        id: `temp-assignment-${Date.now()}`,
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim(),
        subjectArea: newAssignment.subjectArea,
        assignmentType: 'custom',
        dueDate: dueDateValue.toISOString(),
        createdAt: new Date().toISOString(),
        teacherId: state.currentUser?.id || 'mock-teacher-id',
        totalPoints: newAssignment.maxPoints,
        isActive: true,
        maxScore: newAssignment.maxPoints,
        attachments: [],
        descriptionImages: [...newAssignment.descriptionImages],
        instructions: newAssignment.instructions.trim(),
        submissions: [],
        totalStudents,
        submittedCount: 0
      };

      // In a real app, this would call Supabase and refresh the cache
      setAllAssignments(prev => [newAssignmentRecord, ...prev]);

      showToast({
        title: 'Assignment created',
        description: 'Students can now access the new assignment.',
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating assignment:', error);
      showToast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  }, [newAssignment, resetForm, showToast, state.classrooms, state.currentUser?.id, validateNewAssignment]);

  const handleCreateDialogToggle = useCallback(
    (open: boolean) => {
      setIsCreateDialogOpen(open);
      if (!open) {
        resetForm();
      }
    },
    [resetForm]
  );

  const handleCreateDialogClose = useCallback(() => {
    handleCreateDialogToggle(false);
  }, [handleCreateDialogToggle]);

  const handleCreateDialogOpen = useCallback(() => {
    handleCreateDialogToggle(true);
  }, [handleCreateDialogToggle]);

  const isAssignmentOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };

  const getSubjectColor = (subject: SubjectArea) => {
    const colors: Record<SubjectArea, string> = {
      [SubjectArea.MATH]: "bg-blue-100 text-blue-800 border-blue-200",
      [SubjectArea.SCIENCE]: "bg-green-100 text-green-800 border-green-200",
      [SubjectArea.LITERATURE]: "bg-purple-100 text-purple-800 border-purple-200",
      [SubjectArea.HISTORY]: "bg-amber-100 text-amber-800 border-amber-200",
      [SubjectArea.LANGUAGE]: "bg-pink-100 text-pink-800 border-pink-200",
      [SubjectArea.ART]: "bg-indigo-100 text-indigo-800 border-indigo-200",
      [SubjectArea.MUSIC]: "bg-rose-100 text-rose-800 border-rose-200",
      [SubjectArea.COMPUTER_SCIENCE]: "bg-cyan-100 text-cyan-800 border-cyan-200",
      [SubjectArea.PHYSICAL_EDUCATION]: "bg-lime-100 text-lime-800 border-lime-200",
      [SubjectArea.OTHER]: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[subject];
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSubmissionStats = (assignment: AssignmentWithSubmissions) => {
    if (!assignment.submissions) return { submitted: 0, pending: 0, late: 0, percentage: 0 };
    
    const submitted = assignment.submissions.filter(s => s.status === 'submitted').length;
    const late = assignment.submissions.filter(s => s.status === 'late').length;
    const pending = assignment.submissions.filter(s => s.status === 'pending').length;
    const total = assignment.submissions.length;
    const percentage = total > 0 ? ((submitted + late) / total) * 100 : 0;
    
    return { submitted, pending, late, percentage };
  };

  // Teacher View: Assignment Management
  const renderTeacherAssignmentView = () => (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Assignment Management</h2>
        </div>
    <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogToggle}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new assignment for your students
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Chapter 5 Quiz"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the assignment"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={newAssignment.subjectArea}
                    onValueChange={(value) => handleInputChange('subjectArea', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SubjectArea).map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="classroom">Classroom *</Label>
                  <Select
                    value={newAssignment.classroomId}
                    onValueChange={(value) => handleInputChange('classroomId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="maxPoints">Maximum Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={newAssignment.maxPoints}
                    onChange={(e) => handleInputChange('maxPoints', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Detailed instructions for students"
                  rows={5}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description-images">Reference Images</Label>
                <Input
                  id="description-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDescriptionImageInputChange}
                />
                <p className="text-xs text-gray-500">
                  Upload up to 5 images (PNG or JPG) to help students understand the task quickly.
                </p>
                {newAssignment.descriptionImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {newAssignment.descriptionImages.map((image, index) => (
                      <div
                        key={`new-assignment-image-${index}`}
                        className="relative group border border-gray-200 rounded-md overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`Assignment reference ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveDescriptionImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCreateDialogClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment} className="bg-gradient-to-r from-purple-600 to-pink-600">
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {Object.values(SubjectArea).map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? "default" : "outline"} 
              onClick={() => setFilter('all')}
              className={filter === 'all' ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
            >
              All
            </Button>
            <Button 
              variant={filter === 'upcoming' ? "default" : "outline"} 
              onClick={() => setFilter('upcoming')}
              className={filter === 'upcoming' ? "bg-gradient-to-r from-blue-600 to-cyan-600" : ""}
            >
              Active
            </Button>
            <Button 
              variant={filter === 'past' ? "default" : "outline"} 
              onClick={() => setFilter('past')}
              className={filter === 'past' ? "bg-gradient-to-r from-gray-600 to-gray-700" : ""}
            >
              Past
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Cards */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const stats = getSubmissionStats(assignment);
            return (
              <Card key={assignment.id} className="overflow-hidden hover:shadow-lg transition-all">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{assignment.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getSubjectColor(assignment.subjectArea)}>
                          {assignment.subjectArea.replace(/_/g, ' ')}
                        </Badge>
                        {isAssignmentOverdue(assignment.dueDate) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {assignment.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {assignment.descriptionImages?.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {assignment.descriptionImages.map((image, index) => (
                        <div key={`${assignment.id}-image-${index}`} className="relative h-28 w-full overflow-hidden rounded-md border">
                          <img
                            src={image}
                            alt={`${assignment.title} reference ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {assignment.instructions?.trim() && (
                    <div className="rounded-md border border-purple-100 bg-purple-50/60 p-3 text-sm text-gray-700">
                      {assignment.instructions}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Due: {formatDueDate(assignment.dueDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-pink-500" />
                      <span>{assignment.totalStudents || 0} students</span>
                    </div>
                  </div>
                  
                  {/* Submission Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Submissions</span>
                      <span className="font-medium">{stats.submitted + stats.late} / {assignment.totalStudents || 0}</span>
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                    
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>{stats.submitted} on time</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <span>{stats.late} late</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span>{stats.pending} pending</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-50 border-t flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsViewSubmissionsOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Submissions
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg p-12 border-2 border-dashed">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No assignments found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try adjusting your search or filters" : "Create your first assignment to get started"}
            </p>
            <Button 
              onClick={handleCreateDialogOpen}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </div>
        </div>
      )}

      {/* Submission Details Dialog */}
      <Dialog open={isViewSubmissionsOpen} onOpenChange={setIsViewSubmissionsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title} - Submissions</DialogTitle>
            <DialogDescription>
              Track and manage student submissions for this assignment
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({selectedAssignment?.submissions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="submitted">
                Submitted ({getSubmissionStats(selectedAssignment || {} as AssignmentWithSubmissions).submitted})
              </TabsTrigger>
              <TabsTrigger value="late">
                Late ({getSubmissionStats(selectedAssignment || {} as AssignmentWithSubmissions).late})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({getSubmissionStats(selectedAssignment || {} as AssignmentWithSubmissions).pending})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {selectedAssignment?.submissions?.map((submission) => (
                  <SubmissionCard key={submission.studentId} submission={submission} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="submitted" className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {selectedAssignment?.submissions
                  ?.filter(s => s.status === 'submitted')
                  .map((submission) => (
                    <SubmissionCard key={submission.studentId} submission={submission} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="late" className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {selectedAssignment?.submissions
                  ?.filter(s => s.status === 'late')
                  .map((submission) => (
                    <SubmissionCard key={submission.studentId} submission={submission} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {selectedAssignment?.submissions
                  ?.filter(s => s.status === 'pending')
                  .map((submission) => (
                    <SubmissionCard key={submission.studentId} submission={submission} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Student View: Assignment List
  const renderStudentAssignmentView = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <FileText className="mr-3 h-6 w-6 text-pink-600" />
        <h2 className="text-2xl font-bold text-gray-800">Your Assignments</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? "default" : "outline"} 
          onClick={() => setFilter('all')}
          className={filter === 'all' ? "bg-gradient-to-r from-pink-500 to-purple-600" : "border-pink-200 text-pink-600 hover:bg-pink-50"}
        >
          All
        </Button>
        <Button 
          variant={filter === 'upcoming' ? "default" : "outline"} 
          onClick={() => setFilter('upcoming')}
          className={filter === 'upcoming' ? "bg-gradient-to-r from-blue-500 to-cyan-600" : "border-blue-200 text-blue-600 hover:bg-blue-50"}
        >
          Upcoming
        </Button>
        <Button 
          variant={filter === 'past' ? "default" : "outline"} 
          onClick={() => setFilter('past')}
          className={filter === 'past' ? "bg-gradient-to-r from-gray-500 to-gray-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
        >
          Past
        </Button>
      </div>
      
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="overflow-hidden bg-white/60 backdrop-blur-sm border-pink-100 hover:shadow-lg transition-all">
              <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-gray-800">{assignment.title}</CardTitle>
                  <Badge className={`${getSubjectColor(assignment.subjectArea)} border`}>
                    {assignment.subjectArea.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {assignment.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {assignment.descriptionImages?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {assignment.descriptionImages.map((image, index) => (
                      <div key={`${assignment.id}-student-image-${index}`} className="relative h-24 w-full overflow-hidden rounded-md border border-pink-100">
                        <img
                          src={image}
                          alt={`${assignment.title} reference ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {assignment.instructions?.trim() && (
                  <div className="rounded-md border border-pink-100 bg-pink-50/70 p-3 text-sm text-gray-700">
                    {assignment.instructions}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                  <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-purple-500" />
                  <span className={isAssignmentOverdue(assignment.dueDate) ? "text-red-600 font-medium" : "text-gray-600"}>
                    Due: {formatDueDate(assignment.dueDate)}
                    {isAssignmentOverdue(assignment.dueDate) && " (Overdue)"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-white/80 border-t border-pink-100">
                <Button 
                  className={`w-full ${isAssignmentOverdue(assignment.dueDate) 
                    ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                    : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  }`}
                  onClick={() => navigate('/submit', { state: { assignmentId: assignment.id } })}
                >
                  {isAssignmentOverdue(assignment.dueDate) ? "Submit Late" : "Submit Assignment"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white/60 backdrop-blur-sm border border-pink-100 rounded-lg p-12">
            <FileText className="mx-auto h-16 w-16 text-pink-300 mb-6" />
            <h3 className="text-xl font-medium text-gray-800 mb-3">No assignments found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              {filter === 'all' 
                ? "You don't have any assignments yet." 
                : filter === 'upcoming' 
                  ? "You don't have any upcoming assignments." 
                  : "You don't have any past assignments."}
            </p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setFilter('all')}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                View All Assignments
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PageLayout 
      title="Assignments" 
      subtitle={state.isTeacher ? "Create and manage assignments for your students" : "View, submit, and track your academic assignments"}
      className="py-8"
    >
      <div className="container px-6 max-w-7xl mx-auto">
  {state.isTeacher ? renderTeacherAssignmentView() : renderStudentAssignmentView()}
      </div>
    </PageLayout>
  );
};

export default Assignments;