/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
import Image from 'next/image';
export default function Logo(){
    return   <div className="flex items-center justify-center p-4 mb-4"> 
                    <Image 
                    src="/AEON4.png"
                    width={150}
                    height={75}
                    alt="AEON4 Logo"
                    className='w-auto h-auto'
                    /> 
          </div>
}