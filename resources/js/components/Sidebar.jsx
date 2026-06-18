import React, { useEffect, useState, useCallback } from 'react';
import '../../css/Sidebar.css';
import '../../css/staffSidebar.css';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/axios';
import axios from 'axios';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  handleLogout,
  UsersIcon,
  GalleryIcon,
  RequestsIcon,
  DashboardIcon,
  EventsIcon,
  AnnouncementsIcon,
  MinistryIcon,
  MassScheduleIcon,
  AnalyticsIcon,
  // Staff-specific icons
  MortuaryIcon,
  CertificateIcon,
  SacramentIcon,
  onCollapsedChange,
}) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingMinistryCount, setPendingMinistryCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Notify parent component when collapsed state changes
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  const fetchPendingCount = useCallback(async () => {
    try {
      // Use the correct endpoint from your api.php routes
      const response = await api.get('/prayer-requests/pending-count');
      setPendingCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch pending prayer request count:', error);
    }
  }, []);

  const fetchPendingMinistryCount = useCallback(async () => {
    try {
      const response = await api.get('/admin/ministry-applicants-pending-count');
      setPendingMinistryCount(response.data.pending);
    } catch (error) {
      setPendingMinistryCount(0);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    fetchPendingMinistryCount();

    // Listen for custom events to refetch the counts
    const handleRequestUpdated = () => fetchPendingCount();
    const handleMinistryApplicantUpdated = () => fetchPendingMinistryCount();
    window.addEventListener('prayerRequestUpdated', handleRequestUpdated);
    window.addEventListener('ministryApplicantUpdated', handleMinistryApplicantUpdated);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('prayerRequestUpdated', handleRequestUpdated);
      window.removeEventListener('ministryApplicantUpdated', handleMinistryApplicantUpdated);
    };
  }, [fetchPendingCount, fetchPendingMinistryCount]);

  // Determine if this is the staff dashboard based on the presence of staff-specific icons
  const isStaffDashboard = MortuaryIcon && CertificateIcon && SacramentIcon;

  // Define navigation items based on dashboard type
  const navItems = isStaffDashboard
    ? [
        { key: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { key: 'mortuary', icon: MortuaryIcon, label: 'Mortuary' },
        { key: 'certificates', icon: CertificateIcon, label: 'Certificates' },
        { key: 'sacraments', icon: SacramentIcon, label: 'Sacraments' },
      ]
    : [
        { key: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { key: 'users', icon: UsersIcon, label: 'Users' },
        { key: 'membership', icon: UsersIcon, label: 'Membership' },
        { key: 'gallery', icon: GalleryIcon, label: 'Gallery' },
        { key: 'events', icon: EventsIcon, label: 'Events' },
        { key: 'news', icon: AnnouncementsIcon, label: 'News' },
        { key: 'announcements', icon: AnnouncementsIcon, label: 'Announcements' },
        { key: 'mass-schedule', icon: MassScheduleIcon, label: 'Mass Schedule' },
        { key: 'analytics', icon: AnalyticsIcon, label: 'Analytics & Reporting' },
        { key: 'shrine-rectors', icon: GalleryIcon, label: 'Manage Shrine Rectors' },
        { key: 'ministries', icon: MinistryIcon, label: 'Ministries' },
        { key: 'requests', icon: RequestsIcon, label: 'Prayer Requests', badge: pendingCount },
        { key: 'ministry-applicants', icon: MinistryIcon, label: 'Ministry Applicants', badge: pendingMinistryCount },
      ];

  // Robust logout handler
  const handleLogoutClick = async () => {
    try {
      // Get CSRF token
      await axios.get('/csrf-token');
      // Logout request (use plain axios, not api)
      await axios.post('/logout');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('userLogout'));
      navigate('/login');
    } catch (err) {
      alert('Logout failed.');
      console.error('Logout error:', err);
    }
  };

  return (
  <>
      <aside 
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isCollapsed && !isHovering ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed && !isHovering ? '80px' : sidebarOpen ? '250px' : '0px',
          transition: 'width 0.3s ease',
          zIndex: 3001, // Higher than header zIndex: 2999
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="sidebar-header" style={{
          display: isCollapsed && !isHovering ? 'none' : 'block',
          paddingTop: '20px'
        }}>
          <div className="sidebar-title-container">
            <div className="sidebar-main-title">DIOCESAN SHRINE OF</div>
            <div className="sidebar-subtitle" style={{
              fontFamily: "'Perpetua', 'Times New Roman', serif"
            }}>SAN VICENTE FERRER</div>
            <div className="sidebar-location">Brgy. Mamatid, Cabuyao, Laguna</div>
          </div>
        </div>
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
      <div className="sidebar-welcome" style={{
        display: isCollapsed && !isHovering ? 'none' : 'flex',
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
          color: '#8B4513',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>Welcome Admin!</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setActiveSection(item.key);
              let path;
              if (item.key === 'shrine-rectors') {
                path = '/admin/shrine-rectors';
              } else if (!isStaffDashboard && item.key === 'analytics') {
                path = '/admin/analytics';
              } else {
                path = isStaffDashboard ? `/staff/${item.key}` : `/admin/${item.key}`;
              }
              navigate(path);
            }}
            className={`sidebar-nav-item ${activeSection === item.key ? 'active' : ''}`}
            title={item.label}
            style={{
              justifyContent: isCollapsed && !isHovering ? 'center' : 'flex-start',
              padding: isCollapsed && !isHovering ? '12px 0' : '12px 20px',
              textAlign: isCollapsed && !isHovering ? 'center' : 'left'
            }}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {sidebarOpen && !(isCollapsed && !isHovering) && <span className="sidebar-nav-label">{item.label}</span>}
            {item.badge > 0 && !(isCollapsed && !isHovering) && (
              <span className="sidebar-nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;

 