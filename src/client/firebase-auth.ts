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
 * Initiates Google Sign-In popup with Google Identity Services fallback.
 * Allows full time for user account selection without premature timeout cancellations.
 */
export async function triggerGoogleSignIn(): Promise<GoogleAuthResult> {
  const { auth } = getFirebaseInstance();
  const provider = new GoogleAuthProvider();

  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Laknes Contributor',
      picture: user.photoURL || undefined,
      idToken,
      firebaseUser: user,
    };
  } catch (err: any) {
    // If Firebase throws auth/unauthorized-domain, attempt Google Identity Services OAuth popup
    const clientId = firebaseConfigFile.oAuthClientId;
    const google = typeof window !== 'undefined' ? (window as any).google : null;

    if (
      (err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/popup-blocked') &&
      clientId &&
      google?.accounts?.oauth2
    ) {
      try {
        return await new Promise<GoogleAuthResult>((resolve, reject) => {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            prompt: 'select_account',
            callback: async (resp: any) => {
              if (resp.error) {
                return reject(resp);
              }
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${resp.access_token}` },
                });
                const profile = await res.json();
                resolve({
                  email: profile.email || '',
                  name: profile.name || profile.given_name || profile.email?.split('@')[0],
                  picture: profile.picture,
                  idToken: resp.access_token,
                });
              } catch (fetchErr) {
                reject(fetchErr);
              }
            },
            error_callback: (clientErr: any) => {
              reject(clientErr);
            },
          });
          tokenClient.requestAccessToken();
        });
      } catch (gisErr: any) {
        console.warn('Google Identity Services popup fallback error:', gisErr);
      }
    }

    if (err?.code === 'auth/popup-blocked') {
      throw {
        code: 'auth/popup-blocked',
        message: 'Your browser blocked the Google popup window. Please allow popups for this site, or enter your Google email below.',
      };
    }

    if (err?.code === 'auth/popup-closed-by-user' || err?.type === 'popup_closed') {
      throw {
        code: 'auth/popup-closed-by-user',
        message: 'Google Sign-In window was closed before completion. Please click to try again, or enter your Google email below.',
      };
    }

    throw err;
  }
}
