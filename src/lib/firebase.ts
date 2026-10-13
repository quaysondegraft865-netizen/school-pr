import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/meetings.space.readonly',
];

const provider = new GoogleAuthProvider();
// Request Google Calendar and Google Meet scopes
for (const scope of SCOPES) {
  provider.addScope(scope);
}
// Set custom parameters to ensure prompt selection if needed
provider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token strictly in memory per Google Workspace guidelines
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) {
      console.warn('Google credential did not return an access token directly, user is signed in.');
    }

    cachedAccessToken = token;
    cachedUser = result.user;
    return { user: result.user, accessToken: token || '' };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const emailSignIn = async (
  email: string,
  pass: string
): Promise<{ user: User }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    cachedUser = cred.user;
    return { user: cred.user };
  } catch (err: any) {
    console.error('Email sign-in error:', err);
    throw err;
  }
};

export const emailSignUp = async (
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: User }> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    cachedUser = cred.user;
    return { user: cred.user };
  } catch (err: any) {
    console.error('Email sign-up error:', err);
    throw err;
  }
};

export const guestClientSignIn = async (
  name: string = 'Client User',
  email: string = 'client@napmeet.ai'
): Promise<{ user: any }> => {
  try {
    // If anonymous sign-in is enabled or simulate client session
    const anon = await signInAnonymously(auth);
    if (anon.user) {
      await updateProfile(anon.user, { displayName: name });
      cachedUser = anon.user;
      return { user: anon.user };
    }
  } catch (e) {
    console.warn('Anonymous auth not enabled in Firebase console, falling back to client session:', e);
  }

  // Local client session object
  const mockClientUser = {
    uid: `client-${Date.now()}`,
    displayName: name,
    email,
    photoURL: undefined,
  };
  return { user: mockClientUser };
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setManualAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut exception:', e);
  }
  cachedAccessToken = null;
  cachedUser = null;
};
