
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Book, CheckCircle, Mail } from 'lucide-react';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { ValidatedInput } from '@/components/ui/validated-input';
import { emailSchema, passwordSchema, nameSchema } from '@/utils/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['student', 'teacher'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAppContext();
  const { toast } = useToast();
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const {
    errors,
    isSubmitting,
    hasErrors,
    validateField,
    handleSubmit,
    markTouched,
    getFieldError
  } = useFormValidation({
    schema: signupSchema,
    onSubmit: async (data) => {
      console.log(`Attempting to register with role: ${data.role}`);
      
      try {
        const success = await register(data.name, data.email, data.password, data.role);

        if (success) {
          // Success toast with better styling
          toast({
            title: "🎉 Account created successfully!",
            description: `Welcome to AdaptiveEdCoach, ${data.name}! You're now signed in.`,
            duration: 4000,
          });

          // Show email confirmation message if needed
          setShowEmailConfirm(true);
          
          // Delay navigation to show success feedback
          setTimeout(() => {
            navigate('/onboarding');
          }, 2000);
        } else {
          toast({
            title: "❌ Registration failed",
            description: "Could not create your account. Please try again.",
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Handle different error types with specific messages
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        if (error.message?.includes('already registered')) {
          errorMessage = "An account with this email already exists. Try signing in instead.";
        } else if (error.message?.includes('Password should be')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message?.includes('invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message?.includes('weak password')) {
          errorMessage = "Password is too weak. Please choose a stronger password.";
        }
        
        toast({
          title: "❌ Registration failed",
          description: errorMessage,
          variant: 'destructive',
          duration: 5000,
        });
      }
    }
  });

  const handleInputChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleRoleChange = (role: 'student' | 'teacher') => {
    setFormData(prev => ({ ...prev, role }));
    validateField('role', role);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.keys(formData).forEach(key => markTouched(key));
    handleSubmit(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-edu-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Book className="h-8 w-8 text-edu-primary" />
            <span className="text-2xl font-bold">AdaptiveEdCoach</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Get started today</h1>
          <p className="text-gray-600 mt-2">Create your account and begin your learning journey</p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                Enter your details to register
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ValidatedInput
                id="name"
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange('name')}
                onBlur={() => markTouched('name')}
                validator={(value) => {
                  try {
                    nameSchema.parse(value);
                    return null;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.errors[0]?.message || 'Invalid name';
                    }
                    return 'Invalid name';
                  }
                }}
                required
                disabled={isSubmitting}
              />

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

              <ValidatedInput
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange('password')}
                onBlur={() => markTouched('password')}
                validator={(value) => {
                  try {
                    passwordSchema.parse(value);
                    return null;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.errors[0]?.message || 'Invalid password';
                    }
                    return 'Invalid password';
                  }
                }}
                required
                disabled={isSubmitting}
              />

              <ValidatedInput
                id="confirm-password"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                onBlur={() => markTouched('confirmPassword')}
                validator={(value) => {
                  if (!value) return 'Please confirm your password';
                  if (value !== formData.password) return "Passwords don't match";
                  return null;
                }}
                required
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Register as</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={formData.role === 'student'}
                      onChange={() => handleRoleChange('student')}
                      className="mr-2 accent-edu-primary"
                      disabled={isSubmitting}
                    />
                    Student
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="teacher"
                      checked={formData.role === 'teacher'}
                      onChange={() => handleRoleChange('teacher')}
                      className="mr-2 accent-edu-primary"
                      disabled={isSubmitting}
                    />
                    Teacher
                  </label>
                </div>
              </div>

              {showEmailConfirm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Check your email</p>
                    <p className="text-sm text-blue-700">
                      We've sent a confirmation link to {formData.email}. Please check your inbox and click the link to activate your account.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-105" 
                disabled={isSubmitting || hasErrors}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{' '}
                <a href="/login" className="text-edu-primary hover:underline font-medium">
                  Sign in
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
