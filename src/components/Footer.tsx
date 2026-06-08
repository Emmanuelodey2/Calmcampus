import React from 'react'
import { Separator } from './ui/separator';
import Image from 'next/image';

const Footer = () => {
        return (
          <footer className="w-full bg-gray-300  mt-12">
            <div className="max-w-3xl mx-auto flex flex-col justify-center items-center text-center text-gray-600">
             <Image src={'/images/image copy 2.png'} alt={''} width={190} height={190}/>
              <nav className="flex justify-center space-x-6 mt-3">
                <a href="#" className="hover:text-black">Privacy Policy</a>
                <a href="#" className="hover:text-black">Terms of Service</a>
                <a href="#" className="hover:text-black">Contact</a>
              </nav>
            <div className='w-full'>
            <Separator />
            <p className="text-sm">&copy; {new Date().getFullYear()} Mental Health Platform. All rights reserved.</p>
            </div>
            </div>
          </footer>
        );
      }

export default Footer