import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../Context/AdminContext';
import { AppContext } from '../../Context/AppContext';
import { assets } from '../../assets/assets';

const AllAppointments = () => {
  const { aToken, appointments, getAllAppoinments, cancleAppointment } = useContext(AdminContext);
  const { calculateAge, slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllAppoinments();
    }
  }, [aToken, getAllAppoinments]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All appointments</p>

      <div className="bg-white border border-gray-300 rounded text-sm text-gray-700 max-h-[80vh] overflow-y-auto min-h-[60vh]">
        {/* Header for desktop */}
        <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_3fr_1fr] py-3 px-6 border-b border-gray-300 font-semibold text-gray-600">
          <p>ID</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date</p>
          <p>Doctor</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        {appointments.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No appointments found.</p>
        ) : (
          appointments.map((item, index) => (
            <div
              key={item._id || index}
              className="flex flex-wrap justify-between max-sm:gap-2 sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_3fr_1fr] items-center text-gray-500 py-3 px-6 border-b border-gray-300 hover:bg-blue-50 cursor-pointer"
            >
              <p className="max-sm:hidden">{index + 1}</p>

              <div className="flex items-center gap-2">
                <img
                  className="w-9 h-9 rounded-full object-cover"
                  src={item.userData.image || assets.default_user} // fallback image if missing
                  alt={item.userData.name || 'Patient'}
                />
                <p>{item.userData.name}</p>
              </div>

              <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>

              <p>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>

              <div className="flex items-center gap-2">
                <img
                  className="w-9 h-9 rounded-full object-cover"
                  src={item.docData.image || assets.default_doctor} // fallback image if missing
                  alt={item.docData.name || 'Doctor'}
                />
                <p>{item.docData.name}</p>
              </div>

              <p className={`max-sm:hidden ${item.cancelled ? 'text-red-500' : 'text-green-500'}`}>
                {item.cancelled ? 'Cancelled' : 'Scheduled'}
              </p>

              <button
                type="button"
                aria-label={`Cancel appointment with ${item.userData.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  cancleAppointment(item._id);
                }}
              >
                <img className="w-5" src={assets.delete_icon} alt="Cancel appointment" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
