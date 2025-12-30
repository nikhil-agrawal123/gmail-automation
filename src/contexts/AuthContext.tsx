import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
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
  removeAccount: (email: string) => Promise<void>;
  switchPrimaryAccount: (email: string) => Promise<void>;
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
  const [primaryUid, setPrimaryUid] = useState<string | null>(() => {
    return sessionStorage.getItem('primary_uid');
  });

  // Load connected accounts from Firestore
  const loadConnectedAccountsFromFirestore = async (uid: string): Promise<ConnectedAccount[]> => {
    try {
      const docRef = doc(db, 'UserAccounts', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.accounts || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading accounts from Firestore:', error);
      return [];
    }
  };

  // Save connected accounts to Firestore
  const saveConnectedAccountsToFirestore = async (uid: string, accounts: ConnectedAccount[]) => {
    try {
      const docRef = doc(db, 'UserAccounts', uid);
      await setDoc(docRef, { accounts }, { merge: true });
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error saving accounts to Firestore:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      // Try to restore access token and connected accounts from Firestore
      if (user) {
        // Use stored primary UID or current user's UID
        const storedPrimaryUid = sessionStorage.getItem('primary_uid');
        const uidToUse = storedPrimaryUid || user.uid;
        
        // If no primary UID stored, this is the first login - save it
        if (!storedPrimaryUid) {
          sessionStorage.setItem('primary_uid', user.uid);
          setPrimaryUid(user.uid);
        }
        
        const storedToken = sessionStorage.getItem('gmail_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
        }
        // Load connected accounts from Firestore using primary UID
        const accounts = await loadConnectedAccountsFromFirestore(uidToUse);
        setConnectedAccounts(accounts);
        
        // If we have accounts but no session token, set the primary account's token
        if (accounts.length > 0 && !storedToken) {
          const primaryAccount = accounts.find(acc => acc.isPrimary) || accounts[0];
          setAccessToken(primaryAccount.accessToken);
          sessionStorage.setItem('gmail_access_token', primaryAccount.accessToken);
        }
      } else {
        setAccessToken(null);
        setConnectedAccounts([]);
        sessionStorage.removeItem('gmail_access_token');
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
        
        // Set this as the primary UID for all future operations
        sessionStorage.setItem('primary_uid', result.user.uid);
        setPrimaryUid(result.user.uid);

        // Load existing accounts from Firestore
        const accounts = await loadConnectedAccountsFromFirestore(result.user.uid);
        
        // Check if this account already exists
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
            accessToken:  token,
            isPrimary: accounts.length === 0,
          };
          accounts.push(newAccount);
        }
        
        // Save to Firestore
        await saveConnectedAccountsToFirestore(result.user.uid, accounts);
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
      
      // Get the primary UID before signing in with another account
      const storedPrimaryUid = sessionStorage.getItem('primary_uid');
      if (!storedPrimaryUid) {
        throw new Error('Must be signed in to add accounts');
      }
      
      // IMPORTANT: Save current accounts from state BEFORE signInWithPopup changes the auth user
      // Because after popup, the new user won't have permission to read the primary user's Firestore doc
      const currentAccounts = [...connectedAccounts];
      
      // Force account selection by setting custom parameters
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = (await import('firebase/auth')).GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user.email) {
        // Use the accounts we saved BEFORE the popup (from state), not from Firestore
        const accounts = [...currentAccounts];
        
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
            isPrimary: false, // Never primary since we're adding to existing account
          };
          accounts.push(newAccount);
        }
        
        // Update local state immediately
        setConnectedAccounts(accounts);
        
        try {
          await saveConnectedAccountsToFirestore(storedPrimaryUid, accounts);
        } catch (firestoreError) {
          console.warn('Could not save to Firestore (permission issue), saving locally', firestoreError);
          // If Firestore fails due to permissions, at least the state is updated
        }
      }
    } catch (err: any) {
      console.error('Error adding account:', err);
      setError(err.message || 'Failed to add account');
      throw err;
    }
  };

  // Remove an account
  const removeAccount = async (email: string) => {
    const storedPrimaryUid = sessionStorage.getItem('primary_uid');
    if (!storedPrimaryUid) return;
    
    const accounts = await loadConnectedAccountsFromFirestore(storedPrimaryUid);
    const filtered = accounts.filter(acc => acc.email !== email);
    
    // If we removed the primary account, make the first remaining one primary
    if (filtered.length > 0 && !filtered.some(acc => acc.isPrimary)) {
      filtered[0].isPrimary = true;
      setAccessToken(filtered[0].accessToken);
      sessionStorage.setItem('gmail_access_token', filtered[0].accessToken);
    }
    
    // Save to Firestore using primary UID
    await saveConnectedAccountsToFirestore(storedPrimaryUid, filtered);
  };

  // Switch primary account
  const switchPrimaryAccount = async (email: string) => {
    const storedPrimaryUid = sessionStorage.getItem('primary_uid');
    if (!storedPrimaryUid) return;
    
    const accounts = await loadConnectedAccountsFromFirestore(storedPrimaryUid);
    const updated = accounts.map(acc => ({
      ...acc,
      isPrimary: acc.email === email,
    }));
    
    const primaryAccount = updated.find(acc => acc.isPrimary);
    if (primaryAccount) {
      setAccessToken(primaryAccount.accessToken);
      sessionStorage.setItem('gmail_access_token', primaryAccount.accessToken);
    }
    
    // Save to Firestore using primary UID
    await saveConnectedAccountsToFirestore(storedPrimaryUid, updated);
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
      setPrimaryUid(null);
      sessionStorage.removeItem('gmail_access_token');
      sessionStorage.removeItem('primary_uid');
      // Note: We don't delete Firestore data on signout so accounts persist across sessions
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
