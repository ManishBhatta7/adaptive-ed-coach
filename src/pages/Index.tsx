
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Book, Upload, MessageSquare, Users, GraduationCap, Target, BookOpen, Brain, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-education-ai.jpg';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
            <Book className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">AdaptiveEdCoach</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="AI Education Hero" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-600/20 to-blue-600/20"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">LIVE & self-paced</span>
            <br />
            <span className="text-gray-800">AI coaching</span>
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI learning</span>
            <span className="text-gray-800"> bootcamps</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            For (1) students, (2) teachers, (3) parents and (4) schools
          </p>
          
          {/* Circular Icons */}
          <div className="flex justify-center items-center mb-16">
            <div className="relative">
              {/* Center AI circle */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-8">
                AI
                <br />
                for all
              </div>
              
              {/* Surrounding circles */}
              <div className="absolute -top-12 -left-24 w-24 h-24 rounded-full bg-pink-200 flex flex-col items-center justify-center text-pink-800 text-sm font-medium">
                <Users className="h-6 w-6 mb-1" />
                Schools
              </div>
              <div className="absolute -top-12 -right-24 w-24 h-24 rounded-full bg-purple-200 flex flex-col items-center justify-center text-purple-800 text-sm font-medium">
                <GraduationCap className="h-6 w-6 mb-1" />
                Students
              </div>
              <div className="absolute -bottom-12 -left-24 w-24 h-24 rounded-full bg-blue-200 flex flex-col items-center justify-center text-blue-800 text-sm font-medium">
                <BookOpen className="h-6 w-6 mb-1" />
                Teachers
              </div>
              <div className="absolute -bottom-12 -right-24 w-24 h-24 rounded-full bg-green-200 flex flex-col items-center justify-center text-green-800 text-sm font-medium">
                <Users className="h-6 w-6 mb-1" />
                Parents
              </div>
            </div>
          </div>
          
          <p className="text-2xl font-bold text-gray-800 mb-4">Our singular mission: To make AI accessible for all!</p>
          <p className="text-lg text-pink-600 font-medium mb-12">By experts in Adaptive Education</p>
        </div>
      </section>
      
      {/* For Students Section */}
      <section className="py-16 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="w-48 h-48 mx-auto bg-gradient-to-r from-pink-200 to-purple-200 rounded-full flex items-center justify-center mb-8">
                <div className="text-center">
                  <GraduationCap className="h-16 w-16 text-purple-600 mx-auto mb-2" />
                  <p className="text-purple-800 font-bold text-lg">Student</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">For Students</h2>
              <div className="space-y-4 mb-8">
                <p className="flex items-start text-gray-700">
                  <span className="text-pink-500 mr-2">→</span>
                  We offer both LIVE and self-paced AI coaching sessions.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-pink-500 mr-2">→</span>
                  Our adaptive learning program that adjusts to your learning style.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-pink-500 mr-2">→</span>
                  Progress tracking and personalized feedback for better academic performance.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
                  <Link to="/learning-style">Discover Learning Style</Link>
                </Button>
                <Button variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50" asChild>
                  <Link to="/progress">Track Progress</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* For Teachers Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="md:w-1/2">
              <div className="w-48 h-48 mx-auto bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full flex items-center justify-center mb-8">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-800 font-bold text-lg">Teacher</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">For Teachers</h2>
              <div className="space-y-4 mb-8">
                <p className="flex items-start text-gray-700">
                  <span className="text-blue-500 mr-2">→</span>
                  Classroom management tools and student progress analytics.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-blue-500 mr-2">→</span>
                  AI-powered assignment creation and automated feedback generation.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-blue-500 mr-2">→</span>
                  Professional development resources for modern teaching methods.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700" asChild>
                  <Link to="/classrooms">Manage Classrooms</Link>
                </Button>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" asChild>
                  <Link to="/assignments">Create Assignments</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* For Schools Section */}
      <section className="py-16 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="w-48 h-48 mx-auto bg-gradient-to-r from-green-200 to-emerald-200 rounded-full flex items-center justify-center mb-8">
                <div className="text-center">
                  <Users className="h-16 w-16 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-bold text-lg">School</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">For Schools</h2>
              <div className="space-y-4 mb-8">
                <p className="flex items-start text-gray-700">
                  <span className="text-green-500 mr-2">→</span>
                  Institution-wide analytics and performance insights.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-green-500 mr-2">→</span>
                  Curriculum alignment with Odisha state board standards.
                </p>
                <p className="flex items-start text-gray-700">
                  <span className="text-green-500 mr-2">→</span>
                  Teacher training programs and administrative tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" asChild>
                  <Link to="/dashboard">School Dashboard</Link>
                </Button>
                <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50" asChild>
                  <Link to="/settings">Settings</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to transform education with AI?</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join educators and students who are using adaptive AI coaching to achieve academic excellence.
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-50 hover:text-purple-700 font-semibold px-8 py-4" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              Start Your AI Journey
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                <Book className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">AdaptiveEdCoach</span>
            </div>
            <div className="flex gap-8">
              <Link to="/about" className="text-gray-300 hover:text-pink-400 text-sm">About</Link>
              <Link to="/contact" className="text-gray-300 hover:text-pink-400 text-sm">Contact</Link>
              <Link to="/privacy" className="text-gray-300 hover:text-pink-400 text-sm">Privacy</Link>
              <Link to="/terms" className="text-gray-300 hover:text-pink-400 text-sm">Terms</Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-400">
            &copy; {new Date().getFullYear()} AdaptiveEdCoach. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
