import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper functions
function getEventsForDate(date, schedules) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  return schedules.filter(s => {
    const scheduleDatePart = s.date.includes('T') ? s.date.split('T')[0] : s.date;
    return scheduleDatePart === formattedDate;
  });
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  let dayOfWeek = firstDay.getDay();
  
  // Fill initial empty days
  for (let i = 0; i < dayOfWeek; i++) week.push(null);
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  
  return matrix;
}

function formatDateForComparison(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function formatTime(timeString) {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

const Calendar = () => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/calendar-events');
      setCalendarEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const monthMatrix = getMonthMatrix(year, month);
  const eventDates = calendarEvents.map(event => {
    const eventDate = event.date.includes('T') ? event.date.split('T')[0] : event.date;
    return eventDate;
  });

  const selectedDateEvents = getEventsForDate(selectedDate, calendarEvents);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DED0B6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CD8B3E] mx-auto mb-4"></div>
          <p className="text-[#5C4B38]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DED0B6] pt-40 pb-8">
      <div className="max-w-full mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="text-[#CD8B3E] px-4 py-2 rounded-lg hover:bg-[#FFF6E5] transition-colors font-semibold"
                >
                  &lt; Previous
                </button>
                <h2 className="text-2xl font-bold text-[#3F2E1E]">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="text-[#CD8B3E] px-4 py-2 rounded-lg hover:bg-[#FFF6E5] transition-colors font-semibold"
                >
                  Next &gt;
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 bg-[#FFF6E5] rounded-lg p-2 border border-[#f2e4ce]">
                {/* Day headers */}
                {dayNames.map(day => (
                  <div key={day} className="text-center text-[#CD8B3E] font-bold py-2 text-sm">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthMatrix.map((week, i) =>
                  week.map((date, j) => {
                    if (!date) {
                      return <div key={i + '-' + j} className="h-16"></div>;
                    }

                    const dateStr = formatDateForComparison(date);
                    const dayEvents = getEventsForDate(date, calendarEvents);
                    const hasEvent = dayEvents.length > 0;
                    const hasMass = dayEvents.some(event => event.type === 'mass');
                    const hasRegularEvent = dayEvents.some(event => event.type === 'event');
                    const isToday = isSameDay(date, today);
                    const isSelected = isSameDay(date, selectedDate);

                    return (
                      <button
                        key={i + '-' + j}
                        className={`h-16 w-full flex flex-col items-center justify-center rounded-lg border transition-all duration-200 relative
                          ${date ? 'bg-white hover:bg-[#DED0B6] border-[#f2e4ce]' : 'bg-transparent border-transparent'}
                          ${isToday ? 'ring-2 ring-[#CD8B3E] font-bold' : ''}
                          ${isSelected ? 'bg-[#CD8B3E] text-white font-bold ring-2 ring-[#CD8B3E] ring-offset-2' : 'text-[#3F2E1E]'}
                        `}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="text-sm">{date.getDate()}</span>
                        {hasEvent && (
                          <div className="mt-1 flex gap-1">
                            {hasMass && (
                              <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${isSelected ? 'bg-[#5C4B38]' : 'bg-[#5C4B38] hover:bg-[#8B6B46]'}`}></span>
                            )}
                            {hasRegularEvent && (
                              <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${isSelected ? 'bg-[#CD8B3E]' : 'bg-[#CD8B3E] hover:bg-[#B87A35]'}`}></span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Events Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-[#3F2E1E] mb-4">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>

              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[#5C4B38]">No events scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((event, index) => (
                    <div key={index} className="bg-[#FFF6E5] border border-[#f3ddbe] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[#3F2E1E] text-lg">
                          {event.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.type === 'mass' 
                            ? 'bg-[#5C4B38] text-white' 
                            : 'bg-[#CD8B3E] text-white'
                        }`}>
                          {event.type === 'mass' ? 'Mass' : 'Event'}
                        </span>
                      </div>
                      
                      {event.time && (
                        <p className="text-sm text-[#5C4B38] mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(event.time)}
                        </p>
                      )}
                      
                      {event.location && (
                        <p className="text-sm text-[#5C4B38] mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </p>
                      )}
                      
                      {event.description && (
                        <p className="text-sm text-[#6B4E2E] mb-2">{event.description}</p>
                      )}
                      
                      {event.celebrant && (
                        <p className="text-sm text-[#8B6B46] italic">
                          Celebrant: {event.celebrant}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;