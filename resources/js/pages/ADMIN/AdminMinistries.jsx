import React from 'react';
import '../../../css/Adminannouncements.css';
import { api } from '../../utils/axios';

const AdminMinistries = ({
  ministries,
  editingMinistryId,
  ministryFields,
  ministryImagePreview,
  setEditingMinistryId,
  setMinistryFields,
  setMinistryImagePreview,
  setMinistries,
  handleMinistryImageFile,
  fetchMinistries,
  loading = false,
}) => {
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditLoading, setIsEditLoading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteMinistryId, setDeleteMinistryId] = React.useState(null);

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `${type}-toast`;
    toast.innerHTML = `
      <div class="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; color: white;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 4000);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});
    
    // Validate name is not empty
    if (!ministryFields.name || !ministryFields.name.trim()) {
      setErrors({ name: ['The ministry name field is required.'] });
      setIsLoading(false);
      showToast('Please enter a ministry name.', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', ministryFields.name.trim());
    formData.append('description', ministryFields.description || '');
    formData.append('order', ministryFields.order || 0);
    if (ministryFields.image instanceof File) {
      formData.append('image', ministryFields.image);
    }

    try {
      const res = await api.post('/ministries', formData);
      
      if (res.data.success !== false) {
        const newMinistry = res.data.ministry || res.data;
        setMinistries(prev => [newMinistry, ...prev]);
        setEditingMinistryId(null);
        setMinistryImagePreview('');
        setMinistryFields({ name: '', description: '', image: null, order: 0 });
        setErrors({});
        showToast('🎉 Ministry created successfully!', 'success');
        fetchMinistries();
      } else {
        setErrors(res.data.errors || {});
        showToast(res.data.message || 'Failed to create ministry.', 'error');
      }
    } catch (error) {
      console.error('Ministry creation error:', error);
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        showToast(error.response.data.message || 'Please check the form for errors.', 'error');
      } else {
        showToast('Failed to create ministry. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ministry) => {
    setEditingMinistryId(ministry.id);
    setMinistryFields({
      name: ministry.name,
      description: ministry.description || '',
      image: null,
      order: ministry.order || 0,
    });
    if (ministry.image_data && ministry.image_mime) {
      setMinistryImagePreview(`data:${ministry.image_mime};base64,${ministry.image_data}`);
    } else {
      setMinistryImagePreview('');
    }
    setErrors({});
  };

  const handleUpdate = async () => {
    setIsEditLoading(true);
    setErrors({});
    
    // Validate name is not empty
    if (!ministryFields.name || !ministryFields.name.trim()) {
      setErrors({ name: ['The ministry name field is required.'] });
      setIsEditLoading(false);
      showToast('Please enter a ministry name.', 'error');
      return;
    }
    
    // Build the data object
    const updateData = {
      name: ministryFields.name.trim(),
      description: ministryFields.description || '',
      order: ministryFields.order !== null && ministryFields.order !== undefined 
        ? parseInt(ministryFields.order, 10) 
        : 0,
    };

    // If there's a new image, use FormData with POST + _method=PUT, otherwise use JSON with PUT
    try {
      let res;
      if (ministryFields.image instanceof File) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', updateData.name);
        formData.append('description', updateData.description);
        formData.append('order', updateData.order.toString());
        formData.append('image', ministryFields.image);

        // Debug: Log FormData contents
        console.log('Updating ministry with FormData:', {
          id: editingMinistryId,
          name: updateData.name,
          description: updateData.description,
          order: updateData.order,
          hasImage: true
        });

        // Use POST route for FormData updates (workaround for PUT with FormData in API routes)
        res = await api.post(`/ministries/${editingMinistryId}/update`, formData);
      } else {
        // No image update, send as JSON with PUT
        console.log('Updating ministry with JSON:', {
          id: editingMinistryId,
          name: updateData.name,
          description: updateData.description,
          order: updateData.order,
          hasImage: false
        });

        res = await api.put(`/ministries/${editingMinistryId}`, updateData);
      }
      
      if (res.data.success !== false) {
        setMinistries(prev => prev.map(m => m.id === editingMinistryId ? (res.data.ministry || res.data) : m));
        setEditingMinistryId(null);
        setMinistryImagePreview('');
        setMinistryFields({ name: '', description: '', image: null, order: 0 });
        setErrors({});
        showToast('✅ Ministry updated successfully!', 'success');
        fetchMinistries();
      } else {
        setErrors(res.data.errors || {});
        showToast(res.data.message || 'Failed to update ministry.', 'error');
      }
    } catch (error) {
      console.error('Ministry update error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Validation errors:', error.response?.data?.errors);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        console.error('Full validation errors object:', JSON.stringify(validationErrors, null, 2));
        setErrors(validationErrors);
        
        // Get first error message to display
        let errorMessage = error.response.data.message || 'Please check the form for errors.';
        if (Object.keys(validationErrors).length > 0) {
          const firstErrorKey = Object.keys(validationErrors)[0];
          const firstError = validationErrors[firstErrorKey];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = `${firstErrorKey}: ${firstError[0]}`;
          } else if (typeof firstError === 'string') {
            errorMessage = `${firstErrorKey}: ${firstError}`;
          }
        }
        
        showToast(errorMessage, 'error');
      } else {
        showToast(error.response?.data?.message || 'Failed to update ministry. Please try again.', 'error');
      }
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteMinistryId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/ministries/${deleteMinistryId}`);
      setMinistries(prev => prev.filter(m => m.id !== deleteMinistryId));
      showToast('Ministry deleted successfully!', 'success');
      fetchMinistries();
    } catch (error) {
      showToast('Failed to delete ministry. Please try again.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteMinistryId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteMinistryId(null);
  };

  const cancelEdit = () => {
    setEditingMinistryId(null);
    setMinistryImagePreview('');
    setMinistryFields({ name: '', description: '', image: null, order: 0 });
    setErrors({});
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
              {isLoading ? 'Creating ministry...' : 'Updating ministry...'}
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
              Delete Ministry
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this ministry? This action cannot be undone.
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
                  background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
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
          <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Ministries</h1>
          {!editingMinistryId && (
            <button
              onClick={() => setEditingMinistryId('new')}
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
              + Add Ministry
            </button>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {(editingMinistryId === 'new' || editingMinistryId) && (
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
                  {editingMinistryId === 'new' ? 'Add Ministry' : 'Edit Ministry'}
                </h2>
                <p style={{ 
                  fontSize: '0.9rem', 
                  margin: '0.5rem 0 0 0', 
                  opacity: 0.9,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {editingMinistryId === 'new' ? 'Create a new ministry for your parish' : 'Update the ministry information'}
                </p>
                <button 
                  onClick={cancelEdit} 
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
                <div className="form-content" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                      Ministry Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={ministryFields.name}
                      onChange={(e) => setMinistryFields({ ...ministryFields, name: e.target.value })}
                      placeholder="e.g., Cofradia del Sto. Niño"
                      required
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        borderRadius: 8, 
                        border: errors.name ? '2px solid #dc3545' : '1.5px solid #f2e4ce', 
                        fontSize: 15, 
                        outline: 'none', 
                        color: '#3F2E1E', 
                        marginBottom: 8 
                      }}
                    />
                    {errors.name && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.name[0]}</p>}
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={ministryFields.description}
                      onChange={(e) => setMinistryFields({ ...ministryFields, description: e.target.value })}
                      placeholder="Enter a description for this ministry..."
                      style={{ 
                        width: '100%', 
                        minHeight: 80, 
                        padding: '10px 14px', 
                        borderRadius: 8, 
                        border: '1.5px solid #f2e4ce', 
                        fontSize: 15, 
                        outline: 'none', 
                        color: '#3F2E1E', 
                        resize: 'vertical', 
                        marginBottom: 8 
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={ministryFields.order}
                      onChange={(e) => setMinistryFields({ ...ministryFields, order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        borderRadius: 8, 
                        border: '1.5px solid #f2e4ce', 
                        fontSize: 15, 
                        outline: 'none', 
                        color: '#3F2E1E', 
                        marginBottom: 8 
                      }}
                    />
                    <p style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Lower numbers appear first
                    </p>
                  </div>

                  <div className="image-upload-section" style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>Upload Image:</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleMinistryImageFile(e, setMinistryFields, setMinistryImagePreview)} 
                      style={{ marginTop: 6, color: '#3F2E1E', fontSize: 13 }} 
                    />
                    {ministryImagePreview && (
                      <img 
                        src={ministryImagePreview} 
                        alt="preview" 
                        style={{ 
                          width: 120, 
                          height: 90, 
                          objectFit: 'cover', 
                          borderRadius: 8, 
                          marginTop: 8, 
                          border: '2px solid #f2e4ce', 
                          background: '#f9f9f9' 
                        }} 
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                    <button 
                      type="button"
                      onClick={editingMinistryId === 'new' ? handleSave : handleUpdate}
                      disabled={isLoading || isEditLoading}
                      style={{ 
                        background: '#CD8B3E', 
                        color: 'white', 
                        padding: '0.625rem 1.5rem', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        fontWeight: 600, 
                        width: '100%',
                        cursor: (isLoading || isEditLoading) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || isEditLoading) ? 0.6 : 1,
                      }}
                    >
                      {isLoading || isEditLoading ? 'Saving...' : (editingMinistryId === 'new' ? 'Add Ministry' : 'Update Ministry')}
                    </button>
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      disabled={isLoading || isEditLoading}
                      style={{ 
                        background: '#eee', 
                        color: '#3F2E1E', 
                        padding: '0.625rem 1.5rem', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        fontWeight: 600, 
                        width: '100%',
                        cursor: (isLoading || isEditLoading) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ministries Grid */}
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
          {(Array.isArray(ministries) ? ministries : []).length === 0 ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-5.197-5.197" />
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
                No Ministries Yet
              </h3>
              <p style={{ 
                color: '#718096', 
                fontSize: '1rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto',
                position: 'relative'
              }}>
                Start by creating your first ministry
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
              {(Array.isArray(ministries) ? ministries : []).map((ministry) => {
                const imageSrc = ministry.image_data && ministry.image_mime
                  ? `data:${ministry.image_mime};base64,${ministry.image_data}`
                  : 'https://placehold.co/300x200?text=Ministry';
                
                return (
                  <div 
                    key={ministry.id} 
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
                    {/* Image Section with Order Badge */}
                    <div style={{ 
                      position: 'relative',
                      width: '100%', 
                      height: '200px', 
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    }}>
                      <img
                        src={imageSrc}
                        alt={ministry.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                      {/* Order Badge */}
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
                          ORDER
                        </div>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '700', 
                          color: '#3F2E1E',
                          textAlign: 'center',
                          lineHeight: '1'
                        }}>
                          {ministry.order || 0}
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
                        {ministry.name}
                      </h3>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(ministry);
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
                          Edit Ministry
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ministry.id);
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMinistries;
