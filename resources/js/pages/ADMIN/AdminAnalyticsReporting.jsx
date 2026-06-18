import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';
import AnalyticsComparison from '../../components/AnalyticsComparison';
import PeriodSelector from '../../components/PeriodSelector';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminAnalyticsReporting = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalRegistrations: 0,
    activeEvents: 0,
    totalParticipants: 0,
    monthlyRegistrations: [],
    eventPopularity: [],
    recentRegistrations: [],
  registrationTrends: [],
  // Parishioner analytics
  parishAttendanceMonthly: [], // [{ month: 'Aug 2025', count: 123 }]
  // Membership analytics
  membershipStatusDistribution: [], // [{ status: 'active', count: 150, percentage: 75 }]
  totalParishioners: 0,
  newMembersThisMonth: 0,
  activeMembers: 0,
  // Family analytics
  totalFamilies: 0,
  activeFamilies: 0,
  totalFamilyMembers: 0,
  unassignedMembers: 0,
  averageFamilySize: 0,
  // Mass Attendance analytics
  totalMassAttendances: 0,
  totalPeopleAttended: 0,
  uniqueMassAttendees: 0,
  guestAttendances: 0,
  massAttendanceBySchedule: [],
  recentMassAttendances: [],
  massAttendanceMonthly: [],
  massAttendanceDaily: [],
  massAttendanceWeekly: [],
  // Comparison data
  comparisons: {
    registrations: { current: 0, previous: 0 },
    parishioners: { current: 0, previous: 0 },
    massAttendance: { current: 0, previous: 0 },
    newMembers: { current: 0, previous: 0 },
    families: { current: 0, previous: 0 }
  }
  });
  const [loading, setLoading] = useState(true);
  const [animateCharts, setAnimateCharts] = useState(false);
  const [eventFilter, setEventFilter] = useState('all'); // 'all', 'active', 'archived', or specific event ID
  const [events, setEvents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null); // null = all years, or specific year like 2023
  // Store original unfiltered monthly registrations for year dropdown
  const [originalMonthlyRegistrations, setOriginalMonthlyRegistrations] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1; // 1-12
    const pm = cm === 1 ? 12 : cm - 1;
    const py = cm === 1 ? cy - 1 : cy;
    return {
      current: { year: cy, month: cm, label: `${now.toLocaleString('default', { month: 'short' })} ${cy}` },
      compare: { year: py, month: pm, label: `${new Date(py, pm - 1, 1).toLocaleString('default', { month: 'short' })} ${py}` }
    };
  });
  const [massAttendanceView, setMassAttendanceView] = useState('monthly');
  const [selectedMassMonth, setSelectedMassMonth] = useState(null); // null = all months, or format: 'YYYY-MM'
  const [selectedMembershipMonth, setSelectedMembershipMonth] = useState(null); // null = all months, or format: 'YYYY-MM'

  const createDailyFallback = () => {
    const today = new Date();
    const result = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - i);
      result.push({
        date: dt.toISOString().split('T')[0],
        label: dt.toLocaleString('en-US', { month: 'short', day: '2-digit' }),
        count: 0,
      });
    }
    return result;
  };

  const createWeeklyFallback = () => {
    const today = new Date();
    const result = [];
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay());
    for (let i = 7; i >= 0; i--) {
      const start = new Date(startOfCurrentWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      result.push({
        week_start: start.toISOString().split('T')[0],
        week_end: end.toISOString().split('T')[0],
        label: `${start.toLocaleString('en-US', { month: 'short', day: '2-digit' })} - ${end.toLocaleString('en-US', { month: 'short', day: '2-digit' })}`,
        count: 0,
      });
    }
    return result;
  };

  const getMassAttendanceSeries = (view = 'monthly') => {
    switch (view) {
      case 'daily':
        return analyticsData.massAttendanceDaily || [];
      case 'weekly':
        return analyticsData.massAttendanceWeekly || [];
      default:
        return analyticsData.massAttendanceMonthly || [];
    }
  };

  const massAttendanceViewLabels = {
    daily: 'Daily Mass Attendance (Last 14 Days)',
    weekly: 'Weekly Mass Attendance (Last 8 Weeks)',
    monthly: 'Monthly Mass Attendance (Last 12 Months)',
  };

  const handleDownloadMassAttendance = async () => {
    try {
      const params = {
        view: massAttendanceView, // daily, weekly, monthly
        selectedMonth: selectedMassMonth || 'all'
      };
      
      // Call the backend PDF export endpoint
      const response = await api.get('/admin/mass-attendance/export-pdf', {
        params: params,
        responseType: 'blob' // Important for PDF download
      });
      
      // If response status is 200, it's a successful download (even if blob parsing fails)
      if (response.status === 200) {
        // Try to create blob and download
        if (response.data instanceof Blob) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `mass_attendance_${massAttendanceView}_${selectedMassMonth || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
        // Success - no error message needed, browser handles the download
        return;
      }
      
      // If status is not 200, try to parse error
      if (response.status >= 400) {
        try {
          const text = await response.data.text();
          const errorData = JSON.parse(text);
          alert(errorData.message || errorData.error || 'Failed to download PDF.');
        } catch (e) {
          alert('Failed to download PDF. Please try again.');
        }
      }
    } catch (error) {
      // Only show error if response status indicates an actual error (400+)
      // If status is 200 or undefined, the download likely succeeded via browser
      if (error.response && error.response.status >= 400) {
        console.error('Error downloading PDF:', error);
        let errorMessage = 'Failed to download PDF. Please try again.';
        
        // Try to extract error message from response
        if (error.response.data) {
          try {
            // If response is blob, try to read it as text
            if (error.response.data instanceof Blob) {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } else if (typeof error.response.data === 'object') {
              errorMessage = error.response.data.message || error.response.data.error || errorMessage;
            }
          } catch (e) {
            // Use default message if parsing fails
          }
        }
        
        alert(errorMessage);
      }
      // If no error response or status is 200/undefined, don't show error
      // The browser may have handled the download successfully
    }
  };

  const handlePeriodChange = (periods) => {
    // Normalize incoming periods so they consistently have { year, month (1-12), label }
    // Same logic as StaffGive for consistency
    if (!periods) return;
    const normalizePart = (part, fallback) => {
      if (!part) return fallback;
      let year = part.year ?? part.y ?? fallback.year;
      // Identify source of month to avoid off-by-one errors
      const hasMonth = Object.prototype.hasOwnProperty.call(part, 'month');
      const hasM = Object.prototype.hasOwnProperty.call(part, 'm');
      const hasMonthIndex = Object.prototype.hasOwnProperty.call(part, 'monthIndex');
      const hasMonthValue = Object.prototype.hasOwnProperty.call(part, 'monthValue');
      const rawSource = hasMonth ? 'month' : hasM ? 'm' : hasMonthIndex ? 'monthIndex' : hasMonthValue ? 'monthValue' : 'fallback';
      let month = part.month ?? part.m ?? part.monthIndex ?? part.monthValue ?? fallback.month;

      // Always convert strings/0-based/invalid values to 1-12
      if (typeof month === 'string') {
        month = month.replace(/^0+/, ''); // strip leading zeros
        if (/^\d+$/.test(month)) month = Number(month);
      }
      if (typeof month !== 'number' || isNaN(month) || month < 1 || month > 12) month = fallback.month;
      // Only adjust 0-based values when given monthIndex
      if (rawSource === 'monthIndex') {
        if (month >= 0 && month <= 11) month = month + 1;
      }
      // Final check
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
      // Recalculate comparison data based on normalized selected periods
      calculateComparisonData(normalized);
      return normalized;
    });
  };

  const calculateComparisonData = (periods) => {
    if (!periods) return;

    setAnalyticsData(prev => {
      if (!prev.monthlyRegistrations || !prev.massAttendanceMonthly) {
        return prev; // Don't update if no data available
      }

      const { current, compare } = periods;
      
      // Use stable key format YYYY-MM for matching (same as StaffGive)
      const formatKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
      const currentKey = formatKey(current.year, current.month);
      const compareKey = formatKey(compare.year, compare.month);
      
      // Find registration data using key
      const currentRegistrationData = prev.monthlyRegistrations.find(item => item.key === currentKey);
      const compareRegistrationData = prev.monthlyRegistrations.find(item => item.key === compareKey);

      // Find mass attendance data using key
      const currentMassData = prev.massAttendanceMonthly.find(item => item.key === currentKey);
      const compareMassData = prev.massAttendanceMonthly.find(item => item.key === compareKey);

      // Only update if values are different to prevent unnecessary re-renders
      const newRegistrationsCurrent = currentRegistrationData?.count || 0;
      const newRegistrationsPrevious = compareRegistrationData?.count || 0;
      const newMassCurrent = currentMassData?.count || 0;
      const newMassPrevious = compareMassData?.count || 0;
      
      // Check if comparisons need updating
      if (
        prev.comparisons.registrations.current === newRegistrationsCurrent &&
        prev.comparisons.registrations.previous === newRegistrationsPrevious &&
        prev.comparisons.massAttendance.current === newMassCurrent &&
        prev.comparisons.massAttendance.previous === newMassPrevious
      ) {
        return prev; // No change needed
      }

      // Update comparison data with real values
      return {
        ...prev,
        comparisons: {
          registrations: { 
            current: newRegistrationsCurrent, 
            previous: newRegistrationsPrevious 
          },
          massAttendance: { 
            current: newMassCurrent, 
            previous: newMassPrevious 
          },
          parishioners: { 
            current: prev.totalParishioners || 0, 
            previous: prev.totalParishioners || 0 // Static for now, can be enhanced later
          },
          newMembers: { 
            current: prev.newMembersThisMonth || 0, 
            previous: 0 // Static for now, can be enhanced later
          },
          families: { 
            current: prev.totalFamilies || 0, 
            previous: prev.totalFamilies || 0 // Static for now, can be enhanced later
          }
        }
      };
    });
  };

  useEffect(() => {
    // Fetch events for filter dropdown (including archived events)
    const fetchEvents = async () => {
      try {
        const res = await api.get('/admin/analytics/events-filter');
        console.log('Events API response:', res.data);
        
        // Handle different response structures
        let eventsList = [];
        if (res.data?.success && Array.isArray(res.data.data)) {
          eventsList = res.data.data;
        } else if (Array.isArray(res.data?.data)) {
          eventsList = res.data.data;
        } else if (Array.isArray(res.data)) {
          eventsList = res.data;
        }
        
        console.log('Parsed events list:', eventsList);
        
        if (eventsList.length > 0) {
          // Sort events: active first, then archived, both by date (newest first)
          const sortedEvents = eventsList.sort((a, b) => {
            // Active events first
            if (!a.archived && b.archived) return -1;
            if (a.archived && !b.archived) return 1;
            // Then sort by date (newest first)
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
          });
          setEvents(sortedEvents);
        } else {
          console.warn('No events found in response');
          setEvents([]);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        console.error('Error details:', err.response?.data || err.message);
        setEvents([]);
      }
    };
    
    fetchEvents();
    fetchAnalyticsData();
  }, []);

  // Re-fetch analytics when event filter or year filter changes
  useEffect(() => {
    if (events.length > 0) {
      fetchAnalyticsData();
    }
  }, [eventFilter, selectedYear, selectedMassMonth, selectedMembershipMonth]);

  const fetchAnalyticsData = async () => {
    try {
      // Build event filter parameter
      let eventFilterParam = '';
      let recentRegistrationsUrl = '/admin/analytics/recent-event-registrations?limit=20';
      
      if (eventFilter && eventFilter !== 'all') {
        // Specific event selected
        eventFilterParam = `?event_id=${eventFilter}`;
        recentRegistrationsUrl = `/admin/analytics/recent-event-registrations?event_id=${eventFilter}&limit=20`;
      }
      
      // Build mass attendance filter parameters
      let massAttendanceParams = '';
      if (selectedMassMonth) {
        // Parse YYYY-MM format and create date range for the month
        const [year, month] = selectedMassMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        massAttendanceParams = `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      // Fetch real analytics data from the new API endpoints
      const [eventRes, parishAttendanceRes, usersRes, familyRes, massAttendanceRes, recentRegistrationsRes] = await Promise.all([
        api.get(`/admin/analytics/event-registrations${eventFilterParam}`).catch(err => {
          console.error('Event analytics error:', err);
          return { data: { totalRegistrations: 0, activeEvents: 0, totalParticipants: 0, monthlyRegistrations: [], eventPopularity: [], recentRegistrations: [] }};
        }),
        api.get('/admin/analytics/parishioners/attendance-monthly').catch(err => ({ data: [] })),
        api.get('/all-users').catch(err => ({ data: [] })),
        api.get('/admin/analytics/families').catch(err => ({ data: {} })),
        api.get(`/admin/mass-attendance/statistics${massAttendanceParams}`).catch(err => ({ data: {} })),
        api.get(recentRegistrationsUrl).catch(err => {
          console.error('Recent registrations error:', err);
          return { data: { data: [], count: 0 }};
        })
      ]);

      const eventData = eventRes.data?.data || eventRes.data || {};
      
      // Use recent registrations from the dedicated endpoint
      const recentRegistrationsData = recentRegistrationsRes.data?.data || recentRegistrationsRes.data || [];
      const recentRegistrations = Array.isArray(recentRegistrationsData) ? recentRegistrationsData : [];
      
      // Update eventData with filtered recent registrations
      eventData.recentRegistrations = recentRegistrations.map(reg => ({
        date: reg.date || reg.created_at,
        event: reg.event || 'Unknown Event',
        participant: reg.participant || `${reg.first_name || ''} ${reg.last_name || ''}`.trim(),
        email: reg.email || '',
        status: reg.status || 'approved',
        event_archived: reg.event_archived || false
      }));
      
      // Ensure we have proper monthly registration data structure
      let monthlyRegistrations = eventData.monthlyRegistrations || [];
      
      // Store original unfiltered data for year dropdown calculation
      setOriginalMonthlyRegistrations(monthlyRegistrations);
      
      // Filter by year if selected (for display only)
      if (selectedYear) {
        monthlyRegistrations = monthlyRegistrations.filter(item => {
          const year = new Date(item.month + ' 1').getFullYear();
          return year === selectedYear;
        });
      }
      
      // Always create a complete 12-month structure (or for selected year)
      const completeMonthlyData = [];
      const currentDateTime = new Date();
      
      // Helper: Convert arbitrary month label to three-letter month abbreviation
      function normalizeToShortMonth(label) {
        try {
          if (/^[A-Za-z]{3}$/.test(label)) return label;
          if (/^[A-Za-z]+ \d{4}$/.test(label)) return label.substr(0, 3);
          if (/^\d{4}-\d{2}$/.test(label)) {
            const [year, monthNum] = label.split('-');
            const dt = new Date(year, parseInt(monthNum, 10) - 1, 1);
            return dt.toLocaleString('en-US', { month: 'short' });
          }
          const dt = new Date(`${label} 1, 2020`);
          if (!isNaN(dt)) {
            return dt.toLocaleString('en-US', { month: 'short' });
          }
        } catch (e) {}
        return label;
      }

      // Use key-based matching for more reliable data mapping
      const existingMonthsByKey = new Map();
      if (Array.isArray(monthlyRegistrations)) {
        monthlyRegistrations.forEach(item => {
          if (item && item.key) {
            existingMonthsByKey.set(item.key, item.count || 0);
          } else if (item && item.month) {
            // Fallback: try to extract key from month label
            const monthStr = item.month.toString();
            const match = monthStr.match(/(\w{3})\s+(\d{4})/);
            if (match) {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthIndex = monthNames.indexOf(match[1]);
              if (monthIndex !== -1) {
                const key = `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}`;
                existingMonthsByKey.set(key, item.count || 0);
              }
            }
          }
        });
      }

      // Build 36 months (3 years) of data
      if (selectedYear) {
        // Build only for selected year
        for (let month = 1; month <= 12; month++) {
          const dt = new Date(selectedYear, month - 1, 1);
          const fullLabel = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          const key = `${selectedYear}-${String(month).padStart(2, '0')}`;
          const count = existingMonthsByKey.get(key) || 0;
          completeMonthlyData.push({
            key: key,
            month: fullLabel,
            count: count
          });
        }
      } else {
        // Build for all 36 months (3 years)
        for (let i = 35; i >= 0; i--) {
          const dt = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth() - i, 1);
          const fullLabel = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
          const count = existingMonthsByKey.get(key) || 0;
          completeMonthlyData.push({
            key: key,
            month: fullLabel,
            count: count
          });
        }
      }

      monthlyRegistrations = completeMonthlyData;

      // Build parishioner attendance monthly (use real API data)
      let parishAttendanceMonthly = Array.isArray(parishAttendanceRes?.data?.data) ? parishAttendanceRes.data.data : 
                                   Array.isArray(parishAttendanceRes?.data) ? parishAttendanceRes.data : null;
      
      // Filter by year if selected (use key field for reliable filtering)
      if (selectedYear && parishAttendanceMonthly) {
        parishAttendanceMonthly = parishAttendanceMonthly.filter(item => {
          if (item.key) {
            const year = parseInt(item.key.split('-')[0]);
            return year === selectedYear;
          }
          // Fallback: try to parse from month string
          const year = new Date(item.month + ' 1').getFullYear();
          return year === selectedYear;
        });
      }
      
      // Fallback if no real data
      if (!parishAttendanceMonthly || parishAttendanceMonthly.length === 0) {
        parishAttendanceMonthly = (eventData.monthlyRegistrations || []).map(m => ({ key: m.key, month: m.month, count: m.count }));
        if (!parishAttendanceMonthly || parishAttendanceMonthly.length === 0) {
          const today = new Date();
          parishAttendanceMonthly = [];
          const monthsToShow = selectedYear ? 12 : 36;
          const startMonth = selectedYear ? 0 : 35;
          for (let i = startMonth; i >= (selectedYear ? 0 : 0); i--) {
            const dt = selectedYear 
              ? new Date(selectedYear, 11 - i, 1)
              : new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
            parishAttendanceMonthly.push({ 
              key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`, // Add key field
              month: label, 
              count: Math.floor(Math.random() * 10) + (i < 6 ? 10 : 0) 
            });
          }
        }
      }

      // Process membership analytics
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      // Only count parishioners (not admin, staff, or priest)
      let parishioners = users.filter(user => !user.is_admin && !user.is_staff && !user.is_priest);
      
      // Filter by selected month if specified
      if (selectedMembershipMonth) {
        const [year, month] = selectedMembershipMonth.split('-');
        parishioners = parishioners.filter(user => {
          const dateToCheck = user.created_at || user.membership_date;
          if (!dateToCheck) return false;
          const accountDate = new Date(dateToCheck);
          return accountDate.getFullYear() === parseInt(year) && 
                 (accountDate.getMonth() + 1) === parseInt(month);
        });
      }
      
      const totalParishioners = parishioners.length;
      
      // Calculate membership status distribution
      const statusCounts = {};
      parishioners.forEach(user => {
        const status = user.membership_status || 'new_member';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const membershipStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalParishioners > 0 ? Math.round((count / totalParishioners) * 100) : 0
      }));
      
      // Calculate active members and new members this month
      const activeMembers = statusCounts.active || 0;
      // Use created_at instead of membership_date to include accounts created by admin
      // Fallback to membership_date if created_at is not available
      const newMembersThisMonth = parishioners.filter(user => {
        // Use created_at (account creation date) which is always set, or fallback to membership_date
        const dateToCheck = user.created_at || user.membership_date;
        if (!dateToCheck) return false;
        const accountDate = new Date(dateToCheck);
        const now = new Date();
        return accountDate.getMonth() === now.getMonth() && accountDate.getFullYear() === now.getFullYear();
      }).length;

      // Process family analytics
      const familyData = familyRes.data?.data || familyRes.data || {};
      const totalFamilies = familyData.total_families || 0;
      const activeFamilies = familyData.active_families || 0;
      const totalFamilyMembers = familyData.total_members || 0;
      const unassignedMembers = familyData.unassigned_members || 0;
      const averageFamilySize = familyData.average_family_size || 0;

      // Process mass attendance analytics
      const massAttendanceData = massAttendanceRes.data?.data || massAttendanceRes.data || {};
      const totalMassAttendances = massAttendanceData.total_attendances || 0;
      const totalPeopleAttended = massAttendanceData.total_people || 0;
      const uniqueMassAttendees = massAttendanceData.unique_users || 0;
      const guestAttendances = massAttendanceData.guest_attendances || 0;
      const massAttendanceBySchedule = massAttendanceData.attendances_by_mass || [];
      const recentMassAttendances = massAttendanceData.recent_attendances || [];
      let massAttendanceMonthly = massAttendanceData.monthly_attendance || [];
      let massAttendanceDaily = Array.isArray(massAttendanceData.daily_attendance) ? massAttendanceData.daily_attendance : [];
      let massAttendanceWeekly = Array.isArray(massAttendanceData.weekly_attendance) ? massAttendanceData.weekly_attendance : [];
      
      // Filter mass attendance by year if selected
      if (selectedYear && massAttendanceMonthly && massAttendanceMonthly.length > 0) {
        massAttendanceMonthly = massAttendanceMonthly.filter(item => {
          const year = new Date(item.month + ' 1').getFullYear();
          return year === selectedYear;
        });
      }
      
      // Filter mass attendance by selected month if selected
      if (selectedMassMonth && massAttendanceMonthly && massAttendanceMonthly.length > 0) {
        massAttendanceMonthly = massAttendanceMonthly.filter(item => {
          const itemKey = item.key || (() => {
            try {
              const dt = new Date(item.month + ' 1');
              if (!isNaN(dt)) {
                return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
              }
            } catch (e) {}
            return null;
          })();
          return itemKey === selectedMassMonth;
        });
      }
      
      // Filter daily attendance by selected month if selected
      if (selectedMassMonth && massAttendanceDaily && massAttendanceDaily.length > 0) {
        const [year, month] = selectedMassMonth.split('-');
        massAttendanceDaily = massAttendanceDaily.filter(item => {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === parseInt(year) && 
                 (itemDate.getMonth() + 1) === parseInt(month);
        });
      }
      
      // Filter weekly attendance by selected month if selected
      if (selectedMassMonth && massAttendanceWeekly && massAttendanceWeekly.length > 0) {
        const [year, month] = selectedMassMonth.split('-');
        massAttendanceWeekly = massAttendanceWeekly.filter(item => {
          if (!item.week_start) return false;
          const weekStart = new Date(item.week_start);
          return weekStart.getFullYear() === parseInt(year) && 
                 (weekStart.getMonth() + 1) === parseInt(month);
        });
      }
      
      // Ensure massAttendanceMonthly has key field if it doesn't
      if (massAttendanceMonthly && massAttendanceMonthly.length > 0) {
        massAttendanceMonthly = massAttendanceMonthly.map(item => {
          if (item.key) return item;
          // Parse month label to create key
          try {
            const dt = new Date(item.month + ' 1');
            if (!isNaN(dt)) {
              return {
                ...item,
                key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
              };
            }
          } catch (e) {
            // If parsing fails, create key from current date structure
          }
          // If month format is different, try to create from the data structure
          const today = new Date();
          for (let i = 35; i >= 0; i--) {
            const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
            if (item.month === label) {
              return {
                ...item,
                key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
              };
            }
          }
          return item;
        });
      }

      if (!massAttendanceDaily || massAttendanceDaily.length === 0) {
        massAttendanceDaily = createDailyFallback();
      } else {
        massAttendanceDaily = massAttendanceDaily.map((item) => {
          const dateLabel = item.date ? new Date(item.date).toLocaleString('en-US', { month: 'short', day: '2-digit' }) : item.label;
          return {
            ...item,
            label: item.label || dateLabel,
            count: item.count || 0,
          };
        });
      }

      if (!massAttendanceWeekly || massAttendanceWeekly.length === 0) {
        massAttendanceWeekly = createWeeklyFallback();
      } else {
        massAttendanceWeekly = massAttendanceWeekly.map((item) => {
          let startLabel = item.week_start ? new Date(item.week_start).toLocaleString('en-US', { month: 'short', day: '2-digit' }) : '';
          let endLabel = item.week_end ? new Date(item.week_end).toLocaleString('en-US', { month: 'short', day: '2-digit' }) : '';
          return {
            ...item,
            label: item.label || `${startLabel} - ${endLabel}`,
            count: item.count || 0,
          };
        });
      }

      // Calculate insights based on filtered data
      let registrationInsights = eventData.insights || {};
      let massAttendanceInsights = massAttendanceData.insights || {};
      
      // If year filter is active, recalculate insights for that year
      if (selectedYear) {
        // Calculate registration insights for selected year
        const yearRegistrations = monthlyRegistrations.filter(m => {
          const year = new Date(m.month + ' 1').getFullYear();
          return year === selectedYear;
        });
        
        if (yearRegistrations.length > 0) {
          const counts = yearRegistrations.map(m => m.count || 0);
          const total = counts.reduce((sum, c) => sum + c, 0);
          const avg = total / yearRegistrations.length;
          const maxIndex = counts.indexOf(Math.max(...counts));
          const minIndex = counts.indexOf(Math.min(...counts.filter(c => c > 0)));
          
          // Compare with previous year
          const prevYearRegistrations = monthlyRegistrations.filter(m => {
            const year = new Date(m.month + ' 1').getFullYear();
            return year === selectedYear - 1;
          });
          const prevYearTotal = prevYearRegistrations.reduce((sum, m) => sum + (m.count || 0), 0);
          const yoyGrowth = prevYearTotal > 0 ? Math.round(((total - prevYearTotal) / prevYearTotal) * 100 * 10) / 10 : 0;
          
          // Trend: first half vs second half
          const firstHalf = counts.slice(0, 6).reduce((sum, c) => sum + c, 0) / 6;
          const secondHalf = counts.slice(6).reduce((sum, c) => sum + c, 0) / 6;
          const trend = secondHalf > firstHalf * 1.1 ? 'increasing' : (secondHalf < firstHalf * 0.9 ? 'decreasing' : 'stable');
          
          registrationInsights = {
            total_registrations: total,
            average_monthly: Math.round(avg * 10) / 10,
            peak_month: yearRegistrations[maxIndex]?.month || 'N/A',
            peak_count: counts[maxIndex] || 0,
            low_month: yearRegistrations[minIndex]?.month || 'N/A',
            low_count: counts[minIndex] || 0,
            year_over_year_growth: yoyGrowth,
            trend: trend,
            current_year_total: total,
            previous_year_total: prevYearTotal
          };
        }
        
        // Calculate mass attendance insights for selected year
        const yearMassAttendance = massAttendanceMonthly.filter(m => {
          const year = new Date(m.month + ' 1').getFullYear();
          return year === selectedYear;
        });
        
        if (yearMassAttendance.length > 0) {
          const counts = yearMassAttendance.map(m => m.count || 0);
          const total = counts.reduce((sum, c) => sum + c, 0);
          const avg = total / yearMassAttendance.length;
          const maxIndex = counts.indexOf(Math.max(...counts));
          const minIndex = counts.indexOf(Math.min(...counts.filter(c => c > 0)));
          
          // Compare with previous year
          const prevYearMass = massAttendanceMonthly.filter(m => {
            const year = new Date(m.month + ' 1').getFullYear();
            return year === selectedYear - 1;
          });
          const prevYearTotal = prevYearMass.reduce((sum, m) => sum + (m.count || 0), 0);
          const yoyGrowth = prevYearTotal > 0 ? Math.round(((total - prevYearTotal) / prevYearTotal) * 100 * 10) / 10 : 0;
          
          // Trend: first half vs second half
          const firstHalf = counts.slice(0, 6).reduce((sum, c) => sum + c, 0) / 6;
          const secondHalf = counts.slice(6).reduce((sum, c) => sum + c, 0) / 6;
          const trend = secondHalf > firstHalf * 1.1 ? 'increasing' : (secondHalf < firstHalf * 0.9 ? 'decreasing' : 'stable');
          
          massAttendanceInsights = {
            total_attendance: total,
            average_monthly: Math.round(avg * 10) / 10,
            peak_month: yearMassAttendance[maxIndex]?.month || 'N/A',
            peak_count: counts[maxIndex] || 0,
            low_month: yearMassAttendance[minIndex]?.month || 'N/A',
            low_count: counts[minIndex] || 0,
            year_over_year_growth: yoyGrowth,
            trend: trend,
            current_year_total: total,
            previous_year_total: prevYearTotal
          };
        }
      }
      
      const newAnalyticsData = {
        ...eventData,
        monthlyRegistrations, // Use processed monthly registrations with key field
        parishAttendanceMonthly,
        membershipStatusDistribution,
        totalParishioners,
        newMembersThisMonth,
        activeMembers,
        // Family analytics
        totalFamilies,
        activeFamilies,
        totalFamilyMembers,
        unassignedMembers,
        averageFamilySize,
        // Mass Attendance analytics
        totalMassAttendances,
        totalPeopleAttended,
        uniqueMassAttendees,
        guestAttendances,
        massAttendanceBySchedule,
        recentMassAttendances,
        massAttendanceMonthly, // Now has key field
        massAttendanceDaily,
        massAttendanceWeekly,
        // Insights
        registrationInsights,
        massAttendanceInsights,
        // Comparison data (will be calculated based on selected periods)
        comparisons: {
          registrations: { current: 0, previous: 0 },
          parishioners: { current: 0, previous: 0 },
          massAttendance: { current: 0, previous: 0 },
          newMembers: { current: 0, previous: 0 },
          families: { current: 0, previous: 0 }
        }
      };

      setAnalyticsData(newAnalyticsData);
      
      // Calculate initial comparison data based on default periods
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        calculateComparisonData(selectedPeriods);
      }, 100);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data structure if API fails - create 36 months (3 years) of zero data
      const fallbackMonthlyData = [];
      const currentTime = new Date();
      for (let i = 35; i >= 0; i--) {
        const dt = new Date(currentTime.getFullYear(), currentTime.getMonth() - i, 1);
        const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        fallbackMonthlyData.push({ key, month: label, count: 0 });
      }
      const fallbackDailyData = createDailyFallback();
      const fallbackWeeklyData = createWeeklyFallback();
      
      setAnalyticsData({
        totalRegistrations: 0,
        activeEvents: 0,
        totalParticipants: 0,
        monthlyRegistrations: fallbackMonthlyData,
        eventPopularity: [],
        recentRegistrations: [],
        registrationTrends: [],
        parishAttendanceMonthly: fallbackMonthlyData.map(m => ({ key: m.key, month: m.month, count: m.count })),
        membershipStatusDistribution: [],
        totalParishioners: 0,
        newMembersThisMonth: 0,
        activeMembers: 0,
        // Family analytics fallback
        totalFamilies: 0,
        activeFamilies: 0,
        totalFamilyMembers: 0,
        unassignedMembers: 0,
        averageFamilySize: 0,
        // Mass Attendance analytics fallback
        totalMassAttendances: 0,
        totalPeopleAttended: 0,
        uniqueMassAttendees: 0,
        guestAttendances: 0,
        massAttendanceBySchedule: [],
        recentMassAttendances: [],
        massAttendanceMonthly: fallbackMonthlyData.map(m => ({ key: m.key, month: m.month, count: m.count })),
        massAttendanceDaily: fallbackDailyData,
        massAttendanceWeekly: fallbackWeeklyData,
        // Comparison data fallback
        comparisons: {
          registrations: { current: 0, previous: 0 },
          parishioners: { current: 0, previous: 0 },
          massAttendance: { current: 0, previous: 0 },
          newMembers: { current: 0, previous: 0 },
          families: { current: 0, previous: 0 }
        }
      });
    } finally {
      setLoading(false);
      // Trigger chart animations after a short delay
      setTimeout(() => {
        setAnimateCharts(true);
      }, 300);
    }
  };



  const BarChart = ({ data, title, color = '#CD8B3E' }) => {
    const chartData = {
      labels: data.map(item => item.label || item.month || item.day || ''),
      datasets: [
        {
          label: title,
          data: data.map(item => item.count || 0),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
              return `${title}: ${context.parsed.y}`;
            },
          },
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
        duration: animateCharts ? 1000 : 0,
        easing: 'easeOutQuart',
      },
    };

    return (
      <div className="w-full h-40 sm:h-48 lg:h-56">
        <h3 className="text-xs sm:text-sm font-medium text-[#5C4B38] mb-3 sm:mb-4">{title}</h3>
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  // Professional Chart.js bar chart component
  const ModernBarChart = ({ monthlyData }) => {
    // Ensure we have valid monthly data
    const validMonthlyData = Array.isArray(monthlyData) && monthlyData.length > 0 ? monthlyData : [];
    
    // If we don't have data, create a fallback structure for the last 36 months (3 years)
    let finalMonthlyData = validMonthlyData;
    if (validMonthlyData.length === 0) {
      finalMonthlyData = [];
      const currentMoment = new Date();
      for (let i = 35; i >= 0; i--) {
        const dt = new Date(currentMoment.getFullYear(), currentMoment.getMonth() - i, 1);
        const label = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        finalMonthlyData.push({ month: label, count: 0 });
      }
    }

    const hasData = finalMonthlyData.some(month => month.count > 0);
    const totalRegistrations = finalMonthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
    const maxValue = Math.max(...finalMonthlyData.map(m => m.count || 0));
    
    const chartData = {
      labels: finalMonthlyData.map(month => month.month),
      datasets: [
        {
          label: 'Monthly Event Registrations',
          data: finalMonthlyData.map(month => month.count || 0),
          backgroundColor: finalMonthlyData.map((month) => {
            if (month.count === maxValue && maxValue > 0) {
              return 'rgba(205, 139, 62, 0.9)'; // Highlight highest
            }
            return 'rgba(205, 139, 62, 0.6)';
          }),
          borderColor: 'rgba(205, 139, 62, 1)',
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
          title: {
            display: true,
            text: selectedYear ? `Event Participation Trends (${selectedYear})` : 'Event Participation Trends (3 Years)',
            font: {
              size: 18,
              weight: 'bold',
            },
            color: '#3F2E1E',
            padding: {
              top: 10,
              bottom: 20,
            },
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
              const count = context.parsed.y;
              return `${count} registration${count !== 1 ? 's' : ''}`;
            },
          },
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            lineWidth: 1,
          },
          ticks: {
            font: {
              size: 12,
            },
            color: '#5C4B38',
            padding: 8,
          },
          title: {
            display: true,
            text: 'Registrations',
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
        duration: animateCharts ? 1200 : 0,
        easing: 'easeOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };

    return (
      <div className="w-full bg-gradient-to-br from-white to-gray-50 rounded-xl p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-[#CD8B3E] rounded-full"></div>
            <span className="text-sm text-[#5C4B38]">Monthly Event Registrations</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${hasData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {hasData ? `${totalRegistrations} Total` : 'No Data Yet'}
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative" style={{ height: '400px' }}>
          <Bar data={chartData} options={options} />
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{maxValue}</div>
            <div className="text-xs text-blue-500">Peak Month</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">{totalRegistrations}</div>
            <div className="text-xs text-green-500">Total Year</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{Math.round(totalRegistrations / 12)}</div>
            <div className="text-xs text-purple-500">Monthly Avg</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
          <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
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

  const currentMassAttendanceSeries = getMassAttendanceSeries(massAttendanceView);
  let massAttendanceTitle = massAttendanceViewLabels[massAttendanceView] || 'Mass Attendance';
  
  // Add month filter info to title if a month is selected
  if (selectedMassMonth) {
    const [year, month] = selectedMassMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    massAttendanceTitle = `${massAttendanceTitle} - ${monthLabel}`;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
      <style>{`
        /* Fix dropdown positioning - ensure options appear below */
        select {
          position: relative;
        }
        
        /* Ensure parent containers don't clip dropdowns */
        .analytics-card {
          overflow: visible !important;
        }
        
        /* Fix for dropdown rendering - ensure it appears below */
        select:focus {
          z-index: 1001;
        }
        
        /* Ensure select dropdowns render correctly */
        select option {
          background: white;
          padding: 8px 12px;
        }
        
        /* Prevent parent overflow from clipping dropdown */
        .analytics-container {
          overflow: visible;
        }
        
        /* Force dropdown to render below by ensuring proper stacking context */
        select {
          transform: translateZ(0);
        }
        
        /* Ensure select wrapper has proper positioning */
        .relative[style*="zIndex"] {
          isolation: isolate;
        }
        
        /* Mobile-first responsive design */
        @media (max-width: 640px) {
          .main-bar-graph {
            padding: 1rem !important;
            margin: 0 auto;
          }
          
          .main-bar-graph .bar-element {
            min-width: 30px !important;
          }
          
          .main-bar-graph .bar-element:hover .group-hover\\:opacity-100 {
            display: none !important;
          }
          
          /* Ensure proper centering and margins on mobile */
          .analytics-container {
            margin: 0 auto;
            padding-left: 1rem;
            padding-right: 1rem;
            max-width: 100%;
          }
          
          /* Center all cards and content */
          .analytics-card {
            margin: 0 auto;
            width: 100%;
          }
          
          /* Ensure tables are properly centered */
          .analytics-table {
            margin: 0 auto;
            width: 100%;
          }
        }
        
        @keyframes barGrowUp {
          0% {
            height: 0;
            transform: scaleY(0);
            transform-origin: bottom;
            opacity: 0.7;
          }
          60% {
            transform: scaleY(1.05);
            transform-origin: bottom;
            opacity: 0.9;
          }
          100% {
            transform: scaleY(1);
            transform-origin: bottom;
            opacity: 1;
          }
        }
        
        @keyframes barSlideUp {
          0% {
            height: 0;
            transform: translateY(100%) scaleY(0);
            transform-origin: bottom;
            opacity: 0;
          }
          70% {
            transform: translateY(0) scaleY(1.08);
            transform-origin: bottom;
            opacity: 0.95;
          }
          100% {
            height: var(--final-height);
            transform: translateY(0) scaleY(1);
            transform-origin: bottom;
            opacity: 1;
          }
        }
        
        .bar-animate {
          animation: barGrowUp 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        .bar-animate-delayed {
          animation: barSlideUp 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        .bounce-in {
          animation: bounceIn 0.8s ease-out forwards;
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0) translateY(100%);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-10%);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        /* Enhanced bar graph specific animations */
        .main-bar-graph .bar-container {
          overflow: hidden;
        }
        
        .main-bar-graph .bar-element {
          transition: all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-origin: bottom center;
        }
        
        .main-bar-graph .bar-element.animate {
          animation: dramaticGrowUp 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        @keyframes dramaticGrowUp {
          0% {
            height: 0;
            transform: scaleY(0) scaleX(0.8);
            opacity: 0;
            filter: blur(2px);
          }
          30% {
            transform: scaleY(0.3) scaleX(0.9);
            opacity: 0.6;
            filter: blur(1px);
          }
          70% {
            transform: scaleY(1.1) scaleX(1.05);
            opacity: 0.9;
            filter: blur(0px);
          }
          100% {
            transform: scaleY(1) scaleX(1);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        /* Mobile touch improvements */
        @media (max-width: 768px) {
          .main-bar-graph .bar-element:hover {
            transform: scaleY(1.05) !important;
          }
          
          /* Improve touch targets */
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Better table scrolling on mobile */
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Enhanced mobile centering */
          .analytics-container {
            margin: 0 auto;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            max-width: calc(100% - 1.5rem);
          }
          
          .analytics-card {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
          }
          
          .analytics-table {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
          }
          
          /* Ensure proper spacing on mobile */
          .analytics-card + .analytics-card {
            margin-top: 1rem;
          }
        }
        
        /* Extra small mobile devices */
        @media (max-width: 480px) {
          .analytics-container {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            max-width: calc(100% - 1rem);
          }
          
          .analytics-card {
            padding: 0.75rem !important;
          }
          
          /* Ensure text is readable on very small screens */
          .analytics-card h2,
          .analytics-card h3 {
            font-size: 1rem !important;
            line-height: 1.4;
          }
        }
      `}</style>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#3F2E1E] mb-2">Event Registration Analytics</h1>

      {/* Year Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#3F2E1E] font-medium">Filter by Year:</label>
          <select
            value={selectedYear || 'all'}
            onChange={e => setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))}
            className="px-3 py-2 border border-[#f2e4ce] rounded-lg text-[#3F2E1E] bg-white min-w-[150px]"
          >
            <option value="all">All Years</option>
            {(() => {
              // Get available years from original unfiltered data
              const years = new Set();
              // Use original unfiltered monthly registrations for year calculation
              const dataToUse = originalMonthlyRegistrations.length > 0 
                ? originalMonthlyRegistrations 
                : (analyticsData.monthlyRegistrations || []);
              
              if (dataToUse.length > 0) {
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
              }
              // Fallback: generate years from current year going back 2 years
              if (years.size === 0) {
                const currentYear = new Date().getFullYear();
                for (let year = currentYear; year >= currentYear - 2; year--) {
                  years.add(year);
                }
              }
              return Array.from(years).sort((a, b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ));
            })()}
          </select>
        </div>
      </div>

      {/* Main Analytics Chart */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 main-bar-graph analytics-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#3F2E1E] text-center sm:text-left">
            Parish Analytics Overview {selectedYear ? `(${selectedYear})` : '(3 Years)'}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#3F2E1E] font-medium">Filter by Event:</label>
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-[#f2e4ce] rounded-lg text-[#3F2E1E] bg-white min-w-[200px]"
            >
              <option value="all">All Events</option>
              {events && events.length > 0 ? (
                events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title || `Event ${event.id}`}
                  </option>
                ))
              ) : events.length === 0 ? (
                <option disabled>No events available</option>
              ) : (
                <option disabled>Loading events...</option>
              )}
            </select>
          </div>
        </div>
        <div className="w-full">
          <ModernBarChart 
            monthlyData={analyticsData.monthlyRegistrations || []}
          />
        </div>
      </div>

      {/* Insights Section */}
      {(analyticsData.registrationInsights && Object.keys(analyticsData.registrationInsights).length > 0) || 
       (analyticsData.massAttendanceInsights && Object.keys(analyticsData.massAttendanceInsights).length > 0) ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3F2E1E] mb-6 text-center">
            📊 {selectedYear ? `${selectedYear} Analytics Insights` : '3-Year Analytics Insights'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Registration Insights */}
            {analyticsData.registrationInsights && Object.keys(analyticsData.registrationInsights).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-md border border-blue-100">
                <h3 className="text-lg font-bold text-[#3F2E1E] mb-4 flex items-center gap-2">
                  📅 Event Registration Insights
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Total {selectedYear ? `(${selectedYear})` : '(3 Years)'}</div>
                    <div className="text-2xl font-bold text-[#3F2E1E]">{analyticsData.registrationInsights.total_registrations?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Average Monthly</div>
                    <div className="text-2xl font-bold text-[#3F2E1E]">{analyticsData.registrationInsights.average_monthly?.toFixed(1) || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Peak Month</div>
                    <div className="text-lg font-bold text-green-600">
                      {analyticsData.registrationInsights.peak_month || 'N/A'}
                      {analyticsData.registrationInsights.peak_count && ` (${analyticsData.registrationInsights.peak_count})`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">Year-over-Year Growth</div>
                    <div className={`text-2xl font-bold ${(analyticsData.registrationInsights.year_over_year_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(analyticsData.registrationInsights.year_over_year_growth || 0) >= 0 ? '+' : ''}{analyticsData.registrationInsights.year_over_year_growth?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">2-Year Growth</div>
                    <div className={`text-2xl font-bold ${(analyticsData.registrationInsights.two_year_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(analyticsData.registrationInsights.two_year_growth || 0) >= 0 ? '+' : ''}{analyticsData.registrationInsights.two_year_growth?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">Current Trend</div>
                    <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                      analyticsData.registrationInsights.trend === 'increasing' ? 'bg-green-100 text-green-700' :
                      analyticsData.registrationInsights.trend === 'decreasing' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {analyticsData.registrationInsights.trend || 'stable'}
                    </div>
                  </div>
                  {analyticsData.registrationInsights.seasonal_pattern && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-[#5C4B38] mb-2">Seasonal Pattern</div>
                      <div className="text-sm">
                        <span className="font-semibold text-green-600">Peak:</span> {analyticsData.registrationInsights.seasonal_pattern.peak_season || 'N/A'} | 
                        <span className="font-semibold text-red-600 ml-2">Low:</span> {analyticsData.registrationInsights.seasonal_pattern.low_season || 'N/A'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mass Attendance Insights */}
            {analyticsData.massAttendanceInsights && Object.keys(analyticsData.massAttendanceInsights).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                <h3 className="text-lg font-bold text-[#3F2E1E] mb-4 flex items-center gap-2">
                  ⛪ Mass Attendance Insights
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Total {selectedYear ? `(${selectedYear})` : '(3 Years)'}</div>
                    <div className="text-2xl font-bold text-[#3F2E1E]">{analyticsData.massAttendanceInsights.total_attendance?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Average Monthly</div>
                    <div className="text-2xl font-bold text-[#3F2E1E]">{analyticsData.massAttendanceInsights.average_monthly?.toFixed(1) || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-1">Peak Month</div>
                    <div className="text-lg font-bold text-green-600">
                      {analyticsData.massAttendanceInsights.peak_month || 'N/A'}
                      {analyticsData.massAttendanceInsights.peak_count && ` (${analyticsData.massAttendanceInsights.peak_count})`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">Year-over-Year Growth</div>
                    <div className={`text-2xl font-bold ${(analyticsData.massAttendanceInsights.year_over_year_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(analyticsData.massAttendanceInsights.year_over_year_growth || 0) >= 0 ? '+' : ''}{analyticsData.massAttendanceInsights.year_over_year_growth?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">2-Year Growth</div>
                    <div className={`text-2xl font-bold ${(analyticsData.massAttendanceInsights.two_year_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(analyticsData.massAttendanceInsights.two_year_growth || 0) >= 0 ? '+' : ''}{analyticsData.massAttendanceInsights.two_year_growth?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5C4B38] mb-2">Current Trend</div>
                    <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                      analyticsData.massAttendanceInsights.trend === 'increasing' ? 'bg-green-100 text-green-700' :
                      analyticsData.massAttendanceInsights.trend === 'decreasing' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {analyticsData.massAttendanceInsights.trend || 'stable'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Month-over-Month Comparison Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3F2E1E] text-center sm:text-left">📊 Month-over-Month Analysis</h2>
          <div className="mt-2 sm:mt-0 flex gap-2">
            <button 
              onClick={fetchAnalyticsData}
              className="px-3 py-1 bg-[#CD8B3E] text-white rounded text-xs hover:bg-[#B77B35] transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 analytics-container">
          <AnalyticsComparison
            currentValue={analyticsData.comparisons?.registrations?.current || 0}
            previousValue={analyticsData.comparisons?.registrations?.previous || 0}
            label="Event Registrations"
            format="number"
            icon="📅"
            color="#CD8B3E"
            currentPeriod={selectedPeriods.current.label}
            comparePeriod={selectedPeriods.compare.label}
            showPeriodLabels={true}
          />
          <AnalyticsComparison
            currentValue={analyticsData.comparisons?.massAttendance?.current || 0}
            previousValue={analyticsData.comparisons?.massAttendance?.previous || 0}
            label="Mass Attendance"
            format="number"
            icon="⛪"
            color="#7C9D53"
            currentPeriod={selectedPeriods.current.label}
            comparePeriod={selectedPeriods.compare.label}
            showPeriodLabels={true}
          />
          <AnalyticsComparison
            currentValue={analyticsData.comparisons?.newMembers?.current || 0}
            previousValue={analyticsData.comparisons?.newMembers?.previous || 0}
            label="New Members"
            format="number"
            icon="👥"
            color="#3b82f6"
            currentPeriod={selectedPeriods.current.label}
            comparePeriod={selectedPeriods.compare.label}
            showPeriodLabels={true}
          />
          <AnalyticsComparison
            currentValue={analyticsData.comparisons?.families?.current || 0}
            previousValue={analyticsData.comparisons?.families?.previous || 0}
            label="Family Groups"
            format="number"
            icon="🏠"
            color="#8b5cf6"
            currentPeriod={selectedPeriods.current.label}
            comparePeriod={selectedPeriods.compare.label}
            showPeriodLabels={true}
          />
          <AnalyticsComparison
            currentValue={analyticsData.comparisons?.parishioners?.current || 0}
            previousValue={analyticsData.comparisons?.parishioners?.previous || 0}
            label="Total Parishioners"
            format="number"
            icon="🙏"
            color="#f59e0b"
            currentPeriod={selectedPeriods.current.label}
            comparePeriod={selectedPeriods.compare.label}
            showPeriodLabels={true}
          />
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 mb-8 analytics-card">
          <h3 className="text-lg sm:text-xl font-semibold text-[#3F2E1E] mb-4 text-center">
            📊 Detailed Breakdown - {selectedPeriods.current.label}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f9f5ef] border-b border-[#f2e4ce]">
                  <th className="text-left p-3 font-semibold text-[#3F2E1E]">Metric</th>
                  <th className="text-right p-3 font-semibold text-[#3F2E1E]">Current Period</th>
                  <th className="text-right p-3 font-semibold text-[#3F2E1E]">Previous Period</th>
                  <th className="text-right p-3 font-semibold text-[#3F2E1E]">Change</th>
                  <th className="text-right p-3 font-semibold text-[#3F2E1E]">% Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f2e4ce] hover:bg-[#f9f5ef]">
                  <td className="p-3 text-[#5C4B38]">📅 Event Registrations</td>
                  <td className="p-3 text-right font-semibold text-[#3F2E1E]">{(analyticsData.comparisons?.registrations?.current || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-[#5C4B38]">{(analyticsData.comparisons?.registrations?.previous || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.registrations?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.registrations?.change || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.registrations?.change || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.registrations?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.registrations?.percentageChange || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.registrations?.percentageChange || 0).toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-[#f2e4ce] hover:bg-[#f9f5ef]">
                  <td className="p-3 text-[#5C4B38]">⛪ Mass Attendance</td>
                  <td className="p-3 text-right font-semibold text-[#3F2E1E]">{(analyticsData.comparisons?.massAttendance?.current || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-[#5C4B38]">{(analyticsData.comparisons?.massAttendance?.previous || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.massAttendance?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.massAttendance?.change || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.massAttendance?.change || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.massAttendance?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.massAttendance?.percentageChange || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.massAttendance?.percentageChange || 0).toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-[#f2e4ce] hover:bg-[#f9f5ef]">
                  <td className="p-3 text-[#5C4B38]">👥 New Members</td>
                  <td className="p-3 text-right font-semibold text-[#3F2E1E]">{(analyticsData.comparisons?.newMembers?.current || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-[#5C4B38]">{(analyticsData.comparisons?.newMembers?.previous || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.newMembers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.newMembers?.change || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.newMembers?.change || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.newMembers?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.newMembers?.percentageChange || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.newMembers?.percentageChange || 0).toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-[#f2e4ce] hover:bg-[#f9f5ef]">
                  <td className="p-3 text-[#5C4B38]">🏠 Family Groups</td>
                  <td className="p-3 text-right font-semibold text-[#3F2E1E]">{(analyticsData.comparisons?.families?.current || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-[#5C4B38]">{(analyticsData.comparisons?.families?.previous || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.families?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.families?.change || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.families?.change || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.families?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.families?.percentageChange || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.families?.percentageChange || 0).toFixed(1)}%
                  </td>
                </tr>
                <tr className="hover:bg-[#f9f5ef]">
                  <td className="p-3 text-[#5C4B38]">🙏 Total Parishioners</td>
                  <td className="p-3 text-right font-semibold text-[#3F2E1E]">{(analyticsData.comparisons?.parishioners?.current || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-[#5C4B38]">{(analyticsData.comparisons?.parishioners?.previous || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.parishioners?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.parishioners?.change || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.parishioners?.change || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-semibold ${(analyticsData.comparisons?.parishioners?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analyticsData.comparisons?.parishioners?.percentageChange || 0) >= 0 ? '+' : ''}{(analyticsData.comparisons?.parishioners?.percentageChange || 0).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    {/* Parishioner Reports */}
    <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 analytics-container">
      {/* Monthly Parish Attendance */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 analytics-card">
        <div className="flex flex-col gap-3 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E]">Mass Attendance Trends</h2>
          <div className="flex flex-col gap-3">
            {/* View Type Selector */}
            <div className="flex items-center gap-2 bg-[#f9f5ef] rounded-full p-1 w-fit">
              {[
                { key: 'daily', label: 'Daily' },
                { key: 'weekly', label: 'Weekly' },
                { key: 'monthly', label: 'Monthly' },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setMassAttendanceView(option.key)}
                  className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full transition-colors ${
                    massAttendanceView === option.key
                      ? 'bg-[#806c4b] text-white'
                      : 'text-[#3F2E1E]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Month Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto relative">
                <label className="text-xs sm:text-sm text-[#5C4B38] font-medium whitespace-nowrap hidden sm:inline">Filter by Month:</label>
                <div className="relative w-full sm:w-auto" style={{ zIndex: 1000 }}>
                  <select
                    value={selectedMassMonth || 'all'}
                    onChange={(e) => setSelectedMassMonth(e.target.value === 'all' ? null : e.target.value)}
                    className="px-3 py-2 bg-white border border-[#e2cfa3] rounded-lg text-xs sm:text-sm text-[#3F2E1E] font-medium focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent w-full sm:w-auto sm:min-w-[180px] appearance-none cursor-pointer hover:border-[#CD8B3E] transition-colors"
                    style={{ 
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")", 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 0.75rem center', 
                      backgroundSize: '12px', 
                      paddingRight: '2.5rem'
                    }}
                  >
                <option value="all">All Months</option>
                {(() => {
                  const months = [];
                  const now = new Date();
                  // Generate last 36 months (3 years)
                  for (let i = 35; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    months.push(
                      <option key={`${year}-${month}`} value={`${year}-${month}`}>
                        {monthLabel}
                      </option>
                    );
                  }
                  return months;
                })()}
                  </select>
                </div>
              </div>
              <button
                onClick={handleDownloadMassAttendance}
                className="px-3 sm:px-4 py-2 bg-[#806c4b] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#6b5a3f] transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
        <BarChart 
          title={massAttendanceTitle}
          color="#7C9D53"
          data={(currentMassAttendanceSeries || []).map(item => ({
            label: item.label || item.month || item.date || '',
            count: item.count || 0
          }))}
        />
      </div>

      {/* Membership Status Distribution */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 analytics-card">
        <div className="flex flex-col gap-3 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E]">Membership Status</h2>
          {/* Month Filter Dropdown */}
          <div className="flex items-center gap-2 w-full relative">
            <label className="text-xs sm:text-sm text-[#5C4B38] font-medium whitespace-nowrap">Filter by Month:</label>
            <div className="relative flex-1" style={{ zIndex: 1000 }}>
              <select
                value={selectedMembershipMonth || 'all'}
                onChange={(e) => setSelectedMembershipMonth(e.target.value === 'all' ? null : e.target.value)}
                className="px-3 py-2 bg-white border border-[#e2cfa3] rounded-lg text-xs sm:text-sm text-[#3F2E1E] font-medium focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent w-full sm:w-auto sm:min-w-[180px] appearance-none cursor-pointer hover:border-[#CD8B3E] transition-colors"
                style={{ 
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")", 
                  backgroundRepeat: 'no-repeat', 
                  backgroundPosition: 'right 0.75rem center', 
                  backgroundSize: '12px', 
                  paddingRight: '2.5rem'
                }}
              >
              <option value="all">All Months</option>
              {(() => {
                const months = [];
                const now = new Date();
                // Generate last 36 months (3 years)
                for (let i = 35; i >= 0; i--) {
                  const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  months.push(
                    <option key={`${year}-${month}`} value={`${year}-${month}`}>
                      {monthLabel}
                    </option>
                  );
                }
                return months;
              })()}
              </select>
            </div>
          </div>
        </div>
        <BarChart 
          title={(() => {
            if (selectedMembershipMonth) {
              const [year, month] = selectedMembershipMonth.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              return `Members by Status - ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
            }
            return "Members by Status";
          })()}
          color="#8B5CF6"
          data={(analyticsData.membershipStatusDistribution || []).map(s => ({ 
            label: s.status === 'active' ? 'Active' : 
                   s.status === 'inactive' ? 'Inactive' : 
                   s.status === 'visitor' ? 'Visitor' : 
                   s.status === 'new_member' ? 'New Member' : s.status, 
            count: s.count 
          }))}
        />
      </div>
    </div>

      {/* Data Status Indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl mb-2">✅</div>
          <h3 className="font-semibold text-[#3F2E1E] mb-1">Event Participation</h3>
          <p className="text-sm text-green-700">Data Available</p>
          <p className="text-lg font-bold text-[#3F2E1E] mt-2">{analyticsData.totalParticipants} participants</p>
        </div>
      </div>

      {/* Recent Event Registrations Table */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 analytics-card analytics-table">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E]">Recent Event Registrations</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#3F2E1E] font-medium">Filter by Event:</label>
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-[#f2e4ce] rounded-lg text-[#3F2E1E] bg-white min-w-[200px]"
            >
              <option value="all">All Events</option>
              {events && events.length > 0 ? (
                events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title || `Event ${event.id}`}
                  </option>
                ))
              ) : events.length === 0 ? (
                <option disabled>No events available</option>
              ) : (
                <option disabled>Loading events...</option>
              )}
            </select>
            <button 
              onClick={fetchAnalyticsData}
              className="px-3 sm:px-4 py-2 bg-[#CD8B3E] text-white rounded-lg hover:bg-[#B77B35] transition-colors text-xs sm:text-sm w-full sm:w-auto"
            >
              Refresh Data
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f2e4ce]">
            <thead className="bg-[#FFF6E5]">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Event</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Participant</th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Email</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f2e4ce]">
              {analyticsData.recentRegistrations.map((registration, index) => (
                  <tr key={index} className="hover:bg-[#FFF6E5] transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E]">
                      {new Date(registration.date).toLocaleDateString()}
                    </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E] font-medium">
                      {registration.event}
                      {registration.event_archived && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          Archived
                        </span>
                      )}
                    </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E]">
                      {registration.participant}
                    </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-[#5C4B38]">
                      {registration.email}
                    </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Registered
                      </span>
                    </td>
                  </tr>
              ))}
              {analyticsData.recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-[#5C4B38]">
                    No recent registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Recent Mass Attendances Table */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 mt-4 sm:mt-6 analytics-card analytics-table">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E]">Recent Mass Attendances</h2>
          <button 
            onClick={fetchAnalyticsData}
            className="px-3 sm:px-4 py-2 bg-[#CD8B3E] text-white rounded-lg hover:bg-[#B77B35] transition-colors text-xs sm:text-sm w-full sm:w-auto"
          >
            Refresh Data
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f2e4ce]">
            <thead className="bg-[#FFF6E5]">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Mass</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Attendee</th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Email</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">People</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f2e4ce]">
              {analyticsData.recentMassAttendances && analyticsData.recentMassAttendances.length > 0 ? (
                analyticsData.recentMassAttendances.map((attendance, index) => (
                  <tr key={index} className="hover:bg-[#FFF6E5] transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E]">
                      {new Date(attendance.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E] font-medium">
                      {attendance.mass_schedule?.type || 'Mass'} - {attendance.mass_schedule?.day || ''}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E]">
                      {attendance.name}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-[#5C4B38]">
                      {attendance.email}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-[#3F2E1E]">
                      {attendance.number_of_people}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attendance.is_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attendance.is_confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-[#5C4B38]">
                    No mass attendances found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsReporting;
