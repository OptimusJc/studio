
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/server-init';
import { initiateAnonymousSignIn } from './non-blocking-login';
import { onAuthStateChanged, User } from 'firebase/auth';

function AuthHandler({ children }: { children: ReactNode }) {
  // Use the more general useFirebase hook
  const { auth } = useFirebase();

  useEffect(() => {
    // This guard is now crucial. The effect will re-run when `auth` becomes available.
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        initiateAnonymousSignIn(auth);
      }
    });

    return () => unsubscribe();
  }, [auth]); // The effect dependency on `auth` is key.

  return <>{children}</>;
}


export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <AuthHandler>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
