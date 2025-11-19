
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp,
  cert,
  App,
  AppOptions,
} from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

interface AdminServices {
  firebaseApp: App;
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
}

/**
 * Initializes and returns the Firebase Admin SDK services.
 * It ensures that the app is initialized only once (singleton pattern).
 *
 * This function is for SERVER-SIDE use only.
 */
export function initializeFirebase(): AdminServices {
  if (getAdminApps().length > 0) {
    return getSdks(getAdminApp());
  }

  const appOptions: AppOptions = {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  };

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        appOptions.credential = cert(serviceAccount);
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // This is often a path to a file, which `cert` can handle directly.
    appOptions.credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  const app = initializeAdminApp(appOptions);
  return getSdks(app);
}

/**
 * Returns the initialized Firebase Admin services from a given app instance.
 */
export function getSdks(app: App): AdminServices {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}
