
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Classroom } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Users } from 'lucide-react';

const Classrooms = () => {
  const { state, joinClassroom, createClassroom } = useAppContext();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomDescription, setNewClassroomDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Join code required",
        description: "Please enter a valid join code",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    try {
      const success = await joinClassroom(joinCode);
      if (success) {
        toast({
          title: "Success!",
          description: "You have joined the classroom",
        });
        setJoinCode('');
      } else {
        toast({
          title: "Failed to join",
          description: "Invalid join code or you're already in this classroom",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem joining the classroom",
        variant: "destructive"
      });
      console.error("Join classroom error:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateClassroom = async () => {
    if (!newClassroomName.trim()) {
      toast({
        title: "Classroom name required",
        description: "Please enter a name for your classroom",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const classroom = await createClassroom(
        newClassroomName, 
        newClassroomDescription || undefined
      );
      
      if (classroom.id) {
        toast({
          title: "Classroom created!",
          description: `Your new classroom "${classroom.name}" has been created`,
        });
        setNewClassroomName('');
        setNewClassroomDescription('');
        setOpenDialog(false);
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "There was a problem creating your classroom",
        variant: "destructive"
      });
      console.error("Create classroom error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Users className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Classrooms</h1>
          </div>
          {state.isTeacher && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>Create Classroom</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Classroom</DialogTitle>
                  <DialogDescription>
                    Set up a new virtual classroom for your students.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Classroom Name</label>
                    <Input
                      id="name"
                      value={newClassroomName}
                      onChange={(e) => setNewClassroomName(e.target.value)}
                      placeholder="Enter classroom name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                    <Input
                      id="description"
                      value={newClassroomDescription}
                      onChange={(e) => setNewClassroomDescription(e.target.value)}
                      placeholder="Enter classroom description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateClassroom}
                    disabled={isCreating || !newClassroomName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create Classroom"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!state.isTeacher && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Join a Classroom</CardTitle>
              <CardDescription>
                Enter the join code provided by your teacher.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter join code"
                  className="max-w-sm"
                />
                <Button 
                  onClick={handleJoinClassroom}
                  disabled={isJoining || !joinCode.trim()}
                >
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.classrooms.length > 0 ? (
            state.classrooms.map((classroom: Classroom) => (
              <Card key={classroom.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50">
                  <CardTitle>{classroom.name}</CardTitle>
                  <CardDescription>
                    {classroom.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 mb-2">Students: {classroom.studentIds.length}</p>
                  <p className="text-sm text-gray-500">Assignments: {classroom.assignments.length}</p>
                </CardContent>
                <CardFooter className="bg-white border-t flex justify-between">
                  <Button variant="outline" size="sm">View Details</Button>
                  {state.isTeacher && (
                    <div className="flex items-center">
                      <span className="text-xs font-medium mr-2">Join Code:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{classroom.joinCode}</code>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12">
              <p className="text-gray-500 mb-4">
                {state.isTeacher 
                  ? "You haven't created any classrooms yet." 
                  : "You haven't joined any classrooms yet."}
              </p>
              {state.isTeacher ? (
                <Button onClick={() => setOpenDialog(true)}>Create Your First Classroom</Button>
              ) : (
                <p className="text-sm">Ask your teacher for a join code to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Classrooms;
