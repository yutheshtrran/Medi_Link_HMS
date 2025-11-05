import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../Context/AppContext.jsx';
import { toast } from 'react-toastify';

// ======================
// MAIN WRAPPER COMPONENT
// ======================
const Day = () => {
  const [isAppMinimized, setIsAppMinimized] = useState(true);

  return (
    <>
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl
        p-4 font-inter z-40 rounded-2xl shadow-2xl
        transition-all duration-500 ease-in-out
        ${isAppMinimized ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 pointer-events-auto scale-100'}
        bg-white bg-opacity-70`}
      >
        {/* Minimize Button */}
        <button
          onClick={() => setIsAppMinimized(true)}
          className="absolute top-4 right-4 p-2 text-black hover:text-gray-700 focus:outline-none transition-transform duration-300 z-50 rounded-full bg-gray-200 hover:bg-gray-300 shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
          <div className="p-6 rounded-xl flex-1 w-full md:w-auto">
            <DigitalTime />
          </div>
          <div className="p-6 rounded-xl flex-1 w-full md:w-auto">
            <Calendar />
          </div>
        </div>
      </div>

      {/* Restore Button */}
      {isAppMinimized && (
        <button
          onClick={() => setIsAppMinimized(false)}
          className="fixed left-4 top-1/2 -translate-y-1/2 bg-[#159A7D] text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </>
  );
};

// ======================
// DIGITAL CLOCK
// ======================
const DigitalTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date) => {
    let h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${ampm}`;
  };
  return (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-[#159A7D] tracking-wide">
        {formatTime(time)}
      </div>
    </div>
  );
};

// ======================
// CALENDAR COMPONENT
// ======================
const Calendar = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------
  // Fetch appointments
  // ----------------------
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
          headers: { token },
        });
        if (data.success) {
          const formatted = data.appointments.map((item) => {
            const [day, month, year] = item.slotDate.split('_').map(Number);
            const date = new Date(year, month - 1, day);
            return {
              date: date.toISOString().split('T')[0],
              doctor: item.docData.name,
              specialty: item.docData.speciality,
              address: `${item.docData.address.line1}, ${item.docData.address.line2}`,
              time: item.slotTime,
              cancelled: item.cancelled,
            };
          });
          setAppointments(formatted);
        } else {
          toast.error(data.message || 'Failed to load appointments');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [backendUrl, token]);

  // ----------------------
  // Calendar generation
  // ----------------------
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const renderCalendar = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = new Date();
    const days = getDaysInMonth(y, m);
    const firstDay = getFirstDayOfMonth(y, m);
    const cells = [];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekDays.forEach((d) =>
      cells.push(<div key={d} className="font-bold text-gray-700 text-center">{d}</div>)
    );

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`}></div>);

    for (let day = 1; day <= days; day++) {
      const dateObj = new Date(y, m, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      const appt = appointments.find((a) => a.date === dateStr);
      let bg = '';
      if (appt) {
        if (appt.cancelled) {
          bg = 'bg-gray-400 text-white';
        } else {
          const diff = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24));
          if (diff <= 0) bg = 'bg-red-500 text-white';
          else if (diff <= 3) bg = 'bg-orange-400 text-white';
          else bg = 'bg-green-400 text-white';
        }
      }
      cells.push(
        <div
          key={day}
          className={`relative group text-center p-2 rounded-md cursor-pointer ${bg} hover:scale-105 transition-all`}
        >
          {day}
          {appt && (
            <div
              className="absolute opacity-0 group-hover:opacity-100 transform group-hover:-translate-y-1 transition-all duration-300
              top-10 left-1/2 -translate-x-1/2 w-64 
              bg-white/95 backdrop-blur-md text-gray-900 text-xs rounded-xl shadow-2xl border border-gray-300 p-3 z-[100]
              pointer-events-none"
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              <p className="font-semibold text-[#159A7D]">{appt.doctor}</p>
              <p className="text-gray-600">{appt.specialty}</p>
              <p className="mt-1 font-medium">{appt.time}</p>
              <p className="text-gray-500">{appt.address}</p>
              {appt.cancelled && <p className="text-red-500 mt-1 font-semibold">Cancelled</p>}
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="text-center">
      <div className="bg-[#159A7D] text-white p-4 rounded-t-lg text-xl font-bold mb-4 shadow-md">
        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading appointments...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-sm">{renderCalendar()}</div>
      )}
    </div>
  );
};

export default Day;
