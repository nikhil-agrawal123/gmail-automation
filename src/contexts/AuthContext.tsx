import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// Interface for a connected account
export interface ConnectedAccount {
  email: string;
  displayName: string;
  photoURL: string | null;
  accessToken: string;
  isPrimary: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  // Multi-account support
  connectedAccounts: ConnectedAccount[];
  addAccount: () => Promise<void>;
  removeAccount: (email: string) => void;
  switchPrimaryAccount: (email: string) => void;
  getAllAccessTokens: () => { email: string; token: string }[];
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // Load connected accounts from session storage
  const loadConnectedAccounts = (): ConnectedAccount[] => {
    const stored = sessionStorage.getItem('connected_accounts');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Save connected accounts to session storage
  const saveConnectedAccounts = (accounts: ConnectedAccount[]) => {
    sessionStorage.setItem('connected_accounts', JSON.stringify(accounts));
    setConnectedAccounts(accounts);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      // Try to restore access token and connected accounts from session storage
      if (user) {
        const storedToken = sessionStorage.getItem('gmail_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
        }
        // Load connected accounts
        const accounts = loadConnectedAccounts();
        setConnectedAccounts(accounts);
      } else {
        setAccessToken(null);
        setConnectedAccounts([]);
        sessionStorage.removeItem('gmail_access_token');
        sessionStorage.removeItem('connected_accounts');
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the Google Access Token for Gmail API
      const credential = (await import('firebase/auth')).GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user.email) {
        setAccessToken(token);
        // Store in session storage for persistence during the session
        sessionStorage.setItem('gmail_access_token', token);

        // Add as first connected account if no accounts exist
        const accounts = loadConnectedAccounts();
        if (accounts.length === 0) {
          const newAccount: ConnectedAccount = {
            email: result.user.email,
            displayName: result.user.displayName || result.user.email,
            photoURL: result.user.photoURL,
            accessToken: token,
            isPrimary: true,
          };
          saveConnectedAccounts([newAccount]);
        }
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
      
      // Force account selection by setting custom parameters
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = (await import('firebase/auth')).GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user.email) {
        const accounts = loadConnectedAccounts();
        
        // Check if account already exists
        const existingIndex = accounts.findIndex(acc => acc.email === result.user.email);
        
        if (existingIndex !== -1) {
          // Update existing account's token
          accounts[existingIndex].accessToken = token;
        } else {
          // Add new account
          const newAccount: ConnectedAccount = {
            email: result.user.email,
            displayName: result.user.displayName || result.user.email,
            photoURL: result.user.photoURL,
            accessToken: token,
            isPrimary: accounts.length === 0, // Primary only if first account
          };
          accounts.push(newAccount);
        }
        
        saveConnectedAccounts(accounts);
      }
    } catch (err: any) {
      console.error('Error adding account:', err);
      setError(err.message || 'Failed to add account');
      throw err;
    }
  };

  // Remove an account
  const removeAccount = (email: string) => {
    const accounts = loadConnectedAccounts();
    const filtered = accounts.filter(acc => acc.email !== email);
    
    // If we removed the primary account, make the first remaining one primary
    if (filtered.length > 0 && !filtered.some(acc => acc.isPrimary)) {
      filtered[0].isPrimary = true;
      setAccessToken(filtered[0].accessToken);
      sessionStorage.setItem('gmail_access_token', filtered[0].accessToken);
    }
    
    saveConnectedAccounts(filtered);
  };

  // Switch primary account
  const switchPrimaryAccount = (email: string) => {
    const accounts = loadConnectedAccounts();
    const updated = accounts.map(acc => ({
      ...acc,
      isPrimary: acc.email === email,
    }));
    
    const primaryAccount = updated.find(acc => acc.isPrimary);
    if (primaryAccount) {
      setAccessToken(primaryAccount.accessToken);
      sessionStorage.setItem('gmail_access_token', primaryAccount.accessToken);
    }
    
    saveConnectedAccounts(updated);
  };

  // Get all access tokens for fetching from all accounts
  const getAllAccessTokens = (): { email: string; token: string }[] => {
    return connectedAccounts.map(acc => ({
      email: acc.email,
      token: acc.accessToken,
    }));
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setAccessToken(null);
      setConnectedAccounts([]);
      sessionStorage.removeItem('gmail_access_token');
      sessionStorage.removeItem('connected_accounts');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    signInWithGoogle,
    signOut,
    error,
    connectedAccounts,
    addAccount,
    removeAccount,
    switchPrimaryAccount,
    getAllAccessTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};;
