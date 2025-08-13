import React from 'react'
import logo from '../assets/logo.png'

const Footer = () => {
  return (
    <div className='md:mx-10'>
        
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

            {/* ========== Left Section ========== */}
            <div>
                <img className='mb-5 w-40' src={logo} alt="MediLink Logo" />
                <p className='w-full text-gray-600 leading-6'> 
                    MediLink is a smart hospital management platform developed by the Ministry of Health, Trincomalee. Designed to simplify operations, it connects patients, doctors, and administrative teams through one unified system. From appointments to digital records, MediLink transforms the way hospitals work — faster, smarter, and more patient-focused.
                </p>
            </div>

            {/* ========== Center Section ========== */}
            <div>
                <p className='text-xl font-medium mb-5'>Medi-Link Sri Lanka </p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>Our Services</li>
                    <li>Team</li>
                    <li>Policies</li>
                </ul>
            </div>

            {/* ========== Right Section ========== */}
            <div>
                <p className='text-xl font-medium mb-5'>Contact Us</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Phone: (94) 112 675280</li>
                    <li>Email: info@health.gov.lk</li>
                </ul>
            </div>

        </div>

        {/* ========== Footer Bottom ========== */}
        <div>
            <hr />
            <p className='py-5 text-sm text-center'>
                © 2025 Ministry of Health - MediLink System. All rights reserved.
            </p>
        </div>

    </div>
  )
}

export default Footer
