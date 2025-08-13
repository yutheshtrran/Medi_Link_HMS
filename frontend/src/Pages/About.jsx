
import { assets } from '../assets/assets'
import React from 'react'


const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-primary'>US</span></p>
      </div>

      <div className='flex flex-col md:flex-row gap-12 my-10'>

        <img className='w-full md:max-w-[360px] rounded-md' src={assets.newAbout} alt="About MediLink" />

        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-500'>

          <p>
            Welcome to MediLink, the comprehensive hospital management system designed to streamline healthcare operations and improve patient care. MediLink connects medical staff, patients, and administrators through a unified platform, simplifying everything from appointment scheduling to digital record management.
          </p>

          <p>
            Our system embraces innovation to make hospital workflows more efficient and transparent. With MediLink, healthcare providers can focus on delivering exceptional care, while patients enjoy easier access to services and seamless communication.
          </p>

          <b className='text-gray-800'>
            Our Vision
          </b>

          <p>
            At MediLink, we envision a future where hospital management is intuitive and patient-centric. Our mission is to bridge gaps in healthcare delivery by integrating technology that supports both caregivers and patients, ensuring quality care is accessible to all.
          </p>

        </div>

      </div>

    </div>
  )
}

export default About
