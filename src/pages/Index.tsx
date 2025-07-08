
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Book, Upload, MessageSquare, Users, GraduationCap, Target, BookOpen, TrendingUp, Star } from 'lucide-react';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Book className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AdaptiveEdCoach
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                LIVE & self-paced
              </span>
              <br />
              <span className="text-gray-800">AI education</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mb-8">
              AI learning bootcamps
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              For (1) college students, (2) industry professionals, (3) school students and (4) teachers
            </p>
            
            {/* University Logos */}
            <div className="flex justify-center items-center gap-8 mb-12 opacity-70">
              <div className="text-red-600 font-bold text-sm">MIT</div>
              <div className="text-yellow-600 font-bold text-sm">PURDUE</div>
              <div className="text-blue-600 font-bold text-sm">IIT MADRAS</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-purple-100 max-w-md mx-auto mb-12">
              <h3 className="text-xl font-bold text-purple-600 mb-4">Our singular mission:</h3>
              <p className="text-lg font-semibold text-gray-800">To make AI accessible for all!</p>
              <p className="text-sm text-purple-600 mt-2">By MIT, Purdue AI PhDs</p>
            </div>
            
            {/* AI for All Diagram */}
            <div className="relative max-w-2xl mx-auto mb-16">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
              <div className="relative grid grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-purple-600">Schools</p>
                </div>
                
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    AI
                  </div>
                  <p className="text-lg font-medium text-gray-600">for all</p>
                </div>
                
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-blue-600">Colleges</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-green-600">School teachers</p>
                </div>
                
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-orange-600">Industry professionals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Target Audience Sections */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {/* College Students */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">For college students</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">College student</h3>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 rounded-full px-8"
                    asChild
                  >
                    <Link to="/learning-style">LIVE courses</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full px-8"
                    asChild
                  >
                    <Link to="/assignments">Scientific ML</Link>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg">➜ We offer both LIVE and self-paced AI/ML courses.</p>
                <p className="text-lg">➜ Our popular SciML researcher program for publishing impactful research papers at conferences like ICML, NeurIPS, etc.</p>
                <p className="text-lg">➜ Videsh is our grad-school (MS/PhD) application program.</p>
                <p className="text-sm text-gray-600 mt-6">
                  Click one of the buttons below to take you to the respective program page.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                    <Link to="/learning-style">LIVE AI/ML courses</Link>
                  </Button>
                  <Button variant="outline" className="border-blue-300 text-blue-600" asChild>
                    <Link to="/submit">Self-paced courses</Link>
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <Link to="/progress">SciML bootcamp</Link>
                  </Button>
                  <Button variant="outline" className="border-purple-300 text-purple-600" asChild>
                    <Link to="/classrooms">MS/PhD application</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Industry Professionals */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">For industry professionals</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <p className="text-lg">➜ We offer both LIVE and self-paced AI/ML courses.</p>
                <p className="text-lg">➜ Our popular SciML researcher program for publishing impactful research papers at conferences like ICML, NeurIPS, etc.</p>
                <p className="text-lg">➜ Videsh is our grad-school (MS/PhD) application program.</p>
                <p className="text-sm text-gray-600 mt-6">
                  Click one of the buttons below to take you to the respective program page.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button className="bg-green-600 hover:bg-green-700" asChild>
                    <Link to="/essay-checker">LIVE AI/ML courses</Link>
                  </Button>
                  <Button variant="outline" className="border-green-300 text-green-600" asChild>
                    <Link to="/reading">Self-paced courses</Link>
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link to="/answer-sheet">SciML bootcamp</Link>
                  </Button>
                  <Button variant="outline" className="border-orange-300 text-orange-600" asChild>
                    <Link to="/report-upload">MS/PhD application</Link>
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Industry professional</h3>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="border-green-300 text-green-600 hover:bg-green-50 rounded-full px-8"
                    asChild
                  >
                    <Link to="/dashboard">Professional Track</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 rounded-full px-8"
                    asChild
                  >
                    <Link to="/notifications">Career Boost</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to start your AI learning journey?</h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who are advancing their careers with AI education designed for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white text-purple-600 hover:bg-purple-50" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                Start Learning Today
              </Link>
            </Button>
            <Button size="lg" className="bg-purple-800 hover:bg-purple-900 text-white" asChild>
              <Link to="/learning-style">
                Explore Programs
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AdaptiveEdCoach
              </span>
            </div>
            <div className="flex gap-8">
              <Link to="/about" className="text-gray-600 hover:text-purple-600 text-sm">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600 text-sm">Contact</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-purple-600 text-sm">Privacy</Link>
              <Link to="/terms" className="text-gray-600 hover:text-purple-600 text-sm">Terms</Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-600">
            &copy; {new Date().getFullYear()} AdaptiveEdCoach. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
