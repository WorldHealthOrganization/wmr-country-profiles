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
import { isE2025Country } from '../config/dhis2DataElements';
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

interface Chart6Props {
  orgUnit: string;
  countryCode: string;
  period: string;
  chartId: string;
  setChartRef?: (id: string, ref: ChartRefLike) => void;
  chartSource?: string;
}

export function Chart6({ orgUnit, countryCode, period, chartId, setChartRef, chartSource }: Chart6Props) {
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
      const isE2025 = isE2025Country(countryCode);
      
      let dataElements: string[];
      let chartTitle: string;
      let isDualAxis: boolean;
      
      if (isE2025) {
        // E2025 countries - Cases by classification
        dataElements = [
          's9PrOj148cI', // Imported cases
          'ulmblp2rojh', // Indigenous cases (P. falciparum)
          'UMgazh7eqLm', // Indigenous cases (P. vivax)
          'm0jc79EVfzn', // Introduced cases
          'MFzhW1xlBFW'  // Relapse cases
        ];
        chartTitle = 'Cases by classification';
        isDualAxis = false;
      } else {
        // Non-E2025 countries - Malaria inpatients and deaths
        dataElements = [
          'GPi56xW9OJJ', // Inpatient malaria cases
          'WoxQjgg6grm', // Inpatient malaria cases - Under 5 yrs
          'P7pI8pyU313', // Inpatient malaria deaths
          'jDevPHyqPDX'  // Inpatient malaria deaths - Under 5 yrs
        ];
        chartTitle = 'Malaria inpatients and deaths';
        isDualAxis = true;
      }
      
      const allPeriods = periods.join(';');
      
      const analyticsData = await dhis2Service.getAnalyticsData(
        dataElements,
        orgUnit,
        allPeriods
      );
      
      // Process the data
      const datasets: any[] = [];
      
      if (isE2025) {
        // E2025 countries datasets
        const importedCasesData: (number | null)[] = [];
        const indigenousPFalciparumData: (number | null)[] = [];
        const indigenousPVivaxData: (number | null)[] = [];
        const introducedCasesData: (number | null)[] = [];
        const relapseCasesData: (number | null)[] = [];
        
        years.forEach(year => {
          const yearStr = year.toString();
          
          const importedRow = analyticsData.rows.find(row => 
            row[0] === 's9PrOj148cI' && row[2] === yearStr
          );
          const rawImportedValue = importedRow && importedRow[3] ? parseFloat(importedRow[3]) : null;
          const transformedImportedValue = dataTransformationService.transformValue(rawImportedValue, 's9PrOj148cI');
          importedCasesData.push(transformedImportedValue);
          
          const indigenousPFRow = analyticsData.rows.find(row => 
            row[0] === 'ulmblp2rojh' && row[2] === yearStr
          );
          const rawIndigenousPFValue = indigenousPFRow && indigenousPFRow[3] ? parseFloat(indigenousPFRow[3]) : null;
          const transformedIndigenousPFValue = dataTransformationService.transformValue(rawIndigenousPFValue, 'ulmblp2rojh');
          indigenousPFalciparumData.push(transformedIndigenousPFValue);
          
          const indigenousPVRow = analyticsData.rows.find(row => 
            row[0] === 'UMgazh7eqLm' && row[2] === yearStr
          );
          const rawIndigenousPVValue = indigenousPVRow && indigenousPVRow[3] ? parseFloat(indigenousPVRow[3]) : null;
          const transformedIndigenousPVValue = dataTransformationService.transformValue(rawIndigenousPVValue, 'UMgazh7eqLm');
          indigenousPVivaxData.push(transformedIndigenousPVValue);
          
          const introducedRow = analyticsData.rows.find(row => 
            row[0] === 'm0jc79EVfzn' && row[2] === yearStr
          );
          const rawIntroducedValue = introducedRow && introducedRow[3] ? parseFloat(introducedRow[3]) : null;
          const transformedIntroducedValue = dataTransformationService.transformValue(rawIntroducedValue, 'm0jc79EVfzn');
          introducedCasesData.push(transformedIntroducedValue);
          
          const relapseRow = analyticsData.rows.find(row => 
            row[0] === 'MFzhW1xlBFW' && row[2] === yearStr
          );
          const rawRelapseValue = relapseRow && relapseRow[3] ? parseFloat(relapseRow[3]) : null;
          const transformedRelapseValue = dataTransformationService.transformValue(rawRelapseValue, 'MFzhW1xlBFW');
          relapseCasesData.push(transformedRelapseValue);
        });
        
        datasets.push(
          {
            type: 'line' as const,
            label: 'Imported cases',
            data: importedCasesData,
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
            label: 'Indigenous cases (P. falciparum)',
            data: indigenousPFalciparumData,
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
            label: 'Indigenous cases (P. vivax)',
            data: indigenousPVivaxData,
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
            label: 'Introduced cases',
            data: introducedCasesData,
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: 'rgba(168, 85, 247, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          },
          {
            type: 'line' as const,
            label: 'Relapse cases',
            data: relapseCasesData,
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(245, 158, 11, 1)',
            pointBorderColor: 'rgba(245, 158, 11, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          }
        );
      } else {
        // Non-E2025 countries datasets
        const inpatientCasesData: (number | null)[] = [];
        const inpatientCasesUnder5Data: (number | null)[] = [];
        const inpatientDeathsData: (number | null)[] = [];
        const inpatientDeathsUnder5Data: (number | null)[] = [];
        
        years.forEach(year => {
          const yearStr = year.toString();
          
          const inpatientCasesRow = analyticsData.rows.find(row => 
            row[0] === 'GPi56xW9OJJ' && row[2] === yearStr
          );
          const rawInpatientCasesValue = inpatientCasesRow && inpatientCasesRow[3] ? parseFloat(inpatientCasesRow[3]) : null;
          const transformedInpatientCasesValue = dataTransformationService.transformValue(rawInpatientCasesValue, 'GPi56xW9OJJ');
          inpatientCasesData.push(transformedInpatientCasesValue);
          
          const inpatientCasesU5Row = analyticsData.rows.find(row => 
            row[0] === 'WoxQjgg6grm' && row[2] === yearStr
          );
          const rawInpatientCasesU5Value = inpatientCasesU5Row && inpatientCasesU5Row[3] ? parseFloat(inpatientCasesU5Row[3]) : null;
          const transformedInpatientCasesU5Value = dataTransformationService.transformValue(rawInpatientCasesU5Value, 'WoxQjgg6grm');
          inpatientCasesUnder5Data.push(transformedInpatientCasesU5Value);
          
          const inpatientDeathsRow = analyticsData.rows.find(row => 
            row[0] === 'P7pI8pyU313' && row[2] === yearStr
          );
          const rawInpatientDeathsValue = inpatientDeathsRow && inpatientDeathsRow[3] ? parseFloat(inpatientDeathsRow[3]) : null;
          const transformedInpatientDeathsValue = dataTransformationService.transformValue(rawInpatientDeathsValue, 'P7pI8pyU313');
          inpatientDeathsData.push(transformedInpatientDeathsValue);
          
          const inpatientDeathsU5Row = analyticsData.rows.find(row => 
            row[0] === 'jDevPHyqPDX' && row[2] === yearStr
          );
          const rawInpatientDeathsU5Value = inpatientDeathsU5Row && inpatientDeathsU5Row[3] ? parseFloat(inpatientDeathsU5Row[3]) : null;
          const transformedInpatientDeathsU5Value = dataTransformationService.transformValue(rawInpatientDeathsU5Value, 'jDevPHyqPDX');
          inpatientDeathsUnder5Data.push(transformedInpatientDeathsU5Value);
        });
        
        datasets.push(
          {
            type: 'line' as const,
            label: 'Inpatient malaria cases',
            data: inpatientCasesData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: 'Inpatient malaria cases - Under 5 yrs',
            data: inpatientCasesUnder5Data,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: 'rgba(34, 197, 94, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: 'Inpatient malaria deaths',
            data: inpatientDeathsData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y1',
          },
          {
            type: 'line' as const,
            label: 'Inpatient malaria deaths - Under 5 yrs',
            data: inpatientDeathsUnder5Data,
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: 'rgba(168, 85, 247, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y1',
          }
        );
      }
      
      const data = {
        labels: years,
        datasets
      };
      
      setChartData({ data, chartTitle, isDualAxis });
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
            return `${context.dataset.label}: ${value !== null ? value.toLocaleString() : '-'}`;
          },
        },
      },
    },
    scales: chartData.isDualAxis ? {
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
              return `${(numValue / 1000000).toFixed(0)}M`;
            } else if (numValue >= 1000) {
              return `${(numValue / 1000).toFixed(0)}k`;
            }
            return numValue.toString();
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
          text: 'Deaths',
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
            if (numValue >= 1000000) {
              return `${(numValue / 1000000).toFixed(0)}M`;
            } else if (numValue >= 1000) {
              return `${(numValue / 1000).toFixed(0)}k`;
            }
            return numValue.toString();
          },
        },
        beginAtZero: true,
      },
    } : {
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
              return `${(numValue / 1000000).toFixed(0)}M`;
            } else if (numValue >= 1000) {
              return `${(numValue / 1000).toFixed(0)}k`;
            }
            return numValue.toString();
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

  return (
    <div className="h-full">
      <Chart type="line" data={chartData.data} options={options} ref={ref => setChartRef?.(chartId, ref)} />
      {chartSource && (
        <p className="text-xs text-gray-500 mt-4 print:text-[10px] print:text-black">Source: {chartSource}</p>
      )}
    </div>
  );
}