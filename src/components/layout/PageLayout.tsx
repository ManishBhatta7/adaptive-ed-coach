import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Book, Bell } from 'lucide-react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  className?: string;
}

const PageLayout = ({ 
  children, 
  title, 
  subtitle, 
  showHeader = true, 
  className = "" 
}: PageLayoutProps) => {
  const { state, logout } = useAppContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {showHeader && (
        <header className="w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
              <Book className="h-5 w-5 text-white" />
            </div>
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              AdaptiveEdCoach
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium hover:text-pink-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/learning-style" className="text-sm font-medium hover:text-pink-600 transition-colors">
              Learning Style
            </Link>
            <Link to="/classrooms" className="text-sm font-medium hover:text-pink-600 transition-colors">
              Classrooms
            </Link>
            <Link to="/assignments" className="text-sm font-medium hover:text-pink-600 transition-colors">
              Assignments
            </Link>
            <Link to="/progress" className="text-sm font-medium hover:text-pink-600 transition-colors">
              Progress
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {state.isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={state.currentUser?.avatar || "/placeholder.svg"} alt={state.currentUser?.name} />
                        <AvatarFallback>{state.currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{state.currentUser?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{state.currentUser?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
      )}

      {(title || subtitle) && (
        <div className="py-12 px-6 bg-white/60 backdrop-blur-sm border-b border-pink-100">
          <div className="container mx-auto text-center">
            {title && (
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
            )}
            {subtitle && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-auto">
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

export default PageLayout;