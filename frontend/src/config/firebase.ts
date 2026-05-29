import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Em modo dev, Firebase não é necessário — auth é feita via token de teste no backend
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (_cb: any) => () => {},
  signOut: async () => {},
} as unknown as Auth;

let _auth: Auth;

if (DEV_MODE) {
  _auth = mockAuth;
} else {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(app);
}

export const auth = _auth;
