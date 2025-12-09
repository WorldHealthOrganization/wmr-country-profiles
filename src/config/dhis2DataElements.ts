// DHIS2 Data Elements Configuration
// This file contains mappings between logical names and DHIS2 UIDs

interface DataElement {
  uid: string;
  name: string;
  shortName: string;
}

// Data elements mapping
const DHIS2_DATA_ELEMENTS: Record<string, DataElement> = {
  // Reporting and care seeking
  MAL_REPORTING_COMPLETENESS: {
    uid: 'BJXyRAkf2HZ', 
    name: 'Malaria reporting completeness',
    shortName: 'Reporting completeness'
  },
  MAL_CARE_SOUGHT_ANY: {
    uid: 'nvqnQcEbuPA', 
    name: 'Care sought from any provider',
    shortName: 'Care sought (any)'
  },
  MAL_CARE_SOUGHT_PUBLIC_HF: {
    uid: 'o4iFtiN0YZh', 
    name: 'Care sought from public health facility',
    shortName: 'Care sought (public health facility)'
  }
};

// Helper functions
export function getDhis2Uid(code: string): string {
  const element = DHIS2_DATA_ELEMENTS[code];
  if (!element) {
    console.warn(`UID not found for code: ${code}`);
    return ''; // Or throw an error, depending on desired behavior
  }
  return element.uid;
}

export function getDhis2Name(code: string): string {
  const element = DHIS2_DATA_ELEMENTS[code];
  if (!element) {
    console.warn(`Name not found for code: ${code}`);
    return '';
  }
  return element.name;
}

export function getDhis2ChartShortname(code: string): string {
  const element = DHIS2_DATA_ELEMENTS[code];
  if (!element) {
    console.warn(`Short name not found for code: ${code}`);
    return '';
  }
  return element.shortName;
}

// E2025 Countries - Countries that have elimination targets for 2025
export const E2025_COUNTRIES = ["BLZ","BTN","BWA","CPV","COM","CRI","PRK","DOM","ECU","SWZ","GUF","GTM","HND","IRN","MYS","MEX","NPL","PAN","KOR","STP","SAU","ZAF","SUR","THA","TLS","VUT"] as const;

// Helper function to check if a country code is an E2025 country
export function isE2025Country(countryCode: string): boolean {
  return E2025_COUNTRIES.includes(countryCode as any);
}