import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Singleton Supabase client to avoid multiple instances
// Store in window to persist across hot reloads in development
declare global {
  interface Window {
    __supabaseClient?: ReturnType<typeof createClient>;
  }
}

export function getSupabaseClient() {
  // Check if instance already exists in window (for hot reload persistence)
  if (typeof window !== 'undefined' && window.__supabaseClient) {
    return window.__supabaseClient;
  }

  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    }
  );

  // Store in window for hot reload persistence
  if (typeof window !== 'undefined') {
    window.__supabaseClient = client;
  }

  return client;
}

// Export the singleton instance
export const supabase = getSupabaseClient();

// Helper function for authenticated API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`, // REQUIRED for all Supabase Edge Function calls
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['X-User-Token'] = token;
  } else {
    console.error('[API_CALL] ❌ No auth token available for:', endpoint);
    console.error('[API_CALL] Session state:', session.data);
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired';
    }
    
    throw new Error('Sessão expirada. Redirecionando para login...');
  }

  const url = `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02${endpoint}`;

  console.log('[API_CALL] Making request to:', endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error(`[API_CALL] Error ${response.status} on ${endpoint}:`, error);
    
    // If 401 Unauthorized, redirect to login
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired';
      }
      throw new Error('Sessão expirada. Redirecionando para login...');
    }
    
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}