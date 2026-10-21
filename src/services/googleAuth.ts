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
  login_hint: 'pliniocatunda@gmail.com'
});

export interface GoogleAuthUser {
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  uid?: string;
}

/**
 * Initiates Google Sign-In with Firebase popup.
 * If unauthorized-domain or origin_mismatch occurs, wraps the error with domain metadata.
 */
export const signInWithGoogle = async (): Promise<User | GoogleAuthUser> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (firebaseErr: any) {
    const isUserClosure = 
      firebaseErr?.code === 'auth/popup-closed-by-user' || 
      firebaseErr?.code === 'auth/cancelled-popup-request';

    if (isUserClosure) {
      console.info('Google popup window was closed or cancelled by user.');
    } else {
      console.warn('Google Sign-In notice:', firebaseErr?.message || firebaseErr);
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (firebaseErr?.code === 'auth/unauthorized-domain' || (firebaseErr?.message && firebaseErr.message.includes('auth/unauthorized-domain'))) {
      const enhancedErr: any = new Error(
        `O domínio "${host}" não está na lista de domínios autorizados do Firebase Authentication.`
      );
      enhancedErr.code = 'auth/unauthorized-domain';
      enhancedErr.domain = host;
      enhancedErr.origin = origin;
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
