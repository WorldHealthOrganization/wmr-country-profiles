import React, { useState, useEffect } from 'react';
import { Country, CountryProfileData } from '../types/dhis2';
import { dataProcessingService } from '../services/dataProcessingService';
import { dhis2Service } from '../services/dhis2Service';
import { LoadingSpinner } from './LoadingSpinner';
import { Chart1 } from './Chart1';
import { Chart2 } from './Chart2';
import { Chart3 } from './Chart3';
import { Chart4 } from './Chart4';
import { Chart5 } from './Chart5';
import { Chart6 } from './Chart6';
import { Chart7 } from './Chart7';
import { Chart8 } from './Chart8';
import { Chart9 } from './Chart9';
import { getChartSource } from '../utils/chartSourceUtils';
import { isE2025Country } from '../config/dhis2DataElements';
import { MapPin, TrendingUp, TrendingDown, Users, Activity, Shield, Pill, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { useSnapshots } from '../utils/useSnapshots';
import { PrintButton } from './PrintButton';

interface CountryProfileProps {
  country: Country;
  period: string;
}

interface MapData {
  map1Name: string;
  map2Name: string;
  map1Legend: string;
  map2Legend: string;
  map1Year: string;
  map2Year: string;
}

export function CountryProfile({ country, period }: CountryProfileProps) {
  const [data, setData] = useState<CountryProfileData | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [regionHeader, setRegionHeader] = useState<string>('');
  const [orgUnitDetails, setOrgUnitDetails] = useState<any>(null);
  const [chart9HasData, setChart9HasData] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setChartRef, getChartPng, prepareSnapshots } = useSnapshots();
  const { setContainerRef } = useSnapshots();
  
  // Chart source states
 
  const [chart1Source, setChart1Source] = useState<string>('');
  const [chart2Source, setChart2Source] = useState<string>('');
  const [chart3Source, setChart3Source] = useState<string>('');
  const [chart4Source, setChart4Source] = useState<string>('');
  const [chart5Source, setChart5Source] = useState<string>('');
  const [chart6Source, setChart6Source] = useState<string>('');
  const [chart7Source, setChart7Source] = useState<string>('');
  const [chart8Source, setChart8Source] = useState<string>('');
  const [chart9Source, setChart9Source] = useState<string>('');
  const [combinedChartSource, setCombinedChartSource] = useState<string>('');

  const handlePrintPrepare = async () => {
    await prepareSnapshots();
  };

  useEffect(() => {
    // Reset chart9HasData when country or period changes
    setChart9HasData(true);
    loadCountryData();
    loadMapData();
    loadChart2Source();
    loadChartSurveySources();
  }, [country.id, period]);

  const loadCountryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await dataProcessingService.processCountryData(country.id, period);
      setData(profileData);
      
      // Get organization unit details to determine region
      const orgDetails = await dhis2Service.getOrganisationUnit(country.id);
      setOrgUnitDetails(orgDetails);
      const currentRegion = orgDetails.parent?.code || '';
      
      // Map region codes to full names
      let mappedRegionHeader = '';
      switch (currentRegion) {
        case 'AFR':
          mappedRegionHeader = 'African Region';
          break;
        case 'EMR':
          mappedRegionHeader = 'Eastern Mediterranean Region';
          break;
        case 'EUR':
          mappedRegionHeader = 'European Region';
          break;
        case 'AMR':
          mappedRegionHeader = 'Region of the Americas';
          break;
        case 'SEAR':
          mappedRegionHeader = 'South-East Asia Region';
          break;
        case 'WPR':
          mappedRegionHeader = 'Western Pacific Region';
          break;
        default:
          mappedRegionHeader = '';
      }
      
      setRegionHeader(mappedRegionHeader);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load country data');
    } finally {
      setLoading(false);
    }
  };

  const loadMapData = async () => {
    try {
      // Map data elements
      const mapElements = [
        'f2u7VciFSDC', // Map1Year
        'JEPMG4n2TIN', // Map2Year
        'PJKhyoOd4C7', // Map1Name
        'FYt2o1zbOwm', // Map2Name
        'INwlclks0KQ', // Map1Legend
        'lnsHnhqAaTj'  // Map2Legend
      ];

      // Use period-1 for map data elements
      const mapPeriod = (parseInt(period)).toString();
      
      console.log('🗺️ Loading map data:', {
        period,
        mapPeriod,
        countryId: country.id,
        countryName: country.displayName
      });

      const analyticsData = await dhis2Service.getAnalyticsData(
        mapElements,
        country.id,
        mapPeriod
      );

      console.log('🗺️ Map analytics data received:', analyticsData);

      // Create text data map for map data
      const textDataMap = new Map<string, string>();
      analyticsData.rows.forEach(row => {
        const dataElement = row[0];
        const rawValue = row[3];
        textDataMap.set(dataElement, rawValue);
      });

      // Get map names and years directly from DHIS2
      const map1Name = textDataMap.get('PJKhyoOd4C7') || '';
      const map2Name = textDataMap.get('FYt2o1zbOwm') || '';
      const map1Legend = textDataMap.get('INwlclks0KQ') || '';
      const map2Legend = textDataMap.get('lnsHnhqAaTj') || '';
      const map1Year = textDataMap.get('f2u7VciFSDC') || '';
      const map2Year = textDataMap.get('JEPMG4n2TIN') || '';

      console.log('🗺️ Map data extracted:', {
        map1Name,
        map2Name,
        map1Legend,
        map2Legend,
        map1Year,
        map2Year
      });

      const mapDataObj = {
        map1Name,
        map2Name,
        map1Legend,
        map2Legend,
        map1Year,
        map2Year
      };

      // Log the image paths that will be used (always use period for path)
      // Using relative paths for DHIS2 app deployment
      const basePath = './img';
      const currentLocation = typeof window !== 'undefined' ? window.location.href : 'unknown';
      
      if (map1Name) {
        const relativePath = `${basePath}/${period}/${map1Name}`;
        const fullUrl = typeof window !== 'undefined' ? new URL(relativePath, window.location.href).href : relativePath;
        console.log('🗺️ Map 1 image path:', {
          relativePath,
          fullUrl,
          currentLocation,
          period,
          map1Name
        });
      }
      if (map2Name) {
        const relativePath = `${basePath}/${period}/${map2Name}`;
        const fullUrl = typeof window !== 'undefined' ? new URL(relativePath, window.location.href).href : relativePath;
        console.log('🗺️ Map 2 image path:', {
          relativePath,
          fullUrl,
          currentLocation,
          period,
          map2Name
        });
      }
      if (map1Legend) {
        const relativePath = `${basePath}/${period}/${map1Legend}`;
        const fullUrl = typeof window !== 'undefined' ? new URL(relativePath, window.location.href).href : relativePath;
        console.log('🗺️ Map 1 legend path:', {
          relativePath,
          fullUrl,
          currentLocation,
          period,
          map1Legend
        });
      }
      if (map2Legend) {
        const relativePath = `${basePath}/${period}/${map2Legend}`;
        const fullUrl = typeof window !== 'undefined' ? new URL(relativePath, window.location.href).href : relativePath;
        console.log('🗺️ Map 2 legend path:', {
          relativePath,
          fullUrl,
          currentLocation,
          period,
          map2Legend
        });
      }

      setMapData(mapDataObj);
    } catch (err) {
      console.error('Failed to load map data:', err);
    }
  };

  const loadChart2Source = async () => {
    try {
      const source = await getChartSource(["nvqnQcEbuPA", "o4iFtiN0YZh"], country.id);
      setChart2Source(source);
    } catch (error) {
      console.error('Failed to load Chart 2 source:', error);
      setChart2Source('');
    }
  };

  const loadChartSurveySources = async () => {
    try {
      // Collect survey data element UIDs
      const surveyDataElementUIDs = new Set<string>();
      
      // Add the survey data element UIDs
      surveyDataElementUIDs.add('nvqnQcEbuPA');
      surveyDataElementUIDs.add('o4iFtiN0YZh');
      surveyDataElementUIDs.add('IGQENa04DFm');
      surveyDataElementUIDs.add('heI5NQZqZRW');
      surveyDataElementUIDs.add('ZnSwOwcQt52');
      surveyDataElementUIDs.add('gZrHErmb74i');
      
      // Check if this is an E2025 country
      const isE2025 = isE2025Country(country.code);
      
      if (isE2025) {
        surveyDataElementUIDs.add('LSlfr3VzLCp');
      } else {
        surveyDataElementUIDs.add('SQWZ8POEhMI');
      }
      
      // Convert Set to Array
      const uniqueUIDs = Array.from(surveyDataElementUIDs);
      
      // Aggregate sources from multiple calls (in pairs)
      const allSources: string[] = [];
      
      // Call getChartSource for pairs of UIDs
      for (let i = 0; i < uniqueUIDs.length; i += 2) {
        const pair = uniqueUIDs.slice(i, i + 2);
        try {
          const source = await getChartSource(pair, country.id);
          if (source && source.trim()) {
            allSources.push(source);
          }
        } catch (error) {
          console.error(`Failed to load source for pair ${i}:`, error);
        }
      }
      
      // Combine all sources, removing duplicates
      // Since sources are formatted strings, we'll join them with semicolons
      const combinedSource = allSources
        .filter((source, index, self) => self.indexOf(source) === index) // Remove duplicates
        .join('; ');
      
      setCombinedChartSource(combinedSource);
    } catch (error) {
      console.error('Failed to load combined chart survey sources:', error);
      setCombinedChartSource('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading country profile for {country.displayName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadCountryData}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div id="country-profile-content" className="space-y-8 print:space-y-3 print-exact">
      {/* Country Header */}
      <div className="bg-blue-600 rounded-xl shadow-lg text-white p-8 avoid-break keep-with-next print:bg-white print:shadow-none print:border print:text-black print:p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold print:text-xl print:leading-snug">{country.displayName}</h1>
            {regionHeader && (
              <p className="text-blue-100 text-lg mt-1 print:text-sm print:text-black print:opacity-75 avoid-break keep-with-next">{regionHeader}</p>
            )}
          </div>
          <div className="print:hidden">
            <PrintButton onPrepare={handlePrintPrepare} />
          </div>
        </div>
      </div>

      {/* Maps and Legends Section */}
      {/* Maps and Legends Section - Only show if at least one map is available */}
      {(mapData?.map1Name || mapData?.map2Name) && (
        <div className={`grid grid-cols-1 gap-6 print:gap-4 avoid-break keep-with-prev ${
          mapData?.map1Name && mapData?.map2Name 
            ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2' 
            : 'md:grid-cols-1'
        }`}>
          {/* Map 1 and Legend 1 - Only show if map1Name exists */}
          {mapData?.map1Name && (() => {
            const map1Path = `./img/${period}/${mapData.map1Name}`;
            const map1FullUrl = typeof window !== 'undefined' ? new URL(map1Path, window.location.href).href : map1Path;
            console.log('🖼️ Constructing Map 1 path:', {
              relativePath: map1Path,
              fullUrl: map1FullUrl,
              currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
              windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
              period,
              map1Name: mapData.map1Name
            });
            
            return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 avoid-break print:shadow-none print:border print:p-3">
                <div className="flex gap-0">
                  <div className="bg-white-100 rounded-lg h-64 flex items-center justify-center overflow-hidden" style={{ width: '410px' }}>
                    <img 
                      src={map1Path}
                      alt={`Map 1: ${mapData.map1Name.replace('.png', '')} for ${country.displayName} in ${mapData.map1Year || period}`}
                      onLoad={() => {
                        console.log('✅ Map 1 loaded successfully:', {
                          relativePath: map1Path,
                          fullUrl: map1FullUrl,
                          actualSrc: (document.querySelector(`img[alt*="Map 1:"]`) as HTMLImageElement)?.src
                        });
                      }}
                      className="max-w-full max-h-full object-contain"
                      style={{ width: '410px', height: '260px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const failedPath = target.src;
                        console.error('❌ Map 1 image failed to load:', {
                          failedPath,
                          relativePath: map1Path,
                          fullUrl: map1FullUrl,
                          currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                          windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                          period,
                          map1Name: mapData.map1Name
                        });
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center text-gray-500 print:text-sm">
                              <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v4 M12 18h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                              <p class="text-sm">Map not available</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                  {mapData?.map1Legend && (() => {
                    const legend1Path = `./img/${period}/${mapData.map1Legend}`;
                    const legend1FullUrl = typeof window !== 'undefined' ? new URL(legend1Path, window.location.href).href : legend1Path;
                    console.log('🖼️ Constructing Map 1 Legend path:', {
                      relativePath: legend1Path,
                      fullUrl: legend1FullUrl,
                      currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                      period,
                      map1Legend: mapData.map1Legend
                    });
                    
                    return (
                      <div className="bg-white-100 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                        <img 
                          src={legend1Path}
                          alt={`Legend for Map 1: ${mapData.map1Name.replace('.png', '')}`}
                          className="max-w-full max-h-full object-contain"
                          style={{ height: '200px' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const failedPath = target.src;
                            console.error('❌ Map 1 legend failed to load:', {
                              failedPath,
                              relativePath: legend1Path,
                              fullUrl: legend1FullUrl,
                              currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                              period,
                              map1Legend: mapData.map1Legend
                            });
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="text-center text-gray-500 print:text-sm">
                                  <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v4 M12 18h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  <p class="text-sm">Legend not available</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>
                {mapData?.map1Year && mapData.map1Year !== period && (
                  <p className="text-sm text-gray-600 mb-2 print:text-xs">Year: {mapData.map1Year}</p>
                )}
              </div>
            );
          })()}

          {/* Map 2 and Legend 2 - Only show if map2Name exists */}
          {mapData?.map2Name && (() => {
            const map2Path = `./img/${period}/${mapData.map2Name}`;
            const map2FullUrl = typeof window !== 'undefined' ? new URL(map2Path, window.location.href).href : map2Path;
            console.log('🖼️ Constructing Map 2 path:', {
              relativePath: map2Path,
              fullUrl: map2FullUrl,
              currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
              windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
              period,
              map2Name: mapData.map2Name
            });
            
            return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 avoid-break print:shadow-none print:border print:p-3">
                <div className="flex gap-0">
                  <div className="bg-white-100 rounded-lg h-64 flex items-center justify-center overflow-hidden" style={{ width: '410px' }}>
                    <img 
                      src={map2Path}
                      alt={`Map 2: ${mapData.map2Name.replace('.png', '')} for ${country.displayName} in ${mapData.map2Year || period}`}
                      className="max-w-full max-h-full object-contain"
                      style={{ width: '410px', height: '260px' }}
                      onLoad={() => {
                        console.log('✅ Map 2 loaded successfully:', {
                          relativePath: map2Path,
                          fullUrl: map2FullUrl,
                          actualSrc: (document.querySelector(`img[alt*="Map 2:"]`) as HTMLImageElement)?.src
                        });
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const failedPath = target.src;
                        console.error('❌ Map 2 image failed to load:', {
                          failedPath,
                          relativePath: map2Path,
                          fullUrl: map2FullUrl,
                          currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                          windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                          period,
                          map2Name: mapData.map2Name
                        });
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center text-gray-500 print:text-sm">
                              <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v4 M12 18h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                              <p class="text-sm">Map not available</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                  {mapData?.map2Legend && (() => {
                    const legend2Path = `./img/${period}/${mapData.map2Legend}`;
                    const legend2FullUrl = typeof window !== 'undefined' ? new URL(legend2Path, window.location.href).href : legend2Path;
                    console.log('🖼️ Constructing Map 2 Legend path:', {
                      relativePath: legend2Path,
                      fullUrl: legend2FullUrl,
                      currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                      period,
                      map2Legend: mapData.map2Legend
                    });
                    
                    return (
                      <div className="bg-white-100 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                        <img 
                          src={legend2Path}
                          alt={`Legend for Map 2: ${mapData.map2Name.replace('.png', '')}`}
                          className="max-w-full max-h-full object-contain"
                          style={{ height: '200px' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const failedPath = target.src;
                            console.error('❌ Map 2 legend failed to load:', {
                              failedPath,
                              relativePath: legend2Path,
                              fullUrl: legend2FullUrl,
                              currentLocation: typeof window !== 'undefined' ? window.location.href : 'unknown',
                              period,
                              map2Legend: mapData.map2Legend
                            });
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="text-center text-gray-500 print:text-sm">
                                  <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v4 M12 18h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  <p class="text-sm">Legend not available</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>
                {mapData?.map2Year && mapData.map2Year !== period && (
                  <p className="text-sm text-gray-600 mb-2 print:text-xs">Year: {mapData.map2Year}</p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Epidemiological Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden avoid-break print:shadow-none print:border print-panel-b">
        <div className="bg-green-500 px-6 py-4 print:bg-white print:border-b print:border-gray-300">
          <h2 className="text-xl font-bold text-white flex items-center space-x-3 print:text-base print:text-black print:leading-snug">
            <TrendingUp className="h-6 w-6 print:h-5 print:w-5" />
            <span>I. Epidemiological Profile</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 print:grid-cols-2">
          {/* Population Distribution */}
          <div className="p-6 print:p-3">
            <div className="flex items-center space-x-2 mb-4 print:mb-2">
              <Users className="h-5 w-5 text-blue-500 print:h-4 print:w-4" />
              <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Population Distribution (Country reported)</h3>
            </div>
            <div className="overflow-x-auto avoid-break">
              <table className="w-full text-sm print:text-xs">
                <thead>
                  <tr className="bg-gray-50 avoid-break">
                    <th className="text-left py-2 px-3 font-medium text-gray-700 print:py-1 print:px-2">Population</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700 print:py-1 print:px-2">{period}</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700 print:py-1 print:px-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 avoid-break">
                  <tr className="avoid-break">
                    <td className="py-2 px-3 text-gray-700 print:py-1 print:px-2">High transmission ({'>'}1 case per 1000 population)</td>
                    <td className="py-2 px-3 text-right font-medium print:py-1 print:px-2">
                      {data.population.highTransmission > 0 ? dataProcessingService.formatNumber(data.population.highTransmission) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-blue-600 print:py-1 print:px-2">
                      {data.population.total > 0 ? dataProcessingService.calculatePercentage(data.population.highTransmission, data.population.total) : '-'}
                    </td>
                  </tr>
                  <tr className="avoid-break">
                    <td className="py-2 px-3 text-gray-700 print:py-1 print:px-2">Low transmission (0-1 case per 1000 population)</td>
                    <td className="py-2 px-3 text-right font-medium print:py-1 print:px-2">
                      {data.population.lowTransmission > 0 ? dataProcessingService.formatNumber(data.population.lowTransmission) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-green-600 print:py-1 print:px-2">
                      {data.population.total > 0 ? dataProcessingService.calculatePercentage(data.population.lowTransmission, data.population.total) : '-'}
                    </td>
                  </tr>
                  <tr className="avoid-break">
                    <td className="py-2 px-3 text-gray-700 print:py-1 print:px-2">Malaria free (0 cases)</td>
                    <td className="py-2 px-3 text-right font-medium print:py-1 print:px-2">
                      {data.population.malariaFree > 0 ? dataProcessingService.formatNumber(data.population.malariaFree) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600 print:py-1 print:px-2">
                      {data.population.total > 0 ? dataProcessingService.calculatePercentage(data.population.malariaFree, data.population.total) : '-'}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold avoid-break">
                    <td className="py-2 px-3 text-gray-900 print:py-1 print:px-2">Total</td>
                    <td className="py-2 px-3 text-right print:py-1 print:px-2">
                      {data.population.total > 0 ? dataProcessingService.formatNumber(data.population.total) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right print:py-1 print:px-2">{data.population.total > 0 ? '100%' : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Parasites and Vectors */}
          <div className="p-6 print:p-3">
            <div className="flex items-center space-x-2 mb-4 print:mb-2">
              <Activity className="h-5 w-5 text-red-500 print:h-4 print:w-4" />
              <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Parasites and Vectors</h3>
            </div>
            <div className="space-y-4 print:space-y-2">
              <div className="bg-red-50 rounded-lg p-4 print:p-2 avoid-break">
                <h4 className="font-medium text-gray-900 mb-2 print:text-xs print:mb-1">Major <em>Plasmodium Species</em></h4>
                <div className="text-sm text-gray-700 print:text-xs">
                  <p><em>P. falciparum</em><sup>*</sup>: <span className="font-semibold text-amber-600">{data.parasites.pFalciparum > 0 ? `${data.parasites.pFalciparum}%` : '-'}</span></p>
                  <p><em>P. vivax</em>: <span className="font-semibold text-orange-600">{data.parasites.pVivax > 0 ? `${data.parasites.pVivax}%` : '-'}</span></p>
                </div>
                <div className="mt-3 pt-2 border-t border-red-200 print:mt-1 print:pt-1">
                <p className="text-xs text-gray-600 italic print:text-[10px]"><sup>*</sup>Includes mixed infections and other species of <span className="not-italic">Plasmodium</span></p>                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 print:p-2 avoid-break">
                <h4 className="font-medium text-gray-900 mb-2 print:text-xs print:mb-1">Major <em>Anopheles</em> Species</h4>
                <div className="flex flex-wrap gap-2 min-h-[24px] print:min-h-[16px]">
                  {data.parasites.anophelesSpecies.length > 0 ? (
                    <span className="text-xs text-gray-700 print:text-[10px]">
                      <em>{data.parasites.anophelesSpecies.join(', ')}</em>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 print:text-[10px]">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border-t border-gray-200 print:grid-cols-2">
          {/* Reported Cases and Deaths */}
          <div className="p-6 print:p-3">
            <div className="flex items-center space-x-2 mb-4 print:mb-2">
              <AlertCircle className="h-5 w-5 text-orange-500 print:h-4 print:w-4" />
              <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Reported Cases and Deaths</h3>
            </div>
            <div className="space-y-3 print:space-y-2">
              {/* Always show: Total cases (presumed + confirmed) */}
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg print:p-2 avoid-break">
                <span className="text-sm text-gray-700 print:text-xs">Total cases (presumed + confirmed)</span>
                <span className="font-semibold text-orange-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.totalCases)}</span>
              </div>
              
              {/* If param_EPI_DISPLAY=1, show Total confirmed cases */}
              {data.cases.paramEpiDisplay === 1 && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg print:p-2 avoid-break">
                  <span className="text-sm text-gray-700 print:text-xs">Total confirmed cases</span>
                  <span className="font-semibold text-blue-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.totalConfirmedCases)}</span>
                </div>
              )}
              
              {/* If param_EPI_DISPLAY=2 OR 3, show Reported indigenous confirmed cases */}
              {(data.cases.paramEpiDisplay === 2 || data.cases.paramEpiDisplay === 3) && (
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg print:p-2 avoid-break">
                  <span className="text-sm text-gray-700 print:text-xs">Reported indigenous confirmed cases</span>
                  <span className="font-semibold text-indigo-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.reportedIndigenousConfirmedCases)}</span>
                </div>
              )}
              
              {/* If param_EPI_DISPLAY=1 OR 2, show the three confirmed cases breakdowns */}
              {(data.cases.paramEpiDisplay === 1 || data.cases.paramEpiDisplay === 2) && (
                <>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg print:p-2 avoid-break">
                    <span className="text-sm text-gray-700 print:text-xs">
                      Confirmed cases from public sector (health facility){data.cases.footnoteText ? '*' : ''}
                    </span>
                    <span className="font-semibold text-blue-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.confirmedHealthFacility)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg print:p-2 avoid-break">
                    <span className="text-sm text-gray-700 print:text-xs">Confirmed cases at community level</span>
                    <span className="font-semibold text-green-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.confirmedCommunity)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg print:p-2 avoid-break">
                    <span className="text-sm text-gray-700 print:text-xs">Confirmed cases from private sector</span>
                    <span className="font-semibold text-purple-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.confirmedPrivateSector)}</span>
                  </div>
                </>
              )}
              
              {/* Deaths section */}
              {data.cases.paramEpiDisplay === 1 && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg print:p-2 avoid-break">
                  <span className="text-sm text-gray-700 print:text-xs">Reported deaths</span>
                  <span className="font-semibold text-red-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.reportedDeaths)}</span>
                </div>
              )}
              
              {(data.cases.paramEpiDisplay === 2 || data.cases.paramEpiDisplay === 3) && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg print:p-2 avoid-break">
                  <span className="text-sm text-gray-700 print:text-xs">Indigenous deaths</span>
                  <span className="font-semibold text-red-600 print:text-xs">{dataProcessingService.formatNumber(data.cases.indigenousDeaths)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estimates - conditionally shown */}
          {data.showEstimates && (
            <div className="p-6 print:p-3">
              <div className="flex items-center space-x-2 mb-4 print:mb-2">
                <TrendingDown className="h-5 w-5 text-indigo-500 print:h-4 print:w-4" />
                <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">WHO Estimates</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                {/* Estimated Cases */}
                <div className="bg-indigo-50 rounded-lg p-6 text-center print:p-3 avoid-break">
                  <div className="text-2xl font-bold text-indigo-600 mb-2 print:text-lg print:mb-1">
                    {data.estimates.estimatedCases > 0 ? dataProcessingService.formatNumber(data.estimates.estimatedCases) : '-'}
                  </div>
                  <div className="text-sm text-gray-700 mb-3 print:text-xs print:mb-1">Estimated Cases</div>
                  <div className="text-xs text-gray-600 print:text-[10px]">
                    Confidence Interval: [
                    {data.estimates.casesLowerBound > 0 ? dataProcessingService.formatNumber(data.estimates.casesLowerBound) : '-'}, 
                    {data.estimates.casesUpperBound > 0 ? dataProcessingService.formatNumber(data.estimates.casesUpperBound) : '-'}
                    ]
                  </div>
                </div>
                
                {/* Estimated Deaths */}
                <div className="bg-red-50 rounded-lg p-6 text-center print:p-3 avoid-break">
                  <div className="text-2xl font-bold text-red-600 mb-2 print:text-lg print:mb-1">
                    {data.estimates.estimatedDeaths > 0 ? dataProcessingService.formatNumber(data.estimates.estimatedDeaths) : '-'}
                  </div>
                  <div className="text-sm text-gray-700 mb-3 print:text-xs print:mb-1">Estimated Deaths</div>
                  <div className="text-xs text-gray-600 print:text-[10px]">
                    Confidence Interval: [
                    {data.estimates.deathsLowerBound > 0 ? dataProcessingService.formatNumber(data.estimates.deathsLowerBound) : '-'}, 
                    {data.estimates.deathsUpperBound > 0 ? dataProcessingService.formatNumber(data.estimates.deathsUpperBound) : '-'}
                    ]
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Header for Panel C - Print Page Break Before */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 avoid-break keep-with-next print-panel-c-header">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
            II. Intervention policies and strategies
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border-t border-gray-200 print:grid-cols-2">
          {/* Interventions and Policies */}
          <div className="p-6 print:p-3">
            <div className="flex items-center space-x-2 mb-4 print:mb-2">
              <Shield className="h-5 w-5 text-green-500 print:h-4 print:w-4" />
              <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Interventions and Policies</h3>
            </div>
            <div className="overflow-x-auto avoid-break">
              <table className="w-full text-xs print:text-[10px]">
                <thead>
                  <tr className="bg-gray-50 avoid-break">
                    <th className="text-left py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Intervention</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Policies/Strategies</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Policy</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 avoid-break">
                  {data.policies.map((policy, index) => (
                    <tr key={index} className="avoid-break">
                      <td className="py-2 px-2 text-gray-700 break-words print:py-1 print:px-1">
                        {index === 0 || data.policies[index - 1].intervention !== policy.intervention 
                          ? policy.intervention 
                          : ''}
                      </td>
                      <td className="py-2 px-2 text-gray-700 text-xs break-words print:py-1 print:px-1 print:text-[9px]">{policy.strategy}</td>
                      <td className="py-2 px-2 text-center print:py-1 print:px-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium print:px-1 print:py-0 print:text-[9px] ${
                          policy.implemented 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {policy.policy}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center print:py-1 print:px-1">
                        {policy.yearAdopted || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Policy Footnotes */}
            <div className="mt-4 pt-3 border-t border-gray-200 print:mt-2 print:pt-1 avoid-break">
              <div className="space-y-1 text-xs text-gray-600 print:text-[10px] print:space-y-0">
                <p><strong>Yes*</strong> = Policy adopted, but not implemented in {period}, or no data exist to support implementation</p>
                <p><strong>No</strong> = Policy does not exist or policy has been discontinued</p>
                <p>Earliest year that policy is adopted was adjusted based on the earliest year that the WHO policy was recommended</p>
              </div>
            </div>
          </div>

          {/* Right Column - Treatment Policy, Therapeutic Efficacy, and Resistance Status */}
          <div className="p-6 space-y-6 print:p-3 print:space-y-3">
            {/* Antimalarial Treatment Policy */}
            <div className="avoid-break">
              <div className="flex items-center space-x-2 mb-4 print:mb-2">
                <Pill className="h-5 w-5 text-purple-500 print:h-4 print:w-4" />
                <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Antimalarial Treatment Policy</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs print:text-[9px]">
                  <thead>
                    <tr className="bg-gray-50 avoid-break">
                      <th className="text-left py-2 px-2 font-medium text-gray-700 print:text-[9px] print:py-1 print:px-1">Antimalaria treatment policy</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 print:text-[9px] print:py-1 print:px-1">Medicine</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700 print:text-[9px] print:py-1 print:px-1">Year adopted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 avoid-break">
                    {data.treatment.map((treatment, index) => {
                      // Format category text to italicize P. falciparum and P. vivax
                      const formatCategory = (text: string) => {
                        return text
                          .replace(/P\. falciparum/g, '<em>P. falciparum</em>')
                          .replace(/P\. vivax/g, '<em>P. vivax</em>');
                      };
                      return (
                      <tr key={index} className="avoid-break">
                        <td className="py-2 px-2 text-gray-700 print:text-[9px] print:py-1 print:px-1" dangerouslySetInnerHTML={{ __html: formatCategory(treatment.category) }}></td>
                        {treatment.yearAdopted ? (
                          <>
                            <td className="py-2 px-2 text-gray-700 print:text-[9px] print:py-1 print:px-1">{treatment.medicine}</td>
                            <td className="py-2 px-2 text-center print:text-[9px] print:py-1 print:px-1">
                              {treatment.yearAdopted}
                            </td>
                          </>
                        ) : (
                          <td className="py-2 px-2 text-gray-700 print:text-[9px] print: py-1 print:px-1" colSpan={2}>
                            {treatment.medicine}
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Type of RDT used (public) */}
            <div className="avoid-break">
              <div className="flex items-center space-x-2 mb-4 print:mb-2">
                <Activity className="h-5 w-5 text-blue-500 print:h-4 print:w-4" />
                <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Type of RDT used (public)</h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 print:p-2">
                <p className="text-xs text-gray-700 print:text-[10px]">{data.rdtType}</p>
              </div>
            </div>

            {/* Therapeutic Efficacy Tests */}
            <div className="avoid-break">
              <div className="flex items-center space-x-2 mb-4 print:mb-2">
                <Activity className="h-5 w-5 text-orange-500 print:h-4 print:w-4" />
                <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Therapeutic efficacy tests (clinical and parasitological failure, %)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] print:text-[9px]">
                  <thead>
                    <tr className="bg-gray-50 avoid-break">
                      <th className="text-left py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Medicine</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Year</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Min</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Median</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Max</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Follow-up</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">No.&nbsp;of<br />studies</th>
                      <th className="text-center py-1 px-1 font-medium text-gray-700 text-[10px] print:text-[10px] print:py-0.5 print:px-0.5">Species</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 avoid-break">
                    {data.therapeuticEfficacy.map((efficacy, index) => {
                      if (!efficacy.medicine || efficacy.medicine === '-') {
                        return null;
                      }
                      // Format species text: replace P. falciparum with P.f and P. vivax with P.v (both italicized)
                      const formatSpecies = (text: string) => {
                        return text
                          .replace(/P\.\s*falciparum/gi, 'Pf')
                          .replace(/P\.\s*vivax/gi, 'Pv');
                      };
                      return (
                      <tr key={index} className="avoid-break">
                        <td className="py-1 px-1 text-gray-700 font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.medicine}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5 whitespace-nowrap">{efficacy.year || '-'}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.min !== null ? efficacy.min : '-'}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.median !== null ? efficacy.median : '-'}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.max !== null ? efficacy.max : '-'}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.followUp}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5">{efficacy.numberOfStudies !== null ? efficacy.numberOfStudies : '-'}</td>
                        <td className="py-1 px-1 text-center font-normal text-[10px] print:text-[9px] print:py-0.5 print:px-0.5" dangerouslySetInnerHTML={{ __html: formatSpecies(efficacy.species) }}></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resistance Status */}
            <div className="avoid-break">
              <div className="flex items-center space-x-2 mb-4 print:mb-2">
                <Shield className="h-5 w-5 text-red-500 print:h-4 print:w-4" />
                <h3 className="font-semibold text-gray-900 print:text-xs print:leading-snug">Resistance status by insecticide class (2020-2024) and use of class for malaria vector control (2024)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs print:text-[10px]">
                  <thead>
                    <tr className="bg-gray-50 avoid-break">
                      <th className="text-left py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Insecticide class</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">(%) sites¹</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Vectors²</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700 print:py-1 print:px-1">Used³</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 avoid-break">
                    {data.resistanceStatus
                      .filter(resistance => resistance.insecticideClass && resistance.insecticideClass !== '-' && resistance.insecticideClass.trim() !== '')
                      .map((resistance, index) => (
                        <tr key={index} className="avoid-break">
                          <td className="py-2 px-2 text-gray-700 text-[11px] print:text-[9px] print:py-1 print:px-1">{resistance.insecticideClass}</td>
                          <td className="py-2 px-2 text-center text-[11px] print:text-[9px] print:py-1 print:px-1">{resistance.sites !== null ? resistance.sites : '-'}</td>
                          <td className="py-2 px-2 text-center text-[11px] print:text-[9px] italic print:py-1 print:px-1">{resistance.vectors}</td>
                          <td className="py-2 px-2 text-center text-[11px] print:text-[9px] print:py-1 print:px-1">{resistance.used !== null ? (resistance.used ? 'Yes' : 'No') : '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-600 print:text-[9px] print:mt-2 space-y-1">
                <p><sup>1</sup> Percent of sites for which resistance is confirmed and total number of sites that reported data</p>
                <p><sup>2</sup> Vectors reported to exhibit resistance to insecticide class</p>
                <p><sup>3</sup> Class reported as used for malaria control in 2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Container - Keep charts and footnotes together */}
        <div className="print-charts-footnotes-container">
          {/* Charts Section - Panel D */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 avoid-break print:shadow-none print:border print-panel-d print-charts-section">
          <div className="flex items-center space-x-2 mb-6 print:mb-3">
            <TrendingUp className="h-5 w-5 text-blue-500 print:h-4 print:w-4" />
            <h3 className="font-semibold text-gray-900 print:text-base print:leading-snug keep-with-next">III. Data Visualization</h3>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-2">
            {/* Chart 1 - Estimated and reported cases */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              {/* Interactive chart (screen) */}
                <Chart1
                  chartId="chart1"
                  setChartRef={setChartRef}
                  setContainerRef={setContainerRef}
                  orgUnit={country.id}
                  period={period}
                  showEstimates={data.showEstimates}
                  paramEpiDisplay={data.cases.paramEpiDisplay}
                  showEstForIndigCountry={data.showEstForIndigCountry}
                />
              </div>
            
            {/* Chart 2 - Treatment seeking and reporting completeness */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart2
                chartId="chart2"
                setChartRef={setChartRef}
                orgUnit={country.id}
                period={period}
                chartSource={chart2Source}
              />
            </div>
            
            {/* Chart 3 - Cases tested and treated */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart3
                chartId="chart3"
                setChartRef={setChartRef}
                orgUnit={country.id}
                period={period}
                chartSource={chart3Source}
              />
            </div>
            
            {/* Chart 4 - Test positivity */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart4
                chartId="chart4"
                setChartRef={setChartRef}
                orgUnit={country.id}
                period={period}
                chartSource={chart4Source}
              />
            </div>
            
            {/* Chart 5 - Confirmed malaria cases per 1000 population at risk and ABER */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart5
                chartId="chart5"
                setChartRef={setChartRef}
                orgUnit={country.id}
                countryCode={country.code}
                period={period}
                chartSource={chart5Source}
              />
            </div>
            
            {/* Chart 6 - Cases by classification OR Malaria inpatients and deaths */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart6
                chartId="chart6"
                setChartRef={setChartRef}
                orgUnit={country.id}
                countryCode={country.code}
                period={period}
                chartSource={chart6Source}
              />
            </div>
            
            {/* Chart 7 - Coverage of ITN and IRS */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart7
                chartId="chart7"
                setChartRef={setChartRef}
                orgUnit={country.id}
                countryCode={country.code}
                currentRegion={orgUnitDetails?.parent?.code || ''}
                period={period}
                chartSource={chart7Source}
              />
            </div>
            
            {/* Chart 8 - Sources of financing */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break print:shadow-none print:border" style={{ height: '420px' }}>
              <Chart8
                chartId="chart8"
                setChartRef={setChartRef}
                orgUnit={country.id}
                period={period}
                chartSource={chart8Source}
              />
            </div>
            
            {/* Chart 9 - Government expenditure by intervention (conditional) */}
            {chart9HasData && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 avoid-break keep-with-next print:shadow-none print:border" style={{ height: '420px' }}>
                <Chart9
                  chartId="chart9"
                  setChartRef={setChartRef}
                  setContainerRef={setContainerRef}
                  orgUnit={country.id}
                  period={period}
                  onDataAvailabilityChange={setChart9HasData}
                  chartSource={chart9Source}
                />
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Footnotes Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8 avoid-break keep-with-prev page-break-inside-avoid print:shadow-none print:border print:mt-4 footnotes">
        {/* Add the combined survey source at the top */}

        <p className="text-small font-bold text-gray-900 mb-4 print:text-xs print:mb-2">Footnotes</p>
        <hr className="border-gray-300 mb-4 print:mb-2" />
        <div className="space-y-3 text-xs text-gray-700 print:text-xs print:space-y-2">
          <p className="space-y-3 text-xs text-gray-700 print:text-xs print:space-y-2">Country profiles are generated automatically based on data reported by countries. They are available for all current malaria endemic countries and areas asked to report to the Malaria and Neglected Tropical Diseases Programme annually. Country profiles are based on data validated by the countries as of 15 October 2025.</p>
          {combinedChartSource && (
            <p className="text-xs text-gray-700 print:text-xs">
              Survey sources: {combinedChartSource}
            </p>
        )}
          <p className="space-y-3 text-xs text-gray-700 print:text-xs print:space-y-2">Further information on the methods used to estimate malaria cases and an explanation for the gap between estimated and reported confirmed indigenous cases is provided 
            &nbsp;<span className="text-blue-600 underline hover:text-blue-800 text-xs print:text-xs print:space-y-2">
              <a href="https://cdn.who.int/media/docs/default-source/malaria/mpac-documentation/mpac-april2018-erg-report-malaria-burden-session6.pdf?sfvrsn=44e72782_2" target="blank">mpac-april2018-erg-report-malaria-burden-session6.pdf (who.int)</a></span></p>
          <p className="text-xs font-bold text-gray-900 mb-4 print:text-xs print:mb-2">World Malaria Report {parseInt(period) + 1}</p>
        </div>
      </div>
      </div>
    </div>
  );
}