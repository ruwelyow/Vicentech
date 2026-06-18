import React, { useEffect, useState } from 'react';
import { api } from '../../utils/axios';
import "/resources/css/AdminGallery.css";

const AdminGallery = () => {
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [newAlbum, setNewAlbum] = useState({ title: '', description: '' });
  const [addingAlbum, setAddingAlbum] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [imageMetas, setImageMetas] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [deleteAlbumId, setDeleteAlbumId] = useState(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  // Utility function to show toast notifications
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `${type}-toast`;
    toast.innerHTML = `
      <div class="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; color: ${type === 'success' ? '#22c55e' : '#ef4444'};">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-left: 4px solid ${type === 'success' ? '#22c55e' : '#ef4444'};
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    // Remove toast after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  };

  const fetchAlbums = async () => {
    const res = await api.get('/admin/albums');
    console.log('Albums API response:', res.data);
    // Defensive: ensure albums is always an array
    let albumsArr = [];
    if (Array.isArray(res.data)) {
      albumsArr = res.data;
    } else if (res.data && Array.isArray(res.data.data)) {
      albumsArr = res.data.data;
    } else {
      albumsArr = [];
    }
    setAlbums(albumsArr);
  };

  const handleAddAlbum = async () => {
    await api.post('/admin/albums', newAlbum);
    setNewAlbum({ title: '', description: '' });
    setAddingAlbum(false);
    fetchAlbums();
  };

  const handleDeleteAlbum = (id) => {
    setDeleteAlbumId(id);
    setDeleteImageId(null);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAlbum = async () => {
    try {
      await api.delete(`/admin/albums/${deleteAlbumId}`);
      setActiveAlbum(null);
      fetchAlbums();
      showToast('Album deleted successfully!', 'success');
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast('Failed to delete album. Please try again.', 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteAlbumId(null);
  };

  const handleAddImages = async (e) => {
    e.preventDefault();
    
    // Check if at least one image is selected
    if (newImages.length === 0) {
      alert('Please select at least one image to upload.');
      return;
    }
    
    const formData = new FormData();
    newImages.forEach(file => {
      formData.append('images[]', file);
    });
    setUploading(true);
    try {
      const res = await api.post(`/admin/albums/${activeAlbum.id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Gallery upload progress: ${progress}%`);
        }
      });
      const updatedAlbum = res.data;
      // Update activeAlbum and albums state with the new images
      setActiveAlbum(prev => ({ ...prev, images: updatedAlbum.images }));
      setAlbums(prevAlbums =>
        prevAlbums.map(album =>
          album.id === activeAlbum.id
            ? { ...album, images: updatedAlbum.images }
            : album
        )
      );
      setNewImages([]);
      setShowUploadForm(false);
      showToast('Images uploaded successfully!', 'success');
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast('Failed to upload images. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (imgId) => {
    setDeleteImageId(imgId);
    setDeleteAlbumId(null);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteImage = async () => {
    try {
      await api.delete(`/admin/albums/${activeAlbum.id}/images/${deleteImageId}`);
      // Remove the image from activeAlbum state
      setActiveAlbum(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== deleteImageId)
      }));
      // Also update the albums list
      setAlbums(prevAlbums =>
        prevAlbums.map(album =>
          album.id === activeAlbum.id
            ? { ...album, images: album.images.filter(img => img.id !== deleteImageId) }
            : album
        )
      );
      showToast('Image deleted successfully!', 'success');
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast('Failed to delete image. Please try again.', 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteImageId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteImageId(null);
    setDeleteAlbumId(null);
  };


  return (
    <>
      {/* Full Screen Loading Overlay */}
      {uploading && (
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
              Uploading images...
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
              {deleteImageId 
                ? 'Are you sure you want to delete this image? This action cannot be undone.'
                : 'Are you sure you want to delete this album? This will also delete all images in the album. This action cannot be undone.'
              }
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
                onClick={deleteImageId ? confirmDeleteImage : confirmDeleteAlbum}
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

    <div className="sacraments-container responsive-admin-gallery" style={{ maxWidth: '85%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 600px) {
          .responsive-admin-gallery {
            width: 95vw !important;
            max-width: 100vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
      {!activeAlbum ? (
        <>
          <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
            <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Gallery</h1>
            <button
              onClick={() => setAddingAlbum(true)}
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
              + Add Album
            </button>
          </div>
            {/* Add Album Modal */}
            {addingAlbum && (
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
                      Add New Album
                    </h2>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      margin: '0.5rem 0 0 0', 
                      opacity: 0.9,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      Create a new photo album for your gallery
                    </p>
                    <button 
                      onClick={() => setAddingAlbum(false)} 
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
                  
                  <div style={{ 
                    background: '#FFF6E5', 
                    borderRadius: 18, 
                    boxShadow: '0 4px 18px rgba(205,139,62,0.10)', 
                    padding: '2rem 2.5rem', 
                    marginBottom: 32, 
                    maxWidth: 700, 
                    width: '100%', 
                    margin: '0 auto' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 500, margin: '0 auto' }}>
                      <input 
                        placeholder="Album Title" 
                        value={newAlbum.title} 
                        onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })}
                        style={{ padding: '0.6rem 1rem', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff' }}
                      />
                      <input 
                        placeholder="Album Description" 
                        value={newAlbum.description} 
                        onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
                        style={{ padding: '0.6rem 1rem', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff' }}
                      />
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                        <button 
                          onClick={handleAddAlbum}
                          style={{ background: '#CD8B3E', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }}
                        >
                          Save Album
                        </button>
                        <button 
                          onClick={() => setAddingAlbum(false)}
                          style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              {(Array.isArray(albums) ? albums : []).length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#5C4B38'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ 
                    width: '64px', 
                    height: '64px', 
                    margin: '0 auto 1rem', 
                    color: '#CD8B3E' 
                  }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '0.5rem' }}>No Albums Yet</h3>
                  <p style={{ color: '#555', fontSize: '0.95rem' }}>Create your first album to get started</p>
                </div>
              ) : (
                <div className="admin-gallery-album-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {(Array.isArray(albums) ? albums : []).map(album => (
                  <div key={album.id} className="admin-gallery-album-card" style={{ 
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1.5px solid #f2e4ce',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(60, 47, 30, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#3F2E1E', fontSize: '1.25rem', fontWeight: '700' }}>{album.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.95rem' }}>{album.description}</p>
                    <p style={{ margin: '0 0 1rem 0', color: '#CD8B3E', fontSize: '0.9rem', fontWeight: '600' }}>Images: {album.images.length}</p>
                    <div className="button-group" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                      <button 
                        onClick={() => setActiveAlbum(album)}
                        style={{ 
                          background: '#CD8B3E', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '0.5rem 1rem', 
                          fontWeight: '600', 
                          fontSize: '0.9rem', 
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteAlbum(album.id)}
                        style={{ 
                          background: '#e74c3c', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '0.5rem 1rem', 
                          fontWeight: '600', 
                          fontSize: '0.9rem', 
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
        </>
      ) : (
        <>
          <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveAlbum(null)}
                style={{ 
                  minHeight: 44, 
                  fontWeight: 600, 
                  fontSize: '1.2rem', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 2px 4px rgba(60, 47, 30, 0.1)', 
                  background: 'rgb(205, 139, 62)', 
                  color: 'white', 
                  padding: '0.625rem', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 'auto',
                  minWidth: 44,
                  flexShrink: 0
                }}
                title="Back to Albums"
              >
                ←
              </button>
              <h1 className="sacraments-title" style={{ fontSize: '2rem', margin: 0, flex: 1, minWidth: '200px' }}>Album: {activeAlbum.title}</h1>
            </div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
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
                maxWidth: 200,
                marginBottom: '1.5rem'
              }}
            >
              {showUploadForm ? 'Cancel Upload' : 'Upload Images'}
            </button>
          </div>
          
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
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '0.5rem' }}>Album Details</h3>
              <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '0.5rem' }}><strong>Title:</strong> {activeAlbum.title}</p>
              <p style={{ color: '#555', fontSize: '0.95rem' }}><strong>Description:</strong> {activeAlbum.description || 'No description'}</p>
            </div>
            {/* Upload Images Modal */}
            {showUploadForm && (
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
                      Upload Images
                    </h2>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      margin: '0.5rem 0 0 0', 
                      opacity: 0.9,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      Add new images to "{activeAlbum.title}" album
                    </p>
                    <button 
                      onClick={() => setShowUploadForm(false)} 
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
                  
                  <div style={{ 
                    background: '#FFF6E5', 
                    borderRadius: 18, 
                    boxShadow: '0 4px 18px rgba(205,139,62,0.10)', 
                    padding: '2rem 2.5rem', 
                    marginBottom: 32, 
                    maxWidth: 700, 
                    width: '100%', 
                    margin: '0 auto' 
                  }}>
                    <form onSubmit={handleAddImages} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Select Images</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={e => setNewImages(Array.from(e.target.files))}
                          style={{ 
                            width: '100%', 
                            padding: '0.6rem', 
                            borderRadius: '6px', 
                            border: '1.5px solid #e2cfa3', 
                            fontSize: '0.9rem', 
                            color: '#3F2E1E', 
                            background: '#fff' 
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                          type="submit" 
                          disabled={uploading || newImages.length === 0}
                          style={{ 
                            background: (uploading || newImages.length === 0) ? '#ccc' : '#CD8B3E', 
                            color: 'white', 
                            borderRadius: '6px', 
                            padding: '0.625rem 1.5rem', 
                            fontWeight: '600', 
                            fontSize: '0.9rem', 
                            border: 'none', 
                            flex: 1,
                            cursor: (uploading || newImages.length === 0) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {uploading ? 'Uploading...' : newImages.length === 0 ? 'Select Images First' : 'Upload Images'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowUploadForm(false)}
                          style={{ 
                            background: '#eee', 
                            color: '#3F2E1E', 
                            borderRadius: '6px', 
                            padding: '0.625rem 1.5rem', 
                            fontWeight: '600', 
                            fontSize: '0.9rem', 
                            border: 'none', 
                            flex: 1,
                            cursor: 'pointer'
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
            
            {activeAlbum.images.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                color: '#5C4B38'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 1rem', 
                  color: '#CD8B3E' 
                }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '0.5rem' }}>No Images Yet</h3>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>Upload your first images to get started</p>
              </div>
            ) : (
              <div className="admin-gallery-image-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {activeAlbum.images.map(img => (
                <div key={img.id} style={{ 
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1.5px solid #f2e4ce',
                  padding: '1rem',
                  boxShadow: '0 2px 8px rgba(60, 47, 30, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '180px', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    border: '1.5px solid #f2e4ce',
                    background: '#f9f9f9'
                  }}>
                    <img 
                      src={img.image_data ? `data:${img.image_mime};base64,${img.image_data}` : 'https://placehold.co/320x120?text=No+Image'} 
                      alt={img.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteImage(img.id)}
                      style={{ 
                        background: '#e74c3c', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        padding: '0.4rem 0.8rem', 
                        fontWeight: '600', 
                        fontSize: '0.8rem', 
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
};

export default AdminGallery; 
