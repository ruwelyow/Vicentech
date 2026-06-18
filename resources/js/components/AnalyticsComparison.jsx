import React from 'react';
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

const AnalyticsComparison = ({ 
  currentValue, 
  previousValue, 
  label, 
  format = 'number',
  icon,
  color = '#CD8B3E',
  insights = true,
  currentPeriod = 'Current Period',
  comparePeriod = 'Previous Period',
  showPeriodLabels = true
}) => {
  // Calculate percentage change
  const calculateChange = () => {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const change = calculateChange();
  const isPositive = change >= 0;
  const isSignificant = Math.abs(change) >= 10; // 10% threshold for significance

  // Format values based on type
  const formatValue = (value) => {
    switch (format) {
      case 'currency':
        return `₱${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'decimal':
        return value.toFixed(1);
      default:
        return value.toLocaleString();
    }
  };

  // Generate smart insights
  const generateInsight = () => {
    if (!insights) return null;

    const absChange = Math.abs(change);
    
    if (absChange < 5) {
      return {
        type: 'stable',
        message: 'Performance remains stable',
        advice: 'Continue current strategies to maintain steady growth',
        color: 'blue'
      };
    } else if (isPositive) {
      if (absChange >= 50) {
        return {
          type: 'excellent',
          message: 'Outstanding growth performance',
          advice: 'This exceptional growth indicates strong engagement. Consider scaling successful initiatives.',
          color: 'green'
        };
      } else if (absChange >= 25) {
        return {
          type: 'strong',
          message: 'Strong positive growth',
          advice: 'Great momentum! Focus on sustaining this growth rate through consistent engagement.',
          color: 'green'
        };
      } else {
        return {
          type: 'good',
          message: 'Healthy growth trend',
          advice: 'Good progress! Consider identifying what drove this growth to replicate success.',
          color: 'green'
        };
      }
    } else {
      if (absChange >= 50) {
        return {
          type: 'critical',
          message: 'Significant decline detected',
          advice: 'Immediate attention needed. Review recent changes and implement corrective measures.',
          color: 'red'
        };
      } else if (absChange >= 25) {
        return {
          type: 'concerning',
          message: 'Notable decrease in performance',
          advice: 'Investigate causes and consider targeted interventions to reverse the trend.',
          color: 'orange'
        };
      } else {
        return {
          type: 'mild',
          message: 'Slight downward trend',
          advice: 'Monitor closely and consider minor adjustments to prevent further decline.',
          color: 'yellow'
        };
      }
    }
  };

  const insight = generateInsight();

  return (
    <div className="bg-white rounded-xl shadow border border-[#f2e4ce] p-4 sm:p-6 analytics-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-2xl sm:text-3xl" style={{ color }}>
              {icon}
            </div>
          )}
          <h3 className="text-sm sm:text-base font-semibold text-[#3F2E1E]">{label}</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isPositive 
            ? 'bg-green-100 text-green-700' 
            : change === 0 
              ? 'bg-gray-100 text-gray-600'
              : 'bg-red-100 text-red-700'
        }`}>
          {change === 0 ? 'No Change' : `${isPositive ? '+' : ''}${change.toFixed(1)}%`}
        </div>
      </div>

      {/* Values Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">{showPeriodLabels ? currentPeriod : 'Current Period'}</div>
          <div className="text-lg sm:text-xl font-bold text-[#3F2E1E]">
            {formatValue(currentValue)}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">{showPeriodLabels ? comparePeriod : 'Previous Period'}</div>
          <div className="text-lg sm:text-xl font-bold text-[#3F2E1E]">
            {formatValue(previousValue)}
          </div>
        </div>
      </div>

      {/* Chart.js Comparison Chart */}
      <div className="mb-4">
        <div className="text-xs text-gray-600 mb-2">Visual Comparison</div>
        {(() => {
          const chartData = {
            labels: [
              showPeriodLabels ? currentPeriod : 'Current Period',
              showPeriodLabels ? comparePeriod : 'Previous Period'
            ],
            datasets: [
              {
                label: label,
                data: [currentValue, previousValue],
                backgroundColor: [
                  isPositive 
                    ? 'rgba(34, 197, 94, 0.7)' // Green for positive (current)
                    : change === 0 
                      ? 'rgba(156, 163, 175, 0.7)' // Gray for no change
                      : 'rgba(239, 68, 68, 0.7)', // Red for negative
                  'rgba(156, 163, 175, 0.7)' // Gray for previous
                ],
                borderColor: [
                  isPositive 
                    ? 'rgba(34, 197, 94, 1)' // Green for positive (current)
                    : change === 0 
                      ? 'rgba(156, 163, 175, 1)' // Gray for no change
                      : 'rgba(239, 68, 68, 1)', // Red for negative
                  'rgba(156, 163, 175, 1)' // Gray for previous
                ],
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
                  size: 13,
                  weight: 'bold',
                },
                bodyFont: {
                  size: 12,
                },
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y;
                    switch (format) {
                      case 'currency':
                        return `₱${value.toLocaleString()}`;
                      case 'percentage':
                        return `${value}%`;
                      case 'decimal':
                        return value.toFixed(1);
                      default:
                        return value.toLocaleString();
                    }
                  },
                },
                displayColors: true,
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
                    switch (format) {
                      case 'currency':
                        return '₱' + value.toLocaleString();
                      case 'percentage':
                        return value + '%';
                      case 'decimal':
                        return value.toFixed(1);
                      default:
                        return value.toLocaleString();
                    }
                  },
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
            <div style={{ height: '200px' }}>
              <Bar data={chartData} options={options} />
            </div>
          );
        })()}
      </div>

      {/* Smart Insights */}
      {insight && (
        <div className={`p-3 rounded-lg border-l-4 ${
          insight.color === 'green' ? 'bg-green-50 border-green-400' :
          insight.color === 'red' ? 'bg-red-50 border-red-400' :
          insight.color === 'orange' ? 'bg-orange-50 border-orange-400' :
          insight.color === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
          'bg-blue-50 border-blue-400'
        }`}>
          <div className="flex items-start gap-2">
            <div className={`text-lg ${
              insight.color === 'green' ? 'text-green-600' :
              insight.color === 'red' ? 'text-red-600' :
              insight.color === 'orange' ? 'text-orange-600' :
              insight.color === 'yellow' ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              {insight.type === 'excellent' ? '🚀' :
               insight.type === 'strong' ? '📈' :
               insight.type === 'good' ? '✅' :
               insight.type === 'stable' ? '📊' :
               insight.type === 'mild' ? '⚠️' :
               insight.type === 'concerning' ? '🔍' :
               insight.type === 'critical' ? '🚨' : '📊'}
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm ${
                insight.color === 'green' ? 'text-green-800' :
                insight.color === 'red' ? 'text-red-800' :
                insight.color === 'orange' ? 'text-orange-800' :
                insight.color === 'yellow' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {insight.message}
              </div>
              <div className={`text-xs mt-1 ${
                insight.color === 'green' ? 'text-green-700' :
                insight.color === 'red' ? 'text-red-700' :
                insight.color === 'orange' ? 'text-orange-700' :
                insight.color === 'yellow' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                {insight.advice}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold text-[#3F2E1E]">
            {formatValue(Math.abs(currentValue - previousValue))}
          </div>
          <div className="text-gray-600">Difference</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold text-[#3F2E1E]">
            {previousValue > 0 ? ((currentValue / previousValue) * 100).toFixed(1) : 'N/A'}%
          </div>
          <div className="text-gray-600">Ratio</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsComparison;
