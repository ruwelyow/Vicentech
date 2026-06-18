import React, { useState, useEffect } from 'react';
import '../../../css/staffMortuary.css';
import { initialMortuaryData } from '../../data/mortuaryData';
import '../../services/MortuaryService';

const StaffMortuary = () => {
  const [racks, setRacks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRack, setSelectedRack] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Utility function to show styled toast notifications
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `${type}-toast`;
    
    let iconPath = '';
    if (type === 'success') {
      iconPath = 'M5 13l4 4L19 7';
    } else if (type === 'delete') {
      iconPath = 'M5 13l4 4L19 7';
    } else {
      iconPath = 'M6 18L18 6M6 6l12 12';
    }
    
    toast.innerHTML = `
      <div class="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; color: white;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after 4 seconds with slide-out animation
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
  const [editFormData, setEditFormData] = useState({
    id: '',
    status: '',
    occupant: '',
    dateOfBirth: '',
    dateOfDeath: '',
    dateOccupied: '',
    durationYears: 5,
    notes: ''
  });
  const [addFormData, setAddFormData] = useState({
    position_row: '',
    position_col: '',
    status: 'available',
    occupant: '',
    dateOfBirth: '',
    dateOfDeath: '',
    dateOccupied: '',
    durationYears: 5,
    notes: ''
  });
  const [availablePositions, setAvailablePositions] = useState([]);

  const mortuaryService = new window.MortuaryService();

  useEffect(() => {
    loadMortuaryData();
  }, []);

  const loadMortuaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mortuaryService.fetchMortuaryData();
      
      if (response.success) {
        setRacks(response.data);
      } else {
        setError(response.message || 'Failed to load mortuary data');
      }
    } catch (err) {
      console.error('Error loading mortuary data:', err);
      setError('Failed to connect to server. Please check your connection.');
      
      // Fallback to localStorage if API fails
      let data = JSON.parse(localStorage.getItem('mortuaryData'));
      if (!data) {
        data = initialMortuaryData;
        localStorage.setItem('mortuaryData', JSON.stringify(data));
      }
      setRacks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = async () => {
    setAddFormData({
      position_row: '',
      position_col: '',
      status: 'available',
      occupant: '',
      dateOfBirth: '',
      dateOfDeath: '',
      dateOccupied: '',
      durationYears: 5,
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await mortuaryService.addRack(addFormData);
      
      if (response.success) {
        // Reload the mortuary data to get the updated list
        await loadMortuaryData();
        setIsAddModalOpen(false);
        showToast('Rack added successfully!', 'success');
      } else {
        showToast('Failed to add rack: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('Error adding rack:', error);
      showToast('Failed to add rack. Please try again.', 'error');
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => {
      const next = { ...prev, [name]: value };
      // If status toggles to available, clear dependent fields
      if (name === 'status' && value === 'available') {
        next.occupant = '';
        next.dateOccupied = '';
      }
      // If status becomes occupied or reserved, default date to today if empty
      if (name === 'status' && (value === 'occupied' || value === 'reserved') && !next.dateOccupied) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        next.dateOccupied = `${yyyy}-${mm}-${dd}`;
      }
      return next;
    });
  };

  const handleRackClick = (rack) => {
    setSelectedRack(rack);
  };

  const handleEmptyCellClick = async (rowIndex, colIndex) => {
    try {
      // Optionally refresh available positions, but proceed regardless
      try {
        const response = await mortuaryService.getAvailablePositions();
        if (response.success) {
          setAvailablePositions(response.availablePositions || []);
        }
      } catch (_e) {}

      setAddFormData({
        position_row: String(rowIndex),
        position_col: String(colIndex),
        status: 'available',
        occupant: '',
        dateOccupied: '',
        durationYears: 5
      });
      setIsAddModalOpen(true);
    } catch (_err) {
      setAddFormData({
        position_row: String(rowIndex),
        position_col: String(colIndex),
        status: 'available',
        occupant: '',
        dateOccupied: '',
        durationYears: 5
      });
      setIsAddModalOpen(true);
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      id: selectedRack.id,
      status: selectedRack.status,
      occupant: selectedRack.occupant || '',
      dateOfBirth: selectedRack.dateOfBirth || '',
      dateOfDeath: selectedRack.dateOfDeath || '',
      dateOccupied: selectedRack.dateOccupied || '',
      durationYears: selectedRack.durationYears || 5,
      notes: selectedRack.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        status: editFormData.status,
        occupant: editFormData.status === 'available' ? null : editFormData.occupant,
        dateOfBirth: editFormData.status === 'available' ? null : editFormData.dateOfBirth,
        dateOfDeath: editFormData.status === 'available' ? null : editFormData.dateOfDeath,
        dateOccupied: editFormData.status === 'available' ? null : editFormData.dateOccupied,
        durationYears: editFormData.durationYears || 5,
        notes: editFormData.notes || null
      };

      const response = await mortuaryService.updateRack(selectedRack.id, updateData);
      
      if (response.success) {
        // Reload mortuary data to get the updated list with all fields
        await loadMortuaryData();
        
        // Update selected rack with the response data
        setSelectedRack(response.rack);
        
        setIsEditModalOpen(false);
        showToast('Rack updated successfully!', 'success');
      } else {
        showToast('Failed to update rack: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('Error updating rack:', error);
      showToast('Failed to update rack. Please try again.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await mortuaryService.deleteRack(selectedRack.id);
      if (response.success) {
        // Remove from local state
        const updated = {
          ...racks,
          racks: racks.racks.filter(rack => rack.id !== selectedRack.id)
        };
        setRacks(updated);
        localStorage.setItem('mortuaryData', JSON.stringify(updated));
        window.dispatchEvent(new Event('mortuaryDataUpdated'));
        setSelectedRack(null);
        setIsDeleteModalOpen(false);
        showToast('Rack deleted successfully!', 'delete');
      } else {
        showToast('Failed to delete rack: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting rack:', error);
      showToast('Failed to delete rack. Please try again.', 'error');
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const next = { ...prev, [name]: value };
      // If status toggles to available, clear dependent fields
      if (name === 'status' && value === 'available') {
        next.occupant = '';
        next.dateOfBirth = '';
        next.dateOfDeath = '';
        next.dateOccupied = '';
        // Keep durationYears even when status is available
      }
      // If status becomes occupied or reserved, default date to today if empty
      if (name === 'status' && (value === 'occupied' || value === 'reserved') && !next.dateOccupied) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        next.dateOccupied = `${yyyy}-${mm}-${dd}`;
      }
      return next;
    });
  };

  const getTotalStats = () => {
    if (!racks || !racks.racks) return { total: 0, available: 0, occupied: 0, reserved: 0 };

    let total = 0;
    let available = 0;
    let occupied = 0;
    let reserved = 0;

    racks.racks.forEach(rack => {
      total++;
      switch (rack.status) {
        case 'available':
          available++;
          break;
        case 'occupied':
          occupied++;
          break;
        case 'reserved':
          reserved++;
          break;
      }
    });

    return { total, available, occupied, reserved };
  };

  const renderMortuaryGrid = () => {
    // Check if racks data is loaded
    if (!racks || !racks.rows || !racks.cols || !racks.racks) {
      return (
        <div className="mortuary-grid" style={{ 
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)'
        }}>
          {Array(25).fill().map((_, index) => (
            <div
              key={index}
              className="grid-cell empty"
              title="Loading..."
            >
            </div>
          ))}
        </div>
      );
    }

    const grid = Array(racks.rows).fill().map(() => Array(racks.cols).fill(null));

    // Place racks in their positions
    racks.racks.forEach(rack => {
      const [row, col] = rack.position;
      if (row < racks.rows && col < racks.cols) {
        grid[row][col] = rack;
      }
    });

    return (
      <div className="mortuary-grid" style={{ 
        gridTemplateColumns: `repeat(${racks.cols}, 1fr)`,
        gridTemplateRows: `repeat(${racks.rows}, 1fr)`
      }}>
        {grid.map((row, rowIndex) => 
          row.map((rack, colIndex) => {
            // Calculate expiration status for occupied/reserved racks
            let expirationStatus = null;
            if (rack && (rack.status === 'occupied' || rack.status === 'reserved') && rack.dateOccupied && rack.durationYears) {
              const occupiedDate = new Date(rack.dateOccupied);
              const expirationDate = new Date(occupiedDate);
              expirationDate.setFullYear(expirationDate.getFullYear() + (rack.durationYears || 5));
              const today = new Date();
              const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntilExpiration < 0;
              const isExpiringSoon = daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
              
              expirationStatus = {
                isExpired,
                isExpiringSoon,
                daysUntilExpiration,
                expirationDate: expirationDate.toLocaleDateString()
              };
            }
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${rack ? rack.status : 'empty'} ${expirationStatus?.isExpired ? 'expired' : ''} ${expirationStatus?.isExpiringSoon ? 'expiring-soon' : ''}`}
                onClick={() => rack ? handleRackClick(rack) : handleEmptyCellClick(rowIndex, colIndex)}
                title={rack ? (
                  expirationStatus 
                    ? `${rack.id} - ${rack.status}${expirationStatus.isExpired ? ' (EXPIRED)' : expirationStatus.isExpiringSoon ? ' (Expiring Soon)' : ''} - Expires: ${expirationStatus.expirationDate}`
                    : `${rack.id} - ${rack.status}`
                ) : `Empty position (${rowIndex}, ${colIndex})`}
              >
                {rack && (
                  <div className="rack-content">
                    <div className="rack-id">{rack.id}</div>
                    <div className="rack-status">{rack.status}</div>
                    {rack.occupant && (
                      <div className="rack-occupant">{rack.occupant}</div>
                    )}
                    {expirationStatus && (
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        marginTop: '0.25rem',
                        color: expirationStatus.isExpired ? '#dc2626' : expirationStatus.isExpiringSoon ? '#d97706' : '#059669',
                        textAlign: 'center'
                      }}>
                        {expirationStatus.isExpired ? '⚠️ EXPIRED' : expirationStatus.isExpiringSoon ? '⏰ EXPIRING' : '✓'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  if (loading) return <div className="loading-users" style={{ textAlign: 'left' }}>Loading mortuary racks...</div>;

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Error Loading Mortuary Data</h2>
          <p>{error}</p>
          <button onClick={loadMortuaryData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <>
      {/* Toast CSS Styles */}
      <style>{`
        .success-toast, .error-toast, .delete-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10001;
          min-width: 300px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease-out;
          font-family: Arial, sans-serif;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .success-toast {
          background: #10b981;
          color: white;
          border: none;
        }
        
        .delete-toast {
          background: #ef4444;
          color: white;
          border: none;
        }
        
        .error-toast {
          background: #ef4444;
          color: white;
          border: none;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: normal;
          font-size: 14px;
          line-height: 1.4;
          color: white;
        }
        
        .toast-content svg {
          color: white;
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
      <div className="mortuary-container">
      <div className="mortuary-header">
        <div className="header-content">
          <h1 className="mortuary-title">Mortuary Rack Management</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-label">Total Racks</h3>
            <p className="stat-value total">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-label">Available</h3>
            <p className="stat-value available">{stats.available}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-label">Occupied</h3>
            <p className="stat-value occupied">{stats.occupied}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-label">Reserved</h3>
            <p className="stat-value reserved">{stats.reserved}</p>
          </div>
        </div>
      </div>

      <div className="mortuary-layout">
        <div className="mortuary-legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span className="legend-text">Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color occupied"></div>
            <span className="legend-text">Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-color reserved"></div>
            <span className="legend-text">Reserved</span>
          </div>
        </div>

        <div className="grid-container">
          {renderMortuaryGrid()}
        </div>
      </div>

      {selectedRack && (
        <div className="rack-details">
          <div className="details-header">
            <h3 className="details-title">Rack Details - {selectedRack.id}</h3>
            <button className="close-button" onClick={() => setSelectedRack(null)} aria-label="Close details">×</button>
          </div>
          <div className="details-content">
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedRack.status}`}>
                  {selectedRack.status.charAt(0).toUpperCase() + selectedRack.status.slice(1)}
                </span>
              </div>
              {selectedRack.status !== 'available' && selectedRack.occupant && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedRack.occupant}</span>
                  </div>
                  {selectedRack.dateOfBirth && (
                    <div className="detail-item">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">{selectedRack.dateOfBirth}</span>
                    </div>
                  )}
                  {(selectedRack.status === 'occupied' || selectedRack.status === 'reserved') && (
                    <div className="detail-item">
                      <span className="detail-label">Date of Death:</span>
                      <span className="detail-value">{selectedRack.dateOfDeath || 'Not specified'}</span>
                    </div>
                  )}
                  {selectedRack.dateOccupied && (
                    <div className="detail-item">
                      <span className="detail-label">Date Occupied:</span>
                      <span className="detail-value">{selectedRack.dateOccupied}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{selectedRack.durationYears || 5} years</span>
                  </div>
                  {selectedRack.dateOccupied && selectedRack.durationYears && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      {(() => {
                        const occupiedDate = new Date(selectedRack.dateOccupied);
                        const expirationDate = new Date(occupiedDate);
                        expirationDate.setFullYear(expirationDate.getFullYear() + (selectedRack.durationYears || 5));
                        const today = new Date();
                        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
                        const isExpired = daysUntilExpiration < 0;
                        const isExpiringSoon = daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
                        
                        return (
                          <div style={{
                            background: isExpired ? '#fee2e2' : isExpiringSoon ? '#fef3c7' : '#d1fae5',
                            border: `2px solid ${isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#10b981'}`,
                            borderRadius: '8px',
                            padding: '0.75rem',
                            marginTop: '0.5rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: 600,
                              color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#059669',
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem'
                            }}>
                              <span>{isExpired ? '⚠️' : isExpiringSoon ? '⏰' : '✓'}</span>
                              <span>{isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'EXPIRATION DATE'}</span>
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#3F2E1E',
                              marginBottom: '0.25rem'
                            }}>
                              <strong>Expiration Date:</strong> {expirationDate.toLocaleDateString()}
                            </div>
                            {isExpired ? (
                              <div style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
                                This rack expired {Math.abs(daysUntilExpiration)} day{Math.abs(daysUntilExpiration) !== 1 ? 's' : ''} ago.
                              </div>
                            ) : isExpiringSoon ? (
                              <div style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: 600 }}>
                                This rack will expire in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}.
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                                {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''} remaining until expiration.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {selectedRack.notes && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value" style={{ display: 'block', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedRack.notes}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="detail-actions">
              <button className="action-button edit" onClick={handleEditClick}>
                <span className="action-text">Edit</span>
                <span className="action-icon">✏️</span>
              </button>
              <button className="action-button delete" onClick={handleDeleteClick}>
                <span className="action-text">Reset</span>
                <span className="action-icon">🔄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
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
        }} onClick={() => setIsEditModalOpen(false)}>
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
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              background: '#806c4b', 
              borderRadius: '12px 12px 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-1.5rem -1.5rem 0 -1.5rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                margin: '0 0 0.5rem 0',
                color: 'white'
              }}>
                Edit Rack {editFormData.id}
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                margin: '0', 
                color: 'white',
                opacity: 0.9
              }}>
                Update rack information
              </p>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                title="Close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              background: '#FFF6E5', 
              borderRadius: '0 0 12px 12px', 
              padding: '1rem', 
              marginBottom: 0, 
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <form onSubmit={handleEditSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Status</label>
                  <select
                    id="status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 13, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  <div style={{ color: '#5C4B38', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Choose "Available" for an empty slot. Use "Occupied" when assigning to a person.
                  </div>
                </div>
                
                {editFormData.status !== 'available' && (
                  <>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Name</label>
                      <input
                        type="text"
                        id="occupant"
                        name="occupant"
                        value={editFormData.occupant}
                        onChange={handleEditFormChange}
                        required
                        placeholder="Full name of the deceased"
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                      <div style={{ color: '#5C4B38', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Required when status is Occupied or Reserved.
                      </div>
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date of Birth</label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={editFormData.dateOfBirth}
                        onChange={handleEditFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date of Death</label>
                      <input
                        type="date"
                        id="dateOfDeath"
                        name="dateOfDeath"
                        value={editFormData.dateOfDeath}
                        onChange={handleEditFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date Occupied</label>
                      <input
                        type="date"
                        id="dateOccupied"
                        name="dateOccupied"
                        value={editFormData.dateOccupied}
                        onChange={handleEditFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Duration (Years) *</label>
                      <input
                        type="number"
                        id="durationYears"
                        name="durationYears"
                        value={editFormData.durationYears}
                        onChange={handleEditFormChange}
                        min="1"
                        max="5"
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#5C4B38', marginTop: '0.25rem', marginBottom: 0 }}>
                        Maximum 5 years.
                      </p>
                    </div>
                  </>
                )}
                
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Notes (Optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleEditFormChange}
                      rows="3"
                    placeholder="Additional notes..."
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 13, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '0.625rem 1.5rem',
                      borderRadius: 8,
                      border: '1.5px solid #e2cfa3',
                      background: '#fff',
                      color: '#3F2E1E',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f9f9f9';
                      e.target.style.borderColor = '#d4c5a9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.borderColor = '#e2cfa3';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      padding: '0.625rem 1.5rem',
                      borderRadius: 8,
                      border: 'none',
                      background: '#806c4b',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#b87932';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#806c4b';
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content confirmation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="close-button" onClick={() => setIsDeleteModalOpen(false)} aria-label="Close modal">×</button>
            </div>
            <div className="modal-body">
              <div className="confirmation-content">
                <div className="confirmation-icon">⚠️</div>
                <div className="confirmation-text">
                  <p className="confirmation-question">Are you sure you want to permanently delete Rack {selectedRack.id}?</p>
                  <p className="confirmation-warning">This will remove the rack from the layout. This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="delete-button" onClick={handleDeleteConfirm}>
                Delete Rack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {isAddModalOpen && (
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
        }} onClick={() => setIsAddModalOpen(false)}>
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
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              background: '#806c4b', 
              borderRadius: '12px 12px 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-1.5rem -1.5rem 0 -1.5rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                margin: '0 0 0.5rem 0',
                color: 'white'
              }}>
                Add New Rack
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                margin: '0', 
                color: 'white',
                opacity: 0.9
              }}>
                Create a new rack entry for the mortuary
              </p>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                title="Close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              background: '#FFF6E5', 
              borderRadius: '0 0 12px 12px', 
              padding: '1rem', 
              marginBottom: 0, 
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <form onSubmit={handleAddSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Status</label>
                  <select
                    id="add_status"
                    name="status"
                    value={addFormData.status}
                    onChange={handleAddFormChange}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 13, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  <div style={{ color: '#5C4B38', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Choose "Available" for an empty slot. Use "Occupied" when assigning to a person.
                  </div>
                </div>
                
                {addFormData.status !== 'available' && (
                  <>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Name</label>
                      <input
                        type="text"
                        id="add_occupant"
                        name="occupant"
                        value={addFormData.occupant}
                        onChange={handleAddFormChange}
                        required
                        placeholder="Full name of the deceased"
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                      <div style={{ color: '#5C4B38', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Required when status is Occupied or Reserved.
                      </div>
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date of Birth</label>
                      <input
                        type="date"
                        id="add_dateOfBirth"
                        name="dateOfBirth"
                        value={addFormData.dateOfBirth}
                        onChange={handleAddFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date of Death</label>
                      <input
                        type="date"
                        id="add_dateOfDeath"
                        name="dateOfDeath"
                        value={addFormData.dateOfDeath}
                        onChange={handleAddFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Date Occupied</label>
                      <input
                        type="date"
                        id="add_dateOccupied"
                        name="dateOccupied"
                        value={addFormData.dateOccupied}
                        onChange={handleAddFormChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Duration (Years) *</label>
                      <input
                        type="number"
                        id="add_durationYears"
                        name="durationYears"
                        value={addFormData.durationYears}
                        onChange={handleAddFormChange}
                        min="1"
                        max="5"
                        required
                        style={{ 
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 13, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#5C4B38', marginTop: '0.25rem', marginBottom: 0 }}>
                        Maximum 5 years.
                      </p>
                    </div>
                  </>
                )}
                
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Notes (Optional)</label>
                    <textarea
                      id="add_notes"
                      name="notes"
                      value={addFormData.notes}
                      onChange={handleAddFormChange}
                      rows="3"
                    placeholder="Additional notes..."
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 13, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '0.625rem 1.5rem',
                      borderRadius: 8,
                      border: '1.5px solid #e2cfa3',
                      background: '#fff',
                      color: '#3F2E1E',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f9f9f9';
                      e.target.style.borderColor = '#d4c5a9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.borderColor = '#e2cfa3';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={
                      addFormData.position_row === '' || addFormData.position_col === '' ||
                      (addFormData.status !== 'available' && (!addFormData.occupant || !addFormData.dateOccupied))
                    }
                    style={{
                      padding: '0.625rem 1.5rem',
                      borderRadius: 8,
                      border: 'none',
                      background: addFormData.position_row === '' || addFormData.position_col === '' ||
                        (addFormData.status !== 'available' && (!addFormData.occupant || !addFormData.dateOccupied))
                        ? '#ccc' : '#806c4b',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: addFormData.position_row === '' || addFormData.position_col === '' ||
                        (addFormData.status !== 'available' && (!addFormData.occupant || !addFormData.dateOccupied))
                        ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.background = '#6b5a3f';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.background = '#806c4b';
                      }
                    }}
                  >
                    Add Rack
                  </button>
                </div>
              </form>
              {availablePositions.length === 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: 8,
                  color: '#856404'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    ⚠️ No available positions in the mortuary. All positions are currently occupied.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default StaffMortuary;