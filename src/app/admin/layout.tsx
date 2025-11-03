'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
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

function AdminLayoutContent({
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
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);

  const isLoading = isUserLoading || isAppUserLoading;

  useEffect(() => {
    if (isUserLoading) return; // Wait until Firebase Auth check is complete

    if (!user) {
      // If no user from Firebase Auth, redirect to login
      router.replace('/login');
      return;
    }

    // User is authenticated, now fetch their profile from Firestore by email
    const fetchAppUser = async () => {
      setIsAppUserLoading(true);
      if (!firestore || !user.email) {
        setIsAppUserLoading(false);
        return;
      }
      const usersCollection = collection(firestore, 'users');
      const userQuery = query(usersCollection, where("email", "==", user.email), 1);
      
      try {
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setAppUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
        } else {
          setAppUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setAppUser(null);
      } finally {
        setIsAppUserLoading(false);
      }
    };

    fetchAppUser();

  }, [user, isUserLoading, firestore, router]);


  useEffect(() => {
    // This effect handles redirection after all data is loaded
    if (isLoading) {
      return; // Don't do anything while loading
    }

    // Once loading is complete, check for authorization
    if (!user || !appUser || (appUser.role !== 'Admin' && appUser.role !== 'Editor')) {
        // To prevent a flicker of unauthorized content, we check here and redirect.
        router.replace('/login?error=unauthorized');
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

  // If unauthorized, show skeleton while redirect happens
  return <AdminLayoutSkeleton />;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
