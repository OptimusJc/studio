
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as AppUser } from '@/types';

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <Skeleton className="hidden md:block w-64 h-screen" />
      <div className="flex-1 p-8">
        <Skeleton className="h-16 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const dbFromUrl = searchParams.get('db') || 'retailers';
  const [selectedDb, setSelectedDb] = useState(dbFromUrl as 'retailers' | 'buyers');
  const hasRedirected = useRef(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUser>(userDocRef);

  const isLoading = isUserLoading || isAppUserLoading;

  // This effect handles the redirection logic once the loading state is resolved.
  useEffect(() => {
    // Do not run the check until all user data has been loaded.
    if (isLoading) {
      return;
    }

    // After loading, if the user is not authenticated or not an Admin/Editor, redirect them.
    if (!user || !appUser || (appUser.role !== 'Admin' && appUser.role !== 'Editor')) {
      // Use a ref to prevent multiple redirects, which can happen in strict mode
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/login?error=unauthorized');
    } else {
        // Reset the ref if the user is authorized, allowing for re-checking if state changes
        hasRedirected.current = false;
    }
  }, [isLoading, user, appUser, router]);


  // While loading, always show the skeleton.
  if (isLoading) {
    return <AdminLayoutSkeleton />;
  }

  // After loading, if the user is valid and authorized, render the actual layout.
  if (user && appUser && (appUser.role === 'Admin' || appUser.role === 'Editor')) {
    return (
      <SidebarProvider>
        <AdminSidebar selectedDb={selectedDb} setSelectedDb={setSelectedDb} user={appUser} />
        <SidebarInset>
          <div className="min-h-screen">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // If the user is not authorized, the useEffect above will have already triggered a redirect.
  // We render the skeleton here to prevent showing a broken or empty page in the brief moment
  // before the redirect completes.
  return <AdminLayoutSkeleton />;
}
