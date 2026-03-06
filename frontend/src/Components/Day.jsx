import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Clock, Calendar as CalendarIcon, X, Maximize2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../Context/AppContext.jsx';

// ======================
// DIGITAL CLOCK COMPONENT
// ======================
const DigitalTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/70 h-full flex flex-col justify-center">
      <div className="flex items-center justify-center mb-4 text-gray-700">
        <Clock className="w-7 h-7 mr-3 text-[#159A7D]" />
        <h2 className="text-xl font-bold tracking-wider">Local Time</h2>
      </div>
      <div
        className="text-5xl md:text-6xl font-extrabold tracking-tighter"
        style={{
          backgroundImage: 'linear-gradient(45deg, #159A7D, #4CAF50)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(21, 154, 125, 0.4)',
        }}
      >
        {formatTime(time)}
      </div>
      <div className="text-base font-medium text-gray-500 mt-2">
        {time.toDateString()}
      </div>
    </div>
  );
};

// ======================
// CALENDAR COMPONENT
// ======================
const Calendar = ({ setNotification }) => {
  const { backendUrl, token } = useContext(AppContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch appointments from backend
  const fetchAppointments = useCallback(async () => {
    if (!token) {
      setNotification({ type: 'error', message: 'User not authenticated' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });

      if (data.success) {
        const formatted = data.appointments.map((item) => {
          const [day, month, year] = item.slotDate.split('_').map(Number);
          const date = new Date(year, month - 1, day);
          return {
            date: date.toISOString().split('T')[0],
            doctor: item.docData?.name || 'Unknown Doctor',
            specialty: item.docData?.speciality || 'Unknown Specialty',
            address: `${item.docData?.address?.line1 || ''}, ${item.docData?.address?.line2 || ''}`,
            time: item.slotTime,
            cancelled: item.cancelled,
          };
        });

        setAppointments(formatted);
        // ✅ No success message shown
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to load appointments' });
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setNotification({ type: 'error', message: 'Error fetching appointments' });
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, setNotification]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Helpers
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleMonthChange = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  // Render Calendar
  const renderCalendar = useCallback(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = getDaysInMonth(y, m);
    const firstDay = getFirstDayOfMonth(y, m);
    const cells = [];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekDays.forEach((d) =>
      cells.push(
        <div key={d} className="font-bold text-gray-600 text-center py-2 text-sm border-b border-gray-200">
          {d}
        </div>
      )
    );

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= days; day++) {
      const dateObj = new Date(y, m, day);
      dateObj.setHours(0, 0, 0, 0);
      const dateStr = dateObj.toISOString().split('T')[0];
      const appt = appointments.find((a) => a.date === dateStr);

      let bgClass = 'text-gray-800 hover:bg-gray-100/70 border border-transparent';
      if (dateObj.getTime() === today.getTime()) {
        bgClass = 'bg-blue-100 font-bold text-blue-700 ring-2 ring-blue-400 border-blue-400';
      }

      let apptClass = '';
      let hoverClass = 'hover:scale-[1.02] hover:ring-2 hover:ring-offset-2 hover:ring-opacity-50';

      if (appt) {
        const diff = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24));
        if (appt.cancelled) {
          apptClass = 'bg-gray-400 text-white line-through opacity-80 shadow-md ring-1 ring-gray-500';
          hoverClass = 'hover:scale-[1.02] hover:ring-2 hover:ring-gray-600';
        } else if (diff < 0) {
          apptClass = 'bg-red-500 text-white font-semibold shadow-md ring-1 ring-red-600';
          hoverClass = 'hover:scale-[1.02] hover:ring-2 hover:ring-red-600';
        } else if (diff <= 3) {
          apptClass = 'bg-orange-400 text-white font-semibold shadow-md ring-1 ring-orange-500 animate-pulse-once';
          hoverClass = 'hover:scale-[1.02] hover:ring-2 hover:ring-orange-500';
        } else {
          apptClass = 'bg-[#159A7D] text-white font-semibold shadow-md ring-1 ring-[#107e66]';
          hoverClass = 'hover:scale-[1.02] hover:ring-2 hover:ring-[#107e66]';
        }
      }

      cells.push(
        <div
          key={day}
          className={`relative group text-center p-2 rounded-lg cursor-default transition-all duration-200 h-10 flex items-center justify-center 
                      ${bgClass} ${apptClass} ${hoverClass} ${appt ? 'z-10' : 'z-0'}`}
        >
          {day}
          {appt && (
            <div
              className="absolute opacity-0 group-hover:opacity-100 transform group-hover:-translate-y-2 transition-all duration-300
              top-10 left-1/2 -translate-x-1/2 w-64
              bg-white/95 backdrop-blur-md text-gray-900 text-xs rounded-xl shadow-2xl border border-gray-200 p-4 z-[100]"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}
            >
              <p className="font-bold text-[#159A7D] text-sm border-b pb-1 mb-1">{appt.doctor}</p>
              <p className="text-gray-600">{appt.specialty}</p>
              <p className="mt-2 font-medium bg-[#159A7D]/10 text-[#159A7D] px-2 py-0.5 rounded-full inline-block">{appt.time}</p>
              <p className="text-gray-500 mt-1">{appt.address}</p>
              {appt.cancelled && <p className="text-red-600 mt-2 font-bold bg-red-100 p-1 rounded-lg">Appointment Cancelled</p>}
            </div>
          )}
        </div>
      );
    }

    return cells;
  }, [currentDate, appointments]);

  return (
    <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/70 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-300">
        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-200 text-gray-700 hover:text-[#159A7D]">
          ‹
        </button>
        <div className="flex items-center text-xl font-extrabold text-gray-800 tracking-wide">
          <CalendarIcon className="w-6 h-6 mr-2 text-[#159A7D]" />
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-200 text-gray-700 hover:text-[#159A7D]">
          ›
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <RefreshCw className="w-8 h-8 text-[#159A7D] animate-spin" />
          <p className="text-gray-500 ml-3 text-lg font-medium">Loading schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 flex-grow overflow-auto">{renderCalendar()}</div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-2 font-medium">
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1 shadow-sm"></span> Past</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-1 shadow-sm"></span> Near (3 Days)</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#159A7D] mr-1 shadow-sm"></span> Future</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-200 ring-2 ring-blue-400 mr-1 shadow-sm"></span> Today</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-1 shadow-sm"></span> Cancelled</span>
      </div>
    </div>
  );
};

// ======================
// MAIN COMPONENT
// ======================
const Day = () => {
  const [isAppMinimized, setIsAppMinimized] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const notificationClasses = useMemo(() => {
    if (!notification) return '';
    return notification.type === 'error'
      ? 'bg-red-600 border-red-800'
      : 'bg-[#159A7D] border-[#107e66]';
  }, [notification]);

  return (
    <div
      className="relative font-sans p-4 bg-gray-50"
      style={{
        backgroundImage:
          'radial-gradient(at 80% 80%, #E0F2F1 0%, transparent 50%), radial-gradient(at 0% 0%, #D1C4E9 0%, transparent 50%)',
        backgroundBlendMode: 'multiply',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        @keyframes pulse-once { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        .animate-pulse-once { animation: pulse-once 1.5s ease-in-out infinite; }
      `}</style>

      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 px-6 rounded-xl text-white shadow-2xl z-50 transition-all duration-300 transform border-b-4 ${notificationClasses}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 opacity-80 hover:opacity-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-11/12 md:w-3/4 lg:w-3/5 xl:w-2/3 max-w-5xl h-4/5 md:h-[650px]
          p-8 font-sans z-40 rounded-3xl shadow-3xl ring-4 ring-white/50
          transition-all duration-500 ease-in-out
          ${isAppMinimized ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 pointer-events-auto scale-100'}
          bg-white/70 backdrop-blur-lg`}
      >
        <div className="flex justify-between items-center mb-8 pb-3 border-b border-gray-300">
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-[#159A7D]" />
            Personal Day Tracker
          </h1>
          <button
            onClick={() => setIsAppMinimized(true)}
            className="p-3 text-gray-600 hover:text-gray-900 rounded-full bg-white hover:bg-gray-100 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full h-[calc(100%-90px)]">
          <div className="md:w-1/3 w-full h-1/3 md:h-full">
            <DigitalTime />
          </div>
          <div className="md:w-2/3 w-full flex-1 h-2/3 md:h-full">
            <Calendar setNotification={setNotification} />
          </div>
        </div>
      </div>

      {isAppMinimized && (
        <button
          onClick={() => setIsAppMinimized(false)}
          className="fixed left-4 bottom-4 md:bottom-auto md:top-1/2 -translate-y-1/2 bg-[#159A7D] text-white p-5 rounded-full shadow-2xl ring-4 ring-white hover:shadow-3xl transform hover:scale-105 transition-all duration-300 z-50"
        >
          <CalendarIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Day;
