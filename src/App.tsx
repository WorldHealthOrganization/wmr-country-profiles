import React, { useState, useEffect } from 'react';
import { DHIS2Provider } from './context/DHIS2Context';
import { Header } from './components/Header';
import { CountrySelector } from './components/CountrySelector';
import { CountryProfile } from './components/CountryProfile';
import { Country } from './types/dhis2';

function AppContent() {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [invalidYearMessage, setInvalidYearMessage] = useState<string>('');

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const period = params.get('period');

    // Check if period is provided and is not '2024'
    if (period && period !== '2024') {
      // Invalid year provided - clear country selection and show message
      setSelectedCountry(null);
      setInvalidYearMessage('The year parameter is not accepted. Only 2024 is supported. Please select a country from the dropdown.');
      // Clear the invalid period from URL
      params.delete('period');
      const newURL = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newURL);
    } else if (period === '2024') {
      setSelectedYear('2024');
      setInvalidYearMessage('');
    } else {
      setInvalidYearMessage('');
    }
  }, []);

  // Clean URL parameters from address bar
  const cleanURL = () => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Validate and auto-select country from URL parameters (for external calls/PDF generation)
  useEffect(() => {
    // Only process URL params once countries are loaded
    if (availableCountries.length === 0 || urlParamsProcessed) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const countryCode = params.get('country');

    // Don't auto-select country if there's an invalid year message
    if (invalidYearMessage) {
      setUrlParamsProcessed(true);
      // Clean URL after processing
      cleanURL();
      return;
    }

    if (countryCode) {
      // Find country in the available (filtered) countries list
      const country = availableCountries.find(c => c.code === countryCode.toUpperCase());
      
      if (country) {
        // Valid country code found, auto-select it
        setSelectedCountry(country);
        const period = params.get('period');
        // Only accept period if it's '2024', ignore all other values
        if (period === '2024') {
          setSelectedYear('2024');
        }
        // Store in SessionStorage for consistency
        sessionStorage.setItem('country', country.code);
        sessionStorage.setItem('period', period || '2024');
      }
      // If country not found, ignore the parameter (user must select manually)
    } else {
      // No URL params, check SessionStorage as fallback
      const storedCountry = sessionStorage.getItem('country');
      const storedPeriod = sessionStorage.getItem('period');
      
      if (storedCountry && storedPeriod) {
        const country = availableCountries.find(c => c.code === storedCountry.toUpperCase());
        if (country) {
          setSelectedCountry(country);
          setSelectedYear(storedPeriod);
        }
      }
    }

    // Clean URL after processing (remove parameters from address bar)
    cleanURL();
    setUrlParamsProcessed(true);
  }, [availableCountries, urlParamsProcessed, invalidYearMessage]);

  // Handle country selection from dropdown (store in SessionStorage, don't update URL)
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setInvalidYearMessage(''); // Clear any error message when user selects
    const currentYear = selectedYear;
    
    // Store in SessionStorage instead of URL
    sessionStorage.setItem('country', country.code);
    sessionStorage.setItem('period', currentYear);
    
    // Ensure URL is clean (no parameters visible)
    cleanURL();
  };

  // Handle year selection from dropdown (store in SessionStorage, don't update URL)
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    
    // Store in SessionStorage if a country is already selected
    if (selectedCountry) {
      sessionStorage.setItem('country', selectedCountry.code);
      sessionStorage.setItem('period', year);
    }
    
    // Ensure URL is clean (no parameters visible)
    cleanURL();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 print:bg-white print:shadow-none print:m-0 print:p-0 print-exact">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-full print:mx-0 print:px-0 print:py-4">
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
          selectedYear={selectedYear}
          onYearSelect={handleYearSelect}
          onCountriesLoaded={setAvailableCountries}
        />
        
        {selectedCountry && (
          <CountryProfile 
            country={selectedCountry} 
            period={selectedYear}
          />
        )}
        
        {!selectedCountry && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              {invalidYearMessage && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{invalidYearMessage}</p>
                </div>
              )}
              <div className="bg-blue-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">

