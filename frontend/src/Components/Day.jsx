import React, { useState, useEffect } from 'react';

// Main App component that combines the DigitalTime and Calendar
const Day = () => {
  const [isAppMinimized, setIsAppMinimized] = useState(true); // Change this from false to true

  return (
    <>
      {/* The main container for the app, acting as a fixed window */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl
                    p-4 font-inter z-40 rounded-2xl shadow-2xl
                    transition-all duration-500 ease-in-out
                    ${isAppMinimized ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 pointer-events-auto scale-100'}
                    bg-white bg-opacity-62` /* Apply transparency to the window background */}>

        {/* Centralized Minimize Button for the entire app */}
        <button
          onClick={() => setIsAppMinimized(true)} // This button only minimizes
          className="absolute top-4 right-4 p-2 text-black hover:text-gray-700 focus:outline-none transition-transform duration-300 z-50 rounded-full bg-gray-200 hover:bg-gray-300 shadow-md"
          aria-label="Minimize app"
        >
          <svg
            className="w-6 h-6 transform rotate-0" // Always a 'V' pointing down to minimize
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {/* Render time and calendar when not minimized */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
          {/* Digital Time Component */}
          <div className="p-6 rounded-xl flex-1 w-full md:w-auto">
            <DigitalTime />
          </div>
          {/* Calendar Component */}
          <div className="p-6 rounded-xl flex-1 w-full md:w-auto">
            <Calendar />
          </div>
        </div>
      </div>

      {/* Render a small restore icon when minimized */}
      {isAppMinimized && (
        <button
          onClick={() => setIsAppMinimized(false)} // This button only maximizes
          className="fixed left-4 top-1/2 -translate-y-1/2 bg-[#159A7D] text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#159A7D] focus:ring-opacity-50 z-50"
          aria-label="Restore app"
          title="Restore App"
        >
          {/* Calendar Icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </button>
      )}
    </>
  );
};

// DigitalTime Component: Displays the current time
const DigitalTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-[#159A7D] tracking-wide">
        {formatTime(time)}
      </div>
    </div>
  );
};

// Calendar Component: Displays the current month's calendar and integrates Gemini API for event ideas
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventIdeas, setEventIdeas] = useState(''); // Stores raw LLM response (bulleted list)
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false); // Loading for ideas
  const [errorIdeas, setErrorIdeas] = useState(null); // Error for ideas

  const [selectedEventIdea, setSelectedEventIdea] = useState(null); // Stores the specific idea chosen for planning
  const [detailedPlan, setDetailedPlan] = useState(''); // Stores the detailed plan from LLM
  const [isLoadingPlan, setIsLoadingPlan] = useState(false); // Loading for plan
  const [errorPlan, setErrorPlan] = useState(null); // Error for plan


  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    setEventIdeas(''); // Clear previous ideas
    setErrorIdeas(null); // Clear previous errors
    setSelectedEventIdea(null); // Clear selected idea
    setDetailedPlan(''); // Clear previous plan
    setErrorPlan(null); // Clear previous plan error
  };

  // Function to call the Gemini API for event ideas
  const getGeminiEventIdeas = async () => {
    if (!selectedDate) {
      setErrorIdeas("Please select a date first!");
      return;
    }

    setIsLoadingIdeas(true);
    setEventIdeas('');
    setErrorIdeas(null);
    setSelectedEventIdea(null); // Reset selected idea on new idea generation
    setDetailedPlan(''); // Reset detailed plan
    setErrorPlan(null); // Reset plan error

    const prompt = `Suggest 3-5 creative and fun event ideas for ${selectedDate.toDateString()}. Consider various types of activities (indoor, outdoor, relaxing, active). Format them as a bulleted list.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setEventIdeas(text);
      } else {
        setErrorIdeas("Could not generate event ideas. Please try again.");
      }
    } catch (err) {
      console.error("Error calling Gemini API for ideas:", err);
      setErrorIdeas(`Failed to fetch event ideas: ${err.message}`);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // Function to call the Gemini API for a detailed plan for a selected event idea
  const getGeminiDetailedPlan = async () => {
    if (!selectedEventIdea) {
      setErrorPlan("Please select an event idea to plan first!");
      return;
    }

    setIsLoadingPlan(true);
    setDetailedPlan('');
    setErrorPlan(null);

    const prompt = `Create a detailed plan for the event: "${selectedEventIdea}". Include a few key steps, any necessary items or preparations, and a rough time estimate for each step. Format it as a clear, easy-to-read list or short paragraphs.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setDetailedPlan(text);
      } else {
        setErrorPlan("Could not generate detailed plan. Please try again.");
      }
    } catch (err) {
      console.error("Error calling Gemini API for plan:", err);
      setErrorPlan(`Failed to fetch detailed plan: ${err.message}`);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Function to render the calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const calendarCells = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekdays.forEach(day => {
      calendarCells.push(
        <div key={day} className="font-bold text-gray-700 p-2 text-center border-b border-gray-200">
          {day}
        </div>
      );
    });

    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === todayDay && month === todayMonth && year === todayYear;
      const isSelected = selectedDate &&
                           day === selectedDate.getDate() &&
                           month === selectedDate.getMonth() &&
                           year === selectedDate.getFullYear();

      calendarCells.push(
        <div
          key={`day-${day}`}
          className={`p-2 text-center rounded-md transition-colors duration-200 cursor-pointer
            ${isToday ? 'bg-[#E0F2EF] text-[#0F6F57] font-semibold shadow-inner' : ''}
            ${isSelected ? 'bg-purple-200 text-purple-800 font-bold border-2 border-purple-500' : 'hover:bg-gray-50'}`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    return calendarCells;
  };

  return (
    <div className="text-center">
      <div className="bg-[#159A7D] text-white p-4 rounded-t-lg text-xl font-bold mb-4 shadow-md">
        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {renderCalendar()}
      </div>

      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <p className="text-lg font-medium text-gray-700 mb-3">
            Selected Date: <span className="font-bold text-[#159A7D]">{selectedDate.toDateString()}</span>
          </p>
          <button
            onClick={getGeminiEventIdeas}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            disabled={isLoadingIdeas}
          >
            {isLoadingIdeas ? 'Generating Ideas...' : '✨ Get Event Ideas ✨'}
          </button>

          {errorIdeas && (
            <p className="text-red-600 mt-4 text-sm">{errorIdeas}</p>
          )}

          {eventIdeas && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Event Ideas:</h3>
              <div className="prose prose-sm max-w-none">
                {/* Split ideas by newline and render each as selectable */}
                {eventIdeas.split('\n').filter(line => line.trim() !== '').map((idea, index) => (
                  <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <p className="text-gray-700">{idea}</p>
                    <button
                      onClick={() => setSelectedEventIdea(idea.replace(/^- /, '').trim())} // Clean idea for selection
                      className={`ml-2 px-3 py-1 text-xs rounded-full transition-colors duration-200
                        ${selectedEventIdea === idea.replace(/^- /, '').trim() ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {selectedEventIdea === idea.replace(/^- /, '').trim() ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEventIdea && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
              <p className="text-lg font-medium text-gray-700 mb-3">
                Selected Event: <span className="font-bold text-purple-600">{selectedEventIdea}</span>
              </p>
              <button
                onClick={getGeminiDetailedPlan}
                className="bg-gradient-to-r from-teal-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                disabled={isLoadingPlan}
              >
                {isLoadingPlan ? 'Generating Plan...' : '✨ Get Detailed Plan ✨'}
              </button>

              {errorPlan && (
                <p className="text-red-600 mt-4 text-sm">{errorPlan}</p>
              )}

              {detailedPlan && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-left">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Detailed Plan:</h3>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detailedPlan.replace(/\n/g, '<br/>') }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Day;