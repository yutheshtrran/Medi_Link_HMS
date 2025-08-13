import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="flex bg-teal-600 rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10">

      {/* ============ Left Side Banner ============== */}
      <div className="flex-1 py-8 sm:py-10 md:py-16 lg:py-23 lg:pl-5">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white">
          <p>Appoint the Doctor</p>
          <p className="mt-4">With 200+ Doctors</p>
        </div>
        <button
          onClick={() => { navigate('/login'); window.scrollTo(0, 0); }}
          className="bg-white text-sm sm:text-base mt-6 cursor-pointer text-teal-700 px-8 py-3 rounded-full
                     hover:bg-teal-700 hover:text-white transition-colors duration-300"
        >
          Create account
        </button>
      </div>

     {/* Right Side Banner (Visible on Medium and Larger Screens) */}
      <div className="hidden md:block md:w-1/2 lg:w-[320px] relative h-[200px] md:h-[300px] lg:h-[360px] -mt-16">
        <img
          className="w-full absolute bottom-0 right-0 max-w-sm animate-slideInUp"
          src={assets.appointment_img}
          alt="Appointment"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x400/66BB6A/FFFFFF?text=Appointment+Image';
          }}
        />
      </div>

      {/* Tailwind CSS animation */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideInUp {
          animation: slideInUp 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Banner;
