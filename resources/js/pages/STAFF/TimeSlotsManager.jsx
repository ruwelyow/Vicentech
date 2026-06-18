import React, { useState, useEffect } from 'react';

const TimeSlotsManager = ({ onBack, setError }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  const [editingSlot, setEditingSlot] = useState(null);
  const [editSlotData, setEditSlotData] = useState({ date: '', time: '', status: 'available', sacrament_type_id: '' });
  
  // Sacrament types state
  const [sacramentTypes, setSacramentTypes] = useState([]);
  const [sacramentTypesLoading, setSacramentTypesLoading] = useState(false);
  
  // Bulk month generation states
  const [showBulkGeneration, setShowBulkGeneration] = useState(false);
  const [bulkGenerationData, setBulkGenerationData] = useState({
    month: new Date().toISOString().slice(0, 7), // Current month in YYYY-MM format
    sacramentTypeId: '', // Selected sacrament type ID
    timeSlots: [
      { time: '08:00 AM - 09:30 AM', enabled: true },
      { time: '10:00 AM - 11:30 AM', enabled: true },
      { time: '02:00 PM - 03:30 PM', enabled: true },
      { time: '04:00 PM - 05:30 PM', enabled: true }
    ].sort((a, b) => {
      // Helper function to parse time for initial sorting
      const parseTime = (timeStr) => {
        const parts = timeStr.split(' - ');
        const startTime = parts[0].trim();
        const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          const period = match[3].toUpperCase();
          if (period === 'PM' && hour !== 12) hour += 12;
          else if (period === 'AM' && hour === 12) hour = 0;
          return hour * 60 + minute;
        }
        return 9999;
      };
      return parseTime(a.time) - parseTime(b.time);
    }),
    selectedDays: [], // Array of selected day numbers
    daySelectionMode: 'all' // 'all', 'weekdays', 'weekends', 'custom'
  });
  const [bulkGenerationLoading, setBulkGenerationLoading] = useState(false);
  const [editingTimeSlotIndex, setEditingTimeSlotIndex] = useState(null);
  const [editingTimeSlotValue, setEditingTimeSlotValue] = useState('');
  const [showGenerationPopup, setShowGenerationPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Time picker modal states
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerStart, setTimePickerStart] = useState({ hour: 8, minute: 0, period: 'AM' });
  const [timePickerEnd, setTimePickerEnd] = useState({ hour: 9, minute: 30, period: 'AM' });
  
  // Filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSacramentType, setFilterSacramentType] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'time', 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [deletingSlots, setDeletingSlots] = useState(false);

  const fetchTimeSlots = async () => {
    setTimeSlotsLoading(true);
    try {
      const response = await fetch('/api/staff/sacrament-time-slots', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      setTimeSlots(data);
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setTimeSlotsLoading(false);
    }
  };

  const fetchSacramentTypes = async () => {
    setSacramentTypesLoading(true);
    try {
      const response = await fetch('/api/staff/sacrament-types', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch sacrament types');
      const data = await response.json();
      setSacramentTypes(data);
      // Set default sacrament type if available
      if (data.length > 0 && !bulkGenerationData.sacramentTypeId) {
        setBulkGenerationData(prev => ({ ...prev, sacramentTypeId: data[0].id }));
      }
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setSacramentTypesLoading(false);
    }
  };

  // Helper function to parse time string and return minutes since midnight for sorting
  const parseStartTime = (timeString) => {
    if (!timeString) return 9999; // Put empty times at the end
    
    // Extract start time (before " - ")
    const parts = timeString.split(' - ');
    const startTime = parts[0].trim();
    
    // Parse time format like "7:00 AM" or "07:00 AM"
    const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return hour * 60 + minute; // Return minutes since midnight
    }
    
    return 9999; // If parsing fails, put at end
  };

  useEffect(() => { 
    fetchTimeSlots(); 
    fetchSacramentTypes();
  }, []);

  const handleEditTimeSlot = async (id) => {
    if (!editSlotData.date || !editSlotData.time) return;
    try {
      const response = await fetch(`/api/staff/sacrament-time-slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSlotData),
      });
      if (!response.ok) throw new Error('Failed to update time slot');
      setEditingSlot(null);
      setEditSlotData({ date: '', time: '', status: 'available' });
      await fetchTimeSlots();
    } catch (err) {
      setError && setError(err.message);
    }
  };

  const handleToggleTimeSlot = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'disabled' : 'available';
    try {
      const response = await fetch(`/api/staff/sacrament-time-slots/${id}/${newStatus === 'available' ? 'enable' : 'disable'}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update time slot status');
      await fetchTimeSlots();
    } catch (err) {
      setError && setError(err.message);
    }
  };

  // Bulk generation functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const isWeekend = (date) => {
    // Ensure we're working with local date to avoid timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = localDate.getDay();
    // Sunday = 0, Saturday = 6
    return day === 0 || day === 6;
  };

  const handleBulkGeneration = async () => {
    setBulkGenerationLoading(true);
    setShowGenerationPopup(true);
    try {
      const [year, month] = bulkGenerationData.month.split('-').map(Number);
      const enabledTimeSlots = bulkGenerationData.timeSlots.filter(slot => slot.enabled);
      
      if (enabledTimeSlots.length === 0) {
        setError && setError('Please enable at least one time slot to generate');
        return;
      }

      if (!bulkGenerationData.sacramentTypeId) {
        setError && setError('Please select a sacrament type for the time slots');
        return;
      }

      const daysToGenerate = getSelectedDays();
      if (daysToGenerate.length === 0) {
        setError && setError('Please select at least one day to generate time slots for');
        return;
      }

      const slotsToCreate = [];
      
      daysToGenerate.forEach(day => {
        // Create date in local time and format as YYYY-MM-DD without timezone conversion
        const currentDate = new Date(year, month - 1, day);
        // Format date as YYYY-MM-DD in local time (avoid UTC conversion)
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Create time slots for this selected day
        enabledTimeSlots.forEach(timeSlot => {
          slotsToCreate.push({
            date: dateString,
            time: timeSlot.time,
            status: 'available',
            sacrament_type_id: bulkGenerationData.sacramentTypeId
          });
        });
      });

      // Send bulk creation request
      const response = await fetch('/api/staff/sacrament-time-slots/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotsToCreate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate time slots');
      }

      const result = await response.json();
      await fetchTimeSlots();
      setShowBulkGeneration(false);
      setError && setError(null);
      
      // Show detailed success message
      const enabledSlotsCount = bulkGenerationData.timeSlots.filter(s => s.enabled).length;
      const generatedDays = getSelectedDays();
      const selectedSacramentType = sacramentTypes.find(type => type.id == bulkGenerationData.sacramentTypeId);
      let message = `Time slots generated for ${bulkGenerationData.month}:\n`;
      message += `✅ Created: ${result.created_count} time slots\n`;
      message += `📅 Generated for ${generatedDays.length} selected days\n`;
      message += `⏰ Each day has ${enabledSlotsCount} time slots\n`;
      message += `🙏 Sacrament Type: ${selectedSacramentType ? selectedSacramentType.name : 'Unknown'}\n`;
      if (result.skipped_count > 0) {
        message += `⚠️ Skipped: ${result.skipped_count} time slots (already exist)`;
      }
      setSuccessMessage(message);
      setShowSuccessPopup(true);
      
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setBulkGenerationLoading(false);
      setShowGenerationPopup(false);
    }
  };

  const handleTimeSlotToggle = (index) => {
    const updatedTimeSlots = [...bulkGenerationData.timeSlots];
    updatedTimeSlots[index].enabled = !updatedTimeSlots[index].enabled;
    setBulkGenerationData({ ...bulkGenerationData, timeSlots: updatedTimeSlots });
  };

  // Helper function to format time picker values to time string
  const formatTimeFromPicker = (timeObj) => {
    const hourStr = timeObj.hour.toString().padStart(2, '0');
    const minuteStr = timeObj.minute.toString().padStart(2, '0');
    return `${hourStr}:${minuteStr} ${timeObj.period}`;
  };

  const handleAddCustomTimeSlot = () => {
    // Reset time picker to default values
    setTimePickerStart({ hour: 8, minute: 0, period: 'AM' });
    setTimePickerEnd({ hour: 9, minute: 30, period: 'AM' });
    setShowTimePickerModal(true);
  };

  const handleConfirmTimeSlot = () => {
    const startTime = formatTimeFromPicker(timePickerStart);
    const endTime = formatTimeFromPicker(timePickerEnd);
    const newTime = `${startTime} - ${endTime}`;
    
    const updatedTimeSlots = [...bulkGenerationData.timeSlots, { time: newTime, enabled: true }];
    
    // Sort by time (earliest first) after adding
    updatedTimeSlots.sort((a, b) => {
      const timeA = parseStartTime(a.time);
      const timeB = parseStartTime(b.time);
      return timeA - timeB;
    });
    
    setBulkGenerationData({
      ...bulkGenerationData,
      timeSlots: updatedTimeSlots
    });
    
    setShowTimePickerModal(false);
  };

  const handleCancelTimeSlot = () => {
    setShowTimePickerModal(false);
  };

  const startEditingTimeSlot = (index) => {
    setEditingTimeSlotIndex(index);
    setEditingTimeSlotValue(bulkGenerationData.timeSlots[index].time);
  };

  const saveEditingTimeSlot = () => {
    if (editingTimeSlotValue && editingTimeSlotValue.trim()) {
      const updatedTimeSlots = [...bulkGenerationData.timeSlots];
      updatedTimeSlots[editingTimeSlotIndex] = { 
        ...updatedTimeSlots[editingTimeSlotIndex], 
        time: editingTimeSlotValue.trim() 
      };
      
      // Sort by time (earliest first) after editing
      updatedTimeSlots.sort((a, b) => {
        const timeA = parseStartTime(a.time);
        const timeB = parseStartTime(b.time);
        return timeA - timeB;
      });
      
      setBulkGenerationData({ ...bulkGenerationData, timeSlots: updatedTimeSlots });
    }
    setEditingTimeSlotIndex(null);
    setEditingTimeSlotValue('');
  };

  const cancelEditingTimeSlot = () => {
    setEditingTimeSlotIndex(null);
    setEditingTimeSlotValue('');
  };

  const handleRemoveCustomTimeSlot = (index) => {
    if (bulkGenerationData.timeSlots.length <= 1) {
      alert('Cannot remove time slot. At least one time slot is required.');
      return;
    }
    // If removing the last enabled slot, warn the user
    const enabledCount = bulkGenerationData.timeSlots.filter(s => s.enabled).length;
    if (bulkGenerationData.timeSlots[index].enabled && enabledCount === 1) {
      if (!confirm('This is the last enabled time slot. Removing it will leave no enabled slots. Continue?')) {
        return;
      }
    }
    const updatedTimeSlots = bulkGenerationData.timeSlots.filter((_, i) => i !== index);
    setBulkGenerationData({ ...bulkGenerationData, timeSlots: updatedTimeSlots });
  };

  // Day selection functions
  const getSelectedDays = () => {
    const [year, month] = bulkGenerationData.month.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);
    
    switch (bulkGenerationData.daySelectionMode) {
      case 'all':
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
      case 'weekdays':
        return Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .filter(day => {
            const date = new Date(year, month - 1, day);
            return !isWeekend(date);
          });
      case 'weekends':
        return Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .filter(day => {
            // Create date in local time - JavaScript months are 0-indexed (0=Jan, 11=Dec)
            // Use explicit date constructor to avoid any timezone issues
            const date = new Date(year, month - 1, day, 0, 0, 0, 0);
            const dayOfWeek = date.getDay();
            
            // getDay() returns: 
            // 0 = Sunday
            // 1 = Monday  
            // 2 = Tuesday
            // 3 = Wednesday
            // 4 = Thursday
            // 5 = Friday
            // 6 = Saturday
            
            // Weekends are Saturday (6) and Sunday (0) ONLY
            return dayOfWeek === 6 || dayOfWeek === 0;
          });
      case 'custom':
        return bulkGenerationData.selectedDays;
      default:
        return [];
    }
  };

  const handleDaySelectionModeChange = (mode) => {
    setBulkGenerationData({ 
      ...bulkGenerationData, 
      daySelectionMode: mode,
      selectedDays: mode === 'custom' ? bulkGenerationData.selectedDays : []
    });
  };

  const handleCustomDayToggle = (day) => {
    const updatedSelectedDays = bulkGenerationData.selectedDays.includes(day)
      ? bulkGenerationData.selectedDays.filter(d => d !== day)
      : [...bulkGenerationData.selectedDays, day].sort((a, b) => a - b);
    
    setBulkGenerationData({ ...bulkGenerationData, selectedDays: updatedSelectedDays });
  };

  const selectAllDays = () => {
    const [year, month] = bulkGenerationData.month.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);
    const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setBulkGenerationData({ ...bulkGenerationData, selectedDays: allDays });
  };

  const clearAllDays = () => {
    setBulkGenerationData({ ...bulkGenerationData, selectedDays: [] });
  };

  // Filter and sort functions
  const getFilteredAndSortedTimeSlots = () => {
    let filtered = timeSlots.filter(slot => {
      // Date filtering - match year-month format
      const matchesDate = !filterDate || slot.date.startsWith(filterDate);
      
      // Status filtering
      const matchesStatus = filterStatus === 'all' || slot.status === filterStatus;
      
      // Sacrament type filtering
      const matchesSacramentType = filterSacramentType === 'all' || 
        (slot.sacrament_type && slot.sacrament_type.id == filterSacramentType);
      
      return matchesDate && matchesStatus && matchesSacramentType;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'time':
          // Parse time strings for proper sorting
          aValue = parseStartTime(a.time);
          bValue = parseStartTime(b.time);
          // If same time, sort by date
          if (aValue === bValue) {
            aValue = new Date(a.date);
            bValue = new Date(b.date);
          }
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleBulkDelete = async () => {
    const filteredSlots = getFilteredAndSortedTimeSlots();
    
    if (filteredSlots.length === 0) {
      setError && setError('No time slots to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${filteredSlots.length} time slot(s)? This action cannot be undone.`)) {
      return;
    }

    setDeletingSlots(true);
    try {
      const slotIds = filteredSlots.map(slot => slot.id);
      const response = await fetch('/api/staff/sacrament-time-slots/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_ids: slotIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete time slots');
      }

      const result = await response.json();
      await fetchTimeSlots();
      
      // Clear filters after deletion
      setFilterDate('');
      setFilterSacramentType('all');
      setFilterStatus('all');
      
      setError && setError(null);
      alert(`Successfully deleted ${result.deleted_count} time slot(s)`);
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setDeletingSlots(false);
    }
  };

  const hasActiveFilters = () => {
    return filterDate !== '' || filterStatus !== 'all' || filterSacramentType !== 'all';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-[#f2e4ce] p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#3F2E1E]">Manage Time Slots</h2>
          <p className="text-[#5C4B38]">Add, edit, or remove available time slots</p>
        </div>
        <button
          onClick={() => setShowBulkGeneration(!showBulkGeneration)}
          className="px-4 py-2 bg-[#806c4b] text-white rounded-lg font-semibold hover:bg-[#6b5a3f] transition-colors duration-200 shadow-sm"
        >
          {showBulkGeneration ? 'Hide Bulk Generation' : 'Generate Monthly Slots'}
        </button>
      </div>

      {/* Bulk Generation Section */}
      {showBulkGeneration && (
        <div className="mb-6 p-4 bg-[#FFF6E5] rounded-lg border border-[#f2e4ce]">
          <h3 className="text-lg font-semibold text-[#3F2E1E] mb-4">Generate Time Slots for Selected Days</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-[#3F2E1E] mb-2">Select Month</label>
              <input
                type="month"
                value={bulkGenerationData.month}
                onChange={(e) => setBulkGenerationData({ 
                  ...bulkGenerationData, 
                  month: e.target.value,
                  selectedDays: [] // Reset custom selection when month changes
                })}
                className="w-full px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
              />
            </div>

            {/* Sacrament Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[#3F2E1E] mb-2">Sacrament Type</label>
              <select
                value={bulkGenerationData.sacramentTypeId}
                onChange={(e) => setBulkGenerationData({ 
                  ...bulkGenerationData, 
                  sacramentTypeId: e.target.value
                })}
                className="w-full px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
                disabled={sacramentTypesLoading}
              >
                <option value="">Select Sacrament Type</option>
                {sacramentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {sacramentTypesLoading && (
                <p className="text-xs text-[#5C4B38] mt-1">Loading sacrament types...</p>
              )}
            </div>

            {/* Day Selection Mode */}
            <div>
              <label className="block text-sm font-medium text-[#3F2E1E] mb-2">Days to Generate</label>
              <select
                value={bulkGenerationData.daySelectionMode}
                onChange={(e) => handleDaySelectionModeChange(e.target.value)}
                className="w-full px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
              >
                <option value="all">All Days</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="custom">Custom Selection</option>
              </select>
            </div>
          </div>

          {/* Custom Day Selection */}
          {bulkGenerationData.daySelectionMode === 'custom' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-[#3F2E1E]">
                  Select Specific Days ({bulkGenerationData.selectedDays.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllDays}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllDays}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 p-4 bg-gray-50 rounded-lg border border-[#f2e4ce]">
                {Array.from({ length: getDaysInMonth(...bulkGenerationData.month.split('-').map(Number)) }, (_, i) => i + 1).map(day => {
                  const [year, month] = bulkGenerationData.month.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isSelected = bulkGenerationData.selectedDays.includes(day);
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleCustomDayToggle(day)}
                      className={`p-2 text-sm rounded border transition-colors ${
                        isSelected 
                          ? 'bg-[#806c4b] text-white border-[#806c4b]' 
                          : isWeekend 
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                            : 'bg-white text-[#3F2E1E] border-[#f2e4ce] hover:bg-[#f9f6f1]'
                      }`}
                    >
                      <div className="font-medium">{day}</div>
                      <div className="text-xs opacity-75">{dayName}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-sm text-[#5C4B38]">
                <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded mr-1"></span>
                Weekend days are highlighted in red
              </div>
            </div>
          )}

          {/* Summary of Selected Days */}
          {bulkGenerationData.daySelectionMode !== 'custom' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected Days:</strong> {getSelectedDays().length} days will have time slots generated
                {bulkGenerationData.daySelectionMode === 'weekdays' && ' (Monday to Friday)'}
                {bulkGenerationData.daySelectionMode === 'weekends' && ' (Saturday and Sunday)'}
                {bulkGenerationData.daySelectionMode === 'all' && ' (All days of the month)'}
              </p>
            </div>
          )}

          {/* Time Slots Configuration */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-[#3F2E1E]">Time Slots Configuration</label>
              <button
                type="button"
                onClick={handleAddCustomTimeSlot}
                className="px-3 py-1 text-sm bg-[#806c4b] text-white rounded hover:bg-[#6b5a3f] transition-colors"
              >
                Add Custom Time
              </button>
            </div>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Every day will have exactly the enabled time slots below. 
                Ensure at least 1 slot is enabled.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {bulkGenerationData.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-[#f2e4ce]">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={() => handleTimeSlotToggle(index)}
                      className="rounded border-[#f2e4ce] text-[#806c4b] focus:ring-[#806c4b]"
                    />
                    {editingTimeSlotIndex === index ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingTimeSlotValue}
                          onChange={(e) => setEditingTimeSlotValue(e.target.value)}
                          className="flex-1 px-3 py-1 text-sm border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]"
                          placeholder="e.g., 08:00 AM - 09:30 AM"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEditingTimeSlot();
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditingTimeSlot();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={saveEditingTimeSlot}
                          className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingTimeSlot}
                          className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-[#3F2E1E] flex-1">{slot.time}</span>
                    )}
                  </div>
                  
                  {editingTimeSlotIndex !== index && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => startEditingTimeSlot(index)}
                        className="px-2 py-1 text-sm text-[#806c4b] hover:text-[#6b5a3f] border border-[#806c4b] rounded hover:bg-[#806c4b] hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTimeSlot(index)}
                        className="px-2 py-1 text-sm text-red-600 hover:text-white border border-red-600 rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm text-[#5C4B38]">
                <span className="font-medium">Enabled slots: {bulkGenerationData.timeSlots.filter(s => s.enabled).length}</span>
                {bulkGenerationData.timeSlots.filter(s => s.enabled).length === 0 ? (
                  <span className="text-red-600 font-medium"> (Need at least 1 enabled slot)</span>
                ) : (
                  <span className="text-green-600 font-medium"> ✓ Ready</span>
                )}
              </div>
              <div className="text-sm text-[#5C4B38]">
                Total slots: {bulkGenerationData.timeSlots.length}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleBulkGeneration}
              disabled={
                bulkGenerationLoading || 
                bulkGenerationData.timeSlots.filter(s => s.enabled).length === 0 ||
                getSelectedDays().length === 0
              }
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkGenerationLoading ? 'Generating...' : `Generate Time Slots (${getSelectedDays().length} days)`}
            </button>
          </div>
        </div>
      )}



      {/* Time Slots Table */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#3F2E1E]">Existing Time Slots</h3>
          <div className="text-sm text-[#5C4B38]">
            Total: {timeSlots.length} | Showing: {getFilteredAndSortedTimeSlots().length}
          </div>
        </div>


        

        
        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#3F2E1E] mb-1">Filter by Date</label>
            <input
              type="month"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3F2E1E] mb-1">Filter by Sacrament Type</label>
            <select
              value={filterSacramentType}
              onChange={(e) => setFilterSacramentType(e.target.value)}
              className="w-full px-3 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
            >
              <option value="all">All Types</option>
              {sacramentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3F2E1E] mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="disabled">Disabled</option>
              <option value="booked">Booked</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            {hasActiveFilters() && (
              <button
                onClick={handleBulkDelete}
                disabled={deletingSlots || getFilteredAndSortedTimeSlots().length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Delete all ${getFilteredAndSortedTimeSlots().length} filtered time slot(s)`}
              >
                {deletingSlots ? 'Deleting...' : `Delete All (${getFilteredAndSortedTimeSlots().length})`}
              </button>
            )}
            <button
              onClick={() => {
                setFilterDate('');
                setFilterSacramentType('all');
                setFilterStatus('all');
                setSortBy('date');
                setSortOrder('asc');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {timeSlotsLoading ? (
          <div className="text-center py-8"><p className="text-[#5C4B38]">Loading time slots...</p></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f2e4ce]">
            <thead className="bg-[#FFF6E5]">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider cursor-pointer hover:bg-[#f2e4ce] transition-colors"
                  onClick={() => handleSort('date')}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider cursor-pointer hover:bg-[#f2e4ce] transition-colors"
                  onClick={() => handleSort('time')}
                >
                  Time {getSortIcon('time')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">
                  Sacrament Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider cursor-pointer hover:bg-[#f2e4ce] transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f2e4ce]">
              {getFilteredAndSortedTimeSlots().length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#5C4B38]">
                    {timeSlots.length === 0 ? 'No time slots found. Use "Generate Monthly Slots" to create time slots for an entire month.' : 'No time slots match your current filters.'}
                  </td>
                </tr>
              ) : (
                getFilteredAndSortedTimeSlots().map(slot => (
                <tr key={slot.id} className="hover:bg-[#f9f6f1] transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3F2E1E]">
                    {editingSlot === slot.id ? (
                      <input type="date" value={editSlotData.date} onChange={e => setEditSlotData({ ...editSlotData, date: e.target.value })} className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]" />
                    ) : new Date(slot.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3F2E1E]">
                    {editingSlot === slot.id ? (
                      <input type="text" value={editSlotData.time} onChange={e => setEditSlotData({ ...editSlotData, time: e.target.value })} className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]" />
                    ) : slot.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3F2E1E]">
                    {editingSlot === slot.id ? (
                      <select 
                        value={editSlotData.sacrament_type_id} 
                        onChange={e => setEditSlotData({ ...editSlotData, sacrament_type_id: e.target.value })} 
                        className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]"
                      >
                        <option value="">Select Type</option>
                        {sacramentTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    ) : (slot.sacrament_type ? slot.sacrament_type.name : 'No Type Assigned')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingSlot === slot.id ? (
                      <select value={editSlotData.status} onChange={e => setEditSlotData({ ...editSlotData, status: e.target.value })} className="px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]">
                        <option value="available">Available</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${slot.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingSlot === slot.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditTimeSlot(slot.id)} className="text-green-600 hover:text-green-800 font-semibold">Save</button>
                        <button onClick={() => { setEditingSlot(null); setEditSlotData({ date: '', time: '', status: 'available', sacrament_type_id: '' }); }} className="text-gray-600 hover:text-gray-800 font-semibold">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingSlot(slot.id); setEditSlotData({ date: slot.date, time: slot.time, status: slot.status, sacrament_type_id: slot.sacrament_type ? slot.sacrament_type.id : '' }); }} className="text-[#806c4b] hover:text-[#6b5a3f] font-semibold">Edit</button>
                        <button onClick={() => handleToggleTimeSlot(slot.id, slot.status)} className={`font-semibold ${slot.status === 'available' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>{slot.status === 'available' ? 'Disable' : 'Enable'}</button>
                      </div>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

       {/* Generation Popup - Same design as profile upload/edit popup */}
       {showGenerationPopup && (
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
               Generating time slots...
             </div>
           </div>
         </div>
       )}

       {/* Time Picker Modal */}
       {showTimePickerModal && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100vw',
           height: '100vh',
           background: 'rgba(0,0,0,0.4)',
           zIndex: 10000,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           backdropFilter: 'blur(6px)',
           WebkitBackdropFilter: 'blur(6px)',
         }}>
           <div style={{
             width: 560,
             maxWidth: '94%',
             background: '#fff',
             borderRadius: 12,
             padding: 20,
             boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
             position: 'relative'
           }}>
             <button 
               onClick={handleCancelTimeSlot}
               style={{
                 position: 'absolute',
                 top: 12,
                 right: 12,
                 background: 'none',
                 border: 'none',
                 fontSize: '24px',
                 cursor: 'pointer',
                 color: '#666',
                 width: '32px',
                 height: '32px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 borderRadius: '50%',
                 transition: 'background-color 0.2s'
               }}
               onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
               onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
             >
               ×
             </button>
             
             <div style={{
               background: 'linear-gradient(135deg, #806c4b 0%, #6b5a3f 100%)',
               borderRadius: '12px 12px 0 0',
               padding: '20px',
               margin: '-20px -20px 20px -20px',
               color: 'white',
               textAlign: 'center',
               position: 'relative',
               overflow: 'hidden'
             }}>
               <h3 style={{ 
                 fontSize: '1.5rem', 
                 fontWeight: '800', 
                 margin: '0',
                 textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
               }}>
                 Add Custom Time Slot
               </h3>
             </div>

             <div style={{ padding: '20px 0' }}>
               {/* Start Time */}
               <div style={{ marginBottom: 24 }}>
                 <label style={{ 
                   display: 'block', 
                   fontWeight: 600, 
                   color: '#3F2E1E', 
                   marginBottom: 12,
                   fontSize: 15
                 }}>
                   Start Time
                 </label>
                 <div style={{ 
                   display: 'flex', 
                   gap: 12, 
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   {/* Hour Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Hour</label>
                     <select
                       value={timePickerStart.hour}
                       onChange={(e) => setTimePickerStart({ ...timePickerStart, hour: parseInt(e.target.value, 10) })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                         <option key={hour} value={hour}>{hour}</option>
                       ))}
                     </select>
                   </div>

                   {/* Minute Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Minute</label>
                     <select
                       value={timePickerStart.minute}
                       onChange={(e) => setTimePickerStart({ ...timePickerStart, minute: parseInt(e.target.value, 10) })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       {[0, 15, 30, 45].map(minute => (
                         <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                       ))}
                     </select>
                   </div>

                   {/* AM/PM Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Period</label>
                     <select
                       value={timePickerStart.period}
                       onChange={(e) => setTimePickerStart({ ...timePickerStart, period: e.target.value })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       <option value="AM">AM</option>
                       <option value="PM">PM</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* End Time */}
               <div style={{ marginBottom: 24 }}>
                 <label style={{ 
                   display: 'block', 
                   fontWeight: 600, 
                   color: '#3F2E1E', 
                   marginBottom: 12,
                   fontSize: 15
                 }}>
                   End Time
                 </label>
                 <div style={{ 
                   display: 'flex', 
                   gap: 12, 
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   {/* Hour Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Hour</label>
                     <select
                       value={timePickerEnd.hour}
                       onChange={(e) => setTimePickerEnd({ ...timePickerEnd, hour: parseInt(e.target.value, 10) })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                         <option key={hour} value={hour}>{hour}</option>
                       ))}
                     </select>
                   </div>

                   {/* Minute Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Minute</label>
                     <select
                       value={timePickerEnd.minute}
                       onChange={(e) => setTimePickerEnd({ ...timePickerEnd, minute: parseInt(e.target.value, 10) })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       {[0, 15, 30, 45].map(minute => (
                         <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                       ))}
                     </select>
                   </div>

                   {/* AM/PM Dropdown */}
                   <div style={{ flex: 1, position: 'relative' }}>
                     <label style={{ 
                       fontSize: 12, 
                       color: '#5C4B38', 
                       marginBottom: 6, 
                       display: 'block',
                       fontWeight: 500
                     }}>Period</label>
                     <select
                       value={timePickerEnd.period}
                       onChange={(e) => setTimePickerEnd({ ...timePickerEnd, period: e.target.value })}
                       style={{
                         width: '100%',
                         padding: '10px 14px',
                         borderRadius: 8,
                         border: '1.5px solid #f2e4ce',
                         fontSize: 16,
                         color: '#3F2E1E',
                         background: '#fff',
                         cursor: 'pointer',
                         outline: 'none',
                         appearance: 'none',
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233F2E1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                         backgroundRepeat: 'no-repeat',
                         backgroundPosition: 'right 14px center',
                         paddingRight: 40
                       }}
                     >
                       <option value="AM">AM</option>
                       <option value="PM">PM</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* Preview */}
               <div style={{
                 padding: 16,
                 background: '#FFF6E5',
                 borderRadius: 8,
                 border: '1px solid #f2e4ce',
                 marginBottom: 20,
                 textAlign: 'center'
               }}>
                 <div style={{ fontSize: 12, color: '#5C4B38', marginBottom: 4 }}>Preview</div>
                 <div style={{ fontSize: 18, fontWeight: 600, color: '#3F2E1E' }}>
                   {formatTimeFromPicker(timePickerStart)} - {formatTimeFromPicker(timePickerEnd)}
                 </div>
               </div>

               {/* Action Buttons */}
               <div style={{ 
                 display: 'flex', 
                 gap: 12,
                 justifyContent: 'flex-end'
               }}>
                 <button 
                   onClick={handleCancelTimeSlot}
                   style={{ 
                     background: '#e2e2e2', 
                     color: '#3F2E1E', 
                     border: 'none', 
                     padding: '12px 24px', 
                     borderRadius: '8px',
                     fontSize: 15,
                     fontWeight: '600',
                     cursor: 'pointer',
                     transition: 'background-color 0.2s',
                   }}
                   onMouseEnter={(e) => e.target.style.backgroundColor = '#d0d0d0'}
                   onMouseLeave={(e) => e.target.style.backgroundColor = '#e2e2e2'}
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleConfirmTimeSlot}
                   style={{ 
                     background: '#806c4b', 
                     color: '#fff', 
                     border: 'none', 
                     padding: '12px 24px', 
                     borderRadius: '8px',
                     fontSize: 15,
                     fontWeight: '600',
                     cursor: 'pointer',
                     transition: 'background-color 0.2s',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                   }}
                   onMouseEnter={(e) => e.target.style.backgroundColor = '#6b5a3f'}
                   onMouseLeave={(e) => e.target.style.backgroundColor = '#806c4b'}
                 >
                   Add Time Slot
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Success Popup - Same design as profile edit popup */}
       {showSuccessPopup && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100vw',
           height: '100vh',
           background: 'rgba(0,0,0,0.4)',
           zIndex: 10000,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           backdropFilter: 'blur(6px)',
           WebkitBackdropFilter: 'blur(6px)',
         }}>
           <div style={{
             width: 560,
             maxWidth: '94%',
             background: '#fff',
             borderRadius: 12,
             padding: 20,
             boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
             position: 'relative'
           }}>
             <button 
               onClick={() => setShowSuccessPopup(false)}
               style={{
                 position: 'absolute',
                 top: 12,
                 right: 12,
                 background: 'none',
                 border: 'none',
                 fontSize: '24px',
                 cursor: 'pointer',
                 color: '#666',
                 width: '32px',
                 height: '32px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 borderRadius: '50%',
                 transition: 'background-color 0.2s'
               }}
               onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
               onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
             >
               ×
             </button>
             
             <div style={{
               background: 'linear-gradient(135deg, #806c4b 0%, #6b5a3f 100%)',
               borderRadius: '12px 12px 0 0',
               padding: '20px',
               margin: '-20px -20px 20px -20px',
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
               
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 12,
                 marginBottom: 8,
                 position: 'relative',
                 zIndex: 1
               }}>
                 <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <h3 style={{ 
                   fontSize: '1.5rem', 
                   fontWeight: '800', 
                   margin: '0',
                   textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                 }}>
                   Time Slots Generated Successfully!
                 </h3>
               </div>
               <p style={{ 
                 fontSize: '0.9rem', 
                 margin: '0', 
                 opacity: 0.9,
                 position: 'relative',
                 zIndex: 1
               }}>
                 Your time slots have been created successfully
               </p>
             </div>

             <div style={{
               padding: '0 0 20px 0',
               maxHeight: '300px',
               overflowY: 'auto'
             }}>
               <pre style={{
                 whiteSpace: 'pre-wrap',
                 fontFamily: 'inherit',
                 fontSize: '14px',
                 lineHeight: '1.5',
                 color: '#3F2E1E',
                 margin: 0,
                 padding: '16px',
                 background: '#f8f9fa',
                 borderRadius: '8px',
                 border: '1px solid #e9ecef'
               }}>
                 {successMessage}
               </pre>
             </div>

             <div style={{ 
               display: 'flex', 
               justifyContent: 'center', 
               marginTop: '20px' 
             }}>
               <button 
                 onClick={() => setShowSuccessPopup(false)}
                 style={{ 
                   background: '#806c4b', 
                   color: '#fff', 
                   border: 'none', 
                   padding: '12px 24px', 
                   borderRadius: '8px',
                   fontSize: '16px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'background-color 0.2s',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                 }}
                 onMouseEnter={(e) => e.target.style.backgroundColor = '#6b5a3f'}
                 onMouseLeave={(e) => e.target.style.backgroundColor = '#806c4b'}
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default TimeSlotsManager; 