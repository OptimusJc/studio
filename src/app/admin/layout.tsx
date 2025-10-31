
'use client';

import { useState, useEffect } from 'react';
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
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: appUser, isLoading: isAppUserLoading } = useDoc<AppUser>(userDocRef);

  const isLoading = isUserLoading || isAppUserLoading;

  // After loading, if the user is not authenticated or not authorized, redirect.
  // This check now happens after the loading state is resolved.
  useEffect(() => {
    if (!isLoading) {
      if (!user || !appUser || (appUser.role !== 'Admin' && appUser.role !== 'Editor')) {
        router.replace('/login?error=unauthorized');
      }
    }
  }, [isLoading, user, appUser, router]);


  // Show a loading skeleton while we verify the user's session and permissions.
  if (isLoading) {
    return <AdminLayoutSkeleton />;
  }

  // If after loading, the user is still not valid, the useEffect will handle the redirect.
  // We render the children only if the user is fully authenticated and authorized.
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

  // In the brief moment before the redirect happens, show the skeleton.
  // This prevents flashing a broken UI.
  return <AdminLayoutSkeleton />;
}
