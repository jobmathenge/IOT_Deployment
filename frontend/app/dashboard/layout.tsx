// frontend/app/dashboard/layout.tsx

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import type { ReactNode } from 'react'; // Import ReactNode type for clear typing
import SideNav from '@/app/ui/dashboard/sidenav';
import AlertBell from '@/app/ui/alerts/AlertBell';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      
      {/* Main content area */}
      <div className="grow p-6 md:overflow-y-auto md:p-12">
        {children}
      </div>
      
      {/* Floating component outside the main content flow */}
      <AlertBell />    
    </div>
  );
}