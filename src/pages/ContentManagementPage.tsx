import PageLayout from '@/components/layout/PageLayout';
import FastContentImporter from '@/components/content/FastContentImporter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, BookOpen, Users, TrendingUp } from 'lucide-react';

const ContentManagementPage = () => {
  return (
    <PageLayout 
      title="Content Management" 
      subtitle="Import and manage educational content from external sources"
      className="py-8"
    >
      <div className="container px-6 max-w-6xl mx-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-pink-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Content</CardTitle>
              <Database className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                1,247
              </div>
              <p className="text-xs text-gray-600">Educational resources</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                89
              </div>
              <p className="text-xs text-gray-600">Structured learning paths</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Import Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                94%
              </div>
              <p className="text-xs text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Import Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">YouTube Learning Content</h2>
            <p className="text-gray-600">
              Import high-quality educational content from YouTube. Filter by subject, grade level, 
              and difficulty to get the most relevant content for your students.
            </p>
          </div>
          
          <FastContentImporter />
        </div>

        {/* Information Card */}
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              About YouTube Integration
            </CardTitle>
            <CardDescription className="text-gray-700">
              Access a vast library of educational content from YouTube creators and educators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-purple-700">AI-Enhanced Features:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Automatic content analysis</li>
                  <li>• AI-generated quiz questions</li>
                  <li>• Smart content recommendations</li>
                  <li>• Auto-generated transcripts</li>
                  <li>• Learning objective detection</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-700">Subject Areas Covered:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Mathematics (Algebra, Geometry, Calculus)</li>
                  <li>• Science (Physics, Chemistry, Biology)</li>
                  <li>• Literature and Language Arts</li>
                  <li>• History and Social Studies</li>
                  <li>• Computer Science and Technology</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContentManagementPage;