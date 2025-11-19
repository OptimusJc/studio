
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/client-init'; // Updated import

function AuthRedirect({ children }: { children: ReactNode }) {
  // This component doesn't need to do anything with auth itself.
  // The logic is now handled in the AdminLayout.
  // It simply ensures its children are rendered within the provider's scope.
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
      <AuthRedirect>
        {children}
      </AuthRedirect>
    </FirebaseProvider>
  );
}
