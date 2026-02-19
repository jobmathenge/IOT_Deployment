// app/ui/dashboard/status-tile.tsx

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; 

interface StatusTileProps {
  title: string;
  value: string | number;
  Icon: React.ElementType;
  unit?: string; 
}

export default function StatusTile({ title, value, Icon, unit }: StatusTileProps) {
  
  return (
    <div 
      className="relative p-4 rounded-xl overflow-hidden shadow-lg 
                 bg-white/40 backdrop-blur-md border border-blue-200/50 
                 min-w-[180px] h-32 transition-shadow duration-300 hover:shadow-xl"
    >
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ 
          background: 'radial-gradient(circle at top right, #93c5fd 0%, #dbeafe 100%)', 
        }}
      />
      
      {/* Icon Circle */}
      <div className="absolute top-4 right-4 z-10">
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
          }}
        >
          {/* Icon inside the circle */}
          <Icon className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content (Text) */}
      <div className="relative z-20 flex flex-col justify-between h-full text-gray-900">
        
        {/* Title */}
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        
        {/* Value */}
        <p className="text-4xl font-semibold text-blue-700">
          {value}
          {unit && <span className="text-xl font-normal ml-1 text-blue-500">{unit}</span>}
        </p>
      </div>
    </div>
  );
}