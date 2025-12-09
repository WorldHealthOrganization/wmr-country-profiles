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
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { dhis2Service } from '../services/dhis2Service';
import { LoadingSpinner } from './LoadingSpinner'; // Keep this import
import { dataTransformationService } from '../services/dataTransformationService';
import { getDhis2Uid, getDhis2ChartShortname } from '../config/dhis2DataElements';
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
  Legend
);

interface Chart2Props {
  orgUnit: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart2({ orgUnit, period, chartId, setChartRef, chartSource }: Chart2Props) {
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
      
      // Data elements
      const reportingCompletenessUID = getDhis2Uid('MAL_REPORTING_COMPLETENESS'); // Line with dots
      const careSeekingUID = getDhis2Uid('MAL_CARE_SOUGHT_ANY'); // Blue bar
      const publicHFCareUID = getDhis2Uid('MAL_CARE_SOUGHT_PUBLIC_HF'); // Black bar
      
      const dataElements = [reportingCompletenessUID, careSeekingUID, publicHFCareUID];
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const reportingData: (number | null)[] = [];
      const careSeekingData: (number | null)[] = [];
      const publicHFData: (number | null)[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Find reporting completeness data for this year
        const reportingRow = analyticsData.rows.find(row => 
          row[0] === reportingCompletenessUID && row[2] === yearStr
        );
        const rawReportingValue = reportingRow && reportingRow[3] ? parseFloat(reportingRow[3]) : null;
        const transformedReportingValue = dataTransformationService.transformValue(rawReportingValue, reportingCompletenessUID);
        reportingData.push(transformedReportingValue);
        
        // Find care seeking data for this year
        const careSeekingRow = analyticsData.rows.find(row => 
          row[0] === careSeekingUID && row[2] === yearStr
        );
        const rawCareSeekingValue = careSeekingRow && careSeekingRow[3] ? parseFloat(careSeekingRow[3]) : null;
        const transformedCareSeekingValue = dataTransformationService.transformValue(rawCareSeekingValue, careSeekingUID);
        careSeekingData.push(transformedCareSeekingValue);
        
        // Find public HF care data for this year
        const publicHFRow = analyticsData.rows.find(row => 
          row[0] === publicHFCareUID && row[2] === yearStr
        );
        const rawPublicHFValue = publicHFRow && publicHFRow[3] ? parseFloat(publicHFRow[3]) : null;
        const transformedPublicHFValue = dataTransformationService.transformValue(rawPublicHFValue, publicHFCareUID);
        publicHFData.push(transformedPublicHFValue);
      });
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'line' as const,
            label: getDhis2ChartShortname('MAL_REPORTING_COMPLETENESS'),
            data: reportingData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
            yAxisID: 'y',
          },
          {
            type: 'bar' as const,
            label: getDhis2ChartShortname('MAL_CARE_SOUGHT_ANY'),
            data: careSeekingData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            order: 2,
            yAxisID: 'y',
          },
          {
            type: 'bar' as const,
            label: getDhis2ChartShortname('MAL_CARE_SOUGHT_PUBLIC_HF'),
            data: publicHFData,
            backgroundColor: 'rgba(239, 68, 68, 1)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            order: 3,
            yAxisID: 'y',
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
        text: 'Treatment seeking and reporting completeness',
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
            return `${context.dataset.label}: ${value !== null ? value.toFixed(1) : '-'}%`;
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
          text: '(%)',
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
            // Show decimals only when needed (not for whole numbers)
            if (Number.isInteger(numValue)) {
              return numValue.toString();
            }
            // For decimals, show up to 1 decimal place, remove trailing zeros
            return parseFloat(numValue.toFixed(1)).toString();
          },
        },
        min: 0,
        Max: 100,
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

    </div>
  );
}