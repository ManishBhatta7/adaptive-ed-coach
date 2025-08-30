
import { useState } from 'react';

interface UseReportFileInputProps {
  toast: any;
}

const useReportFileInput = ({ toast }: UseReportFileInputProps) => {
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadError(null);

      if (!file.type.match('image.*')) {
        setUploadError('Please upload an image file (JPEG, PNG)');
        toast?.({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG)',
          variant: 'destructive'
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Maximum file size is 5MB');
        toast?.({
          title: 'File too large',
          description: 'Maximum file size is 5MB',
          variant: 'destructive'
        });
        return;
      }
      setReportImage(file);
      setReportImageUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setReportImage(null);
    setReportImageUrl(null);
    setUploadError(null);
  };

  return {
    reportImage,
    reportImageUrl,
    uploadError,
    setUploadError,
    handleFileChange,
    clearFile,
  };
};

export default useReportFileInput;
