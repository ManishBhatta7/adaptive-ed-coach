import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 1. Define Hardcoded Fallbacks (from your uploaded file)
const HARDCODED_URL = "https://gwarmogcmeehajnevbmi.supabase.co";
const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YXJtb2djbWVlaGFqbmV2Ym1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyOTc1MjAsImV4cCI6MjA2MDg3MzUyMH0.EiTIeIZMrDjMIufMUEuDr74ydPFHtRAIveTvAkBxTds";

// 2. Select the best available credentials
// Priority: Environment Variable > Hardcoded Value > Empty String
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// 3. Validation to prevent "supabaseUrl is required" crash
if (!SUPABASE_URL) {
  console.error('🚨 CRITICAL ERROR: Supabase URL is missing. Check your .env file or client.ts configuration.');
}

// 4. Initialize and Export
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);