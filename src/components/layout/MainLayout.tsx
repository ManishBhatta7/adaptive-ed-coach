
import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAppContext } from '@/context/AppContext';
import { Book, ChartBar, FileText, Mic, User, Upload, Edit, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import LanguageSelector from '@/components/LanguageSelector';
import LoadingScreen from '@/components/loading/LoadingScreen';
import ErrorBoundary from '@/components/error/ErrorBoundary';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const { isAuthenticated, isLoading } = state;

  const handleLanguageChange = (lang: string) => {
    // In a real implementation, this would update the app's translations
    console.log('Language changed to:', lang);
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: <ChartBar className="h-5 w-5" />,
      href: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      label: 'Submit Work',
      icon: <FileText className="h-5 w-5" />,
      href: '/submit',
      active: location.pathname === '/submit'
    },
    {
      label: 'Essay Checker',
      icon: <Edit className="h-5 w-5" />,
      href: '/essay-checker',
      active: location.pathname === '/essay-checker'
    },
    {
      label: 'Answer Sheet',
      icon: <MessageSquare className="h-5 w-5" />,
      href: '/answer-sheet',
      active: location.pathname === '/answer-sheet'
    },
    {
      label: 'Reading Practice',
      icon: <Mic className="h-5 w-5" />,
      href: '/reading',
      active: location.pathname === '/reading'
    },
    {
      label: 'Upload Report',
      icon: <Upload className="h-5 w-5" />,
      href: '/report-upload',
      active: location.pathname === '/report-upload'
    },
    {
      label: 'Progress',
      icon: <ChartBar className="h-5 w-5" />,
      href: '/progress',
      active: location.pathname === '/progress'
    },
    {
      label: 'Learning Style',
      icon: <User className="h-5 w-5" />,
      href: '/learning-style',
      active: location.pathname === '/learning-style'
    }
  ];

  if (isLoading) {
    return <LoadingScreen message="Loading application..." fullScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow">
        {isAuthenticated && (
          <aside className="md:w-64 bg-gray-50 border-r border-gray-200 md:min-h-[calc(100vh-4rem)]">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6 pl-2">
                <div className="flex items-center">
                  <Book className="h-6 w-6 text-edu-primary mr-2" />
                  <span className="font-semibold text-lg">AdaptiveEdCoach</span>
                </div>
                <LanguageSelector onLanguageChange={handleLanguageChange} />
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      item.active 
                        ? "bg-edu-primary text-white" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
        <main className="flex-grow">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
