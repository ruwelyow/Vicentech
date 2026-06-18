import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/axios';
import PeriodSelector from '../../components/PeriodSelector';
import AnalyticsComparison from '../../components/AnalyticsComparison';
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

const DonationAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [monthlyDonations, setMonthlyDonations] = useState([]); // [{ key: 'YYYY-MM', month: 'Oct 2025', total: 0, count: 0 }]
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1; // 1-12
    const pm = cm === 1 ? 12 : cm - 1;
    const py = cm === 1 ? cy - 1 : cy;
    const currentLabel = `${now.toLocaleString('default', { month: 'short' })} ${cy}`;
    const prevLabel = `${new Date(py, pm - 1, 1).toLocaleString('default', { month: 'short' })} ${py}`;
    return { current: { year: cy, month: cm, label: currentLabel }, compare: { year: py, month: pm, label: prevLabel } };
  });
  const [comparisons, setComparisons] = useState({ current: 0, previous: 0 });

  // Purpose filter
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [allPurposes, setAllPurposes] = useState([]);
  
  // Year filter
  const [selectedYear, setSelectedYear] = useState(null); // null = all years, or specific year like 2023
  // Calculate available years from ALL donations, not filtered monthly data
  const availableYears = useMemo(() => {
    if (!donations || donations.length === 0) return [];
    const years = new Set();
    donations.forEach(d => {
      const created = d.created_at || d.createdAt || d.date || d.timestamp;
      if (!created) return;
      const dt = new Date(created);
      if (!isNaN(dt)) {
        years.add(dt.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }, [donations]);

  const formatKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
  
  // Filter monthly donations by selected year
  const filteredByYear = useMemo(() => {
    if (!selectedYear) return monthlyDonations;
    return monthlyDonations.filter(m => {
      const year = new Date(m.month + ' 1').getFullYear();
      return year === selectedYear;
    });
  }, [monthlyDonations, selectedYear]);

  // Calculate comprehensive donation insights
  const calculateDonationInsights = (monthlyData, allDonations = [], yearFilter = null) => {
    if (!monthlyData || monthlyData.length === 0) return {};
    
    const totals = monthlyData.map(m => m.total || 0);
    const counts = monthlyData.map(m => m.count || 0);
    const total = totals.reduce((sum, t) => sum + t, 0);
    const totalCount = counts.reduce((sum, c) => sum + c, 0);
    const averageMonthly = monthlyData.length > 0 ? total / monthlyData.length : 0;
    const averageDonation = totalCount > 0 ? total / totalCount : 0;
    
    // If year filter is active, compare with previous year of the same period
    let currentYear, previousYear, twoYearsAgo;
    if (yearFilter) {
      // For a specific year, compare with previous year
      currentYear = totals; // All months of selected year
      // Get previous year data from full dataset (extract year from key format: "YYYY-MM")
      const prevYearData = monthlyDonations.filter(m => {
        if (!m.key) return false;
        const year = parseInt(m.key.split('-')[0]);
        return year === yearFilter - 1;
      });
      previousYear = prevYearData.map(m => m.total || 0);
      const twoYearsAgoData = monthlyDonations.filter(m => {
        if (!m.key) return false;
        const year = parseInt(m.key.split('-')[0]);
        return year === yearFilter - 2;
      });
      twoYearsAgo = twoYearsAgoData.map(m => m.total || 0);
    } else {
      // For all years, use last 12 months vs previous 12 months
      currentYear = totals.slice(-12);
      previousYear = totals.slice(-24, 12);
      twoYearsAgo = totals.slice(-36, 12);
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
    
    // Trend analysis - for year filter, compare first half vs second half
    let recentMonths, olderMonths;
    if (yearFilter && monthlyData.length >= 6) {
      // For specific year, compare first 6 months vs last 6 months
      recentMonths = totals.slice(-6);
      olderMonths = totals.slice(0, 6);
    } else {
      // For all years, compare last 6 months vs previous 6 months
      recentMonths = totals.slice(-6);
      olderMonths = totals.slice(-12, 6);
    }
    const recentAvg = recentMonths.length > 0 ? recentMonths.reduce((sum, t) => sum + t, 0) / recentMonths.length : 0;
    const olderAvg = olderMonths.length > 0 ? olderMonths.reduce((sum, t) => sum + t, 0) / olderMonths.length : recentAvg;
    const trendPercentage = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100 * 10) / 10 : 0;
    
    let trend = 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    }
    
    // Find peak and low months
    const maxIndex = totals.indexOf(Math.max(...totals));
    const minIndex = totals.indexOf(Math.min(...totals.filter(t => t > 0)));
    
    // Calculate average donation per month trend
    const avgDonationsPerMonth = monthlyData.map(m => m.count > 0 ? m.total / m.count : 0);
    const recentAvgDonation = recentMonths.map((_, idx) => {
      const monthIdx = monthlyData.length - 6 + idx;
      return monthlyData[monthIdx]?.count > 0 ? monthlyData[monthIdx].total / monthlyData[monthIdx].count : 0;
    }).filter(v => v > 0);
    const olderAvgDonation = olderMonths.map((_, idx) => {
      const monthIdx = monthlyData.length - 12 + idx;
      return monthlyData[monthIdx]?.count > 0 ? monthlyData[monthIdx].total / monthlyData[monthIdx].count : 0;
    }).filter(v => v > 0);
    
    const recentAvgDonationAmount = recentAvgDonation.length > 0 
      ? recentAvgDonation.reduce((sum, a) => sum + a, 0) / recentAvgDonation.length 
      : 0;
    const olderAvgDonationAmount = olderAvgDonation.length > 0
      ? olderAvgDonation.reduce((sum, a) => sum + a, 0) / olderAvgDonation.length
      : 0;
    const avgDonationTrend = olderAvgDonationAmount > 0
      ? Math.round(((recentAvgDonationAmount - olderAvgDonationAmount) / olderAvgDonationAmount) * 100 * 10) / 10
      : 0;
    
    // Seasonal pattern detection
    const seasonalPattern = detectSeasonalPattern(monthlyData);
    
    // Donation count trends
    const currentYearCount = counts.slice(-12).reduce((sum, c) => sum + c, 0);
    const previousYearCount = counts.slice(-24, 12).reduce((sum, c) => sum + c, 0);
    const donationCountGrowth = previousYearCount > 0
      ? Math.round(((currentYearCount - previousYearCount) / previousYearCount) * 100 * 10) / 10
      : 0;
    
    // Calculate consistency (coefficient of variation)
    const mean = averageMonthly;
    const variance = totals.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / totals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;
    const consistency = coefficientOfVariation < 30 ? 'high' : (coefficientOfVariation < 50 ? 'medium' : 'low');
    
    return {
      total,
      totalCount,
      averageMonthly,
      averageDonation,
      yoyGrowth,
      twoYearGrowth,
      trend,
      trendPercentage,
      peakMonth: monthlyData[maxIndex]?.month || 'N/A',
      peakAmount: totals[maxIndex] || 0,
      peakCount: counts[maxIndex] || 0,
      lowMonth: monthlyData[minIndex]?.month || 'N/A',
      lowAmount: totals[minIndex] || 0,
      lowCount: counts[minIndex] || 0,
      currentYearTotal,
      previousYearTotal,
      twoYearsAgoTotal,
      currentYearCount,
      previousYearCount,
      donationCountGrowth,
      avgDonationTrend,
      seasonalPattern,
      consistency,
      coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10
    };
  };
  
  // Detect seasonal patterns in donations
  const detectSeasonalPattern = (monthlyData) => {
    if (monthlyData.length < 12) return null;
    
    // Group by month name across all years
    const monthlyGroups = {};
    monthlyData.forEach(item => {
      const monthName = new Date(item.month + ' 1').toLocaleString('default', { month: 'short' });
      if (!monthlyGroups[monthName]) {
        monthlyGroups[monthName] = [];
      }
      monthlyGroups[monthName].push(item.total || 0);
    });
    
    // Calculate average for each month
    const monthlyAverages = {};
    Object.keys(monthlyGroups).forEach(month => {
      const values = monthlyGroups[month];
      monthlyAverages[month] = values.reduce((sum, v) => sum + v, 0) / values.length;
    });
    
    // Find peak and low seasons
    const peakMonth = Object.keys(monthlyAverages).reduce((a, b) => 
      monthlyAverages[a] > monthlyAverages[b] ? a : b
    );
    const lowMonth = Object.keys(monthlyAverages).reduce((a, b) => 
      monthlyAverages[a] < monthlyAverages[b] ? a : b
    );
    
    return {
      peakSeason: peakMonth,
      lowSeason: lowMonth,
      monthlyAverages
    };
  };

  // Fetch donation purposes (ID+name) - including archived ones like events
  useEffect(() => {
    api.get('/admin/donation-purposes').then(res => {
      // Get all purposes including archived ones (similar to events)
      setAllPurposes(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {
      // Fallback to public endpoint if admin endpoint fails
      api.get('/donation-purposes').then(res => {
        setAllPurposes(Array.isArray(res.data) ? res.data : []);
      });
    });
  }, []);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const res = await api.get('/donations');
        const rows = Array.isArray(res.data) ? res.data : [];
        // Only consider verified donations
        const verified = rows.filter(d => d && (d.verified === true || d.verified === 1 || d.verified === '1'));
        setDonations(verified);

        // Build last 36 months (3 years) buckets with stable keys
        const months = [];
        const now = new Date();
        for (let i = 35; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            key: formatKey(dt.getFullYear(), dt.getMonth() + 1),
            month: dt.toLocaleString(undefined, { month: 'short', year: 'numeric' }),
            total: 0,
            count: 0
          });
        }
        const keyToIndex = Object.fromEntries(months.map((m, idx) => [m.key, idx]));
        verified.forEach(d => {
          const created = d.created_at || d.createdAt || d.date || d.timestamp;
          if (!created) return;
          const dt = new Date(created);
          if (isNaN(dt)) return;
          const key = formatKey(dt.getFullYear(), dt.getMonth() + 1);
          const idx = keyToIndex[key];
          if (typeof idx === 'number') {
            months[idx].total += Number(d.amount || 0);
            months[idx].count += 1;
          }
        });
        setMonthlyDonations(months);
      } catch (e) {
        setDonations([]);
        setMonthlyDonations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  useEffect(() => {
    if (donations.length > 0) {
      const purposeFields = donations.map(d => ({
        purpose_id: d.purpose_id,
        purpose: d.purpose,
        purpose_name: d.purpose_name,
        category: d.category,
        nestedPurposeId: d.purpose && d.purpose.id,
        nestedPurposeName: d.purpose && d.purpose.name,
      }));
      console.log('--- All donation purpose fields (unique):');
      [...new Set(purposeFields.map(JSON.stringify))].map(x => console.log(JSON.parse(x)));
    }
  }, [donations]);

  const handlePeriodChange = (periods) => {
    // Normalize the incoming periods so we consistently store { year, month (1-12), label }
    if (!periods) return;
    const normalizePart = (part, fallback) => {
      if (!part) return fallback;
      let year = part.year ?? part.y ?? fallback.year;
      // Identify source of month to avoid off-by-one
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

    setSelectedPeriods(prev => ({
      current: normalizePart(periods.current, prev.current),
      compare: normalizePart(periods.compare, prev.compare)
    }));
  };

  const filterMatchesPurpose = (d, val) => {
    val = String(val).trim().toLowerCase();
    if (d.purpose_id !== undefined && String(d.purpose_id).trim().toLowerCase() === val) return true;
    if (d.purpose && typeof d.purpose === 'object') {
      if (d.purpose.id !== undefined && String(d.purpose.id).trim().toLowerCase() === val) return true;
      if (d.purpose.name && String(d.purpose.name).trim().toLowerCase() === val) return true;
    }
    if (d.purpose && typeof d.purpose === 'string' && d.purpose.trim().toLowerCase() === val) return true;
    if (d.purpose_name && String(d.purpose_name).trim().toLowerCase() === val) return true;
    if (d.category && String(d.category).trim().toLowerCase() === val) return true;
    return false;
  };

  const filteredVerifiedDonations = useMemo(() => {
    if (purposeFilter === 'all') return donations;
    return donations.filter(d => filterMatchesPurpose(d, purposeFilter));
  }, [donations, purposeFilter]);

  // Recompute the stats for only filtered donations
  const filteredTotal = useMemo(() => filteredVerifiedDonations.reduce((s, d) => s + Number(d.amount || 0), 0), [filteredVerifiedDonations]);

  // Rebuild selected-month blocks for only filtered donations
  const filteredMonthlyDonations = useMemo(() => {
    // Only rebuild for filtered donations - 36 months (3 years) or selected year
    const months = [];
    const now = new Date();
    
    if (selectedYear) {
      // Build only for selected year
      for (let month = 1; month <= 12; month++) {
        const dt = new Date(selectedYear, month - 1, 1);
        months.push({
          key: formatKey(selectedYear, month),
          month: dt.toLocaleString(undefined, { month: 'short', year: 'numeric' }),
          total: 0,
          count: 0,
        });
      }
    } else {
      // Build for all 36 months (3 years)
      for (let i = 35; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: formatKey(dt.getFullYear(), dt.getMonth() + 1),
          month: dt.toLocaleString(undefined, { month: 'short', year: 'numeric' }),
          total: 0,
          count: 0,
        });
      }
    }
    
    const keyToIndex = Object.fromEntries(months.map((m, idx) => [m.key, idx]));
    filteredVerifiedDonations.forEach(d => {
      const created = d.created_at || d.createdAt || d.date || d.timestamp;
      if (!created) return;
      const dt = new Date(created);
      if (isNaN(dt)) return;
      
      // Filter by year if selected
      if (selectedYear && dt.getFullYear() !== selectedYear) return;
      
      const key = formatKey(dt.getFullYear(), dt.getMonth() + 1);
      const idx = keyToIndex[key];
      if (typeof idx === 'number') {
        months[idx].total += Number(d.amount || 0);
        months[idx].count += 1;
      }
    });
    return months;
  }, [filteredVerifiedDonations, selectedYear]);

  // Only show selected periods in bar chart, from filteredMonthlyDonations
  const filteredDonations = useMemo(() => {
    if (!selectedPeriods || filteredMonthlyDonations.length === 0) return [];
    // Always show current + compare periods only
    const keys = [
      `${selectedPeriods.current.year}-${String(selectedPeriods.current.month).padStart(2, '0')}`,
      `${selectedPeriods.compare.year}-${String(selectedPeriods.compare.month).padStart(2, '0')}`
    ];
    return filteredMonthlyDonations.filter(m => keys.includes(m.key));
  }, [selectedPeriods, filteredMonthlyDonations]);

  // Calculate comparison stats for filtered months
  useEffect(() => {
    if (!selectedPeriods || filteredMonthlyDonations.length === 0) return;
    const currentKey = formatKey(selectedPeriods.current.year, selectedPeriods.current.month);
    const compareKey = formatKey(selectedPeriods.compare.year, selectedPeriods.compare.month);
    const current = filteredMonthlyDonations.find(m => m.key === currentKey)?.total || 0;
    const previous = filteredMonthlyDonations.find(m => m.key === compareKey)?.total || 0;
    setComparisons({ current, previous });
  }, [selectedPeriods, filteredMonthlyDonations]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading donations…</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#3F2E1E] mb-4">Donation Analytics</h1>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="year-filter" style={{ fontSize: 15, color: '#3F2E1E', fontWeight: 600 }}>Year:</label>
          <select
            id="year-filter"
            value={selectedYear || 'all'}
            style={{ padding: '0.4rem 1.1rem', borderRadius: 8, border: '1px solid #f2e4ce', fontSize: 15, backgroundColor: '#FFF6E5', color: '#3F2E1E', minWidth: '120px' }}
            onChange={e => setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))}
          >
            <option value="all">All Years (3 Years)</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="purpose-filter" style={{ fontSize: 15, color: '#3F2E1E', fontWeight: 600 }}>Purpose:</label>
          <select
            id="purpose-filter"
            value={purposeFilter}
            style={{ padding: '0.4rem 1.1rem', borderRadius: 8, border: '1px solid #f2e4ce', fontSize: 15, backgroundColor: '#FFF6E5', color: '#3F2E1E' }}
            onChange={e => setPurposeFilter(e.target.value)}
          >
            <option value="all">All Purposes</option>
            {allPurposes.map(p => (
              <option key={p.id || p.name} value={String(p.id || p.name)}>
                {p.name}{p.deleted_at ? ' (Archived)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4">
          <div className="text-xs text-[#5C4B38]">Total Verified Donations</div>
          <div className="text-xl font-bold text-[#3F2E1E]">₱ {filteredTotal.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4">
          <div className="text-xs text-[#5C4B38]">This Period</div>
          <div className="text-xl font-bold text-[#3F2E1E]">₱ {(comparisons.current || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4">
          <div className="text-xs text-[#5C4B38]">Compare Period</div>
          <div className="text-xl font-bold text-[#3F2E1E]">₱ {(comparisons.previous || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        onPeriodChange={handlePeriodChange}
        // Also support other handler names that some implementations use
        onChange={handlePeriodChange}
        onSelect={handlePeriodChange}
        // Provide the current selected periods so PeriodSelector can be controlled if it supports it
        currentPeriod={selectedPeriods.current}
        comparePeriod={selectedPeriods.compare}
        defaultCurrentPeriod="current-month"
        defaultComparePeriod="previous-month"
        showYearSelector={true}
        showMonthSelector={true}
      />

      {/* Comparison widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <AnalyticsComparison
          currentValue={comparisons.current || 0}
          previousValue={comparisons.previous || 0}
          label="Donations"
          format="currency"
          icon="💰"
          color="#10b981"
          currentPeriod={selectedPeriods.current.label}
          comparePeriod={selectedPeriods.compare.label}
          showPeriodLabels={true}
        />
      </div>

      {/* Comprehensive Insights Section */}
      {(() => {
        const insights = calculateDonationInsights(filteredMonthlyDonations, filteredVerifiedDonations, selectedYear);
        if (!insights || Object.keys(insights).length === 0) return null;
        
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3F2E1E] mb-6 text-center">💰 Comprehensive 3-Year Donation Insights</h2>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                <div className="text-xs text-[#5C4B38] mb-1">{selectedYear ? `Total (${selectedYear})` : 'Total (3 Years)'}</div>
                <div className="text-2xl font-bold text-[#3F2E1E]">₱{insights.total?.toLocaleString() || 0}</div>
                <div className="text-xs text-gray-500 mt-1">{insights.totalCount || 0} donations</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                <div className="text-xs text-[#5C4B38] mb-1">Average Monthly</div>
                <div className="text-2xl font-bold text-[#3F2E1E]">₱{Math.round(insights.averageMonthly || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Per month average</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                <div className="text-xs text-[#5C4B38] mb-1">Average Donation</div>
                <div className="text-2xl font-bold text-[#3F2E1E]">₱{Math.round(insights.averageDonation || 0).toLocaleString()}</div>
                <div className={`text-xs mt-1 ${(insights.avgDonationTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.avgDonationTrend >= 0 ? '+' : ''}{insights.avgDonationTrend || 0}% vs previous period
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                <div className="text-xs text-[#5C4B38] mb-1">Data Consistency</div>
                <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                  insights.consistency === 'high' ? 'bg-green-100 text-green-700' :
                  insights.consistency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {insights.consistency || 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">CV: {insights.coefficientOfVariation || 0}%</div>
              </div>
            </div>
            
            {/* Growth & Trends Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md border border-blue-100">
                <div className="text-xs text-[#5C4B38] mb-2">Year-over-Year Growth</div>
                <div className={`text-2xl font-bold ${(insights.yoyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(insights.yoyGrowth || 0) >= 0 ? '+' : ''}{insights.yoyGrowth || 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Current: ₱{insights.currentYearTotal?.toLocaleString() || 0} | 
                  Previous: ₱{insights.previousYearTotal?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border border-purple-100">
                <div className="text-xs text-[#5C4B38] mb-2">2-Year Growth</div>
                <div className={`text-2xl font-bold ${(insights.twoYearGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(insights.twoYearGrowth || 0) >= 0 ? '+' : ''}{insights.twoYearGrowth || 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  vs {insights.twoYearsAgoTotal > 0 ? '₱' + insights.twoYearsAgoTotal?.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border border-orange-100">
                <div className="text-xs text-[#5C4B38] mb-2">Current Trend</div>
                <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                  insights.trend === 'increasing' ? 'bg-green-100 text-green-700' :
                  insights.trend === 'decreasing' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {insights.trend || 'stable'}
                </div>
                <div className={`text-xs mt-1 ${(insights.trendPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.trendPercentage >= 0 ? '+' : ''}{insights.trendPercentage || 0}% (last 6 months)
                </div>
              </div>
            </div>
            
            {/* Donation Count & Seasonal Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-md border border-indigo-100">
                <div className="text-xs text-[#5C4B38] mb-2">Donation Count Growth</div>
                <div className={`text-xl font-bold ${(insights.donationCountGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(insights.donationCountGrowth || 0) >= 0 ? '+' : ''}{insights.donationCountGrowth || 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Current Year: {insights.currentYearCount || 0} donations | 
                  Previous: {insights.previousYearCount || 0} donations
                </div>
              </div>
              {insights.seasonalPattern && (
                <div className="bg-white rounded-lg p-4 shadow-md border border-pink-100">
                  <div className="text-xs text-[#5C4B38] mb-2">Seasonal Pattern</div>
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">Peak:</span> {insights.seasonalPattern.peakSeason} | 
                    <span className="font-semibold text-red-600 ml-2">Low:</span> {insights.seasonalPattern.lowSeason}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on 3-year monthly averages
                  </div>
                </div>
              )}
            </div>
            
            {/* Peak & Low Months */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
              <div className="text-sm font-semibold text-[#3F2E1E] mb-3">Peak & Low Performance Months</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 mb-1">Peak Month</div>
                  <div className="text-lg font-bold text-green-700">{insights.peakMonth || 'N/A'}</div>
                  <div className="text-sm text-green-600">₱{insights.peakAmount?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{insights.peakCount || 0} donations</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-xs text-red-600 mb-1">Low Month</div>
                  <div className="text-lg font-bold text-red-700">{insights.lowMonth || 'N/A'}</div>
                  <div className="text-sm text-red-600">₱{insights.lowAmount?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{insights.lowCount || 0} donations</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Professional Chart.js monthly bar chart */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4">
        <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E] mb-4">
          Monthly Donations {selectedYear ? `(${selectedYear})` : '(3 Years - Selected Periods)'}
        </h2>
        {(() => {
          // Use filteredDonations for the bars
          const data = filteredDonations.length > 0 ? filteredDonations : filteredMonthlyDonations;
          
          // Calculate percentage changes
          const dataWithChanges = data.map((m, idx) => {
            const prev = idx === 0 ? null : data[idx - 1];
            const delta = prev ? m.total - prev.total : null;
            const pctChange = prev && prev.total > 0 ? (((m.total - prev.total) / prev.total) * 100).toFixed(1) : null;
            return {
              ...m,
              delta,
              pctChange: pctChange ? parseFloat(pctChange) : null,
            };
          });

          const chartData = {
            labels: dataWithChanges.map(m => m.month),
            datasets: [
              {
                label: 'Monthly Donations (₱)',
                data: dataWithChanges.map(m => m.total),
                backgroundColor: dataWithChanges.map((m) => {
                  if (m.delta === null) return 'rgba(156, 163, 175, 0.6)'; // gray
                  if (m.delta > 0) return 'rgba(34, 197, 94, 0.7)'; // green
                  if (m.delta < 0) return 'rgba(251, 146, 60, 0.7)'; // orange
                  return 'rgba(156, 163, 175, 0.6)'; // gray
                }),
                borderColor: dataWithChanges.map((m) => {
                  if (m.delta === null) return 'rgba(156, 163, 175, 1)';
                  if (m.delta > 0) return 'rgba(34, 197, 94, 1)';
                  if (m.delta < 0) return 'rgba(251, 146, 60, 1)';
                  return 'rgba(156, 163, 175, 1)';
                }),
                borderWidth: 2,
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
                    const value = context.parsed.y;
                    const index = context.dataIndex;
                    const item = dataWithChanges[index];
                    let label = `₱${value.toLocaleString()}`;
                    if (item.pctChange !== null) {
                      const sign = item.pctChange > 0 ? '+' : '';
                      label += ` (${sign}${item.pctChange}%)`;
                    }
                    return label;
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
              duration: 1000,
              easing: 'easeOutQuart',
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          };

          return (
            <div style={{ height: '300px' }}>
              <Bar data={chartData} options={options} />
            </div>
          );
        })()}
      </div>

      {/* Monthly Summary Section */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E] mb-4">
          Monthly Summary {selectedYear ? `(${selectedYear})` : '(Last 36 Months - 3 Years)'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const allMonths = filteredMonthlyDonations;
            const totalAmount = allMonths.reduce((sum, m) => sum + m.total, 0);
            const totalCount = allMonths.reduce((sum, m) => sum + m.count, 0);
            const avgMonthly = allMonths.length > 0 ? totalAmount / allMonths.length : 0;
            const maxMonth = allMonths.reduce((max, m) => m.total > max.total ? m : max, allMonths[0] || { total: 0, month: 'N/A' });
            const minMonth = allMonths.filter(m => m.total > 0).reduce((min, m) => m.total < min.total ? m : min, allMonths.find(m => m.total > 0) || { total: 0, month: 'N/A' });
            
            return (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-blue-700">₱{totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-blue-500 mt-1">{totalCount} donations</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">Average Monthly</div>
                  <div className="text-xl font-bold text-green-700">₱{Math.round(avgMonthly).toLocaleString()}</div>
                  <div className="text-xs text-green-500 mt-1">Per month</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">Peak Month</div>
                  <div className="text-xl font-bold text-purple-700">{maxMonth.month}</div>
                  <div className="text-xs text-purple-500 mt-1">₱{maxMonth.total.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">Lowest Month</div>
                  <div className="text-xl font-bold text-orange-700">{minMonth.month}</div>
                  <div className="text-xs text-orange-500 mt-1">₱{minMonth.total.toLocaleString()}</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#3F2E1E] mb-4">Detailed Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-[#3F2E1E]">Month</th>
                <th className="text-right p-3 text-sm font-semibold text-[#3F2E1E]">Total Amount</th>
                <th className="text-right p-3 text-sm font-semibold text-[#3F2E1E]">Donation Count</th>
                <th className="text-right p-3 text-sm font-semibold text-[#3F2E1E]">Average per Donation</th>
                <th className="text-right p-3 text-sm font-semibold text-[#3F2E1E]">Change from Previous</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyDonations.map((month, index) => {
                const prevMonth = index > 0 ? filteredMonthlyDonations[index - 1] : null;
                const delta = prevMonth ? month.total - prevMonth.total : null;
                const avgPerDonation = month.count > 0 ? month.total / month.count : 0;
                
                return (
                  <tr 
                    key={month.key} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="p-3 text-sm text-[#3F2E1E] font-medium">{month.month}</td>
                    <td className="p-3 text-sm text-[#3F2E1E] text-right font-semibold">₱{month.total.toLocaleString()}</td>
                    <td className="p-3 text-sm text-[#5C4B38] text-right">{month.count}</td>
                    <td className="p-3 text-sm text-[#5C4B38] text-right">
                      {avgPerDonation > 0 ? `₱${Math.round(avgPerDonation).toLocaleString()}` : '-'}
                    </td>
                    <td className={`p-3 text-sm text-right font-medium ${
                      delta === null 
                        ? 'text-gray-500' 
                        : delta > 0 
                          ? 'text-green-600' 
                          : delta < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                    }`}>
                      {delta !== null ? (delta > 0 ? '+' : '') + `₱${delta.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f2e4ce] border-t-2 border-gray-300">
                <td className="p-3 text-sm font-bold text-[#3F2E1E]">Total</td>
                <td className="p-3 text-sm font-bold text-[#3F2E1E] text-right">
                  ₱{filteredMonthlyDonations.reduce((sum, m) => sum + m.total, 0).toLocaleString()}
                </td>
                <td className="p-3 text-sm font-bold text-[#3F2E1E] text-right">
                  {filteredMonthlyDonations.reduce((sum, m) => sum + m.count, 0)}
                </td>
                <td className="p-3 text-sm font-bold text-[#3F2E1E] text-right">
                  {(() => {
                    const total = filteredMonthlyDonations.reduce((sum, m) => sum + m.total, 0);
                    const count = filteredMonthlyDonations.reduce((sum, m) => sum + m.count, 0);
                    return count > 0 ? `₱${Math.round(total / count).toLocaleString()}` : '-';
                  })()}
                </td>
                <td className="p-3 text-sm text-[#3F2E1E] text-right">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonationAnalytics;
