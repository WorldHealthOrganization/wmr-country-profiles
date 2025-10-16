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

interface Chart7Props {
  orgUnit: string;
  countryCode: string;
  currentRegion: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart7({ orgUnit, countryCode, currentRegion, period, chartId, setChartRef, chartSource }: Chart7Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [orgUnit, countryCode, currentRegion, period]);

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
      
      let dataElements: string[];
      let chartTitle: string;
      
      if (isE2025Country) {
        // E2025 countries - Cases by classification
        dataElements = [
          'bfRZJGS7KOh', // At risk protected with ITNs
          'niYxtlxx68s', // At risk protected with IRS
          'SQWZ8POEhMI', // % of the population who slept under an ITN the previous night (survey)
          'LSlfr3VzLCp'  // % of households with at least 1 ITN (survey)
        ];
        chartTitle = 'Cases by classification';
      } else {
        // Non-E2025 countries - Coverage of ITN and IRS
        if (currentRegion === 'AFR') {
          dataElements = [
            'rVUHAOEXV67', // % population that has access to ITNs (Modelled)
            'niYxtlxx68s', // At risk protected with IRS
            'SQWZ8POEhMI', // % of the population who slept under an ITN the previous night (survey)
            'LSlfr3VzLCp'  // % of households with at least 1 ITN (survey)
          ];
        } else {
          dataElements = [
            'LSlfr3VzLCp', // % of households with at least 1 ITN (survey)
            'niYxtlxx68s', // At risk protected with IRS
            'SQWZ8POEhMI'  // % of the population who slept under an ITN the previous night (survey)
          ];
        }
        chartTitle = 'Coverage of ITN and IRS';
      }
      
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const datasets: any[] = [];
      
