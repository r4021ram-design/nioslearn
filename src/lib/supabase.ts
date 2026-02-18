import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Acceptance for both standard service role or the user's specific publishable key name
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Supabase environment variables are missing. AI caching will fall back to local/ephemeral storage.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey);
