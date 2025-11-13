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
import { LoadingSpinner } from './LoadingSpinner';
import { dataTransformationService } from '../services/dataTransformationService';
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

interface Chart5Props {
  orgUnit: string;
  countryCode: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart5({ orgUnit, countryCode, period, chartId, setChartRef, chartSource }: Chart5Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [orgUnit, countryCode, period]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Define years from 2010 to selected period
      const endYear = parseInt(period);
      const years = Array.from({ length: endYear - 2010 + 1 }, (_, i) => 2010 + i);
      const periods = years.map(year => year.toString());
      
      // Check if this is an E2025 country
      const e2025CountriesArray = ["BLZ","BTN","BWA","CPV","COM","CRI","PRK","DOM","ECU","SWZ","GUF","GTM","HND","IRN","MYS","MEX","NPL","PAN","KOR","STP","SAU","ZAF","SUR","THA","TLS","VUT"];
      const isE2025Country = e2025CountriesArray.includes(countryCode);
      
      // Data elements (same for both E2025 and non-E2025 countries based on the logic provided)
      const casesAllSpeciesUID = 'Y00dFsUx6ES'; // Cases (all species) - line
      const casesPVivaxUID = 'fpEWR1WmPZY'; // Cases (P. Vivax) - line
      
      const dataElements = [casesAllSpeciesUID, casesPVivaxUID];
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const casesAllSpeciesData: (number | null)[] = [];
      const casesPVivaxData: (number | null)[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Find cases (all species) data for this year
        const casesAllRow = analyticsData.rows.find(row => 
          row[0] === casesAllSpeciesUID && row[2] === yearStr
        );
        const rawCasesAllValue = casesAllRow && casesAllRow[3] ? parseFloat(casesAllRow[3]) : null;
        const transformedCasesAllValue = dataTransformationService.transformValue(rawCasesAllValue, casesAllSpeciesUID);
        casesAllSpeciesData.push(transformedCasesAllValue);
        
        // Find cases (P. Vivax) data for this year
        const casesPVivaxRow = analyticsData.rows.find(row => 
          row[0] === casesPVivaxUID && row[2] === yearStr
        );
        const rawCasesPVivaxValue = casesPVivaxRow && casesPVivaxRow[3] ? parseFloat(casesPVivaxRow[3]) : null;
        const transformedCasesPVivaxValue = dataTransformationService.transformValue(rawCasesPVivaxValue, casesPVivaxUID);
        casesPVivaxData.push(transformedCasesPVivaxValue);
      });
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'line' as const,
            label: 'Cases (all species)',
            data: casesAllSpeciesData,
            fill: true,
            backgroundColor: 'rgba(34, 197, 94, 0.3)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: 'rgba(34, 197, 94, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y',
            order: 1,
          },
          {
            type: 'line' as const,
            label: 'Cases (P. Vivax)',
            data: casesPVivaxData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y',
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
        text: 'Confirmed malaria cases per 1000 population at risk',
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
            return `${context.dataset.label}: ${value !== null ? value.toFixed(2) : '-'}`;
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Cases per 1000 pop at risk',
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
            return value.toFixed(1);
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
        <p className="text-xs text-gray-500 mt-4 print:text-[10px] print:text-black">Source: {chartSource}</p>
      )}
    </div>
  );
}