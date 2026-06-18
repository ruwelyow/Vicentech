import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import AddRecordModal from '../../components/AddRecordModal';
import EditRecordModal from '../../components/EditRecordModal';

const StaffRecords = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('baptism');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const recordTypes = [
    { 
      key: 'baptism', 
      label: 'Baptism Records', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#806c4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" stroke="#806c4b"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#806c4b"/>
          <circle cx="12" cy="8" r="2" fill="#FFF6E5" stroke="#806c4b"/>
          <path d="M8 16c0-2 2-3 4-3s4 1 4 3" stroke="#806c4b"/>
        </svg>
      )
    },
    { 
      key: 'confirmation', 
      label: 'Confirmation Records', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#806c4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L8 8h8l-4-6z" fill="#FFF6E5" stroke="#806c4b"/>
          <path d="M12 8v14" stroke="#806c4b"/>
          <path d="M8 16h8" stroke="#806c4b"/>
        </svg>
      )
    },
    { 
      key: 'marriage', 
      label: 'Marriage Records', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#806c4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#FFF6E5" stroke="#806c4b"/>
        </svg>
      )
    },
    { 
      key: 'funeral', 
      label: 'Funeral Records', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#806c4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L8 6h8l-4-4z" fill="#FFF6E5" stroke="#806c4b"/>
          <rect x="6" y="6" width="12" height="4" fill="#FFF6E5" stroke="#806c4b"/>
          <path d="M6 10v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" stroke="#806c4b"/>
          <path d="M10 14h4" stroke="#806c4b"/>
        </svg>
      )
    },
  ];

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
    fetchRecords();
    fetchStatistics();
  }, [activeTab, searchTerm, dateFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.append('type', activeTab);
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter) params.append('month', dateFilter);

      const response = await api.get(`/public-parish-records?${params.toString()}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
      // Fallback to mock data if API fails
      const mockData = generateMockRecords(activeTab);
      setRecords(mockData);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab) params.append('type', activeTab);

      const response = await api.get(`/public-parish-records/statistics?${params.toString()}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback to mock statistics
      setStatistics({
        total_records: records.length,
        completed_records: records.filter(r => r.status === 'Completed').length,
        this_month_records: records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length,
        this_year_records: records.filter(r => new Date(r.date).getFullYear() === new Date().getFullYear()).length
      });
    }
  };

  const generateMockRecords = (type) => {
    const baseRecords = [
      { id: 1, name: 'Juan Dela Cruz', date: '2024-01-15', priest: 'Fr. Santos', status: 'Completed' },
      { id: 2, name: 'Maria Garcia', date: '2024-01-20', priest: 'Fr. Reyes', status: 'Completed' },
      { id: 3, name: 'Pedro Martinez', date: '2024-02-05', priest: 'Fr. Santos', status: 'Completed' },
      { id: 4, name: 'Ana Rodriguez', date: '2024-02-12', priest: 'Fr. Cruz', status: 'Completed' },
      { id: 5, name: 'Carlos Mendoza', date: '2024-03-01', priest: 'Fr. Reyes', status: 'Completed' },
    ];

    return baseRecords.map(record => ({
      ...record,
      type: type,
      details: getRecordDetails(type, record)
    }));
  };

  const getRecordDetails = (type, record) => {
    switch (type) {
      case 'baptism':
        return {
          parents: 'Jose & Carmen Dela Cruz',
          godparents: 'Miguel & Rosa Santos',
          birthDate: '2023-12-01'
        };
      case 'confirmation':
        return {
          sponsor: 'Roberto Garcia',
          bishop: 'Bishop Martinez',
          confirmationName: 'Francis'
        };
      case 'marriage':
        return {
          spouse: 'Maria Santos',
          witnesses: 'Carlos & Ana Rodriguez',
          venue: 'San Vicente Ferrer Church'
        };
      case 'funeral':
        return {
          deceased: record.name,
          dateOfDeath: record.date,
          cause: 'Natural causes'
        };
      default:
        return {};
    }
  };

  const filteredRecords = records.filter(record => {
    // Filter by active tab (record type) - this is critical to ensure correct filtering
    const matchesType = !activeTab || record.type === activeTab;
    const matchesSearch = !searchTerm || record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    return matchesType && matchesSearch && matchesDate;
  });
  const lastPage = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const exportRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab) params.append('type', activeTab);
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter) params.append('month', dateFilter);

      // Make request with responseType 'blob' for file download
      const response = await api.get(`/public-parish-records/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and download file
      const blob = new Blob([response.data], { 
        type: 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Generate filename
      const exportFileDefaultName = `${activeTab}_records_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Create download link and trigger download
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(url);
      
      // Show success modal instead of alert
      setSuccessMessage(`Successfully exported ${activeTab} records to CSV file!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error exporting records:', error);
      // Show error modal instead of alert
      setSuccessMessage('Failed to export records. Please try again.');
      setShowSuccessModal(true);
    }
  };

  const addNewRecord = () => {
    setShowAddModal(true);
  };

  const handleAddRecord = async (recordData) => {
    try {
      // Clean up the data - ensure details is an object (not null/undefined)
      const cleanedData = {
        ...recordData,
        details: recordData.details || {}
      };
      
      console.log('Submitting record data:', cleanedData);
      const response = await api.post('/public-parish-records', cleanedData);
      
      console.log('Record created successfully:', response.data);
      
      // Refresh the records list
      await fetchRecords();
      await fetchStatistics();
      
      // Show success modal instead of alert
      setSuccessMessage('Record created successfully!');
      setShowSuccessModal(true);
      
      return response.data;
    } catch (error) {
      console.error('Error creating record:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Create a more detailed error message
      let errorMessage = 'Failed to create record';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.errors) {
          // Laravel validation errors
          const validationErrors = Object.values(error.response.data.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleEditRecord = (record) => {
    setRecordToEdit(record);
    setShowEditModal(true);
  };

  const handleUpdateRecord = async (recordData) => {
    try {
      const response = await api.put(`/public-parish-records/${recordToEdit.id}`, recordData);
      
      // Refresh the records list
      await fetchRecords();
      await fetchStatistics();
      
      // Show success modal
      setSuccessMessage('Record updated successfully!');
      setShowSuccessModal(true);
      
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw new Error(error.response?.data?.message || 'Failed to update record');
    }
  };

  const handlePrintRecord = (record) => {
    // Navigate to certificate generation page with record data (same functionality as release button)
    navigate('/staff/certificate-generator', { 
      state: { 
        certificate: {
          ...record,
          // Map record fields to certificate request format for compatibility
          recipient_name: record.name,
          certificate_type: record.type,
          certificate_date: record.date,
          certificate_number: record.certificate_number, // Ensure certificate_number is included
          purpose: `Certificate of ${record.type} record`,
          status: 'approved' // Treat as approved for printing
        },
        mode: 'release',
        recordType: 'parish-record' // Indicate this is a parish record
      } 
    });
  };

  return (
    <div className="staff-records-container">
      <style>{`
        /* Enhanced Responsive Styles for Staff Records */
        .staff-records-container {
          padding: 1.5rem;
          max-width: 100%;
          width: 100%;
          overflow-x: hidden;
        }

        .records-header {
          margin-bottom: 1.5rem;
        }

        .records-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #3F2E1E;
          margin-bottom: 0.5rem;
        }

        .records-subtitle {
          color: #5C4B38;
          margin-bottom: 1rem;
        }

        /* Record Type Tabs */
        .record-tabs {
          margin-top: 1rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .record-tab {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 2px solid #806c4b;
          cursor: pointer;
          white-space: nowrap;
          min-height: 44px; /* Touch target */
        }

        .record-tab.active {
          background: #806c4b;
          color: white;
        }

        .record-tab:not(.active) {
          background: white;
          color: #806c4b;
        }

        .record-tab:not(.active):hover {
          background: #806c4b;
          color: white;
        }

        /* Filters and Actions */
        .filters-actions {
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          width: 100%;
        }

        .filters-group {
          display: flex;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .search-input,
        .date-input {
          padding: 0.5rem 1rem;
          border: 2px solid #f2e4ce;
          border-radius: 0.5rem;
          transition: border-color 0.2s;
          font-size: 0.875rem;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
        }

        .search-input:focus,
        .date-input:focus {
          outline: none;
          border-color: #806c4b;
        }

        .actions-group {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          white-space: nowrap;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.primary {
          background: #806c4b;
          color: white;
          border: none;
        }

        .action-btn.primary:hover {
          background: #6b5a3f;
        }

        .action-btn.secondary {
          background: white;
          color: #806c4b;
          border: 2px solid #806c4b;
        }

        .action-btn.secondary:hover {
          background: #806c4b;
          color: white;
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #f2e4ce;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #5C4B38;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        /* Records Table */
        .records-table-container {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #f2e4ce;
          overflow: hidden;
        }

        .records-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .records-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 100%;
        }

        .records-table th {
          background: #FFF6E5;
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 500;
          color: #3F2E1E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f2e4ce;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .records-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f2e4ce;
          vertical-align: middle;
        }

        .record-row {
          cursor: pointer;
          transition: all 0.15s;
        }

        .record-row:hover {
          background: #f9f6f1 !important;
          box-shadow: 0 2px 8px rgba(128,108,75,0.08);
        }

        .record-name {
          font-weight: 500;
          color: #3F2E1E;
        }

        .record-type {
          font-size: 0.75rem;
          color: #5C4B38;
          text-transform: capitalize;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
        }

        .status-completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-default {
          background: #f3f4f6;
          color: #374151;
        }

        .record-details {
          max-width: 200px;
        }

        .detail-item {
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .detail-label {
          font-weight: 500;
          text-transform: capitalize;
        }

        .table-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .table-action-btn {
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          min-width: 60px;
        }

        .table-action-btn.view {
          background: #806c4b;
        }

        .table-action-btn.view:hover {
          background: #6b5a3f;
        }

        .table-action-btn.edit {
          background: #2563eb;
        }

        .table-action-btn.edit:hover {
          background: #1d4ed8;
        }

        .table-action-btn.print {
          background: #059669;
        }

        .table-action-btn.print:hover {
          background: #047857;
        }

        /* Empty State */
        .empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #5C4B38;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .empty-subtitle {
          font-size: 0.875rem;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .staff-records-container {
            padding: 1rem;
          }

          .filters-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .actions-group {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .staff-records-container {
            padding: 0.75rem;
          }

          .records-title {
            font-size: 1.5rem;
          }

          .record-tabs {
            gap: 0.5rem;
          }

          .record-tab {
            padding: 0.4rem 0.8rem;
            font-size: 0.875rem;
          }

          .record-tab span:last-child {
            display: none; /* Hide text, keep only icons */
          }

          .filters-group {
            flex-direction: column;
            gap: 0.5rem;
          }

          .search-input {
            min-width: auto;
          }

          .actions-group {
            flex-direction: column;
          }

          .action-btn {
            font-size: 0.875rem;
            padding: 0.6rem 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .stat-card {
            padding: 0.75rem;
          }

          .stat-value {
            font-size: 1.25rem;
          }

          .records-table {
            min-width: 700px;
            font-size: 0.875rem;
          }

          .records-table th,
          .records-table td {
            padding: 0.75rem 1rem;
          }

          /* Hide less critical columns */
          .records-table th:nth-child(5),
          .records-table td:nth-child(5) {
            display: none; /* Hide Details column */
          }

          .table-actions {
            flex-direction: column;
            gap: 0.25rem;
            align-items: stretch;
          }

          .table-action-btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem;
            text-align: center;
            min-width: auto;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .staff-records-container {
            padding: 0.5rem;
          }

          .records-title {
            font-size: 1.25rem;
          }

          .record-tabs {
            justify-content: center;
          }

          .record-tab {
            padding: 0.5rem;
            min-width: 44px;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .records-table {
            min-width: 600px;
            font-size: 0.8rem;
          }

          .records-table th,
          .records-table td {
            padding: 0.5rem 0.75rem;
          }

          /* Hide additional columns */
          .records-table th:nth-child(3),
          .records-table td:nth-child(3) {
            display: none; /* Hide Priest column */
          }
        }

        @media (max-width: 480px) {
          .staff-records-container {
            padding: 0.25rem;
          }

          .records-title {
            font-size: 1.125rem;
          }

          .record-tab {
            padding: 0.4rem;
            min-width: 40px;
          }

          .action-btn {
            font-size: 0.8rem;
            padding: 0.5rem 0.8rem;
          }

          .records-table {
            min-width: 400px;
            font-size: 0.75rem;
          }

          .records-table th,
          .records-table td {
            padding: 0.4rem 0.5rem;
          }

          .table-action-btn {
            font-size: 0.7rem;
            padding: 0.3rem 0.4rem;
            min-width: auto;
            width: 100%;
          }
        }

        /* Landscape orientation adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .staff-records-container {
            padding: 0.5rem;
          }

          .records-header {
            margin-bottom: 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            margin-bottom: 1rem;
          }
        }

        /* Print styles */
        @media print {
          .record-tabs,
          .filters-actions,
          .table-actions {
            display: none;
          }

          .staff-records-container {
            padding: 0;
          }

          .records-table {
            font-size: 0.8rem;
          }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1000;
          background: rgba(44, 44, 44, 0.25);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-content {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(60,40,20,0.18);
          padding: 2.5rem;
          min-width: 340px;
          max-width: 500px;
          width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #e74c3c;
          cursor: pointer;
          font-weight: 700;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: rgba(231, 76, 60, 0.1);
        }

        .modal-title {
          color: #3F2E1E;
          font-weight: 700;
          font-size: 1.5rem;
          margin: 0;
          padding-right: 2rem;
        }

        .modal-divider {
          border-top: 1.5px solid #f2e4ce;
          margin: 0 -2.5rem;
        }

        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-row {
          color: #5C4B38;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .detail-row strong {
          color: #3F2E1E;
          font-weight: 600;
        }

        .detail-sub {
          margin-top: 0.5rem;
          padding-left: 1rem;
        }

        .detail-sub-item {
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .detail-sub-label {
          font-weight: 600;
          text-transform: capitalize;
          color: #3F2E1E;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .modal-btn {
          border-radius: 8px;
          padding: 0.625rem 1.5rem;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-btn.primary {
          background: #806c4b;
          color: #fff;
          box-shadow: 0 2px 8px rgba(128,108,75,0.10);
        }

        .modal-btn.primary:hover {
          background: #6b5a3f;
        }

        .modal-btn.secondary {
          background: white;
          color: #806c4b;
          border: 2px solid #806c4b;
        }

        .modal-btn.secondary:hover {
          background: #806c4b;
          color: white;
        }

        /* Modal Responsive Styles */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-content {
            padding: 2rem 1.5rem;
            min-width: auto;
            border-radius: 12px;
          }

          .modal-title {
            font-size: 1.25rem;
            padding-right: 2.5rem;
          }

          .modal-divider {
            margin: 0 -1.5rem;
          }

          .modal-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .modal-btn {
            width: 100%;
            padding: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 0.25rem;
          }

          .modal-content {
            padding: 1.5rem 1rem;
            max-height: 95vh;
          }

          .modal-title {
            font-size: 1.125rem;
          }

          .modal-divider {
            margin: 0 -1rem;
          }

          .detail-row {
            font-size: 0.875rem;
          }

          .detail-sub-item {
            font-size: 0.8rem;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .record-tab,
          .action-btn,
          .record-row,
          .table-action-btn,
          .modal-btn,
          .modal-close {
            transition: none;
          }
        }
      `}</style>

      <div className="records-header">
        <h1 className="records-title">Parish Records</h1>
        
        {/* Record Type Tabs */}
        <div className="record-tabs">
          {recordTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setActiveTab(type.key)}
              className={`record-tab ${activeTab === type.key ? 'active' : ''}`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Filters and Actions */}
        <div className="filters-actions">
          <div className="filters-group">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="actions-group">
            <button 
              onClick={addNewRecord} 
              className="action-btn primary"
            >
              Add New Record
            </button>
            <button 
              onClick={exportRecords} 
              className="action-btn secondary"
            >
              📊 Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-label">Total Records</h3>
          <p className="stat-value" style={{ color: '#3F2E1E' }}>
            {statistics.filtered_stats?.total || statistics.total_records || records.length}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Completed</h3>
          <p className="stat-value" style={{ color: '#059669' }}>
            {statistics.filtered_stats?.completed || statistics.completed_records || records.filter(r => r.status === 'completed' || r.status === 'Completed').length}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">This Month</h3>
          <p className="stat-value" style={{ color: '#2563eb' }}>
            {statistics.filtered_stats?.this_month || statistics.this_month_records || records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Current Year</h3>
          <p className="stat-value" style={{ color: '#806c4b' }}>
            {statistics.filtered_stats?.this_year || statistics.this_year_records || records.filter(r => new Date(r.date).getFullYear() === new Date().getFullYear()).length}
          </p>
        </div>
      </div>

      {/* Records Table */}
      <div className="records-table-container">
        <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Priest</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  paginatedRecords.map(record => (
                    <tr 
                      key={record.id}
                      className="record-row"
                      onClick={(e) => {
                        if (e.target.closest('.action-btn')) return;
                        setSelectedRecord(record);
                      }}
                    >
                      <td>
                        <div>
                          <div className="record-name">{record.name}</div>
                          <div className="record-type">{record.type}</div>
                        </div>
                      </td>
                      <td style={{ color: '#3F2E1E', fontSize: '0.875rem' }}>
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td style={{ color: '#3F2E1E', fontSize: '0.875rem' }}>{record.priest}</td>
                      <td>
                        <div className="record-details">
                          {record.details && Object.entries(record.details).slice(0, 2).map(([key, value]) => (
                            value && (
                              <div key={key} className="detail-item">
                                <span className="detail-label">{key.replace(/_/g, ' ')}:</span> {value}
                              </div>
                            )
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="table-action-btn view" 
                            onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }}
                          >
                            View
                          </button>
                          <button 
                            className="table-action-btn edit"
                            onClick={(e) => { e.stopPropagation(); handleEditRecord(record); }}
                          >
                            Edit
                          </button>
                          <button 
                            className="table-action-btn print"
                            onClick={(e) => { e.stopPropagation(); handlePrintRecord(record); }}
                          >
                            Release
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p className="empty-title">No {activeTab} records found</p>
                        <p className="empty-subtitle">Try adjusting your search filters or add a new record</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
              >Prev</button>
              <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {page} of {lastPage}</span>
              <button
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page >= lastPage ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
              >Next</button>
            </div>
        </div>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedRecord(null)} 
              className="modal-close"
            >
              &times;
            </button>
            <h2 className="modal-title">
              {selectedRecord.type.charAt(0).toUpperCase() + selectedRecord.type.slice(1)} Record Details
            </h2>
            <div className="modal-divider" />
            <div className="modal-details">
              <div className="detail-row">
                <strong>Name:</strong> {selectedRecord.name}
              </div>
              <div className="detail-row">
                <strong>Date:</strong> {new Date(selectedRecord.date).toLocaleDateString()}
              </div>
              <div className="detail-row">
                <strong>Priest:</strong> {selectedRecord.priest}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> {selectedRecord.status}
              </div>
              <div className="detail-row">
                <strong>Details:</strong>
                <div className="detail-sub">
                  {Object.entries(selectedRecord.details).map(([key, value]) => (
                    <div key={key} className="detail-sub-item">
                      <span className="detail-sub-label">{key.replace(/_/g, ' ')}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-divider" />
            <div className="modal-actions">
              <button 
                onClick={() => {
                  handleEditRecord(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="modal-btn secondary"
              >
                Edit
              </button>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="modal-btn primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRecord}
        recordType={activeTab}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setRecordToEdit(null);
        }}
        onSubmit={handleUpdateRecord}
        record={recordToEdit}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3500,
            padding: '1rem'
          }}
          onClick={() => setShowSuccessModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '2px solid #f2e4ce',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              {/* Success Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                animation: 'scaleIn 0.3s ease-out'
              }}>
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              {/* Success Message */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#3F2E1E',
                marginBottom: '0.5rem'
              }}>
                Success!
              </h3>
              <p style={{
                color: '#5C4B38',
                marginBottom: '2rem',
                fontSize: '1rem'
              }}>
                {successMessage}
              </p>

              {/* OK Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#806c4b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#6b5a3f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#806c4b'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default StaffRecords;