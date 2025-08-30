
import React from 'react';
import { Button } from '@/components/ui/button';

interface ReportImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

const ReportImagePreview: React.FC<ReportImagePreviewProps> = ({ imageUrl, onRemove }) => (
  <div className="w-full">
    <img 
      src={imageUrl} 
      alt="Report Card Preview" 
      className="max-h-64 mx-auto object-contain rounded-md shadow-sm" 
    />
    <Button 
      variant="ghost" 
      size="sm" 
      className="mt-4"
      onClick={onRemove}
    >
      Remove image
    </Button>
  </div>
);

export default ReportImagePreview;
