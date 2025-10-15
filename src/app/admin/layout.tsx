'use client';

import { useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSearchParams } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const dbFromUrl = searchParams.get('db') || 'retailers';
  const [selectedDb, setSelectedDb] = useState(dbFromUrl as 'retailers' | 'buyers');

  return (
    <SidebarProvider>
      <AdminSidebar selectedDb={selectedDb} setSelectedDb={setSelectedDb} />
      <SidebarInset>
        <div className="min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
