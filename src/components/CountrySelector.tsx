import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Country } from '../types/dhis2';
import { dhis2Service } from '../services/dhis2Service';
import { useDHIS2 } from '../context/DHIS2Context';

interface CountrySelectorProps {
  selectedCountry: Country | null;
  onCountrySelect: (country: Country) => void;
  selectedYear: string;
  onYearSelect: (year: string) => void;
  onCountriesLoaded?: (countries: Country[]) => void;
}

export function CountrySelector({ selectedCountry, onCountrySelect, selectedYear, onYearSelect, onCountriesLoaded }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isProduction } = useDHIS2();

  // Countries to remove from the dropdown list
  const countriesToRemove = ['BLZ','BTN','CPV','MYT','MYS','SAU','SUR','TLS','TZA'];

  useEffect(() => {
    if (isAuthenticated) {
      loadCountries();
    }
  }, [isAuthenticated]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const countriesData = await dhis2Service.getCountries();
      // Filter out countries with ISO codes in the countriesToRemove array
      const filteredCountries = countriesData.filter(
        country => !countriesToRemove.includes(country.code)
      );
      // Countries are already sorted in the service
      setCountries(filteredCountries);
      // Notify parent component that countries are loaded
      if (onCountriesLoaded) {
        onCountriesLoaded(filteredCountries);
      }
    } catch (error) {
      console.error('Failed to load countries with dataset access:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const years = [
    { value: '2023', display: 'WMR2024 (2023)' },
    { value: '2024', display: 'WMR2025 (2024)' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 country-selector print:hidden avoid-break">
      <div className={`grid gap-6 ${!isProduction ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Year Selector - Only show in development mode */}
        {!isProduction && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Year
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {years.map((year) => (
                <button
                  key={year.value}
                  onClick={() => onYearSelect(year.value)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedYear === year.value
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {year.display}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Country Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Country
          </label>
          
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <span className={selectedCountry ? 'text-gray-900' : 'text-gray-500'}>
                {loading ? 'Loading countries...' : selectedCountry?.shortName || 'Choose a country'}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => {
                        onCountrySelect(country);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{country.shortName}</span>
                        <span className="text-sm text-gray-500">{country.code}</span>
                      </div>
                      {country.displayName !== country.shortName && (
                        <p className="text-sm text-gray-600">{country.displayName}</p>
                      )}
                    </button>
                  ))}
                  
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-500">
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}