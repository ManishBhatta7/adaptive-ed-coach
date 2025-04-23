
import { createClient } from '@supabase/supabase-js';

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
  // Use the integration client
  const { supabase: integrationClient } = require('@/integrations/supabase/client');
  supabaseClient = integrationClient;
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials are missing. Please check your environment variables.');
    supabaseClient = createMockClient();
  } else {
    // Create a proper client with the credentials
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
