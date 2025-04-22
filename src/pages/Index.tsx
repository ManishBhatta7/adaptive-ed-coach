import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Book, Upload, MessageSquare, Users } from 'lucide-react';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white border-b">
        <div className="flex items-center gap-2">
          <Book className="h-6 w-6 text-edu-primary" />
          <span className="text-xl font-bold">AdaptiveEdCoach</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      
      <section className="relative bg-edu-background py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Personalized AI Learning Coach
              </h1>
              <p className="text-xl mb-8 text-gray-700 max-w-md">
                Get feedback that adapts to your learning style and tracks your progress over time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/learning-style">
                    Discover Your Learning Style
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <div className="mb-4 flex items-center text-edu-primary font-semibold">
                  <Book className="mr-2 h-5 w-5" />
                  <span>Smart Learning Analysis</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">How It Works</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-edu-light flex items-center justify-center text-edu-primary font-bold mr-3">1</div>
                    <p>Take our learning style assessment to discover how you learn best</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-edu-light flex items-center justify-center text-edu-primary font-bold mr-3">2</div>
                    <p>Submit your assignments and get personalized AI feedback</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-edu-light flex items-center justify-center text-edu-primary font-bold mr-3">3</div>
                    <p>Track your progress over time with detailed analytics</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Adaptive Education Features</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Our AI coach adapts to your unique learning style and provides personalized guidance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-edu-background p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-edu-light flex items-center justify-center mb-4">
                <Book className="h-6 w-6 text-edu-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Learning Style Detection</h3>
              <p className="text-gray-700">
                Discover whether you're a visual, auditory, kinesthetic, or logical learner through our assessment.
              </p>
            </div>
            
            <div className="bg-edu-background p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-edu-light flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-edu-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
              <p className="text-gray-700">
                Monitor your academic growth over time with detailed analytics and performance insights.
              </p>
            </div>
            
            <div className="bg-edu-background p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-edu-light flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-edu-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Personalized Feedback</h3>
              <p className="text-gray-700">
                Receive feedback tailored to your learning style for maximum comprehension and retention.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-edu-primary bg-opacity-10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your learning experience?</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are discovering their learning potential with adaptive AI coaching.
          </p>
          <Button size="lg" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              Get Started Today
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Book className="h-6 w-6 text-edu-primary" />
              <span className="text-xl font-bold">AdaptiveEdCoach</span>
            </div>
            <div className="flex gap-8">
              <Link to="/about" className="text-gray-600 hover:text-edu-primary text-sm">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-edu-primary text-sm">Contact</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-edu-primary text-sm">Privacy</Link>
              <Link to="/terms" className="text-gray-600 hover:text-edu-primary text-sm">Terms</Link>
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
