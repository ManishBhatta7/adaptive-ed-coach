import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { 
  Book, ChartBar, FileText, Mic, User, Upload, Edit, 
  MessageSquare, Menu, ChevronLeft, Sun, Moon, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/i18n/LanguageSelector'; // Ensure correct path
import LoadingScreen from '@/components/loading/LoadingScreen';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAppContext();
  const { isAuthenticated, isLoading } = state;
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Dashboard', icon: <ChartBar className="h-5 w-5" />, href: '/dashboard' },
    { label: 'Submit Work', icon: <FileText className="h-5 w-5" />, href: '/submit' },
    { label: 'Essay Checker', icon: <Edit className="h-5 w-5" />, href: '/essay-checker' },
    { label: 'Answer Sheet', icon: <MessageSquare className="h-5 w-5" />, href: '/answer-sheet' },
    { label: 'Reading Practice', icon: <Mic className="h-5 w-5" />, href: '/reading' },
    { label: 'Smart Scanner', icon: <Book className="h-5 w-5" />, href: '/ocr' }, // Added OCR link
    { label: 'Upload Report', icon: <Upload className="h-5 w-5" />, href: '/report-upload' },
    { label: 'Progress', icon: <ChartBar className="h-5 w-5" />, href: '/progress' },
    { label: 'Learning Style', icon: <User className="h-5 w-5" />, href: '/learning-style' }
  ];

  if (isLoading) {
    return <LoadingScreen message="Loading..." fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <OfflineIndicator position="top" />
      
      {isAuthenticated && (
        <aside 
          className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 ease-in-out flex flex-col",
            collapsed ? "w-20" : "w-64"
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            {!collapsed && (
              <div className="flex items-center gap-2 font-bold text-xl text-edu-primary animate-in fade-in">
                <Book className="h-6 w-6" />
                <span>EdCoach</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className={cn("ml-auto", collapsed && "mx-auto")}
            >
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navItems.map((item) => (
              <div
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer group",
                  location.pathname === item.href 
                    ? "bg-edu-primary text-white shadow-md" 
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
                
                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-16 z-50 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block border">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t space-y-4">
            {/* Language Selector */}
            <div className={cn("flex justify-center", !collapsed && "justify-start")}>
               {/* Passing props to adapt to collapsed state */}
               <LanguageSelector 
                 variant="button" 
                 showNativeName={!collapsed} 
                 className={cn(collapsed ? "w-10 px-0 justify-center" : "w-full justify-start")}
               />
            </div>

            {/* Theme Toggle & Logout */}
            <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title="Toggle Theme"
                className="w-full"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {!collapsed && <span className="ml-2 text-xs">Theme</span>}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-5 w-5" />
                {!collapsed && <span className="ml-2 text-xs">Logout</span>}
              </Button>
            </div>
          </div>
        </aside>
      )}

      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        isAuthenticated ? (collapsed ? "ml-20" : "ml-64") : "ml-0"
      )}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default MainLayout;