      if (isE2025Country) {
        // E2025 countries datasets
        const atRiskITNData: number[] = [];
        const atRiskIRSData: number[] = [];
        const populationITNData: number[] = [];
        const householdsITNData: number[] = [];
        
        years.forEach(year => {
          const yearStr = year.toString();
          
          const atRiskITNRow = analyticsData.rows.find(row => 
            row[0] === 'bfRZJGS7KOh' && row[2] === yearStr
          );
          const rawAtRiskITNValue = atRiskITNRow ? parseFloat(atRiskITNRow[3]) || 0 : 0;
          const transformedAtRiskITNValue = dataTransformationService.transformValue(rawAtRiskITNValue, 'bfRZJGS7KOh');
          atRiskITNData.push(transformedAtRiskITNValue);
          
          const atRiskIRSRow = analyticsData.rows.find(row => 
            row[0] === 'niYxtlxx68s' && row[2] === yearStr
          );
          const rawAtRiskIRSValue = atRiskIRSRow ? parseFloat(atRiskIRSRow[3]) || 0 : 0;
          const transformedAtRiskIRSValue = dataTransformationService.transformValue(rawAtRiskIRSValue, 'niYxtlxx68s');
          atRiskIRSData.push(transformedAtRiskIRSValue);
          
          const populationITNRow = analyticsData.rows.find(row => 
            row[0] === 'SQWZ8POEhMI' && row[2] === yearStr
          );
          const rawPopulationITNValue = populationITNRow ? parseFloat(populationITNRow[3]) || 0 : 0;
          const transformedPopulationITNValue = dataTransformationService.transformValue(rawPopulationITNValue, 'SQWZ8POEhMI');
          populationITNData.push(transformedPopulationITNValue);
          
          const householdsITNRow = analyticsData.rows.find(row => 
            row[0] === 'LSlfr3VzLCp' && row[2] === yearStr
          );
          const rawHouseholdsITNValue = householdsITNRow ? parseFloat(householdsITNRow[3]) || 0 : 0;
          const transformedHouseholdsITNValue = dataTransformationService.transformValue(rawHouseholdsITNValue, 'LSlfr3VzLCp');
          householdsITNData.push(transformedHouseholdsITNValue);
        });
        
        datasets.push(
          {
            type: 'line' as const,
            label: 'At risk protected with ITNs',
            data: atRiskITNData,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
          },
          {
            type: 'line' as const,
            label: 'At risk protected with IRS',
            data: atRiskIRSData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 2,
          },
          {
            type: 'bar' as const,
            label: '% of the population who slept under an ITN the previous night (survey)',
            data: populationITNData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            order: 3,
          },
          {
            type: 'bar' as const,
            label: '% of households with at least 1 ITN (survey)',
            data: householdsITNData,
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 1,
            order: 4,
          }
        );
      } else {
        // Non-E2025 countries datasets
        const atRiskIRSData: number[] = [];
        const populationITNData: number[] = [];
        const householdsITNData: number[] = [];
        let accessITNData: number[] = [];
        
        years.forEach(year => {
          const yearStr = year.toString();
          
          if (currentRegion === 'AFR') {
            const accessITNRow = analyticsData.rows.find(row => 
              row[0] === 'rVUHAOEXV67' && row[2] === yearStr
            );
            const rawAccessITNValue = accessITNRow ? parseFloat(accessITNRow[3]) || 0 : 0;
            const transformedAccessITNValue = dataTransformationService.transformValue(rawAccessITNValue, 'rVUHAOEXV67');
            accessITNData.push(transformedAccessITNValue);
          }
          
          const atRiskIRSRow = analyticsData.rows.find(row => 
            row[0] === 'niYxtlxx68s' && row[2] === yearStr
          );
          const rawAtRiskIRSValue = atRiskIRSRow ? parseFloat(atRiskIRSRow[3]) || 0 : 0;
          const transformedAtRiskIRSValue = dataTransformationService.transformValue(rawAtRiskIRSValue, 'niYxtlxx68s');
          atRiskIRSData.push(transformedAtRiskIRSValue);
          
          const populationITNRow = analyticsData.rows.find(row => 
            row[0] === 'SQWZ8POEhMI' && row[2] === yearStr
          );
          const rawPopulationITNValue = populationITNRow ? parseFloat(populationITNRow[3]) || 0 : 0;
          const transformedPopulationITNValue = dataTransformationService.transformValue(rawPopulationITNValue, 'SQWZ8POEhMI');
          populationITNData.push(transformedPopulationITNValue);
          
          const householdsITNRow = analyticsData.rows.find(row => 
            row[0] === 'LSlfr3VzLCp' && row[2] === yearStr
          );
          const rawHouseholdsITNValue = householdsITNRow ? parseFloat(householdsITNRow[3]) || 0 : 0;
          const transformedHouseholdsITNValue = dataTransformationService.transformValue(rawHouseholdsITNValue, 'LSlfr3VzLCp');
          householdsITNData.push(transformedHouseholdsITNValue);
        });
        
        if (currentRegion === 'AFR') {
          datasets.push({
            type: 'line' as const,
            label: '% population that has access to ITNs (Modelled)',
            data: accessITNData,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1,
          });
        }
        
        datasets.push(
          {
            type: 'line' as const,
            label: 'At risk protected with IRS',
            data: atRiskIRSData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 2,
          },
          {
            type: 'bar' as const,
            label: '% of the population who slept under an ITN the previous night (survey)',
            data: populationITNData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            order: 3,
          },
          {
            type: 'bar' as const,
            label: '% of households with at least 1 ITN (survey)',
            data: householdsITNData,
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 1,
            order: 4,
          }
        );
      }
      
      const data = {
        labels: years,
        datasets
      };
      
      setChartData({ data, chartTitle });
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
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

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Use fixed container dimensions
    plugins: {
      title: {
        display: true,
        text: chartData.chartTitle,
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
        max: 100,
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="h-full">
      <Chart type="bar" data={chartData.data} options={options} ref={ref => setChartRef?.(chartId, ref)} />
      {chartSource && (
        <p className="text-xs text-gray-500 mt-4 print:text-[10px] print:text-black">Source: {chartSource}</p>
      )}
    </div>
  );
}