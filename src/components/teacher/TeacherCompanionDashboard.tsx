import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Users, 
  Download, 
  Printer, 
  Lightbulb,
  Globe,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LessonContent, getContentByClassAndSubject, getLocalContextExamples } from '@/data/rourkela-curriculum';

interface LessonPlan {
  id: string;
  title: string;
  titleOdia: string;
  class: number;
  subject: string;
  duration: number;
  objectives: string[];
  activities: Activity[];
  localExamples: string[];
  assessment: string[];
  materials: string[];
  createdAt: Date;
}

interface Activity {
  type: 'introduction' | 'explanation' | 'practice' | 'assessment' | 'reflection';
  description: string;
  descriptionOdia: string;
  duration: number;
  materials?: string[];
  interaction: 'individual' | 'group' | 'class';
}

interface WorksheetTemplate {
  id: string;
  name: string;
  subject: string;
  class: number;
  questions: WorksheetQuestion[];
  instructions: string;
  instructionsOdia: string;
}

interface WorksheetQuestion {
  type: 'mcq' | 'short' | 'long' | 'fill' | 'match' | 'diagram';
  question: string;
  questionOdia: string;
  options?: string[];
  answer: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  localContext?: boolean;
}

interface StudentAnalytics {
  studentId: string;
  name: string;
  class: number;
  subjects: {
    [subject: string]: {
      currentLevel: number;
      progress: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    };
  };
  metacognitionScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  lastActive: Date;
}

const TeacherCompanionDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedClass, setSelectedClass] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('Science');
  const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'ICSE' | 'Odisha'>('Odisha');
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<Partial<LessonPlan>>({});
  const [worksheetTemplates, setWorksheetTemplates] = useState<WorksheetTemplate[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  const isOdia = i18n.language === 'or';

  // Generate lesson plan based on curriculum content
  const generateLessonPlan = async () => {
    setLoading(true);
    try {
      const curriculumContent = getContentByClassAndSubject(selectedClass, selectedSubject.toLowerCase());
      
      if (curriculumContent.length > 0) {
        const content = curriculumContent[0];
        const localExamples = getLocalContextExamples('steel_plant');
        
        const newLessonPlan: LessonPlan = {
          id: `lesson_${Date.now()}`,
          title: content.title,
          titleOdia: content.titleOdia,
          class: selectedClass,
          subject: selectedSubject,
          duration: content.estimatedTime,
          objectives: content.learningOutcomes,
          activities: [
            {
              type: 'introduction',
              description: `Begin with a local example from Rourkela context`,
              descriptionOdia: `ରାଉରକେଲା ପରିପ୍ରେକ୍ଷୀରୁ ଏକ ସ୍ଥାନୀୟ ଉଦାହରଣ ସହିତ ଆରମ୍ଭ କରନ୍ତୁ`,
              duration: 10,
              interaction: 'class'
            },
            {
              type: 'explanation',
              description: `Explain key concepts with visual aids and local examples`,
              descriptionOdia: `ଭିଜୁଆଲ ସାହାଯ୍ୟ ଏବଂ ସ୍ଥାନୀୟ ଉଦାହରଣ ସହିତ ମୁଖ୍ୟ ଧାରଣା ବ୍ୟାଖ୍ୟା କରନ୍ତୁ`,
              duration: 20,
              interaction: 'class'
            },
            {
              type: 'practice',
              description: `Students work on practice problems in groups`,
              descriptionOdia: `ଛାତ୍ରମାନେ ଗୋଷ୍ଠୀରେ ଅଭ୍ୟାସ ସମସ୍ୟା ଉପରେ କାମ କରନ୍ତି`,
              duration: 10,
              interaction: 'group'
            },
            {
              type: 'assessment',
              description: `Quick assessment to check understanding`,
              descriptionOdia: `ବୁଝାମଣା ଯାଞ୍ଚ ପାଇଁ ଶୀଘ୍ର ମୂଲ୍ୟାଙ୍କନ`,
              duration: 3,
              interaction: 'individual'
            },
            {
              type: 'reflection',
              description: `Students reflect on what they learned`,
              descriptionOdia: `ଛାତ୍ରମାନେ ଯାହା ଶିଖିଲେ ତାହା ଉପରେ ପ୍ରତିଫଳନ କରନ୍ତି`,
              duration: 2,
              interaction: 'individual'
            }
          ],
          localExamples: content.localContext.rourkelaExamples,
          assessment: [`Quiz on ${content.title}`, 'Practical demonstration', 'Reflection questions'],
          materials: ['Whiteboard', 'Local examples', 'Worksheets', 'Visual aids'],
          createdAt: new Date()
        };
        
        setLessonPlans(prev => [...prev, newLessonPlan]);
        setCurrentLessonPlan(newLessonPlan);
      }
    } catch (error) {
      console.error('Error generating lesson plan:', error);
    }
    setLoading(false);
  };

  // Generate worksheet based on curriculum
  const generateWorksheet = () => {
    const curriculumContent = getContentByClassAndSubject(selectedClass, selectedSubject.toLowerCase());
    
    if (curriculumContent.length > 0) {
      const content = curriculumContent[0];
      const worksheetQuestions: WorksheetQuestion[] = [
        ...content.assessmentQuestions.map(q => ({
          type: q.type as WorksheetQuestion['type'],
          question: q.question,
          questionOdia: q.questionOdia,
          options: q.options,
          answer: q.correctAnswer,
          marks: q.marks,
          difficulty: q.difficulty,
          localContext: true
        })),
        {
          type: 'short',
          question: `Explain how this concept relates to your daily life in Rourkela`,
          questionOdia: `ଏହି ଧାରଣା ରାଉରକେଲାରେ ଆପଣଙ୍କ ଦୈନନ୍ଦିନ ଜୀବନ ସହିତ କିପରି ସମ୍ପର୍କିତ ବ୍ୟାଖ୍ୟା କରନ୍ତୁ`,
          answer: 'Various local applications',
          marks: 3,
          difficulty: 'medium',
          localContext: true
        }
      ];

      const newWorksheet: WorksheetTemplate = {
        id: `worksheet_${Date.now()}`,
        name: `${content.title} - Class ${selectedClass}`,
        subject: selectedSubject,
        class: selectedClass,
        questions: worksheetQuestions,
        instructions: 'Answer all questions. Use local examples where possible.',
        instructionsOdia: 'ସମସ୍ତ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ। ଯଥା ସମ୍ଭବ ସ୍ଥାନୀୟ ଉଦାହରଣ ବ୍ୟବହାର କରନ୍ତୁ।'
      };

      setWorksheetTemplates(prev => [...prev, newWorksheet]);
    }
  };

  // Mock student analytics data
  useEffect(() => {
    const mockAnalytics: StudentAnalytics[] = [
      {
        studentId: '1',
        name: 'Anita Patel',
        class: selectedClass,
        subjects: {
          Science: {
            currentLevel: 7,
            progress: 75,
            strengths: ['Problem solving', 'Local examples'],
            weaknesses: ['Formula memorization'],
            recommendations: ['More practice with formulas', 'Use steel plant examples']
          },
          Mathematics: {
            currentLevel: 6,
            progress: 65,
            strengths: ['Basic arithmetic', 'Visual learning'],
            weaknesses: ['Abstract concepts'],
            recommendations: ['Use more concrete examples', 'Practice word problems']
          }
        },
        metacognitionScore: 0.72,
        engagementLevel: 'high',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        studentId: '2',
        name: 'Rajesh Kumar',
        class: selectedClass,
        subjects: {
          Science: {
            currentLevel: 5,
            progress: 45,
            strengths: ['Observation skills'],
            weaknesses: ['Theory concepts', 'English terminology'],
            recommendations: ['Provide Odia explanations', 'More hands-on activities']
          }
        },
        metacognitionScore: 0.35,
        engagementLevel: 'medium',
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
    
    setStudentAnalytics(mockAnalytics);
  }, [selectedClass]);

  const exportLessonPlan = (lessonPlan: LessonPlan) => {
    const content = `
LESSON PLAN - ${isOdia ? lessonPlan.titleOdia : lessonPlan.title}

Class: ${lessonPlan.class}
Subject: ${lessonPlan.subject}
Duration: ${lessonPlan.duration} minutes

OBJECTIVES:
${lessonPlan.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

ACTIVITIES:
${lessonPlan.activities.map((activity, i) => `
${i + 1}. ${activity.type.toUpperCase()} (${activity.duration} min)
   ${isOdia ? activity.descriptionOdia : activity.description}
   Interaction: ${activity.interaction}
`).join('\n')}

LOCAL EXAMPLES:
${lessonPlan.localExamples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

MATERIALS NEEDED:
${lessonPlan.materials.map((material, i) => `${i + 1}. ${material}`).join('\n')}

ASSESSMENT:
${lessonPlan.assessment.map((assess, i) => `${i + 1}. ${assess}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${lessonPlan.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportWorksheet = (worksheet: WorksheetTemplate) => {
    const content = `
WORKSHEET - ${worksheet.name}

Class: ${worksheet.class} | Subject: ${worksheet.subject}

INSTRUCTIONS:
${isOdia ? worksheet.instructionsOdia : worksheet.instructions}

QUESTIONS:

${worksheet.questions.map((q, i) => `
${i + 1}. ${isOdia ? q.questionOdia : q.question} (${q.marks} marks)
${q.type === 'mcq' && q.options ? 
  q.options.map((opt, j) => `   ${String.fromCharCode(97 + j)}) ${opt}`).join('\n') : 
  '\n   _'.repeat(Math.max(2, q.marks))}
`).join('\n')}

---
ANSWER KEY (Teacher Use Only):
${worksheet.questions.map((q, i) => `${i + 1}. ${q.answer}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worksheet-${worksheet.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isOdia ? 'ଶିକ୍ଷକ ସହାୟକ ଡାଶବୋର୍ଡ' : 'Teacher Companion Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isOdia ? 'ରାଉରକେଲା ବିଦ୍ୟାଳୟ ପାଇଁ ପାଠ ଯୋଜନା, ୱର୍କସିଟ୍ ଏବଂ ଆନାଲିଟିକ୍ସ' : 'Lesson plans, worksheets, and analytics for Rourkela schools'}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Select value={selectedClass.toString()} onValueChange={(value) => setSelectedClass(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 7, 8, 9, 10].map(cls => (
                <SelectItem key={cls} value={cls.toString()}>
                  {isOdia ? `କ୍ଲାସ ${cls}` : `Class ${cls}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Science">{isOdia ? 'ବିଜ୍ଞାନ' : 'Science'}</SelectItem>
              <SelectItem value="Mathematics">{isOdia ? 'ଗଣିତ' : 'Mathematics'}</SelectItem>
              <SelectItem value="English">{isOdia ? 'ଇଂରାଜୀ' : 'English'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBoard} onValueChange={(value) => setSelectedBoard(value as any)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Odisha">Odisha</SelectItem>
              <SelectItem value="CBSE">CBSE</SelectItem>
              <SelectItem value="ICSE">ICSE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="lesson-planner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lesson-planner" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {isOdia ? 'পাঠ পরিকল্পনা' : 'Lesson Planner'}
          </TabsTrigger>
          <TabsTrigger value="worksheet-generator" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {isOdia ? 'কার্যপত্র' : 'Worksheets'}
          </TabsTrigger>
          <TabsTrigger value="student-analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {isOdia ? 'ছাত্র বিশ্লেষণ' : 'Analytics'}
          </TabsTrigger>
          <TabsTrigger value="local-resources" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {isOdia ? 'স্থানীয় সংস্থান' : 'Local Resources'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson-planner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                {isOdia ? 'পাঠ পরিকল্পনা জেনারেটর' : 'Lesson Plan Generator'}
              </CardTitle>
              <CardDescription>
                {isOdia ? 'রাউরকেলা প্রসঙ্গ সহ স্বয়ংক্রিয় পাঠ পরিকল্পনা তৈরি করুন' : 'Generate automated lesson plans with Rourkela context'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateLessonPlan} disabled={loading} className="w-full">
                {loading ? (isOdia ? 'জেনারেট করা হচ্ছে...' : 'Generating...') : 
                         (isOdia ? 'পাঠ পরিকল্পনা জেনারেট করুন' : 'Generate Lesson Plan')}
              </Button>

              {currentLessonPlan.title && (
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isOdia ? currentLessonPlan.titleOdia : currentLessonPlan.title}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{isOdia ? 'কক্ষা:' : 'Class:'} {currentLessonPlan.class}</span>
                      <span>{isOdia ? 'সময়:' : 'Duration:'} {currentLessonPlan.duration}min</span>
                      <span>{isOdia ? 'বিষয়:' : 'Subject:'} {currentLessonPlan.subject}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{isOdia ? 'লক্ষ্য:' : 'Objectives:'}</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {currentLessonPlan.objectives?.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">{isOdia ? 'কার্যক্রম:' : 'Activities:'}</h4>
                      <div className="space-y-2">
                        {currentLessonPlan.activities?.map((activity, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <Badge variant="outline">{activity.duration}min</Badge>
                            <div className="flex-1">
                              <div className="font-medium capitalize">{activity.type}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {isOdia ? activity.descriptionOdia : activity.description}
                              </div>
                            </div>
                            <Badge variant="secondary">{activity.interaction}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">{isOdia ? 'স্থানীয় উদাহরণ:' : 'Local Examples:'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentLessonPlan.localExamples?.map((example, i) => (
                          <div key={i} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => exportLessonPlan(currentLessonPlan as LessonPlan)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isOdia ? 'ডাউনলোড' : 'Download'}
                      </Button>
                      <Button 
                        onClick={() => window.print()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        {isOdia ? 'প্রিন্ট' : 'Print'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lessonPlans.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {isOdia ? 'সম্প্রতি তৈরি পাঠ পরিকল্পনা' : 'Recent Lesson Plans'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessonPlans.slice(0, 4).map(plan => (
                      <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {isOdia ? plan.titleOdia : plan.title}
                          </CardTitle>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Class {plan.class} | {plan.subject}</span>
                            <span>{plan.duration}min</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {plan.createdAt.toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentLessonPlan(plan)}
                              className="flex items-center gap-1"
                            >
                              {isOdia ? 'দেখুন' : 'View'} <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worksheet-generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'কার্যপত্র জেনারেটর' : 'Worksheet Generator'}</CardTitle>
              <CardDescription>
                {isOdia ? 'স্থানীয় উদাহরণ সহ কাস্টমাইজড কার্যপত্র তৈরি করুন' : 'Create customized worksheets with local examples'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateWorksheet} className="w-full">
                {isOdia ? 'কার্যপত্র জেনারেট করুন' : 'Generate Worksheet'}
              </Button>

              {worksheetTemplates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {isOdia ? 'জেনারেট করা কার্যপত্র' : 'Generated Worksheets'}
                  </h3>
                  {worksheetTemplates.map(worksheet => (
                    <Card key={worksheet.id} className="border border-purple-200 dark:border-purple-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          {worksheet.name}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => exportWorksheet(worksheet)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {isOdia ? 'ডাউনলোড' : 'Download'}
                            </Button>
                          </div>
                        </CardTitle>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {worksheet.questions.length} questions | Class {worksheet.class} | {worksheet.subject}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {worksheet.questions.filter(q => q.difficulty === 'easy').length}
                            </div>
                            <div className="text-sm text-gray-600">{isOdia ? 'সহজ' : 'Easy'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {worksheet.questions.filter(q => q.difficulty === 'medium').length}
                            </div>
                            <div className="text-sm text-gray-600">{isOdia ? 'মাঝারি' : 'Medium'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {worksheet.questions.filter(q => q.difficulty === 'hard').length}
                            </div>
                            <div className="text-sm text-gray-600">{isOdia ? 'কঠিন' : 'Hard'}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium mb-1">{isOdia ? 'নির্দেশাবলী:' : 'Instructions:'}</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {isOdia ? worksheet.instructionsOdia : worksheet.instructions}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isOdia ? 'মোট ছাত্র' : 'Total Students'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentAnalytics.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {isOdia ? 'বর্তমান ক্লাসে' : 'In current class'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isOdia ? 'গড় অগ্রগতি' : 'Average Progress'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(studentAnalytics.reduce((acc, student) => {
                    const subjectProgress = Object.values(student.subjects).map(s => s.progress);
                    return acc + (subjectProgress.reduce((a, b) => a + b, 0) / subjectProgress.length);
                  }, 0) / studentAnalytics.length) || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isOdia ? 'সব বিষয়ে' : 'Across all subjects'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isOdia ? 'সক্রিয় ছাত্র' : 'Active Students'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {studentAnalytics.filter(s => s.engagementLevel === 'high').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isOdia ? 'উচ্চ সম্পৃক্ততা' : 'High engagement'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'ছাত্র কর্মক্ষমতা বিশ্লেষণ' : 'Student Performance Analytics'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {studentAnalytics.map(student => (
                  <div key={student.studentId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Class {student.class}</span>
                          <Badge 
                            variant={
                              student.engagementLevel === 'high' ? 'default' :
                              student.engagementLevel === 'medium' ? 'secondary' : 'destructive'
                            }
                          >
                            {student.engagementLevel} engagement
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {Math.round(student.metacognitionScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {isOdia ? 'মেটাকগনিশন স্কোর' : 'Metacognition Score'}
                        </div>
                      </div>
                    </div>

                    {Object.entries(student.subjects).map(([subject, data]) => (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{subject}</h4>
                          <span className="text-sm font-medium">{data.progress}%</span>
                        </div>
                        <Progress value={data.progress} className="h-2" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                              {isOdia ? 'শক্তি:' : 'Strengths:'}
                            </div>
                            <ul className="text-xs space-y-1">
                              {data.strengths.map((strength, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                              {isOdia ? 'দুর্বলতা:' : 'Areas to improve:'}
                            </div>
                            <ul className="text-xs space-y-1">
                              {data.weaknesses.map((weakness, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-red-500" />
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            {isOdia ? 'সুপারিশ:' : 'Recommendations:'}
                          </div>
                          <ul className="text-xs space-y-1">
                            {data.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-blue-500" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local-resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isOdia ? 'স্থানীয় শিল্প সংযোগ' : 'Local Industry Connections'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium">Rourkela Steel Plant</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'ধাতুবিদ্যা, রসায়ন এবং পদার্থবিদ্যার ব্যবহারিক উদাহরণ' : 'Practical examples for metallurgy, chemistry, and physics'}
                  </p>
                </div>
                
                <div className="p-3 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium">Brahmani River Ecosystem</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'পরিবেশ বিজ্ঞান এবং জীববিজ্ঞানের প্রসঙ্গ' : 'Environmental science and biology context'}
                  </p>
                </div>
                
                <div className="p-3 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-medium">Local Forest Areas</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'জীববৈচিত্র্য এবং পরিবেশ সংরক্ষণের উদাহরণ' : 'Biodiversity and conservation examples'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isOdia ? 'সাংস্কৃতিক সংস্থান' : 'Cultural Resources'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium">Traditional Measurements</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'ঐতিহ্যবাহী মাপকাঠি এবং গাণিতিক ধারণা' : 'Traditional units and mathematical concepts'}
                  </p>
                </div>
                
                <div className="p-3 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="font-medium">Tribal Culture & Science</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'ঐতিহ্যবাহী জ্ঞান এবং বৈজ্ঞানিক পদ্ধতি' : 'Traditional knowledge and scientific methods'}
                  </p>
                </div>
                
                <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium">Festival Mathematics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOdia ? 'উৎসব প্রস্তুতিতে গাণিতিক গণনা' : 'Mathematical calculations in festival preparations'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'সম্প্রদায়িক অংশীদারিত্ব' : 'Community Partnerships'}</CardTitle>
              <CardDescription>
                {isOdia ? 'স্থানীয় সংস্থা এবং শিক্ষামূলক সুযোগ' : 'Local organizations and educational opportunities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">RSP</div>
                  <div className="text-sm mt-1">Rourkela Steel Plant</div>
                  <div className="text-xs text-gray-500 mt-1">Industrial visits & demos</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">NIT</div>
                  <div className="text-sm mt-1">NIT Rourkela</div>
                  <div className="text-xs text-gray-500 mt-1">Student mentorship program</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">NGO</div>
                  <div className="text-sm mt-1">Local NGOs</div>
                  <div className="text-xs text-gray-500 mt-1">Community education support</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCompanionDashboard;