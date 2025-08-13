import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext.jsx';

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  return (
    <div
      id="doctors"
      className="flex flex-col items-center gap-4 my-16 text-teal-900 md:mx-10"
    >
      <h1 className="text-2xl font-bold text-center text-teal-900 sm:text-4xl">
        Doctors To Book
      </h1>
      <p className="text-sm text-teal-600 text-center">
        Simply Browse using our list of trusted doctors
      </p>

      <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {doctors.slice(0, 10).map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(`/appointment/${item._id}`)}
            className="border border-teal-300 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
          >
            <img className="w-full" src={item.image} alt={item.name} />
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-center text-teal-500">
                <span className="w-2 h-2 bg-teal-500 rounded-full inline-block"></span>
                <p>Available</p>
              </div>
              <p className="text-teal-900 text-md font-medium">{item.name}</p>
              <p className="text-teal-700 text-sm">{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          navigate('/doctors');
          scrollTo(0, 0);
        }}
        className="bg-teal-100 text-teal-700 px-12 py-3 rounded-full cursor-pointer hover:bg-teal-200 transition-colors duration-300"
      >
        Browse More
      </button>
    </div>
  );
};

export default TopDoctors;
