
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Book, GraduationCap, BookOpen, Users, Brain, Target, TrendingUp, CheckCircle } from 'lucide-react';
import heroImage from '@/assets/hero-education-ai.jpg';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const offerings = [
    {
      title: "Adaptive Learning",
      subtitle: "Personalized AI-powered learning paths for every student",
      image: heroImage,
      features: [
        "Self-paced learning modules",
        "Real-time performance tracking",
        "Customized content delivery"
      ],
      link: "/learning-style",
      buttonText: "Discover Your Style",
      color: "from-pink-500 to-purple-600"
    },
    {
      title: "Voice Reading Coach",
      subtitle: "AI-powered reading comprehension and fluency training",
      image: heroImage,
      features: [
        "Speech recognition technology",
        "Pronunciation feedback",
        "Reading comprehension analysis"
      ],
      link: "/voice-reading",
      buttonText: "Start Reading",
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Essay Checker",
      subtitle: "Intelligent essay analysis and improvement suggestions",
      image: heroImage,
      features: [
        "Grammar and style checking",
        "Content quality analysis",
        "Personalized feedback"
      ],
      link: "/essay-checker",
      buttonText: "Check Essay",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Progress Analytics",
      subtitle: "Comprehensive progress tracking and insights",
      image: heroImage,
      features: [
        "Performance visualization",
        "Learning trend analysis",
        "Achievement milestones"
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
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 mx-6 rounded-2xl mb-16">
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
