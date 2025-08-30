
import React, { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createDebouncedValidator } from '@/utils/validation';

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  validator?: (value: string) => string | null;
  showValidation?: boolean;
  validateOnChange?: boolean;
  validationDelay?: number;
  showCharCount?: boolean;
  maxLength?: number;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    className, 
    label, 
    validator, 
    showValidation = true,
    validateOnChange = true,
    validationDelay = 300,
    showCharCount = false,
    maxLength,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isTouched, setIsTouched] = useState(false);
    const [charCount, setCharCount] = useState(0);

    const debouncedValidator = useCallback(
      createDebouncedValidator((value: string) => {
        if (!validator) return null;
        return validator(value);
      }, validationDelay),
      [validator, validationDelay]
    );

    const handleValidation = useCallback((value: string) => {
      if (!validator || !isTouched) return;

      if (validateOnChange) {
        debouncedValidator(value, (validationError) => {
          setError(validationError);
          setIsValid(validationError === null && value.length > 0);
        });
      } else {
        const validationError = validator(value);
        setError(validationError);
        setIsValid(validationError === null && value.length > 0);
      }
    }, [validator, validateOnChange, debouncedValidator, isTouched]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharCount(value.length);
      onChange?.(e);
      handleValidation(value);
    }, [onChange, handleValidation]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsTouched(true);
      const value = e.target.value;
      onBlur?.(e);
      
      if (!validateOnChange && validator) {
        const validationError = validator(value);
        setError(validationError);
        setIsValid(validationError === null && value.length > 0);
      }
    }, [onBlur, validator, validateOnChange]);

    const showError = showValidation && isTouched && error;
    const showSuccess = showValidation && isTouched && isValid;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <div className="relative">
          <Textarea
            className={cn(
              className,
              showError && "border-red-500 focus-visible:ring-red-500",
              showSuccess && "border-green-500 focus-visible:ring-green-500"
            )}
            ref={ref}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={maxLength}
            {...props}
          />
          {showValidation && isTouched && (
            <div className="absolute top-3 right-3">
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {isValid && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            {showError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p className={cn(
              "text-xs",
              charCount > maxLength * 0.9 ? "text-red-500" : "text-gray-500"
            )}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";
