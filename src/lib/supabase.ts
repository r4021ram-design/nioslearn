import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Supabase environment variables are missing. AI caching will fall back to local/ephemeral storage.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
