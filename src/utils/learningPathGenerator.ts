import { LearningStyle } from '../types/learningStyles';
import { createClient } from '@supabase/supabase-js';
import { LearningPath, LearningResource } from './learningPath';

export interface TopicConfig {
  subject: string;
  topic: string;
  gradeLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningStyleStrengths {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

// Helper function to calculate resource fit score based on learning style
function calculateResourceFitScore(
  resourceFit: LearningStyleStrengths,
  learnerStrengths: LearningStyleStrengths
): number {
  return (
    (resourceFit.visual * learnerStrengths.visual +
    resourceFit.auditory * learnerStrengths.auditory +
    resourceFit.kinesthetic * learnerStrengths.kinesthetic +
    resourceFit.reading * learnerStrengths.reading) / 
    (learnerStrengths.visual + learnerStrengths.auditory + learnerStrengths.kinesthetic + learnerStrengths.reading)
  );
}

// Sort resources by their fit to the learner's style
function sortResourcesByFit(
  resources: LearningResource[],
  learnerStrengths: LearningStyleStrengths
): LearningResource[] {
  return [...resources].sort((a, b) => {
    const aFit = calculateResourceFitScore(a.learningStyleFit, learnerStrengths);
    const bFit = calculateResourceFitScore(b.learningStyleFit, learnerStrengths);
    return bFit - aFit;
  });
}

export async function generatePersonalizedLearningPath(
  topicConfig: TopicConfig,
  primaryStyle: LearningStyle,
  secondaryStyle: LearningStyle,
  styleStrengths: Record<LearningStyle, number>
): Promise<LearningPath> {
  // Convert style strengths to normalized values
  const learnerStrengths: LearningStyleStrengths = {
    visual: styleStrengths.visual || 0,
    auditory: styleStrengths.auditory || 0,
    kinesthetic: styleStrengths.kinesthetic || 0,
    reading_writing: styleStrengths.reading_writing || 0
  };

  // Fetch available resources for the topic
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  const { data: resources, error } = await supabase
    .from('educational_content')
    .select('*')
    .eq('subject', topicConfig.subject)
    .eq('topic', topicConfig.topic)
    .eq('grade_level', topicConfig.gradeLevel);

  if (error) throw error;

  // Sort resources by learning style fit
  const sortedResources = sortResourcesByFit(resources, learnerStrengths);

  // Create personalized learning path
  const learningPath: LearningPath = {
    id: crypto.randomUUID(),
    title: `${topicConfig.topic} - Personalized Learning Path`,
    description: `A personalized learning path for ${topicConfig.topic} designed for ${primaryStyle} learners`,
    subject: topicConfig.subject,
    topic: topicConfig.topic,
    gradeLevel: topicConfig.gradeLevel,
    duration: '2-3 hours', // This should be calculated based on resources
    objectives: [
      `Understand ${topicConfig.topic} concepts through ${primaryStyle}-focused learning`,
      'Apply concepts through interactive exercises',
      'Demonstrate understanding through assessments'
    ],
    targetLearningStyle: {
      primary: primaryStyle,
      secondary: secondaryStyle
    },
    resources: [],
    assessments: {
      formativeAssessments: [],
      summativeAssessment: null
    }
  };

  // Organize resources based on learning style and type
  const visualResources = sortedResources.filter(r => 
    r.learningStyleFit.visual > 0.7 && ['video', 'animation', 'infographic'].includes(r.type)
  );
  const auditoryResources = sortedResources.filter(r =>
    r.learningStyleFit.auditory > 0.7 && ['audio', 'song'].includes(r.type)
  );
  const kinestheticResources = sortedResources.filter(r =>
    r.learningStyleFit.kinesthetic > 0.7 && ['simulation', 'experiment', 'game'].includes(r.type)
  );
  const readingResources = sortedResources.filter(r =>
    r.learningStyleFit.reading > 0.7 && ['presentation'].includes(r.type)
  );

  // Build resource sequence based on primary and secondary styles
  switch(primaryStyle) {
    case 'visual':
      learningPath.resources = [
        ...visualResources.slice(0, 2),
        ...auditoryResources.slice(0, 1),
        ...kinestheticResources.slice(0, 1)
      ];
      break;
    case 'auditory':
      learningPath.resources = [
        ...auditoryResources.slice(0, 2),
        ...visualResources.slice(0, 1),
        ...readingResources.slice(0, 1)
      ];
      break;
    case 'kinesthetic':
      learningPath.resources = [
        ...kinestheticResources.slice(0, 2),
        ...visualResources.slice(0, 1),
        ...auditoryResources.slice(0, 1)
      ];
      break;
    case LearningStyle.READING_WRITING:
      learningPath.resources = [
        ...readingResources.slice(0, 2),
        ...visualResources.slice(0, 1),
        ...kinestheticResources.slice(0, 1)
      ];
      break;
  }

  // Add assessments
  const assessments = sortedResources.filter(r => r.type === 'quiz');
  learningPath.assessments = {
    preAssessment: assessments.find(a => a.subtype === 'pre'),
    formativeAssessments: assessments.filter(a => a.subtype === 'formative').slice(0, 2),
    summativeAssessment: assessments.find(a => a.subtype === 'summative')
  };

  // Add adaptivity rules
  learningPath.adaptivityRules = [
    {
      ifScoreBelow: 70,
      thenProvide: sortedResources
        .filter(r => r.difficulty === 'beginner')
        .slice(0, 2)
    },
    {
      ifScoreBelow: 85,
      thenProvide: sortedResources
        .filter(r => r.difficulty === topicConfig.difficulty)
        .slice(0, 2)
    }
  ];

  return learningPath;
}