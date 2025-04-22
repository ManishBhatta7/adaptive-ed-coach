
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubjectArea, CoachingMode } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface SubmissionFormProps {
  onSubmit: (submission: {
    title: string;
    content: string;
    subjectArea: SubjectArea;
    coachingMode: CoachingMode;
    file?: File;
  }) => void;
}

const SubmissionForm = ({ onSubmit }: SubmissionFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectArea, setSubjectArea] = useState<SubjectArea>(SubjectArea.OTHER);
  const [coachingMode, setCoachingMode] = useState<CoachingMode>(CoachingMode.QUICK_FEEDBACK);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !subjectArea) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      onSubmit({
        title,
        content,
        subjectArea,
        coachingMode,
        file
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setSubjectArea(SubjectArea.OTHER);
      setFile(undefined);
    } catch (error) {
      console.error('Error submitting assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
          <CardDescription>
            Enter your assignment or response for personalized AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject Area
            </label>
            <Select
              value={subjectArea}
              onValueChange={(value) => setSubjectArea(value as SubjectArea)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SubjectArea).map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject.charAt(0).toUpperCase() + subject.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="feedback-type" className="text-sm font-medium">
              Feedback Type
            </label>
            <Select
              value={coachingMode}
              onValueChange={(value) => setCoachingMode(value as CoachingMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CoachingMode.QUICK_FEEDBACK}>
                  Quick Feedback
                </SelectItem>
                <SelectItem value={CoachingMode.DETAILED_INSIGHT}>
                  Detailed Insight
                </SelectItem>
                <SelectItem value={CoachingMode.PROGRESS_ANALYSIS}>
                  Progress Analysis
                </SelectItem>
                <SelectItem value={CoachingMode.STYLE_SPECIFIC}>
                  Learning Style Specific
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Your Response
            </label>
            <Textarea
              id="content"
              placeholder="Enter your essay, answer, or work here..."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium">
              Attach Document or Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? 'Change File' : 'Upload File'}
              </Button>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            {file && (
              <p className="text-xs text-gray-500 mt-2">
                Selected file: {file.name}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Feedback'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SubmissionForm;
