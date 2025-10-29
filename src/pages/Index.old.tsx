
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  CircleCheck as CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Award,
  MessageSquare,
  FileText,
  BarChart3,
  Play,
  ChevronRight,
  Star,
  Users2,
  School,
  Mic,
  FileQuestion,
  ScanText,
  Calendar
} from 'lucide-react';
import { PricingPlans } from '@/components/pricing/PricingPlans';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const offerings = [
    {
      title: "Your Personal AI Study Buddy",
      subtitle: "Learn smarter every day with an AI companion that knows your strengths",
      image: heroImage,
      features: [
        "Personalized learning that adapts to you",
        "Instant feedback on your work",
        "AI-powered study recommendations"
      ],
      link: "/learning-style",
      buttonText: "Meet Your Study Buddy",
      color: "from-pink-500 to-purple-600"
    },
    {
      title: "Interactive Reading Assistant",
      subtitle: "Like having a personal tutor guiding your reading — always available",
      image: heroImage,
      features: [
        "Friendly conversation practice",
        "Real-time guidance as you read",
        "Build confidence at your pace"
      ],
      link: "/voice-reading",
      buttonText: "Practice With Me",
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Writing Coach",
      subtitle: "Your personal writing assistant that helps you improve with every essay",
      image: heroImage,
      features: [
        "Instant essay feedback",
        "Writing style suggestions",
        "Step-by-step improvements"
      ],
      link: "/essay-checker",
      buttonText: "Improve My Writing",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "My Learning Journey",
      subtitle: "Watch yourself grow and celebrate your achievements",
      image: heroImage,
      features: [
        "Personal progress dashboard",
        "Daily learning streaks",
        "Achievement badges"
      ],
      link: "/progress",
      buttonText: "View Progress",
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Classroom Management",
      subtitle: "AI-powered tools for teachers and educators",
      image: heroImage,
      features: [
        "Student performance monitoring",
        "Assignment creation tools",
        "Class analytics dashboard"
      ],
      link: "/classrooms",
      buttonText: "Manage Classes",
      color: "from-purple-500 to-indigo-600"
    },
    {
      title: "Answer Sheet Analysis",
      subtitle: "Automated evaluation and detailed feedback",
      image: heroImage,
      features: [
        "Instant scoring system",
        "Error pattern analysis",
        "Improvement recommendations"
      ],
      link: "/answer-sheet",
      buttonText: "Analyze Answers",
      color: "from-teal-500 to-blue-600"
    },
    {
      title: "OCR Document Scanner",
      subtitle: "Convert images to editable text documents",
      image: heroImage,
      features: [
        "Advanced OCR technology",
        "Multiple format support",
        "Editable text output"
      ],
      link: "/ocr",
      buttonText: "Scan Document",
      color: "from-amber-500 to-orange-600"
    }
  ];
  
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
            <>
              <Button variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </>
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
      <section className="py-20 px-6 text-center">
        <div className="container mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-8">
            What do we offer?
          </h1>
        </div>
      </section>
      
      {/* Offerings Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {offerings.map((offering, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={offering.image} 
                      alt={offering.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${offering.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-2">
                      <span className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-full bg-gradient-to-r ${offering.color}`}>
                        {offering.title}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {offering.subtitle}
                    </h3>
                    
                    <div className="space-y-2 mb-6">
                      {offering.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${offering.color} hover:opacity-90 text-white font-medium`}
                      asChild
                    >
                      <Link to={offering.link}>
                        {offering.buttonText}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <PricingPlans />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 mx-6 rounded-2xl mb-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Meet Your New Study Buddy</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Start your 7-day free trial and discover how learning with an AI companion can transform your study experience.
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-50 hover:text-purple-700 font-semibold px-8 py-4" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              Try Free for 7 Days
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
