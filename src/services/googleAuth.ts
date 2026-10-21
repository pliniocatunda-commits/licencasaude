import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('openid');
provider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthUser {
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  uid?: string;
}

/**
 * Ensures Google Identity Services (GIS) client library is loaded
 */
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      return resolve();
    }
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      if ((window as any).google?.accounts?.oauth2) {
        return resolve();
      }
      existingScript.addEventListener('load', () => resolve());
      // fallback timeout in case script was already loaded
      setTimeout(() => resolve(), 1500);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve(); // don't crash, fallback to Firebase
    document.head.appendChild(script);
  });
};

/**
 * Attempts Google authentication directly via Google Identity Services Token Client
 * (Standard Google OAuth 2.0 popup without Firebase Domain Whitelist restriction)
 */
const signInWithGis = async (): Promise<GoogleAuthUser> => {
  await loadGisScript();
  const google = typeof window !== 'undefined' ? (window as any).google : null;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services não está disponível no navegador.');
  }

  const clientId = firebaseConfig.oAuthClientId;
  if (!clientId) {
    throw new Error('OAuth Client ID não configurado.');
  }

  return new Promise((resolve, reject) => {
    try {
      let isSettled = false;
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        callback: async (tokenResponse: any) => {
          if (isSettled) return;
          if (tokenResponse.error) {
            isSettled = true;
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (!res.ok) {
              throw new Error(`Falha ao obter perfil do Google: HTTP ${res.status}`);
            }
            const info = await res.json();
            isSettled = true;
            resolve({
              email: info.email || null,
              displayName: info.name || null,
              photoURL: info.picture || null,
              uid: info.sub,
            });
          } catch (fetchErr) {
            isSettled = true;
            reject(fetchErr);
          }
        },
        error_callback: (nonOAuthError: any) => {
          if (isSettled) return;
          isSettled = true;
          reject(nonOAuthError);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Initiates real Google Sign-In with popup.
 * Attempts Google Identity Services (GIS) first.
 * If not supported or origin restricted, falls back to Firebase Auth.
 * If unauthorized-domain occurs, wraps the error with domain metadata.
 */
export const signInWithGoogle = async (): Promise<GoogleAuthUser | User> => {
  // Strategy 1: Attempt direct Google Identity Services (GIS)
  try {
    const gisUser = await signInWithGis();
    if (gisUser && gisUser.email) {
      return gisUser;
    }
  } catch (gisErr: any) {
    console.warn('GIS sign-in attempted, proceeding to Firebase Auth...', gisErr?.message || gisErr);
  }

  // Strategy 2: Firebase Auth signInWithPopup
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (firebaseErr: any) {
    console.error('Firebase Auth Sign-In Error:', firebaseErr);
    if (firebaseErr.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
      const enhancedErr: any = new Error(
        `O domínio "${host}" ainda não está na lista de "Domínios autorizados" do Firebase Authentication (auth/unauthorized-domain).`
      );
      enhancedErr.code = 'auth/unauthorized-domain';
      enhancedErr.domain = host;
      enhancedErr.projectId = firebaseConfig.projectId;
      throw enhancedErr;
    }
    throw firebaseErr;
  }
};

/**
 * Signs out from Firebase/Google session
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Erro ao deslogar do Firebase Auth:', err);
  }
};
