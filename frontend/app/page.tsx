// app/page.tsx 

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts'; 
import Image from 'next/image';
import Logo from './ui/dashboard/logo';

export default function Page() {
  return (
    <main 
      className="flex min-h-screen items-center justify-center p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url('/banner_mobile.png')`,
      }}
    >
      {/* Background Image for Desktop Viewport */}
      <div 
        className="absolute inset-0 hidden md:block" 
        style={{
          backgroundImage: `url('/banner.png')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Content Container (Centered on top of the background) */}
      <div className="z-10 flex flex-col items-center justify-center gap-6 rounded-lg bg-black/70 p-10 md:p-16 w-full max-w-xl text-center shadow-2xl backdrop-blur-sm">
        
        {/* Logo at the Top */}
        <Logo />        
        {/* Text and Link */}
        <p className={`${lusitana.className} text-xl text-white md:text-3xl md:leading-normal`}>
          <strong>Welcome to AEON4.0 Utilities Monitoring System.</strong> Monitor your systems in real-time.
        </p>
        
        <Link
          href="/login"
          className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
        >
          <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
        </Link>
      </div>
    </main>
  );
}