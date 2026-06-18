import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/staffSidebar.css';
import { api } from '../utils/axios';
import ProfileDropdown from './ProfileDropdown';

const StaffSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  handleLogout,
  DashboardIcon,
  MortuaryIcon,
  CertificateIcon,
  SacramentIcon,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCertificates, setPendingCertificates] = useState(0);
  const [pendingSacraments, setPendingSacraments] = useState(0);
  const [unverifiedDonations, setUnverifiedDonations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Handle mobile responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, show expanded view when sidebar is open (like admin)
        setIsCollapsed(false);
      }
    };

    // Set initial state based on screen size
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sync activeSection with current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/staff/')) {
      const section = path.split('/staff/')[1];
      if (section && navItems.some(item => item.key === section)) {
        setActiveSection(section);
      } else {
        setActiveSection('dashboard');
      }
    }
  }, [location.pathname, setActiveSection]);

  useEffect(() => {
    // Fetch pending certificate requests count
    const fetchPendingCertificates = async () => {
      try {
        const response = await api.get('/certificate-requests');
        let certificates = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          certificates = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          certificates = response.data.data;
        } else if (response.data && Array.isArray(response.data.certificates)) {
          certificates = response.data.certificates;
        }
        
        // Count certificates with 'pending' status
        const pendingCount = certificates.filter(cert => 
          cert && (cert.status === 'pending' || cert.status === 'Pending')
        ).length;
        
        setPendingCertificates(pendingCount);
      } catch (error) {
        console.warn('Failed to fetch certificate requests:', error);
        setPendingCertificates(0);
      }
    };

    // Fetch pending sacrament appointments count
    const fetchPendingSacraments = async () => {
      try {
        const response = await api.get('/staff/sacrament-appointments');
        let appointments = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          appointments = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          appointments = response.data.data;
        } else if (response.data && Array.isArray(response.data.appointments)) {
          appointments = response.data.appointments;
        }
        
        // Count appointments with 'pending' status
        const pendingCount = appointments.filter(appointment => 
          appointment && (appointment.status === 'pending' || appointment.status === 'Pending')
        ).length;
        
        setPendingSacraments(pendingCount);
      } catch (error) {
        console.warn('Failed to fetch sacrament appointments:', error);
        setPendingSacraments(0);
      }
    };

    // Fetch unverified donations count
    const fetchUnverifiedDonations = async () => {
      try {
        const response = await api.get('/donations');
        let donations = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          donations = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          donations = response.data.data;
        } else if (response.data && Array.isArray(response.data.donations)) {
          donations = response.data.donations;
        }
        
        // Count donations that are not verified (more comprehensive checking)
        const unverifiedCount = donations.filter(donation => 
          donation && (
            donation.verified === false || 
            donation.verified === 0 || 
            donation.verified === '0' ||
            donation.verified === null ||
            donation.verified === undefined ||
            donation.status === 'pending' ||
            donation.status === 'Pending'
          )
        ).length;
        
        setUnverifiedDonations(unverifiedCount);
      } catch (error) {
        console.warn('Failed to fetch donations:', error);
        setUnverifiedDonations(0);
      }
    };

    // Initial load
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPendingCertificates(),
        fetchPendingSacraments(),
        fetchUnverifiedDonations()
      ]);
      setIsLoading(false);
    };
    
    loadAllData();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchPendingCertificates();
      fetchPendingSacraments();
      fetchUnverifiedDonations();
    }, 30000);
    
    // Listen for updates
    window.addEventListener('certificateRequestUpdated', fetchPendingCertificates);
    window.addEventListener('sacramentAppointmentUpdated', fetchPendingSacraments);
    window.addEventListener('donationVerified', fetchUnverifiedDonations);
    window.addEventListener('donationsUpdated', fetchUnverifiedDonations);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('certificateRequestUpdated', fetchPendingCertificates);
      window.removeEventListener('sacramentAppointmentUpdated', fetchPendingSacraments);
      window.removeEventListener('donationVerified', fetchUnverifiedDonations);
      window.removeEventListener('donationsUpdated', fetchUnverifiedDonations);
    };
  }, []);

  const CalendarIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="rgba(0,0,0,0.1)" stroke="#000000"/>
      <path d="M16 3v4M8 3v4M3 9h18" stroke="#000000"/>
      <circle cx="8" cy="13" r="1.2" fill="#000000"/>
      <circle cx="12" cy="13" r="1.2" fill="#000000"/>
      <circle cx="16" cy="13" r="1.2" fill="#000000"/>
    </svg>
  );
  
  const navItems = [
    { key: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { key: 'mortuary', icon: MortuaryIcon, label: 'Mortuary' },
    { key: 'certificates', icon: CertificateIcon, label: 'Certificates', badge: pendingCertificates },
    { key: 'sacraments', icon: SacramentIcon, label: 'Appointments', badge: pendingSacraments },
    { key: 'give', icon: <svg width="22" height="22" fill="none" stroke="#000000" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s9-4.5 9-12a4.5 4.5 0 0 0-9-3.5A4.5 4.5 0 0 0 3 9c0 7.5 9 12 9 12z"/></svg>, label: 'Give', badge: unverifiedDonations },
    { key: 'priest-calendar', icon: CalendarIcon, label: 'Priest Calendar' },
  ];

  return (
  <>
      {/* Desktop Header */}
      <div className="desktop-header" style={{
        position: 'fixed',
        top: '0px',
        left: window.innerWidth <= 768 ? '0' : (sidebarOpen ? (isCollapsed ? '80px' : '250px') : '0'),
        right: '0px',
        height: '60px',
        background: '#806c4b',
        display: window.innerWidth <= 768 ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px 16px',
        zIndex: 2999,
        borderBottom: '1px solid rgb(229, 231, 235)',
        transition: 'left 0.2s'
      }}>
        {/* Empty space on the left */}
        <div></div>
        
        {/* Profile icon */}
        <ProfileDropdown user={null} onLogout={handleLogout} />
      </div>

      {/* Mobile Header */}
      <div className="mobile-header">
        {/* Hamburger Menu Icon */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setSidebarOpen(!sidebarOpen);
            } else {
              // On desktop, toggle sidebar open/closed
              setSidebarOpen(!sidebarOpen);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Toggle sidebar"
        >
          <div style={{
            width: '24px',
            height: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div className="hamburger-line" style={{
              width: '100%',
              height: '2px',
              background: '#8B4513',
              borderRadius: '1px'
            }}></div>
            <div className="hamburger-line" style={{
              width: '100%',
              height: '2px',
              background: '#8B4513',
              borderRadius: '1px'
            }}></div>
            <div className="hamburger-line" style={{
              width: '100%',
              height: '2px',
              background: '#8B4513',
              borderRadius: '1px'
            }}></div>
          </div>
        </button>

        {/* Profile Icon */}
        <ProfileDropdown user={null} onLogout={handleLogout} />
      </div>

      {/* Hamburger menu for mobile view when sidebar is closed */}
      {!sidebarOpen && window.innerWidth >= 768 && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="sidebar-toggle"
          title="Open sidebar"
          style={{
            display: 'block',
            position: 'fixed',
            left: 16,
            top: 16,
            zIndex: 3000,
            background: '#CD8B3E',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ fontSize: 28 }}>&#9776;</span>
        </button>
      )}
      
      <aside 
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isCollapsed && !isHovering ? 'collapsed' : ''}`}
        style={{
          width: window.innerWidth < 768 
            ? '280px' // Fixed width on mobile (overlay behavior)
            : (isCollapsed && !isHovering ? '80px' : sidebarOpen ? '250px' : '0px'), // Desktop behavior
          transform: window.innerWidth < 768 
            ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') // Overlay on mobile
            : 'translateX(0)', // No transform on desktop
          transition: window.innerWidth < 768 
            ? 'transform 0.3s ease-in-out' // Smooth slide animation on mobile
            : 'width 0.3s ease', // Width transition on desktop
           zIndex: window.innerWidth < 768 ? 9999 : 3000, // Higher z-index for sidebar on desktop, very high on mobile
          top: '0px', // Always start from top to overlay header on mobile
          backgroundColor: '#806c4b', // Ensure sidebar background color
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
      {/* Mobile X close button or Desktop toggle switch */}
      {sidebarOpen && (
        <div 
          onClick={() => {
            // Check if mobile view (screen width < 768px)
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          style={{
            width: '36px',
            height: '20px',
            background: window.innerWidth < 768 ? '#CD8B3E' : (isCollapsed ? '#CD8B3E' : '#e5e7eb'),
            borderRadius: '10px',
            position: 'absolute',
            right: 12,
            top: 20,
            zIndex: 2002,
            cursor: 'pointer',
            transition: 'background 0.3s ease',
            display: window.innerWidth < 768 ? 'flex' : (!isCollapsed || isHovering ? 'flex' : 'none'),
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          {window.innerWidth < 768 ? (
            <span style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>×</span>
          ) : (
            <div style={{
              width: '16px',
              height: '16px',
              background: '#fff',
              borderRadius: '8px',
              position: 'absolute',
              top: '2px',
              left: isCollapsed ? '18px' : '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
            <div className="sidebar-main-title" style={{ color: '#ffffff' }}>DIOCESAN SHRINE OF</div>
            <div className="sidebar-subtitle" style={{
              fontFamily: "'Perpetua', 'Times New Roman', serif",
              color: '#edd9ab'
            }}>SAN VICENTE FERRER</div>
            <div className="sidebar-location" style={{ color: '#ffffff' }}>Brgy. Mamatid, Cabuyao, Laguna</div>
          </div>
        </div>
      )}
      <div className="sidebar-welcome" style={{
        display: window.innerWidth < 768 ? 'flex' : (isCollapsed && !isHovering ? 'none' : 'flex'),
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        margin: '0 auto',
        padding: '12px 20px',
        background: 'transparent'
      }}>
        <span style={{
          fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
          fontWeight: '600',
          fontSize: '14px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: '#edd9ab',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>Welcome Staff!</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setActiveSection(item.key);
              // Navigate to the appropriate staff route
              const path = `/staff/${item.key}`;
              navigate(path);
            }}
            className={`sidebar-nav-item ${activeSection === item.key ? 'active' : ''}`}
            title={item.label}
            style={{
              justifyContent: window.innerWidth < 768 ? 'flex-start' : (isCollapsed && !isHovering ? 'center' : 'flex-start'),
              padding: window.innerWidth < 768 ? '12px 20px' : (isCollapsed && !isHovering ? '12px 0' : '12px 20px'),
              textAlign: window.innerWidth < 768 ? 'left' : (isCollapsed && !isHovering ? 'center' : 'left')
            }}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {sidebarOpen && (window.innerWidth < 768 || !(isCollapsed && !isHovering)) && <span className="sidebar-nav-label">{item.label}</span>}
            {item.badge > 0 && (
              <span className={`sidebar-nav-badge ${isLoading ? 'loading' : ''}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
    </>
  );
};

export default StaffSidebar;