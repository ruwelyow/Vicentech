import React, { useState, useEffect } from 'react';
import "../../../css/Adminannouncements.css";
import { api } from '../../utils/axios';

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [form, setForm] = useState({ image: '', title: '', date: '' });
  const [editIdx, setEditIdx] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    api.get('/news').then(res => {
      setNews(res.data);
      setLoading(false);
    });
    // Fetch all gallery albums and flatten all images
    api.get('/admin/albums').then(res => {
      const albums = res.data || [];
      const images = albums.flatMap(album => (album.images || []));
      setGalleryImages(images);
    }).catch(() => setGalleryImages([]));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result })); // reader.result is the base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Utility function to show toast notifications
  const showToast = (message, type = 'success', newsId = null, newsTitle = null) => {
    const toast = document.createElement('div');
    toast.className = `${type}-toast`;
    toast.style.cursor = newsId ? 'pointer' : 'default';
    
    toast.innerHTML = `
      <div class="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; color: white;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}" />
        </svg>
        <span>${message}</span>
        ${newsId ? '<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Click to view news</div>' : ''}
      </div>
    `;
    
    // Add click handler for navigation
    if (newsId) {
      toast.addEventListener('click', () => {
        // Navigate to news page
        window.location.href = '/news';
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
    }, newsId ? 6000 : 4000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/news', form); // send as JSON, not FormData
      const newNews = response.data;
      api.get('/news').then(res => setNews(res.data));
      setForm({ image: '', title: '', date: '' });
      setShowForm(false);
      
      // Show success toast with navigation
      showToast('🎉 News article created successfully!', 'success', newNews.id, newNews.title);
    } catch (error) {
      console.error('Error adding news:', error);
      showToast('Failed to create news article.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setForm(news[idx]);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsEditLoading(true);
    try {
      const id = news[editIdx].id;
      const response = await api.put(`/news/${id}`, form); // send as JSON, not FormData
      const updatedNews = response.data;
      api.get('/news').then(res => setNews(res.data));
      setEditIdx(null);
      setForm({ image: '', title: '', date: '' });
      setShowForm(false);
      
      // Show success toast with navigation
      showToast('✅ News article updated successfully!', 'success', id, form.title);
    } catch (error) {
      console.error('Error updating news:', error);
      showToast('Failed to update news article.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = (idx) => {
    setDeleteIndex(idx);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const id = news[deleteIndex].id;
    // Optimistically update UI
    setNews(prevNews => prevNews.filter((_, i) => i !== deleteIndex));
    try {
      await api.delete(`/news/${id}`);
      // Optionally, re-fetch to ensure sync with backend:
      // api.get('/news').then(res => setNews(res.data));
    } catch (error) {
      // If delete fails, you may want to show an error and/or revert the UI
      alert('Failed to delete news item.');
      // Optionally, re-fetch to restore correct state:
      api.get('/news').then(res => setNews(res.data));
    }
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const handleCancel = () => {
    setEditIdx(null);
    setForm({ image: '', title: '', date: '' });
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading-users">Loading news...</div>;
  }

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
          transition: all 0.3s ease;
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
      `}</style>
      
      {/* Full Screen Loading Overlay - Similar to Events Design */}
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
              {isLoading ? 'Creating news...' : 'Updating news...'}
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
              Are you sure you want to delete this news item? This action cannot be undone.
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
      
      <div className="sacraments-container responsive-admin-news" style={{ maxWidth: '90%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
        <style>{`
          @media (max-width: 600px) {
            .responsive-admin-news {
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
          <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage News</h1>
          {!showForm && editIdx === null && (
            <button
              onClick={() => setShowForm(true)}
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
              + Add News
            </button>
          )}
        </div>

      {(showForm || editIdx !== null) && (
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
                {editIdx === null ? 'Add News' : 'Edit News'}
              </h2>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                position: 'relative',
                zIndex: 1
              }}>
                {editIdx === null ? 'Create a new news article for your parish' : 'Update the news article information'}
              </p>
              <button 
                onClick={handleCancel} 
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
            
            <div className="news-form-card" style={{ background: '#FFF6E5', borderRadius: 18, boxShadow: '0 4px 18px rgba(205,139,62,0.10)', padding: '2rem 2.5rem', marginBottom: 32, maxWidth: 700, width: '100%', margin: '0 auto' }}>
              <form onSubmit={editIdx === null ? handleAdd : handleUpdate}>
                <div className="form-content" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="image-upload-section" style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Upload Image:</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: 6, color: '#3F2E1E', fontSize: 13 }} />
                    {form.image && (
                      typeof form.image === 'string' ? (
                        <img src={form.image} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '2px solid #f2e4ce', background: '#f9f9f9' }} />
                      ) : (
                        <img src={URL.createObjectURL(form.image)} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '2px solid #f2e4ce', background: '#f9f9f9' }} />
                      )
                    )}
                  </div>
                  <input name="title" id="title" value={form.title} onChange={handleChange} placeholder="Title" type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, outline: 'none', color: '#3F2E1E', marginBottom: 8 }} />
                  <input name="date" id="date" value={form.date} onChange={handleChange} placeholder="Date" type="date" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, outline: 'none', color: '#3F2E1E', marginBottom: 8 }} />
                  <textarea name="content" id="content" value={form.content || ''} onChange={handleChange} placeholder="Content" required style={{ width: '100%', minHeight: 80, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, outline: 'none', color: '#3F2E1E', resize: 'vertical', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                    <button 
                      type="submit" 
                      disabled={isLoading || isEditLoading}
                      style={{ background: '#CD8B3E', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }}
                    >
                      {editIdx === null ? 'Add News' : 'Update News'}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      disabled={isLoading || isEditLoading}
                      style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        {/* News Grid */}
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
          {(Array.isArray(news) ? news : []).length === 0 ? (
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
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
                No News Yet
              </h3>
              <p style={{ 
                color: '#718096', 
                fontSize: '1rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto',
                position: 'relative'
              }}>
                Start sharing updates by creating your first news article
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
              {(Array.isArray(news) ? news : []).map((item, idx) => (
                <div 
                  key={idx} 
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
                      src={item.image ? (item.image.startsWith('data:') ? item.image : item.image) : 'https://placehold.co/300x200?text=News'}
                      alt={item.title}
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
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'}
                      </div>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        color: '#3F2E1E',
                        textAlign: 'center',
                        lineHeight: '1'
                      }}>
                        {item.date ? new Date(item.date).getDate() : '?'}
                      </div>
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
                      {item.title}
                    </h3>
                    
                    {/* News Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      {/* Full Date */}
                      {item.date && (
                        <div style={{ 
                          color: '#718096', 
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          marginBottom: '0.75rem'
                        }}>
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}

                    </div>

                    {/* Content */}
                    {item.content && (
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
                        {item.content}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(idx);
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
                        Edit News
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(idx);
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
} 