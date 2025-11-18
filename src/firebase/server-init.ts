
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // In a server environment (like Genkit flows or Next.js server components),
    // we use the Admin SDK with service account credentials.
    // The `initializeApp` function for the admin SDK will automatically use
    // the GOOGLE_APPLICATION_CREDENTIALS environment variable if it's set.
    // In Firebase App Hosting, this is configured for you.
    try {
      initializeApp();
    } catch (e) {
      console.warn(
        'Admin SDK automatic initialization failed. This is expected in local development if GOOGLE_APPLICATION_CREDENTIALS is not set. Falling back to client-side config for client-side functionality if needed, but server-side flows will require auth.',
        e
      );
      // For local dev where you might run client and server code in the same process,
      // you might need a fallback, but for pure server-side, this would fail.
      // The client-provider handles client-side init separately.
    }
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: App) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}
