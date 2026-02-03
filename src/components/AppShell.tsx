'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<div className="animate-pulse p-4">Загрузка...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
