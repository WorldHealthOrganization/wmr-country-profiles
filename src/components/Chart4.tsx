import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
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
  LineController,
  Title,
  Tooltip,
  Legend
);

interface Chart4Props {
  orgUnit: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart4({ orgUnit, period, chartId, setChartRef, chartSource }: Chart4Props) {
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
      
      // Data elements for Chart 4
      const slidePositivityUID = 'ZoMFYowPAkO'; // Slide positivity rate
      const rdtPositivityUID = 'eVYQuP1faAt'; // RDT positivity rate
      const surveyMicroscopyUID = 'ZnSwOwcQt52'; // % <5 with a positive microscopy slide on the day of the survey
      const surveyRdtUID = 'gZrHErmb74i'; // % <5 with a positive rdt on the day of the survey
      
      const dataElements = [slidePositivityUID, rdtPositivityUID, surveyMicroscopyUID, surveyRdtUID];
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const slidePositivityData: (number | null)[] = [];
      const rdtPositivityData: (number | null)[] = [];
      const surveyMicroscopyData: (number | null)[] = [];
      const surveyRdtData: (number | null)[] = [];
      
      // Create data maps for each year
      years.forEach(year => {
        const yearStr = year.toString();
        
        // Find slide positivity data for this year
        const slideRow = analyticsData.rows.find(row => 
          row[0] === slidePositivityUID && row[2] === yearStr
        );
        const rawSlideValue = slideRow && slideRow[3] ? parseFloat(slideRow[3]) : null;
        const transformedSlideValue = dataTransformationService.transformValue(rawSlideValue, slidePositivityUID);
        slidePositivityData.push(transformedSlideValue);
        
        // Find RDT positivity data for this year
        const rdtRow = analyticsData.rows.find(row => 
          row[0] === rdtPositivityUID && row[2] === yearStr
        );
        const rawRdtValue = rdtRow && rdtRow[3] ? parseFloat(rdtRow[3]) : null;
        const transformedRdtValue = dataTransformationService.transformValue(rawRdtValue, rdtPositivityUID);
        rdtPositivityData.push(transformedRdtValue);
        
        // Find survey microscopy data for this year
        const surveyMicroscopyRow = analyticsData.rows.find(row => 
          row[0] === surveyMicroscopyUID && row[2] === yearStr
        );
        const rawSurveyMicroscopyValue = surveyMicroscopyRow && surveyMicroscopyRow[3] ? parseFloat(surveyMicroscopyRow[3]) : null;
        const transformedSurveyMicroscopyValue = dataTransformationService.transformValue(rawSurveyMicroscopyValue, surveyMicroscopyUID);
        surveyMicroscopyData.push(transformedSurveyMicroscopyValue);
        
        // Find survey RDT data for this year
        const surveyRdtRow = analyticsData.rows.find(row => 
          row[0] === surveyRdtUID && row[2] === yearStr
        );
        const rawSurveyRdtValue = surveyRdtRow && surveyRdtRow[3] ? parseFloat(surveyRdtRow[3]) : null;
        const transformedSurveyRdtValue = dataTransformationService.transformValue(rawSurveyRdtValue, surveyRdtUID);
        surveyRdtData.push(transformedSurveyRdtValue);
      });
      
      const data = {
        labels: years,
        datasets: [
          {
            type: 'line' as const,
            label: 'Slide positivity rate',
            data: slidePositivityData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          },
          {
            type: 'line' as const,
            label: 'RDT positivity rate',
            data: rdtPositivityData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          },
          {
            type: 'line' as const,
            label: '% <5 with a positive microscopy slide on the day of the survey',
            data: surveyMicroscopyData,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: 'rgba(34, 197, 94, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          },
          {
            type: 'line' as const,
            label: '% <5 with a positive rdt on the day of the survey',
            data: surveyRdtData,
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: 'rgba(168, 85, 247, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
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
        text: 'Test positivity',
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
            return `${value}`;
          },
        },
        min: 0,
        max: 105,
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