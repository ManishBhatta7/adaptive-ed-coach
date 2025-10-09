import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Clock, Star, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  topic: string;
  lessonNumber: string;
  tags: string[];
  createdAt: string;
  steps: any[];
}

interface LearningPathBrowserProps {
  onPathSelect?: (path: LearningPath) => void;
}

export default function LearningPathBrowser({ onPathSelect }: LearningPathBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    topic: '',
  });
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch public learning paths
  const fetchPaths = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/learning-paths/public');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setPaths(result.data || []);
    } catch (error) {
      console.error('Error fetching paths:', error);
      toast({
        title: 'Error loading learning paths',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setPaths([]);
    } finally {
      setLoading(false);
    }
  };

  // Clone a learning path
  const clonePath = async (path: LearningPath) => {
    try {
      const response = await fetch('/api/learning-paths/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pathId: path.id }),
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Learning path cloned successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clone learning path',
        variant: 'destructive',
      });
    }
  };

  // Filter paths based on search and filters
  const filteredPaths = paths.filter(path => {
    const matchesSearch = 
      path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade = !filters.grade || path.grade === filters.grade;
    const matchesSubject = !filters.subject || path.subject === filters.subject;
    const matchesTopic = !filters.topic || path.topic.toLowerCase().includes(filters.topic.toLowerCase());

    return matchesSearch && matchesGrade && matchesSubject && matchesTopic;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse Learning Paths</CardTitle>
          <CardDescription>
            Discover and reuse learning paths created by other teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search paths by title, description, or tags..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setFilters({ grade: '', subject: '', topic: '' })}
              >
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters.grade}
                onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(grade => (
                    <SelectItem key={grade} value={grade}>{grade} Grade</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.subject}
                onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  {['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter by topic..."
                value={filters.topic}
                onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, n) => (
            <Card key={n} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPaths.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="text-lg font-semibold">No Learning Paths Found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredPaths.map((path) => (
          <Card key={path.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start gap-4">
                <span className="flex-1">{path.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clonePath(path)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{path.grade} Grade</Badge>
                  <Badge variant="outline">{path.subject}</Badge>
                  {path.topic && <Badge variant="outline">{path.topic}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {path.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(path.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {path.steps.length} steps
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => onPathSelect?.(path)}
                >
                  Use This Path
                </Button>
              </div>
            </CardContent>
          </Card>
        )))}
      </div>
    </div>
  );
}