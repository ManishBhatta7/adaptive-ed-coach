import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, FileType, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

// PDF.js Imports
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set up the worker using a stable CDN link to avoid build errors
if (typeof window !== 'undefined') {
  // Using a hardcoded version (4.x) ensures compatibility
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;
}

interface AnswerSheetUploaderProps {
  onTextExtracted: (text: string, file: File) => void;
  onProcessingStart: () => void;
}

const AnswerSheetUploader = ({ onTextExtracted, onProcessingStart }: AnswerSheetUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);
    onProcessingStart();
    setProgress(10);

    try {
      let extractedText = '';

      // === OPTION A: PDF PROCESSING ===
      if (file.type === 'application/pdf') {
        toast({ title: "Processing PDF", description: "Extracting text from document..." });
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the document
        // Cast to 'any' to prevent TypeScript "implicit any" errors
        const loadingTask: any = getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
            let fullText = '';
            const totalPages = pdf.numPages;
    
            // Loop through all pages
            for (let i = 1; i <= totalPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              
              // Extract text items safely
              const pageText = textContent.items
                .map((item: any) => item.str || '') // Handle potential missing 'str'
                .join(' ');
              
              fullText += `--- Page ${i} ---\n${pageText}\n\n`;
              
              // Update progress
              setProgress(10 + Math.round((i / totalPages) * 80));
            }
    
            extractedText = fullText;
          }
          // You can add more file type handling here (e.g., images for OCR)
    
          // Call the callback with the extracted text
          onTextExtracted(extractedText, file);
          setProgress(100);
          setIsProcessing(false);
          } catch (err: any) {
            setError('Failed to process file.');
            setIsProcessing(false);
            setProgress(0);
            toast({
              title: "Error",
              description: err?.message || "An error occurred while processing the file.",
              variant: "destructive",
            });
          }
        };
  
        // Minimal UI: file input and progress display
        return (
          <Card>
            <CardHeader>
              <CardTitle>Upload Answer Sheet</CardTitle>
              <CardDescription>Upload a PDF or image to extract text.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <div style={{ marginTop: 12 }}>
                <Progress value={progress} />
              </div>
              {error && <div style={{ marginTop: 12, color: 'red' }}>{error}</div>}
            </CardContent>
          </Card>
        );
      };
  
      export default AnswerSheetUploader;