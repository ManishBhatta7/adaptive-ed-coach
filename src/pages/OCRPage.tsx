import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OCRPage = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setExtractedText('');
      setProgress(0);
    }
  };

  const processOCR = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');

    try {
      const Tesseract = await import('tesseract.js');

      const result = await Tesseract.recognize(
        selectedImage,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      setExtractedText(result.data.text);
      toast({
        title: 'OCR Complete',
        description: 'Text has been successfully extracted from the image',
      });
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'OCR Failed',
        description: 'Failed to extract text from the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      toast({
        title: 'Copied to clipboard',
        description: 'Text has been copied to your clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy text to clipboard',
        variant: 'destructive',
      });
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Text file download has started',
    });
  };

  const clearAll = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText('');
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Image to Text Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Extract text from images using advanced OCR technology. Upload an image containing text
            and convert it to editable, searchable text format.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload an image</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Supports JPEG, PNG, GIF, BMP • Max 10MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Select Image
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
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
                      >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide' : 'Show'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-contain bg-gray-50"
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
                      {isProcessing ? 'Processing...' : 'Extract Text'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
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
                      <Progress value={progress} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Extracted Text
                </div>
                {extractedText && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadAsText}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder={
                  selectedImage
                    ? 'Click "Extract Text" to process the image...'
                    : 'Upload an image to start extracting text...'
                }
                className="min-h-[400px] font-mono text-sm"
                disabled={isProcessing}
              />
              {extractedText && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>Text extracted: {extractedText.length} characters</p>
                  <p>Words: {extractedText.trim().split(/\s+/).length}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for Better OCR Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Image Quality</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use high-resolution images</li>
                  <li>• Ensure good lighting</li>
                  <li>• Avoid blurry or pixelated images</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Text Layout</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Straight, aligned text works best</li>
                  <li>• Avoid handwritten text</li>
                  <li>• Clear contrast between text and background</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">Supported Formats</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• JPEG, PNG, GIF, BMP</li>
                  <li>• Documents, screenshots</li>
                  <li>• Photos of printed text</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OCRPage;
