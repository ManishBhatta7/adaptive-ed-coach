import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  CircleCheck as CheckCircle,
  Sparkles,
  Zap,
  Shield,
  FileText,
  BarChart3,
  Play,
  ChevronRight,
  Star,
  Users2,
  FileQuestion,
  MessageSquare
} from 'lucide-react';
import { PricingPlans } from '@/components/pricing/PricingPlans';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;

  // Core Features for Hero Section
  const coreFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Adaptive content that evolves with your progress'
    },
    {
      icon: Target,
      title: 'Personalized Paths',
      description: 'Custom learning journeys tailored to your style'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Analytics',
      description: 'Track progress with intelligent insights'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security'
    }
  ];

  // Main Offerings
  const offerings = [
    {
      icon: Sparkles,
      title: 'Personal AI Study Buddy',
      description: 'Your 24/7 intelligent learning companion',
      features: [
        'Personalized study plans',
        'Interactive Q&A sessions',
        'Smart content recommendations',
        'Progress tracking'
      ],
      route: '/study',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BookOpen,
      title: 'Interactive Reading Assistant',
      description: 'Transform reading into an engaging experience',
      features: [
        'Voice-enabled reading',
        'Comprehension analysis',
        'Vocabulary builder',
        'Reading level adaptation'
      ],
      route: '/reading',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: 'AI Writing Coach',
      description: 'Elevate your writing with instant feedback',
      features: [
        'Grammar & style suggestions',
        'Plagiarism detection',
        'Essay structure analysis',
        'Writing skill development'
      ],
      route: '/essay-checker',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'My Learning Journey',
      description: 'Visualize your academic growth',
      features: [
        'Performance analytics',
        'Goal setting & tracking',
        'Achievement badges',
        'Progress reports'
      ],
      route: '/progress',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Users2,
      title: 'Classroom Management',
      description: 'For teachers to manage students effectively',
      features: [
        'Student progress monitoring',
        'Assignment creation',
        'Class analytics',
        'Parent communication'
      ],
      route: '/teacher-dashboard',
      color: 'from-indigo-500 to-purple-500',
      badge: 'Teachers'
    },
    {
      icon: FileQuestion,
      title: 'Answer Sheet Analysis',
      description: 'Automated grading with detailed insights',
      features: [
        'OCR-powered scanning',
        'Instant grading',
        'Mistake pattern analysis',
        'Improvement suggestions'
      ],
      route: '/answer-sheet',
      color: 'from-teal-500 to-green-500',
      badge: 'Teachers'
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'High School Teacher',
      content: 'This platform has transformed how I teach. The AI tools save me hours every week!',
      rating: 5
    },
    {
      name: 'Rahul Patel',
      role: 'Grade 10 Student',
      content: 'My grades improved by 25% in just 3 months. The personalized learning is amazing!',
      rating: 5
    },
    {
      name: 'Dr. Emily Chen',
      role: 'School Principal',
      content: 'Best investment for our school. Teachers and students both love it!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Adaptive Ed Coach
            </span>
          </div>
          
          {!isAuthenticated ? (
            <div className="flex gap-3">
              <Link to="/login">
                <Button variant="ghost" size="lg">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Advanced AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              Learn Smarter,
              <br />
              Not Harder
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of education with AI-powered personalized learning that adapts to your unique style and pace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6">
                  Start Learning Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-purple-300 transition-all hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Offerings Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools for students, teachers, and schools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offerings.map((offering, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${offering.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <offering.icon className="w-7 h-7 text-white" />
                    </div>
                    {offering.badge && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {offering.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2">{offering.title}</CardTitle>
                  <CardDescription className="text-base">{offering.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {offering.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={offering.route}>
                    <Button className={`w-full bg-gradient-to-r ${offering.color} hover:opacity-90`}>
                      Explore Feature
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-purple-100">Active Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Teachers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-purple-100">Schools</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-purple-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Students & Teachers
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Flexible pricing for individuals, teachers, and schools
            </p>
          </div>
          <PricingPlans />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands of students and teachers already excelling with AI-powered education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
                Start Free Trial
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Contact Sales
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-6 w-6 text-purple-400" />
                <span className="text-lg font-bold text-white">Adaptive Ed Coach</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering learners with AI-driven personalized education
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-purple-400 transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-purple-400 transition-colors">Demo</Link></li>
                <li><Link to="/integrations" className="hover:text-purple-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-purple-400 transition-colors">Careers</Link></li>
                <li><Link to="/blog" className="hover:text-purple-400 transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-purple-400 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Adaptive Ed Coach. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
