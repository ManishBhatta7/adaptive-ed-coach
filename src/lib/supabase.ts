
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
