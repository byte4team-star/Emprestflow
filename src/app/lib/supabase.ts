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
  // First attempt
  try {
    return await makeApiCall(endpoint, options);
  } catch (error: any) {
    // Check if it's a JWT error
    if (error.message?.includes('JWT') || 
        error.message?.includes('exp claim') || 
        error.message?.includes('InvalidJWT') ||
        error.status === 401) {
      
      console.log('[API_CALL] JWT expired or invalid, attempting to refresh session...');
      
      // Try to refresh the session
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !data.session) {
        console.error('[API_CALL] Session refresh failed:', refreshError);
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session_expired';
        }
        
        throw new Error('Sessão expirada. Redirecionando para login...');
      }
      
      console.log('[API_CALL] Session refreshed successfully, retrying request...');
      
      // Retry the request with the new token
      return await makeApiCall(endpoint, options);
    }
    
    // If it's not a JWT error, rethrow
    throw error;
  }
}

// Internal function to make the actual API call
async function makeApiCall(endpoint: string, options: RequestInit = {}) {
  console.log('[API_CALL] Getting session...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[API_CALL] ❌ Session error:', sessionError);
    throw new Error(`Erro ao obter sessão: ${sessionError.message}`);
  }
  
  const session = sessionData.session;
  const token = session?.access_token;

  console.log('[API_CALL] Session exists:', !!session);
  console.log('[API_CALL] Token exists:', !!token);
  console.log('[API_CALL] Token length:', token?.length || 0);
  
  if (token) {
    console.log('[API_CALL] Token first 30 chars:', token.substring(0, 30) + '...');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`, // REQUIRED for all Supabase Edge Function calls
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Only set Content-Type if not FormData (FormData sets its own with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['X-User-Token'] = token;
    console.log('[API_CALL] ✅ X-User-Token header set');
  } else {
    console.error('[API_CALL] ❌ No auth token available for:', endpoint);
    console.error('[API_CALL] Session state:', {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      user: session?.user ? { id: session.user.id, email: session.user.email } : null
    });
    
    // Try to refresh session before giving up
    console.log('[API_CALL] Attempting to refresh session...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      console.error('[API_CALL] ❌ Session refresh failed:', refreshError);
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired';
      }
      
      throw new Error('Sessão expirada. Redirecionando para login...');
    }
    
    // Use refreshed token
    const refreshedToken = refreshData.session.access_token;
    if (refreshedToken) {
      headers['X-User-Token'] = refreshedToken;
      console.log('[API_CALL] ✅ Session refreshed, using new token');
    } else {
      console.error('[API_CALL] ❌ No token after refresh');
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired';
      }
      
      throw new Error('Sessão expirada. Redirecionando para login...');
    }
  }

  const url = `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02${endpoint}`;

  console.log('[API_CALL] Making request to:', endpoint);
  console.log('[API_CALL] Full URL:', url);
  console.log('[API_CALL] Method:', options.method || 'GET');
  console.log('[API_CALL] Body type:', options.body instanceof FormData ? 'FormData' : typeof options.body);
  console.log('[API_CALL] Headers:', {
    'Authorization': headers['Authorization']?.substring(0, 50) + '...',
    'X-User-Token': headers['X-User-Token'] ? headers['X-User-Token'].substring(0, 50) + '...' : 'none',
    'Content-Type': headers['Content-Type']
  });

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchError: any) {
    console.error('[API_CALL] ❌ Fetch failed:', fetchError);
    console.error('[API_CALL] URL was:', url);
    console.error('[API_CALL] This usually means:');
    console.error('[API_CALL] 1. Edge Function não foi deployada');
    console.error('[API_CALL] 2. CORS bloqueado');
    console.error('[API_CALL] 3. Problema de rede');
    throw new Error(`Falha na conexão: ${fetchError.message}. Verifique se a Edge Function foi deployada.`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error(`[API_CALL] Error ${response.status} on ${endpoint}:`, error);
    
    // Create error object with status
    const err: any = new Error(error.error || error.message || `HTTP ${response.status}`);
    err.status = response.status;
    
    throw err;
  }

  const data = await response.json();
  return data;
}