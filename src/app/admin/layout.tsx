
'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
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
  );
}

function useAppUser() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [isAppUserLoading, setIsAppUserLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading) {
            setIsAppUserLoading(true);
            return;
        }
        if (!user) {
            setAppUser(null);
            setIsAppUserLoading(false);
            return;
        }

        const fetchAppUser = async () => {
            if (!firestore || !user.email) {
                setAppUser(null);
                setIsAppUserLoading(false);
                return;
            }
            setIsAppUserLoading(true);
            const usersCollection = collection(firestore, 'users');
            const userQuery = query(usersCollection, where("email", "==", user.email));
            
            try {
                const querySnapshot = await getDocs(userQuery);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    setAppUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
                } else {
                    setAppUser(null);
                }
            } catch (error) {
                console.error("Error fetching app user:", error);
                setAppUser(null);
            } finally {
                setIsAppUserLoading(false);
            }
        };

        fetchAppUser();
    }, [user?.uid, isUserLoading, firestore]); 

    return { appUser, isAppUserLoading };
}


function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { appUser, isAppUserLoading } = useAppUser();
  
  const dbFromUrl = searchParams.get('db') || 'retailers';
  const [selectedDb, setSelectedDb] = useState(dbFromUrl as 'retailers' | 'buyers');
  
  const isLoading = isAuthLoading || isAppUserLoading;
  
  useEffect(() => {
    if (!isLoading) {
      if (!user || !appUser || (appUser.role !== 'Admin' && appUser.role !== 'Editor')) {
        router.replace('/login?error=unauthorized');
      }
    }
  }, [isLoading, user, appUser, router]);


  if (isLoading) {
    return <AdminLayoutSkeleton />;
  }

  if (user && appUser && (appUser.role === 'Admin' || appUser.role === 'Editor')) {
    return (
      <SidebarProvider>
        <AdminSidebar selectedDb={selectedDb} setSelectedDb={setSelectedDb} user={appUser} />
        <SidebarInset>
          <div className="relative min-h-screen p-4">
            <SidebarTrigger className="absolute top-4 left-4 z-20" />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
