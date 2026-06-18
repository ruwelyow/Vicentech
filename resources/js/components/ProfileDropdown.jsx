import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const handleProfilePage = () => {
    setIsOpen(false);
    // Navigate to profile page based on user role
    // Route based on role; priests have a dedicated route
    const userRole = userData?.is_admin
      ? 'admin'
      : userData?.is_staff
      ? 'staff'
      : userData?.is_priest
      ? 'priest'
      : 'profile';
    // For regular users, route is just /profile
    if (userRole === 'profile') {
      navigate('/profile');
    } else {
      navigate(`/${userRole}/profile`);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return null;
    
    // If it's already a full URL, return as is
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    
    // If it's a data URL, return as is
    if (profileImage.startsWith('data:')) {
      return profileImage;
    }
    
    // If it's a relative path, make it absolute
    if (profileImage.startsWith('/storage/')) {
      return `${window.location.origin}${profileImage}`;
    }
    
    // If it's just a filename, construct the full path
    return `${window.location.origin}/storage/profile_images/${profileImage}`;
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        onClick={handleProfileClick}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#C2A68C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = isOpen ? 'scale(1.05)' : 'scale(1)'}
      >
        {userData?.profile_image ? (
          <img
            src={getProfileImageUrl(userData.profile_image)}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <svg 
          width="20" 
          height="20" 
          fill="#fff" 
          viewBox="0 0 24 24"
          style={{ display: userData?.profile_image ? 'none' : 'flex' }}
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '200px',
            zIndex: 10000,
            overflow: 'hidden'
          }}
        >
          {/* Profile Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#C2A68C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {userData?.profile_image ? (
                  <img
                    src={getProfileImageUrl(userData.profile_image)}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <svg 
                  width="20" 
                  height="20" 
                  fill="#fff" 
                  viewBox="0 0 24 24"
                  style={{ display: userData?.profile_image ? 'none' : 'flex' }}
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1f2937',
                  fontSize: '14px'
                }}>
                  {userData?.name || 'User'}
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  {userData?.is_admin ? 'Administrator' : 
                   userData?.is_staff ? 'Staff Member' : 
                   userData?.is_priest ? 'Priest' : 'Parishioner'}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={handleProfilePage}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#374151',
                fontSize: '14px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Profile
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#dc2626',
                fontSize: '14px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
