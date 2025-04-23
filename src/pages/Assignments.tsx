
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Calendar } from 'lucide-react';
import { Assignment, SubjectArea } from '@/types';

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
      [SubjectArea.MATH]: "bg-blue-100 text-blue-800",
      [SubjectArea.SCIENCE]: "bg-green-100 text-green-800",
      [SubjectArea.LITERATURE]: "bg-purple-100 text-purple-800",
      [SubjectArea.HISTORY]: "bg-amber-100 text-amber-800",
      [SubjectArea.LANGUAGE]: "bg-pink-100 text-pink-800",
      [SubjectArea.ART]: "bg-indigo-100 text-indigo-800",
      [SubjectArea.MUSIC]: "bg-rose-100 text-rose-800",
      [SubjectArea.COMPUTER_SCIENCE]: "bg-cyan-100 text-cyan-800",
      [SubjectArea.PHYSICAL_EDUCATION]: "bg-lime-100 text-lime-800",
      [SubjectArea.OTHER]: "bg-gray-100 text-gray-800",
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
    <MainLayout>
      <div className="container py-10">
        <div className="flex items-center mb-8">
          <FileText className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Assignments</h1>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button 
              variant={filter === 'all' ? "default" : "outline"} 
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'upcoming' ? "default" : "outline"} 
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </Button>
            <Button 
              variant={filter === 'past' ? "default" : "outline"} 
              onClick={() => setFilter('past')}
            >
              Past
            </Button>
          </div>
        </div>
        
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <Badge className={getSubjectColor(assignment.subjectArea)}>
                      {assignment.subjectArea}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {assignment.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className={isAssignmentOverdue(assignment.dueDate) ? "text-red-500 font-medium" : "text-gray-500"}>
                      Due: {formatDueDate(assignment.dueDate)}
                      {isAssignmentOverdue(assignment.dueDate) && " (Overdue)"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/submit', { state: { assignmentId: assignment.id } })}
                  >
                    {isAssignmentOverdue(assignment.dueDate) ? "Submit Late" : "Submit Assignment"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You don't have any assignments yet." 
                : filter === 'upcoming' 
                  ? "You don't have any upcoming assignments." 
                  : "You don't have any past assignments."}
            </p>
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View All Assignments
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Assignments;
