
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubjectArea, CoachingMode } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { ValidatedTextarea } from '@/components/ui/validated-textarea';
import { titleSchema, contentSchema, validateFile } from '@/utils/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

const submissionSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  subjectArea: z.nativeEnum(SubjectArea),
  coachingMode: z.nativeEnum(CoachingMode)
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

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
  const [formData, setFormData] = useState<SubmissionFormData>({
    title: '',
    content: '',
    subjectArea: SubjectArea.OTHER,
    coachingMode: CoachingMode.QUICK_FEEDBACK
  });
  const [file, setFile] = useState<File | undefined>(undefined);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    errors,
    isSubmitting,
    hasErrors,
    validateField,
    handleSubmit,
    markTouched,
    getFieldError
  } = useFormValidation({
    schema: submissionSchema,
    onSubmit: async (data) => {
      // Ensure all required fields are present before calling onSubmit
      if (data.title && data.content && data.subjectArea && data.coachingMode) {
        onSubmit({
          title: data.title,
          content: data.content,
          subjectArea: data.subjectArea,
          coachingMode: data.coachingMode,
          file
        });
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          subjectArea: SubjectArea.OTHER,
          coachingMode: CoachingMode.QUICK_FEEDBACK
        });
        setFile(undefined);
        setFileError(null);
      }
    }
  });

  const handleInputChange = (field: keyof SubmissionFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSelectChange = (field: keyof SubmissionFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
        required: false
      });
      
      if (error) {
        setFileError(error);
        setFile(undefined);
      } else {
        setFileError(null);
        setFile(selectedFile);
      }
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.keys(formData).forEach(key => markTouched(key));
    handleSubmit(formData);
  };

  return (
    <Card className="w-full">
      <form onSubmit={onFormSubmit}>
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
          <CardDescription>
            Enter your assignment or response for personalized AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedInput
            id="title"
            label="Title"
            placeholder="Assignment title"
            value={formData.title}
            onChange={handleInputChange('title')}
            onBlur={() => markTouched('title')}
            validator={(value) => {
              try {
                titleSchema.parse(value);
                return null;
              } catch (error) {
                if (error instanceof z.ZodError) {
                  return error.errors[0]?.message || 'Invalid title';
                }
                return 'Invalid title';
              }
            }}
            required
            disabled={isSubmitting}
          />
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject Area
            </label>
            <Select
              value={formData.subjectArea}
              onValueChange={handleSelectChange('subjectArea')}
              disabled={isSubmitting}
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
              value={formData.coachingMode}
              onValueChange={handleSelectChange('coachingMode')}
              disabled={isSubmitting}
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
          
          <ValidatedTextarea
            id="content"
            label="Your Response"
            placeholder="Enter your essay, answer, or work here..."
            className="min-h-[200px]"
            value={formData.content}
            onChange={handleInputChange('content')}
            onBlur={() => markTouched('content')}
            validator={(value) => {
              try {
                contentSchema.parse(value);
                return null;
              } catch (error) {
                if (error instanceof z.ZodError) {
                  return error.errors[0]?.message || 'Invalid content';
                }
                return 'Invalid content';
              }
            }}
            showCharCount
            maxLength={5000}
            required
            disabled={isSubmitting}
          />
          
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            {file && (
              <p className="text-xs text-gray-500 mt-2">
                Selected file: {file.name}
              </p>
            )}
            {fileError && (
              <p className="text-xs text-red-600 mt-2">
                {fileError}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || hasErrors}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Feedback'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SubmissionForm;
