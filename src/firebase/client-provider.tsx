
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useAuth } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/server-init';
import { initiateAnonymousSignIn } from './non-blocking-login';
import { onAuthStateChanged, User } from 'firebase/auth';

function AuthHandler({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        initiateAnonymousSignIn(auth);
      }
    });

    return () => unsubscribe();
  }, [auth]);

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