<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 486.4 486.4" style={{ enableBackground: 'new 0 0 486.4 486.4' }} xmlSpace="preserve">
<g>
	<g>
		<polygon style={{ fill: '#D7E1F2' }} points="305.487,44.938 305.487,83.25 180.913,83.25 180.913,44.938 81.813,44.938 81.813,476.9 
			404.587,476.9 404.587,44.938 		"/>
		<rect x="180.913" y="9.5" style={{ fill: '#D71920' }} width="124.574" height="73.75"/>
	</g>
	<path d="M404.587,35.439h-89.6V9.5c0-5.246-4.254-9.5-9.5-9.5H180.913c-5.246,0-9.5,4.254-9.5,9.5v25.939h-89.6
		c-5.246,0-9.5,4.254-9.5,9.5V476.9c0,5.246,4.254,9.5,9.5,9.5h322.774c5.246,0,9.5-4.254,9.5-9.5V44.939
		C414.087,39.692,409.833,35.439,404.587,35.439z M295.987,73.749H190.413V19h105.574V73.749z M395.087,467.4H91.313V54.439h80.1
		V83.25c0,5.246,4.254,9.5,9.5,9.5h124.574c5.246,0,9.5-4.254,9.5-9.5V54.439h80.1V467.4z"/>
	<path d="M278.159,141.596H131.618c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h146.541c5.246,0,9.5,4.254,9.5,9.5
		S283.405,141.596,278.159,141.596z"/>
	<path d="M357.656,190.443H131.618c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h226.038c5.246,0,9.5,4.254,9.5,9.5
		S362.902,190.443,357.656,190.443z"/>
	<path d="M357.656,239.291H131.618c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h226.038c5.246,0,9.5,4.254,9.5,9.5
		S362.902,239.291,357.656,239.291z"/>
	<path d="M357.656,285.264H131.618c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h226.038c5.246,0,9.5,4.254,9.5,9.5
		S362.902,285.264,357.656,285.264z"/>
	<path d="M357.656,141.596h-31.607c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h31.607c5.246,0,9.5,4.254,9.5,9.5
		S362.902,141.596,357.656,141.596z"/>
	<path style={{ fill: '#D7E1F2' }} d="M334.972,339.48c-9.281-9.186-22.102-14.868-36.265-14.868c-13.363,0-25.53,5.063-34.657,13.351
		l36.227,35.858L334.972,339.48z"/>
	<g>
		<path style={{ fill: '#D71920' }} d="M215.904,337.963c-10.219,9.279-16.629,22.603-16.629,37.412c0,14.018,5.74,26.708,15.021,35.895
			l37.835-37.449L215.904,337.963z"/>
		<path d="M214.296,420.769c-2.416,0-4.832-0.916-6.683-2.748c-11.503-11.386-17.838-26.531-17.838-42.647
			c0-16.852,7.196-33.051,19.742-44.444c3.738-3.396,9.481-3.271,13.069,0.281l36.227,35.857c1.803,1.784,2.818,4.216,2.818,6.752
			s-1.014,4.967-2.817,6.752l-37.835,37.449C219.128,419.854,216.712,420.769,214.296,420.769z M216.322,351.743
			c-4.861,6.879-7.546,15.137-7.546,23.631c0,7.818,2.188,15.306,6.277,21.779l23.575-23.333L216.322,351.743z"/>
	</g>
	<path style={{ fill: '#3B4D81' }} d="M262.443,411.269c9.281,9.186,22.102,14.868,36.265,14.868c28.325,0,51.286-22.727,51.286-50.763
		c0-14.018-5.74-26.708-15.021-35.895L262.443,411.269z"/>
	<path d="M341.656,332.73L341.656,332.73l-0.001-0.001v-0.001l-0.001-0.001c-11.477-11.36-26.728-17.616-42.946-17.616
		c-15.234,0-29.811,5.618-41.044,15.819c-1.931,1.753-3.055,4.222-3.112,6.829c-0.056,2.607,0.962,5.122,2.816,6.956l29.405,29.105
		l-31.013,30.697c-1.803,1.784-2.817,4.216-2.817,6.752s1.014,4.967,2.817,6.752c11.477,11.36,26.73,17.616,42.949,17.616
		c33.517,0,60.786-27.034,60.786-60.263C359.493,359.259,353.158,344.115,341.656,332.73z M278.731,339.128
		c6.077-3.272,12.922-5.016,19.976-5.016c7.885,0,15.437,2.142,21.973,6.147l-20.403,20.195L278.731,339.128z M298.707,416.637
		c-7.887,0-15.438-2.142-21.973-6.147l37.611-37.228l19.87-19.667c4.09,6.474,6.278,13.961,6.278,21.779
		C340.493,398.127,321.748,416.637,298.707,416.637z"/>
	<path d="M247.95,53.2h-32.3c-5.246,0-9.5-4.254-9.5-9.5s4.254-9.5,9.5-9.5h32.3c5.246,0,9.5,4.254,9.5,9.5
		S253.196,53.2,247.95,53.2z"/>
</g>
</svg>
                
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to <br/>
                World Malaria Report<br/>Country Profile
              </h3>
              <p className="text-gray-600 mb-6">
                Select a country from the dropdown above to view the malaria epidemiological profile, intervention policies, and treatment guidelines.
              </p>
              
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <DHIS2Provider>
      <AppContent />
    </DHIS2Provider>
  );
}

export default App;