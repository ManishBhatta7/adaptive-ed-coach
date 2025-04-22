
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

// Initialize a mock client if credentials are missing (for development/testing)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Create a mock Supabase client for development/testing
function createMockClient() {
  console.warn('Using mock Supabase client. Authentication and database operations will not work.');
  
  // Return a mock client with the same interface
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: new Error('Mock auth client') }),
      signUp: () => Promise.resolve({ data: {}, error: new Error('Mock auth client') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        insert: () => Promise.resolve({ error: new Error('Mock database client') })
      })
    })
  } as any;
}
