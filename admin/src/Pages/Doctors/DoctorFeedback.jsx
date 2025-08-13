import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa'; // for star icons
import { DoctorContext } from '../../Context/DoctorContext';
import { AppContext } from '../../Context/AppContext';

const DoctorFeedback = () => {
  const { backendURL, dToken } = useContext(DoctorContext);
  const { formatDateTime } = useContext(AppContext); // optional if you have date formatter
  const [feedbacks, setFeedbacks] = useState([]);

  const getFeedbacks = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/doctor/feedbacks`, {
        headers: { dToken }
      });

      if (data.success) {
        setFeedbacks(data.feedbacks);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load feedbacks');
    }
  };

  useEffect(() => {
    if (dToken) {
      getFeedbacks();
    }
  }, [dToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">Patient Feedbacks</p>

      <div className="bg-white border border-gray-300 rounded text-sm max-h-[80vh] overflow-y-scroll min-h-[50vh]">

        {/* Table Header */}
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_2fr_2fr] gap-1 py-3 px-6 border-b border-gray-300">
          <p>#</p>
          <p>Patient Name</p>
          <p>Rating</p>
          <p>Comment</p>
          <p>Time</p>
        </div>

        {/* Table Rows */}
        {feedbacks.map((fb, index) => (
          <div
            key={index}
            className="flex flex-wrap cursor-pointer justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1.5fr_2fr_2fr] gap-1 items-center text-gray-500 py-3 px-6 border-b border-gray-300 hover:bg-blue-50"
          >
            <p className="max-sm:hidden">{index + 1}</p>

            {/* Patient Name */}
            <p className="font-medium text-gray-700">{fb.patientName}</p>

            {/* Rating Stars */}
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar key={i} size={18} className={i < fb.rating ? 'text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>

            {/* Comment */}
            <p className="text-gray-600 text-sm">
              {fb.comment.length > 40 ? fb.comment.substring(0, 40) + '...' : fb.comment}
            </p>

            {/* Time */}
            <p className="text-gray-500 text-xs">
              {new Date(fb.time).toLocaleString()}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
};

export default DoctorFeedback;
