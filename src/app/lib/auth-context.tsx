import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'client';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'operator' | 'client', accessCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const createUserFromSession = useCallback((session: Session): User => {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      role: session.user.user_metadata?.role || 'operator',
    };
  }, []);

  const fetchUserProfile = useCallback(async (accessToken: string, authUser: any) => {
    const sessionUser = createUserFromSession({ user: authUser, access_token: accessToken } as Session);
    setUser(sessionUser);
    return true;
  }, [createUserFromSession]);

  // Initialize auth ONCE
  useEffect(() => {
    if (initialized) return;

    let mounted = true;

    console.log('[AUTH_CONTEXT] Initializing authentication...');

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[AUTH] Session error:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      console.log('[AUTH_CONTEXT] Session found:', !!session);

      setSession(session);
      
      if (session?.access_token) {
        fetchUserProfile(session.access_token, session.user).finally(() => {
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
        });
      } else {
        console.log('[AUTH_CONTEXT] No active session found');
        setLoading(false);
        setInitialized(true);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AUTH_CONTEXT] Auth state changed:', _event, !!session);
      
      setSession(session);
      
      if (session?.access_token) {
        fetchUserProfile(session.access_token, session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized, fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.session?.access_token) {
      throw new Error('No access token received');
    }

    setSession(data.session);
    await fetchUserProfile(data.session.access_token, data.user);
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, password: string, name: string, role?: 'operator' | 'client', accessCode?: string) => {
    const response = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`, // REQUIRED for all Supabase Edge Function calls
      },
      body: JSON.stringify({ email, password, name, role: role || 'operator', accessCode }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Signup failed');
    }

    await signIn(email, password);
  }, [signIn]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await fetchUserProfile(session.access_token, session.user);
    }
  }, [fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }), [user, session, loading, signIn, signUp, signOut, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}