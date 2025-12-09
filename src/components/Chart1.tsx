import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { dhis2Service } from '../services/dhis2Service';
import { LoadingSpinner } from './LoadingSpinner'; // Keep this import
import { ChartRefLike } from '../utils/useSnapshots';
import { CHART_CONFIG } from '../config/chartConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

// No changes needed here, as this component already uses the UIDs directly.
interface Chart1Props {
  orgUnit: string;
  period: string;
  showEstimates: boolean;
  paramEpiDisplay: number;
  showEstForIndigCountry: boolean;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart1({ orgUnit, period, showEstimates, paramEpiDisplay, showEstForIndigCountry, chartId, setChartRef, chartSource }: Chart1Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [orgUnit, period, showEstimates, paramEpiDisplay]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Define years from 2010 to selected period
      const endYear = parseInt(period);
      const years = Array.from({ length: endYear - 2010 + 1 }, (_, i) => 2010 + i);
      const periods = years.map(year => year.toString());
      
      // Determine which data elements to fetch based on conditions
      let surfaceAreaUID: string;
      let lineUID: string;
      
      if (paramEpiDisplay === 1) {
        surfaceAreaUID = 'an08m0ybMb1'; // Estimated cases
        lineUID = 'TfL9cVeMHyd'; // Confirmed cases
      } else {
        surfaceAreaUID = 'an08m0ybMb1'; // Estimated cases
        lineUID = 'gyAhkgE9tlU'; // Indigenous malaria cases
      }
      
      // Fetch data for all years
      const dataElements = [surfaceAreaUID, lineUID];
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const surfaceAreaData: (number | null)[] = [];
      const lineData: (number | null)[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Find surface area data for this year
        const surfaceRow = analyticsData.rows.find(row => 
          row[0] === surfaceAreaUID && row[2] === yearStr
        );
        const surfaceValue = surfaceRow && surfaceRow[3] ? parseFloat(surfaceRow[3]) : null;
        surfaceAreaData.push(surfaceValue);
        
        // Find line data for this year
        const lineRow = analyticsData.rows.find(row => 
          row[0] === lineUID && row[2] === yearStr
        );
        const lineValue = lineRow && lineRow[3] ? parseFloat(lineRow[3]) : null;
        lineData.push(lineValue);
      });
      
      // Determine labels based on conditions
      let surfaceLabel: string;
      let lineLabel: string;
      if (paramEpiDisplay === 1) {
        surfaceLabel = 'Estimated cases';
        lineLabel = 'Confirmed cases (reported)';
      } else {
        surfaceLabel = 'Estimated cases';
        lineLabel = 'Indigenous cases (reported)';
      } 
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'line' as const,
            label: surfaceLabel,
            data: surfaceAreaData,
            fill: true, // or 'origin', 'start', 'end'
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            order: 1,
          },
          {
            type: 'line' as const,
            label: lineLabel,
            data: lineData,
            borderColor: 'rgba(17, 24, 39, 1)',
            backgroundColor: 'rgba(17, 24, 39, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(17, 24, 39, 1)',
            pointBorderColor: 'rgba(17, 24, 39, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 2,
          },
        ],
      };
      
      setChartData(data);
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Use fixed container dimensions
    plugins: {
      title: {
        display: true,
        text: 'Estimated and reported cases',
        font: {
          size: CHART_CONFIG.TITLE.FONT_SIZE,
          weight: CHART_CONFIG.TITLE.FONT_WEIGHT,
        },
        color: CHART_CONFIG.TITLE.COLOR,
        padding: {
          bottom: CHART_CONFIG.TITLE.PADDING_BOTTOM,
        },
      },
      legend: {
        display: true,
        position: CHART_CONFIG.LEGEND.POSITION,
        align: 'start' as const,
        maxHeight: CHART_CONFIG.LEGEND.MAX_HEIGHT,
        labels: {
          usePointStyle: CHART_CONFIG.LEGEND.USE_POINT_STYLE,
          padding: CHART_CONFIG.LEGEND.PADDING,
          font: {
            size: CHART_CONFIG.LEGEND.FONT_SIZE,
          },
          boxWidth: CHART_CONFIG.LEGEND.BOX_WIDTH,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const formattedValue = value >= 1000 ? 
              (value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}k`) :
              value.toString();
            return `${context.dataset.label}: ${formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        grid: {
          display: true,
          color: 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          font: {
            size: CHART_CONFIG.AXIS.TICK_FONT_SIZE,
          },
          maxRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Cases',
          font: {
            size: CHART_CONFIG.AXIS.TITLE_FONT_SIZE,
            weight: CHART_CONFIG.AXIS.TITLE_FONT_WEIGHT,
          },
        },
        grid: {
          display: true,
          color: 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          font: {
            size: CHART_CONFIG.AXIS.TICK_FONT_SIZE,
          },
          callback: function(value: any) {
            const numValue = Number(value);
            if (numValue >= 1000000) {
              const millions = numValue / 1000000;
              // Show decimals only when needed for millions
              if (Number.isInteger(millions)) {
                return `${millions}M`;
              }
              // For decimals, show up to 1 decimal place, remove trailing zeros
              return `${parseFloat(millions.toFixed(1))}M`;
            } else if (numValue >= 1000) {
              const thousands = numValue / 1000;
              // Show decimals only when needed for thousands
              if (Number.isInteger(thousands)) {
                return `${thousands}k`;
              }
              // For decimals, show up to 1 decimal place, remove trailing zeros
              return `${parseFloat(thousands.toFixed(1))}k`;
            }
            // For values less than 1000, show decimals only when needed
            if (Number.isInteger(numValue)) {
              return numValue.toString();
            }
            // For decimals, show up to 1 decimal place, remove trailing zeros
            return parseFloat(numValue.toFixed(1)).toString();
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Failed to load chart</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Chart type="line" data={chartData} options={options} ref={ref => setChartRef?.(chartId, ref)} />
      {chartSource && (
        <p className="text-xs text-gray-500 mt-2">Source: {chartSource}</p>
      )}
    </div>
  );
}