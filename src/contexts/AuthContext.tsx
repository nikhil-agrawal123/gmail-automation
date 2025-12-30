import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  storeAccessToken,
  getConnectedAccounts,
  removeAccountFromBackend,
  getAccessToken,
  forceRefreshToken,
  clearTokenCache,
} from '@/lib/gmailTokens';

// What's exposed to the app (no sensitive tokens)
export interface ConnectedAccount {
  email: string;
  displayName: string;
  photoURL: string | null;
  isPrimary: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  // Multi-account support
  connectedAccounts: ConnectedAccount[];
  addAccount: () => Promise<void>;
  removeAccount: (email: string) => Promise<void>;
  switchPrimaryAccount: (email: string) => Promise<void>;
  // Token management - get valid access token for any connected account
  getAccessToken: (email: string) => Promise<string>;
  forceRefreshAccessToken: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // Load connected accounts from backend
  const loadConnectedAccounts = useCallback(async () => {
    try {
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setConnectedAccounts([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        await loadConnectedAccounts();
      } else {
        setConnectedAccounts([]);
        clearTokenCache();
      }
    });

    return () => unsubscribe();
  }, [loadConnectedAccounts]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the OAuth credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      if (accessToken && result.user.email) {
        // Store the access token with expiration (tokens last ~1 hour)
        const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes to be safe
        
        await storeAccessToken({
          email: result.user.email,
          displayName: result.user.displayName || result.user.email,
          photoURL: result.user.photoURL,
          accessToken,
          expiresAt,
          isPrimary: true,
        });
        
        await loadConnectedAccounts();
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add another account without signing out
  const addAccount = async () => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('Must be signed in to add accounts');
      }
      
      // Force account selection and consent
      googleProvider.setCustomParameters({
        access_type: 'offline',
        prompt: 'consent select_account',
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      if (accessToken && result.user.email) {
        const expiresAt = Date.now() + 55 * 60 * 1000;
        
        await storeAccessToken({
          email: result.user.email,
          displayName: result.user.displayName || result.user.email,
          photoURL: result.user.photoURL,
          accessToken,
          expiresAt,
          isPrimary: false,
        });
        
        await loadConnectedAccounts();
      }
    } catch (err: any) {
      console.error('Error adding account:', err);
      setError(err.message || 'Failed to add account');
      throw err;
    }
  };

  // Remove an account
  const removeAccount = async (email: string) => {
    try {
      await removeAccountFromBackend(email);
      await loadConnectedAccounts();
    } catch (err: any) {
      console.error('Error removing account:', err);
      setError(err.message || 'Failed to remove account');
    }
  };

  // Switch primary account (client-side only for now)
  const switchPrimaryAccount = async (email: string) => {
    setConnectedAccounts(prev => 
      prev.map(acc => ({
        ...acc,
        isPrimary: acc.email === email,
      }))
    );
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setConnectedAccounts([]);
      clearTokenCache();
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    error,
    connectedAccounts,
    addAccount,
    removeAccount,
    switchPrimaryAccount,
    getAccessToken,
    forceRefreshAccessToken: forceRefreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
