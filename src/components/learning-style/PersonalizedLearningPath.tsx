import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePersonalizedLearningPath } from '@/utils/learningPathGenerator';
import { LearningPath, LearningResource } from '@/types/learningPath';
import { LearningStyle } from '@/types/learningStyles';
import { Play, BookOpen, Video, Music, Gamepad2, Presentation } from 'lucide-react';

interface PersonalizedLearningPathProps {
  subject: string;
  topic: string;
  gradeLevel: string;
  primaryStyle: LearningStyle;
  secondaryStyle: LearningStyle;
  styleStrengths: Record<LearningStyle, number>;
}

const resourceTypeIcons = {
  video: <Video className="w-4 h-4" />,
  animation: <Play className="w-4 h-4" />,
  simulation: <Gamepad2 className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />
};

const PersonalizedLearningPath = ({
  subject,
  topic,
  gradeLevel,
  primaryStyle,
  secondaryStyle,
  styleStrengths
}: PersonalizedLearningPathProps) => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningPath();
  }, [subject, topic, gradeLevel, primaryStyle]);

  const loadLearningPath = async () => {
    try {
      const path = await generatePersonalizedLearningPath(
        {
          subject,
          topic,
          gradeLevel,
          difficulty: 'intermediate' // This could be dynamic based on student level
        },
        primaryStyle,
        secondaryStyle,
        styleStrengths
      );
      setLearningPath(path);
    } catch (error) {
      console.error('Error loading learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const ResourceCard = ({ resource }: { resource: LearningResource }) => (
    <Card className="mb-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {resourceTypeIcons[resource.type] || <BookOpen className="w-4 h-4" />}
            <CardTitle className="text-lg">{resource.title}</CardTitle>
          </div>
          <Badge>{resource.type}</Badge>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
          {resource.type === 'video' && (
            <iframe
              className="w-full h-full"
              src={resource.url}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {resource.type === 'simulation' && (
            <iframe
              className="w-full h-full"
              src={resource.url}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />
          )}
          {(resource.type === 'presentation' || resource.type === 'infographic') && (
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              className="w-full h-full object-contain"
            />
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Learning Objectives:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {resource.objectives.map((objective, index) => (
              <li key={index} className="text-sm text-gray-600">{objective}</li>
            ))}
          </ul>
        </div>

        {resource.teacherNotes && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Teacher Notes:</h4>
            <p className="text-sm text-gray-600">{resource.teacherNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No learning path available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{learningPath.title}</CardTitle>
          <CardDescription>
            {learningPath.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentResourceIndex + 1) / learningPath.resources.length) * 100)}%</span>
            </div>
            <Progress 
              value={(currentResourceIndex + 1) / learningPath.resources.length * 100}
            />
          </div>

          <Tabs defaultValue="resources">
            <TabsList>
              <TabsTrigger value="resources">Learning Resources</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="mt-4">
              <div className="space-y-4">
                {learningPath.resources.map((resource, index) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {learningPath.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-gray-50">
                          {index + 1}
                        </span>
                        <span className="text-gray-600">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessments" className="mt-4">
              <div className="space-y-4">
                {learningPath.assessments.preAssessment && (
                  <ResourceCard resource={learningPath.assessments.preAssessment} />
                )}
                {learningPath.assessments.formativeAssessments.map((assessment) => (
                  <ResourceCard key={assessment.id} resource={assessment} />
                ))}
                {learningPath.assessments.summativeAssessment && (
                  <ResourceCard resource={learningPath.assessments.summativeAssessment} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalizedLearningPath;