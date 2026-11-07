/**
 * LAKNES Firebase Google Authentication Integration
 * Provides standard Google Sign-In with popup timeout protection,
 * Google Identity Services support, and robust fallback handling.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import firebaseConfigFile from '../../firebase-applet-config.json';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;

export function getFirebaseInstance(): { app: FirebaseApp; auth: Auth } {
  if (!firebaseApp) {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfigFile);
    }
    firebaseAuthInstance = getAuth(firebaseApp);
  }
  return { app: firebaseApp, auth: firebaseAuthInstance! };
}

export interface GoogleAuthResult {
  email: string;
  name?: string;
  picture?: string;
  idToken?: string;
  firebaseUser?: FirebaseUser;
}

/**
 * Initiates Google Sign-In popup with strict timeout protection.
 * If popups are blocked by browser iframe sandboxes or unauthorized domains,
 * it rejects with a descriptive error code instead of hanging.
 */
export async function triggerGoogleSignIn(timeoutMs = 7000): Promise<GoogleAuthResult> {
  const { auth } = getFirebaseInstance();
  const provider = new GoogleAuthProvider();

  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  // Create a timeout race so the UI NEVER hangs indefinitely
  const popupPromise = signInWithPopup(auth, provider);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject({
        code: 'auth/timeout-or-blocked',
        message: 'Google Sign-In popup timed out or was blocked by the browser. Please use the direct Google Account sign-in below.',
      });
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([popupPromise, timeoutPromise]);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Elysian Member',
      picture: user.photoURL || undefined,
      idToken,
      firebaseUser: user,
    };
  } catch (err: any) {
    // Standardize error codes for iframe and sandbox environments
    if (err?.code === 'auth/unauthorized-domain') {
      throw {
        code: 'auth/unauthorized-domain',
        message: 'This domain is restricted from opening external popups in the current iframe. Please sign in with your Google email directly.',
      };
    }
    if (err?.code === 'auth/popup-blocked') {
      throw {
        code: 'auth/popup-blocked',
        message: 'Popup window was blocked by your browser settings. Please allow popups or use direct Google email sign-in.',
      };
    }
    throw err;
  }
}
