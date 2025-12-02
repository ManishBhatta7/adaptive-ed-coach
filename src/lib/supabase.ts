// Re-export the single source of truth from your integrations folder
// This prevents "supabaseUrl is required" errors by ensuring we don't try to init twice
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Optional: Helper for components that might import createClient directly from here
export { createClient } from '@supabase/supabase-js';