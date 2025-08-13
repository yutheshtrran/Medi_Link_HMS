import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, backendUrl, token, getDoctorsData} = useContext(AppContext);

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const navigate = useNavigate();

  const getAvailableSlots = async () => {
    if (!docInfo) return;
    setDocSlots([]);
    const today = new Date();
    const allSlots = [];

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today.getTime());
      currentDate.setDate(today.getDate() + i);

      let slotStart = new Date(currentDate.getTime());
      let slotEnd = new Date(currentDate.getTime());
      slotEnd.setHours(21, 0, 0, 0);

      if (i === 0) {
        const now = new Date();
        slotStart.setHours(Math.max(now.getHours() + 1, 10));
        slotStart.setMinutes(now.getMinutes() > 30 ? 30 : 0);
      } else {
        slotStart.setHours(10);
        slotStart.setMinutes(0);
      }

      const slotsForDay = [];

      while (slotStart < slotEnd) {
        const day = String(slotStart.getDate()).padStart(2, '0');
        const month = String(slotStart.getMonth() + 1).padStart(2, '0');
        const year = slotStart.getFullYear();
        const slotDate = `${day}_${month}_${year}`;
        const formattedTime = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isAvailable = !(docInfo.slots_booked?.[slotDate]?.includes(formattedTime));

        if (isAvailable) {
          slotsForDay.push({
            datetime: new Date(slotStart.getTime()),
            time: formattedTime,
          });
        }

        slotStart.setMinutes(slotStart.getMinutes() + 30);
      }

      allSlots.push(slotsForDay);
    }

    setDocSlots(allSlots);
  };

  const fetchDocInfo = () => {
    const docInfo = doctors.find(doc => doc._id === docId);
    setDocInfo(docInfo);
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Please Login to Book your appointment");
      return navigate('/login');
    }

    try {
      const selectedSlot = docSlots[slotIndex].find(slot => slot.time === slotTime);
      if (!selectedSlot) {
        toast.error("Please select a time slot");
        return;
      }

      const date = selectedSlot.datetime;
      const time = selectedSlot.time;
      let day = String(date.getDate()).padStart(2, '0');
      let month = String(date.getMonth() + 1).padStart(2, '0');
      let year = date.getFullYear();
      const slotDate = `${day}_${month}_${year}`;

      const { data } = await axios.post(
        backendUrl + '/api/user/book-appointment',
        { docId, slotDate, slotTime: time },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate('/my-appointment');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) getAvailableSlots();
  }, [docInfo]);

  return docInfo && (
    <div>
      {/* ================================ Doctors Details ================================ */}
      <div className='flex flex-col sm:flex-row gap-4 mt-5'>
        <div>
          <img className='w-full sm:max-w-72  rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-xl font-medium text-gray-900'>{docInfo.name}</p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <div className="text-sm mt-2 text-gray-600 leading-6">
  <p><span className="font-medium text-gray-800">Degree:</span> {docInfo.degree}</p>
  <p><span className="font-medium text-gray-800">University:</span> {docInfo.university}</p>
  <p><span className="font-medium text-gray-800">Specialized:</span> {docInfo.speciality}</p>
  <p><span className="font-medium text-gray-800">Contact:</span> {docInfo.mobile}</p>
  <p><span className="font-medium text-gray-800">Experience:</span> {docInfo.experience}</p>

  {docInfo.address && (
         <div>
      <p><span className="font-medium text-gray-800">Address:</span></p>
      <p>{docInfo.address.line1}</p>
      <p>{docInfo.address.line2}</p>
         </div>
       )}
         </div>

          </div>
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
              About <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1 leading-6'>{docInfo.about}</p>
          </div>
        </div>
      </div>

      {/* =================================== Booking Slots ================================ */}
      <div className='mt-8 text-gray-700'>
        <p className='text-center md:text-start'>Book Your Appointment Here!</p>

        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4 justify-between'>
          {
            docSlots.length && docSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => setSlotIndex(index)}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-[#0d9182] text-white' : 'border border-gray-300'}`}
              >
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
          }
        </div>

        <div className='flex flex-wrap items-center justify-center sm:justify-start mt-5 gap-3'>
          {
            docSlots.length && docSlots[slotIndex].map((item, index) => (
              <p
                onClick={() => setSlotTime(item.time)}
                key={index}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-[#0d9182] text-white' : 'border border-gray-300'}`}
              >
                {item.time.toLowerCase()}
              </p>
            ))
          }
        </div>

        <button
          onClick={bookAppointment}
          className='w-full mt-5 bg-[#0d9182] hover:bg-[#0b7b6d] transition-all duration-200 cursor-pointer text-white py-2.5 rounded-full'
        >
          Book an Appointment
        </button>
      </div>
    </div>
  );
};

export default Appointment;
