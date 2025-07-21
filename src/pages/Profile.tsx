
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LearningStyle, learningStyleInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { User, Edit } from 'lucide-react';

const Profile = () => {
  const { state, updateUserProfile } = useAppContext();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading } = state;
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-10 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-edu-primary border-t-transparent rounded-full inline-block mb-4"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="text-center">
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Determine learning style information
  const primaryStyle = currentUser.primaryLearningStyle || LearningStyle.VISUAL;
  const secondaryStyle = currentUser.secondaryLearningStyle;
  const primaryStyleInfo = learningStyleInfo[primaryStyle];

  const handleSaveProfile = (updatedProfile: any) => {
    updateUserProfile(updatedProfile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <MainLayout>
        <div className="container py-10">
          <ProfileEditForm
            user={currentUser}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <User className="mr-2 h-6 w-6" />
            My Profile
          </h1>
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{currentUser.name}</CardTitle>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Member since</p>
                    <p className="text-sm text-gray-500">
                      {new Date(currentUser.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last active</p>
                    <p className="text-sm text-gray-500">
                      {new Date(currentUser.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Learning Style Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Primary Learning Style</h3>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="py-1">
                        {primaryStyleInfo.title}
                      </Badge>
                      <p className="text-sm">{primaryStyleInfo.description}</p>
                    </div>
                  </div>

                  {secondaryStyle && (
                    <div>
                      <h3 className="font-medium mb-2">Secondary Learning Style</h3>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="py-1">
                          {learningStyleInfo[secondaryStyle].title}
                        </Badge>
                        <p className="text-sm">{learningStyleInfo[secondaryStyle].description}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-2">Personalized Learning Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {primaryStyleInfo.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser.performances.length > 0 ? (
                  <div className="space-y-4">
                    {currentUser.performances.slice(0, 3).map((performance) => (
                      <div key={performance.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{performance.title}</h4>
                            <p className="text-sm text-gray-500">
                              {performance.subjectArea} - {new Date(performance.date).toLocaleDateString()}
                            </p>
                          </div>
                          {performance.score !== undefined && (
                            <Badge 
                              className={
                                performance.score > 80 ? "bg-green-500" : 
                                performance.score > 60 ? "bg-yellow-500" : "bg-red-500"
                              }
                            >
                              {performance.score}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No performance records yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
