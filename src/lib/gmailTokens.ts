/**
 * Client-side Gmail token management
 * Stores access tokens in Firestore and handles re-authentication when expired
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, OAuthCredential } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

// In-memory cache for access tokens
const tokenCache: Map<string, { accessToken: string; expiresAt: number }> = new Map();

export interface ConnectedAccountInfo {
  email: string;
  displayName: string;
  photoURL: string | null;
  accessToken: string;
  expiresAt: number;
  isPrimary: boolean;
}

interface StoreTokenParams {
  email: string;
  displayName: string;
  photoURL: string | null;
  accessToken: string;
  expiresAt: number;
  isPrimary?: boolean;
}

/**
 * Store an access token for a Gmail account in Firestore
 */
export async function storeAccessToken(params: StoreTokenParams): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, 'UserAccounts', user.uid);
  const docSnap = await getDoc(docRef);
  
  let accounts: ConnectedAccountInfo[] = [];
  if (docSnap.exists()) {
    accounts = docSnap.data()?.accounts || [];
  }

  const existingIndex = accounts.findIndex(acc => acc.email === params.email);
  
  const accountData: ConnectedAccountInfo = {
    email: params.email,
    displayName: params.displayName || params.email,
    photoURL: params.photoURL || null,
    accessToken: params.accessToken,
    expiresAt: params.expiresAt,
    isPrimary: params.isPrimary ?? accounts.length === 0,
  };

  if (existingIndex !== -1) {
    accounts[existingIndex] = accountData;
  } else {
    accounts.push(accountData);
  }

  await setDoc(docRef, { accounts }, { merge: true });
  
  // Update cache
  tokenCache.set(params.email, {
    accessToken: params.accessToken,
    expiresAt: params.expiresAt,
  });
}

/**
 * Re-authenticate a specific Google account to get a fresh token
 */
export async function reauthenticateAccount(email: string): Promise<string> {
  // Create a provider that hints at the specific account
  const provider = new GoogleAuthProvider();
  provider.addScope('https://mail.google.com/');
  provider.setCustomParameters({
    login_hint: email,
    prompt: 'consent', // Force consent to get fresh token
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result) as OAuthCredential;
    
    if (!credential?.accessToken) {
      throw new Error('No access token received');
    }

    const user = result.user;
    const tokenEmail = user.email || email;
    
    // Store the new token (expires in ~1 hour)
    const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes to be safe
    
    await storeAccessToken({
      email: tokenEmail,
      displayName: user.displayName || tokenEmail,
      photoURL: user.photoURL,
      accessToken: credential.accessToken,
      expiresAt,
    });

    return credential.accessToken;
  } catch (error) {
    console.error('Re-authentication failed:', error);
    throw new Error(`Failed to re-authenticate ${email}. Please try again.`);
  }
}

/**
 * Get a valid access token for an account
 * Returns cached token if valid, otherwise fetches from Firestore
 * If expired, triggers re-authentication
 */
export async function getAccessToken(email: string, forceRefresh = false): Promise<string> {
  const now = Date.now();
  const bufferMs = 2 * 60 * 1000; // 2 minute buffer before expiry

  // Check memory cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = tokenCache.get(email);
    if (cached && now + bufferMs < cached.expiresAt) {
      return cached.accessToken;
    }
  }

  // Check Firestore
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, 'UserAccounts', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('No accounts found. Please add a Gmail account.');
  }

  const accounts: ConnectedAccountInfo[] = docSnap.data()?.accounts || [];
  const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());

  if (!account) {
    throw new Error(`Account ${email} not found.`);
  }

  // Check if token is still valid
  if (!forceRefresh && account.expiresAt && now + bufferMs < account.expiresAt) {
    // Update cache
    tokenCache.set(email, {
      accessToken: account.accessToken,
      expiresAt: account.expiresAt,
    });
    return account.accessToken;
  }

  // Token expired or force refresh - need to re-authenticate
  console.log(`Token expired for ${email}, re-authenticating...`);
  return reauthenticateAccount(email);
}

/**
 * Force refresh a token (use after 401 error)
 */
export async function forceRefreshToken(email: string): Promise<string> {
  tokenCache.delete(email);
  return getAccessToken(email, true);
}

/**
 * Get all connected accounts from Firestore (without exposing tokens in return)
 */
export async function getConnectedAccounts(): Promise<Omit<ConnectedAccountInfo, 'accessToken' | 'expiresAt'>[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const docRef = doc(db, 'UserAccounts', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return [];
  }

  const accounts: ConnectedAccountInfo[] = docSnap.data()?.accounts || [];
  
  // Return accounts without sensitive tokens
  return accounts.map(acc => ({
    email: acc.email,
    displayName: acc.displayName,
    photoURL: acc.photoURL,
    isPrimary: acc.isPrimary,
  }));
}

/**
 * Remove a connected account from Firestore
 */
export async function removeAccountFromBackend(email: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, 'UserAccounts', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return;

  let accounts: ConnectedAccountInfo[] = docSnap.data()?.accounts || [];
  accounts = accounts.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());

  // If we removed the primary, make the first one primary
  if (accounts.length > 0 && !accounts.some(acc => acc.isPrimary)) {
    accounts[0].isPrimary = true;
  }

  await setDoc(docRef, { accounts }, { merge: true });
  tokenCache.delete(email);
}

/**
 * Clear all cached tokens (use on sign out)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
