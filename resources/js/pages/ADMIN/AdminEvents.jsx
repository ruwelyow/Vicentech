import React from 'react';
import '../../../css/Adminevents.css';
import { api } from '../../utils/axios';

const AdminEvents = ({
  events,
  editingEventId,
  eventFields,
  eventImagePreview,
  setEditingEventId,
  setEventFields,
  setEventImagePreview,
  setEvents,
  handleEventImageFile,
  fetchEvents,
  viewMode = 'active',
  setViewMode,
  loading = false,
}) => {
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditLoading, setIsEditLoading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteEventId, setDeleteEventId] = React.useState(null);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [restoreEventId, setRestoreEventId] = React.useState(null);

  // Utility function to show toast notifications
  const showToast = (message, type = 'success', eventId = null, eventTitle = null) => {
    const toast = document.createElement('div');
    toast.className = `${type}-toast`;
    toast.style.cursor = eventId ? 'pointer' : 'default';
    
    toast.innerHTML = `
      <div class="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; color: white;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}" />
        </svg>
        <span>${message}</span>
        ${eventId ? '<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Click to view event</div>' : ''}
      </div>
    `;
    
    // Add click handler for navigation
    if (eventId) {
      toast.addEventListener('click', () => {
        // Navigate to events page
        window.location.href = '/events';
        // Remove toast immediately when clicked
        if (toast.parentNode) {
          toast.remove();
        }
      });
      
      // Add hover effect for clickable toasts
      toast.addEventListener('mouseenter', () => {
        toast.style.transform = 'translateX(-5px) scale(1.02)';
        toast.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25)';
      });
      
      toast.addEventListener('mouseleave', () => {
        toast.style.transform = 'translateX(0) scale(1)';
        toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
      });
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 6 seconds with slide-out animation (longer for clickable toasts)
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, eventId ? 6000 : 4000);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});
    
    const formData = new FormData();
    formData.append('title', eventFields.title);
    formData.append('date', eventFields.date);
    formData.append('time', eventFields.time);
    formData.append('location', eventFields.location);
    formData.append('description', eventFields.description);
    if (eventFields.image instanceof File) {
      formData.append('image', eventFields.image);
    }

    try {
      const res = await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You could add a progress state here if needed
          console.log(`Upload progress: ${progress}%`);
        }
      });
      
      console.log('Event creation response:', res.data);
      
      // Ensure loading is cleared immediately after successful response
      setIsLoading(false);
      
      // Check if the response indicates success
      if (res.data && res.data.success !== false) {
        const newEvent = res.data.event || res.data;
        
        // Update the local state
        setEvents(prev => [newEvent, ...prev]);
        
        // Clear form and close editor
        setEditingEventId(null);
        setEventImagePreview('');
        setEventFields({ title: '', date: '', time: '', location: '', description: '', image: null });
        setErrors({});
        
        // Show success message
        const message = res.data.message || 'Event created successfully!';
        showToast('🎉 ' + message, 'success', newEvent.id, newEvent.title);
      } else {
        // Handle server-side errors that still return 200 status
        setErrors(res.data?.errors || {});
        showToast(res.data?.message || 'Failed to create event.', 'error');
      }
    } catch (error) {
      console.error('Event creation error:', error);
      
      // Ensure loading is cleared on error
      setIsLoading(false);
      
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        // Show the specific error message from the server
        const errorMessage = error.response.data.message || 'Please check the form for errors.';
        showToast(errorMessage, 'error');
      } else if (error.response?.status === 500) {
        const errorMessage = error.response.data?.message || 'Server error occurred';
        console.error('Server error details:', error.response.data);
        showToast(`Server Error: ${errorMessage}`, 'error');
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        showToast('Network error occurred. Please check your connection and try again.', 'error');
      } else {
        // Check if it's a network error but the event might have been created
        showToast('Network error occurred. Refreshing events list to check if event was created.', 'error');
        
        // Refresh the events list to see if the event was actually created
        if (fetchEvents) {
          try {
            await fetchEvents();
            // Clear form in case the event was actually created
            setEditingEventId(null);
            setEventImagePreview('');
            setEventFields({ title: '', date: '', time: '', location: '', description: '', image: null });
            setErrors({});
          } catch (fetchError) {
            console.error('Failed to refresh events list:', fetchError);
          }
        }
      }
    }
  };

  const handleEditSave = async (eventId) => {
    setIsEditLoading(true);
    setErrors({});
    
    const formData = new FormData();
    formData.append('title', eventFields.title);
    formData.append('date', eventFields.date);
    formData.append('time', eventFields.time);
    formData.append('location', eventFields.location);
    formData.append('description', eventFields.description);
    if (eventFields.image instanceof File) {
      formData.append('image', eventFields.image);
    }

    try {
      const res = await api.post(`/events/${eventId}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Edit upload progress: ${progress}%`);
        }
      });
      
      console.log('Event update response:', res.data);
      
      // Ensure loading is cleared immediately after successful response
      setIsEditLoading(false);
      
      // Check if the response indicates success
      if (res.data && res.data.success !== false) {
        const updatedEvent = res.data.event || res.data;
        setEvents(events.map(ev => ev.id === eventId ? updatedEvent : ev));
        setEditingEventId(null);
        setEventImagePreview('');
        setEventFields({ title: '', date: '', time: '', location: '', description: '', image: null });
        setErrors({});
        
        // Show success message
        const message = res.data.message || 'Event updated successfully!';
        showToast('✅ ' + message, 'success', eventId, eventFields.title);
      } else {
        // Handle server-side errors that still return 200 status
        setErrors(res.data?.errors || {});
        showToast(res.data?.message || 'Failed to update event.', 'error');
      }
    } catch (error) {
      console.error('Event update error:', error);
      
      // Ensure loading is cleared on error
      setIsEditLoading(false);
      
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        // Show the specific error message from the server
        const errorMessage = error.response.data.message || 'Please check the form for errors.';
        showToast(errorMessage, 'error');
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    }
  };

  const handleDelete = (eventId) => {
    if (!eventId) {
      console.error('Cannot delete event: eventId is undefined');
      showToast('Cannot delete event: Invalid event ID', 'error');
      return;
    }
    
    setDeleteEventId(eventId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/events/${deleteEventId}`);
      // Refresh events list after archiving
      if (fetchEvents) {
        await fetchEvents(viewMode);
      }
      setEvents(events.filter(ev => ev.id !== deleteEventId));
      setEditingEventId(null);
      setEventImagePreview('');
      showToast(response.data?.message || 'Event archived successfully. All registrations and analytics data have been preserved.', 'success');
    } catch (error) {
      console.error('Archive error:', error);
      showToast(error.response?.data?.message || 'Failed to archive event.', 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteEventId(null);
  };

  const handleRestore = async (eventId) => {
    if (!eventId) return;
    
    setIsRestoring(true);
    setRestoreEventId(eventId);
    
    try {
      const response = await api.post(`/events/${eventId}/restore`);
      showToast(response.data?.message || 'Event restored successfully.', 'success');
      // Switch to active view and refresh events list after restore
      if (setViewMode) {
        setViewMode('active');
      }
      // Refresh events list after a short delay to allow view mode to update
      setTimeout(() => {
        if (fetchEvents) {
          fetchEvents('active');
        }
      }, 100);
    } catch (error) {
      console.error('Restore error:', error);
      showToast(error.response?.data?.message || 'Failed to restore event.', 'error');
    } finally {
      setIsRestoring(false);
      setRestoreEventId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteEventId(null);
  };

  return (
    <>
      {/* Toast CSS */}
      <style>{`
        .success-toast, .error-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10001;
          min-width: 300px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: slideInRight 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .success-toast {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .error-toast {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      {/* Full Screen Loading Overlay - Similar to Logout Design */}
      {(isLoading || isEditLoading) && (
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
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>
              {isLoading ? 'Creating event...' : 'Updating event...'}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.25rem' }}>
              Archive Event
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to archive this event? The event will be hidden from public view, but all registrations and analytics data will be preserved. You can restore it later from the Archived Events section.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: '#CD8B3E',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="sacraments-container responsive-admin-events" style={{ maxWidth: 1200, minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
        <style>{`
          @media (max-width: 600px) {
            .responsive-admin-events {
              width: 95vw !important;
              max-width: 100vw !important;
              margin-left: auto !important;
              margin-right: auto !important;
              padding-left: 1rem !important;
              padding-right: 1rem !important;
            }
          }
        `}</style>
        
        <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
          <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Events</h1>
          
          {/* View Mode Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginBottom: '1rem' }}>
            <button
              onClick={() => setViewMode('active')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'active' ? '#CD8B3E' : '#f8f9fa',
                color: viewMode === 'active' ? 'white' : '#6c757d',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'active' ? '0 2px 8px rgba(205, 139, 62, 0.2)' : 'none',
              }}
            >
              Active Events
            </button>
            <button
              onClick={() => setViewMode('archived')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'archived' ? '#CD8B3E' : '#f8f9fa',
                color: viewMode === 'archived' ? 'white' : '#6c757d',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'archived' ? '0 2px 8px rgba(205, 139, 62, 0.2)' : 'none',
              }}
            >
              Archived Events
            </button>
          </div>

          {viewMode === 'active' && (
            <button
              onClick={() => setEditingEventId('new')}
              className="add-btn management-btn primary"
              style={{ 
                minHeight: 44, 
                fontWeight: 600, 
                fontSize: '0.95rem', 
                borderRadius: '0.5rem', 
                boxShadow: '0 2px 4px rgba(205, 139, 62, 0.1)', 
                background: '#CD8B3E', 
                color: 'white', 
                padding: '0.625rem 1rem', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 'auto', 
                maxWidth: 180,
                marginBottom: '1.5rem'
              }}
            >
              + Add Event
            </button>
          )}
        </div>
        {/* Add New Event Form Modal */}
        {editingEventId === 'new' && (
          <div className="events-modal-backdrop">
            <div className="events-modal-content">
              <div style={{ 
                background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
                borderRadius: '1rem 1rem 0 0', 
                padding: '1.5rem 2rem', 
                margin: '-2rem -2rem 1.5rem -2rem',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30%',
                  left: '-10%',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  transform: 'rotate(-30deg)'
                }}></div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: '800', 
                  margin: '0',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  Create New Event
                </h2>
                <p style={{ 
                  fontSize: '0.9rem', 
                  margin: '0.5rem 0 0 0', 
                  opacity: 0.9,
                  position: 'relative',
                  zIndex: 1
                }}>
                  Add a new event to your parish calendar
                </p>
                <button 
                  className="events-modal-close-btn" 
                  onClick={() => setEditingEventId(null)} 
                  title="Close"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ×
                </button>
              </div>
              
              <div className="event-form-card" style={{ background: '#FFF6E5', borderRadius: 18, boxShadow: '0 4px 18px rgba(205,139,62,0.10)', padding: '2rem 2.5rem', marginBottom: 32, maxWidth: 700, width: '100%', margin: '0 auto' }}>
                <div className="form-content">
                  <div className="image-upload-section">
                    <div className="image-preview-container">
                      {eventImagePreview ? (
                        <img src={eventImagePreview} alt="Event Preview" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                          </svg>
                          <span>No Image Selected</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          handleEventImageFile(e, setEventFields, setEventImagePreview);
                        }
                      }}
                      className="file-input"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-fields">
                    <div className="field-group">
                      <label htmlFor="title">Event Title</label>
                      <input 
                        type="text"
                        id="title"
                        value={eventFields.title}
                        onChange={(e) => setEventFields(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        className={errors.title ? 'error' : ''}
                        disabled={isLoading}
                      />
                      {errors.title && <span className="error-message">{errors.title[0]}</span>}
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="date">Date</label>
                        <input 
                          type="date"
                          id="date"
                          value={eventFields.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setEventFields(prev => ({ ...prev, date: e.target.value }))}
                          className={errors.date ? 'error' : ''}
                          disabled={isLoading}
                        />
                        {errors.date && <span className="error-message">{errors.date[0]}</span>}
                      </div>

                      <div className="field-group">
                        <label htmlFor="time">Time</label>
                        <input 
                          type="time"
                          id="time"
                          value={eventFields.time}
                          onChange={(e) => setEventFields(prev => ({ ...prev, time: e.target.value }))}
                          className={errors.time ? 'error' : ''}
                          disabled={isLoading}
                        />
                        {errors.time && <span className="error-message">{errors.time[0]}</span>}
                      </div>
                    </div>

                    <div className="field-group">
                      <label htmlFor="location">Location</label>
                      <input 
                        type="text"
                        id="location"
                        value={eventFields.location}
                        onChange={(e) => setEventFields(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter event location"
                        className={errors.location ? 'error' : ''}
                        disabled={isLoading}
                      />
                      {errors.location && <span className="error-message">{errors.location[0]}</span>}
                    </div>

                    <div className="field-group">
                      <label htmlFor="description">Description</label>
                      <textarea 
                        id="description"
                        value={eventFields.description}
                        onChange={(e) => setEventFields(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter event description"
                        rows={4}
                        className={errors.description ? 'error' : ''}
                        disabled={isLoading}
                      />
                      {errors.description && <span className="error-message">{errors.description[0]}</span>}
                    </div>

                    <div className="form-actions">
                      <button 
                        onClick={handleSave} 
                        className="save-btn"
                        disabled={isLoading}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Event
                      </button>
                      <button 
                        onClick={() => setEditingEventId(null)} 
                        className="cancel-btn"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div className="user-table-wrapper" style={{ 
          background: 'white',
          borderRadius: '0.75rem',
          border: '1.5px solid #f2e4ce',
          overflowX: 'auto',
          boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)',
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '1rem',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem',
              color: '#5C4B38'
            }}>
              <div style={{ 
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #CD8B3E',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <p>Loading {viewMode === 'archived' ? 'archived' : 'active'} events...</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(205, 139, 62, 0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 50%, rgba(205, 139, 62, 0.03) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}></div>
              
              {/* Icon Container */}
              <div style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, rgba(205, 139, 62, 0.1) 0%, rgba(205, 139, 62, 0.05) 100%)',
                borderRadius: '50%',
                margin: '0 auto 2rem',
                border: '2px solid rgba(205, 139, 62, 0.1)'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{
                  width: '48px',
                  height: '48px',
                  color: '#CD8B3E',
                  strokeWidth: '1.5'
                }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#2d3748', 
                marginBottom: '0.75rem',
                letterSpacing: '-0.025em',
                position: 'relative'
              }}>
                {viewMode === 'archived' ? 'No Archived Events' : 'No Events Yet'}
              </h3>
              <p style={{ 
                color: '#718096', 
                fontSize: '1rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto',
                position: 'relative'
              }}>
                {viewMode === 'archived' 
                  ? 'Archived events will appear here. When you archive an event, all registrations and analytics data are preserved.' 
                  : 'Start building your event calendar by creating your first event'}
              </p>
              
              {/* Decorative Elements */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, rgba(205, 139, 62, 0.1) 0%, rgba(205, 139, 62, 0.05) 100%)',
                borderRadius: '50%',
                opacity: '0.6'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, rgba(205, 139, 62, 0.08) 0%, rgba(205, 139, 62, 0.03) 100%)',
                borderRadius: '50%',
                opacity: '0.8'
              }}></div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '2rem',
              padding: '0.5rem'
            }}>
              {events.map((event) => (
                <div 
                  key={event.id} 
                  style={{ 
                    background: '#fff',
                    borderRadius: '16px',
                    border: viewMode === 'archived' 
                      ? '1px solid rgba(107, 114, 128, 0.2)' 
                      : '1px solid rgba(205, 139, 62, 0.1)',
                    padding: '0',
                    boxShadow: viewMode === 'archived' 
                      ? '0 4px 20px rgba(107, 114, 128, 0.08)' 
                      : '0 4px 20px rgba(205, 139, 62, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    opacity: viewMode === 'archived' ? 0.9 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = viewMode === 'archived'
                      ? '0 8px 30px rgba(107, 114, 128, 0.15)'
                      : '0 12px 40px rgba(205, 139, 62, 0.15)';
                    e.currentTarget.style.borderColor = viewMode === 'archived'
                      ? 'rgba(107, 114, 128, 0.3)'
                      : 'rgba(205, 139, 62, 0.2)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = viewMode === 'archived'
                      ? '0 4px 20px rgba(107, 114, 128, 0.08)'
                      : '0 4px 20px rgba(205, 139, 62, 0.08)';
                    e.currentTarget.style.borderColor = viewMode === 'archived'
                      ? 'rgba(107, 114, 128, 0.2)'
                      : 'rgba(205, 139, 62, 0.1)';
                    e.currentTarget.style.opacity = viewMode === 'archived' ? '0.9' : '1';
                  }}
                >
                {editingEventId === event.id ? (
                  // Edit Mode
                  <div style={{ 
                    background: '#FFF6E5',
                    borderRadius: '12px',
                    border: '1.5px solid #f2e4ce',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '1rem' }}>Edit Event</h4>
                    
                    <div style={{ 
                      width: '100%', 
                      height: '180px', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      border: '1.5px solid #f2e4ce',
                      background: '#f9f9f9',
                      marginBottom: '1rem'
                    }}>
                      <img
                        src={
                          eventImagePreview ||
                          (event.image_data
                            ? `data:${event.image_mime};base64,${event.image_data}`
                            : 'https://placehold.co/300x200?text=Event')
                        }
                        alt="Event Preview"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          handleEventImageFile(e, setEventFields, setEventImagePreview);
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem', 
                        borderRadius: '6px', 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: '0.9rem', 
                        color: '#3F2E1E', 
                        background: '#fff',
                        marginBottom: '1rem'
                      }}
                      disabled={isEditLoading}
                    />

                    <input 
                      type="text"
                      value={eventFields.title}
                      onChange={(e) => setEventFields(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title"
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem', 
                        borderRadius: '6px', 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: '0.9rem', 
                        color: '#3F2E1E', 
                        background: '#fff',
                        marginBottom: '0.75rem'
                      }}
                      disabled={isEditLoading}
                    />
                    {errors.title && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>{errors.title[0]}</span>}

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input 
                        type="date"
                        value={eventFields.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setEventFields(prev => ({ ...prev, date: e.target.value }))}
                        style={{ 
                          flex: 1,
                          padding: '0.6rem', 
                          borderRadius: '6px', 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: '0.9rem', 
                          color: '#3F2E1E', 
                          background: '#fff'
                        }}
                        disabled={isEditLoading}
                      />
                      <input 
                        type="time"
                        value={eventFields.time}
                        onChange={(e) => setEventFields(prev => ({ ...prev, time: e.target.value }))}
                        style={{ 
                          flex: 1,
                          padding: '0.6rem', 
                          borderRadius: '6px', 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: '0.9rem', 
                          color: '#3F2E1E', 
                          background: '#fff'
                        }}
                        disabled={isEditLoading}
                      />
                    </div>
                    {errors.date && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>{errors.date[0]}</span>}
                    {errors.time && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>{errors.time[0]}</span>}

                    <input 
                      type="text"
                      value={eventFields.location}
                      onChange={(e) => setEventFields(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location"
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem', 
                        borderRadius: '6px', 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: '0.9rem', 
                        color: '#3F2E1E', 
                        background: '#fff',
                        marginBottom: '0.75rem'
                      }}
                      disabled={isEditLoading}
                    />
                    {errors.location && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>{errors.location[0]}</span>}

                    <textarea 
                      value={eventFields.description}
                      onChange={(e) => setEventFields(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Event description"
                      rows={3}
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem', 
                        borderRadius: '6px', 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: '0.9rem', 
                        color: '#3F2E1E', 
                        background: '#fff',
                        marginBottom: '0.75rem',
                        resize: 'vertical'
                      }}
                      disabled={isEditLoading}
                    />
                    {errors.description && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>{errors.description[0]}</span>}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button 
                        onClick={() => handleEditSave(event.id)} 
                        disabled={isEditLoading}
                        style={{ 
                          background: '#CD8B3E', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '0.625rem 1.5rem', 
                          fontWeight: '600', 
                          fontSize: '0.9rem', 
                          cursor: isEditLoading ? 'not-allowed' : 'pointer',
                          flex: 1,
                          transition: 'background 0.2s'
                        }}
                      >
                        {isEditLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        onClick={() => setEditingEventId(null)} 
                        disabled={isEditLoading}
                        style={{ 
                          background: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '0.625rem 1.5rem', 
                          fontWeight: '600', 
                          fontSize: '0.9rem', 
                          cursor: isEditLoading ? 'not-allowed' : 'pointer',
                          flex: 1,
                          transition: 'background 0.2s'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode - Enhanced Minimalist Design
                  <>
                    {/* Image Section with Gradient Overlay */}
                    <div style={{ 
                      position: 'relative',
                      width: '100%', 
                      height: '200px', 
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    }}>
                      <img
                        src={
                          event.image_data
                            ? `data:${event.image_mime};base64,${event.image_data}`
                            : 'https://placehold.co/300x200?text=Event'
                        }
                        alt={event.title}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          filter: viewMode === 'archived' ? 'grayscale(30%)' : 'none',
                          opacity: viewMode === 'archived' ? 0.85 : 1
                        }}
                      />
                      {/* Date Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#CD8B3E',
                          textAlign: 'center',
                          lineHeight: '1.2'
                        }}>
                          {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'}
                        </div>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '700', 
                          color: '#3F2E1E',
                          textAlign: 'center',
                          lineHeight: '1'
                        }}>
                          {event.date ? new Date(event.date).getDate() : '?'}
                        </div>
                      </div>
                      {/* Archived Badge */}
                      {viewMode === 'archived' && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(107, 114, 128, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Archived
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '1.5rem', opacity: viewMode === 'archived' ? 0.85 : 1 }}>
                      {/* Title */}
                      <h3 style={{ 
                        margin: '0 0 1rem 0', 
                        color: viewMode === 'archived' ? '#6b7280' : '#2d3748', 
                        fontSize: '1.3rem', 
                        fontWeight: '700',
                        lineHeight: '1.3',
                        letterSpacing: '-0.025em'
                      }}>
                        {event.title}
                      </h3>
                      
                      {/* Event Details */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        {/* Time & Location */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          {event.time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#CD8B3E'
                              }}></div>
                              <span style={{ 
                                color: '#4a5568', 
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                {event.time}
                              </span>
                            </div>
                          )}
                          {event.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#68d391'
                              }}></div>
                              <span style={{ 
                                color: '#4a5568', 
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                {event.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Full Date */}
                        {event.date && (
                          <div style={{ 
                            color: '#718096', 
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            marginBottom: '0.75rem'
                          }}>
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p style={{ 
                          margin: '0 0 1.5rem 0', 
                          color: '#4a5568', 
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          display: '-webkit-box',
                          WebkitLineClamp: '3',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {event.description}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {viewMode === 'archived' ? (
                          // Restore button for archived events
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(event.id);
                            }}
                            disabled={isRestoring && restoreEventId === event.id}
                            style={{ 
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '10px', 
                              padding: '0.75rem 1.25rem', 
                              fontWeight: '600', 
                              fontSize: '0.85rem', 
                              cursor: (isRestoring && restoreEventId === event.id) ? 'not-allowed' : 'pointer',
                              flex: 1,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                              letterSpacing: '0.025em',
                              opacity: (isRestoring && restoreEventId === event.id) ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!(isRestoring && restoreEventId === event.id)) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                            }}
                          >
                            {isRestoring && restoreEventId === event.id ? 'Restoring...' : 'Restore Event'}
                          </button>
                        ) : (
                          // Edit and Archive buttons for active events
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEventId(event.id);
                                setEventFields({
                                  title: event.title || '',
                                  date: event.date || '',
                                  time: event.time || '',
                                  location: event.location || '',
                                  description: event.description || '',
                                  image: null
                                });
                                setEventImagePreview('');
                              }}
                              style={{ 
                                background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '10px', 
                                padding: '0.75rem 1.25rem', 
                                fontWeight: '600', 
                                fontSize: '0.85rem', 
                                cursor: 'pointer',
                                flex: 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(205, 139, 62, 0.2)',
                                letterSpacing: '0.025em'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(205, 139, 62, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(205, 139, 62, 0.2)';
                              }}
                            >
                              Edit Event
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(event.id);
                              }}
                              style={{ 
                                background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '10px', 
                                padding: '0.75rem 1.25rem', 
                                fontWeight: '600', 
                                fontSize: '0.85rem', 
                                cursor: 'pointer',
                                flex: 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(205, 139, 62, 0.2)',
                                letterSpacing: '0.025em'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(205, 139, 62, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(205, 139, 62, 0.2)';
                              }}
                            >
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminEvents;