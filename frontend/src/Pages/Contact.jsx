import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <section className='min-h-[100vh]'>

      <div className='w-full flex flex-col sm:grid grid-cols-2 my-6 gap-4'>

        {/* ========== Left Side ========== */}
        <div className='col-span-1 p-4 bg-white shadow-sm rounded-lg flex flex-col gap-10'>

          <div className='border-l-4 pl-4 border-[#0d9182]'>
            <p className='text-balance font-medium text-[#0d9182]'>Health Ministry</p>
          </div>

          <p className='text-3xl sm:text-7xl font-medium'>
            Empowering Hospitals with Smart Management
          </p>

          <p className='text-sm leading-6 text-gray-500'>
            At MediLink, we believe in a future where healthcare is fully connected, efficient, and patient-first. Our system transforms hospital workflows—making appointments, patient records, staff coordination, and service tracking simple and seamless. 
            With cutting-edge tools and real-time data, MediLink empowers healthcare providers to focus on what matters most: quality care.
          </p>

        </div>

        {/* ========== Right Side ========== */}
        <div className='col-span-1 p-4 bg-white shadow-sm rounded-lg'> 

          <img className='w-full' src={assets.contactImage} alt="Contact Illustration" />

          <div className='my-6 flex flex-col gap-4 w-full sm:grid grid-cols-4'>

            <div className='col-span-2 mt-3 shadow-sm p-6 rounded-md border-l-4 border-[#0d9182] bg-[#f0fdfa]'>
              <p className='text-2xl font-medium text-[#0d9182]'>100+</p>
              <p className='text-sm mt-1 text-gray-500'>Hospital Partners</p>
            </div>

            <div className='col-span-2 mt-3 shadow-sm p-6 rounded-md border-l-4 border-[#0d9182] bg-[#f0fdfa]'>
              <p className='text-2xl font-medium text-[#0d9182]'>5000+</p>
              <p className='text-sm mt-1 text-gray-500'>Managed Appointments</p>
            </div>

            <div className='col-span-2 mt-3 shadow-sm p-6 rounded-md border-l-4 border-[#0d9182] bg-[#f0fdfa]'>
              <p className='text-2xl font-medium text-[#0d9182]'>98%</p>
              <p className='text-sm mt-1 text-gray-500'>Satisfaction Rate</p>
            </div>

            <div className='col-span-2 mt-3 shadow-sm p-6 rounded-md border-l-4 border-[#0d9182] bg-[#f0fdfa]'>
              <p className='text-2xl font-medium text-[#0d9182]'>100K+</p>
              <p className='text-sm mt-1 text-gray-500'>Patients Served</p>
            </div>

          </div>
          
        </div>

      </div>

    </section>
  )
}

export default Contact
