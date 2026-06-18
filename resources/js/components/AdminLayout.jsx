import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileDropdown from './ProfileDropdown';

// Define SVG icons as components
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75m-18 0v4.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-4.5m-18 0h18" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const GalleryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const EventsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const AnnouncementsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.148-6.354A1.76 1.76 0 015.583 11H9.42a1.76 1.76 0 011.595.928l.606 1.819z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.148-6.354A1.76 1.76 0 019.583 11H13.42a1.76 1.76 0 011.595.928l.606 1.819z" />
    </svg>
);

const RequestsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
    </svg>
);

const MinistryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-5.197-5.197" />
    </svg>
);

const MassScheduleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#CD8B3E">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 3000));
    try {
      const csrfResponse = await fetch('/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('userLogout'));
      await minWait;
      setLoggingOut(false);
      navigate('/login');
    } catch (err) {
      alert('Logout failed.');
      setLoggingOut(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        DashboardIcon={<DashboardIcon />}
        UsersIcon={<UsersIcon />}
        GalleryIcon={<GalleryIcon />}
        EventsIcon={<EventsIcon />}
        AnnouncementsIcon={<AnnouncementsIcon />}
        RequestsIcon={<RequestsIcon />}
        MinistryIcon={<MinistryIcon />}
        MassScheduleIcon={<MassScheduleIcon />}
        AnalyticsIcon={<EventsIcon />}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      
      {/* Header bar */}
      <div style={{
        position: 'fixed',
        top: '0px',
        left: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isSidebarCollapsed ? '0' : '250px') : '0'),
        right: '0px',
        height: '60px',
        background: '#DED0B6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px 16px',
        zIndex: 2999,
        borderBottom: '1px solid rgb(229, 231, 235)',
        transition: 'left 0.2s'
      }}>
        {/* Hamburger menu - only visible in mobile view */}
        {window.innerWidth <= 768 && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
        )}
        
        {/* Empty space when hamburger is hidden (desktop view) */}
        {window.innerWidth > 768 && <div></div>}
        
        {/* Profile icon */}
        <ProfileDropdown user={null} onLogout={handleLogout} />
      </div>
      
      <div style={{ 
        flex: 1, 
        padding: '1rem',
        marginLeft: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isSidebarCollapsed ? '0' : '250px') : '0'),
        marginTop: '60px', // Add top margin to account for header
        transition: 'margin-left 0.2s',
        minHeight: 'calc(100vh - 60px)', // Adjust minHeight to account for header
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: window.innerWidth > 768 && isSidebarCollapsed ? 'center' : 'flex-start',
        alignItems: 'flex-start'
      }}>
        {children}
      </div>
      
      {loggingOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}>
            <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>Logging out...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
