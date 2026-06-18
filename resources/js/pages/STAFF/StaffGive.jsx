import React, { useEffect, useState, useCallback } from 'react';
import { api, getCsrfToken } from '../../utils/axios';
import axios from 'axios';
import AnalyticsComparison from '../../components/AnalyticsComparison';
import PeriodSelector from '../../components/PeriodSelector';
import '../../../css/AdminMinistryApplicants.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.className = `toast toast-${type}`;
    Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        background: type === 'success' ? '#22c55e' : '#ef4444',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontSize: '1rem',
        opacity: 0.95,
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
};

// Helper function to determine if a donation is physical
const isPhysicalDonation = (donation) => {
  if (!donation) return false;
  
  // Check if is_physical field is explicitly set to true
  if (donation.is_physical === true || donation.is_physical === 1 || donation.is_physical === '1') {
    return true;
  }
  
  // Check if email contains @church.local (physical donations have this pattern)
  if (donation.email && typeof donation.email === 'string' && donation.email.includes('@church.local')) {
    return true;
  }
  
  // Check if reference starts with PHYS- (physical donations have this pattern)
  if (donation.reference && typeof donation.reference === 'string' && donation.reference.startsWith('PHYS-')) {
    return true;
  }
  
  return false;
};

// Helper function to check if a donation matches the purpose filter
const matchesPurpose = (donation, purposeFilter) => {
  if (purposeFilter === 'all') return true;
  if (!donation) return false;
  
  // Check purpose_id (most reliable)
  if (donation.purpose_id !== undefined && String(donation.purpose_id) === String(purposeFilter)) return true;
  
  // Check if purpose is an object with id
  if (donation.purpose && typeof donation.purpose === 'object' && donation.purpose.id !== undefined) {
    if (String(donation.purpose.id) === String(purposeFilter)) return true;
  }
  
  // Check category (sometimes used as purpose_id)
  if (donation.category !== undefined && String(donation.category) === String(purposeFilter)) return true;
  
  return false;
};

