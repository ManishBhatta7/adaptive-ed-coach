
import { useState } from 'react';
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
import { Book, Upload, MessageSquare, Calendar, Bell } from 'lucide-react';

const Header = () => {
  const { state, logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Book className="h-6 w-6 text-edu-primary" />
            <span className="text-xl font-bold">AdaptiveEdCoach</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-edu-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/learning-style" className="text-sm font-medium hover:text-edu-primary transition-colors">
            Learning Style
          </Link>
          <Link to="/classrooms" className="text-sm font-medium hover:text-edu-primary transition-colors">
            Classrooms
          </Link>
          <Link to="/assignments" className="text-sm font-medium hover:text-edu-primary transition-colors">
            Assignments
          </Link>
          <Link to="/progress" className="text-sm font-medium hover:text-edu-primary transition-colors">
            Progress
          </Link>
          <Link to="/ocr" className="text-sm font-medium hover:text-edu-primary transition-colors">
            OCR Scanner
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
              <Button variant="outline" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={mobileMenuOpen ? "hidden" : "block"}
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={mobileMenuOpen ? "block" : "hidden"}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t py-4 px-6 bg-white space-y-4">
          <Link 
            to="/dashboard" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/learning-style" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Learning Style
          </Link>
          <Link 
            to="/classrooms" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Classrooms
          </Link>
          <Link 
            to="/assignments" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Assignments
          </Link>
          <Link 
            to="/progress" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Progress
          </Link>
          <Link 
            to="/ocr" 
            className="block py-2 text-sm font-medium hover:text-edu-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            OCR Scanner
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
