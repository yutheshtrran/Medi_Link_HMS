import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../Context/AdminContext';
import { assets } from '../../assets/assets';
import { AppContext } from '../../Context/AppContext';

const Dashboard = () => {
  const { dashData, getDashData, aToken, cancleAppointment } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken, getDashData]);

  return (
    <div className='m-5'>

      <div className='flex flex-wrap gap-3'>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-teal-600 cursor-pointer hover:scale-105 transition-all'>
          <img className="w-14" src={assets.doctor_icon} alt="Doctors icon" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData?.doctors}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-teal-600 cursor-pointer hover:scale-105 transition-all'>
          <img className="w-14" src={assets.appointments_icon} alt="Appointments icon" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData?.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-teal-600 cursor-pointer hover:scale-105 transition-all'>
          <img className="w-14" src={assets.patients_icon} alt="Patients icon" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData?.users}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-teal-600 cursor-pointer hover:scale-105 transition-all'>
          <img className="w-14" src={assets.donation_icon} alt="Donations icon" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>රු.{dashData?.totaldonations}</p>
            <p className='text-gray-400'>Donations</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-teal-600 cursor-pointer hover:scale-105 transition-all'>
          <img className="w-14" src={assets.total_beds} alt="Beds icon" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>230</p>
            <p className='text-gray-400'>Beds Available</p>
          </div>
        </div>

      </div>

      <div className='bg-white mt-10 rounded border border-teal-600'>
        <div className='flex items-center gap-2.5 px-4 py-4 rounded-t border-b border-teal-600'>
          <img src={assets.list_icon} alt="List icon" className="w-8 h-8" />
          <p className='font-semibold text-gray-600'>Latest Appointment Bookings</p>
        </div>

        <div className='py-4 border-t-0 max-h-96 overflow-y-auto'>
          {dashData?.latestAppointments?.length === 0 ? (
            <p className='text-center text-gray-500 py-4'>No recent appointments</p>
          ) : (
            dashData?.latestAppointments?.map((item, index) => (
              <div
                key={index}
                className='flex cursor-pointer items-center px-4 py-3 gap-3 hover:bg-teal-50'
              >
                <img
                  className='rounded-full w-12'
                  src={item.docData.image}
                  alt={`${item.docData.name} profile`}
                />

                <div className='flex-1 text-sm'>
                  <p className='text-gray-800'>{item.docData.name}</p>
                  <p className='text-gray-500'>{slotDateFormat(item.slotDate)}</p>
                </div>

                {item.cancelled ? (
                  <p className='text-red-500 text-xs font-medium'>Cancelled</p>
                ) : (
                  <img
                    onClick={() => cancleAppointment(item._id)}
                    className='w-5 cursor-pointer'
                    src={assets.delete_icon}
                    alt="Cancel appointment"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
