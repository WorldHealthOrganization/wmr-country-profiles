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
  Legend
);

interface Chart3Props {
  orgUnit: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart3({ orgUnit, period, chartId, setChartRef, chartSource }: Chart3Props) {
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
      
      // Data elements for Chart 3
      const treatmentCoursesUID = 'hhmyDXcPavC'; // 1st-line treatment courses distributed (bar)
      const suspectedTestedUID = 'Rdbxu0qoX8U'; // Suspected cases tested % (line)
      const feverCasesUID = 'IGQENa04DFm'; // %<5 fever cases who had finger/heel stick (line)
      const actsPercentUID = 'heI5NQZqZRW'; // ACTs as % of all antimalarials received by <5 (line)
      
      const dataElements = [treatmentCoursesUID, suspectedTestedUID, feverCasesUID, actsPercentUID];
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const treatmentCoursesData: (number | null)[] = [];
      const suspectedTestedData: (number | null)[] = [];
      const feverCasesData: (number | null)[] = [];
      const actsPercentData: (number | null)[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Find treatment courses data for this year
        const treatmentRow = analyticsData.rows.find(row => 
          row[0] === treatmentCoursesUID && row[2] === yearStr
        );
        const rawTreatmentValue = treatmentRow && treatmentRow[3] ? parseFloat(treatmentRow[3]) : null;
        const transformedTreatmentValue = dataTransformationService.transformValue(rawTreatmentValue, treatmentCoursesUID);
        treatmentCoursesData.push(transformedTreatmentValue);
        
        // Find suspected tested data for this year
        const suspectedRow = analyticsData.rows.find(row => 
          row[0] === suspectedTestedUID && row[2] === yearStr
        );
        const rawSuspectedValue = suspectedRow && suspectedRow[3] ? parseFloat(suspectedRow[3]) : null;
        const transformedSuspectedValue = dataTransformationService.transformValue(rawSuspectedValue, suspectedTestedUID);
        suspectedTestedData.push(transformedSuspectedValue);
        
        // Find fever cases data for this year
        const feverRow = analyticsData.rows.find(row => 
          row[0] === feverCasesUID && row[2] === yearStr
        );
        const rawFeverValue = feverRow && feverRow[3] ? parseFloat(feverRow[3]) : null;
        const transformedFeverValue = dataTransformationService.transformValue(rawFeverValue, feverCasesUID);
        feverCasesData.push(transformedFeverValue);
        
        // Find ACTs percent data for this year
        const actsRow = analyticsData.rows.find(row => 
          row[0] === actsPercentUID && row[2] === yearStr
        );
        const rawActsValue = actsRow && actsRow[3] ? parseFloat(actsRow[3]) : null;
        const transformedActsValue = dataTransformationService.transformValue(rawActsValue, actsPercentUID);
        actsPercentData.push(transformedActsValue);
      });
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'bar' as const,
            label: '1st-line treatment courses distributed (incl. ACTs)',
            data: treatmentCoursesData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            order: 2,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: 'Suspected cases tested (%)',
            data: suspectedTestedData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
            yAxisID: 'y1',
          },
          {
            type: 'line' as const,
            label: '%<5 fever cases who had finger/heel stick (survey)',
            data: feverCasesData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
            yAxisID: 'y1',
          },
          {
            type: 'line' as const,
            label: 'ACTs as % of all antimalarials received by <5 (survey)',
            data: actsPercentData,
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: 'rgba(168, 85, 247, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
            yAxisID: 'y1',
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
        text: 'Cases tested and treated',
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
            // Assuming percentages for y1 axis, counts for y axis
            if (context.dataset.yAxisID === 'y1') {
              return `${context.dataset.label}: ${value !== null ? value.toFixed(1) : '-'}%`;
            }
            return `${context.dataset.label}: ${value !== null ? value.toLocaleString() : '-'}`;
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
          text: 'Treatment courses',
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
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '(%)',
          font: {
            size: CHART_CONFIG.AXIS.TITLE_FONT_SIZE,
            weight: CHART_CONFIG.AXIS.TITLE_FONT_WEIGHT,
          },
        },
        grid: {
          drawOnChartArea: false,
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
        max: 100,
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