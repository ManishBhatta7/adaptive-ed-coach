
import { createClient } from '@supabase/supabase-js';
export { createClient };

// Check if we should use the integration client
const shouldUseIntegrationClient = () => {
  try {
    // If the integration client exists, use it
    const integrationClient = require('@/integrations/supabase/client');
    if (integrationClient.supabase) {
      console.log('Using Supabase integration client');
      return true;
    }
  } catch (error) {
    console.log('Supabase integration client not found, using environment variables');
    return false;
  }
  return false;
};

// Get Supabase credentials with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gwarmogcmeehajnevbmi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YXJtb2djbWVlaGFqbmV2Ym1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyOTc1MjAsImV4cCI6MjA2MDg3MzUyMH0.EiTIeIZMrDjMIufMUEuDr74ydPFHtRAIveTvAkBxTds';

// Initialize the client
let supabaseClient;

if (shouldUseIntegrationClient()) {
  const { supabase: integrationClient } = require('@/integrations/supabase/client');
  supabaseClient = integrationClient;
} else {
  // STRICT CHECK: Fail if keys are missing instead of faking it
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'CRITICAL: Supabase credentials are missing. You must create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage
      }
    });
  }
}

export const supabase = supabaseClient;
