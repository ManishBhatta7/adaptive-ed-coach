import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Calendar } from 'lucide-react';
import { Assignment, SubjectArea } from '@/types';
import PageLayout from '@/components/layout/PageLayout';

const Assignments = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  useEffect(() => {
    // Collect all assignments from all classrooms
    const assignments: Assignment[] = [];
    state.classrooms.forEach(classroom => {
      classroom.assignments.forEach(assignment => {
        assignments.push(assignment);
      });
    });
    
    setAllAssignments(assignments);
  }, [state.classrooms]);
  
  useEffect(() => {
    const now = new Date();
    
    if (filter === 'all') {
      setFilteredAssignments(allAssignments);
    } else if (filter === 'upcoming') {
      setFilteredAssignments(
        allAssignments.filter(assignment => new Date(assignment.dueDate) >= now)
      );
    } else if (filter === 'past') {
      setFilteredAssignments(
        allAssignments.filter(assignment => new Date(assignment.dueDate) < now)
      );
    }
  }, [allAssignments, filter]);

  const isAssignmentOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };

  const getSubjectColor = (subject: SubjectArea) => {
    const colors: Record<SubjectArea, string> = {
      [SubjectArea.MATH]: "bg-blue-100 text-blue-800 border-blue-200",
      [SubjectArea.SCIENCE]: "bg-green-100 text-green-800 border-green-200",
      [SubjectArea.LITERATURE]: "bg-purple-100 text-purple-800 border-purple-200",
      [SubjectArea.HISTORY]: "bg-amber-100 text-amber-800 border-amber-200",
      [SubjectArea.LANGUAGE]: "bg-pink-100 text-pink-800 border-pink-200",
      [SubjectArea.ART]: "bg-indigo-100 text-indigo-800 border-indigo-200",
      [SubjectArea.MUSIC]: "bg-rose-100 text-rose-800 border-rose-200",
      [SubjectArea.COMPUTER_SCIENCE]: "bg-cyan-100 text-cyan-800 border-cyan-200",
      [SubjectArea.PHYSICAL_EDUCATION]: "bg-lime-100 text-lime-800 border-lime-200",
      [SubjectArea.OTHER]: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[subject];
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <PageLayout 
      title="Assignments" 
      subtitle="View, submit, and track your academic assignments"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <FileText className="mr-3 h-6 w-6 text-pink-600" />
          <h2 className="text-2xl font-bold text-gray-800">Your Assignments</h2>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button 
              variant={filter === 'all' ? "default" : "outline"} 
              onClick={() => setFilter('all')}
              className={filter === 'all' ? "bg-gradient-to-r from-pink-500 to-purple-600" : "border-pink-200 text-pink-600 hover:bg-pink-50"}
            >
              All
            </Button>
            <Button 
              variant={filter === 'upcoming' ? "default" : "outline"} 
              onClick={() => setFilter('upcoming')}
              className={filter === 'upcoming' ? "bg-gradient-to-r from-blue-500 to-cyan-600" : "border-blue-200 text-blue-600 hover:bg-blue-50"}
            >
              Upcoming
            </Button>
            <Button 
              variant={filter === 'past' ? "default" : "outline"} 
              onClick={() => setFilter('past')}
              className={filter === 'past' ? "bg-gradient-to-r from-gray-500 to-gray-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
            >
              Past
            </Button>
          </div>
        </div>
        
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="overflow-hidden bg-white/60 backdrop-blur-sm border-pink-100 hover:shadow-lg transition-all">
                <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-800">{assignment.title}</CardTitle>
                    <Badge className={`${getSubjectColor(assignment.subjectArea)} border`}>
                      {assignment.subjectArea}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {assignment.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                    <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-purple-500" />
                    <span className={isAssignmentOverdue(assignment.dueDate) ? "text-red-600 font-medium" : "text-gray-600"}>
                      Due: {formatDueDate(assignment.dueDate)}
                      {isAssignmentOverdue(assignment.dueDate) && " (Overdue)"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="bg-white/80 border-t border-pink-100">
                  <Button 
                    className={`w-full ${isAssignmentOverdue(assignment.dueDate) 
                      ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                      : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    }`}
                    onClick={() => navigate('/submit', { state: { assignmentId: assignment.id } })}
                  >
                    {isAssignmentOverdue(assignment.dueDate) ? "Submit Late" : "Submit Assignment"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/60 backdrop-blur-sm border border-pink-100 rounded-lg p-12">
              <FileText className="mx-auto h-16 w-16 text-pink-300 mb-6" />
              <h3 className="text-xl font-medium text-gray-800 mb-3">No assignments found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {filter === 'all' 
                  ? "You don't have any assignments yet." 
                  : filter === 'upcoming' 
                    ? "You don't have any upcoming assignments." 
                    : "You don't have any past assignments."}
              </p>
              {filter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setFilter('all')}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  View All Assignments
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Assignments;