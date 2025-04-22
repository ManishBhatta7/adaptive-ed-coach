
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectArea, PerformanceRecord } from '@/types';
import { Calendar, FileText } from 'lucide-react';

interface RecentSubmissionsProps {
  performances: PerformanceRecord[];
  limit?: number;
}

const RecentSubmissions = ({ performances, limit = 5 }: RecentSubmissionsProps) => {
  // Sort by date (most recent first) and limit the number
  const recentPerformances = [...performances]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>Your latest assignment submissions and feedback</CardDescription>
      </CardHeader>
      <CardContent>
        {recentPerformances.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">You haven't submitted any assignments yet.</p>
            <Button asChild variant="outline">
              <a href="/assignments">View Available Assignments</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPerformances.map((performance) => (
              <div key={performance.id} className="flex items-start space-x-4 p-3 rounded-md hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-edu-light flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-edu-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{performance.title}</h4>
                    {performance.score !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        performance.score >= 80
                          ? 'bg-green-100 text-green-800'
                          : performance.score >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {performance.score}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="capitalize">{performance.subjectArea}</span>
                    <span className="mx-1">•</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(performance.date)}</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">{performance.feedback}</p>
                </div>
              </div>
            ))}
            
            <Button asChild variant="outline" className="w-full mt-4">
              <a href="/progress">View All Submissions</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSubmissions;
