import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/axios';
import Notifications from './Notifications';
import ReactDOM from 'react-dom';

const Navbar = () => {
  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [inquiriesDropdown, setInquiriesDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const fetchUnreadCount = useCallback(async () => {
    const user = localStorage.getItem('user');
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    try {
      // Use cookie-based session (Sanctum). The `api` instance is configured with withCredentials: true.
      const response = await api.get('/notifications/unread-count');
      setUnreadNotifications(response.data.count);
    } catch (error) {
      console.error("Failed to fetch unread notifications count", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener('notificationsUpdated', fetchUnreadCount);
    return () => {
      window.removeEventListener('notificationsUpdated', fetchUnreadCount);
    };
  }, [fetchUnreadCount]);

  // Check login status and listen for login/logout events
  useEffect(() => {
    const checkLogin = () => {
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!user);
      if (!!user) {
        fetchUnreadCount(); // Fetch count on login
      }
    };
    checkLogin();
    window.addEventListener('userLogin', checkLogin);
    window.addEventListener('userLogout', checkLogin);
    return () => {
      window.removeEventListener('userLogin', checkLogin);
      window.removeEventListener('userLogout', checkLogin);
    };
  }, [fetchUnreadCount]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (profileDropdown || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdown, showNotifications]);

  // Close About/Inquiries dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('#aboutDropdownBtn') && !event.target.closest('#aboutDropdownMenu')) {
        setAboutDropdown(false);
      }
      if (!event.target.closest('#inquiriesDropdownBtn') && !event.target.closest('#inquiriesDropdownMenu')) {
        setInquiriesDropdown(false);
      }
    }
    if (aboutDropdown || inquiriesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [aboutDropdown, inquiriesDropdown]);

  const handleLogout = async () => {
    setShowLogoutModal(false);
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
      navigate('/');
    } catch (err) {
      alert('Logout failed.');
      setLoggingOut(false);
    }
  };



  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-[#bfc2c2]/80 backdrop-blur-md shadow-lg' 
        : 'bg-[#2A75D0]/20'
    } overflow-visible`} style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
      <div className="container mx-auto flex flex-wrap items-center justify-between p-4 relative overflow-visible" style={{ minHeight: '80px' }}>
        
        <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img 
            src="/images/COA-DIOCESAN-SHRINE-SVF-MAMATID-SOLO.svg" 
            className={`transition-all duration-300 ease-in-out ${isScrolled ? 'h-14' : 'h-14'}`} 
            alt="Logo"
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            style={{userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto'}}
          />
          <div className={`transition-all duration-300 ease-in-out ${isScrolled ? 'scale-95' : 'scale-100'} text-center`}>
            <div className={`text-xs transition-colors duration-300 ${isScrolled ? 'text-gray-800' : 'text-white'}`}>DIOCESAN SHRINE OF</div>
            <div className="text-md font-bold" style={{ color: '#FFEBB8' }}>SAN VICENTE FERRER</div>
            <div className={`text-xs transition-colors duration-300 ${isScrolled ? 'text-gray-800' : 'text-white'}`}>Brgy. Mamatid, Cabuyao, Laguna</div>
          </div>
        </Link>
        {/* Hamburger button for mobile */}
        <button
          className="inline-flex items-center p-2 ml-3 text-sm text-white rounded-lg md:hidden focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-300 relative z-50"
          type="button"
          aria-controls="navbar-dropdown"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>


        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute top-16 left-0 right-0 bg-gray-800 rounded-lg shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
              <ul className="flex flex-col font-medium p-4">
                <li>
                  <button
                    onClick={() => {
                      if (window.location.pathname === '/' || window.location.pathname === '/home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        window.location.href = '/';
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]"
                  >
                    Home
                  </button>
                </li>

                {/* About Dropdown */}
                <li className="relative overflow-visible">
                  <button
                    className="flex items-center py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]"
                    onClick={() => { 
                      console.log('About dropdown clicked'); 
                      setAboutDropdown((open) => !open); 
                    }}
                    aria-expanded={aboutDropdown}
                  >
                    About
                    <svg className="w-2.5 h-2.5 ml-2" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  {aboutDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg w-44"
                      style={{ 
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '4px',
                        backgroundColor: '#374151',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        zIndex: 999999,
                        transform: 'translateZ(0)',
                        willChange: 'transform'
                      }}
                    >
                      <ul className="py-2 text-sm text-white">
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              setMobileMenuOpen(false); 
                              window.location.href = '/#history'; 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              setMobileMenuOpen(false); 
                              window.location.href = '/#history'; 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            History
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              setMobileMenuOpen(false); 
                              if (window.location.pathname === '/' || window.location.pathname === '/home') {
                                const section = document.getElementById('ministries');
                                if (section) {
                                  section.scrollIntoView({ behavior: 'smooth' });
                                }
                              } else {
                                window.location.href = '/#ministries';
                              }
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              setMobileMenuOpen(false); 
                              if (window.location.pathname === '/' || window.location.pathname === '/home') {
                                const section = document.getElementById('ministries');
                                if (section) {
                                  section.scrollIntoView({ behavior: 'smooth' });
                                }
                              } else {
                                window.location.href = '/#ministries';
                              }
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Ministries
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/about'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/about'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Shrine Rectors
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/mass-schedule'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/mass-schedule'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Mass Schedule
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/gallery'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/gallery'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Gallery
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/news'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/news'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            News
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/contact'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setAboutDropdown(false); 
                              navigate('/contact'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Contact Us
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
                <li><button onClick={() => { navigate('/pray'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]">Pray</button></li>
                <li><button onClick={() => { navigate('/events'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]">Events & Announcements</button></li>

                {/* Inquiries Dropdown */}
                <li className="relative overflow-visible">
                  <button
                    className="flex items-center py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]"
                    onClick={() => setInquiriesDropdown((open) => !open)}
                    aria-expanded={inquiriesDropdown}
                  >
                    Inquiries
                    <svg className="w-2.5 h-2.5 ml-2" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  {inquiriesDropdown && (
                    <div className="z-50 bg-black/30 backdrop-blur-sm rounded-lg shadow-sm absolute mt-2 w-44">
                      <ul className="py-2 text-sm text-white">
                        <li>
                          <button
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/apply') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/apply') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Apply as a Ministry Member
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/appoint') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/appoint') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Appoint Sacraments
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/certificate-request') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/certificate-request') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Certificate Request
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/prayerRequest') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setInquiriesDropdown(false); 
                              isLoggedIn ? navigate('/prayerRequest') : navigate('/login'); 
                              setMobileMenuOpen(false); 
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            style={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              touchAction: 'manipulation',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            Prayer Request
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>

                <li><button onClick={() => { window.location.href = '/#explore'; setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]">Explore</button></li>
                <li>
                  <button
                    onClick={() => { isLoggedIn ? navigate('/give') : navigate('/login'); setMobileMenuOpen(false); }}
                    className={`block w-full text-left py-2 px-3 font-['Georgia'] transition-colors duration-200 text-white hover:text-[#FFEBB8]`}
                  >
                    Give
                  </button>
                </li>

                <li>
                  {/* Notification and Profile Icons Side by Side */}
                  <div className="flex items-center gap-2 -mt-2">
                    <button
                      onClick={() => { navigate('/calendar'); setMobileMenuOpen(false); }}
                      className={`p-2 transition-colors duration-200 text-white hover:text-[#FFEBB8] flex items-center justify-center`}
                      aria-label="Calendar"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    {isLoggedIn && (
                      <div className="relative" ref={notificationsRef}>
                        <button
                          onClick={() => setShowNotifications(prev => !prev)}
                          className={`relative flex items-center py-2 px-3 transition-colors duration-200 text-white hover:text-[#FFEBB8]`}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                          {unreadNotifications > 0 && (
                            <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                              {unreadNotifications}
                            </span>
                          )}
                        </button>
                        {showNotifications && (
                          <Notifications popup={true} onClose={() => setShowNotifications(false)} />
                        )}
                      </div>
                    )}
                    {/* Profile Dropdown */}
                    {isLoggedIn ? (
                      <div className="flex items-center gap-2 relative" ref={profileRef}>
                        <button
                          className={`focus:outline-none transition-colors duration-200 text-white hover:text-[#FFEBB8]`}
                          onClick={() => setProfileDropdown((prev) => !prev)}
                          aria-label="Profile menu"
                          style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0 }}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 110-8 4 4 0 010 8z"/>
                          </svg>
                          <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/></svg>
                        </button>
                        {profileDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-44 z-50 bg-black/30 backdrop-blur-sm rounded-lg shadow-sm">
                            <ul className="py-2 text-sm text-white">
                              <li>
                                <button
                                  onClick={() => { setProfileDropdown(false); navigate('/profile'); setMobileMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] rounded-t-lg transition-colors duration-200"
                                >
                                  My Profile
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => { setProfileDropdown(false); navigate('/change-password'); setMobileMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                                >
                                  Change Password
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => { setProfileDropdown(false); setShowLogoutModal(true); setMobileMenuOpen(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] rounded-b-lg transition-colors duration-200"
                                >
                                  Logout
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link to="/login" className="block py-1.5 px-5 text-sm text-white rounded-full bg-[#CD8B3E] hover:bg-[#B77B35] transition-all duration-300 font-['Georgia'] shadow-lg hover:shadow-xl min-w-[90px] text-center" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    )}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}


        {/* Desktop menu */}
        <div className="hidden md:block">
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 relative bg-gray-800 md:bg-transparent rounded-lg md:rounded-none shadow md:shadow-none">
            <li>
              <a
                href="/"
                className={`block py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-gray-800 hover:text-[#CD8B3E]' 
                    : 'text-white hover:text-[#FFEBB8]'
                }`}
                onClick={e => {
                  if (window.location.pathname === '/' || window.location.pathname === '/home') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                Home
              </a>
            </li>

            {/* About Dropdown */}
            <li className="relative overflow-visible">
              <button
                id="aboutDropdownBtn"
                className={`flex items-center py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-gray-800 hover:text-[#CD8B3E]' 
                    : 'text-white hover:text-[#FFEBB8]'
                }`}
                onClick={() => setAboutDropdown((open) => !open)}
                aria-expanded={aboutDropdown}
              >
                About
                <svg className="w-2.5 h-2.5 ml-2" fill="none" viewBox="0 0 10 6">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                </svg>
              </button>
              {aboutDropdown && (
                <div id="aboutDropdownMenu" className="z-50 bg-black/30 backdrop-blur-sm rounded-lg shadow-sm absolute mt-2 w-44">
                  <ul className="py-2 text-sm text-white">
                    <li><a href="/#history" className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">History</a></li>
                    <li>
                      <a 
                        href="/#ministries" 
                        className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          setAboutDropdown(false);
                          if (window.location.pathname === '/' || window.location.pathname === '/home') {
                            const section = document.getElementById('ministries');
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth' });
                            }
                          } else {
                            window.location.href = '/#ministries';
                          }
                        }}
                      >
                        Ministries
                      </a>
                    </li>
                    <li><Link to="/about" className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">Shrine Rectors</Link></li>
                    <li><Link to="/mass-schedule" className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">Mass Schedule</Link></li>
                    <li><Link to="/gallery" className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">Gallery</Link></li>
                    <li><button onClick={() => { setAboutDropdown(false); navigate('/news'); }} className="block w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">News</button></li>
                    <li><Link to="/contact" className="block px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200">Contact Us</Link></li>
                  </ul>
                </div>
              )}
            </li>

            <li><Link to="/pray" className={`block py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
              isScrolled 
                ? 'text-gray-800 hover:text-[#CD8B3E]' 
                : 'text-white hover:text-[#FFEBB8]'
            }`}>Pray</Link></li>
            <li><Link to="/events" className={`block py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
              isScrolled 
                ? 'text-gray-800 hover:text-[#CD8B3E]' 
                : 'text-white hover:text-[#FFEBB8]'
            }`}>Events & Announcements</Link></li>

            {/* Inquiries Dropdown */}
            <li className="relative overflow-visible">
              <button
                id="inquiriesDropdownBtn"
                className={`flex items-center py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-gray-800 hover:text-[#CD8B3E]' 
                    : 'text-white hover:text-[#FFEBB8]'
                }`}
                onClick={() => setInquiriesDropdown((open) => !open)}
                aria-expanded={inquiriesDropdown}
              >
                Inquiries
                <svg className="w-2.5 h-2.5 ml-2" fill="none" viewBox="0 0 10 6">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                </svg>
              </button>
              {inquiriesDropdown && (
                <div id="inquiriesDropdownMenu" className="z-50 bg-black/30 backdrop-blur-sm rounded-lg shadow-sm absolute mt-2 w-44">
                  <ul className="py-2 text-sm text-white">
                    <li>
                      <button
                        onClick={() => isLoggedIn ? navigate('/apply') : navigate('/login')}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                      >
                        Apply as a Ministry Member
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => isLoggedIn ? navigate('/appoint') : navigate('/login')}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                      >
                        Appoint Sacraments
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => isLoggedIn ? navigate('/certificate-request') : navigate('/login')}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                      >
                        Certificate Request
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => isLoggedIn ? navigate('/prayerRequest') : navigate('/login')}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                      >
                        Prayer Request
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </li>

            <li><a href="/#explore" className={`block py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
              isScrolled 
                ? 'text-gray-800 hover:text-[#CD8B3E]' 
                : 'text-white hover:text-[#FFEBB8]'
            }`}>Explore</a></li>
            <li>
              <button
                onClick={() => isLoggedIn ? navigate('/give') : navigate('/login')}
                className={`block w-full text-left py-2 px-3 md:p-0 font-['Georgia'] transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-gray-800 hover:text-[#CD8B3E]' 
                    : 'text-white hover:text-[#FFEBB8]'
                }`}
              >
                Give
              </button>
            </li>

            <li>
              {/* Calendar Icon and Profile Icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/calendar')}
                  className={`p-2 transition-colors duration-200 flex items-center justify-center ${
                    isScrolled 
                      ? 'text-gray-800 hover:text-[#CD8B3E]' 
                      : 'text-white hover:text-[#FFEBB8]'
                  }`}
                  aria-label="Calendar"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {isLoggedIn && (
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setShowNotifications(prev => !prev)}
                      className={`relative flex items-center py-2 px-3 md:p-0 transition-colors duration-200 ${
                        isScrolled 
                          ? 'text-gray-800 hover:text-[#CD8B3E]' 
                          : 'text-white hover:text-[#FFEBB8]'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                      {unreadNotifications > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                          {unreadNotifications}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <Notifications popup={true} onClose={() => setShowNotifications(false)} />
                    )}
                  </div>
                )}
                {/* Profile Dropdown */}
                {isLoggedIn ? (
                  <div className="flex items-center gap-2 relative" ref={profileRef}>
                    <button
                      className={`focus:outline-none transition-colors duration-200 ${
                        isScrolled 
                          ? 'text-gray-800 hover:text-[#CD8B3E]' 
                          : 'text-white hover:text-[#FFEBB8]'
                      }`}
                      onClick={() => setProfileDropdown((prev) => !prev)}
                      aria-label="Profile menu"
                      style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0 }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 110-8 4 4 0 010 8z"/>
                      </svg>
                      <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/></svg>
                    </button>
                    {profileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-44 z-50 bg-black/30 backdrop-blur-sm rounded-lg shadow-sm">
                        <ul className="py-2 text-sm text-white">
                          <li>
                            <button
                              onClick={() => { setProfileDropdown(false); navigate('/profile'); }}
                              className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] rounded-t-lg transition-colors duration-200"
                            >
                              My Profile
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => { setProfileDropdown(false); navigate('/change-password'); }}
                              className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] transition-colors duration-200"
                            >
                              Change Password
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => { setProfileDropdown(false); setShowLogoutModal(true); }}
                              className="w-full text-left px-4 py-2 hover:bg-white/10 font-['Georgia'] rounded-b-lg transition-colors duration-200"
                            >
                              Logout
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="flex items-center justify-center py-2 px-4 text-sm text-white rounded-full bg-[#CD8B3E] hover:bg-[#B77B35] transition-all duration-300 font-['Georgia'] shadow-lg hover:shadow-xl min-w-[90px] text-center">
                    Login
                  </Link>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && ReactDOM.createPortal(
        <div className="logout-modal-overlay">
          <div 
            className="bg-white rounded-lg shadow-xl p-6 min-w-[300px] max-w-sm mx-4" 
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="text-lg font-semibold mb-4 text-[#3F2E1E]">Confirm Logout</div>
            <div className="mb-6 text-[#5C4B38]">Are you sure you want to logout?</div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-[#3F2E1E] font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-[#CD8B3E] text-white font-semibold hover:bg-[#B77B35] transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
    </nav>
  );
};

export default Navbar;