const StaffGive = () => {
  const [donations, setDonations] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPurposeManagement, setShowPurposeManagement] = useState(false);
  const [donationPurposes, setDonationPurposes] = useState([]);
  const [donationPurposesLoading, setDonationPurposesLoading] = useState(true);
  const [donationPurposesError, setDonationPurposesError] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [addPurposeLoading, setAddPurposeLoading] = useState(false);
  const [purposeSaving, setPurposeSaving] = useState(false);
  const [isRestoringPurpose, setIsRestoringPurpose] = useState(false);
  const [restorePurposeId, setRestorePurposeId] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalAmount, setEditGoalAmount] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [donationTypeFilter, setDonationTypeFilter] = useState('all'); // 'all', 'physical', 'online' - for analytics
  const [purposeFilter, setPurposeFilter] = useState('all'); // 'all' or purpose id - for donation list
  const [selectedYear, setSelectedYear] = useState(null); // null = all years, or specific year like 2023
  const [verifyingId, setVerifyingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isRejectingDonation, setIsRejectingDonation] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Donation Picture Management state
  const [showDonationPictureManagement, setShowDonationPictureManagement] = useState(false);
  const [donationPictures, setDonationPictures] = useState([]);
  const [donationPicturesLoading, setDonationPicturesLoading] = useState(false);
  const [donationPicturesError, setDonationPicturesError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // GCash Account Management state
  const [gcashAccounts, setGcashAccounts] = useState([]);
  const [gcashAccountsLoading, setGcashAccountsLoading] = useState(false);
  const [gcashAccountsError, setGcashAccountsError] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  
  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  
  // Add Monthly Donation state
  const [showMonthlyDonationModal, setShowMonthlyDonationModal] = useState(false);
  const [monthlyDonationForm, setMonthlyDonationForm] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    purpose_id: ''
  });
  const [addingMonthlyDonation, setAddingMonthlyDonation] = useState(false);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    totalDonations: 0,
    monthlyDonations: [],
    recentDonations: [],
    donationComparisons: { current: 0, previous: 0 }
  });
  // Store original unfiltered monthly donations for year dropdown calculation
  const [originalMonthlyDonations, setOriginalMonthlyDonations] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1;
    const pm = cm === 1 ? 12 : cm - 1;
    const py = cm === 1 ? cy - 1 : cy;
    return {
      current: { year: cy, month: cm, label: `${now.toLocaleString('default', { month: 'short' })} ${cy}` },
      compare: { year: py, month: pm, label: `${new Date(py, pm - 1, 1).toLocaleString('default', { month: 'short' })} ${py}` }
    };
  });

  const handlePeriodChange = (periods) => {
    // Normalize incoming periods so they consistently have { year, month (1-12), label }
    if (!periods) return;
    const normalizePart = (part, fallback) => {
      if (!part) return fallback;
      let year = part.year ?? part.y ?? fallback.year;
      // Determine which field provided the month to avoid off-by-one
      const hasMonth = Object.prototype.hasOwnProperty.call(part, 'month');
      const hasM = Object.prototype.hasOwnProperty.call(part, 'm');
      const hasMonthIndex = Object.prototype.hasOwnProperty.call(part, 'monthIndex');
      const hasMonthValue = Object.prototype.hasOwnProperty.call(part, 'monthValue');
      const rawSource = hasMonth ? 'month' : hasM ? 'm' : hasMonthIndex ? 'monthIndex' : hasMonthValue ? 'monthValue' : 'fallback';
      let month = part.month ?? part.m ?? part.monthIndex ?? part.monthValue ?? fallback.month;
      // Always convert strings, 0-based or edge values to 1-12
      if (typeof month === 'string') {
        month = month.replace(/^0+/,''); // strip leading zeros
        if (/^\d+$/.test(month)) month = Number(month);
      }
      if (typeof month !== 'number' || isNaN(month) || month < 1 || month > 12) month = fallback.month;
      // Only adjust 0-based values when the source was an index-style month
      if (rawSource === 'monthIndex') {
        // monthIndex is expected to be 0-11
        if (month >= 0 && month <= 11) month = month + 1;
      }
      // Final check still in bounds
      if (month < 1 || month > 12) month = fallback.month;
      // Build a human label when missing
      let label = part.label;
      try {
        if (!label && typeof year === 'number' && typeof month === 'number') {
          label = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short', year });
        }
      } catch (e) {
        label = fallback.label;
      }
      return { year, month, label };
    };
    setSelectedPeriods(prev => {
      const cur = normalizePart(periods.current, prev.current);
      const cmp = normalizePart(periods.compare, prev.compare);
      const normalized = { current: cur, compare: cmp };
      // Update comparisons after normalizing
      calculateDonationComparisons(normalized);
      return normalized;
    });
  };

  const calculateDonationComparisons = (periods) => {
    if (!periods) return;

    setAnalyticsData(prev => {
      if (!prev.monthlyDonations || prev.monthlyDonations.length === 0) {
        return prev; // Don't update if no data available
      }

      const { current, compare } = periods;
      
      // Find donation data using stable key YYYY-MM
      const formatKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
      const currentKey = formatKey(current.year, current.month);
      const compareKey = formatKey(compare.year, compare.month);
      const currentDonationData = prev.monthlyDonations.find(item => item.key === currentKey);
      const compareDonationData = prev.monthlyDonations.find(item => item.key === compareKey);

      // Only update if the values are different to prevent unnecessary re-renders
      const newCurrent = currentDonationData?.total || 0;
      const newPrevious = compareDonationData?.total || 0;
      
      if (prev.donationComparisons.current === newCurrent && prev.donationComparisons.previous === newPrevious) {
        return prev; // No change needed
      }

      return {
        ...prev,
        donationComparisons: {
          current: newCurrent,
          previous: newPrevious
        }
      };
    });
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations');
      const list = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
      console.log('Donations fetched:', list);
      setDonations(list);
    } catch (err) {
      console.error('Failed to fetch donations', err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationPurposes = useCallback(async () => {
    setDonationPurposesLoading(true);
    try {
        // Use admin endpoint to get all purposes including archived ones (like events)
        const response = await api.get('/admin/donation-purposes');
        setDonationPurposes(Array.isArray(response.data) ? response.data : []);
        setDonationPurposesError('');
    } catch (err) {
        // Fallback to public endpoint if admin endpoint fails
        try {
          const response = await api.get('/donation-purposes');
          setDonationPurposes(Array.isArray(response.data) ? response.data : []);
        } catch (fallbackErr) {
          setDonationPurposesError('Failed to fetch donation purposes.');
        }
    } finally {
        setDonationPurposesLoading(false);
    }
  }, []);

  const fetchDonationPictures = useCallback(async () => {
    setDonationPicturesLoading(true);
    try {
        const response = await api.get('/admin/donation-pictures');
        setDonationPictures(Array.isArray(response.data) ? response.data : []);
        setDonationPicturesError('');
    } catch (err) {
        console.error('Failed to fetch donation pictures:', err);
        setDonationPicturesError('Failed to fetch donation pictures.');
        showToast('Failed to fetch donation pictures', 'error');
    } finally {
        setDonationPicturesLoading(false);
    }
  }, []);

  // Recompute analytics when donations, donation type filter, or purpose filter change
  // Both filters work together: first filter by donation type, then by purpose
  // Example: "Physical" + "Parking Renovation" = only physical donations with parking renovation purpose
  useEffect(() => {
    if (!showAnalytics) return; // only compute when analytics panel is visible

    const matchesDonationType = (d, filterType) => {
      if (filterType === 'all') return true;
      const isPhysical = isPhysicalDonation(d);
      if (filterType === 'physical') return isPhysical;
      if (filterType === 'online') return !isPhysical;
      return true;
    };

    // Apply both filters together: first donation type, then purpose
    // Start with verified donations only
    let verifiedFiltered = (donations || []).filter(d => d && (d.verified === true || d.verified === 1 || d.verified === '1'));
    
    // Apply donation type filter
    if (donationTypeFilter !== 'all') {
      verifiedFiltered = verifiedFiltered.filter(d => matchesDonationType(d, donationTypeFilter));
    }
    
    // Apply purpose filter
    if (purposeFilter !== 'all') {
      verifiedFiltered = verifiedFiltered.filter(d => matchesPurpose(d, purposeFilter));
    }

      // Build last 36 months (3 years) buckets and sum amounts
      const months = [];
      const now = new Date();
      for (let i = 35; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`,
          month: dt.toLocaleString(undefined, { month: 'short', year: 'numeric' }),
          total: 0,
          count: 0
        });
      }
    const keyToIndex = Object.fromEntries(months.map((m, idx) => [m.key, idx]));
    verifiedFiltered.forEach(d => {
      const created = d.created_at || d.createdAt || d.date || d.timestamp;
      if (!created) return;
      const dt = new Date(created);
      if (isNaN(dt)) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const idx = keyToIndex[key];
      if (typeof idx === 'number') {
        months[idx].total += Number(d.amount || 0);
        months[idx].count += 1;
      }
    });

    const total = verifiedFiltered.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const recent = verifiedFiltered
      .slice()
      .sort((a, b) => new Date(b.created_at || b.createdAt || b.date || b.timestamp) - new Date(a.created_at || a.createdAt || a.date || a.timestamp))
      .slice(0, 10)
      .map(d => ({
        date: d.created_at || d.createdAt || d.date || d.timestamp,
        name: d.name || d.full_name || d.donor_name || '',
        email: d.email,
        amount: Number(d.amount || 0),
        reference: d.reference || d.ref || '',
        purpose_name: d.purpose_name || '',
        category: d.category || '',
      }));

    setAnalyticsData(prev => ({
      ...prev,
      totalDonations: total,
      monthlyDonations: months,
      recentDonations: recent,
    }));
    // Recalculate comparisons based on current selected periods and new monthly data
    setTimeout(() => calculateDonationComparisons(selectedPeriods), 0);
  }, [donations, donationTypeFilter, purposeFilter, showAnalytics]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setDonationPicturesError('Please select a valid image file');
      showToast('Please select a valid image file', 'error');
      setSelectedFile(null);
      e.target.value = ''; // Clear the input
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setDonationPicturesError('Image size must be less than 5MB');
      showToast('Image size must be less than 5MB', 'error');
      setSelectedFile(null);
      e.target.value = ''; // Clear the input
      return;
    }

    setSelectedFile(file);
    setDonationPicturesError('');
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setDonationPicturesError('Please select an image file first');
      showToast('Please select an image file first', 'error');
      return;
    }

    setUploadingImage(true);
    setDonationPicturesError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await api.post('/admin/donation-pictures', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        // Add a small delay to ensure file is accessible
        await new Promise(resolve => setTimeout(resolve, 500));
        showToast('Image uploaded successfully', 'success');
        fetchDonationPictures();
      } else {
        throw new Error('Upload failed: ' + (response.data.message || 'Unknown error'));
      }
      setSelectedFile(null);
      setSelectedImage(null);
      
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setDonationPicturesError('Failed to upload image');
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleImageStatus = async (imageId, currentStatus) => {
    try {
      // For session-based routes, use CSRF token from meta tag (session token)
      // Don't fetch Sanctum cookie - these routes use web middleware with session auth
      await api.put(`/admin/donation-pictures/${imageId}/toggle`, {
        enabled: !currentStatus
      });
      
      showToast(`Image ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchDonationPictures();
    } catch (err) {
      console.error('Failed to toggle image status:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Failed to update image status';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      // For session-based routes, ensure we have a fresh CSRF token
      // These routes use web middleware with session auth
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // If no CSRF token in meta tag, try to fetch it
      if (!csrfToken) {
        try {
          const tokenResponse = await fetch('/csrf-token', {
            credentials: 'include'
          });
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            // Update meta tag if token was fetched
            let metaTag = document.querySelector('meta[name="csrf-token"]');
            if (!metaTag) {
              metaTag = document.createElement('meta');
              metaTag.setAttribute('name', 'csrf-token');
              document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', tokenData.csrf_token);
          }
        } catch (e) {
          console.warn('Failed to fetch CSRF token:', e);
        }
      }
      
      await api.delete(`/admin/donation-pictures/${imageId}`);
      showToast('Image deleted successfully', 'success');
      fetchDonationPictures();
    } catch (err) {
      console.error('Failed to delete image:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Failed to delete image';
      showToast(errorMessage, 'error');
    }
  };

  // GCash Account Management functions
  const fetchGcashAccounts = useCallback(async () => {
    setGcashAccountsLoading(true);
    try {
        const response = await api.get('/admin/gcash-accounts');
        setGcashAccounts(Array.isArray(response.data) ? response.data : []);
        setGcashAccountsError('');
    } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setGcashAccountsError('Failed to fetch accounts.');
        showToast('Failed to fetch accounts', 'error');
    } finally {
        setGcashAccountsLoading(false);
    }
  }, []);

  const handleAddGcashAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountNumber.trim()) return;
    
    setAddingAccount(true);
    try {
        await api.post('/admin/gcash-accounts', {
            account_name: newAccountName,
            account_number: newAccountNumber
        });
        setNewAccountName('');
        setNewAccountNumber('');
        fetchGcashAccounts();
        showToast('Account added successfully', 'success');
    } catch (err) {
        console.error('Failed to add account:', err);
        setGcashAccountsError('Failed to add account.');
        showToast('Failed to add account', 'error');
    } finally {
        setAddingAccount(false);
    }
  };

  const handleEditGcashAccount = (account) => {
    setEditingAccount(account);
    setEditAccountName(account.account_name);
    setEditAccountNumber(account.account_number);
  };

  const handleUpdateGcashAccount = async (e) => {
    e.preventDefault();
    if (!editingAccount || !editAccountName.trim() || !editAccountNumber.trim()) return;

    try {
        await api.put(`/admin/gcash-accounts/${editingAccount.id}`, {
            account_name: editAccountName,
            account_number: editAccountNumber
        });
        setEditingAccount(null);
        setEditAccountName('');
        setEditAccountNumber('');
        fetchGcashAccounts();
        showToast('Account updated successfully', 'success');
    } catch (err) {
        console.error('Failed to update account:', err);
        showToast('Failed to update account', 'error');
    }
  };

  const handleToggleGcashAccount = async (accountId, currentStatus) => {
    try {
      // For session-based routes, use CSRF token from meta tag (session token)
      // Don't fetch Sanctum cookie - these routes use web middleware with session auth
      await api.put(`/admin/gcash-accounts/${accountId}/toggle`, {});
      
      showToast(`Account ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchGcashAccounts();
    } catch (err) {
      console.error('Failed to toggle account status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update account status';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteGcashAccount = async (accountId) => {
    try {
      await api.delete(`/admin/gcash-accounts/${accountId}`);
      showToast('Account deleted successfully', 'success');
      fetchGcashAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
      showToast('Failed to delete account', 'error');
    }
  };

  // Confirmation Modal functions
  const showConfirmation = (action, data) => {
    setConfirmAction(action);
    setConfirmData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !confirmData) return;

    try {
      switch (confirmAction) {
        case 'deleteImage':
          await handleDeleteImage(confirmData.id);
          break;
        case 'toggleImage':
          await handleToggleImageStatus(confirmData.id, confirmData.enabled);
          break;
        case 'deleteAccount':
          await handleDeleteGcashAccount(confirmData.id);
          break;
        case 'toggleAccount':
          await handleToggleGcashAccount(confirmData.id, confirmData.enabled);
          break;
        case 'archivePurpose':
          await confirmArchivePurpose(confirmData.id, confirmData.name);
          break;
        case 'restorePurpose':
          await confirmRestorePurpose(confirmData.id, confirmData.name);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      // Fetch donations data directly like admin does
      const donationsRes = await api.get('/donations');
      
      // Process donations to derive summaries (exact same logic as admin)
      const donations = Array.isArray(donationsRes.data) ? donationsRes.data : [];
      // Only consider verified donations for reporting
      let verifiedDonations = donations.filter(d => d && (d.verified === true || d.verified === 1 || d.verified === '1'));

      // Apply donation type filter if not "all" (e.g., physical or online)
      // This filter is applied first, then purpose filter is applied to the result
      if (donationTypeFilter !== 'all') {
        verifiedDonations = verifiedDonations.filter(d => {
          const isPhysical = isPhysicalDonation(d);
          if (donationTypeFilter === 'physical') {
            return isPhysical;
          }
          if (donationTypeFilter === 'online') {
            return !isPhysical;
          }
          return true;
        });
      }

      // Apply purpose filter if not "all" (e.g., parking renovation)
      // This filter is applied AFTER donation type filter, so both filters work together
      // Example: "Physical" + "Parking Renovation" = only physical donations with parking renovation purpose
      if (purposeFilter !== 'all') {
        verifiedDonations = verifiedDonations.filter(d => matchesPurpose(d, purposeFilter));
      }

      const totalDonations = verifiedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      // Build last 36 months (3 years) buckets or selected year (month label: e.g., "Aug 2025") and sum amounts
      const months = [];
      const now = new Date();
      
      if (selectedYear) {
        // Build only for selected year
        for (let month = 1; month <= 12; month++) {
          const dt = new Date(selectedYear, month - 1, 1);
          const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
          months.push({ key: `${selectedYear}-${String(month).padStart(2,'0')}`, month: label, total: 0, count: 0 });
        }
      } else {
        // Build for all 36 months (3 years)
        for (let i = 35; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
          months.push({ key: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`, month: label, total: 0, count: 0 });
        }
      }

      const monthIndexMap = Object.fromEntries(months.map((m, idx) => [m.key, idx]));
      verifiedDonations.forEach(d => {
        const created = d.created_at || d.createdAt || d.date || d.timestamp;
        if (!created) return;
        const dt = new Date(created);
        if (isNaN(dt)) return;
        
        // Filter by year if selected
        if (selectedYear && dt.getFullYear() !== selectedYear) return;
        
        const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const idx = monthIndexMap[key];
        if (typeof idx === 'number') {
          months[idx].total += Number(d.amount || 0);
          months[idx].count += 1;
        }
      });

      const monthlyDonations = months.map(m => ({ month: m.month, total: m.total, count: m.count, key: m.key }));

      // Store original unfiltered monthly donations (always build for all 36 months)
      const originalMonths = [];
      const nowDate = new Date();
      for (let i = 35; i >= 0; i--) {
        const dt = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
        originalMonths.push({
          key: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`,
          month: dt.toLocaleString(undefined, { month: 'short', year: 'numeric' }),
          total: 0,
          count: 0
        });
      }
      const originalKeyToIndex = Object.fromEntries(originalMonths.map((m, idx) => [m.key, idx]));
      verifiedDonations.forEach(d => {
        const created = d.created_at || d.createdAt || d.date || d.timestamp;
        if (!created) return;
        const dt = new Date(created);
        if (isNaN(dt)) return;
        const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const idx = originalKeyToIndex[key];
        if (typeof idx === 'number') {
          originalMonths[idx].total += Number(d.amount || 0);
          originalMonths[idx].count += 1;
        }
      });
      const originalMonthlyDonationsData = originalMonths.map(m => ({ month: m.month, total: m.total, count: m.count, key: m.key }));
      setOriginalMonthlyDonations(originalMonthlyDonationsData);

      // Calculate month-over-month comparison
      const currentMonthDonations = monthlyDonations[monthlyDonations.length - 1]?.total || 0;
      const previousMonthDonations = monthlyDonations[monthlyDonations.length - 2]?.total || 0;

      const recentDonations = verifiedDonations
        .slice()
        .sort((a,b) => new Date(b.created_at || b.createdAt || b.date || b.timestamp) - new Date(a.created_at || a.createdAt || a.date || a.timestamp))
        .slice(0, 10)
        .map(d => ({
          name: d.name,
          email: d.email,
          amount: Number(d.amount || 0),
          purpose_name: d.purpose_name,
          category: d.category,
          date: d.created_at || d.createdAt || d.date || d.timestamp
        }));

      setAnalyticsData({
        totalDonations: totalDonations,
        monthlyDonations: monthlyDonations,
        recentDonations: recentDonations,
        donationComparisons: { 
          current: currentMonthDonations, 
          previous: previousMonthDonations 
        }
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showToast('Failed to load analytics data', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [donationTypeFilter, purposeFilter, selectedYear]);

  useEffect(() => {
    fetchDonations();
    fetchDonationPurposes();
    if (showAnalytics) {
      fetchAnalytics();
    }
    if (showDonationPictureManagement) {
      fetchDonationPictures();
      fetchGcashAccounts();
    }
    window.addEventListener('donationsUpdated', fetchDonations);
    return () => window.removeEventListener('donationsUpdated', fetchDonations);
  }, [fetchDonationPurposes, fetchAnalytics, showAnalytics, donationTypeFilter, purposeFilter, selectedYear, fetchDonationPictures, fetchGcashAccounts, showDonationPictureManagement]);

  // Trigger period calculation when analytics data is loaded
  useEffect(() => {
    if (analyticsData.monthlyDonations && analyticsData.monthlyDonations.length > 0) {
      // Use setTimeout to ensure the state has been updated
      setTimeout(() => {
        calculateDonationComparisons(selectedPeriods);
      }, 100);
    }
  }, [analyticsData.monthlyDonations]);

  const handleVerify = async (donation) => {
    const id = donation._id || donation.id;
    if (!id) return alert('Invalid donation id');
    setVerifyingId(id);
    try {
      await api.post(`/donations/${id}/verify`);
      fetchDonations();
      window.dispatchEvent(new Event('donationVerified'));
      showToast(`Donation from ${donation.name} verified and user notified.`, 'success');
    } catch (err) {
      console.error('Verification failed', err);
      showToast('Verification failed.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddDonationPurpose = async (e) => {
    e.preventDefault();
    if (!newPurpose.trim()) return;
    setAddPurposeLoading(true);
    try {
        await api.post('/admin/donation-purposes', { name: newPurpose });
        setNewPurpose('');
        fetchDonationPurposes();
        showToast('Donation purpose added', 'success');
    } catch (err) {
        setDonationPurposesError('Failed to add donation purpose.');
        showToast('Failed to add donation purpose', 'error');
    } finally {
        setAddPurposeLoading(false);
    }
  };

  const handleArchiveDonationPurpose = async (id, name) => {
    showConfirmation('archivePurpose', { id, name });
  };

  const confirmArchivePurpose = async (id, name) => {
    setPurposeSaving(true);
    try {
        await api.delete(`/admin/donation-purposes/${id}`);
        fetchDonationPurposes();
        showToast('Donation purpose archived successfully', 'success');
    } catch (err) {
        setDonationPurposesError('Failed to archive donation purpose.');
        showToast('Failed to archive donation purpose', 'error');
    } finally {
        setPurposeSaving(false);
    }
  };

  const handleRestorePurpose = async (id, name) => {
    if (!id) return;
    showConfirmation('restorePurpose', { id, name });
  };

  const confirmRestorePurpose = async (id, name) => {
    if (!id) return;
    
    setIsRestoringPurpose(true);
    setRestorePurposeId(id);
    
    try {
      const response = await api.post(`/admin/donation-purposes/${id}/restore`);
      showToast(response.data?.message || 'Donation purpose restored successfully.', 'success');
      fetchDonationPurposes();
    } catch (error) {
      console.error('Restore error:', error);
      showToast(error.response?.data?.message || 'Failed to restore donation purpose.', 'error');
    } finally {
      setIsRestoringPurpose(false);
      setRestorePurposeId(null);
    }
  };

  const openRejectModal = (donation) => {
    const id = donation._id || donation.id;
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    setIsRejectingDonation(true);
    try {
      await api.post(`/donations/${rejectingId}/reject`, { reason: rejectReason });
      fetchDonations();
      window.dispatchEvent(new Event('donationRejected'));
      showToast('Donation rejected and donor notified.', 'success');
    } catch (err) {
      console.error('Reject failed', err);
      showToast('Failed to reject donation.', 'error');
    } finally {
      setIsRejectingDonation(false);
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const handleAddMonthlyDonation = async (e) => {
    e.preventDefault();
    if (!monthlyDonationForm.amount || parseFloat(monthlyDonationForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setAddingMonthlyDonation(true);
    try {
      // Create date string for the selected month (first day of the month) without timezone conversion
      // Format: YYYY-MM-DD HH:mm:ss
      const monthStr = String(monthlyDonationForm.month).padStart(2, '0');
      const yearStr = String(monthlyDonationForm.year);
      const dateStr = `${yearStr}-${monthStr}-01 00:00:00`;
      
      const payload = {
        name: 'Physical Donation',
        email: `physical-${Date.now()}@church.local`,
        amount: parseFloat(monthlyDonationForm.amount),
        reference: `PHYS-${Date.now()}`,
        category: monthlyDonationForm.purpose_id || '',
        purpose_name: donationPurposes.find(p => p.id === monthlyDonationForm.purpose_id)?.name || '',
        verified: true, // Auto-verify physical donations
        created_at: dateStr, // Set to first day of selected month (YYYY-MM-DD format)
        is_physical: true
      };

      await api.post('/donations/physical', payload);
      
      // Reset form
      setMonthlyDonationForm({
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        purpose_id: ''
      });
      setShowMonthlyDonationModal(false);
      
      // Refresh donations first, then analytics
      await fetchDonations();
      window.dispatchEvent(new Event('donationsUpdated'));
      
      // Refresh analytics after donations are updated
      // fetchAnalytics fetches from API directly, so it will get the latest data
      if (showAnalytics) {
        await fetchAnalytics();
      }
      
      showToast('Monthly donation added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add monthly donation', err);
      showToast(err.response?.data?.message || 'Failed to add monthly donation', 'error');
    } finally {
      setAddingMonthlyDonation(false);
    }
  };

  const handleToggleDonationPurpose = async (id, enabled, name) => {
    const action = enabled ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} "${name}"?`)) return;
    setPurposeSaving(true);
    try {
        await api.patch(`/admin/donation-purposes/${id}`, { enabled: !enabled });
        fetchDonationPurposes();
        showToast(`Donation purpose ${action}d`, 'success');
    } catch (err) {
        setDonationPurposesError(`Failed to ${action} donation purpose.`);
        showToast(`Failed to ${action} donation purpose`, 'error');
    } finally {
        setPurposeSaving(false);
    }
  };

  const handleEditGoal = (purpose) => {
    setEditingGoal(purpose.id);
    setEditGoalAmount(purpose.goal_amount || '');
  };

  const handleUpdateGoal = async (purposeId) => {
    setPurposeSaving(true);
    try {
        const goalAmount = editGoalAmount.trim() === '' ? null : parseFloat(editGoalAmount);
        await api.patch(`/admin/donation-purposes/${purposeId}`, { goal_amount: goalAmount });
        fetchDonationPurposes();
        setEditingGoal(null);
        setEditGoalAmount('');
        showToast('Goal updated successfully', 'success');
    } catch (err) {
        showToast('Failed to update goal', 'error');
    } finally {
        setPurposeSaving(false);
    }
  };

  const handleCancelEditGoal = () => {
    setEditingGoal(null);
    setEditGoalAmount('');
  };

  // Analytics Dashboard Component - Exact copy from admin DonationSummary
  const AnalyticsDashboard = () => {
    // Get available years from original unfiltered monthly donations
    const availableYears = React.useMemo(() => {
      const dataToUse = originalMonthlyDonations.length > 0 ? originalMonthlyDonations : analyticsData.monthlyDonations;
      if (!dataToUse || dataToUse.length === 0) return [];
      const years = new Set();
      dataToUse.forEach(m => {
        try {
          const year = new Date(m.month + ' 1').getFullYear();
          if (!isNaN(year)) years.add(year);
        } catch (e) {
          // Try parsing the key if month format fails
          if (m.key) {
            const yearMatch = m.key.match(/^(\d{4})-/);
            if (yearMatch) years.add(parseInt(yearMatch[1]));
          }
        }
      });
      return Array.from(years).sort((a, b) => b - a); // Most recent first
    }, [originalMonthlyDonations, analyticsData.monthlyDonations]);
    
    if (analyticsLoading) {
      return (
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
            <svg style={{ width: 64, height: 64, color: '#806c4b', marginBottom: 12 }} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#806c4b" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>
              Loading analytics data...
            </div>
          </div>
        </div>
      );
    }

    // Professional Chart.js DonationAmountChart component
    const DonationAmountChart = ({ monthlyData, color = '#FFD700' }) => {
      // monthlyData: [{ month, total, count }]
      const maxValue = Math.max(...monthlyData.map(m => m.total)) || 10;
      const minValue = Math.min(...monthlyData.map(m => m.total).filter(v => v > 0)) || 0;

      const chartData = {
        labels: monthlyData.map(m => m.month),
        datasets: [
          {
            label: 'Monthly Donations (₱)',
            data: monthlyData.map(m => m.total),
            backgroundColor: monthlyData.map((m) => {
              if (m.total === maxValue && maxValue > 0) {
                return 'rgba(34, 197, 94, 0.8)'; // Green for highest
              }
              if (m.total === minValue && minValue > 0) {
                return 'rgba(234, 179, 8, 0.8)'; // Yellow for lowest
              }
              return color.includes('rgba') ? color : `rgba(255, 215, 0, 0.7)`;
            }),
            borderColor: monthlyData.map((m) => {
              if (m.total === maxValue && maxValue > 0) {
                return 'rgba(34, 197, 94, 1)';
              }
              if (m.total === minValue && minValue > 0) {
                return 'rgba(234, 179, 8, 1)';
              }
              return color.includes('rgba') ? color.replace('0.7', '1') : 'rgba(255, 215, 0, 1)';
            }),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(63, 46, 30, 0.95)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: function(context) {
                return `₱${context.parsed.y.toLocaleString()}`;
              },
            },
            displayColors: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11,
              },
              color: '#5C4B38',
              callback: function(value) {
                return '₱' + value.toLocaleString();
              },
            },
            title: {
              display: true,
              text: 'Amount (₱)',
              font: {
                size: 12,
                weight: '600',
              },
              color: '#5C4B38',
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
              color: '#5C4B38',
              maxRotation: 45,
              minRotation: 0,
            },
          },
        },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart',
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      };

      return (
        <div className="w-full h-48 sm:h-64 main-bar-graph">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-medium text-[#5C4B38]">
              Monthly Donations {selectedYear ? `(${selectedYear})` : '(3 Years)'} (₱)
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-[#5C4B38]">Highest: ₱{maxValue.toLocaleString()}</span>
              </div>
              {minValue > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-[#5C4B38]">Lowest: ₱{minValue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ height: '200px' }}>
            <Bar data={chartData} options={options} />
          </div>
        </div>
      );
    };

    // DonationSummary component - exact copy from admin
    const DonationSummary = ({ data }) => {
      // Filter monthly data by selected year
      let monthly = data.monthlyDonations || [];
      if (selectedYear) {
        monthly = monthly.filter(m => {
          const year = new Date(m.month + ' 1').getFullYear();
          return year === selectedYear;
        });
      }
      
      const total = monthly.reduce((s, m) => s + (m.total || 0), 0);
      const count = monthly.reduce((s, m) => s + (m.count || 0), 0);
      const avg = count > 0 ? Math.round(total / count) : 0;

      // Month filter state
      const [selectedMonth, setSelectedMonth] = React.useState('');

      // Download handler
      const handleDownloadExcel = async () => {
        const XLSX = await import('xlsx');
        // Get all donations for the selected month
        let donations = data.recentDonations || [];
        if (selectedMonth) {
          donations = donations.filter(d => {
            const dt = new Date(d.date);
            const monthLabel = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
            return monthLabel === selectedMonth;
          });
        }
        // Fetch donation purposes from API
        let donationPurposes = [];
        try {
          const res = await fetch('/donation-purposes');
          donationPurposes = await res.json();
        } catch (err) {
          donationPurposes = [];
        }
        // Prepare worksheet data
        const wsData = [
          ['Donation Summaries for', selectedMonth || 'All Months'],
          [],
          ['Donor Name', 'Email', 'Amount', 'Purpose', 'Date'],
          ...donations.map(d => {
            // Prefer purpose_name if available
            let purposeName = d.purpose_name;
            if (!purposeName) {
              let pid = d.category;
              let found = donationPurposes.find(p => String(p.id) === String(pid));
              if (!found) {
                found = donationPurposes.find(p => Number(p.id) === Number(pid));
              }
              purposeName = found ? found.name : `Unknown (${pid})`;
            }
            return [
              d.name,
              d.email,
              d.amount,
              purposeName,
              new Date(d.date).toLocaleDateString()
            ];
          }),
          [],
          ['Total Amount', donations.reduce((sum, d) => sum + Number(d.amount || 0), 0)],
          ['Month', selectedMonth || 'All Months']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Professional formatting: bold header
        ws['A1'].s = { font: { bold: true, sz: 14 } };
        ws['A3'].s = ws['B3'].s = ws['C3'].s = ws['D3'].s = ws['E3'].s = { font: { bold: true } };
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Donations');
        // File name
        const fileName = `${selectedMonth || 'AllMonths'}_donationSummaries.xlsx`;
        XLSX.writeFile(wb, fileName);
      };

      // Get unique months for filter dropdown
      const monthOptions = monthly.map(m => m.month);

      return (
        <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 analytics-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[#3F2E1E]">Donation Summaries</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-[#3F2E1E] font-medium">Year:</label>
              <select
                value={selectedYear || 'all'}
                onChange={e => setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))}
                className="px-2 sm:px-3 py-1 sm:py-2 border border-[#f2e4ce] rounded-lg text-[#3F2E1E] bg-white text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-[#FFF6E5] rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-[#5C4B38]">Total (verified)</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3F2E1E]">₱{total.toLocaleString()}</div>
            </div>
            <div className="bg-[#FFF6E5] rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-[#5C4B38]">Number of Donations {selectedYear ? `(${selectedYear})` : '(3 Years)'}</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3F2E1E]">{count}</div>
            </div>
            <div className="bg-[#FFF6E5] rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-[#5C4B38]">Average Donation</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3F2E1E]">₱{avg.toLocaleString()}</div>
            </div>
          </div>

          {/* Month filter and download button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <label className="text-xs sm:text-sm text-[#5C4B38]">Filter by Month:</label>
            <select
              className="border rounded px-2 py-1 text-[#3F2E1E] text-xs sm:text-sm w-full sm:w-40"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <button
              className="px-3 sm:px-4 py-2 bg-[#3E88CD] text-white rounded-lg hover:bg-[#2C6BA0] transition-colors text-xs sm:text-sm w-full sm:w-auto"
              onClick={handleDownloadExcel}
            >
              Download as Excel
            </button>
          </div>

          <DonationAmountChart monthlyData={monthly} />
        </div>
      );
    };

    return (
      <div>
        {/* Donation Type Filter for Analytics */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: '#3F2E1E', fontWeight: 500 }}>Filter by Donation Type:</label>
          <select
            value={donationTypeFilter}
            onChange={e => setDonationTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #f2e4ce',
              borderRadius: 8,
              color: '#3F2E1E',
              backgroundColor: '#fff',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Donations</option>
            <option value="physical">Physical Donations</option>
            <option value="online">Online Donations</option>
          </select>
          
          {/* Purpose Filter for Analytics */}
          <label style={{ color: '#3F2E1E', fontWeight: 500, marginLeft: '12px' }}>Filter by Purpose:</label>
          <select
            value={purposeFilter}
            onChange={e => setPurposeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #f2e4ce',
              borderRadius: 8,
              color: '#3F2E1E',
              backgroundColor: '#fff',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Purposes</option>
            {donationPurposes.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.deleted_at ? ' (Archived)' : ''}</option>
            ))}
          </select>
          
          {/* Add Monthly Donation Button for Analytics */}
          <button
            onClick={() => setShowMonthlyDonationModal(true)}
            style={{
              marginLeft: '12px',
              padding: '8px 16px',
              backgroundColor: '#806c4b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            Add Monthly Donation
          </button>
        </div>

        <DonationSummary data={analyticsData} />
        
        {/* Period Selector */}
        <PeriodSelector 
          onPeriodChange={handlePeriodChange}
          onChange={handlePeriodChange}
          onSelect={handlePeriodChange}
          currentPeriod={selectedPeriods.current}
          comparePeriod={selectedPeriods.compare}
          defaultCurrentPeriod="current-month"
          defaultComparePeriod="previous-month"
          showYearSelector={true}
          showMonthSelector={true}
        />
        
        {/* Month-over-Month Comparison Section */}
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#3F2E1E', fontSize: '1.25rem', fontWeight: '600' }}>📊 Month-over-Month Analysis</h3>
            <button 
              onClick={fetchAnalytics}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#806c4b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <AnalyticsComparison
              currentValue={analyticsData.donationComparisons.current}
              previousValue={analyticsData.donationComparisons.previous}
              label="Donations"
              format="currency"
              icon="💰"
              color="#10b981"
              currentPeriod={selectedPeriods.current.label}
              comparePeriod={selectedPeriods.compare.label}
              showPeriodLabels={true}
            />
          </div>
        </div>

        {/* Monthly Summary Section */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #f2e4ce', 
          padding: '1.5rem', 
          marginTop: '2rem', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ color: '#3F2E1E', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Monthly Summary {selectedYear ? `(${selectedYear})` : '(Last 36 Months - 3 Years)'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {(() => {
              const allMonths = analyticsData.monthlyDonations || [];
              const allOriginalMonths = originalMonthlyDonations || [];
              const totalAmount = allMonths.reduce((sum, m) => sum + (m.total || 0), 0);
              const totalCount = allMonths.reduce((sum, m) => sum + (m.count || 0), 0);
              const avgMonthly = allMonths.length > 0 ? totalAmount / allMonths.length : 0;
              const maxMonth = allMonths.reduce((max, m) => (m.total || 0) > (max.total || 0) ? m : max, allMonths[0] || { total: 0, month: 'N/A' });
              const minMonth = allMonths.filter(m => (m.total || 0) > 0).reduce((min, m) => (m.total || 0) < (min.total || 0) ? m : min, allMonths.find(m => (m.total || 0) > 0) || { total: 0, month: 'N/A' });
              
              // Calculate comprehensive insights
              const totals = allMonths.map(m => m.total || 0);
              const counts = allMonths.map(m => m.count || 0);
              
              let currentYear, previousYear, twoYearsAgo, currentYearCount, previousYearCount;
              
              if (selectedYear) {
                // When a year is selected, compare with previous years from originalMonthlyDonations
                currentYear = totals; // All months of selected year (12 months)
                
                // Get previous year data from originalMonthlyDonations (extract year from key format: "YYYY-MM")
                const prevYearData = allOriginalMonths.filter(m => {
                  if (!m.key) return false;
                  const year = parseInt(m.key.split('-')[0]);
                  return year === selectedYear - 1;
                });
                previousYear = prevYearData.map(m => m.total || 0);
                
                // Get two years ago data from originalMonthlyDonations (extract year from key format: "YYYY-MM")
                const twoYearsAgoData = allOriginalMonths.filter(m => {
                  if (!m.key) return false;
                  const year = parseInt(m.key.split('-')[0]);
                  return year === selectedYear - 2;
                });
                twoYearsAgo = twoYearsAgoData.map(m => m.total || 0);
                
                // Counts for selected year vs previous year
                currentYearCount = counts.reduce((sum, c) => sum + c, 0);
                previousYearCount = prevYearData.map(m => m.count || 0).reduce((sum, c) => sum + c, 0);
              } else {
                // When showing all years, use last 12 months vs previous 12 months
                currentYear = totals.slice(-12);
                previousYear = totals.slice(-24, 12);
                twoYearsAgo = totals.slice(-36, 12);
                currentYearCount = counts.slice(-12).reduce((sum, c) => sum + c, 0);
                previousYearCount = counts.slice(-24, 12).reduce((sum, c) => sum + c, 0);
              }
              
              const currentYearTotal = currentYear.reduce((sum, t) => sum + t, 0);
              const previousYearTotal = previousYear.length > 0 ? previousYear.reduce((sum, t) => sum + t, 0) : 0;
              const twoYearsAgoTotal = twoYearsAgo.length > 0 ? twoYearsAgo.reduce((sum, t) => sum + t, 0) : 0;
              const yoyGrowth = previousYearTotal > 0 
                ? Math.round(((currentYearTotal - previousYearTotal) / previousYearTotal) * 100 * 10) / 10
                : 0;
              const twoYearGrowth = twoYearsAgoTotal > 0
                ? Math.round(((currentYearTotal - twoYearsAgoTotal) / twoYearsAgoTotal) * 100 * 10) / 10
                : 0;
              
              // Trend analysis - for selected year, compare first 6 months vs last 6 months
              let recentMonths, olderMonths;
              if (selectedYear && totals.length === 12) {
                // For selected year, compare last 6 months vs first 6 months
                recentMonths = totals.slice(6);
                olderMonths = totals.slice(0, 6);
              } else {
                // For all years, compare last 6 months vs previous 6 months
                recentMonths = totals.slice(-6);
                olderMonths = totals.slice(-12, 6);
              }
              const recentAvg = recentMonths.length > 0 ? recentMonths.reduce((sum, t) => sum + t, 0) / recentMonths.length : 0;
              const olderAvg = olderMonths.length > 0 ? olderMonths.reduce((sum, t) => sum + t, 0) / olderMonths.length : recentAvg;
              const trendPercentage = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100 * 10) / 10 : 0;
              const trend = recentAvg > olderAvg * 1.1 ? 'increasing' : (recentAvg < olderAvg * 0.9 ? 'decreasing' : 'stable');
              
              // Average donation amount trend
              const avgDonations = allMonths.map(m => m.count > 0 ? m.total / m.count : 0);
              let recentAvgDonation, olderAvgDonation;
              if (selectedYear && allMonths.length === 12) {
                // For selected year, compare last 6 months vs first 6 months
                recentAvgDonation = allMonths.slice(6).map(m => m.count > 0 ? m.total / m.count : 0).filter(v => v > 0);
                olderAvgDonation = allMonths.slice(0, 6).map(m => m.count > 0 ? m.total / m.count : 0).filter(v => v > 0);
              } else {
                // For all years, compare last 6 months vs previous 6 months
                recentAvgDonation = allMonths.slice(-6).map(m => m.count > 0 ? m.total / m.count : 0).filter(v => v > 0);
                olderAvgDonation = allMonths.slice(-12, 6).map(m => m.count > 0 ? m.total / m.count : 0).filter(v => v > 0);
              }
              const recentAvgDonationAmount = recentAvgDonation.length > 0 
                ? recentAvgDonation.reduce((sum, a) => sum + a, 0) / recentAvgDonation.length 
                : 0;
              const olderAvgDonationAmount = olderAvgDonation.length > 0
                ? olderAvgDonation.reduce((sum, a) => sum + a, 0) / olderAvgDonation.length
                : 0;
              const avgDonationTrend = olderAvgDonationAmount > 0
                ? Math.round(((recentAvgDonationAmount - olderAvgDonationAmount) / olderAvgDonationAmount) * 100 * 10) / 10
                : 0;
              
              // Donation count growth (already calculated above)
              const donationCountGrowth = previousYearCount > 0
                ? Math.round(((currentYearCount - previousYearCount) / previousYearCount) * 100 * 10) / 10
                : 0;
              
              // Consistency calculation
              const mean = avgMonthly;
              const variance = totals.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / totals.length;
              const stdDev = Math.sqrt(variance);
              const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;
              const consistency = coefficientOfVariation < 30 ? 'high' : (coefficientOfVariation < 50 ? 'medium' : 'low');
              
              return (
                <>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #93c5fd' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Total Amount {selectedYear ? `(${selectedYear})` : '(3 Years)'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                      ₱{totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>
                      {totalCount} donations
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #6ee7b7' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Average Monthly
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#047857' }}>
                      ₱{Math.round(avgMonthly).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                      Per month
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #c084fc' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#581c87', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Year-over-Year Growth
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: yoyGrowth >= 0 ? '#047857' : '#dc2626' }}>
                      {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9333ea', marginTop: '0.25rem' }}>
                      Current: ₱{currentYearTotal.toLocaleString()} | Prev: ₱{previousYearTotal.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #fb923c' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Trend
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      color: trend === 'increasing' ? '#047857' : (trend === 'decreasing' ? '#dc2626' : '#6b7280'),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      background: trend === 'increasing' ? '#d1fae5' : (trend === 'decreasing' ? '#fee2e2' : '#f3f4f6'),
                      display: 'inline-block'
                    }}>
                      {trend}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#f97316', marginTop: '0.25rem' }}>
                      {trendPercentage >= 0 ? '+' : ''}{trendPercentage}% (last 6mo)
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #60a5fa' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '500', marginBottom: '0.25rem' }}>
                      2-Year Growth
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: twoYearGrowth >= 0 ? '#047857' : '#dc2626' }}>
                      {twoYearGrowth >= 0 ? '+' : ''}{twoYearGrowth}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>
                      vs 2 years ago
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #6ee7b7' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Avg Donation Trend
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: avgDonationTrend >= 0 ? '#047857' : '#dc2626' }}>
                      {avgDonationTrend >= 0 ? '+' : ''}{avgDonationTrend}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                      Per donation amount
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #f9a8d4' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#831843', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Donation Count Growth
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: donationCountGrowth >= 0 ? '#047857' : '#dc2626' }}>
                      {donationCountGrowth >= 0 ? '+' : ''}{donationCountGrowth}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#ec4899', marginTop: '0.25rem' }}>
                      {currentYearCount} vs {previousYearCount} donations
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    border: '1px solid #fcd34d' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Data Consistency
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      color: consistency === 'high' ? '#047857' : (consistency === 'medium' ? '#d97706' : '#dc2626'),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      background: consistency === 'high' ? '#d1fae5' : (consistency === 'medium' ? '#fef3c7' : '#fee2e2'),
                      display: 'inline-block'
                    }}>
                      {consistency}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                      CV: {Math.round(coefficientOfVariation * 10) / 10}%
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #f2e4ce', 
          padding: '1.5rem', 
          marginTop: '1.5rem' 
        }}>
          <h3 style={{ color: '#3F2E1E', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Detailed Monthly Breakdown
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#3F2E1E' }}>Month</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#3F2E1E' }}>Total Amount</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#3F2E1E' }}>Donation Count</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#3F2E1E' }}>Average per Donation</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#3F2E1E' }}>Change from Previous</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData.monthlyDonations || []).map((month, index) => {
                  const prevMonth = index > 0 ? (analyticsData.monthlyDonations || [])[index - 1] : null;
                  const delta = prevMonth ? (month.total || 0) - (prevMonth.total || 0) : null;
                  const avgPerDonation = (month.count || 0) > 0 ? (month.total || 0) / (month.count || 0) : 0;
                  
                  return (
                    <tr 
                      key={month.key || index} 
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        background: index % 2 === 0 ? '#fff' : '#f9fafb',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#f9fafb'}
                    >
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#3F2E1E', fontWeight: '500' }}>
                        {month.month || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#3F2E1E', textAlign: 'right', fontWeight: '600' }}>
                        ₱{(month.total || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#5C4B38', textAlign: 'right' }}>
                        {month.count || 0}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#5C4B38', textAlign: 'right' }}>
                        {avgPerDonation > 0 ? `₱${Math.round(avgPerDonation).toLocaleString()}` : '-'}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        fontSize: '0.875rem', 
                        textAlign: 'right', 
                        fontWeight: '500',
                        color: delta === null 
                          ? '#6b7280' 
                          : delta > 0 
                            ? '#059669' 
                            : delta < 0 
                              ? '#dc2626' 
                              : '#6b7280'
                      }}>
                        {delta !== null ? (delta > 0 ? '+' : '') + `₱${delta.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f2e4ce', borderTop: '2px solid #d1d5db' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#3F2E1E' }}>Total</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#3F2E1E', textAlign: 'right' }}>
                    ₱{(analyticsData.monthlyDonations || []).reduce((sum, m) => sum + (m.total || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#3F2E1E', textAlign: 'right' }}>
                    {(analyticsData.monthlyDonations || []).reduce((sum, m) => sum + (m.count || 0), 0)}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#3F2E1E', textAlign: 'right' }}>
                    {(() => {
                      const total = (analyticsData.monthlyDonations || []).reduce((sum, m) => sum + (m.total || 0), 0);
                      const count = (analyticsData.monthlyDonations || []).reduce((sum, m) => sum + (m.count || 0), 0);
                      return count > 0 ? `₱${Math.round(total / count).toLocaleString()}` : '-';
                    })()}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#3F2E1E', textAlign: 'right' }}>-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !showAnalytics && !showDonationPictureManagement && !showPurposeManagement) {
    return <div className="loading-users" style={{ textAlign: 'left' }}>Loading donation verification...</div>;
  }

  return (
    <div className="staff-main-content">
      {/* Add Monthly Donation Modal */}
      {showMonthlyDonationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowMonthlyDonationModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#806c4b' }}>&times;</button>
            <h2 style={{ color: '#3F2E1E', marginBottom: 24 }}>Add Monthly Donation</h2>
            <form onSubmit={handleAddMonthlyDonation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#3F2E1E', fontWeight: 500 }}>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={monthlyDonationForm.amount}
                  onChange={(e) => setMonthlyDonationForm({ ...monthlyDonationForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #f2e4ce', borderRadius: 8 }}
                  placeholder="Enter amount"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#3F2E1E', fontWeight: 500 }}>Month *</label>
                  <select
                    value={monthlyDonationForm.month}
                    onChange={(e) => setMonthlyDonationForm({ ...monthlyDonationForm, month: parseInt(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #f2e4ce', borderRadius: 8 }}
                  >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#3F2E1E', fontWeight: 500 }}>Year *</label>
                  <select
                    value={monthlyDonationForm.year}
                    onChange={(e) => setMonthlyDonationForm({ ...monthlyDonationForm, year: parseInt(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #f2e4ce', borderRadius: 8 }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#3F2E1E', fontWeight: 500 }}>Purpose (Optional)</label>
                <select
                  value={monthlyDonationForm.purpose_id}
                  onChange={(e) => setMonthlyDonationForm({ ...monthlyDonationForm, purpose_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #f2e4ce', borderRadius: 8 }}
                >
                  <option value="">Select purpose</option>
                  {donationPurposes.map(purpose => (
                    <option key={purpose.id} value={purpose.id}>{purpose.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowMonthlyDonationModal(false)}
                  disabled={addingMonthlyDonation}
                  style={{ flex: 1, padding: '12px', border: '1px solid #f2e4ce', borderRadius: 8, background: '#fff', color: '#3F2E1E', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMonthlyDonation}
                  style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: '#806c4b', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  {addingMonthlyDonation ? 'Adding...' : 'Add Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donor Details Modal */}
      {showDonorModal && selectedDonor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: '95%', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowDonorModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#806c4b' }}>&times;</button>
            <h2 style={{ color: '#3F2E1E', marginBottom: 16 }}>Donor Details</h2>
            <div style={{ marginBottom: 8 }}><strong>Name:</strong> {selectedDonor.name}</div>
            <div style={{ marginBottom: 8 }}><strong>Email:</strong> {selectedDonor.email}</div>
            <div style={{ marginBottom: 8 }}><strong>Amount:</strong> ₱{Number(selectedDonor.amount).toLocaleString()}</div>
            <div style={{ marginBottom: 8 }}><strong>Reference:</strong> {selectedDonor.reference}</div>
            <div style={{ marginBottom: 8 }}><strong>Status:</strong> {selectedDonor.rejection_reason ? 'Rejected' : selectedDonor.verified ? 'Verified' : 'Pending'}</div>
            {selectedDonor.purpose && <div style={{ marginBottom: 8 }}><strong>Purpose:</strong> {selectedDonor.purpose}</div>}
            {selectedDonor.receipt_path && (() => {
              const id = selectedDonor._id || selectedDonor.id;
              // Use API endpoint for reliable access to receipt images
              const receiptUrl = id ? `${window.location.origin}/api/donations/${id}/receipt` : null;
              
              if (!receiptUrl) {
                return null;
              }
              
              // Check if it's a PDF based on receipt_path
              const isPdf = /\.pdf$/i.test(selectedDonor.receipt_path);
              
              return (
                <div style={{ marginBottom: 8 }}>
                  <strong>Receipt:</strong> {isPdf ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#806c4b', textDecoration: 'underline' }}>View PDF</a>
                  ) : (
                    <img 
                      src={receiptUrl} 
                      alt="Receipt" 
                      style={{ 
                        width: 120, 
                        height: 120, 
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #f2e4ce',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        display: 'block',
                        marginTop: 8
                      }}
                      onError={(e) => {
                        console.log('Modal image failed to load:', receiptUrl);
                        e.target.style.display = 'none';
                        const fallback = document.createElement('span');
                        fallback.textContent = 'Image Error';
                        fallback.style.cssText = 'color: #ef4444; font-size: 0.875rem; padding: 8px; border: 1px solid #fecaca; border-radius: 6px; background: #fef2f2; margin-top: 8px;';
                        e.target.parentNode.appendChild(fallback);
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(receiptUrl, '_blank', 'noopener,noreferrer');
                      }}
                    />
                  )}
                </div>
              );
            })()}
            {selectedDonor.rejection_reason && (
              <div style={{ color: '#ef4444', marginTop: 8 }}><strong>Rejection Reason:</strong> {selectedDonor.rejection_reason}</div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .requests-table tbody tr {
          border-bottom: 1px solid #f2e4ce;
          transition: background 0.15s;
        }
        .requests-table tbody td {
          border-bottom: none;
        }
        .requests-table tbody tr:hover {
          background: #f9f6f1;
        }
        
        .loading-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2px;
          width: 18px;
          height: 18px;
        }
        
        .loading-dots .dot {
          width: 3px;
          height: 3px;
          background-color: white;
          border-radius: 50%;
          animation: pulse 1.4s ease-in-out infinite both;
        }
        
        .loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots .dot:nth-child(3) { animation-delay: 0s; }
        
        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .status-rejected {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Enhanced Responsive Styles */
        .staff-main-content {
          padding: 1rem;
          max-width: 100%;
          overflow-x: hidden;
        }

        .recent-activities {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 2rem;
          min-height: 300px;
          border: 1px solid #f2e4ce;
          overflow: hidden;
        }

        .header-controls {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-controls h2 {
          color: #3F2E1E;
          font-weight: 700;
          font-size: 1.75rem;
          margin: 0;
          flex-shrink: 0;
        }

        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .filter-buttons button,
        .filter-buttons select {
          background: #f9f5ef;
          border: 1px solid #e0d8cc;
          color: #5C4B38;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .filter-buttons button:hover {
          background: #f2e4ce;
        }

        .filter-buttons button.active {
          background: #806c4b;
          color: #fff;
          border-color: #806c4b;
          font-weight: 600;
        }

        /* Responsive table container */
        .requests-table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
          border: 1px solid #f2e4ce;
          background: #fff;
        }

        .requests-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 800px; /* Ensure minimum width for proper layout */
        }

        .requests-table th,
        .requests-table td {
          padding: 1rem;
          border-bottom: 1px solid #f2e4ce;
          vertical-align: middle;
        }

        .requests-table th {
          color: #3F2E1E;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background-color: #fcf9f4;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-buttons button {
          border: none;
          border-radius: 6px;
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px; /* Minimum touch target size */
          min-height: 44px;
        }

        .btn-approve {
          background-color: #28a745;
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          background-color: #218838;
        }

        .btn-reject {
          background-color: #dc3545;
          color: white;
        }

        .btn-reject:hover:not(:disabled) {
          background-color: #c82333;
        }

        /* Mobile-first responsive design */
        @media (max-width: 1200px) {
          .staff-main-content {
            padding: 1rem 0.5rem;
          }
          
          .recent-activities {
            padding: 1.5rem;
          }
          
          .header-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-controls h2 {
            font-size: 1.5rem;
            text-align: center;
            margin-bottom: 1rem;
          }
          
          .filter-buttons {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .staff-main-content {
            padding: 0.5rem;
          }
          
          .recent-activities {
            padding: 1rem;
            border-radius: 12px;
          }
          
          .header-controls h2 {
            font-size: 1.25rem;
          }
          
          .filter-buttons button,
          .filter-buttons select {
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
          }
          
          .requests-table {
            font-size: 0.875rem;
            min-width: 700px;
          }
          
          .requests-table th,
          .requests-table td {
            padding: 0.75rem 0.5rem;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.25rem;
            align-items: stretch;
          }
          
          .action-buttons button {
            font-size: 0.75rem;
            padding: 0.5rem;
            min-width: auto;
            min-height: 36px;
          }
        }

        @media (max-width: 640px) {
          .staff-main-content {
            padding: 0.25rem;
          }
          
          .recent-activities {
            padding: 0.75rem;
            border-radius: 8px;
          }
          
          .header-controls h2 {
            font-size: 1.125rem;
          }
          
          .filter-buttons {
            gap: 0.25rem;
          }
          
          .filter-buttons button,
          .filter-buttons select {
            font-size: 0.7rem;
            padding: 0.3rem 0.6rem;
          }
          
          /* Hide less critical columns on very small screens */
          .requests-table th:nth-child(4),
          .requests-table td:nth-child(4) {
            display: none; /* Hide Reference column */
          }
          
          .requests-table {
            min-width: 600px;
            font-size: 0.8rem;
          }
          
          .requests-table th,
          .requests-table td {
            padding: 0.5rem 0.25rem;
          }
          
          /* Responsive modal */
          .reject-modal {
            width: 95% !important;
            max-width: 95% !important;
            margin: 10px;
            padding: 1rem !important;
          }
          
          .reject-modal h3 {
            font-size: 1.125rem;
          }
          
          .reject-modal textarea {
            min-height: 80px;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 480px) {
          .header-controls h2 {
            font-size: 1rem;
          }
          
          .filter-buttons button,
          .filter-buttons select {
            font-size: 0.65rem;
            padding: 0.25rem 0.5rem;
          }
          
          /* Hide additional columns on extra small screens */
          .requests-table th:nth-child(5),
          .requests-table td:nth-child(5) {
            display: none; /* Hide Receipt column */
          }
          
          .requests-table {
            min-width: 400px;
            font-size: 0.75rem;
          }
          
          .requests-table th,
          .requests-table td {
            padding: 0.4rem 0.2rem;
          }
          
          .action-buttons button {
            font-size: 0.65rem;
            padding: 0.4rem;
            min-height: 32px;
          }
        }

        /* Landscape orientation adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .recent-activities {
            padding: 1rem;
          }
          
          .header-controls {
            margin-bottom: 1rem;
          }
          
          .header-controls h2 {
            font-size: 1.25rem;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .requests-table {
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .requests-table th,
          .requests-table td {
            border-bottom: 0.5px solid #f2e4ce;
          }
        }

        /* Dark mode support (if needed in future) */
        @media (prefers-color-scheme: dark) {
          /* Dark mode styles can be added here if needed */
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .requests-table tbody tr,
          .filter-buttons button,
          .action-buttons button {
            transition: none;
          }
          
          .loading-dots .dot {
            animation: none;
          }
        }

        /* Receipt Image Styles */
        .receipt-image {
          transition: all 0.2s ease;
          border: 1px solid #f2e4ce;
          border-radius: 6px;
          cursor: pointer;
        }

        .receipt-image:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(205, 139, 62, 0.2);
        }

        /* Print styles */
        @media print {
          .filter-buttons,
          .action-buttons {
            display: none;
          }
          
          .requests-table {
            font-size: 0.8rem;
          }
          
          .staff-main-content {
            padding: 0;
          }
        }

        /* Purpose Management Styles */
        .purpose-management-container {
          width: 100%;
          max-width: 100%;
        }

        .purpose-management-content {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .purpose-management-title {
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 2rem;
          color: #3F2E1E;
          font-weight: 700;
        }

        .purpose-form {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: stretch;
        }

        .purpose-input {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1.5px solid #f2e4ce;
          font-size: 1rem;
          background: #FFF6E5;
          color: #3F2E1E;
          transition: border-color 0.2s;
        }

        .purpose-input:focus {
          outline: none;
          border-color: #806c4b;
        }

        .purpose-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .purpose-add-btn {
          background: #806c4b;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2rem;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .purpose-add-btn:hover:not(:disabled) {
          background: #6b5a3f;
        }

        .purpose-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .purpose-error {
          color: #dc3545;
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
        }

        .purpose-loading {
          text-align: center;
          padding: 2rem;
          color: #5C4B38;
          font-size: 1.1rem;
        }

        .purpose-table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
          border: 1px solid #f2e4ce;
          background: #fff;
        }

        .purpose-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .purpose-table th {
          background: #FFF6E5;
          color: #3F2E1E;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #f2e4ce;
        }

        .purpose-table th:nth-child(2) {
          text-align: center;
        }

        .purpose-table th:nth-child(3) {
          text-align: right;
        }

        .purpose-table td {
          padding: 1rem;
          border-bottom: 1px solid #f2e4ce;
          vertical-align: middle;
        }

        .purpose-name {
          font-weight: 500;
          color: #3F2E1E;
        }

        .purpose-status {
          text-align: center;
        }

        .status-enabled {
          background: #22c55e;
          color: white;
        }

        .status-disabled {
          background: #ef4444;
          color: white;
        }

        .purpose-actions {
          text-align: right;
        }

        .purpose-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .purpose-btn {
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
          min-width: 80px;
        }

        .btn-enable {
          background: #10b981;
          color: white;
        }

        .btn-enable:hover:not(:disabled) {
          background: #059669;
        }

        .btn-disable {
          background: #f59e0b;
          color: white;
        }

        .btn-disable:hover:not(:disabled) {
          background: #d97706;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
        }

        .btn-delete:hover:not(:disabled) {
          background: #dc2626;
        }

        .purpose-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Purpose Management Responsive Styles */
        @media (max-width: 1200px) {
          .purpose-management-content {
            padding: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .purpose-management-content {
            padding: 1rem;
          }

          .purpose-management-title {
            font-size: 1.5rem;
          }

          .purpose-form {
            flex-direction: column;
            gap: 0.75rem;
          }

          .purpose-input {
            font-size: 0.9rem;
            padding: 0.6rem;
          }

          .purpose-add-btn {
            font-size: 0.9rem;
            padding: 0.6rem 1.5rem;
          }

          .purpose-table {
            min-width: 500px;
            font-size: 0.875rem;
          }

          .purpose-table th,
          .purpose-table td {
            padding: 0.75rem 0.5rem;
          }

          .purpose-actions {
            flex-direction: column;
            gap: 0.25rem;
            align-items: stretch;
          }

          .purpose-btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
            min-width: auto;
          }
        }

        @media (max-width: 640px) {
          .purpose-management-content {
            padding: 0.75rem;
          }

          .purpose-management-title {
            font-size: 1.25rem;
          }

          .purpose-table {
            min-width: 400px;
            font-size: 0.8rem;
          }

          .purpose-table th,
          .purpose-table td {
            padding: 0.5rem 0.25rem;
          }

          .purpose-btn {
            font-size: 0.7rem;
            padding: 0.35rem 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .purpose-management-content {
            padding: 0.5rem;
          }

          .purpose-management-title {
            font-size: 1.125rem;
          }

          .purpose-input {
            font-size: 0.85rem;
            padding: 0.5rem;
          }

          .purpose-add-btn {
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
          }

          /* Hide status column on very small screens */
          .purpose-table th:nth-child(2),
          .purpose-table td:nth-child(2) {
            display: none;
          }

          .purpose-table {
            min-width: 300px;
            font-size: 0.75rem;
          }

          .purpose-table th,
          .purpose-table td {
            padding: 0.4rem 0.2rem;
          }
        }
      `}</style>


      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="reject-modal" style={{ width: 560, maxWidth: '94%', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#3F2E1E' }}>Reject Donation</h3>
            <p style={{ color: '#5C4B38' }}>Provide a reason for rejecting this donation. The donor will receive an email with this message.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 8, border: '1px solid #f2e4ce', marginTop: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowRejectModal(false); setRejectingId(null); setRejectReason(''); }} style={{ background: '#fff', border: '1px solid #d1d5db', padding: '8px 14px', borderRadius: 8 }}>Cancel</button>
              <button 
                onClick={handleRejectConfirm} 
                disabled={isRejectingDonation || !rejectReason.trim()} 
                style={{ 
                  background: isRejectingDonation ? '#ef4444aa' : '#ef4444', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isRejectingDonation ? 'not-allowed' : 'pointer'
                }}
              >
                {isRejectingDonation ? (
                  <>
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    Sending...
                  </>
                ) : (
                  'Send Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        /* Bar chart animations */
        @keyframes barGrowUp {
          0% {
            transform: scaleY(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        /* Bar chart styles */
        .main-bar-graph {
          position: relative;
          background: white;
          border-radius: 8px;
          padding: 1rem;
        }

        .main-bar-graph .bar-container {
          overflow: hidden;
          position: relative;
          border-left: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .main-bar-graph .bar-element {
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .main-bar-graph .bar-element:hover {
          transform: translateY(-4px);
        }

        .main-bar-graph .bar-element:hover .group-hover\\:opacity-100 {
          opacity: 1;
        }

        .main-bar-graph .bar-animate-delayed {
          position: relative;
          transition: height 0.5s ease;
        }

        @media (max-width: 768px) {
          .main-bar-graph .bar-element:hover {
            transform: translateY(-2px);
          }
        }
      `}</style>
      <div className="recent-activities">
        {showPurposeManagement ? (
          <div style={{ padding: '1.5rem', maxWidth: '100%', overflowX: 'hidden' }}>
            <button
              onClick={() => setShowPurposeManagement(false)}
              style={{
                position: 'relative',
                left: 0,
                marginBottom: 16,
                background: '#fff',
                color: '#806c4b',
                border: '2px solid #806c4b',
                borderRadius: 8,
                padding: '8px 24px',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(128,108,75,0.06)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                display: 'inline-block',
              }}
              onMouseOver={e => { e.target.style.background = '#806c4b'; e.target.style.color = '#fff'; }}
              onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#806c4b'; }}
            >
              ← Back to Donations
            </button>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#3F2E1E', 
                marginBottom: '0.5rem' 
              }}>
                Manage Donation Purposes
              </h1>
            </div>

            <form onSubmit={handleAddDonationPurpose} style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              alignItems: 'stretch'
            }}>
              <input
                type="text"
                value={newPurpose}
                onChange={e => setNewPurpose(e.target.value)}
                placeholder="Add new donation purpose"
                disabled={addPurposeLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #e2cfa3',
                  fontSize: '1rem',
                  background: '#fff',
                  color: '#3F2E1E',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#806c4b';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2cfa3';
                }}
              />
              <button
                type="submit"
                disabled={addPurposeLoading || !newPurpose.trim()}
                style={{
                  background: addPurposeLoading || !newPurpose.trim() ? '#94a3b8' : '#806c4b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: addPurposeLoading || !newPurpose.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                  opacity: addPurposeLoading || !newPurpose.trim() ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!addPurposeLoading && newPurpose.trim()) {
                    e.target.style.background = '#6b5a3f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addPurposeLoading && newPurpose.trim()) {
                    e.target.style.background = '#806c4b';
                  }
                }}
              >
                {addPurposeLoading ? 'Adding...' : 'Add'}
              </button>
            </form>

            {donationPurposesError && (
              <div style={{
                color: '#dc3545',
                textAlign: 'center',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px'
              }}>
                {donationPurposesError}
              </div>
            )}

            {donationPurposesLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#5C4B38',
                fontSize: '1.1rem'
              }}>
                Loading purposes...
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f2e4ce',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '600px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          background: '#FFF6E5',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#3F2E1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #f2e4ce'
                        }}>
                          Purpose Name
                        </th>
                        <th style={{
                          background: '#FFF6E5',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#3F2E1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #f2e4ce'
                        }}>
                          Goal & Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {donationPurposes.length === 0 ? (
                        <tr>
                          <td colSpan="2" style={{ 
                            textAlign: 'center', 
                            padding: '2rem', 
                            color: '#8B7355' 
                          }}>
                            No donation purposes found
                          </td>
                        </tr>
                      ) : (
                        donationPurposes.map(purpose => (
                          <tr key={purpose.id} style={{
                            borderBottom: '1px solid #f2e4ce',
                            transition: 'background 0.15s',
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9f6f1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          >
                            <td style={{
                              padding: '1rem 1.5rem',
                              fontWeight: 500,
                              color: '#3F2E1E',
                              verticalAlign: 'middle'
                            }}>
                              {purpose.name}
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              textAlign: 'center',
                              verticalAlign: 'middle'
                            }}>
                              {editingGoal === purpose.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editGoalAmount}
                                    onChange={(e) => setEditGoalAmount(e.target.value)}
                                    placeholder="Goal amount (₱)"
                                    style={{
                                      width: '100%',
                                      maxWidth: '200px',
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      border: '1.5px solid #e2cfa3',
                                      fontSize: '0.875rem',
                                      textAlign: 'center'
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleUpdateGoal(purpose.id)}
                                      disabled={purposeSaving}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        cursor: purposeSaving ? 'not-allowed' : 'pointer',
                                        opacity: purposeSaving ? 0.6 : 1
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditGoal}
                                      disabled={purposeSaving}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#f59e0b',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        cursor: purposeSaving ? 'not-allowed' : 'pointer',
                                        opacity: purposeSaving ? 0.6 : 1
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                  {purpose.goal_amount && purpose.goal_amount > 0 ? (
                                    <>
                                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3F2E1E' }}>
                                        Goal: ₱{parseFloat(purpose.goal_amount).toLocaleString()}
                                      </div>
                                      {purpose.total_donations !== undefined && (
                                        <>
                                          <div style={{ fontSize: '0.75rem', color: '#5C4B38' }}>
                                            Raised: ₱{parseFloat(purpose.total_donations || 0).toLocaleString()}
                                          </div>
                                          <div style={{ 
                                            width: '100%', 
                                            maxWidth: '200px', 
                                            height: '8px', 
                                            background: '#e5e7eb', 
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                          }}>
                                            <div style={{
                                              width: `${Math.min(100, purpose.progress_percentage || 0)}%`,
                                              height: '100%',
                                              background: purpose.goal_reached ? '#10b981' : '#3b82f6',
                                              transition: 'width 0.3s ease'
                                            }} />
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: purpose.goal_reached ? '#10b981' : '#5C4B38', fontWeight: 600 }}>
                                            {purpose.progress_percentage ? `${purpose.progress_percentage}%` : '0%'}
                                            {purpose.goal_reached && ' ✓ Goal Reached!'}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                      No goal set
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleEditGoal(purpose)}
                                    disabled={purposeSaving}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '4px',
                                      border: '1px solid #806c4b',
                                      background: 'transparent',
                                      color: '#806c4b',
                                      fontSize: '0.75rem',
                                      cursor: purposeSaving ? 'not-allowed' : 'pointer',
                                      opacity: purposeSaving ? 0.6 : 1
                                    }}
                                  >
                                    {purpose.goal_amount && purpose.goal_amount > 0 ? 'Edit Goal' : 'Set Goal'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : showDonationPictureManagement ? (
          <div style={{ padding: '1.5rem', maxWidth: '100%', overflowX: 'hidden' }}>
            <button
              onClick={() => setShowDonationPictureManagement(false)}
              style={{
                position: 'relative',
                left: 0,
                marginBottom: 16,
                background: '#fff',
                color: '#806c4b',
                border: '2px solid #806c4b',
                borderRadius: 8,
                padding: '8px 24px',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(128,108,75,0.06)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                display: 'inline-block',
              }}
              onMouseOver={e => { e.target.style.background = '#806c4b'; e.target.style.color = '#fff'; }}
              onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#806c4b'; }}
            >
              ← Back to Donations
            </button>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#3F2E1E', 
                marginBottom: '0.5rem' 
              }}>
                Manage Donation Pictures & Accounts
              </h1>
            </div>
                
            {/* Upload Form Section */}
            <form onSubmit={handleImageUpload} style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              alignItems: 'stretch'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploadingImage}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #e2cfa3',
                  fontSize: '1rem',
                  background: '#fff',
                  color: '#3F2E1E',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#806c4b';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2cfa3';
                }}
              />
              <button
                type="submit"
                disabled={uploadingImage || !selectedFile}
                style={{
                  background: uploadingImage || !selectedFile ? '#94a3b8' : '#806c4b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: uploadingImage || !selectedFile ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                  opacity: uploadingImage || !selectedFile ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploadingImage && selectedFile) {
                    e.target.style.background = '#6b5a3f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploadingImage && selectedFile) {
                    e.target.style.background = '#806c4b';
                  }
                }}
              >
                {uploadingImage ? 'Uploading...' : 'Add'}
              </button>
            </form>
            
            {selectedFile && (
              <div style={{ 
                marginTop: '10px', 
                marginBottom: '1rem',
                padding: '8px 12px', 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #0ea5e9', 
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0369a1'
              }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            
            {donationPicturesError && (
              <div style={{
                color: '#dc3545',
                textAlign: 'center',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px'
              }}>
                {donationPicturesError}
              </div>
            )}
            
            {donationPicturesLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#5C4B38',
                fontSize: '1.1rem'
              }}>
                Loading images...
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f2e4ce',
                overflow: 'hidden',
                marginBottom: '2rem'
              }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '600px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          background: '#FFF6E5',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#3F2E1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #f2e4ce'
                        }}>
                          Image Preview
                        </th>
                        <th style={{
                          background: '#FFF6E5',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#3F2E1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #f2e4ce'
                        }}>
                          Status
                        </th>
                        <th style={{
                          background: '#FFF6E5',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#3F2E1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #f2e4ce'
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {donationPictures.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ 
                            textAlign: 'center', 
                            padding: '2rem', 
                            color: '#8B7355' 
                          }}>
                            No images uploaded yet.
                          </td>
                        </tr>
                      ) : (
                        donationPictures.map((image) => (
                          <tr key={image.id} style={{
                            borderBottom: '1px solid #f2e4ce',
                            transition: 'background 0.15s',
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9f6f1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          >
                            <td style={{
                              padding: '1rem 1.5rem',
                              verticalAlign: 'middle'
                            }}>
                              <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                border: '2px solid #f2e4ce', 
                                borderRadius: '8px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#faf9f7',
                                position: 'relative'
                              }}>
                                {!image.image_path || image.file_exists === false ? (
                                  <div style={{ 
                                    color: '#5C4B38', 
                                    fontSize: '12px', 
                                    textAlign: 'center', 
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%'
                                  }}>
                                    Image file not found
                                  </div>
                                ) : (
                                  <>
                                    <img 
                                      src={(() => {
                                        if (!image.image_path) {
                                          console.warn('Donation picture has no image_path:', image);
                                          return '';
                                        }
                                        
                                        // If it's already a full URL (http/https), use it as is
                                        if (image.image_path.startsWith('http://') || image.image_path.startsWith('https://')) {
                                          console.log('Using full URL for donation picture:', image.image_path);
                                          return image.image_path;
                                        }
                                        
                                        // If it starts with /, it's a relative path - prepend origin
                                        if (image.image_path.startsWith('/')) {
                                          const fullUrl = `${window.location.origin}${image.image_path}`;
                                          console.log('Constructed URL for donation picture:', fullUrl, 'from path:', image.image_path);
                                          return fullUrl;
                                        }
                                        
                                        // Otherwise, prepend / and origin
                                        const fullUrl = `${window.location.origin}/${image.image_path}`;
                                        console.log('Constructed URL for donation picture (no leading slash):', fullUrl, 'from path:', image.image_path);
                                        return fullUrl;
                                      })()}
                                      alt={`Donation Image ${image.id}`}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        display: 'block'
                                      }}
                                      onError={(e) => {
                                        // Log error for debugging
                                        console.error('Failed to load donation picture:', {
                                          id: image.id,
                                          image_path: image.image_path,
                                          src: e.target.src,
                                          file_exists: image.file_exists
                                        });
                                        
                                        // Hide the image and show error message
                                        const img = e.target;
                                        img.style.display = 'none';
                                        
                                        // Check if error message already exists
                                        const parent = img.parentNode;
                                        if (parent && !parent.querySelector('.image-error-message')) {
                                          const errorDiv = document.createElement('div');
                                          errorDiv.className = 'image-error-message';
                                          errorDiv.style.cssText = 'color: #5C4B38; font-size: 12px; text-align: center; padding: 0.5rem; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;';
                                          errorDiv.textContent = 'Image not accessible';
                                          parent.appendChild(errorDiv);
                                        }
                                      }}
                                      onLoad={(e) => {
                                        // Log success
                                        console.log('Successfully loaded donation picture:', {
                                          id: image.id,
                                          src: e.target.src
                                        });
                                        
                                        // Ensure image is visible on successful load
                                        e.target.style.display = 'block';
                                        const errorMsg = e.target.parentNode?.querySelector('.image-error-message');
                                        if (errorMsg) {
                                          errorMsg.remove();
                                        }
                                      }}
                                      onClick={() => {
                                        if (image.image_path) {
                                          let imageUrl;
                                          if (image.image_path.startsWith('http://') || image.image_path.startsWith('https://')) {
                                            imageUrl = image.image_path;
                                          } else if (image.image_path.startsWith('/')) {
                                            imageUrl = `${window.location.origin}${image.image_path}`;
                                          } else {
                                            imageUrl = `${window.location.origin}/${image.image_path}`;
                                          }
                                          window.open(imageUrl, '_blank');
                                        }
                                      }}
                                      title="Click to view full size"
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              textAlign: 'center',
                              verticalAlign: 'middle'
                            }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: image.enabled ? '#dcfce7' : '#fee2e2',
                                color: image.enabled ? '#166534' : '#991b1b'
                              }}>
                                {image.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              textAlign: 'right',
                              verticalAlign: 'middle'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.5rem',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={() => showConfirmation('toggleImage', { id: image.id, enabled: image.enabled })}
                                  disabled={uploadingImage}
                                  style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.5rem 1rem',
                                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    minWidth: '80px',
                                    background: image.enabled ? '#f59e0b' : '#10b981',
                                    color: 'white',
                                    opacity: uploadingImage ? 0.6 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!uploadingImage) {
                                      e.target.style.background = image.enabled ? '#d97706' : '#059669';
                                      e.target.style.transform = 'translateY(-1px)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!uploadingImage) {
                                      e.target.style.background = image.enabled ? '#f59e0b' : '#10b981';
                                      e.target.style.transform = 'translateY(0)';
                                    }
                                  }}
                                >
                                  {image.enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => showConfirmation('deleteImage', { id: image.id })}
                                  disabled={uploadingImage}
                                  style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.5rem 1rem',
                                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    minWidth: '80px',
                                    background: '#ef4444',
                                    color: 'white',
                                    opacity: uploadingImage ? 0.6 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!uploadingImage) {
                                      e.target.style.background = '#dc2626';
                                      e.target.style.transform = 'translateY(-1px)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!uploadingImage) {
                                      e.target.style.background = '#ef4444';
                                      e.target.style.transform = 'translateY(0)';
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
                
            {/* GCash Account Management Section */}
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ 
                color: '#3F2E1E', 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                marginBottom: '1.5rem' 
              }}>
                Account Details
              </h2>
              
              {/* Add New Account Form */}
              <form onSubmit={handleAddGcashAccount} style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#3F2E1E', 
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={e => setNewAccountName(e.target.value)}
                    placeholder="Enter account name"
                    disabled={addingAccount}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #e2cfa3',
                      fontSize: '1rem',
                      background: '#fff',
                      color: '#3F2E1E',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#806c4b';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2cfa3';
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#3F2E1E', 
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={newAccountNumber}
                    onChange={e => setNewAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    disabled={addingAccount}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #e2cfa3',
                      fontSize: '1rem',
                      background: '#fff',
                      color: '#3F2E1E',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#806c4b';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2cfa3';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingAccount || !newAccountName.trim() || !newAccountNumber.trim()}
                  style={{
                    background: addingAccount || !newAccountName.trim() || !newAccountNumber.trim() ? '#94a3b8' : '#806c4b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 2rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: addingAccount || !newAccountName.trim() || !newAccountNumber.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                    opacity: addingAccount || !newAccountName.trim() || !newAccountNumber.trim() ? 0.6 : 1,
                    height: 'fit-content',
                    marginTop: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!addingAccount && newAccountName.trim() && newAccountNumber.trim()) {
                      e.target.style.background = '#6b5a3f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!addingAccount && newAccountName.trim() && newAccountNumber.trim()) {
                      e.target.style.background = '#806c4b';
                    }
                  }}
                >
                  {addingAccount ? 'Adding...' : 'Add Account'}
                </button>
              </form>
              
              {gcashAccountsError && (
                <div style={{
                  color: '#dc3545',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px'
                }}>
                  {gcashAccountsError}
                </div>
              )}
              
              {/* GCash Accounts Table */}
              {gcashAccountsLoading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#5C4B38',
                  fontSize: '1.1rem'
                }}>
                  Loading accounts...
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #f2e4ce',
                  overflow: 'hidden'
                }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: '600px'
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            background: '#FFF6E5',
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#3F2E1E',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #f2e4ce'
                          }}>
                            Account Name
                          </th>
                          <th style={{
                            background: '#FFF6E5',
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#3F2E1E',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #f2e4ce'
                          }}>
                            Account Number
                          </th>
                          <th style={{
                            background: '#FFF6E5',
                            padding: '0.75rem 1.5rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#3F2E1E',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #f2e4ce'
                          }}>
                            Status
                          </th>
                          <th style={{
                            background: '#FFF6E5',
                            padding: '0.75rem 1.5rem',
                            textAlign: 'right',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#3F2E1E',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #f2e4ce'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gcashAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ 
                              textAlign: 'center', 
                              padding: '2rem', 
                              color: '#8B7355' 
                            }}>
                              No accounts added yet.
                            </td>
                          </tr>
                        ) : (
                          gcashAccounts.map((account) => (
                            <tr key={account.id} style={{
                              borderBottom: '1px solid #f2e4ce',
                              transition: 'background 0.15s',
                              cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f9f6f1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            >
                              <td style={{
                                padding: '1rem 1.5rem',
                                fontWeight: 500,
                                color: '#3F2E1E',
                                verticalAlign: 'middle'
                              }}>
                                {editingAccount && editingAccount.id === account.id ? (
                                  <input
                                    type="text"
                                    value={editAccountName}
                                    onChange={e => setEditAccountName(e.target.value)}
                                    style={{ 
                                      width: '100%', 
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      border: '1.5px solid #e2cfa3',
                                      fontSize: '0.875rem',
                                      outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#806c4b';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#e2cfa3';
                                    }}
                                  />
                                ) : (
                                  account.account_name
                                )}
                              </td>
                              <td style={{
                                padding: '1rem 1.5rem',
                                fontWeight: 500,
                                color: '#3F2E1E',
                                verticalAlign: 'middle'
                              }}>
                                {editingAccount && editingAccount.id === account.id ? (
                                  <input
                                    type="text"
                                    value={editAccountNumber}
                                    onChange={e => setEditAccountNumber(e.target.value)}
                                    style={{ 
                                      width: '100%', 
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      border: '1.5px solid #e2cfa3',
                                      fontSize: '0.875rem',
                                      outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#806c4b';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#e2cfa3';
                                    }}
                                  />
                                ) : (
                                  account.account_number
                                )}
                              </td>
                              <td style={{
                                padding: '1rem 1.5rem',
                                textAlign: 'center',
                                verticalAlign: 'middle'
                              }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: account.enabled ? '#dcfce7' : '#fee2e2',
                                  color: account.enabled ? '#166534' : '#991b1b'
                                }}>
                                  {account.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td style={{
                                padding: '1rem 1.5rem',
                                textAlign: 'right',
                                verticalAlign: 'middle'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap'
                                }}>
                                  {editingAccount && editingAccount.id === account.id ? (
                                    <>
                                      <button
                                        onClick={handleUpdateGcashAccount}
                                        style={{
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '0.5rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          transition: 'all 0.2s',
                                          minWidth: '80px',
                                          background: '#10b981',
                                          color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#059669';
                                          e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#10b981';
                                          e.target.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingAccount(null);
                                          setEditAccountName('');
                                          setEditAccountNumber('');
                                        }}
                                        style={{
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '0.5rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          transition: 'all 0.2s',
                                          minWidth: '80px',
                                          background: '#f59e0b',
                                          color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#d97706';
                                          e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#f59e0b';
                                          e.target.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditGcashAccount(account)}
                                        style={{
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '0.5rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          transition: 'all 0.2s',
                                          minWidth: '80px',
                                          background: '#10b981',
                                          color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#059669';
                                          e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#10b981';
                                          e.target.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => showConfirmation('toggleAccount', { id: account.id, enabled: account.enabled })}
                                        style={{
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '0.5rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          transition: 'all 0.2s',
                                          minWidth: '80px',
                                          background: account.enabled ? '#f59e0b' : '#10b981',
                                          color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = account.enabled ? '#d97706' : '#059669';
                                          e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = account.enabled ? '#f59e0b' : '#10b981';
                                          e.target.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        {account.enabled ? 'Disable' : 'Enable'}
                                      </button>
                                      <button
                                        onClick={() => showConfirmation('deleteAccount', { id: account.id })}
                                        style={{
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '0.5rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          transition: 'all 0.2s',
                                          minWidth: '80px',
                                          background: '#ef4444',
                                          color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#dc2626';
                                          e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#ef4444';
                                          e.target.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="header-controls">
              <h2>Donation Verification</h2>
              <div className="filter-buttons">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={showAnalytics ? 'active' : ''}
                  style={{
                    background: showAnalytics ? '#806c4b' : '#f9f5ef',
                    color: showAnalytics ? '#fff' : '#5C4B38',
                    marginRight: '12px'
                  }}
                >
                  {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
                </button>
                <button
                  onClick={() => setShowPurposeManagement(true)}
                  className="filter-button"
                  style={{ marginRight: '12px' }}
                >
                  Manage Donation Purposes
                </button>
                <button
                  onClick={() => setShowDonationPictureManagement(true)}
                  className="filter-button"
                  style={{ marginRight: '12px' }}
                >
                  Manage Donation Details
                </button>
                { !showAnalytics && (
                  <>
                    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
                    <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>Pending</button>
                    <button onClick={() => setFilter('verified')} className={filter === 'verified' ? 'active' : ''}>Verified</button>
                    <button onClick={() => setFilter('rejected')} className={filter === 'rejected' ? 'active' : ''}>Rejected</button>
                  </>
                )}
              </div>
            </div>

            {showAnalytics ? (
              <AnalyticsDashboard />
            ) : loading ? (
              <p>Loading donations...</p>
            ) : (
              <div className="requests-table-container">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Receipt</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // First filter by status
                      let filteredDonations = filter === 'all' 
                        ? donations 
                        : filter === 'pending' 
                          ? donations.filter(d => !d.verified && !d.rejection_reason)
                          : filter === 'verified'
                            ? donations.filter(d => d.verified)
                            : filter === 'rejected'
                              ? donations.filter(d => d.rejection_reason)
                              : donations;
                      
                      // Then exclude physical donations
                      filteredDonations = filteredDonations.filter(d => !isPhysicalDonation(d));
                      
                      const lastPage = Math.max(1, Math.ceil(filteredDonations.length / pageSize));
                      const pageClamped = Math.max(1, Math.min(page, lastPage));
                      const paginated = filteredDonations.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

                      return filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="no-requests">No donations found.</td>
                        </tr>
                      ) : paginated.map(donation => (
                      <tr key={donation.id || donation._id}>
                        <td>{donation.email}</td>
                        <td>
                          <span style={{ cursor: 'pointer', color: '#806c4b', textDecoration: 'underline' }}
                            onClick={() => { setSelectedDonor(donation); setShowDonorModal(true); }}
                            title="View donor details"
                          >
                            {donation.name}
                          </span>
                        </td>
                        <td>₱{Number(donation.amount).toLocaleString()}</td>
                        <td>{donation.reference}</td>
                        <td>
                          {donation.receipt_path ? (() => {
                            const id = donation._id || donation.id;
                            // Use API endpoint for reliable access to receipt images
                            const receiptUrl = id ? `${window.location.origin}/api/donations/${id}/receipt` : null;
                            
                            if (!receiptUrl) {
                              return <span className="text-[#5C4B38] text-sm">None</span>;
                            }
                            
                            // Check if it's a PDF based on receipt_path
                            const isPdf = /\.pdf$/i.test(donation.receipt_path);
                            
                            return isPdf ? (
                              <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-[#806c4b] underline">View PDF</a>
                            ) : (
                              <img 
                                src={receiptUrl} 
                                alt="Receipt" 
                                style={{ 
                                  width: 56, 
                                  height: 56, 
                                  objectFit: 'cover',
                                  borderRadius: 6,
                                  border: '1px solid #f2e4ce',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  console.log('Image failed to load:', receiptUrl);
                                  e.target.style.display = 'none';
                                  const fallback = document.createElement('span');
                                  fallback.textContent = 'Image Error';
                                  fallback.style.cssText = 'color: #ef4444; font-size: 0.75rem; padding: 4px; border: 1px solid #fecaca; border-radius: 4px; background: #fef2f2;';
                                  e.target.parentNode.appendChild(fallback);
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(receiptUrl, '_blank', 'noopener,noreferrer');
                                }}
                              />
                            );
                          })() : (
                            <span className="text-[#5C4B38] text-sm">None</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${
                            donation.rejection_reason ? 'status-rejected' : 
                            donation.verified ? 'status-approved' : 'status-pending'
                          }`}>
                            {donation.rejection_reason ? 'Rejected' : 
                             donation.verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="action-buttons">
                          {!donation.verified && !donation.rejection_reason && (
                            <button
                              className="btn-approve"
                              onClick={() => handleVerify(donation)}
                              title="Verify Donation"
                              disabled={verifyingId === (donation._id || donation.id)}
                            >
                              {verifyingId === (donation._id || donation.id) ? (
                                <div className="loading-dots">
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                </div>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5 10.5L9 14.5L15 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          )}
                          {!donation.verified && !donation.rejection_reason && (
                            <button
                              className="btn-reject"
                              onClick={() => openRejectModal(donation)}
                              title="Reject Donation"
                              disabled={purposeSaving || rejectingId === (donation._id || donation.id)}
                              style={{ marginLeft: 8, background: '#ef4444', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          )}
                          {donation.rejection_reason && (
                            <span style={{ color: '#ef4444', fontSize: '0.875rem', fontStyle: 'italic' }}>
                              Rejected: {donation.rejection_reason.length > 50 ? 
                                `${donation.rejection_reason.substring(0, 50)}...` : 
                                donation.rejection_reason}
                            </span>
                          )}
                        </td>
                      </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {(() => {
                  // First filter by status
                  let filteredDonationsFooter = filter === 'all' 
                    ? donations 
                    : filter === 'pending' 
                      ? donations.filter(d => !d.verified && !d.rejection_reason)
                      : filter === 'verified'
                        ? donations.filter(d => d.verified)
                        : filter === 'rejected'
                          ? donations.filter(d => d.rejection_reason)
                          : donations;

                  // Then exclude physical donations
                  filteredDonationsFooter = filteredDonationsFooter.filter(d => !isPhysicalDonation(d));

                  const lastPageFooter = Math.max(1, Math.ceil(filteredDonationsFooter.length / pageSize));
                  return (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
                      >Prev</button>
                      <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {page} of {lastPageFooter}</span>
                      <button
                        onClick={() => setPage(p => Math.min(lastPageFooter, p + 1))}
                        disabled={page >= lastPageFooter}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page >= lastPageFooter ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
                      >Next</button>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
            <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
              {(() => {
                switch (confirmAction) {
                  case 'archivePurpose':
                    return 'Archive Donation Purpose';
                  case 'restorePurpose':
                    return 'Restore Donation Purpose';
                  case 'deleteImage':
                  case 'deleteAccount':
                    return 'Confirm Delete';
                  default:
                    return 'Confirm Action';
                }
              })()}
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {(() => {
                switch (confirmAction) {
                  case 'archivePurpose':
                    return `Are you sure you want to archive "${confirmData?.name}"? This will preserve the data but hide it from new donations. You can restore it later from the Manage Donation Purposes section.`;
                  case 'restorePurpose':
                    return `Are you sure you want to restore "${confirmData?.name}"? This will make it available again for new donations.`;
                  case 'deleteImage':
                    return 'Are you sure you want to delete this donation image? This action cannot be undone.';
                  case 'toggleImage':
                    return `Are you sure you want to ${confirmData?.enabled ? 'disable' : 'enable'} this donation image?`;
                  case 'deleteAccount':
                    return 'Are you sure you want to delete this account? This action cannot be undone.';
                  case 'toggleAccount':
                    return `Are you sure you want to ${confirmData?.enabled ? 'disable' : 'enable'} this account?`;
                  default:
                    return 'Are you sure you want to proceed with this action?';
                }
              })()}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelConfirmation}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e9ecef';
                  e.target.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.borderColor = '#dee2e6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                style={{
                  background: confirmAction?.includes('delete') ? '#e74c3c' : 
                             confirmAction === 'archivePurpose' ? '#ef4444' :
                             confirmAction === 'restorePurpose' ? '#10b981' : '#806c4b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  if (confirmAction?.includes('delete')) {
                    e.target.style.background = '#dc2626';
                  } else if (confirmAction === 'archivePurpose') {
                    e.target.style.background = '#dc2626';
                  } else if (confirmAction === 'restorePurpose') {
                    e.target.style.background = '#059669';
                  } else {
                    e.target.style.background = '#6b5a3f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (confirmAction?.includes('delete')) {
                    e.target.style.background = '#e74c3c';
                  } else if (confirmAction === 'archivePurpose') {
                    e.target.style.background = '#ef4444';
                  } else if (confirmAction === 'restorePurpose') {
                    e.target.style.background = '#10b981';
                  } else {
                    e.target.style.background = '#806c4b';
                  }
                }}
              >
                {(() => {
                  switch (confirmAction) {
                    case 'archivePurpose':
                      return 'Archive';
                    case 'restorePurpose':
                      return 'Restore';
                    case 'deleteImage':
                    case 'deleteAccount':
                      return 'Delete';
                    default:
                      return 'Confirm';
                  }
                })()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffGive;