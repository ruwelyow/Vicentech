import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../../../css/events.css';
import { api } from '../../utils/axios';
import { Pencil, Trash } from 'lucide-react';

const SacramentHistory = () => {
  // State for sacrament history
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for adding new sacrament
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [newSacrament, setNewSacrament] = useState({
    type: '',
    date: '',
    parish: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Available sacrament types
  const sacramentTypes = [
    'Baptism',
    'Confirmation',
    'Eucharist',
    'Reconciliation',
    'Anointing of the Sick',
    'Holy Orders',
    'Matrimony'
  ];

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if formatting fails
    }
  };

  // Load sacrament history from database
  useEffect(() => {
    const fetchSacramentHistory = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching sacrament history...');
        
        // Test authentication first
        try {
          const authTest = await api.get('/test-auth');
          console.log('Auth test successful:', authTest.data);
        } catch (authError) {
          console.error('Auth test failed:', authError);
          setError('Authentication failed. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await api.get('/sacrament-history');
        console.log('Sacrament history response:', response.data);
        setHistory(response.data || []);
      } catch (error) {
        console.error('Error fetching sacrament history:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        
        if (error.response?.status === 401) {
          setError('Please log in to view your sacrament history');
        } else if (error.response?.status === 403) {
          setError('You do not have permission to access this data');
        } else {
          setError(`Failed to load sacrament history: ${error.response?.data?.message || error.message}`);
        }
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSacramentHistory();
  }, []);

  const handleAddSacrament = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Basic validation
    if (!newSacrament.type || !newSacrament.date || !newSacrament.parish) {
      setError('Please fill in all fields');
      setSubmitting(false);
      return;
    }

    try {
      // Add to database via API
      const response = await api.post('/sacrament-history', newSacrament);
            setHistory(prev => [...prev, response.data]);
            setSuccess('Sacrament record added successfully!');
            setNewSacrament({ type: '', date: '', parish: '' });
            setShowAddModal(false);
            
            // Dispatch event to update Profile.jsx
            window.dispatchEvent(new Event('sacramentHistoryUpdated'));
      
    } catch (err) {
      console.error('Error adding sacrament:', err);
      setError(err.response?.data?.message || 'Failed to add sacrament record');
    }
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSacrament(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSacrament = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Basic validation
    if (!newSacrament.type || !newSacrament.date || !newSacrament.parish) {
      setError('Please fill in all fields');
      setSubmitting(false);
      return;
    }

    try {
      // Update record in database via API
      const recordToUpdate = history[editingIndex];
      const response = await api.put(`/sacrament-history/${recordToUpdate.id}`, newSacrament);
      
            setHistory(prev => prev.map((record, index) =>
              index === editingIndex ? response.data : record
            ));
            setSuccess('Sacrament record updated successfully!');
            setNewSacrament({ type: '', date: '', parish: '' });
            setShowEditModal(false);
            setEditingIndex(null);
            
            // Dispatch event to update Profile.jsx
            window.dispatchEvent(new Event('sacramentHistoryUpdated'));
      
    } catch (err) {
      console.error('Error updating sacrament:', err);
      setError(err.response?.data?.message || 'Failed to update sacrament record');
    }
    setSubmitting(false);
  };

  const handleDeleteSacrament = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Delete record from database via API
      const recordToDelete = history[deletingIndex];
      await api.delete(`/sacrament-history/${recordToDelete.id}`);
      
            setHistory(prev => prev.filter((_, index) => index !== deletingIndex));
            setSuccess('Sacrament record deleted successfully!');
            setShowDeleteModal(false);
            setDeletingIndex(null);
            
            // Dispatch event to update Profile.jsx
            window.dispatchEvent(new Event('sacramentHistoryUpdated'));
      
    } catch (err) {
      console.error('Error deleting sacrament:', err);
      setError(err.response?.data?.message || 'Failed to delete sacrament record');
    }
    setSubmitting(false);
  };

  const openEditModal = (index) => {
    const record = history[index];
    setNewSacrament({ ...record });
    setEditingIndex(index);
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const openDeleteModal = (index) => {
    setDeletingIndex(index);
    setShowDeleteModal(true);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setNewSacrament({ type: '', date: '', parish: '' });
    setEditingIndex(null);
    setDeletingIndex(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="events-page">
      <section className="events-hero text-center">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Sacrament History</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed mb-6">
            View your complete sacrament history.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#CD8B3E] hover:bg-[#B77B35] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            + Add Sacrament Record
          </button>
        </div>
      </section>
      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-3xl mx-auto -mt-16">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        <table className="w-full text-left rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-[#FFF6E5] text-[#3F2E1E]">
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Type</th>
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Date</th>
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Parish</th>
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce] text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center py-6 text-[#B77B35]">Loading sacrament history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-6 text-[#B77B35]">No sacraments yet.</td></tr>
            ) : (
              history.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#FFF6E5] transition">
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">{s.type}</td>
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">{formatDate(s.date)}</td>
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">{s.parish}</td>
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(idx)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        style={{ minWidth: 32, minHeight: 32, borderRadius: 6, background: '#f2f2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Record"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(idx)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        style={{ minWidth: 32, minHeight: 32, borderRadius: 6, background: '#f2f2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Record"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Sacrament Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#CD8B3E] text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold mb-2">Add Sacrament Record</h2>
              <p className="text-sm opacity-90">Add a new sacrament to your history</p>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleAddSacrament} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Sacrament Type *
                  </label>
                  <select
                    name="type"
                    value={newSacrament.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  >
                    <option value="">Select sacrament type</option>
                    {sacramentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newSacrament.date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Parish *
                  </label>
                  <input
                    type="text"
                    name="parish"
                    value={newSacrament.parish}
                    onChange={handleInputChange}
                    placeholder="Enter parish name"
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#CD8B3E] hover:bg-[#B77B35] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding...' : 'Add Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sacrament Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#CD8B3E] text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold mb-2">Edit Sacrament Record</h2>
              <p className="text-sm opacity-90">Update your sacrament information</p>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleEditSacrament} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Sacrament Type *
                  </label>
                  <select
                    name="type"
                    value={newSacrament.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  >
                    <option value="">Select sacrament type</option>
                    {sacramentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newSacrament.date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3F2E1E] mb-2">
                    Parish *
                  </label>
                  <input
                    type="text"
                    name="parish"
                    value={newSacrament.parish}
                    onChange={handleInputChange}
                    placeholder="Enter parish name"
                    required
                    className="w-full px-4 py-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#CD8B3E] hover:bg-[#B77B35] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : 'Update Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #dc2626',
            boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.1)',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Warning Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              border: '3px solid #dc2626'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ width: '40px', height: '40px' }}>
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#dc2626',
              margin: '0 0 1rem 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Delete Sacrament Record
            </h2>

            {/* Message */}
            <p style={{
              fontSize: '1rem',
              color: '#374151',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this sacrament record? This action cannot be undone.
            </p>

            {/* Sacrament Details */}
            {deletingIndex !== null && history[deletingIndex] && (
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                margin: '0 0 1.5rem 0',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#374151' }}>Type:</strong> {history[deletingIndex].type}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#374151' }}>Date:</strong> {formatDate(history[deletingIndex].date)}
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Parish:</strong> {history[deletingIndex].parish}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                margin: '0 0 1.5rem 0',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '0.75rem',
                borderRadius: '8px',
                margin: '0 0 1.5rem 0',
                fontSize: '0.9rem'
              }}>
                {success}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  resetForm();
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSacrament}
                disabled={submitting}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '100px',
                  opacity: submitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.background = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.target.style.background = '#dc2626';
                  }
                }}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SacramentHistory; 