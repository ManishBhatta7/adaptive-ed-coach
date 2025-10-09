import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Youtube, MessageCircle, Gamepad2, FlaskConical } from 'lucide-react';

interface LearningPathCuratorProps {
  onPathCreated: (path: any) => void;
  importedVideos?: Array<{ id: string; title: string; url: string; thumbnailUrl: string }>;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

function LearningPathCurator(props: LearningPathCuratorProps) {
  const { onPathCreated, importedVideos = [] } = props;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState({
    grade: '',
    subject: '',
    topic: '',
    lessonNumber: '',
    isPublic: true,
    tags: [] as string[]
  });
  interface StepContent {
    message?: string;
    interaction?: any;
    videoUrl?: string;
    timestamp?: number;
    gameType?: string;
    experimentSteps?: string[];
    title?: string;
  }

  interface StepState {
    type: string;
    content: StepContent;
    rewards: { points: number };
  }

  const [currentStep, setCurrentStep] = useState<StepState>({
    type: '',
    content: {},
    rewards: { points: 0 }
  });
  const { toast } = useToast();

  const handleYouTubeURLPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('youtube.com') || text.includes('youtu.be')) {
      e.preventDefault();
      try {
        // Extract video ID and fetch video details
        const videoId = text.includes('youtu.be') 
          ? text.split('youtu.be/')[1]
          : text.split('v=')[1].split('&')[0];
          
        // You'll need to implement the actual YouTube API call here
        // This is just a placeholder
        const response = await fetch(`/api/youtube/video/${videoId}`);
        const videoData = await response.json();
        
        setCurrentStep({
          ...currentStep,
          type: 'video',
          content: {
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            title: videoData.title,
            timestamp: 0
          }
        });
      } catch (error) {
        toast({
          title: "Error processing YouTube URL",
          description: "Please check the URL and try again",
          variant: "destructive"
        });
      }
    }
  };

  const addStep = () => {
    if (currentStep.type === 'conversation' && !currentStep.content.message) {
      toast({
        title: "Missing content",
        description: "Please add some content to your step",
        variant: "destructive"
      });
      return;
    }
    
    setSteps([...steps, { ...currentStep, id: Date.now().toString() }]);
    setCurrentStep({
      type: 'conversation',
      content: {},
      rewards: { points: 0 }
    });
  };

  const validatePath = () => {
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please provide a title for your learning path", variant: "destructive" });
      return false;
    }
    if (!description.trim()) {
      toast({ title: "Missing description", description: "Please provide a description for your learning path", variant: "destructive" });
      return false;
    }
    if (steps.length === 0) {
      toast({ title: "No steps added", description: "Please add at least one step to your learning path", variant: "destructive" });
      return false;
    }
    if (!metadata.grade) {
      toast({ title: "Missing grade level", description: "Please select a grade level for your learning path", variant: "destructive" });
      return false;
    }
    if (!metadata.subject) {
      toast({ title: "Missing subject", description: "Please select a subject for your learning path", variant: "destructive" });
      return false;
    }
    if (!metadata.topic.trim()) {
      toast({ title: "Missing topic", description: "Please provide a topic for your learning path", variant: "destructive" });
      return false;
    }
    return true;
  };

  const saveLearningPath = async () => {
    if (!validatePath()) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/learning-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          steps,
          ...metadata,
          topic: metadata.topic.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Learning path has been created",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save learning path",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Interactive Learning Path</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter learning path title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="grade" className="text-sm font-medium">Grade Level</Label>
              <Select
                onValueChange={(value) => setMetadata(prev => ({ ...prev, grade: value }))}
                value={metadata.grade}
              >
                <SelectTrigger id="grade" className="h-11">
                  <SelectValue placeholder="Select grade" />
                <SelectContent>
                  {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(grade => (
                    <SelectItem key={grade} value={grade}>{grade} Grade</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
              <Select
                onValueChange={(value) => setMetadata(prev => ({ ...prev, subject: value }))}
                value={metadata.subject}
              >
                <SelectTrigger id="subject" className="h-11">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={metadata.topic}
                onChange={(e) => setMetadata(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Algebra, Newton's Laws"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessonNumber" className="text-sm font-medium">Lesson Number</Label>
              <Input
                id="lessonNumber"
                className="h-11"
                value={metadata.lessonNumber}
                onChange={(e) => setMetadata(prev => ({ ...prev, lessonNumber: e.target.value }))}
                placeholder="e.g., 1.2, Chapter 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
              <Input
                id="tags"
                className="h-11"
                placeholder="Add tags (comma separated)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim();
                    if (tag && !metadata.tags.includes(tag)) {
                      setMetadata(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag]
                      }));
                      input.value = '';
                    }
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {metadata.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => {
                      setMetadata(prev => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.isPublic}
                  onChange={(e) => setMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Make this learning path public
              </Label>
              <p className="text-sm text-gray-500">Public paths can be discovered and reused by other teachers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={currentStep.type === 'conversation' ? 'default' : 'outline'}
              onClick={() => setCurrentStep({ ...currentStep, type: 'conversation' })}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversation
            </Button>
            <Button
              variant={currentStep.type === 'video' ? 'default' : 'outline'}
              onClick={() => setCurrentStep({ ...currentStep, type: 'video' })}
            >
              <Youtube className="w-4 h-4 mr-2" />
              Video
            </Button>
            <Button
              variant={currentStep.type === 'game' ? 'default' : 'outline'}
              onClick={() => setCurrentStep({ ...currentStep, type: 'game' })}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Game
            </Button>
            <Button
              variant={currentStep.type === 'experiment' ? 'default' : 'outline'}
              onClick={() => setCurrentStep({ ...currentStep, type: 'experiment' })}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Experiment
            </Button>
          </div>

          {currentStep.type === 'conversation' && (
            <div className="space-y-4">
              <Textarea
                className="min-h-[120px] p-4 text-base"
                placeholder="Enter conversation message..."
                value={currentStep.content.message || ''}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  content: { ...currentStep.content, message: e.target.value }
                })}
              />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add interaction options (optional)</Label>
                <Input
                  className="h-11"
                  placeholder="Option 1, Option 2, Option 3..."
                  onChange={(e) => {
                    const options = e.target.value.split(',').map(opt => opt.trim());
                    setCurrentStep({
                      ...currentStep,
                      content: {
                        ...currentStep.content,
                        interaction: {
                          type: 'choice',
                          options
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>
          )}

          {currentStep.type === 'video' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Imported Video</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {importedVideos.length > 0 ? importedVideos.map(video => (
                    <Card key={video.id} className="overflow-hidden cursor-pointer border-2 border-blue-200 hover:border-blue-500" onClick={() => setCurrentStep({
                      ...currentStep,
                      content: { ...currentStep.content, videoUrl: video.url, title: video.title }
                    })}>
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full aspect-video object-cover" />
                      <CardContent className="p-2">
                        <h4 className="font-medium truncate">{video.title}</h4>
                      </CardContent>
                    </Card>
                  )) : <span className="text-gray-500">No imported videos available</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timestamp (optional)</Label>
                <Input
                  type="number"
                  placeholder="Start time in seconds"
                  onChange={(e) => setCurrentStep({
                    ...currentStep,
                    content: { ...currentStep.content, timestamp: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          )}

          {currentStep.type === 'game' && (
            <div className="space-y-4">
              <Select
                onValueChange={(value) => setCurrentStep({
                  ...currentStep,
                  content: { gameType: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select game type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="click">Click Challenge</SelectItem>
                  <SelectItem value="drag">Drag and Match</SelectItem>
                  <SelectItem value="match">Memory Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {currentStep.type === 'experiment' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Enter experiment steps (one per line)"
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  content: { 
                    experimentSteps: e.target.value.split('\n').filter(step => step.trim())
                  }
                })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Reward Points</Label>
            <Input
              type="number"
              className="h-11"
              value={currentStep.rewards.points}
              onChange={(e) => setCurrentStep({
                ...currentStep,
                rewards: { ...currentStep.rewards, points: parseInt(e.target.value) }
              })}
              placeholder="Points for completing this step"
            />
          </div>

          <Button onClick={addStep} className="w-full sm:w-auto h-11">Add Step</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Steps</h3>
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <div className="w-full sm:w-auto">
                  <span className="font-medium block">Step {index + 1}: {step.type}</span>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {step.type === 'conversation' && step.content.message}
                    {step.type === 'video' && 'Video: ' + step.content.videoUrl}
                    {step.type === 'game' && 'Game: ' + step.content.gameType}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge className="whitespace-nowrap">{step.rewards.points} points</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[36px]"
                    onClick={() => {
                      const stepsCopy = [...steps];
                      stepsCopy.splice(index, 1);
                      setSteps(stepsCopy);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={saveLearningPath} 
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            'Save Learning Path'
          )}
        </Button>
      </div>
    </div>
  );
};

export default LearningPathCurator;