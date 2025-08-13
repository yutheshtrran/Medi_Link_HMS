import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../Context/AdminContext';

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken, getAllDoctors]);

  if (!doctors || doctors.length === 0) {
    return (
      <div className="m-5 text-center text-gray-500">
        No doctors found.
      </div>
    );
  }

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-large font-medium mb-4">All Doctors</h1>

      <div className="w-full flex flex-wrap gap-4 pt-5">
        {doctors.map((doctor) => (
          <div
            key={doctor._id}
            className="border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group"
          >
            <img
              className="w-full object-cover"
              src={doctor.image}
              alt={`Dr. ${doctor.name}`}
              loading="lazy"
            />

            <div className="p-4">
              <p className="text-neutral-800 text-lg font-medium">{doctor.name}</p>
              <p className="text-zinc-600 text-sm">{doctor.speciality}</p>

              <div className="mt-2 flex items-center gap-2 text-sm">
                <input
                  id={`availability-${doctor._id}`}
                  type="checkbox"
                  checked={doctor.available}
                  onChange={() => changeAvailability(doctor._id)}
                  className="cursor-pointer"
                />
                <label htmlFor={`availability-${doctor._id}`} className="cursor-pointer">
                  Available
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorsList;
