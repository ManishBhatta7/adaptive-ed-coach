import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AnswerSheetFeedback from '@/components/answer-sheet/AnswerSheetFeedback';
import AnswerSheetUploader from '@/components/answer-sheet/AnswerSheetUploader';
import { SubmissionService } from '@/services/SubmissionService';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Sparkles } from 'lucide-react';

const AnswerSheetPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated, currentUser } = state;
  const { toast } = useToast();
  
  // Files
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [markingScheme, setMarkingScheme] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // Helper to upload a single file
  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser?.id}/${folder}/${uuidv4()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('submissions').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAnalyze = async () => {
    if (!currentUser || !studentFile) return;
    
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      // 1. Upload Student Answer (Mandatory)
      const studentFileUrl = await uploadFile(studentFile, 'answers');
      
      // 2. Upload Context Files (Optional)
      let questionPaperUrl = undefined;
      if (questionPaper) {
        questionPaperUrl = await uploadFile(questionPaper, 'questions');
      }

      let markingSchemeUrl = undefined;
      if (markingScheme) {
        markingSchemeUrl = await uploadFile(markingScheme, 'rubrics');
      }

      // 3. Create Submission Record
      const submission = await SubmissionService.createSubmission(currentUser.id, {
        assignmentType: 'answer_sheet',
        contentData: {
          fileUrl: studentFileUrl,
          questionPaperUrl,
          markingSchemeUrl,
          fileName: studentFile.name
        }
      });

      if (!submission) throw new Error("Failed to create submission record");

      toast({ title: "Files Uploaded", description: "AI is now grading your submission..." });

      // 4. Trigger AI Analysis
      const { analysis, error } = await SubmissionService.analyzeSubmission(
        submission.id,
        "IMAGE_ANALYSIS",
        'General',
        'answer_sheet',
        undefined, 
        undefined, 
        studentFileUrl,
        questionPaperUrl,
        markingSchemeUrl
      );

      if (error) throw new Error(error);

      setFeedback({
        content: analysis.line_by_line_feedback || [analysis.overall_feedback],
        completed: true,
        score: analysis.score,
        strengths: analysis.strengths || [],
        improvements: analysis.missing_concepts || analysis.improvements || []
      });

      toast({ title: "Grading Complete!", description: `You scored ${analysis.score}/100` });

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <MainLayout>
      <div className="container px-4 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Grader (Multi-File)</h1>
          <p className="text-gray-600">Upload your answer sheet along with the question paper for precise grading.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Context */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-edu-secondary"/>
              Set Context (Optional)
            </h2>
            
            <AnswerSheetUploader 
              title="1. Question Paper"
              description="Upload the original test PDF."
              onFileSelected={setQuestionPaper}
              isProcessing={isAnalyzing}
            />
            
            <AnswerSheetUploader 
              title="2. Marking Scheme"
              description="Upload correct answers/rubric."
              onFileSelected={setMarkingScheme}
              isProcessing={isAnalyzing}
            />
          </div>

          {/* Right Column: Student Work */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-gray-800">Student Submission (Required)</h2>
            
            <AnswerSheetUploader 
              title="3. Student Answer Sheet"
              description="Upload the handwritten work to be graded."
              onFileSelected={setStudentFile}
              isProcessing={isAnalyzing}
            />

            <Button 
              size="lg" 
              className="w-full mt-4" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !studentFile}
            >
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Grading with Gemini 2.0...</> : "Analyze & Grade"}
            </Button>
          </div>
        </div>

        {feedback && <AnswerSheetFeedback feedback={feedback} />}
      </div>
    </MainLayout>
  );
};

export default AnswerSheetPage;