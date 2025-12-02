import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  
  // === THE TRAFFIC COP ===
  // This Effect handles ALL redirection logic based on the loaded profile
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading && state.currentUser) {
      console.log("Auth Check Passed. Role:", state.currentUser.role);
      
      const role = state.currentUser.role;
      const targetPath = role === 'teacher' ? '/teacher-dashboard' : 
                         role === 'admin' ? '/admin' : '/dashboard';
                         
      navigate(targetPath);
    }
  }, [state.isAuthenticated, state.isLoading, state.currentUser, navigate]);

  const {
    isSubmitting,
    hasErrors,
    validateField,
    handleSubmit,
    markTouched
  } = useFormValidation({
    schema: loginSchema,
    onSubmit: async (data) => {
      console.log('Attempting login with email:', data.email);
      
      try {
        const success = await login(data.email, data.password);
        
        if (success) {
          toast({
            title: "✅ Login successful!",
            description: "Loading your profile...",
            duration: 3000,
          });
          // NO NAVIGATION HERE. We let the useEffect handle it once profile loads.
        } else {
          toast({
            title: "❌ Login failed",
            description: "Invalid email or password.",
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = "An unexpected error occurred.";
        if (error.message?.includes('Invalid login')) errorMessage = "Invalid credentials.";
        
        toast({
          title: "❌ Login failed",
          description: errorMessage,
          variant: 'destructive',
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
    Object.keys(formData).forEach(key => markTouched(key as keyof LoginFormData));
    handleSubmit(formData);
  };
  
  if (state.isLoading) {
    return <LoadingScreen message="Checking session..." fullScreen />;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-edu-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Book className="h-8 w-8 text-edu-primary" />
            <span className="text-2xl font-bold">RetainLearn</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        
        <Card className="shadow-lg">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials</CardDescription>
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
                  try { emailSchema.parse(value); return null; }
                  catch (e) { return 'Invalid email'; }
                }}
                required
                disabled={isSubmitting}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <a href="/forgot-password" className="text-xs text-edu-primary hover:underline">Forgot password?</a>
                </div>
                <ValidatedInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onBlur={() => markTouched('password')}
                  showValidation={false}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting || hasErrors}>
                {isSubmitting ? <><LoadingSpinner size="sm" className="mr-2" /> Signing in...</> : 'Sign in'}
              </Button>
              <div className="text-center text-sm">
                Don't have an account? <a href="/signup" className="text-edu-primary font-medium hover:underline">Sign up</a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;