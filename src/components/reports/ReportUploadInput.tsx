
import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportUploadInputProps {
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReportUploadInput: React.FC<ReportUploadInputProps> = ({ onSelectFile }) => (
  <>
    <Upload className="h-12 w-12 text-gray-400 mb-4" />
    <p className="text-sm text-gray-500 text-center mb-2">
      Drag and drop your image here, or click to browse
    </p>
    <p className="text-xs text-gray-400 text-center mb-4">
      Supports JPEG, PNG • Max size 5MB
    </p>
    <Button
      variant="outline"
      onClick={() => document.getElementById('report-upload')?.click()}
    >
      Select File
    </Button>
    <input
      id="report-upload"
      type="file"
      className="hidden"
      accept="image/jpeg,image/png"
      onChange={onSelectFile}
    />
  </>
);

export default ReportUploadInput;
