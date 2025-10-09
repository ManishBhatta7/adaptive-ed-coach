import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Youtube, Loader2 } from 'lucide-react';

interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  url: string;
}

const FastContentImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importedVideos, setImportedVideos] = useState<VideoMetadata[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const { toast } = useToast();

  // Function to extract video ID from various YouTube URL formats
  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Function to quickly get video metadata using oEmbed
  const getVideoMetadata = async (url: string): Promise<VideoMetadata | null> => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!response.ok) throw new Error('Failed to fetch video metadata');
      
      const data = await response.json();
      return {
        id: videoId,
        title: data.title,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: url
      };
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      return null;
    }
  };

  // Handle paste event for single video
  const handleUrlPaste = async (event: React.ClipboardEvent<HTMLInputElement>) => {
    const url = event.clipboardData.getData('text');
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;

    event.preventDefault();
    const input = event.currentTarget;
    input.value = url;

    try {
      setIsImporting(true);
      const metadata = await getVideoMetadata(url);
      
      if (metadata) {
        setImportedVideos(prev => [...prev, metadata]);
        input.value = '';
        toast({
          title: 'Video added',
          description: `Successfully added: ${metadata.title}`,
        });
      } else {
        toast({
          title: 'Invalid URL',
          description: 'Could not process this YouTube URL',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import video',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle batch import
  const handleBatchImport = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    if (!text.includes('\n')) return; // Only process when new line is detected

    const urls = text
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && (url.includes('youtube.com') || url.includes('youtu.be')));

    if (urls.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: urls.length });

    try {
      for (let i = 0; i < urls.length; i++) {
        const metadata = await getVideoMetadata(urls[i]);
        if (metadata) {
          setImportedVideos(prev => [...prev, metadata]);
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      event.target.value = '';
      toast({
        title: 'Batch import completed',
        description: `Successfully processed ${urls.length} URLs`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete batch import',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            Fast YouTube Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-url">Single Video URL</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="video-url"
                placeholder="Paste a YouTube video URL"
                disabled={isImporting}
                className="min-h-[44px]"
                aria-label="YouTube video URL input"
              />
              <Button
                className="w-full sm:w-auto min-h-[44px]"
                onClick={async () => {
                  const input = document.getElementById('video-url') as HTMLInputElement;
                  const url = input.value;
                  if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
                  setIsImporting(true);
                  const metadata = await getVideoMetadata(url);
                  if (metadata) {
                    setImportedVideos(prev => [...prev, metadata]);
                    input.value = '';
                    toast({
                      title: 'Video added',
                      description: `Successfully added: ${metadata.title}`,
                    });
                  } else {
                    toast({
                      title: 'Invalid URL',
                      description: 'Could not process this YouTube URL',
                      variant: 'destructive',
                    });
                  }
                  setIsImporting(false);
                }}
                disabled={isImporting}
              >
                Import
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="batch-urls">Batch Import</Label>
            <Textarea
              id="batch-urls"
              placeholder="Paste multiple YouTube URLs (press Enter after pasting)"
              onChange={handleBatchImport}
              disabled={isImporting}
              rows={5}
            />
          </div>

          {isImporting && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Processing videos...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          )}

          {importedVideos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Imported Videos ({importedVideos.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {importedVideos.map((video) => (
                  <Card 
                    key={video.id} 
                    className={`overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                      selectedVideos.includes(video.id) ? 'border-blue-500 scale-[1.02]' : 'border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                          className="backdrop-blur-sm"
                        >
                          Preview Video
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium truncate">{video.title}</h4>
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2 gap-2">
                        <Button
                          variant={selectedVideos.includes(video.id) ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 min-h-[36px]"
                          onClick={() => {
                            setSelectedVideos((prev) =>
                              prev.includes(video.id)
                                ? prev.filter(id => id !== video.id)
                                : [...prev, video.id]
                            );
                          }}
                        >
                          {selectedVideos.includes(video.id) ? (
                            <>✓ Selected</>
                          ) : (
                            <>Select</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[36px]"
                          onClick={() => setImportedVideos(prev => 
                            prev.filter(v => v.id !== video.id)
                          )}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedVideos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-blue-600">Selected Videos for Learning Path:</h4>
                  <ul className="list-disc ml-6">
                    {selectedVideos.map(id => {
                      const video = importedVideos.find(v => v.id === id);
                      return video ? <li key={id}>{video.title}</li> : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FastContentImporter;