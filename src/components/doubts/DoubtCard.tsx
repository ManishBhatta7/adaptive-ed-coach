import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface DoubtCardProps {
  doubt: Doubt;
  onViewDetails: (doubt: Doubt) => void;
  onSolve?: (doubt: Doubt) => void;
}

export const DoubtCard = ({ doubt, onViewDetails, onSolve }: DoubtCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'solved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="h-4 w-4" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
              {doubt.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {doubt.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Badge 
              className={`text-xs ${getStatusColor(doubt.status)} flex items-center gap-1`}
            >
              {getStatusIcon(doubt.status)}
              {doubt.status.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPriorityColor(doubt.priority)}`}
            >
              {doubt.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(doubt.created_at), { addSuffix: true })}
            </div>
            
            {doubt.subject_area && (
              <Badge variant="secondary" className="text-xs">
                {doubt.subject_area.replace('_', ' ')}
              </Badge>
            )}
            
            {doubt.response_count !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {doubt.response_count} responses
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {doubt.status === 'open' && onSolve && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSolve(doubt)}
                className="text-xs"
              >
                Get AI Help
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onViewDetails(doubt)}
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};