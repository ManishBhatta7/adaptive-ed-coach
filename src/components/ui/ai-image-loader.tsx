import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIImageLoaderProps {
  prompt?: string;
  className?: string;
  width?: number;
  height?: number;
  autoLoad?: boolean;
}

const AIImageLoader = ({ 
  prompt = "Create a beautiful educational diagram with modern design and vibrant colors", 
  className = "",
  width = 512,
  height = 512,
  autoLoad = true
}: AIImageLoaderProps) => {
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          action: 'generate_educational_image',
          context: {
            userMessage: prompt,
            imageSpecs: {
              width,
              height,
              format: 'png',
              quality: 'high'
            }
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.agent_response?.function_results?.[0]?.result?.image_url) {
        setImageUrl(data.agent_response.function_results[0].result.image_url);
        toast({
          title: "Image Generated!",
          description: "Your AI-generated image is ready."
        });
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'Failed to generate image');
      toast({
        title: "Generation Failed",
        description: "Could not generate the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      generateImage();
    }
  }, [autoLoad, prompt]);

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'ai-generated-image.png';
      link.click();
    }
  };

  if (error) {
    return (
      <Card className={`border-destructive/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-4">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Failed to generate image</p>
          </div>
          <Button 
            onClick={generateImage}
            variant="outline"
            size="sm"
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className={`aspect-square w-full max-w-md mx-auto`} style={{ height: `${height}px` }} />
            <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Generating AI image...</span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (imageUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative group">
              <img 
                src={imageUrl} 
                alt="AI Generated Educational Content"
                className="w-full h-auto rounded-lg shadow-sm border"
                style={{ maxWidth: `${width}px`, maxHeight: `${height}px` }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button 
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button 
                onClick={generateImage}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial state when not auto-loading
  return (
    <Card className={className}>
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-medium mb-2">Generate AI Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click to generate an educational diagram with AI
            </p>
          </div>
          <Button onClick={generateImage}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Generate Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIImageLoader;