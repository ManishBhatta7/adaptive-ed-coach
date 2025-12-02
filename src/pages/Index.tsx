import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Brain, Target, TrendingUp, 
  CheckCircle, Sparkles, Zap, Shield, FileText, BarChart3, 
  Play, ChevronRight, Star, Users2, FileQuestion, MessageSquare, ArrowRight
} from 'lucide-react';
import { PricingPlans } from '@/components/pricing/PricingPlans';

const Index = () => {
  const { state } = useAppContext();
  const { isAuthenticated } = state;

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* === HEADER === */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-edu-primary/10 p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-edu-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-edu-primary to-pink-600 bg-clip-text text-transparent">
              RetainLearn
            </span>
          </div>
          
          <div className="flex gap-4 items-center">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden md:block font-medium text-gray-600 hover:text-edu-primary transition-colors">
                  Login
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full px-6 bg-edu-primary hover:bg-edu-secondary transition-all shadow-lg hover:shadow-edu-primary/25">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <Button className="rounded-full px-6 bg-edu-primary hover:bg-edu-secondary">
                  Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* === HERO SECTION === */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-purple-200 bg-white/50 backdrop-blur text-purple-700 shadow-sm">
                <Sparkles className="w-3 h-3 mr-2 fill-purple-500 text-purple-500" />
                New: Gemini 3 Pro Powered
              </Badge>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-6xl md:text-7xl font-bold mb-8 tracking-tight text-gray-900"
            >
              Learning that <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400">adapts to you.</span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Your personal AI tutor that evolves with every question you answer. 
              Master any subject with real-time feedback and personalized paths.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg bg-gray-900 hover:bg-gray-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  Start Learning Now
                </Button>
              </Link>
              <Link to="/demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <Play className="mr-2 h-4 w-4 fill-gray-900" /> Watch Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* (You can keep the rest of your Index.tsx content here, like Features and Pricing) */}
    </div>
  );
};

export default Index;