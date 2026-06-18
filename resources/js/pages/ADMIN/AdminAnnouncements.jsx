import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';
import '../../../css/Adminannouncements.css';

const PLACEHOLDER_IMAGE = "https://placehold.co/200x120?text=No+Image";

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState(null);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleAddClick = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', description: '', image: null, date: '' });
    setImagePreview(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({ 
      title: announcement.title, 
      description: announcement.description, 
      image: null,
      date: announcement.date || ''
    });
    setImagePreview(announcement.image_data ? `data:${announcement.image_mime};base64,${announcement.image_data}` : null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteAnnouncementId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteAnnouncementId}`);
      setAnnouncements(announcements.filter(a => a.id !== deleteAnnouncementId));
    } catch (err) {
      alert('Failed to delete announcement.');
      console.error(err);
    }
    setShowDeleteConfirm(false);
    setDeleteAnnouncementId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteAnnouncementId(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      } else {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const formData2 = new FormData();
    formData2.append('title', formData.title);
    formData2.append('description', formData.description);
    formData2.append('date', formData.date || new Date().toISOString().split('T')[0]);
    if (formData.image instanceof File) {
      formData2.append('image', formData.image);
    }

    try {
      let res;
      if (editingAnnouncement) {
        // Update existing announcement - Laravel requires _method for PUT with FormData
        formData2.append('_method', 'PUT');
        res = await api.post(`/announcements/${editingAnnouncement.id}`, formData2, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
        // Update the announcement in the list
        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? res.data : a));
      } else {
        // Create new announcement
        res = await api.post('/announcements', formData2, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
        // Add new announcement to the beginning of the list
        setAnnouncements(prev => [res.data, ...prev]);
      }
      
      setIsFormOpen(false);
      setImagePreview(null);
      setFormData({ title: '', description: '', image: null, date: '' });
      setEditingAnnouncement(null);
      setUploadProgress(0);
    } catch (err) {
      console.error('Error submitting form:', err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          // Validation errors
          const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else if (err.response.data.error) {
          // General error message
          alert('Error: ' + err.response.data.error);
        } else {
          alert('Server error: ' + JSON.stringify(err.response.data));
        }
      } else {
        alert(`Failed to ${editingAnnouncement ? 'update' : 'add'} announcement. Please check your connection and try again.`);
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  if (loading) {
    return <div className="loading-users">Loading announcements...</div>;
  }

  return (
    <>
      {/* Full Screen Loading Overlay for Uploads */}
      {isSubmitting && (
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
            background: 'white',
            padding: '2rem',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            minWidth: 300,
          }}>
            <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1, textAlign: 'center' }}>
              {editingAnnouncement ? 'Updating announcement...' : 'Creating announcement...'}
            </div>
            {uploadProgress > 0 && (
              <div style={{ width: '100%', marginTop: 16 }}>
                <div style={{ 
                  width: '100%', 
                  height: 8, 
                  background: '#f2e4ce', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: '#CD8B3E',
                    borderRadius: 4,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 8, 
                  fontSize: 14, 
                  color: '#5C4B38',
                  fontWeight: 500
                }}>
                  {uploadProgress}% uploaded
                </div>
              </div>
            )}
            <div style={{ 
              fontSize: 14, 
              color: '#5C4B38', 
              textAlign: 'center',
              marginTop: 8
            }}>
              {uploadProgress === 0 ? 'Preparing upload...' : 'Please wait while we process your request'}
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
              Confirm Delete
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this announcement? This action cannot be undone.
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
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sacraments-container responsive-admin-announcements" style={{ maxWidth: '90%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
          <style>{`
            @media (max-width: 600px) {
              .responsive-admin-announcements {
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
            <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Announcements</h1>
            <button
              onClick={handleAddClick}
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
              + Add Announcement
            </button>
          </div>
        {(isFormOpen || editingAnnouncement !== null) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(44, 44, 44, 0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
              padding: '1.5rem',
              minWidth: 800,
              maxWidth: 900,
              width: '90vw',
              maxHeight: '90vh',
              overflow: 'visible',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}>
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
                  {editingAnnouncement === null ? 'Add Announcement' : 'Edit Announcement'}
                </h2>
                <p style={{ 
                  fontSize: '0.9rem', 
                  margin: '0.5rem 0 0 0', 
                  opacity: 0.9,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {editingAnnouncement === null ? 'Create a new announcement for your parish' : 'Update the announcement information'}
                </p>
                <button 
                  onClick={() => { 
                    setIsFormOpen(false); 
                    setImagePreview(null); 
                    setFormData({ title: '', description: '', image: null, date: '' });
                    setEditingAnnouncement(null);
                  }} 
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
              
              <div className="announcement-form-container" style={{
                background: '#FFF6E5',
                borderRadius: 18,
                boxShadow: '0 4px 18px rgba(205,139,62,0.10)',
                padding: '2rem 2.5rem',
                marginBottom: 32,
                maxWidth: 700,
                width: '100%',
                margin: '0 auto',
              }}>
                <form onSubmit={editingAnnouncement === null ? handleFormSubmit : handleFormSubmit}>
                  <div style={{ marginBottom: 18 }}>
                    <label htmlFor="title" style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Title</label>
                    <input name="title" id="title" value={formData.title || ""} onChange={handleFormChange} placeholder="Title" type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 2, outline: 'none', color: '#3F2E1E' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label htmlFor="date" style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Date</label>
                    <input
                      name="date"
                      id="date"
                      value={formData.date || ""}
                      onChange={handleFormChange}
                      placeholder="Date"
                      type="date"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 2, outline: 'none', color: '#3F2E1E' }}
                    />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label htmlFor="description" style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea name="description" id="description" value={formData.description || ""} onChange={handleFormChange} placeholder="Description" rows={2} style={{ width: '100%', minHeight: 80, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginTop: 8, marginBottom: 8, outline: 'none', color: '#3F2E1E', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label htmlFor="image" style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Upload Image</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                      style={{ 
                        marginTop: 6, 
                        color: '#3F2E1E', 
                        fontSize: 13,
                        opacity: isSubmitting ? 0.7 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    />
                    {imagePreview && (
                      <div style={{ marginTop: 12 }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #f2e4ce', background: '#f9f9f9' }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      style={{ 
                        background: isSubmitting ? '#ccc' : '#CD8B3E', 
                        color: 'white', 
                        padding: '0.625rem 1.5rem', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        fontWeight: 600, 
                        width: '100%',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      {isSubmitting 
                        ? (editingAnnouncement ? 'Updating...' : 'Creating...') 
                        : (editingAnnouncement ? 'Update Announcement' : 'Add Announcement')
                      }
                    </button>
                    <button 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={() => { 
                        setIsFormOpen(false); 
                        setImagePreview(null); 
                        setFormData({ title: '', description: '', image: null, date: '' });
                        setEditingAnnouncement(null);
                      }}
                      style={{ 
                        background: isSubmitting ? '#f5f5f5' : '#eee', 
                        color: isSubmitting ? '#999' : '#3F2E1E', 
                        padding: '0.625rem 1.5rem', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        fontWeight: 600, 
                        width: '100%',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Announcements Grid */}
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
          {(Array.isArray(announcements) ? announcements : []).length === 0 ? (
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
                  <path d="M8 2v4"/>
                  <path d="M16 2v4"/>
                  <rect width="18" height="18" x="3" y="4" rx="2"/>
                  <path d="M3 10h18"/>
                  <path d="M8 14h.01"/>
                  <path d="M12 14h.01"/>
                  <path d="M16 14h.01"/>
                  <path d="M8 18h.01"/>
                  <path d="M12 18h.01"/>
                  <path d="M16 18h.01"/>
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
                No Announcements Yet
              </h3>
              <p style={{ 
                color: '#718096', 
                fontSize: '1rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto',
                position: 'relative'
              }}>
                Start communicating important updates by creating your first announcement
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
              {(Array.isArray(announcements) ? announcements : []).map((a) => (
                <div 
                  key={a.id} 
                  style={{ 
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px solid rgba(205, 139, 62, 0.1)',
                    padding: '0',
                    boxShadow: '0 4px 20px rgba(205, 139, 62, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(205, 139, 62, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(205, 139, 62, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.1)';
                  }}
                >
                  {/* Image Section with Date Badge */}
                  <div style={{ 
                    position: 'relative',
                    width: '100%', 
                    height: '200px', 
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                  }}>
                    <img
                      src={a.image_data ? `data:${a.image_mime};base64,${a.image_data}` : 'https://placehold.co/300x200?text=Announcement'}
                      alt={a.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
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
                        {a.date ? new Date(a.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 
                         new Date(a.created_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        color: '#3F2E1E',
                        textAlign: 'center',
                        lineHeight: '1'
                      }}>
                        {a.date ? new Date(a.date).getDate() : new Date(a.created_at).getDate()}
                      </div>
                    </div>
                    
                    {/* Announcement Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(205, 139, 62, 0.3)'
                    }}>
                      Announcement
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Title */}
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      color: '#2d3748', 
                      fontSize: '1.3rem', 
                      fontWeight: '700',
                      lineHeight: '1.3',
                      letterSpacing: '-0.025em'
                    }}>
                      {a.title}
                    </h3>
                    
                    {/* Announcement Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      {/* Full Date */}
                      <div style={{ 
                        color: '#718096', 
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        marginBottom: '0.75rem'
                      }}>
                        {a.date ? new Date(a.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : new Date(a.created_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    {a.description && (
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
                        {a.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(a);
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
                        Edit Announcement
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(a.id);
                        }}
                        style={{ 
                          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '10px', 
                          padding: '0.75rem 1.25rem', 
                          fontWeight: '600', 
                          fontSize: '0.85rem', 
                          cursor: 'pointer',
                          flex: 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(229, 62, 62, 0.2)',
                          letterSpacing: '0.025em'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(229, 62, 62, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(229, 62, 62, 0.2)';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAnnouncements; 