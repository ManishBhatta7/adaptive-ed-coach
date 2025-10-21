import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { DoubtCard } from './DoubtCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Plus, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Doubt {
  id: string;
  title: string;
  description: string;
  subject_area: string | null;
  status: 'open' | 'in_progress' | 'solved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  response_count?: number;
}

interface DoubtsListProps {
  onNewDoubt: () => void;
  onViewDoubt: (doubt: Doubt) => void;
  onSolveDoubt: (doubt: Doubt) => void;
  refreshTrigger?: number;
}

export const DoubtsList = ({ onNewDoubt, onViewDoubt, onSolveDoubt, refreshTrigger }: DoubtsListProps) => {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [filteredDoubts, setFilteredDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const { state } = useAppContext();
  const { toast } = useToast();

  const fetchDoubts = async () => {
    if (!state.currentUser?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doubts')
        .select('*')
        .eq('student_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get response counts for each doubt
      const doubtsWithCounts = await Promise.all(
        (data || []).map(async (doubt) => {
          const { count } = await supabase
            .from('doubt_responses')
            .select('*', { count: 'exact', head: true })
            .eq('doubt_id', doubt.id);
          
          return {
            ...doubt,
            status: doubt.status as 'open' | 'in_progress' | 'solved' | 'closed',
            priority: doubt.priority as 'low' | 'medium' | 'high' | 'urgent',
            response_count: count || 0
          };
        })
      );

      setDoubts(doubtsWithCounts);
    } catch (error: any) {
      console.error('Error fetching doubts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your doubts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [state.currentUser?.id, refreshTrigger]);

  useEffect(() => {
    let filtered = [...doubts];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(doubt =>
        doubt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doubt.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doubt => doubt.status === statusFilter);
    }

    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(doubt => doubt.subject_area === subjectFilter);
    }

    setFilteredDoubts(filtered);
  }, [doubts, searchTerm, statusFilter, subjectFilter]);

  const getUniqueSubjects = () => {
    const subjects = doubts
      .map(doubt => doubt.subject_area)
      .filter(Boolean)
      .filter((subject, index, array) => array.indexOf(subject) === index);
    return subjects;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your doubts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">My Doubts</h2>
        </div>
        <Button onClick={onNewDoubt} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ask New Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your doubts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="solved">Solved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {getUniqueSubjects().map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject?.replace('_', ' ') || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doubts List */}
      {filteredDoubts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {doubts.length === 0 ? 'No doubts yet' : 'No doubts match your filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {doubts.length === 0 
                ? 'Start by asking your first question. Our AI will help you understand any topic!'
                : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
              }
            </p>
            {doubts.length === 0 && (
              <Button onClick={onNewDoubt} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ask Your First Question
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map(doubt => (
            <DoubtCard
              key={doubt.id}
              doubt={doubt}
              onViewDetails={onViewDoubt}
              onSolve={onSolveDoubt}
            />
          ))}
        </div>
      )}
    </div>
  );
};