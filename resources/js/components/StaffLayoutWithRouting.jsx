import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { performLogout } from '../utils/logout';
import StaffSidebar from './StaffSidebar';
import ProfileDropdown from './ProfileDropdown';

// Import staff page components
import StaffDashboardContent from '../pages/STAFF/StaffDashboardContent';
import StaffProfile from '../pages/STAFF/StaffProfile';
import StaffRecords from '../pages/STAFF/StaffRecords';
import StaffMortuary from '../pages/STAFF/StaffMortuary';
import StaffCertificates from '../pages/STAFF/StaffCertificates';
import StaffSacraments from '../pages/STAFF/StaffSacraments';
import StaffGive from '../pages/STAFF/StaffGive';
import PriestCalendar from '../pages/STAFF/PriestCalendar';

// SVG icons for staff sidebar
const DashboardIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75m-18 0v4.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-4.5m-18 0h18" />
  </svg>
);

const MortuaryIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
);

const CertificateIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const SacramentIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const CalendarIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
  </svg>
);

const StaffLayoutWithRouting = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeSection with current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/staff/')) {
      const section = path.split('/staff/')[1];
      if (section) {
        setActiveSection(section);
      }
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await performLogout(navigate, setLoggingOut);
  };

  // Render the appropriate component based on the current route
  const renderContent = () => {
    const path = location.pathname;
    
    if (path === '/staff/dashboard') {
      return <StaffDashboardContent />;
    } else if (path === '/staff/profile') {
      return <StaffProfile />;
    } else if (path === '/staff/parish-records') {
      return <StaffRecords />;
    } else if (path === '/staff/mortuary') {
      return <StaffMortuary />;
    } else if (path === '/staff/certificates') {
      return <StaffCertificates />;
    } else if (path === '/staff/sacraments') {
      return <StaffSacraments />;
    } else if (path === '/staff/give') {
      return <StaffGive />;
    } else if (path === '/staff/priest-calendar') {
      return <PriestCalendar />;
    }
    
    // Default to dashboard if no specific route matches
    return <StaffDashboardContent />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <StaffSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        DashboardIcon={DashboardIcon}
        MortuaryIcon={MortuaryIcon}
        CertificateIcon={CertificateIcon}
        SacramentIcon={SacramentIcon}
      />
      
      {/* Header bar */}
      <div style={{
        position: 'fixed',
        top: '0px',
        left: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isSidebarCollapsed ? '0' : '250px') : '0'),
        right: '0px',
        height: '60px',
        background: '#806c4b',
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
        marginLeft: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isSidebarCollapsed ? '80px' : '250px') : '0'),
        marginTop: '60px',
        transition: 'margin-left 0.2s',
        minHeight: 'calc(100vh - 60px)',
        background: '#f8f9fa'
      }}>
        {renderContent()}
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

export default StaffLayoutWithRouting;
