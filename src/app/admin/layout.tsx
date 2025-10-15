'use client';

import { useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedDb, setSelectedDb] = useState('retailers');

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
