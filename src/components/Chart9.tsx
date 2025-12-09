import React, { useEffect, useState } from 'react';
import {
  ArcElement,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { dhis2Service } from '../services/dhis2Service';
import { LoadingSpinner } from './LoadingSpinner';
import { dataTransformationService } from '../services/dataTransformationService';
import { ChartRefLike, ContainerRefLike } from '../utils/useSnapshots';
import { CHART_CONFIG } from '../config/chartConfig';

ChartJS.register(
  ArcElement,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend
);

interface Chart9Props {
  orgUnit: string;
  period: string;
  onDataAvailabilityChange?: (hasData: boolean) => void;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  setContainerRef?: (id: string, ref: ContainerRefLike) => void;
  chartSource?: string;
}

export function Chart9({ orgUnit, period, onDataAvailabilityChange, chartId, setChartRef, setContainerRef, chartSource }: Chart9Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [legendData, setLegendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [orgUnit, period]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Data elements for Chart 9 - Pie chart
      const dataElements = [
        'A35xaYItzoR', // Insecticides & spray materials
        'woabRXKLkOS', // ITNs
        'Ckaj4nTAJOU', // Diagnostic testing
        'nSnRC8hGXO9', // Antimalarial medicines
        'SosWfz9NeuF', // Monitoring and evaluation
        'omBKmGhzvsJ', // Human resources & technical assistance
        'LAQ4pC4yP9z'  // Management and other costs
      ];
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        period
      );
      
      // Process the data
      const labels = [
        'Insecticides & spray materials',
        'ITNs',
        'Diagnostic testing',
        'Antimalarial medicines',
        'Monitoring and evaluation',
        'Human resources & technical assistance',
        'Management and other costs'
      ];
      
      const values: number[] = [];
      const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(34, 197, 94, 0.8)',    // Green
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(168, 85, 247, 0.8)',   // Purple
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(156, 163, 175, 0.8)'   // Gray
      ];
      
      const borderColors = [
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(156, 163, 175, 1)'
      ];
      
      // Create data maps for each data element
      dataElements.forEach(elementId => {
        const row = analyticsData.rows.find(row => 
          row[0] === elementId && row[2] === period
        );
        const rawValue = row ? parseFloat(row[3]) || 0 : 0;
        const transformedValue = dataTransformationService.transformValue(rawValue, elementId);
        values.push(transformedValue || 0);
      });
      
      // Check if there's any meaningful data (any non-zero values)
      const hasData = values.some(value => value > 0);
      onDataAvailabilityChange?.(hasData);
      
      if (!hasData) {
        setChartData(null);
        setLegendData([]);
        return;
      }
      
      // Find the index of the largest slice
      const maxValue = Math.max(...values);
      const maxIndex = values.indexOf(maxValue);
      
      // Create offset array - explode the largest slice
      const offset = values.map((_, index) => index === maxIndex ? 20 : 0);
      
      // Filter out zero values and their corresponding labels/colors
      const filteredData = values
        .map((value, index) => ({ value, label: labels[index], color: colors[index], borderColor: borderColors[index], offset: offset[index] }))
        .filter(item => item.value > 0);
      
      const data = {
        labels: filteredData.map(item => item.label),
        datasets: [
          {
            data: filteredData.map(item => item.value),
            backgroundColor: filteredData.map(item => item.color),
            borderColor: filteredData.map(item => item.borderColor),
            borderWidth: 2,
            offset: filteredData.map(item => item.offset),
          },
        ],
      };
      
      // Calculate legend data with percentages
      const total = filteredData.reduce((sum, item) => sum + item.value, 0);
      const legendItems = filteredData.map((item, index) => ({
        label: item.label,
        value: item.value,
        percentage: ((item.value / total) * 100).toFixed(1),
        color: item.color,
        borderColor: item.borderColor
      }));
      
      setLegendData(legendItems);
      setChartData(data);
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      setChartData(null);
      setLegendData([]);
      onDataAvailabilityChange?.(false);
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
        text: `Government expenditure by intervention in ${period}`,
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
        align: 'center' as const,
        maxHeight: CHART_CONFIG.LEGEND.MAX_HEIGHT,
        labels: {
          usePointStyle: CHART_CONFIG.LEGEND.USE_POINT_STYLE,
          padding: 8, // Tighter padding for pie chart legend
          font: {
            size: CHART_CONFIG.LEGEND.FONT_SIZE,
          },
          boxWidth: CHART_CONFIG.LEGEND.BOX_WIDTH,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                const formattedValue = value >= 1000000 ? 
                  `$${(value / 1000000).toFixed(1)}M` : 
                  value >= 1000 ? 
                    `$${(value / 1000).toFixed(0)}k` : 
                    `$${value.toLocaleString()}`;
                
                return {
                  text: `${label}: ${formattedValue} (${percentage}%)`, // Single line format
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            const formattedValue = value >= 1000000 ? 
              `$${(value / 1000000).toFixed(1)}M` : 
              value >= 1000 ? 
                `$${(value / 1000).toFixed(0)}k` : 
                `$${value.toLocaleString()}`;
            
            return `${context.label}: ${formattedValue} (${percentage}%)`;
          },
        },
      },
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
      <Pie data={chartData} options={options} ref={ref => setChartRef?.(chartId, ref)} />
      {chartSource && (
        <p className="text-xs text-gray-500 mt-4 print:text-[10px] print:text-black">Source: {chartSource}</p>
      )}
    </div>
  );
}