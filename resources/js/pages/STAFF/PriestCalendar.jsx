import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PriestCalendar = () => {
  const [priests, setPriests] = useState([]);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    priest_id: '',
    duty: '',
    date: '',
    time: '',
    notes: ''
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState(null);

  // Fetch priests and calendar entries on component mount
  useEffect(() => {
    fetchPriests();
    fetchCalendarEntries();
  }, []);

  const fetchPriests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/priests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPriests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching priests:', error);
      showMessage('error', 'Failed to load priests');
    }
  };

  const fetchCalendarEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/priest-calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCalendarEntries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      showMessage('error', 'Failed to load calendar entries');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.priest_id || !formData.duty || !formData.date || !formData.time) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    // Frontend validation: Check if date is in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (selectedDate < today) {
      showMessage('error', 'Cannot schedule duties for past dates. Please select today or a future date.');
      return;
    }

    // Frontend validation: Check for conflicts
    const conflict = calendarEntries.find(entry => 
      entry.priest_id == formData.priest_id &&
      entry.date === formData.date &&
      entry.time === formData.time &&
      entry.status === 'scheduled' &&
      (!editingEntry || entry.id !== editingEntry.id)
    );

    if (conflict) {
      const priestName = priests.find(p => p.id == formData.priest_id)?.name || 'Selected priest';
      showMessage('error', `${priestName} already has a duty scheduled on ${formData.date} at ${formData.time}. Please choose a different time or date.`);
      return;
    }

    console.log('Submitting form data:', formData);

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingEntry ? `/api/priest-calendar/${editingEntry.id}` : '/api/priest-calendar';
      const method = editingEntry ? 'put' : 'post';
      
      console.log('Sending to API:', { url, method, data: formData });
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        showMessage('success', response.data.message);
        setFormData({ priest_id: '', duty: '', date: '', time: '', notes: '' });
        setEditingEntry(null);
        fetchCalendarEntries();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save entry';
      showMessage('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      priest_id: entry.priest_id,
      duty: entry.duty,
      date: entry.date,
      time: entry.time.substring(0, 5), // Format time as HH:MM
      notes: entry.notes || ''
    });
  };

  const handleDelete = (entryId) => {
    setDeleteEntryId(entryId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteEntryId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/priest-calendar/${deleteEntryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showMessage('success', 'Entry deleted successfully');
        fetchCalendarEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      showMessage('error', 'Failed to delete entry');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteEntryId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteEntryId(null);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setFormData({ priest_id: '', duty: '', date: '', time: '', notes: '' });
  };

  const formatDate = (dateString) => {
    // Parse date string directly without timezone conversion
    if (!dateString) return '';
    
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss.sssZ" formats
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    console.log('formatDate:', { input: dateString, datePart, year, month, day, output: `${month}/${day}/${year}` });
    
    // Return in MM/DD/YYYY format without any Date object manipulation
    return `${month}/${day}/${year}`;
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Format as HH:MM
  };

  if (loading) return <div className="loading-users" style={{ textAlign: 'left' }}>Loading priest calendar...</div>;

  return (
    <div className="staff-main-content" style={{ padding: '2rem' }}>
      <h1 style={{ color: '#3F2E1E', fontWeight: 700, fontSize: '2rem', marginBottom: 24 }}>
        Manage Priest Calendar
      </h1>
      
      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#FFF6E5', borderRadius: 18, boxShadow: '0 4px 18px rgba(128,108,75,0.10)', padding: '2rem 2.5rem', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                Priest *
              </label>
              <select 
                name="priest_id"
                value={formData.priest_id}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 12, outline: 'none', color: '#3F2E1E' }}
                required
              >
                <option value="">Select Priest</option>
                {priests.map(priest => (
                  <option key={priest.id} value={priest.id}>{priest.name}</option>
                ))}
              </select>
              
              <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                Duty *
              </label>
              <input 
                type="text"
                name="duty"
                value={formData.duty}
                onChange={handleInputChange}
                placeholder="e.g. Mass, Confession, Baptism" 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 12, outline: 'none', color: '#3F2E1E' }}
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                Date *
              </label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 12, outline: 'none', color: '#3F2E1E' }}
                required
              />
              
              <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
                Time *
              </label>
              <input 
                type="time" 
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, marginBottom: 12, outline: 'none', color: '#3F2E1E' }}
                required
              />
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, color: '#3F2E1E', fontSize: 15, marginBottom: 4, display: 'block' }}>
              Notes (Optional)
            </label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about this duty..."
              rows="3"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: 15, outline: 'none', color: '#3F2E1E', resize: 'vertical' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ 
                background: loading ? '#ccc' : '#806c4b', 
                color: '#fff', 
                borderRadius: 8, 
                padding: '10px 32px', 
                fontWeight: 700, 
                fontSize: 16, 
                border: 'none', 
                boxShadow: '0 2px 8px rgba(128,108,75,0.10)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : (editingEntry ? 'Update Duty' : 'Assign Duty')}
            </button>
            
            {editingEntry && (
              <button 
                type="button"
                onClick={cancelEdit}
                style={{ 
                  background: '#6c757d', 
                  color: '#fff', 
                  borderRadius: 8, 
                  padding: '10px 32px', 
                  fontWeight: 700, 
                  fontSize: 16, 
                  border: 'none', 
                  boxShadow: '0 2px 8px rgba(108,117,125,0.10)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Calendar Entries Table */}
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 8px rgba(128,108,75,0.06)', padding: '2rem 2.5rem' }}>
        <h2 style={{ color: '#3F2E1E', fontWeight: 600, fontSize: '1.2rem', marginBottom: 16 }}>
          Scheduled Duties ({calendarEntries.length})
        </h2>
        
        {calendarEntries.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
            No scheduled duties found. Add some entries above.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF6E5' }}>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'left' }}>Priest</th>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'left' }}>Duty</th>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', color: '#806c4b', fontWeight: 700, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calendarEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #f2e4ce' }}>
                    <td style={{ padding: '12px', color: '#3F2E1E' }}>
                      {entry.priest ? entry.priest.name : 'Unknown Priest'}
                    </td>
                    <td style={{ padding: '12px', color: '#3F2E1E' }}>{entry.duty}</td>
                    <td style={{ padding: '12px', color: '#3F2E1E' }}>{formatDate(entry.date)}</td>
                    <td style={{ padding: '12px', color: '#3F2E1E' }}>{formatTime(entry.time)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: entry.status === 'scheduled' ? '#d4edda' : 
                                   entry.status === 'completed' ? '#cce5ff' : '#f8d7da',
                        color: entry.status === 'scheduled' ? '#155724' : 
                               entry.status === 'completed' ? '#004085' : '#721c24'
                      }}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEdit(entry)}
                          style={{ 
                            background: '#806c4b', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '6px 12px', 
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          style={{ 
                            background: '#e74c3c', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '6px 12px', 
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              Are you sure you want to delete this calendar entry? This action cannot be undone.
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
    </div>
  );
};

export default PriestCalendar; 