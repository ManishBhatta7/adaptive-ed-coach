
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createDebouncedValidator } from '@/utils/validation';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  validator?: (value: string) => string | null;
  showValidation?: boolean;
  validateOnChange?: boolean;
  validationDelay?: number;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    validator, 
    showValidation = true,
    validateOnChange = true,
    validationDelay = 300,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isTouched, setIsTouched] = useState(false);

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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange?.(e);
      handleValidation(value);
    }, [onChange, handleValidation]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
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
          <Input
            type={type}
            className={cn(
              className,
              showError && "border-red-500 focus-visible:ring-red-500",
              showSuccess && "border-green-500 focus-visible:ring-green-500"
            )}
            ref={ref}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
          {showValidation && isTouched && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {isValid && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>
        {showError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";
