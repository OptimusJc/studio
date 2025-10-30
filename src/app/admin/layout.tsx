
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
  const pathname = usePathname();
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

  useEffect(() => {
    // Wait until both auth and firestore user loading is complete
    if (!isUserLoading && !isAppUserLoading) {
      // If there's no Firebase Auth user, they are not logged in.
      if (!user) {
        router.replace('/login');
        return;
      }
      
      // If Auth user exists but Firestore user data doesn't, or role is 'Customer',
      // they are not authorized for the admin panel.
      if (!appUser || appUser.role === 'Customer') {
        router.replace('/login?error=unauthorized');
      }
    }
  }, [user, appUser, isUserLoading, isAppUserLoading, router]);


  // Show a loading skeleton while we verify the user's session and permissions.
  // This prevents the redirect loop and avoids showing a flash of the admin page.
  if (isUserLoading || isAppUserLoading) {
    return <AdminLayoutSkeleton />;
  }

  // If after loading, the user is still not valid, they will be redirected by the useEffect.
  // Don't render the children until we're sure they are authorized.
  if (!user || !appUser || appUser.role === 'Customer') {
     return <AdminLayoutSkeleton />;
  }


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
