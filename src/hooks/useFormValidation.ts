
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
}

export const useFormValidation = <T extends Record<string, any>>({
  schema,
  onSubmit
}: UseFormValidationProps<T>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any) => {
    try {
      // For object schemas, extract the field schema
      if (schema instanceof z.ZodObject) {
        const fieldSchema = schema.shape[name as keyof typeof schema.shape];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
          return null;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || 'Invalid input';
        setErrors(prev => ({ ...prev, [name]: message }));
        return message;
      }
    }
    return null;
  }, [schema]);

  const validateAll = useCallback((data: T) => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
    }
    return false;
  }, [schema]);

  const handleSubmit = useCallback(async (data: T) => {
    setIsSubmitting(true);
    
    try {
      if (validateAll(data)) {
        await onSubmit(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, onSubmit]);

  const markTouched = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  }, [errors, touched]);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    touched,
    isSubmitting,
    hasErrors,
    validateField,
    validateAll,
    handleSubmit,
    markTouched,
    getFieldError
  };
};
