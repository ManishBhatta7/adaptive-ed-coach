import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Play, ArrowLeft } from 'lucide-react';

const Demo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-purple-600" />
          <span className="text-2xl font-bold text-purple-900">RetainLearn</span>
        </Link>
        <Link to="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Demo Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            See RetainLearn in Action
          </h1>
          <p className="text-xl text-gray-600">
            Watch how our AI-powered platform transforms learning
          </p>
        </div>

        <Card className="max-w-5xl mx-auto mb-12">
          <CardContent className="p-8">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-gray-700 font-semibold">Demo Video Coming Soon</p>
                <p className="text-gray-600 text-sm mt-2">Sign up now to get early access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>For Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Personalized AI study companion</li>
                <li>• Interactive reading & writing tools</li>
                <li>• Real-time progress tracking</li>
                <li>• Adaptive learning paths</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Classroom management tools</li>
                <li>• Automated grading & analysis</li>
                <li>• Student progress monitoring</li>
                <li>• AI-powered content creation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• School-wide analytics dashboard</li>
                <li>• Bulk student management</li>
                <li>• Custom branding options</li>
                <li>• Dedicated support team</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Demo;
