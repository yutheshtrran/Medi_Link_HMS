import React, { useRef, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const appointmentRef = useRef();

  const images = [
    assets.HomeImage,
    assets.anotherImage,
    assets.yetAnotherImage,
    assets.yetyetAnotherImage
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="p-4 sm:p-6 lg:p-8 font-inter">
      <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-8 items-center">
        {/* Left content section */}
        <div className="flex flex-col justify-center gap-4 order-2 md:order-1">
          <div className="border-l-4 pl-4 border-teal-400">
            <p className="text-balance font-medium text-teal-900 text-lg">
              A range of programs for healthcare
            </p>
          </div>
          <h1 className="py-2 text-3xl font-bold text-start text-teal-900 sm:text-5xl leading-tight">
            From Ministry Of Health
          </h1>
          <p className="text-teal-800 font-semibold text-base leading-relaxed">
            MediLink empowers lives with personalized, innovative healthcare solutions that prioritize well-being, enhance recovery, and redefine patient care. We combine compassion, cutting-edge technology, and a commitment to excellence at every step of the healthcare journey to deliver truly transformative experiences for patients and providers alike.
          </p>
          <a href="#doctors">
            <div>
              <button
                ref={appointmentRef}
                className="px-6 py-3 mt-6 bg-teal-600 text-white rounded-lg font-medium
                           hover:bg-teal-700 transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75"
              >
                Book an Appointment
              </button>
            </div>
          </a>
        </div>

        {/* Right image section with animation */}
        <div
          key={currentIndex} // Triggers re-render for animation
          className="w-full min-h-[50vh] sm:min-h-[60vh] md:min-h-[500px] flex items-end justify-center my-8 bg-no-repeat bg-center bg-contain relative animate-slideInRight order-1 md:order-2"
          style={{ backgroundImage: `url(${images[currentIndex]})` }}
        />
      </div>

      {/* Tailwind CSS custom animation keyframes */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 1s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default Header;
