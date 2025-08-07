// Supabase configuration
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Remove quotes if they exist (in case the env var is quoted)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, '');

// Debug: Log the actual values (partially masked for security)
logger.info('[Supabase Config] Loading configuration...', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  envMode: import.meta.env.MODE
});

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase configuration missing', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  });
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Create Supabase client with custom configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'agm-broker-auth',
    flowType: 'implicit' // Changed from 'pkce' to 'implicit' for simpler auth flow
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'AGM Broker'
    }
  }
});

// Debug: Test the connection immediately
(async () => {
  try {
    logger.info('[Supabase Config] Testing connection to Supabase...');
    
    // Try to fetch from a public endpoint
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      logger.error('[Supabase Config] Connection test failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      logger.info('[Supabase Config] Connection test successful');
    }
  } catch (e) {
    logger.error('[Supabase Config] Connection test exception:', e);
  }
})();

// Export auth and storage helpers for convenience
export const supabaseAuth = supabase.auth;
export const supabaseStorage = supabase.storage;
export const supabaseDb = supabase.from;

// Helper function to get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    logger.error('Error getting Supabase session', error);
    return null;
  }
  return session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    logger.error('Error getting Supabase user', error);
    return null;
  }
  return user;
};

logger.info('Supabase client initialized', { url: supabaseUrl });

export default supabase;