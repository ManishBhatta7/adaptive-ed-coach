
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Book } from 'lucide-react';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import LoadingScreen from '@/components/loading/LoadingScreen';
import { ValidatedInput } from '@/components/ui/validated-input';
import { emailSchema } from '@/utils/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { login, state } = useAppContext();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, state.isLoading, navigate]);

  const {
    errors,
    isSubmitting,
    hasErrors,
    validateField,
    handleSubmit,
    markTouched,
    getFieldError
  } = useFormValidation({
    schema: loginSchema,
    onSubmit: async (data) => {
      console.log('Attempting login with email:', data.email);
      const success = await login(data.email, data.password);
      
      if (success) {
        toast({
          title: 'Login successful',
          description: 'Welcome back to AdaptiveEdCoach!'
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid email or password',
          variant: 'destructive'
        });
      }
    }
  });

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.keys(formData).forEach(key => markTouched(key));
    handleSubmit(formData);
  };
  
  // If still checking authentication status, show a loading state
  if (state.isLoading) {
    return <LoadingScreen message="Checking authentication..." fullScreen />;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-edu-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Book className="h-8 w-8 text-edu-primary" />
            <span className="text-2xl font-bold">AdaptiveEdCoach</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
        </div>
        
        <Card>
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ValidatedInput
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                onBlur={() => markTouched('email')}
                validator={(value) => {
                  try {
                    emailSchema.parse(value);
                    return null;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.errors[0]?.message || 'Invalid email';
                    }
                    return 'Invalid email';
                  }
                }}
                required
                disabled={isSubmitting}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-xs text-edu-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <ValidatedInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onBlur={() => markTouched('password')}
                  validator={(value) => {
                    if (!value) return 'Password is required';
                    return null;
                  }}
                  showValidation={false} // Don't show validation for password on login
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || hasErrors}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <a href="/signup" className="text-edu-primary hover:underline font-medium">
                  Sign up
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
