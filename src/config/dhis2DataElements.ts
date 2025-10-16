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
    uid: 'Uvn6LCg7dVU', 
    name: 'Care sought from any provider',
    shortName: 'Care sought (any)'
  },
  MAL_CARE_SOUGHT_PUBLIC_HF: {
    uid: 'o4iFtiN0YZh', 
    name: 'Care sought from public health facility',
    shortName: 'Care sought (public HF)'
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