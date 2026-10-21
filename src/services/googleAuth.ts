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

/**
 * Initiates real Google Sign-In with popup
 * Returns the authenticated Google User (containing verified email, name, avatar)
 */
export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
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
