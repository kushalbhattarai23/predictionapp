
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { User } from '@/types';
import { adaptSupabaseUser } from '@/utils/type-adapters';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | Error | null;
  signUp: (email: string, password: string) => Promise<{
    user: User | null;
    error: AuthError | Error | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    error: AuthError | Error | null;
  }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Aliases for more intuitive naming
  login: (email: string, password: string) => Promise<{
    user: User | null;
    error: AuthError | Error | null;
  }>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const updateAuthState = (session: Session | null, source: string = 'unknown') => {
      if (!mounted) return;
      
      console.log(`Updating auth state from ${source}:`, {
        hasSession: !!session,
        userEmail: session?.user?.email || 'No session',
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing'
      });
      
      setSession(session);
      setUser(session?.user ? adaptSupabaseUser(session.user) : null);
      setIsLoading(false);
      setError(null);
    };

    // Set up auth state listener first
    console.log('Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event received:', {
          event,
          userEmail: session?.user?.email || 'No session',
          timestamp: new Date().toISOString()
        });
        
        updateAuthState(session, `auth-event-${event}`);
      }
    );

    // Function to get initial session with retry logic
    const getInitialSession = async (attempt = 1) => {
      try {
        console.log(`Getting initial session (attempt ${attempt})...`);
        
        // First try to get the session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          
          // If it's a token refresh error, try to refresh explicitly
          if (sessionError.message?.includes('refresh') && attempt === 1) {
            console.log('Attempting token refresh...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Token refresh failed:', refreshError);
              setError(sessionError);
              setIsLoading(false);
            } else if (refreshData.session) {
              console.log('Token refresh successful');
              updateAuthState(refreshData.session, 'token-refresh');
            } else {
              console.log('No session after refresh');
              updateAuthState(null, 'no-session-after-refresh');
            }
          } else {
            setError(sessionError);
            setIsLoading(false);
          }
        } else {
          console.log('Initial session retrieved:', {
            hasSession: !!initialSession,
            userEmail: initialSession?.user?.email || 'No session',
            expiresAt: initialSession?.expires_at ? new Date(initialSession.expires_at * 1000).toISOString() : 'No expiry'
          });
          updateAuthState(initialSession, 'initial-load');
        }
      } catch (err) {
        if (!mounted) return;
        console.error(`Error in getInitialSession (attempt ${attempt}):`, err);
        
        // Retry once after a short delay
        if (attempt === 1) {
          retryTimeout = setTimeout(() => {
            getInitialSession(2);
          }, 1000);
        } else {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    // Start session retrieval
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const redirectUrl = 'https://trackerhub.netlify.app/';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        setError(error);
        return { user: null, error };
      }

      const adaptedUser = data.user ? adaptSupabaseUser(data.user) : null;
      return { user: adaptedUser, error: null };
    } catch (error) {
      const authError = error as Error;
      setError(authError);
      return { user: null, error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setError(error);
        return { user: null, error };
      }

      console.log('Sign in successful:', data.user?.email);
      const adaptedUser = data.user ? adaptSupabaseUser(data.user) : null;
      return { user: adaptedUser, error: null };
    } catch (error) {
      const authError = error as Error;
      console.error('Sign in exception:', authError);
      setError(authError);
      return { user: null, error: authError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const redirectUrl = 'https://trackerhub.netlify.app/';
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
    } catch (error) {
      const authError = error as Error;
      setError(authError);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        setError(error);
      } else {
        console.log('Logout successful');
        // Redirect to home page after logout
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout exception:', error);
      setError(error as Error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    // Aliases for more intuitive naming
    login: signIn,
    loginWithGoogle: signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
