
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const titleSchema = z.string()
  .min(1, 'Title is required')
  .min(3, 'Title must be at least 3 characters')
  .max(100, 'Title must be less than 100 characters')
  .trim();

export const contentSchema = z.string()
  .min(1, 'Content is required')
  .min(10, 'Content must be at least 10 characters')
  .max(5000, 'Content must be less than 5000 characters')
  .trim();

// File validation
export const validateFile = (file: File | null, options?: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png'], required = false } = options || {};
  
  if (!file) {
    return required ? 'File is required' : null;
  }
  
  if (file.size > maxSize) {
    return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
  }
  
  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizeHtml = (input: string): string => {
  // Basic HTML sanitization - remove potentially dangerous tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
};

// Real-time validation debounce utility
export const createDebouncedValidator = <T>(
  validator: (value: T) => string | null,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T, callback: (error: string | null) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const error = validator(value);
      callback(error);
    }, delay);
  };
};
