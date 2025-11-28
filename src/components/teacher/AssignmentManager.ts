import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import AnswerSheetUploader from '@/components/answer-sheet/AnswerSheetUploader';
import { AssignmentService, Assignment } from '@/services/AssignmentService';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, FileText, CheckCircle2, Loader2, Calendar, ChevronRight, Settings2 } from 'lucide-react';

const AssignmentManager = () => {
  const { state } = useAppContext();
  const { currentUser } = state;
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [qPaper, setQPaper] = useState<File | null>(null);
  const [markScheme, setMarkScheme] = useState<File | null>(null);
  const [gradingCalibration, setGradingCalibration] = useState(currentUser?.gradingStyle || 'Balanced');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const data = await AssignmentService.getTeacherAssignments();
    setAssignments(data);
  };

  const handleUpload = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `assignments/${folder}/${uuidv4()}.${fileExt}`;
    const { error } = await supabase.storage.from('submissions').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('submissions').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreate = async () => {
    if (!currentUser || !title) return;
    setIsLoading(true);

    try {
      let qPaperUrl = undefined;
      let markSchemeUrl = undefined;

      if (qPaper) qPaperUrl = await handleUpload(qPaper, 'questions');
      if (markScheme) markSchemeUrl = await handleUpload(markScheme, 'rubrics');

      // We save the calibration in the description or a metadata field (simplified here)
      const calibratedDesc = `[AI_GRADING_STYLE: ${gradingCalibration}]\n\n${description}`;

      const newAssignment = await AssignmentService.createAssignment(
        currentUser.id,
        title,
        calibratedDesc,
        qPaperUrl,
        markSchemeUrl
      );

      if (newAssignment) {
        setAssignments([newAssignment, ...assignments]);
        setIsCreating(false);
        resetForm();
        toast({ title: "Published!", description: "Assignment is live for students." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this assignment?")) {
      const success = await AssignmentService.deleteAssignment(id);
      if (success) setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setQPaper(null); setMarkScheme(null); setStep(1);
  };

  return (
    <div className="space-y-6">
      {!isCreating ? (
        // LIST VIEW
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Class Assignments</h2>
            <Button onClick={() => setIsCreating(true)} className="bg-edu-primary hover:bg-edu-secondary">
              <Plus className="w-4 h-4 mr-2" /> Create New
            </Button>
          </div>
          
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-5 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{assignment.title}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">{assignment.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{assignment.description?.replace(/\[AI_GRADING_STYLE:.*?\]/, '')}</p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                      <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                      {assignment.question_paper_url && <span className="text-blue-600 flex items-center"><FileText className="w-3 h-3 mr-1"/> QP</span>}
                      {assignment.marking_scheme_url && <span className="text-purple-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Key</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // WIZARD VIEW
        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden">
          <CardHeader className="bg-white border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle>Create Assignment</CardTitle>
              <Badge variant="outline">Step {step} of 3</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* STEP 1: DETAILS */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignment Title</label>
                  <Input placeholder="e.g., Calculus Midterm" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea placeholder="Instructions for students..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!title}>Next Step <ChevronRight className="ml-2 h-4 w-4"/></Button>
                </div>
              </div>
            )}

            {/* STEP 2: FILES */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <AnswerSheetUploader title="Question Paper" description="Upload PDF Test" onFileSelected={setQPaper} isProcessing={false} />
                  <AnswerSheetUploader title="Marking Scheme" description="Upload Answer Key" onFileSelected={setMarkScheme} isProcessing={false} />
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Next Step <ChevronRight className="ml-2 h-4 w-4"/></Button>
                </div>
              </div>
            )}

            {/* STEP 3: AI CALIBRATION */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-white p-4 rounded-lg border space-y-2">
                  <h3 className="font-medium flex items-center gap-2"><Settings2 className="w-4 h-4 text-purple-600"/> Grading Strictness</h3>
                  <p className="text-sm text-gray-500">How should the AI grade this specific assignment?</p>
                  <div className="flex gap-2 mt-2">
                    {['Strict', 'Balanced', 'Growth-Oriented'].map((style) => (
                      <Button
                        key={style}
                        variant={gradingCalibration === style ? 'default' : 'outline'}
                        onClick={() => setGradingCalibration(style as any)}
                        className="flex-1"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleCreate} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                    Publish Assignment
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentManager;