import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageAttendance: number;
  averagePerformance: number;
  digitalLiteracyRate: number;
  infrastructureScore: number;
  governmentComplianceScore: number;
}

interface AttendanceData {
  date: string;
  students: number;
  teachers: number;
  total: number;
}

interface PerformanceData {
  class: string;
  english: number;
  odia: number;
  mathematics: number;
  science: number;
  overall: number;
}

interface ComplianceItem {
  category: string;
  item: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  dueDate?: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const SchoolDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'term'>('month');
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceItem[]>([]);

  const isOdia = i18n.language === 'or';

  // Mock data for demonstration
  useEffect(() => {
    // School statistics
    setSchoolStats({
      totalStudents: 342,
      totalTeachers: 18,
      totalClasses: 8, // Classes 6-10 + 2 sections each for some
      averageAttendance: 87.5,
      averagePerformance: 73.2,
      digitalLiteracyRate: 65.8,
      infrastructureScore: 78.5,
      governmentComplianceScore: 92.1
    });

    // Attendance data for the past month
    const mockAttendanceData: AttendanceData[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockAttendanceData.unshift({
        date: date.toISOString().split('T')[0],
        students: Math.floor(Math.random() * 20) + 280, // 280-300 students
        teachers: Math.floor(Math.random() * 3) + 16, // 16-18 teachers
        total: 0
      });
    }
    mockAttendanceData.forEach(item => {
      item.total = Math.round((item.students / 342 + item.teachers / 18) / 2 * 100);
    });
    setAttendanceData(mockAttendanceData);

    // Performance data by class and subject
    setPerformanceData([
      { class: 'Class 6A', english: 72, odia: 85, mathematics: 68, science: 74, overall: 75 },
      { class: 'Class 6B', english: 68, odia: 82, mathematics: 65, science: 71, overall: 72 },
      { class: 'Class 7A', english: 75, odia: 88, mathematics: 71, science: 77, overall: 78 },
      { class: 'Class 7B', english: 71, odia: 84, mathematics: 69, science: 73, overall: 74 },
      { class: 'Class 8', english: 78, odia: 87, mathematics: 74, science: 79, overall: 80 },
      { class: 'Class 9', english: 76, odia: 86, mathematics: 72, science: 78, overall: 78 },
      { class: 'Class 10', english: 81, odia: 89, mathematics: 79, science: 83, overall: 83 }
    ]);

    // Government compliance data
    setComplianceData([
      {
        category: 'NEP 2020 Implementation',
        item: 'Digital Infrastructure Setup',
        status: 'compliant',
        description: 'Basic computer lab and internet connectivity established',
        priority: 'high'
      },
      {
        category: 'NEP 2020 Implementation',
        item: 'Multilingual Education',
        status: 'partial',
        description: 'Teaching in Odia and English, Hindi support needed',
        priority: 'medium'
      },
      {
        category: 'NEP 2020 Implementation',
        item: 'Vocational Education',
        status: 'non_compliant',
        dueDate: '2024-06-30',
        description: 'Need to introduce vocational courses from Class 9',
        priority: 'high'
      },
      {
        category: 'RTE Compliance',
        item: 'Teacher-Student Ratio',
        status: 'compliant',
        description: 'Maintaining 1:19 ratio as per RTE norms',
        priority: 'high'
      },
      {
        category: 'RTE Compliance',
        item: 'Mid-Day Meal Program',
        status: 'compliant',
        description: 'Nutritious meals provided daily to all students',
        priority: 'medium'
      },
      {
        category: 'Samagra Shiksha',
        item: 'UDISE+ Data Entry',
        status: 'compliant',
        description: 'All student and teacher data updated monthly',
        priority: 'medium'
      },
      {
        category: 'Samagra Shiksha',
        item: 'Digital Learning Materials',
        status: 'partial',
        description: 'Some DIKSHA content used, need more local language materials',
        priority: 'medium'
      },
      {
        category: 'Infrastructure',
        item: 'Separate Toilets',
        status: 'compliant',
        description: 'Separate functional toilets for boys and girls',
        priority: 'high'
      },
      {
        category: 'Infrastructure',
        item: 'Playground Facilities',
        status: 'partial',
        description: 'Basic playground available, sports equipment needed',
        priority: 'low'
      }
    ]);
  }, []);

  const generateMonthlyReport = () => {
    const reportData = {
      school: 'Government Upper Primary School, Rourkela',
      month: new Date().toLocaleDateString(isOdia ? 'or-IN' : 'en-IN', { year: 'numeric', month: 'long' }),
      stats: schoolStats,
      attendance: attendanceData.slice(-7), // Last 7 days
      performance: performanceData,
      compliance: complianceData,
      generated: new Date().toISOString()
    };

    const content = `
${isOdia ? 'ମାସିକ ବିଦ୍ୟାଳୟ ରିପୋର୍ଟ' : 'MONTHLY SCHOOL REPORT'}
${isOdia ? '=============================' : '========================='}

${isOdia ? 'ବିଦ୍ୟାଳୟ:' : 'School:'} ${reportData.school}
${isOdia ? 'ମାସ:' : 'Month:'} ${reportData.month}
${isOdia ? 'ସୃଷ୍ଟି ତାରିଖ:' : 'Generated:'} ${new Date().toLocaleDateString()}

${isOdia ? 'ମୁଖ୍ୟ ପରିସଂଖ୍ୟାନ:' : 'KEY STATISTICS:'}
${isOdia ? '-------------' : '---------------'}
${isOdia ? 'ମୋଟ ଛାତ୍ର:' : 'Total Students:'} ${schoolStats?.totalStudents}
${isOdia ? 'ମୋଟ ଶିକ୍ଷକ:' : 'Total Teachers:'} ${schoolStats?.totalTeachers}
${isOdia ? 'ହାରାହାରି ଉପସ୍ଥିତି:' : 'Average Attendance:'} ${schoolStats?.averageAttendance}%
${isOdia ? 'ହାରାହାରି ପ୍ରଦର୍ଶନ:' : 'Average Performance:'} ${schoolStats?.averagePerformance}%
${isOdia ? 'ସରକାରୀ ଅନୁପାଳନ:' : 'Government Compliance:'} ${schoolStats?.governmentComplianceScore}%

${isOdia ? 'ଶ୍ରେଣୀଭିତ୍ତିକ ପ୍ରଦର୍ଶନ:' : 'CLASS-WISE PERFORMANCE:'}
${isOdia ? '----------------------' : '------------------------'}
${performanceData.map(cls => 
  `${cls.class}: ${isOdia ? 'ସମୁଦାୟ' : 'Overall'} ${cls.overall}% (${isOdia ? 'ଇଂରାଜୀ' : 'English'}: ${cls.english}%, ${isOdia ? 'ଓଡ଼ିଆ' : 'Odia'}: ${cls.odia}%, ${isOdia ? 'ଗଣିତ' : 'Math'}: ${cls.mathematics}%, ${isOdia ? 'ବିଜ୍ଞାନ' : 'Science'}: ${cls.science}%)`
).join('\n')}

${isOdia ? 'ସରକାରୀ ଅନୁପାଳନ ସ୍ଥିତି:' : 'GOVERNMENT COMPLIANCE STATUS:'}
${isOdia ? '-------------------------' : '-------------------------------'}
${complianceData.map(item => 
  `${item.category} - ${item.item}: ${
    item.status === 'compliant' ? (isOdia ? 'ଅନୁପାଳିତ' : 'COMPLIANT') :
    item.status === 'partial' ? (isOdia ? 'ଆଂশିକ' : 'PARTIAL') :
    (isOdia ? 'ଅନୁପାଳିତ ନୁହେଁ' : 'NON-COMPLIANT')
  }${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`
).join('\n')}

${isOdia ? 'ସୁପାରିଶ:' : 'RECOMMENDATIONS:'}
${isOdia ? '----------' : '---------------'}
${complianceData.filter(item => item.status !== 'compliant').map(item => 
  `• ${item.item} - ${item.description}`
).join('\n')}

${isOdia ? 'ଦସ୍ତଖତ:' : 'Signature:'} _____________________
${isOdia ? 'ପ୍ରଧାନ ଶିକ୍ଷକ' : 'Headmaster'}
    `;

    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isOdia ? 'ବିଦ୍ୟାଳୟ ଡାଶବୋର୍ଡ' : 'School Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isOdia ? 'ସରକାରୀ ଉଚ୍ଚ ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ, ରାଉରକେଲା' : 'Government Upper Primary School, Rourkela'}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{isOdia ? 'ସପ୍ତାହ' : 'Week'}</SelectItem>
              <SelectItem value="month">{isOdia ? 'ମାସ' : 'Month'}</SelectItem>
              <SelectItem value="term">{isOdia ? 'ଅବଧି' : 'Term'}</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateMonthlyReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {isOdia ? 'ରିପୋର୍ଟ ଡାଉନଲୋଡ' : 'Download Report'}
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isOdia ? 'ମୋଟ ଛାତ୍ର' : 'Total Students'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolStats?.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {isOdia ? 'ଶ୍ରେଣୀ 6-10' : 'Classes 6-10'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isOdia ? 'ହାରାହାରି ଉପସ୍ଥିତି' : 'Average Attendance'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolStats?.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              {isOdia ? '+2.5% ଗତ ମାସ ତୁଳନାରେ' : '+2.5% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isOdia ? 'ହାରାହାରି ପ୍ରଦର୍ଶନ' : 'Average Performance'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolStats?.averagePerformance}%</div>
            <p className="text-xs text-muted-foreground">
              {isOdia ? 'ସମସ୍ତ ବିଷୟରେ' : 'Across all subjects'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isOdia ? 'ସରକାରୀ ଅନୁପାଳନ' : 'Gov Compliance'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolStats?.governmentComplianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              {isOdia ? 'NEP 2020 + RTE' : 'NEP 2020 + RTE'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{isOdia ? 'ସମୀକ୍ଷା' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="performance">{isOdia ? 'ପ୍ରଦର୍ଶନ' : 'Performance'}</TabsTrigger>
          <TabsTrigger value="attendance">{isOdia ? 'ଉପସ୍ଥିତି' : 'Attendance'}</TabsTrigger>
          <TabsTrigger value="compliance">{isOdia ? 'ଅନୁପାଳନ' : 'Compliance'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* School Infrastructure */}
            <Card>
              <CardHeader>
                <CardTitle>{isOdia ? 'ବିଦ୍ୟାଳୟ ଭିତ୍ତିଭୂମି' : 'School Infrastructure'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{isOdia ? 'ଡିଜିଟାଲ ସାକ୍ଷରତା' : 'Digital Literacy'}</span>
                    <span>{schoolStats?.digitalLiteracyRate}%</span>
                  </div>
                  <Progress value={schoolStats?.digitalLiteracyRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{isOdia ? 'ଭିତ୍ତିଭୂମି ସ୍କୋର' : 'Infrastructure Score'}</span>
                    <span>{schoolStats?.infrastructureScore}%</span>
                  </div>
                  <Progress value={schoolStats?.infrastructureScore} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-lg font-bold">{schoolStats?.totalClasses}</div>
                    <div className="text-xs text-gray-600">{isOdia ? 'ଶ୍ରେଣୀ କକ୍ଷ' : 'Classrooms'}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-lg font-bold">{schoolStats?.totalTeachers}</div>
                    <div className="text-xs text-gray-600">{isOdia ? 'ଶିକ୍ଷକମାନେ' : 'Teachers'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {isOdia ? 'ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ' : 'Recent Activities'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {isOdia ? 'NEP 2020 ପ୍ରଶିକ୍ଷଣ ସମାପ୍ତ' : 'NEP 2020 Training Completed'}
                      </div>
                      <div className="text-xs text-gray-500">2 days ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {isOdia ? 'UDISE+ ଡାଟା ଅଦ୍ୟତନ' : 'UDISE+ Data Updated'}
                      </div>
                      <div className="text-xs text-gray-500">1 week ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {isOdia ? 'ଭୋକେସନାଲ କୋର୍ସ ଯୋଜନା' : 'Vocational Course Planning'}
                      </div>
                      <div className="text-xs text-gray-500">Due in 2 months</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'ଶ୍ରେଣୀଭିତ୍ତିକ ପ୍ରଦର୍ଶନ' : 'Class-wise Performance'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="english" fill="#8884d8" name={isOdia ? 'ଇଂରାଜୀ' : 'English'} />
                  <Bar dataKey="odia" fill="#82ca9d" name={isOdia ? 'ଓଡ଼ିଆ' : 'Odia'} />
                  <Bar dataKey="mathematics" fill="#ffc658" name={isOdia ? 'ଗଣିତ' : 'Mathematics'} />
                  <Bar dataKey="science" fill="#ff7c7c" name={isOdia ? 'ବିଜ୍ଞାନ' : 'Science'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isOdia ? 'ବିଷୟଭିତ୍ତିକ ବିତରଣ' : 'Subject-wise Distribution'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: isOdia ? 'ଇଂରାଜୀ' : 'English', value: 75 },
                        { name: isOdia ? 'ଓଡ଼ିଆ' : 'Odia', value: 86 },
                        { name: isOdia ? 'ଗଣିତ' : 'Math', value: 71 },
                        { name: isOdia ? 'ବିଜ୍ଞାନ' : 'Science', value: 77 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isOdia ? 'ଶ୍ରେଷ୍ଠ ପ୍ରଦର୍ଶନକାରୀ' : 'Top Performers'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData
                    .sort((a, b) => b.overall - a.overall)
                    .slice(0, 5)
                    .map((cls, index) => (
                      <div key={cls.class} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{cls.class}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{cls.overall}%</div>
                          <div className="text-xs text-gray-500">{isOdia ? 'ସାମଗ୍ରିକ' : 'Overall'}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'ଦୈନିକ ଉପସ୍ଥିତି ଧାରା' : 'Daily Attendance Trends'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={attendanceData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#8884d8" name={isOdia ? 'ଛାତ୍ର' : 'Students'} />
                  <Line type="monotone" dataKey="teachers" stroke="#82ca9d" name={isOdia ? 'ଶିକ୍ଷକ' : 'Teachers'} />
                  <Line type="monotone" dataKey="total" stroke="#ff7c7c" name={isOdia ? 'ମୋଟ%' : 'Total%'} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isOdia ? 'ଏହି ସପ୍ତାହ' : 'This Week'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89.2%</div>
                <p className="text-xs text-green-600">+3.1% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isOdia ? 'ଏହି ମାସ' : 'This Month'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-green-600">+2.5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isOdia ? 'ଏହି ଅବଧି' : 'This Term'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86.8%</div>
                <p className="text-xs text-yellow-600">-1.2% from last term</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-green-700">
                  {isOdia ? 'ଅନୁପାଳିତ' : 'Compliant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {complianceData.filter(item => item.status === 'compliant').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-yellow-700">
                  {isOdia ? 'ଆଂଶିକ' : 'Partial'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceData.filter(item => item.status === 'partial').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-700">
                  {isOdia ? 'ଅନୁପାଳିତ ନୁହେଁ' : 'Non-Compliant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {complianceData.filter(item => item.status === 'non_compliant').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isOdia ? 'ସରକାରୀ ଅନୁପାଳନ ବିବରଣୀ' : 'Government Compliance Details'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  complianceData.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, ComplianceItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2">{category}</h3>
                    <div className="grid gap-3">
                      {items.map((item, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${getComplianceColor(item.status)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon(item.priority)}
                                <span className="font-medium">{item.item}</span>
                                <Badge 
                                  variant={
                                    item.status === 'compliant' ? 'default' :
                                    item.status === 'partial' ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {item.status === 'compliant' ? (isOdia ? 'ଅନୁପାଳିତ' : 'COMPLIANT') :
                                   item.status === 'partial' ? (isOdia ? 'ଆଂଶିକ' : 'PARTIAL') :
                                   (isOdia ? 'ଅନୁପାଳିତ ନୁହେଁ' : 'NON-COMPLIANT')}
                                </Badge>
                              </div>
                              <p className="text-sm mt-1">{item.description}</p>
                              {item.dueDate && (
                                <p className="text-xs text-red-600 mt-1">
                                  {isOdia ? 'ଶେଷ ତାରିଖ:' : 'Due Date:'} {item.dueDate}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolDashboard;