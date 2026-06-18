import React, { useState, useEffect } from 'react';
import { api } from '../utils/axios';

const AddRecordModal = ({ isOpen, onClose, onSubmit, recordType }) => {
  const [formData, setFormData] = useState({
    type: recordType || 'baptism',
    name: '',
    date: '',
    priest: '',
    status: 'completed',
    details: {},
    notes: '',
    user_id: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Default details for each record type
  const defaultDetails = {
    baptism: {
      father_name: '',
      mother_name: '',
      godparents: '',
      birth_date: '',
      birth_place: ''
    },
    confirmation: {
      sponsor: '',
      bishop: '',
      confirmation_name: '',
      baptism_date: ''
    },
    marriage: {
      spouse: '',
      sponsors: ''
    },
    funeral: {
      deceased: '',
      date_of_death: '',
      cause_of_death: '',
      burial_place: ''
    },
    mass: {
      mass_type: '',
      attendance: '',
      offerings: '',
      special_intention: ''
    }
  };

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/all-users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Reset form when modal opens or record type changes
  useEffect(() => {
    if (isOpen) {
      const initialType = recordType || 'baptism';
      setFormData({
        type: initialType,
        name: '',
        date: '',
        priest: '',
        status: 'completed',
        details: defaultDetails[initialType] ? { ...defaultDetails[initialType] } : {},
        notes: '',
        user_id: null
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      setShowUserDropdown(false);
      setErrors({});
    }
  }, [isOpen, recordType]);

  // Update details when type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      details: defaultDetails[prev.type] ? { ...defaultDetails[prev.type] } : {}
    }));
  }, [formData.type]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDetailChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.date || formData.date.trim() === '') {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.priest || !formData.priest.trim()) {
      newErrors.priest = 'Priest name is required';
    }
    
    // Validate type
    if (!formData.type) {
      newErrors.type = 'Record type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors
    try {
      // Clean and prepare form data for submission
      const cleanedData = {
        ...formData,
        name: formData.name?.trim() || '',
        priest: formData.priest?.trim() || '',
        notes: formData.notes?.trim() || '',
        details: formData.details || {}
      };
      
      await onSubmit(cleanedData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Extract error message from API response
      let errorMessage = 'Failed to create record. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle Laravel validation errors
        if (errorData.errors) {
          const validationErrors = {};
          Object.keys(errorData.errors).forEach(key => {
            validationErrors[key] = Array.isArray(errorData.errors[key]) 
              ? errorData.errors[key][0] 
              : errorData.errors[key];
          });
          setErrors(validationErrors);
          errorMessage = 'Please fix the errors in the form.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const formatFieldLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderDetailFields = () => {
    const details = defaultDetails[formData.type] || {};
    
    // Special handling for baptism records - show labeled fields for father and mother
    if (formData.type === 'baptism') {
      return (
        <>
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Father's Name
            </label>
            <input
              key="father_name"
              type="text"
              value={formData.details.father_name || ''}
              onChange={(e) => handleDetailChange('father_name', e.target.value)}
              placeholder="Enter father's name"
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Mother's Name
            </label>
            <input
              key="mother_name"
              type="text"
              value={formData.details.mother_name || ''}
              onChange={(e) => handleDetailChange('mother_name', e.target.value)}
              placeholder="Enter mother's name"
              disabled={loading}
            />
          </div>
          {Object.keys(details).filter(key => key !== 'father_name' && key !== 'mother_name').map(key => (
            <div key={key}>
              <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {formatFieldLabel(key)}
              </label>
              <input
                type={key.includes('date') ? 'date' : 'text'}
                value={formData.details[key] || ''}
                onChange={(e) => handleDetailChange(key, e.target.value)}
                placeholder={`Enter ${formatFieldLabel(key).toLowerCase()}`}
                disabled={loading}
              />
            </div>
          ))}
        </>
      );
    }
    
    // Default rendering for other record types
    return Object.keys(details).map(key => (
      <div key={key}>
        <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          {formatFieldLabel(key)}
        </label>
        <input
          type={key.includes('date') ? 'date' : 'text'}
          value={formData.details[key] || ''}
          onChange={(e) => handleDetailChange(key, e.target.value)}
          placeholder={`Enter ${formatFieldLabel(key).toLowerCase()}`}
          disabled={loading}
        />
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="add-record-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="add-record-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
          borderRadius: '1rem 1rem 0 0', 
          padding: '1.5rem 2rem', 
          margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
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
            Add New {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Record
          </h2>
          <p style={{ 
            fontSize: '0.9rem', 
            margin: '0.5rem 0 0 0', 
            opacity: 0.9,
            position: 'relative',
            zIndex: 1
          }}>
            Create a new parish record with detailed information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="add-record-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 700, margin: '0 auto', paddingBottom: '1rem' }}>
          {/* Record Type */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Record Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="baptism">Baptism</option>
              <option value="confirmation">Confirmation</option>
              <option value="marriage">Marriage</option>
              <option value="funeral">Funeral</option>
              <option value="mass">Mass</option>
            </select>
          </div>

           {/* User Selection */}
           <div style={{ position: 'relative' }}>
             <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
               Select User (Optional)
             </label>
             <input
               type="text"
               value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearchQuery}
               onChange={(e) => {
                 const value = e.target.value;
                 setUserSearchQuery(value);
                 setShowUserDropdown(true);
                 // Clear selection if user is typing something different
                 if (selectedUser && (!value || !value.includes(selectedUser.name))) {
                   setSelectedUser(null);
                   setFormData(prev => ({ ...prev, user_id: null, name: '' }));
                 }
               }}
               onFocus={() => {
                 if (userSearchQuery || !selectedUser) {
                   setShowUserDropdown(true);
                 }
               }}
               onBlur={() => {
                 // Delay to allow click on dropdown items
                 setTimeout(() => setShowUserDropdown(false), 200);
               }}
               placeholder={selectedUser ? "User selected" : "Type to search for a user..."}
               disabled={loading || loadingUsers}
               style={{ 
                 width: '100%', 
                 padding: '0.6rem 1rem',
                 borderRadius: '10px',
                 border: '2px solid #DED0B6',
                 background: selectedUser ? '#f0fdf4' : '#FFF6E5',
                 color: '#3F2E1E',
                 fontSize: '1rem',
                 fontFamily: 'inherit',
                 transition: 'border 0.2s',
                 marginBottom: 0
               }}
             />
             {showUserDropdown && userSearchQuery && (
               <div style={{
                 position: 'absolute',
                 top: '100%',
                 left: 0,
                 right: 0,
                 background: 'white',
                 border: '2px solid #DED0B6',
                 borderRadius: '10px',
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                 maxHeight: '300px',
                 overflowY: 'auto',
                 zIndex: 5000,
                 marginTop: '4px'
               }}>
                 {(() => {
                   const filteredUsers = users
                     .filter(user => 
                       !user.is_admin && 
                       !user.is_staff && 
                       !user.is_priest &&
                       (user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                     );
                   
                   if (filteredUsers.length === 0) {
                     return (
                       <div style={{
                         padding: '1rem',
                         textAlign: 'center',
                         color: '#6b7280',
                         fontSize: '0.875rem'
                       }}>
                         No person found
                       </div>
                     );
                   }
                   
                   return filteredUsers.map(user => (
                     <div
                       key={user.id}
                       onClick={() => {
                         setSelectedUser(user);
                         setUserSearchQuery('');
                         setShowUserDropdown(false);
                         // Auto-fill name from selected user
                         setFormData(prev => ({ 
                           ...prev, 
                           user_id: user.id,
                           name: user.name || ''
                         }));
                       }}
                       style={{
                         padding: '0.75rem',
                         cursor: 'pointer',
                         borderBottom: '1px solid #f3f4f6',
                         transition: 'background-color 0.2s'
                       }}
                       onMouseEnter={(e) => {
                         e.target.style.backgroundColor = '#f9fafb';
                       }}
                       onMouseLeave={(e) => {
                         e.target.style.backgroundColor = 'white';
                       }}
                     >
                       <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                         {user.name}
                       </div>
                       <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                         {user.email}
                       </div>
                     </div>
                   ));
                 })()}
               </div>
             )}
             {selectedUser && (
               <button
                 type="button"
                 onClick={() => {
                   setSelectedUser(null);
                   setUserSearchQuery('');
                   setFormData(prev => ({ ...prev, user_id: null }));
                 }}
                 style={{
                   position: 'absolute',
                   right: '0.5rem',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   background: 'transparent',
                   border: 'none',
                   color: '#ef4444',
                   cursor: 'pointer',
                   fontSize: '1.2rem',
                   padding: '0.25rem 0.5rem'
                 }}
               >
                 ×
               </button>
             )}
           </div>

           {/* Basic Information */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
              disabled={loading}
            />
            {errors.name && <span style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Record Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Date when the {formData.type} ceremony/event occurred
            </span>
            {errors.date && <span style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.date}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Officiating Priest *
            </label>
            <input
              type="text"
              name="priest"
              value={formData.priest}
              onChange={handleInputChange}
              placeholder="Enter priest name"
              required
              disabled={loading}
            />
            {errors.priest && <span style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.priest}</span>}
          </div>

          {/* Type-specific Details */}
          <div style={{ 
            borderTop: '1px solid #f2e4ce', 
            paddingTop: '1rem', 
            marginTop: '1rem' 
          }}>
            <h3 style={{ 
              color: '#3F2E1E', 
              fontSize: '1.1rem', 
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Details
            </h3>
            {renderDetailFields()}
          </div>

           {/* Notes */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter any additional notes or remarks"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div style={{ 
              color: '#e74c3c', 
              textAlign: 'center', 
              marginBottom: '1rem',
              fontSize: '0.9rem',
              padding: '0.5rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
            <button 
              type="submit" 
              className="primary" 
              style={{ background: '#CD8B3E', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #CD8B3E', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                  Creating...
                </span>
              ) : 'Create Record'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>

        <style jsx>{`
          .add-record-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(44, 44, 44, 0.25);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .add-record-modal-content {
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(60,40,20,0.18);
            padding: 1.5rem;
            min-width: 600px;
            max-width: 700px;
            width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          input, select, textarea {
            width: 100%;
            margin-bottom: 1rem;
            padding: 0.6rem 1rem;
            border: 2px solid #DED0B6;
            border-radius: 10px;
            background: #FFF6E5;
            color: #3F2E1E;
            font-size: 1rem;
            font-family: inherit;
            transition: border 0.2s;
          }

          input:focus, select:focus, textarea:focus {
            border: 2px solid #CD8B3E !important;
            outline: none;
            boxShadow: 0 0 0 3px rgba(205, 139, 62, 0.1);
          }

          /* Spinner animation */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Responsive styles for AddRecordModal */
          @media (max-width: 768px) {
            .add-record-modal-overlay {
              padding: 0.5rem;
            }

            .add-record-modal-content {
              padding: 1.5rem;
              border-radius: 12px;
              max-height: 95vh;
            }
          }

          @media (max-width: 640px) {
            .add-record-modal-overlay {
              padding: 0.25rem;
            }

            .add-record-modal-content {
              padding: 1rem;
              border-radius: 8px;
            }
          }

          @media (max-width: 480px) {
            .add-record-modal-overlay {
              padding: 0.125rem;
            }

            .add-record-modal-content {
              padding: 0.75rem;
              max-height: 98vh;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddRecordModal;