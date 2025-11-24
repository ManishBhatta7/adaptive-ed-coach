import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';

interface AnswerSheetUploaderProps {
  onFileSelected: (file: File | null) => void;
  isProcessing: boolean;
  title?: string;
  description?: string;
  acceptedFileTypes?: string;
}

const AnswerSheetUploader = ({ 
  onFileSelected, 
  isProcessing,
  title = "Upload Answer Sheet",
  description = "Upload handwritten notes or PDFs.",
  acceptedFileTypes = "image/*,application/pdf"
}: AnswerSheetUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileSelected(null);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          {selectedFile ? <CheckCircle2 className="h-4 w-4 mr-2 text-green-600"/> : <Upload className="h-4 w-4 mr-2 text-edu-primary" />}
          {title}
        </CardTitle>
        <CardDescription className="text-xs">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div className="text-center hover:bg-gray-50 transition-colors rounded-md cursor-pointer relative py-6 border-2 border-transparent hover:border-edu-primary/10">
            <input
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept={acceptedFileTypes}
              onChange={handleFileChange} 
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center pointer-events-none">
              <FileText className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-xs font-medium text-gray-600">
                Click to upload
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 border rounded-md bg-white shadow-sm">
            <div className="flex items-center overflow-hidden">
              <div className="bg-edu-primary/10 p-2 rounded mr-3">
                <FileText className="h-4 w-4 text-edu-primary flex-shrink-0" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate max-w-[150px]">{selectedFile.name}</p>
                <p className="text-[10px] text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isProcessing && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerSheetUploader;