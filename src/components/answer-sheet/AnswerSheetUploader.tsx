import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

interface AnswerSheetUploaderProps {
  onTextExtracted: (text: string, imageUrl: string) => void;
  onProcessingStart: () => void;
}

const AnswerSheetUploader = ({ onTextExtracted, onProcessingStart }: AnswerSheetUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please select an image smaller than 10MB');
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setError(null);
    setProgress(0);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    onProcessingStart();

    try {
      toast({
        title: 'Processing started',
        description: 'Extracting text from your answer sheet...',
      });

      const result = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progressPercent = Math.round(m.progress * 100);
              setProgress(progressPercent);
              console.log(`OCR Progress: ${progressPercent}%`);
            }
          },
        }
      );

      const extractedText = result.data.text.trim();
      
      if (!extractedText) {
        throw new Error('No text could be extracted from the image. Please ensure the image is clear and contains readable text.');
      }

      console.log('Extracted text:', extractedText);
      
      onTextExtracted(extractedText, previewUrl);
      
      toast({
        title: 'Text extracted successfully',
        description: `Extracted ${extractedText.length} characters from your answer sheet`,
      });

    } catch (error) {
      console.error('OCR Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from the image';
      setError(errorMessage);
      
      toast({
        title: 'OCR Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Answer Sheet
        </CardTitle>
        <CardDescription>
          Upload a clear image of your handwritten answer for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewUrl ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="answer-sheet"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <label 
              htmlFor="answer-sheet" 
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <span className="text-gray-700 font-medium mb-2">
                Click to upload or drag and drop
              </span>
              <span className="text-sm text-gray-500">
                JPG, PNG, or other image formats • Max 10MB
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Selected Image</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={isProcessing}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetForm}
                  disabled={isProcessing}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {showPreview && (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt="Answer sheet preview" 
                  className="w-full max-h-80 object-contain bg-gray-50" 
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processOCR}
                disabled={isProcessing}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Extract Text & Analyze'}
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('answer-sheet')?.click()}
                disabled={isProcessing}
              >
                Change Image
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing image...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tips Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Tips for Better Results:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use good lighting and avoid shadows</li>
            <li>• Ensure text is clearly visible and not blurry</li>
            <li>• Hold the camera steady</li>
            <li>• Make sure all text fits in the frame</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerSheetUploader;