import React, { useEffect, useState, useRef } from 'react';
import { Pencil, Trash, UserCircle } from 'lucide-react';
import { api } from '../../utils/axios';
import '../../../css/AdminShrineRectors.css';
const initialForm = {
  name: '',
  years: '',
  ordination_date: '',
  description: '',
  type: 'current', // 'current' or 'past'
  image: null,
};

// Helper function to check if image path is valid
const isValidImagePath = (imagePath) => {
  return imagePath && 
         imagePath !== 'null' && 
         imagePath !== 'undefined' && 
         typeof imagePath === 'string' && 
         imagePath.trim() !== '';
};

// Helper function to get image URL (returns null if no valid image)
const getImageUrl = (imagePath, refreshKey = null) => {
  if (isValidImagePath(imagePath)) {
    return refreshKey ? `/storage/${imagePath}?v=${refreshKey}` : `/storage/${imagePath}`;
  }
  return null; // Return null to indicate no image
};

// Icon placeholder component for default rector image
const RectorImagePlaceholder = ({ size = 120, className = '', grayscale = false }) => (
  <UserCircle 
    size={size * 0.6} 
    style={{ 
      color: '#CD8B3E',
      opacity: grayscale ? 0.5 : 0.6,
      filter: grayscale ? 'grayscale(20%)' : 'none'
    }}
    className={className}
  />
);

// Reusable component for rector image display with error handling
const RectorImageContainer = ({ rector, imageRefreshKey, size = 120, grayscale = false, showBadge = false, badgeType = 'current' }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getImageUrl(rector.image, imageRefreshKey);
  const hasValidImage = imageUrl && !imageError;

  // Reset error state when imageRefreshKey or image changes
  useEffect(() => {
    setImageError(false);
  }, [imageRefreshKey, rector.image]);

  return (
    <div style={{ 
      flexShrink: 0,
      width: `${size}px`, 
      height: `${size}px`, 
      borderRadius: '50%', 
      overflow: 'hidden',
      border: '3px solid rgba(205, 139, 62, 0.1)',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {hasValidImage ? (
        <img
          key={`${rector.id}-${rector.image}-${imageRefreshKey}`}
          src={imageUrl}
          alt={rector.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            objectFit: 'cover',
            filter: grayscale ? 'grayscale(20%)' : 'none'
          }}
          onLoad={() => {
            if (isValidImagePath(rector.image)) {
              console.log('✅ Image loaded successfully for:', rector.name);
            }
            setImageError(false);
          }}
          onError={() => {
            console.warn(`⚠️ Image not found for rector "${rector.name}".`);
            setImageError(true);
          }}
        />
      ) : (
        <RectorImagePlaceholder size={size} grayscale={grayscale} />
      )}
      {showBadge && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: badgeType === 'current' 
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: '600',
          border: '2px solid white',
          boxShadow: badgeType === 'current'
            ? '0 2px 8px rgba(34, 197, 94, 0.3)'
            : '0 2px 8px rgba(107, 114, 128, 0.3)'
        }}>
          {badgeType === 'current' ? '✓' : '◐'}
        </div>
      )}
    </div>
  );
};

const ShrineRectorsAdmin = () => {
  const [rectors, setRectors] = useState([]);
  const [editingRector, setEditingRector] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [addingRector, setAddingRector] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRectors();
  }, []);

  const fetchRectors = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shrine-rectors');
      const rectorsArr = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
      console.log('📥 Fetched rectors:', rectorsArr);
      rectorsArr.forEach(rector => {
        console.log(`📥 Rector ${rector.name} image path:`, rector.image);
        if (isValidImagePath(rector.image)) {
          console.log(`📥 Rector ${rector.name} full image URL would be:`, `/storage/${rector.image}`);
        } else {
          console.log(`📥 Rector ${rector.name} has no image, will use default`);
        }
      });
      setRectors(rectorsArr);
    } catch (err) {
      console.error('Fetch rectors error:', err);
      setError('Failed to fetch rectors.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleEdit = (rector) => {
    console.log('Editing rector:', rector);
    console.log('Rector image path:', rector.image);
    setEditingRector(rector.id);
    setForm({ ...rector, image: rector.image || null }); // always string or null
    setSuccess('');
    setError('');
    setAdding(false);
    // Clean up any existing preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null); // reset preview when editing
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditingRector(null);
    setForm(initialForm);
    setSuccess('');
    setError('');
    setAdding(false);
    setShowModal(false);
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      console.log('File selected:', file);
      console.log('Current previewUrl before:', previewUrl);
      
      setForm((prev) => ({ ...prev, [name]: file }));
      
      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      if (file) {
        // Create new preview URL
        const url = URL.createObjectURL(file);
        console.log('New preview URL created:', url);
        setPreviewUrl(url);
      } else {
        console.log('No file, setting preview to null');
        setPreviewUrl(null);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Show animation for adding new rector
    if (!editingRector) {
      setAddingRector(true);
    }
    
    // Prevent more than two current rectors
    if (form.type === 'current') {
      const currentCount = rectors.filter(r => r.type === 'current' && r.id !== editingRector).length;
      if (currentCount >= 2) {
        setLoading(false);
        setAddingRector(false);
        setError('You can only have up to two current rectors.');
        return;
      }
    }
    
    // Minimum wait time for animation (similar to logout)
    const minWait = !editingRector ? new Promise(resolve => setTimeout(resolve, 2500)) : Promise.resolve();
    
    try {
      const formData = new FormData();
      console.log('Form data before processing:', form);
      
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value instanceof File) {
            console.log('Adding image file:', value.name, value.size);
            formData.append('image', value);
          } else {
            console.log('Image is not a file:', typeof value, value);
          }
        } else {
          console.log(`Adding ${key}:`, value);
          formData.append(key, value);
        }
      });
      
      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      let response;
      if (editingRector) {
        // For updates with file uploads, use POST with _method=PATCH
        formData.append('_method', 'PATCH');
        response = await api.post(`/shrine-rectors/${editingRector}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Rector updated successfully!');
        
        // Update the specific rector in the state immediately with the response data
        if (response.data) {
          console.log('Updated rector response:', response.data);
          console.log('Updated rector image path:', response.data.image);
          setRectors(prevRectors => 
            prevRectors.map(rector => 
              rector.id === editingRector ? response.data : rector
            )
          );
          // Force image refresh
          setImageRefreshKey(Date.now());
        }
      } else {
        response = await api.post('/shrine-rectors', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        // Wait for animation to complete
        await minWait;
        
        setSuccess('Rector added successfully!');
        
        // Add the new rector to the state immediately
        if (response.data) {
          console.log('New rector response:', response.data);
          console.log('New rector image path:', response.data.image);
          setRectors(prevRectors => [response.data, ...prevRectors]);
          // Force image refresh for new rector
          setImageRefreshKey(Date.now());
        }
      }
      
      setEditingRector(null);
      setAdding(false);
      setAddingRector(false);
      setForm(initialForm);
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Also fetch fresh data to ensure consistency
      setTimeout(() => {
        fetchRectors();
      }, 100);
      
    } catch (err) {
      console.error('Save error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(`Validation errors: ${errorMessages.join(', ')}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to save rector: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setAddingRector(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rector?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/shrine-rectors/${id}`);
      setSuccess('Rector deleted successfully!');
      fetchRectors();
    } catch (err) {
      setError('Failed to delete rector.');
    } finally {
      setLoading(false);
    }
  };

  // Animate modal in on mount
  useEffect(() => {
    if (adding || editingRector) {
      setTimeout(() => setShowModal(true), 10);
    } else {
      setShowModal(false);
    }
  }, [adding, editingRector]);

  // Close modal properly when success message is shown
  useEffect(() => {
    if (success && !adding && !editingRector) {
      setShowModal(false);
    }
  }, [success, adding, editingRector]);

  // Animation CSS for modal (inject only once, after mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('rector-modal-anim-style')) {
      const style = document.createElement('style');
      style.id = 'rector-modal-anim-style';
      style.innerHTML = `
        .rector-modal-anim {
          opacity: 0;
          transform: scale(0.85);
        }
        .rector-modal-anim.rector-modal-anim-in {
          opacity: 1;
          transform: scale(1);
          transition: transform 0.35s cubic-bezier(.4,1.6,.4,1), opacity 0.35s cubic-bezier(.4,1.6,.4,1);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Clean up previewUrl when component unmounts or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentRectors = (Array.isArray(rectors) ? rectors : []).filter(r => r.type === 'current');
  const pastRectors = (Array.isArray(rectors) ? rectors : []).filter(r => r.type === 'past');

  if (initialLoading) {
    return <div className="loading-users">Loading shrine rectors...</div>;
  }

  return (
    <div className="sacraments-container responsive-admin-shrine-rectors" style={{ maxWidth: '90%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 600px) {
          .responsive-admin-shrine-rectors {
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
        <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Shrine Rectors</h1>
        <button
          onClick={() => { 
            setAdding(true); 
            setEditingRector(null); 
            setForm(initialForm); 
            setSuccess('');
            setError('');
            // Clean up any existing preview URL
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setShowModal(true); 
          }}
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
          + Add Rector
        </button>
        </div>
      {loading && <div style={{ color: '#CD8B3E', fontWeight: 600 }}>Loading...</div>}
      {error && !adding && !editingRector && <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div>}
      {success && !adding && !editingRector && <div style={{ color: '#15803d', fontWeight: 600 }}>{success}</div>}
      {(adding || editingRector) && (
        <div className="shrine-rectors-modal-backdrop">
          <div className={`shrine-rectors-modal-content rector-modal-anim${showModal ? ' rector-modal-anim-in' : ''}`}> 
            <div className="shrine-rectors-modal-header">
              <h3>{editingRector ? 'Edit Rector' : 'Add Rector'}</h3>
              <button className="shrine-rectors-modal-close-btn" onClick={handleCancel} title="Close">×</button>
            </div>
            {/* Error and Success Messages inside Modal */}
            {error && (adding || editingRector) && (
              <div style={{ 
                color: '#b91c1c', 
                fontWeight: 600, 
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            {success && (adding || editingRector) && (
              <div style={{ 
                color: '#15803d', 
                fontWeight: 600, 
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); handleSave(); }} style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Name<br /><input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e2cfa3', marginTop: 4 }} /></label>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Years<br /><input type="date" name="years" value={form.years} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e2cfa3', marginTop: 4 }} /></label>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Type<br /><select name="type" value={form.type} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e2cfa3', marginTop: 4 }}><option value="current">Current</option><option value="past">Past</option></select></label>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Ordination Date<br /><input type="date" name="ordination_date" value={form.ordination_date} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e2cfa3', marginTop: 4 }} /></label>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Image<br />
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      name="image" 
                      accept="image/*" 
                      onChange={handleChange} 
                      style={{ marginTop: 4 }} 
                    />
                  </label>
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    {(() => {
                      if (previewUrl) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: '50%', 
                              overflow: 'hidden',
                              border: '2px solid #F7F3ED',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                            }}>
                              <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { 
                                  e.target.onerror = null; 
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '10px', color: 'green' }}>Preview</div>
                          </div>
                        );
                      } else if (isValidImagePath(form.image)) {
                        const imageUrl = getImageUrl(form.image);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: '50%', 
                              overflow: 'hidden',
                              border: '2px solid #F7F3ED',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                            }}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={form.name || 'Rector'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { 
                                    e.target.onerror = null; 
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <RectorImagePlaceholder size={60} />
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: 'blue' }}>Existing</div>
                          </div>
                        );
                      } else {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: '50%', 
                              overflow: 'hidden',
                              border: '2px solid #F7F3ED',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                            }}>
                              <RectorImagePlaceholder size={60} />
                            </div>
                            <div style={{ fontSize: '10px', color: '#CD8B3E' }}>No Image</div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontWeight: 600, color: '#3F2E1E' }}>Description<br /><textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e2cfa3', marginTop: 4 }} /></label>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="submit" style={{ background: '#CD8B3E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}>{editingRector ? 'Save' : 'Add'}</button>
                <button type="button" onClick={handleCancel} style={{ background: '#eee', color: '#3F2E1E', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Current Shrine Rectors */}
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
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '1.5rem' }}>Current Shrine Rectors</h3>
        {currentRectors.length === 0 ? (
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '0.5rem' }}>No Current Rectors</h3>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>Add current shrine rectors to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentRectors.map((rector) => (
              <div key={rector.id} style={{ 
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid rgba(205, 139, 62, 0.1)',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(205, 139, 62, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(205, 139, 62, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(205, 139, 62, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.1)';
              }}
              >
                {/* Image Section */}
                <RectorImageContainer 
                  rector={rector}
                  imageRefreshKey={imageRefreshKey}
                  size={120}
                  showBadge={true}
                  badgeType="current"
                />

                {/* Content Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ 
                    margin: '0', 
                    color: '#2d3748', 
                    fontSize: '1.4rem', 
                    fontWeight: '700',
                    lineHeight: '1.3',
                    letterSpacing: '-0.025em'
                  }}>
                    {rector.name}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                        Years: {rector.years}
                      </span>
                    </div>
                    {rector.ordination_date && (
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
                          Ordained: {rector.ordination_date}
                        </span>
                      </div>
                    )}
                  </div>

                  {rector.description && (
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      color: '#4a5568', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {rector.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(rector);
                    }}
                    style={{ 
                      background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.5rem 1rem', 
                      fontWeight: '600', 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(205, 139, 62, 0.2)',
                      letterSpacing: '0.025em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minWidth: '80px'
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
                    <Pencil size={14} />
                    Edit
                    </button>
                  
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rector.id);
                    }}
                    style={{ 
                      background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.5rem 1rem', 
                      fontWeight: '600', 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(229, 62, 62, 0.2)',
                      letterSpacing: '0.025em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minWidth: '80px'
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
                    <Trash size={14} />
                    Delete
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Past Shrine Rectors */}
      <div className="user-table-wrapper" style={{ 
        background: 'white',
        borderRadius: '0.75rem',
        border: '1.5px solid #f2e4ce',
        overflowX: 'auto',
        boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '1.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '1.5rem' }}>Past Shrine Rectors</h3>
        {pastRectors.length === 0 ? (
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
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3F2E1E', marginBottom: '0.5rem' }}>No Past Rectors</h3>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>Past shrine rectors will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pastRectors.map((rector) => (
              <div key={rector.id} style={{ 
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid rgba(205, 139, 62, 0.1)',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(205, 139, 62, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                opacity: '0.85'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(205, 139, 62, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.2)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(205, 139, 62, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.1)';
                e.currentTarget.style.opacity = '0.85';
              }}
              >
                {/* Image Section */}
                <RectorImageContainer 
                  rector={rector}
                  imageRefreshKey={imageRefreshKey}
                  size={120}
                  grayscale={true}
                  showBadge={true}
                  badgeType="past"
                />

                {/* Content Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ 
                    margin: '0', 
                    color: '#2d3748', 
                    fontSize: '1.4rem', 
                    fontWeight: '700',
                    lineHeight: '1.3',
                    letterSpacing: '-0.025em'
                  }}>
                    {rector.name}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                        Years: {rector.years}
                      </span>
                    </div>
                    {rector.ordination_date && (
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
                          Ordained: {rector.ordination_date}
                        </span>
                      </div>
                    )}
                  </div>

                  {rector.description && (
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      color: '#4a5568', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {rector.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(rector);
                    }}
                    style={{ 
                      background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.5rem 1rem', 
                      fontWeight: '600', 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(205, 139, 62, 0.2)',
                      letterSpacing: '0.025em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minWidth: '80px'
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
                    <Pencil size={14} />
                    Edit
                    </button>
                  
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rector.id);
                    }}
                    style={{ 
                      background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.5rem 1rem', 
                      fontWeight: '600', 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(229, 62, 62, 0.2)',
                      letterSpacing: '0.025em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minWidth: '80px'
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
                    <Trash size={14} />
                    Delete
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Adding Rector Animation Overlay */}
      {addingRector && (
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
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>Adding rector...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShrineRectorsAdmin; 