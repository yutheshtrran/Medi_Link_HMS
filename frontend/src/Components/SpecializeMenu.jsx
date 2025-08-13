import React, { useRef } from 'react';
import { specialityData } from '../assets/assets.js';
import { Link } from 'react-router-dom';

const SpecializeMenu = () => {
  const scrollContainerRef = useRef(null); // Ref to the scrollable container

  // Function to scroll the container left or right
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250; // Adjust scroll amount as needed
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth',
        });
      } else {
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <section className="w-full mt-12 p-4 sm:p-6 lg:p-8 font-inter overflow-x-hidden"> {/* Added overflow-x-hidden */}
      <h1 className="text-3xl font-bold text-center text-teal-900 sm:text-4xl lg:text-5xl mb-4">
        Find your doctor by speciality
      </h1>
      <p className="text-base text-teal-700 text-center mt-4 max-w-2xl mx-auto leading-relaxed">
        Discover top-rated doctors across various specialties and book your appointment with ease. Your health, your choice!
      </p>

      <div className="relative flex items-center justify-center my-10">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-1.5rem] z-10 p-2 bg-teal-600 text-white rounded-full shadow-lg
                     hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300
                     " /* Positioned 1.5rem (24px) outside the left edge */
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable Speciality Items Container */}
        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap overflow-x-auto scrollbar-hide py-4 px-2 md:px-0 w-full" // scrollbar-hide is a custom utility
          style={{ scrollBehavior: 'smooth' }} // Ensures smooth scrolling even with mouse wheel/trackpad
        >
          {specialityData.map((item, index) => (
            <Link
              onClick={() => window.scrollTo(0, 0)}
              className="flex-shrink-0 w-40 sm:w-48 p-5 mx-3 bg-teal-50 rounded-xl text-center cursor-pointer
                         hover:translate-y-[-10px] hover:bg-teal-100 transition-all duration-500
                         shadow-md hover:shadow-lg border border-teal-200 flex flex-col items-center justify-between"
              key={index}
              to={`/doctors/${item.speciality}`}
            >
              <img
                className="h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] object-cover rounded-full mb-4 border-2 border-teal-300 p-1"
                src={item.image}
                alt={item.speciality}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x120/E0F2F7/00796B?text=Icon'; }}
              />
              <p className="text-lg mt-2 font-semibold text-teal-800">{item.speciality}</p>
            </Link>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-1.5rem] z-10 p-2 bg-teal-600 text-white rounded-full shadow-lg
                     hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300
                     " /* Positioned 1.5rem (24px) outside the right edge */
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Custom CSS for hiding scrollbar (if not using a Tailwind plugin) */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </section>
  );
};

export default SpecializeMenu;
