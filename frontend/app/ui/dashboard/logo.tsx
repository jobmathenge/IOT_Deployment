import Image from 'next/image';
export default function Logo(){
    return   <div className="flex items-center justify-center p-4 mb-4"> 
                    <Image 
                    src="/dayliff.png"
                    width={150}
                    height={75}
                    alt="Dayliff Logo"
                    className='w-auto h-auto'
                    /> 
          </div>
}