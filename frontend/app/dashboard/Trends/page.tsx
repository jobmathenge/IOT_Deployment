
/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import DataChart from '@/app/ui/dashboard/data-chart';
export default function page(){
return (
    <main>
      <h1 className={`mb-8 text-3xl font-bold`}>
        Real-time Data Trends
      </h1>
      
      <div className="w-full lg:w-3/4 mx-auto">
        <p className="mb-4 text-gray-600">
         Data chart from the MQTT broker.
        </p>
        
        {/* Render the Chart Component */}
        <DataChart />
        
      </div>
    </main>
  );
}