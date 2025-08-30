import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Classroom } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Users, Plus } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

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
    <PageLayout 
      title="Virtual Classrooms" 
      subtitle="Manage and participate in collaborative learning spaces"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Users className="mr-3 h-6 w-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-800">Your Classrooms</h2>
          </div>
          {state.isTeacher && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Classroom
                  </DialogTitle>
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
                      className="border-pink-200 focus:border-pink-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                    <Input
                      id="description"
                      value={newClassroomDescription}
                      onChange={(e) => setNewClassroomDescription(e.target.value)}
                      placeholder="Enter classroom description"
                      className="border-pink-200 focus:border-pink-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateClassroom}
                    disabled={isCreating || !newClassroomName.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {isCreating ? "Creating..." : "Create Classroom"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!state.isTeacher && (
          <Card className="mb-8 bg-white/60 backdrop-blur-sm border-pink-100">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Join a Classroom
              </CardTitle>
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
                  className="max-w-sm border-blue-200 focus:border-blue-500"
                />
                <Button 
                  onClick={handleJoinClassroom}
                  disabled={isJoining || !joinCode.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
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
              <Card key={classroom.id} className="overflow-hidden bg-white/60 backdrop-blur-sm border-pink-100 hover:shadow-lg transition-all">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
                  <CardTitle className="text-gray-800">{classroom.name}</CardTitle>
                  <CardDescription>
                    {classroom.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-pink-500" />
                      Students: {classroom.studentIds.length}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2 flex items-center justify-center">📚</span>
                      Assignments: {classroom.assignments.length}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-white/80 border-t border-pink-100 flex justify-between">
                  <Button variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                    View Details
                  </Button>
                  {state.isTeacher && (
                    <div className="flex items-center">
                      <span className="text-xs font-medium mr-2 text-gray-600">Join Code:</span>
                      <code className="bg-pink-100 px-2 py-1 rounded text-xs text-pink-800">{classroom.joinCode}</code>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12">
              <div className="bg-white/60 backdrop-blur-sm border border-pink-100 rounded-lg p-8">
                <p className="text-gray-600 mb-4 text-lg">
                  {state.isTeacher 
                    ? "You haven't created any classrooms yet." 
                    : "You haven't joined any classrooms yet."}
                </p>
                {state.isTeacher ? (
                  <Button 
                    onClick={() => setOpenDialog(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    Create Your First Classroom
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">Ask your teacher for a join code to get started.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Classrooms;