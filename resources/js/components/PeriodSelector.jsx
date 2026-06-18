import React, { useState, useEffect, useRef, useCallback } from 'react';

const PeriodSelector = ({ 
  onPeriodChange, 
  onChange, 
  onSelect,
  // Controlled props: allow parent to pass selected periods as { year, month, label } or as period keys
  currentPeriod: controlledCurrentPeriod,
  comparePeriod: controlledComparePeriod,
  defaultCurrentPeriod = 'current-month',
  defaultComparePeriod = 'previous-month',
  showYearSelector = true,
  showMonthSelector = true,
  className = ''
}) => {
  const [currentPeriod, setCurrentPeriod] = useState(defaultCurrentPeriod);
  const [comparePeriod, setComparePeriod] = useState(defaultComparePeriod);
  const [customCurrentYear, setCustomCurrentYear] = useState(new Date().getFullYear());
  const [customCurrentMonth, setCustomCurrentMonth] = useState(new Date().getMonth() + 1);
  const nowInit = new Date();
  const nowYear = nowInit.getFullYear();
  const nowMonth = nowInit.getMonth() + 1; // 1-12
  const prevMonthInit = nowMonth === 1 ? 12 : nowMonth - 1;
  const prevYearInit = nowMonth === 1 ? nowYear - 1 : nowYear;
  const [customCompareYear, setCustomCompareYear] = useState(prevYearInit);
  const [customCompareMonth, setCustomCompareMonth] = useState(prevMonthInit);

  const months = [
    { value: 1, label: 'January', short: 'Jan' },
    { value: 2, label: 'February', short: 'Feb' },
    { value: 3, label: 'March', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'May', short: 'May' },
    { value: 6, label: 'June', short: 'Jun' },
    { value: 7, label: 'July', short: 'Jul' },
    { value: 8, label: 'August', short: 'Aug' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'October', short: 'Oct' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'December', short: 'Dec' }
  ];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };

  const getPeriodInfo = (period, customYear, customMonth) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Handle month-specific periods (month-1, month-2, etc.)
    if (period.startsWith('month-')) {
      const monthValue = parseInt(period.split('-')[1]);
      const monthName = months[monthValue - 1]?.short || 'Unknown';
      return { year: customYear, month: monthValue, label: `${monthName} ${customYear}` };
    }

    switch (period) {
      case 'current-month':
        const currentMonthName = months[currentMonth - 1]?.short || 'Unknown';
        return { year: currentYear, month: currentMonth, label: `${currentMonthName} ${currentYear}` };
      case 'previous-month':
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMonthName = months[prevMonth - 1]?.short || 'Unknown';
        return { year: prevYear, month: prevMonth, label: `${prevMonthName} ${prevYear}` };
      case 'current-year':
        return { year: currentYear, month: null, label: `Year ${currentYear}` };
      case 'previous-year':
        return { year: currentYear - 1, month: null, label: `Year ${currentYear - 1}` };
      case 'custom':
        return { 
          year: customYear, 
          month: customMonth, 
          label: `${months[customMonth - 1]?.short || 'Unknown'} ${customYear}` 
        };
      default:
        const defaultMonthName = months[currentMonth - 1]?.short || 'Unknown';
        return { year: currentYear, month: currentMonth, label: `${defaultMonthName} ${currentYear}` };
    }
  };

  // Support multiple callback prop names (onPeriodChange, onChange, onSelect)
  const onChangeRef = useRef(onPeriodChange || onChange || onSelect);
  useEffect(() => { onChangeRef.current = onPeriodChange || onChange || onSelect; }, [onPeriodChange, onChange, onSelect]);

  // If parent passes controlled periods, sync internal state
  const normalizeIncoming = (p, fallbackYear, fallbackMonth) => {
    if (!p) return null;
    // If already an object with year/month
    if (typeof p === 'object' && (p.year || p.month)) {
      return { year: p.year ?? fallbackYear, month: p.month ?? fallbackMonth, label: p.label };
    }
    // If string like 'month-10' or 'current-month'
    if (typeof p === 'string') {
      if (p.startsWith('month-')) {
        const v = parseInt(p.split('-')[1]);
        return { year: fallbackYear, month: v, label: undefined };
      }
      // For keys current-month/previous-month, use getPeriodInfo to resolve
      return getPeriodInfo(p, fallbackYear, fallbackMonth);
    }
    return null;
  };

  useEffect(() => {
    // Sync controlled currentPeriod
    if (controlledCurrentPeriod) {
      const now = new Date();
      const resolved = normalizeIncoming(controlledCurrentPeriod, now.getFullYear(), now.getMonth() + 1);
      if (resolved) {
        if (resolved.year) setCustomCurrentYear(resolved.year);
        if (resolved.month) setCustomCurrentMonth(resolved.month);
        // set the internal period key to month-N when month present
        if (resolved.month) setCurrentPeriod(`month-${resolved.month}`);
      }
    }
  }, [controlledCurrentPeriod]);

  useEffect(() => {
    // Sync controlled comparePeriod
    if (controlledComparePeriod) {
      const now = new Date();
      const resolved = normalizeIncoming(controlledComparePeriod, now.getFullYear(), now.getMonth() + 1);
      if (resolved) {
        if (resolved.year) setCustomCompareYear(resolved.year);
        if (resolved.month) setCustomCompareMonth(resolved.month);
        if (resolved.month) setComparePeriod(`month-${resolved.month}`);
      }
    }
  }, [controlledComparePeriod]);

  // Do not auto-emit on mount to avoid parent update loops; parent owns initial state

  return (
    <div className={`period-selector ${className}`} style={{
      backgroundColor: '#fff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f2e4ce',
      marginBottom: '1.5rem'
    }}>
      <h4 style={{ 
        color: '#3F2E1E', 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📅 Compare Periods
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Current Period */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#3F2E1E', 
            marginBottom: '0.5rem' 
          }}>
            Current Period
          </label>
          <input
            type="month"
            value={`${customCurrentYear}-${String(customCurrentMonth).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              const selYear = parseInt(year);
              const selMonth = parseInt(month);
              setCustomCurrentYear(selYear);
              setCustomCurrentMonth(selMonth);
              setCurrentPeriod(`month-${selMonth}`);
              const currentInfo = getPeriodInfo(`month-${selMonth}`, selYear, selMonth);
              let compareInfo;
              if (comparePeriod === 'previous-month') {
                const prevMonth = selMonth === 1 ? 12 : selMonth - 1;
                const prevYear = selMonth === 1 ? selYear - 1 : selYear;
                compareInfo = { year: prevYear, month: prevMonth, label: `${months[prevMonth - 1]?.short || 'Unknown'} ${prevYear}` };
                // Also update the compare input to reflect linked previous month
                setCustomCompareYear(prevYear);
                setCustomCompareMonth(prevMonth);
              } else if (comparePeriod === 'current-month') {
                compareInfo = { year: selYear, month: selMonth, label: `${months[selMonth - 1]?.short || 'Unknown'} ${selYear}` };
              } else {
                compareInfo = getPeriodInfo(comparePeriod, customCompareYear, customCompareMonth);
              }
              onChangeRef.current({ current: currentInfo, compare: compareInfo });
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #f2e4ce',
              borderRadius: '0.5rem',
              backgroundColor: '#FFF6E5',
              color: '#3F2E1E',
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}
          />
        </div>

        {/* Compare Period */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#3F2E1E', 
            marginBottom: '0.5rem' 
          }}>
            Compare To
          </label>
          <input
            type="month"
            value={`${customCompareYear}-${String(customCompareMonth).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setCustomCompareYear(parseInt(year));
              setCustomCompareMonth(parseInt(month));
              setComparePeriod(`month-${parseInt(month)}`);
              const currentInfo = getPeriodInfo(currentPeriod, customCurrentYear, customCurrentMonth);
              const compareInfo = getPeriodInfo(`month-${parseInt(month)}`, parseInt(year), parseInt(month));
              onChangeRef.current({ current: currentInfo, compare: compareInfo });
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #f2e4ce',
              borderRadius: '0.5rem',
              backgroundColor: '#FFF6E5',
              color: '#3F2E1E',
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}
          />
        </div>
      </div>

      {/* Period Summary */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: '#f9f5ef', 
        borderRadius: '0.5rem',
        border: '1px solid #f2e4ce'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#5C4B38' }}>
          <strong>Comparing:</strong> {months[customCurrentMonth - 1]?.short} {customCurrentYear}
          <span style={{ margin: '0 0.5rem', color: '#CD8B3E' }}>vs</span>
          {months[customCompareMonth - 1]?.short} {customCompareYear}
        </div>
      </div>
    </div>
  );
};

export default PeriodSelector;
