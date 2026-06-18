import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileDropdown from '../../components/ProfileDropdown';
import { performLogout } from '../../utils/logout';
import Events from '../GUEST/events';
import News from '../GUEST/News';
import '../../../css/staffSidebar.css';

function getEventsForDate(date, schedules) {
  // Format date without timezone conversion to avoid date shifts
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const d = `${year}-${month}-${day}`;
  
  console.log('getEventsForDate:', { 
    selectedDate: date, 
    formattedDate: d, 
    oldISOMethod: date.toISOString().split('T')[0],
    scheduleCount: schedules.length 
  });
  
  const events = schedules.filter(s => {
    const scheduleDatePart = s.date.includes('T') ? s.date.split('T')[0] : s.date;
    const matches = scheduleDatePart === d;
    if (matches) {
      console.log('Found matching event:', { scheduleDatePart, formattedDate: d, event: s });
    }
    return matches;
  });
  
  console.log('getEventsForDate result:', { eventsFound: events.length });
  return events;
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

const PriestDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [priestSchedule, setPriestSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState('mass-schedule');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const events = getEventsForDate(selectedDate, priestSchedule);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user || !(user.is_priest === 1 || user.is_priest === true || user.is_priest === "1")) {
        navigate('/');
      } else {
        // Fetch priest's schedule when user is confirmed as priest
        fetchPriestSchedule();
      }
    }
  }, [user, loading, navigate]);

  // Fetch schedule when month changes
  useEffect(() => {
    if (user && user.is_priest) {
      fetchPriestSchedule();
    }
  }, [currentMonth]);

  const fetchPriestSchedule = async () => {
    if (!user) return;
    
    setScheduleLoading(true);
    try {
      const token = localStorage.getItem('token');
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Fix: Calculate last day of month correctly
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const response = await axios.get('/api/priest/my-schedule', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
          end_date: endDate
        }
      });

      if (response.data.success) {
        // Transform the schedule data to match the expected format
        const transformedSchedule = response.data.data.schedule.map(entry => ({
          date: entry.date.includes('T') ? entry.date.split('T')[0] : entry.date, // Extract just the date part
          event: `${entry.duty} - ${entry.time.substring(0, 5)}`,
          id: entry.id,
          notes: entry.notes,
          status: entry.status
        }));
        setPriestSchedule(transformedSchedule);
      }
    } catch (error) {
      console.error('Error fetching priest schedule:', error);
      // If there's an authentication error, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    } finally {
      setScheduleLoading(false);
    }
  };

  if (loading) return null; // or a spinner

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthMatrix = getMonthMatrix(year, month);
  const today = new Date();

  // Get all event dates for the month
  const eventDates = priestSchedule
    .filter(e => {
      // Parse date without timezone conversion
      const datePart = e.date.includes('T') ? e.date.split('T')[0] : e.date;
      const [dateYear, dateMonth, dateDay] = datePart.split('-').map(Number);
      return dateYear === year && (dateMonth - 1) === month;
    })
    .map(e => e.date.includes('T') ? e.date.split('T')[0] : e.date); // Return just the date part

  const isSameDay = (d1, d2) =>
    d1 && d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    // Format date without timezone conversion to avoid date shifts
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const result = `${month}/${day}/${year}`;
    console.log('Priest Dashboard formatDateForDisplay:', { 
      input: date, 
      month, 
      day, 
      year, 
      output: result,
      oldMethod: date.toLocaleDateString()
    });
    return result;
  };

  const formatDateForComparison = (date) => {
    if (!date) return '';
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-0" style={{ backgroundColor: '#f7f3ed' }}>
      {/* Sidebar styled like StaffSidebar */}
      <aside 
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isCollapsed && !isHovering ? 'collapsed' : ''}`}
        style={{
          width: window.innerWidth < 768 
            ? '280px' 
            : (isCollapsed && !isHovering ? '80px' : sidebarOpen ? '250px' : '0px'),
          transform: window.innerWidth < 768 
            ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
            : 'translateX(0)',
          transition: window.innerWidth < 768 ? 'transform 0.3s ease-in-out' : 'width 0.3s ease',
          zIndex: window.innerWidth < 768 ? 9999 : 3000,
          top: '0px'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {sidebarOpen && (
          <div 
            onClick={() => {
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            style={{
              width: '36px', height: '20px',
              background: window.innerWidth < 768 ? '#CD8B3E' : (isCollapsed ? '#CD8B3E' : '#e5e7eb'),
              borderRadius: '10px', position: 'absolute', right: 12, top: 20,
              zIndex: 2002, cursor: 'pointer', transition: 'background 0.3s ease',
              display: window.innerWidth < 768 ? 'flex' : (!isCollapsed || isHovering ? 'flex' : 'none'),
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            {window.innerWidth < 768 ? (
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>×</span>
            ) : (
              <div style={{
                width: '16px', height: '16px', background: '#fff', borderRadius: '8px', position: 'absolute',
                top: '2px', left: isCollapsed ? '18px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s ease, left 0.3s ease'
              }} />
            )}
          </div>
        )}

        {sidebarOpen && (
          <div className="sidebar-header" style={{
            display: window.innerWidth < 768 ? 'block' : (isCollapsed && !isHovering ? 'none' : 'block'),
            paddingTop: '20px'
          }}>
            <div className="sidebar-title-container">
              <div className="sidebar-main-title">DIOCESAN SHRINE OF</div>
              <div className="sidebar-subtitle" style={{ fontFamily: "'Perpetua', 'Times New Roman', serif" }}>SAN VICENTE FERRER</div>
              <div className="sidebar-location">Brgy. Mamatid, Cabuyao, Laguna</div>
            </div>
          </div>
        )}

        <div className="sidebar-welcome" style={{
          display: window.innerWidth < 768 ? 'flex' : (isCollapsed && !isHovering ? 'none' : 'flex'),
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%',
          margin: '0 auto', padding: '12px 20px', background: 'transparent'
        }}>
          <span style={{
            fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '600', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#8B4513',
            textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>Welcome Priest!</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { key: 'mass-schedule', label: 'Mass Schedule', icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>) },
            { key: 'news', label: 'News', icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                <path d="M9 7h6m-6 4h6m-2 5h2" />
              </svg>) },
            { key: 'events', label: 'Events', icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
                <rect x="3" y="5" width="18" height="16" rx="2" fill="#FFF6E5" stroke="#CD8B3E"/>
                <path d="M16 3v4M8 3v4M3 9h18" stroke="#CD8B3E"/>
                <path d="M8 13h4l1-1 1 1h4" stroke="#CD8B3E"/>
                <circle cx="8" cy="15" r="1.2" fill="#CD8B3E"/>
                <circle cx="12" cy="15" r="1.2" fill="#CD8B3E"/>
                <circle cx="16" cy="15" r="1.2" fill="#CD8B3E"/>
              </svg>) },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`sidebar-nav-item ${activeSection === item.key ? 'active' : ''}`}
              title={item.label}
              style={{
                justifyContent: window.innerWidth < 768 ? 'flex-start' : (isCollapsed && !isHovering ? 'center' : 'flex-start'),
                padding: window.innerWidth < 768 ? '12px 20px' : (isCollapsed && !isHovering ? '12px 0' : '12px 20px'),
                textAlign: window.innerWidth < 768 ? 'left' : (isCollapsed && !isHovering ? 'center' : 'left')
              }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {sidebarOpen && (window.innerWidth < 768 || !(isCollapsed && !isHovering)) && (
                <span className="sidebar-nav-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar toggle button when closed */}
      {!sidebarOpen && window.innerWidth >= 768 && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Open menu"
          style={{
            position: 'fixed', left: 16, top: 16, zIndex: 3001, background: '#CD8B3E', color: '#fff',
            border: 'none', borderRadius: '50%', width: 44, height: 44, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer'
          }}
        >
          ☰
        </button>
      )}
      {/* Top-right profile button like admin/staff */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <ProfileDropdown
          user={user}
          onLogout={async () => {
            await performLogout(navigate, setLoggingOut);
          }}
        />
      </div>

      {loggingOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 2999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>Logging out...</div>
          </div>
        </div>
      )}
      <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 rounded-2xl w-full max-w-6xl mt-32 min-h-[700px]" style={{
        marginLeft: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isCollapsed ? '80px' : '250px') : '0px'),
        transition: 'margin-left 0.2s ease'
      }}>
        {/* Section Switcher Content */}
        {activeSection === 'mass-schedule' && (
          <>
            <h1 className="text-4xl font-extrabold text-[#3F2E1E] mb-2 text-center font-['Times_New_Roman']">Liturgical Schedule</h1>
            <p className="text-[#5C4B38] text-center mb-6">View your assigned Masses and Church Duties</p>
            {scheduleLoading && (
              <div className="text-center mb-4">
                <span className="text-[#CD8B3E]">Loading schedule...</span>
              </div>
            )}
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-2">
              <button
                className="text-[#CD8B3E] px-3 py-1 rounded hover:bg-[#FFF6E5]"
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              >
                &lt;
              </button>
              <div className="text-xl font-bold text-[#3F2E1E]">
                {monthNames[month]} {year}
              </div>
              <button
                className="text-[#CD8B3E] px-3 py-1 rounded hover:bg-[#FFF6E5]"
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              >
                &gt;
              </button>
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 bg-[#FFF6E5] rounded-lg p-2 mb-6 border border-[#f2e4ce]">
              {dayNames.map(day => (
                <div key={day} className="text-center text-[#CD8B3E] font-bold py-1">{day}</div>
              ))}
              {monthMatrix.map((week, i) =>
                week.map((date, j) => {
                  const dateStr = date ? formatDateForComparison(date) : '';
                  const hasEvent = eventDates.includes(dateStr);
                  const isToday = date && isSameDay(date, today);
                  const isSelected = date && isSameDay(date, selectedDate);
                  return (
                    <button
                      key={i + '-' + j}
                      className={`h-16 w-full flex flex-col items-center justify-center rounded-lg border transition
                        ${date ? 'bg-white hover:bg-[#DED0B6] border-[#f2e4ce]' : 'bg-transparent border-transparent'}
                        ${isToday ? 'ring-2 ring-[#CD8B3E]' : ''}
                        ${isSelected ? 'bg-[#CD8B3E] text-white font-bold' : ''}
                      `}
                      disabled={!date}
                      onClick={() => date && setSelectedDate(date)}
                      style={{ cursor: date ? 'pointer' : 'default', position: 'relative' }}
                    >
                      <span>{date ? date.getDate() : ''}</span>
                      {hasEvent && date && (
                        <span className={`mt-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#CD8B3E]'}`}></span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {/* Events for selected day */}
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-[#3F2E1E] mb-2 text-center">Schedule for {formatDateForDisplay(selectedDate)}</h2>
              {events.length > 0 ? (
                <ul className="space-y-2">
                  {events.map((event, idx) => (
                    <li key={idx} className="bg-[#FFF6E5] border border-[#f3ddbe] p-4 rounded-lg text-center">
                      <div className="text-[#6B4E2E] font-semibold mb-1">{event.event}</div>
                      {event.notes && (
                        <div className="text-[#8B7355] text-sm italic">{event.notes}</div>
                      )}
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          event.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                          event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-400 italic">No liturgical schedule for this date.</p>
              )}
            </div>
          </>
        )}

        {activeSection === 'news' && (
          <div style={{ marginTop: 24 }}>
            <News />
          </div>
        )}

        {activeSection === 'events' && (
          <div style={{ marginTop: 24 }}>
            <Events />
          </div>
        )}
      </div>
    </div>
  );
};

export default PriestDashboard;
