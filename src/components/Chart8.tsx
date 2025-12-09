import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { dhis2Service } from '../services/dhis2Service';
import { LoadingSpinner } from './LoadingSpinner';
import { dataTransformationService } from '../services/dataTransformationService';
import { ChartRefLike } from '../utils/useSnapshots';
import { CHART_CONFIG } from '../config/chartConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface Chart8Props {
  orgUnit: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart8({ orgUnit, period, chartId, setChartRef, chartSource }: Chart8Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [orgUnit, period]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Define years from 2010 to selected period
      const endYear = parseInt(period);
      const years = Array.from({ length: endYear - 2010 + 1 }, (_, i) => 2010 + i);
      const periods = years.map(year => year.toString());
      
      // Data elements for Chart 8 - Sources of financing
      const dataElements = [
        'EZKlghYRnnB', // Government contribution
        'SQ1v0YjfAcW', // Global Fund
        'JrVZ5GeTlGs', // USAID/PMI
        'OGZljNFx3q9', // World Bank
        'W62lvp0yZAS', // WHO/UNICEF
        'ilA4hUUKuzV'  // Other contributions
      ];
      
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods,
        true // skipRounding=true to preserve decimal precision for financial data
      );
      
      // Process the data
      const governmentData: number[] = [];
      const globalFundData: number[] = [];
      const usaidPmiData: number[] = [];
      const worldBankData: number[] = [];
      const whoUnicefData: number[] = [];
      const otherContributionsData: number[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Government contribution
        const governmentRow = analyticsData.rows.find(row => 
          row[0] === 'EZKlghYRnnB' && row[2] === yearStr
        );
        const rawGovernmentValue = governmentRow ? parseFloat(governmentRow[3]) || 0 : 0;
        const transformedGovernmentValue = dataTransformationService.transformValue(rawGovernmentValue, 'EZKlghYRnnB');
        governmentData.push(transformedGovernmentValue || 0);
        
        // Global Fund
        const globalFundRow = analyticsData.rows.find(row => 
          row[0] === 'SQ1v0YjfAcW' && row[2] === yearStr
        );
        const rawGlobalFundValue = globalFundRow ? parseFloat(globalFundRow[3]) || 0 : 0;
        const transformedGlobalFundValue = dataTransformationService.transformValue(rawGlobalFundValue, 'SQ1v0YjfAcW');
        globalFundData.push(transformedGlobalFundValue || 0);
        
        // USAID/PMI
        const usaidPmiRow = analyticsData.rows.find(row => 
          row[0] === 'JrVZ5GeTlGs' && row[2] === yearStr
        );
        const rawUsaidPmiValue = usaidPmiRow ? parseFloat(usaidPmiRow[3]) || 0 : 0;
        const transformedUsaidPmiValue = dataTransformationService.transformValue(rawUsaidPmiValue, 'JrVZ5GeTlGs');
        usaidPmiData.push(transformedUsaidPmiValue || 0);
        
        // World Bank
        const worldBankRow = analyticsData.rows.find(row => 
          row[0] === 'OGZljNFx3q9' && row[2] === yearStr
        );
        const rawWorldBankValue = worldBankRow ? parseFloat(worldBankRow[3]) || 0 : 0;
        const transformedWorldBankValue = dataTransformationService.transformValue(rawWorldBankValue, 'OGZljNFx3q9');
        worldBankData.push(transformedWorldBankValue || 0);
        
        // WHO/UNICEF
        const whoUnicefRow = analyticsData.rows.find(row => 
          row[0] === 'W62lvp0yZAS' && row[2] === yearStr
        );
        const rawWhoUnicefValue = whoUnicefRow ? parseFloat(whoUnicefRow[3]) || 0 : 0;
        const transformedWhoUnicefValue = dataTransformationService.transformValue(rawWhoUnicefValue, 'W62lvp0yZAS');
        whoUnicefData.push(transformedWhoUnicefValue || 0);
        
        // Other contributions
        const otherContributionsRow = analyticsData.rows.find(row => 
          row[0] === 'ilA4hUUKuzV' && row[2] === yearStr
        );
        const rawOtherContributionsValue = otherContributionsRow ? parseFloat(otherContributionsRow[3]) || 0 : 0;
        const transformedOtherContributionsValue = dataTransformationService.transformValue(rawOtherContributionsValue, 'ilA4hUUKuzV');
        otherContributionsData.push(transformedOtherContributionsValue || 0);
      });
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'bar' as const,
            label: 'Government contribution',
            data: governmentData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
          {
            type: 'bar' as const,
            label: 'Global Fund',
            data: globalFundData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
          {
            type: 'bar' as const,
            label: 'USAID/PMI',
            data: usaidPmiData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          },
          {
            type: 'bar' as const,
            label: 'World Bank',
            data: worldBankData,
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 1,
          },
          {
            type: 'bar' as const,
            label: 'WHO/UNICEF',
            data: whoUnicefData,
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 1,
          },
          {
            type: 'bar' as const,
            label: 'Other contributions',
            data: otherContributionsData,
            backgroundColor: 'rgba(156, 163, 175, 0.8)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 1,
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
        text: 'Sources of financing',
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
            const formattedValue = value >= 1000000 ? 
              `$${(value / 1000000).toFixed(1)}M` : 
              value >= 1000 ? 
                `$${(value / 1000).toFixed(1)}k` : 
                `$${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
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
        stacked: true,
      },
      y: {
        title: {
          display: true,
          text: 'Funding (USD)',
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
              return `$${(numValue / 1000000).toFixed(0)}M`;
            } else if (numValue >= 1000) {
              return `$${(numValue / 1000).toFixed(0)}k`;
            }
            return `$${numValue.toLocaleString()}`;
          },
        },
        beginAtZero: true,
        stacked: true,
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
      <Chart type="bar" data={chartData} options={options} ref={ref => setChartRef?.(chartId, ref)} />
      {chartSource && (
        <p className="text-xs text-gray-500 mt-4 print:text-[10px] print:text-black">Source: {chartSource}</p>
      )}
    </div>
  );
}