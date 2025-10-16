import { AnalyticsResponse, CountryProfileData, PopulationData, ParasiteData, CasesData, EstimatesData, PolicyData, TreatmentPolicy } from '../types/dhis2';
import { dhis2Service } from './dhis2Service';

//Policy definitions with year validity
interface PolicyDefinition {
  intervention: string;
  strategy: string;
  policyUID: string;
  yearUID: string;
  validFromYear?: number;  // Policy is valid from this year onwards
  validUntilYear?: number; // Policy is valid until this year
  displayOrder?: number;  // Order in which policy should appear
}

class DataProcessingService {
  private optionSetCache = new Map<string, any>();

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toLocaleString();
  }

  calculatePercentage(part: number, total: number): string {
    if (total === 0) return '0%';
    return ((part / total) * 100).toFixed(1) + '%';
  }

  processPolicyValue(rawValue: string): { displayText: string; implemented: boolean } {
    switch (rawValue) {
      case 'Y':
        return { displayText: 'Yes', implemented: true };
      case 'Y1':
        return { displayText: 'Yes*', implemented: true };
      case 'N':
        return { displayText: 'No', implemented: false };
      default:
        return { displayText: '-', implemented: false };
    }
  }

  async getOptionSetValue(optionSetId: string, code: string): Promise<string> {
    try {
      if (!this.optionSetCache.has(optionSetId)) {
        const optionSet = await dhis2Service.getOptionSet(optionSetId);
        this.optionSetCache.set(optionSetId, optionSet);
      }
      
      const optionSet = this.optionSetCache.get(optionSetId);
      const option = optionSet.options.find((opt: any) => opt.code === code);
      return option ? option.displayName : '-';
    } catch (error) {
      console.error('Failed to get option set value:', error);
      return '-';
    }
  }

  processFormula(formula: string, dataMap: Map<string, number>): string | number {
    // Handle arithmetic operations
    if (formula.includes(' - ')) {
      const [left, right] = formula.split(' - ');
      const leftVal = dataMap.get(left.trim()) || 0;
      const rightVal = dataMap.get(right.trim()) || 0;
      return Math.max(0, leftVal - rightVal);
    }
    
    if (formula.includes(' + ')) {
      const parts = formula.split(' + ');
      return parts.reduce((sum, part) => sum + (dataMap.get(part.trim()) || 0), 0);
    }

    // Handle string concatenation for parasites
    if (formula.includes('P. falciparum') || formula.includes('P. vivax')) {
      const pFalciparum = dataMap.get('tEKjyFJFiw0') || 0;
      const pVivax = dataMap.get('PIUtvDhX4s6') || 0;
      return `<i>P. falciparum</i>: ${pFalciparum}%, <i>P. vivax</i>: ${pVivax}%`;
    }

    // Handle estimates with confidence interval
    if (formula.includes('Estimated cases:')) {
      const estimated = dataMap.get('an08m0ybMb1') || 0;
      const lower = dataMap.get('b6YD3A8Dr2Q') || 0;
      const upper = dataMap.get('KKWevgN9TXF') || 0;
      return `Estimated cases: ${this.formatNumber(estimated)} [${this.formatNumber(lower)}, ${this.formatNumber(upper)}]`;
    }

    // Return raw value or 0
    return dataMap.get(formula);
  }

  async processCountryData(orgUnit: string, period: string): Promise<CountryProfileData> {
    // First, get country code and INDIG_Source to determine display logic
    const countryInfoElements = ['r9twqeAdnRe']; // INDIG_Source
    const indigenousDeathsElements = ['xzCJwslAdtp']; // Indigenous deaths
    
    // Define all data elements needed for the country profile
    const populationElements = ['LQSgzKhQoh8', 'JsmA90dQeAh', 'fh1QtNCJUyq', 'eDlvedXdgwP'];
    const parasiteElements = ['tEKjyFJFiw0', 'PIUtvDhX4s6', 'EZiGVGfTyLe', 'IxSMxz5GT9U', 'e76O7EJtWGk', 'KT39UBQaP1w', 'uu7tSgybizF', 'sQmvMbqADAw'];
    const casesElements = ['yJfOFMOsfoQ', 'TfL9cVeMHyd', 'WuN5NAumc6J', 'Z8mZlV7MnkP', 'Zgw9XVftBa9'];
    const estimatesElements = ['an08m0ybMb1', 'b6YD3A8Dr2Q', 'KKWevgN9TXF', 'teNpUQqjMSQ', 'NTePqFiUuS0', 'uPJpcydAwET'];
    
    // Therapeutic efficacy text elements (Medicine, Follow-up, Species)
    const therapeuticTextElements = ['UIwEygmwj1J', 'IBovXuvqLqM', 'lmkabfeVd1U', 'rRs7tyHlgRc', 'MCb8TWRSlb0', 'LRksI6Vhz98', 'NrMNyIUB7RQ', 'TzuDFOcom3h', 'WdskU0t2N1i', 'kp667EGomur', 'aQdJEFAqmg2', 'ejBlfRCpZAB'];

    // Policy elements (Yes/No and Year adopted)
    const policyYesNoElements = [
      'Vm1oCupLZsS', 'gagBPnUGmaY', // ITN policies
      'JKP3ANVLyjN', 'H9P0BVxKBYM', 'VBkox9y1nbh', 'geSDyXkZNU1', 'YsUd6nF0ueJ',
      'lzOLWfgxqWs', 'UoeX8OFbDqx', 'DyINPGgopL3', 'MrVSpLKqDsp', 'KmPLPFZJpHU',
      'ugIeZT18C10', 'NYYgVn2hLl6', 'E7xOl37PtKW', 'TmkBWN7YSsS', 'anvAOV5ht6p',
      'xlnxh4R7Gwt', 'iTbPoUugAiA', 'MSf8VHWAkLj', 'usY6jfPj7jb', 'tNePhPWXIce',
      'LFuetZdwR81', 'DP8ImP6qAK2', 'uVy7wsFKUKj'
    ];
    
    const policyYearElements = [
      'HzrPyUbuI3d', 'vrqd6AO3eO0',
      'tbntOU0xvJo', 'VDihj2VLq4A', 'htRtowcXu3u', 'n1L03jjC8ej', 'wUHmvm2OjXj',
      'b6gs2kxe1Uw', 'NfLyg6NTGae', 'UKsKOT9K9SQ', 'K822hl8P5cJ', 'SEzJzC07clE',
      'AL004HeA4Tj', 'uVNMyFdMcHT', 'fZnwco6AY75', 'uRsupJISCmR', 'TtbfDs5cXt3',
      'QcqpJldcsHj', 'Bo0riNVa5V7', 'pYzj15BVyl8', 'Q3BxJwzOjn8', 'fqTk6BHqgzk',
      'bsgecIQFQvp', 'BSYYdY5DPw4', 'OJaWx05JgII'
    ];

    const treatmentElements = ['KSqJwXVSfbD', 'cBQKI5gCOwN'];
    
    // Treatment policy elements (medicine and year adopted pairs)
    const treatmentPolicyElements = [
      'KSqJwXVSfbD', 'cBQKI5gCOwN', // First-line treatment of unconfirmed malaria
      'gz7J7ikcJ1e', 'u4VCjjdqrVJ', // First-line treatment of P. falciparum
      'e6JiciQzwuh', 'SQ8KJ8Xy2Pr', // For treatment failure of P. falciparum
      'zW6EYvOjMIo', 'r3yxLB3VYRe', // Treatment of severe malaria
      'lOvt1oXLdBr', 'IA5JzgWAIop', // Treatment of P. vivax
      'aLWOXICfAbR'                  // Dosage of primaquine for radical treatment of P. vivax
    ];

    // Treatment medicine elements (text values)
    const treatmentMedicineElements = [
      'KSqJwXVSfbD', 'gz7J7ikcJ1e', 'e6JiciQzwuh', 
      'zW6EYvOjMIo', 'lOvt1oXLdBr', 'aLWOXICfAbR'
    ];

    // Therapeutic efficacy elements
    const therapeuticEfficacyElements = [
      'UIwEygmwj1J', // Medicine
      'l7q5DJ4yQMP', // Year
      'BlBY4UdnWZM', // Min
      'WMbpMQqde0V', // Median
      'YHpCsWMQ6pE', // Max
      'IBovXuvqLqM', // Follow-up
      'kcRHmPlregB', // No. of studies
      'lmkabfeVd1U', // Species
      // Row 2
      'rRs7tyHlgRc', // Medicine
      'NSNQbWC8PiS', // Year
      'vB7s4Xq6pkx', // Min
      'QA2HfJ5ZOQ0', // Median
      'w8R5rKb5KuT', // Max
      'MCb8TWRSlb0', // Follow-up
      'RpyoOJfvdfW', // No. of studies
      'LRksI6Vhz98', // Species
      // Row 3
      'NrMNyIUB7RQ', // Medicine
      'rrKtSwyOGd9', // Year
      'a6bMWsqDlcR', // Min
      'l87IZFzITds', // Median
      'TvBs5GvflzK', // Max
      'TzuDFOcom3h', // Follow-up
      'k7AvoFS3jii', // No. of studies
      'WdskU0t2N1i', // Species
      // Row 4
      'kp667EGomur', // Medicine
      'C1WcroDjXOI', // Year
      'b9Biv0I4khx', // Min
      'K4IETv0ObQb', // Median
      'bk4xSYYUTwX', // Max
      'aQdJEFAqmg2', // Follow-up
      'Vh3SiBeiLqT', // No. of studies
      'ejBlfRCpZAB'  // Species
    ];

    // Resistance status elements
    const resistanceStatusElements = [
      'JRiVdTENIoc', // Insecticide class
      'e0EfJGiSb79', // Years
      'UKNTRFYcgr6', // (%) sites1
      'YqvLJLueLT1', // Vectors2
      'Ub4bQGesaQa', // Used3
      // Row 2
      'OXa48KUAIpl', // Insecticide class
      'NU9WgELSDVk', // Years
      'FYGTLutUdIA', // (%) sites1
      'jGFk8LVWdyS', // Vectors2
      'MnqhjD2JGWb', // Used3
      // Row 3
      'GI8boxUVl0X', // Insecticide class
      'AVEJomeEnuA', // Years
      'Putx3c0luqG', // (%) sites1
      'hJ3v9S8AK5S', // Vectors2
      'jDFQP0JQamH', // Used3
      // Row 4
      'catAlhTNBdV', // Insecticide class
      'AlLE4Na6ZaK', // Years
      'id9O30pMkaD', // (%) sites1
      'b4mMqIHFcIV', // Vectors2
      'dQ8Zy175oQc'  // Used3
    ];

    // RDT type elements
    const rdtTypeElements = ['YNRlSV0dMPf'];

    // Get country code from orgUnit (we'll need this for array checks)
    let countryCode = '';
    try {
      const orgUnitData = await dhis2Service.getOrganisationUnit(orgUnit);
      countryCode = orgUnitData.code || '';
    } catch (error) {
      console.error('Failed to get country code:', error);
    }

    // Fetch all data

    try {
      // Split requests into smaller chunks to avoid URL length limits
      const [
        countryInfoData,
        populationData,
        parasiteData,
        casesData,
        estimatesData,
        policyYesNoData,
        policyYearData,
        treatmentData,
        therapeuticData,
        resistanceData,
        rdtData
      ] = await Promise.all([
        dhis2Service.getAnalyticsData(countryInfoElements, orgUnit, period),
        dhis2Service.getAnalyticsData(populationElements, orgUnit, period),
        dhis2Service.getAnalyticsData(parasiteElements, orgUnit, period),
        dhis2Service.getAnalyticsData(casesElements, orgUnit, period),
        dhis2Service.getAnalyticsData(estimatesElements, orgUnit, period),
        dhis2Service.getAnalyticsData(policyYesNoElements, orgUnit, period),
        dhis2Service.getAnalyticsData(policyYearElements, orgUnit, period),
        dhis2Service.getAnalyticsData(treatmentPolicyElements, orgUnit, period),
        dhis2Service.getAnalyticsData(therapeuticEfficacyElements, orgUnit, period),
        dhis2Service.getAnalyticsData(resistanceStatusElements, orgUnit, period),
        dhis2Service.getAnalyticsData(rdtTypeElements, orgUnit, period)
      ]);
      
      // Create data map
      const dataMap = new Map<string, number>();
      const textDataMap = new Map<string, string>();
      
      // Process all analytics responses
      const allAnalyticsData = [
        countryInfoData,
        populationData,
        parasiteData,
        casesData,
        estimatesData,
        policyYesNoData,
        policyYearData,
        treatmentData,
        therapeuticData,
        resistanceData,
        rdtData
      ];
      
      allAnalyticsData.forEach(analyticsData => {
        analyticsData.rows.forEach(row => {
          const dataElement = row[0];
          const rawValue = row[3];
          
          // Check if this is a text data element (policies, medicines, anopheles species, etc.)
          const anophelesElements = ['EZiGVGfTyLe', 'IxSMxz5GT9U', 'e76O7EJtWGk', 'KT39UBQaP1w', 'uu7tSgybizF', 'sQmvMbqADAw'];
          const resistanceTextElements = ['JRiVdTENIoc', 'e0EfJGiSb79', 'YqvLJLueLT1', 'Ub4bQGesaQa', 'OXa48KUAIpl', 'NU9WgELSDVk', 'jGFk8LVWdyS', 'MnqhjD2JGWb', 'GI8boxUVl0X', 'AVEJomeEnuA', 'hJ3v9S8AK5S', 'jDFQP0JQamH', 'catAlhTNBdV', 'AlLE4Na6ZaK', 'b4mMqIHFcIV', 'dQ8Zy175oQc'];
          if (policyYesNoElements.includes(dataElement) || treatmentMedicineElements.includes(dataElement) || anophelesElements.includes(dataElement) || resistanceTextElements.includes(dataElement) || dataElement === 'UIwEygmwj1J' || dataElement === 'IBovXuvqLqM' || dataElement === 'lmkabfeVd1U' || dataElement === 'YNRlSV0dMPf' 
              || dataElement ==='rRs7tyHlgRc'
             || dataElement ==='MCb8TWRSlb0'
             || dataElement ==='LRksI6Vhz98'
             
              || dataElement ==='NrMNyIUB7RQ'
              || dataElement ==='TzuDFOcom3h'
              || dataElement ==='WdskU0t2N1i'
              
              || dataElement ==='kp667EGomur'
              || dataElement ==='aQdJEFAqmg2'
              || dataElement ==='ejBlfRCpZAB'
             ) {
            textDataMap.set(dataElement, rawValue);
          } else {
            // Handle as numeric value
            const value = parseFloat(rawValue) || 0;
            dataMap.set(dataElement, value);
          }
        });
      });

      // Determine country flags based on logic
      const indigSource = dataMap.get('r9twqeAdnRe') || 0;
      const indigCountry = indigSource !== 3;
      
      const e2025CountriesArray = ["BLZ","BTN","BWA","CPV","COM","CRI","PRK","DOM","ECU","SWZ","GUF","GTM","HND","IRN","MYS","MEX","NPL","PAN","KOR","STP","SAU","ZAF","SUR","THA","TLS","VUT"];
      const isE2025Country = e2025CountriesArray.includes(countryCode);
      
      const estIndigCountriesArray = ["COM","SWZ","THA"];
      const showEstForIndigCountry = estIndigCountriesArray.includes(countryCode);
      
      const E2025ShowEstimatesArray = ["NPL"];
      const E2025ShowEst = E2025ShowEstimatesArray.includes(countryCode);
      
      const showEstimates = !isE2025Country || E2025ShowEst;

      // Process population data with realistic values
      const totalPop = dataMap.get('eDlvedXdgwP') || 0;
      const atRiskPop = dataMap.get('MS07TINArKL') || 0;
      const highTransmission = dataMap.get('LQSgzKhQoh8') || 0;
      const lowTransmission =  dataMap.get('JsmA90dQeAh') || 0;
      const malariaFree = dataMap.get('fh1QtNCJUyq') || 0;

      const population: PopulationData = {
        highTransmission,
        lowTransmission,
        malariaFree,
        total: totalPop
      };

      // Process parasite data
      const pFalciparum = dataMap.get('tEKjyFJFiw0') || 0;
      const pVivax = dataMap.get('PIUtvDhX4s6') || 0;
      
      // Get anopheles species from data elements
      const anophelesSpecies: string[] = [];
      const anophelesElements = ['EZiGVGfTyLe', 'IxSMxz5GT9U', 'e76O7EJtWGk', 'KT39UBQaP1w', 'uu7tSgybizF', 'sQmvMbqADAw'];
      
      for (const elementId of anophelesElements) {
        const rawValue = textDataMap.get(elementId);
        if (rawValue) {
          try {
            const speciesName = await this.getOptionSetValue('DNrGIbNB3oD', rawValue);
            if (speciesName !== '-') {
              anophelesSpecies.push(speciesName);
            }
          } catch (error) {
            console.error(`Failed to get species name for ${elementId}:`, error);
          }
        }
      }

      const parasites: ParasiteData = {
        pFalciparum,
        pVivax,
        anophelesSpecies
      };

      // Process cases data with realistic values
      const totalCases = dataMap.get('yJfOFMOsfoQ') || 0;
      
      let confirmedHealthFacility = 0;
      let confirmedCommunity = 0;
      let confirmedPrivateSector = 0;
      let indigenousDeaths = 0;
      
      if (indigCountry) {
        // For indigenous countries, get indigenous deaths
        indigenousDeaths = dataMap.get('xzCJwslAdtp') || 0;
      } else {
        // For non-indigenous countries, get the regular case data
        confirmedHealthFacility = dataMap.get('TfL9cVeMHyd') || 0;
        confirmedCommunity = (dataMap.get('WuN5NAumc6J') || 0) + (dataMap.get('Z8mZlV7MnkP') || 0);
        confirmedPrivateSector = dataMap.get('Zgw9XVftBa9') || 0;
      }

      const cases: CasesData = {
        totalCases,
        confirmedHealthFacility,
        confirmedCommunity,
        confirmedPrivateSector,
        indigenousDeaths,
        isIndigCountry: indigCountry
      };

      // Process estimates
      const estimatedCases = dataMap.get('an08m0ybMb1') || 0;
      const casesLowerBound = dataMap.get('b6YD3A8Dr2Q') || 0;
      const casesUpperBound = dataMap.get('KKWevgN9TXF') || 0;
      const estimatedDeaths = dataMap.get('teNpUQqjMSQ') || 0;
      const deathsLowerBound = dataMap.get('NTePqFiUuS0') || 0;
      const deathsUpperBound = dataMap.get('uPJpcydAwET') || 0;

      const estimates: EstimatesData = {
        estimatedCases,
        casesLowerBound,
        casesUpperBound,
        estimatedDeaths,
        deathsLowerBound,
        deathsUpperBound
      };

      // Process policy data with realistic adoption patterns
      // =============================================================================
      // POLICY DEFINITIONS - YEAR-BASED FILTERING
      // =============================================================================
      
      const policyData: PolicyDefinition[] = [
        // 1. Diagnosis Policies - 2024 onwards
        { intervention: 'Diagnosis', strategy: 'Malaria diagnosis with either microscopy or RDTs are free in the public sector', policyUID: 'lLdqBPGWhu1', yearUID: 'NJZIDMAfHWt', displayOrder: 1 },

        // 1. Diagnosis Policies - 2023 and earlier
        { intervention: 'Diagnosis', strategy: 'Malaria diagnosis using RDT is free of charge in the public sector', policyUID: 'YsUd6nF0ueJ', yearUID: 'wUHmvm2OjXj', validUntilYear: 2023, displayOrder: 2 },
        { intervention: 'Diagnosis', strategy: 'Malaria diagnosis using microscopy is free of charge in the public sector', policyUID: 'lzOLWfgxqWs', yearUID: 'b6gs2kxe1Uw', validUntilYear: 2023, displayOrder: 3 },
        { intervention: 'Diagnosis', strategy: 'Malaria diagnosis is free of charge in the private sector', policyUID: 'UoeX8OFbDqx', yearUID: 'NfLyg6NTGae', validUntilYear: 2023, displayOrder: 4 },
        
        // 10. Treatment Policies - All years unless specified
        { intervention: 'Treatment', strategy: 'ACTs for malaria treatment is free in the public sector', policyUID: 'DyINPGgopL3', yearUID: 'UKsKOT9K9SQ', displayOrder: 10 },
        { intervention: 'Treatment', strategy: 'The sale of oral artemisinin- based monotherapy drugs', policyUID: 'MrVSpLKqDsp', yearUID: 'K822hl8P5cJ', displayOrder: 11 },
        { intervention: 'Treatment', strategy: 'Single dose of primaquine is used as gametocidal medicine for P. falciparum', policyUID: 'KmPLPFZJpHU', yearUID: 'SEzJzC07clE', displayOrder: 12 },

        //Treatment Policies - 2023 and earlier
        { intervention: 'Treatment', strategy: 'Primaquine is used for radical treatment of P. vivax', policyUID: 'ugIeZT18C10', yearUID: 'AL004HeA4Tj', validUntilYear: 2023, displayOrder: 12 },
        { intervention: 'Treatment', strategy: 'G6PD test is a requirement before treatment with primaquine', policyUID: 'NYYgVn2hLl6', yearUID: 'uVNMyFdMcHT', validUntilYear: 2023, displayOrder: 13 },
        { intervention: 'Treatment', strategy: 'Directly observed treatment with primaquine is undertaken', policyUID: 'E7xOl37PtKW', yearUID: 'fZnwco6AY75', validUntilYear: 2023, displayOrder: 14 },
        { intervention: 'Treatment', strategy: 'System for monitoring of adverse reaction to antimalarials exists', policyUID: 'TmkBWN7YSsS', yearUID: 'uRsupJISCmR', validUntilYear: 2023, displayOrder: 15 },
      
        // 20. IPT Policies
        { intervention: 'IPT', strategy: 'IPT used to prevent malaria during pregnancy', policyUID: 'geSDyXkZNU1', yearUID: 'n1L03jjC8ej', displayOrder: 20 },
        { intervention: 'IPT', strategy: 'Community based delivery of IPTp (c-IPTp) is used to prevent malaria during pregnancy aligned with WHO recommendation', policyUID: 'Q260gqIU0A1', yearUID: 'E6hsEdJtWim', validFromYear: 2024, displayOrder: 21 },
        { intervention: 'IPT', strategy: 'Seasonal malaria chemoprevention (SMC) is used, aligned with WHO recommendation', policyUID: 'apgTbakUcGw', yearUID: 'kVxe33FsZSS', validFromYear: 2024, displayOrder: 22 },
        { intervention: 'IPT', strategy: 'Perennial Malaria Chemoprevention (PMC) is used, aligned with WHO recommendation', policyUID: 'myQQJ1wGzIs', yearUID: 'NAHlVK5KLSo', validFromYear: 2024, displayOrder: 23 },
        { intervention: 'IPT', strategy: 'Intermittent Preventive Treatment in school-aged children (IPTsc) is used, aligned with WHO recommendation', policyUID: 'rSxvwUOJEQN', yearUID: 'sRQbAHXFZqi', validFromYear: 2024, displayOrder: 24 },
        { intervention: 'IPT', strategy: 'Post-Discharge Malaria Chemoprevention (PDMC) is used, aligned with WHO recommendation', policyUID: 'PG4Gb8CSs9u', yearUID: 'hsGBa8ww12w', validFromYear: 2024, displayOrder: 25 },
        
        // 30. Surveillance Policies
        { intervention: 'Surveillance', strategy: 'Malaria is a notifiable disease', policyUID: 'anvAOV5ht6p', yearUID: 'TtbfDs5cXt3', displayOrder: 30 },
        { intervention: 'Surveillance', strategy: 'Case investigation and classification is undertaken', policyUID: 'LFuetZdwR81', yearUID: 'bsgecIQFQvp', displayOrder: 31 },
        { intervention: 'Surveillance', strategy: 'Foci investigation and classification is undertaken', policyUID: 'DP8ImP6qAK2', yearUID: 'BSYYdY5DPw4', displayOrder: 32 },
        
        // 30. Surveillance Policies - 2023 and earlier
        { intervention: 'Surveillance', strategy: 'ACD for case investigation (reactive)', policyUID: 'xlnxh4R7Gwt', yearUID: 'QcqpJldcsHj', validUntilYear: 2023, displayOrder: 33 },
        { intervention: 'Surveillance', strategy: 'ACD at community level of febrile cases (pro-active)', policyUID: 'iTbPoUugAiA', yearUID: 'Bo0riNVa5V7', validUntilYear: 2023, displayOrder: 34 },
        { intervention: 'Surveillance', strategy: 'Mass screening is undertaken', policyUID: 'MSf8VHWAkLj', yearUID: 'pYzj15BVyl8', validUntilYear: 2024, displayOrder: 35 },
        { intervention: 'Surveillance', strategy: 'Uncomplicated P. falciparum cases routinely admitted', policyUID: 'usY6jfPj7jb', yearUID: 'Q3BxJwzOjn8', validUntilYear: 2023, displayOrder: 36 },
        { intervention: 'Surveillance', strategy: 'Uncomplicated P. vivax cases routinely admitted', policyUID: 'tNePhPWXIce', yearUID: 'fqTk6BHqgzk', validUntilYear: 2023, displayOrder: 37 },
        { intervention: 'Surveillance', strategy: 'Case reporting from private sector is mandatory', policyUID: 'uVy7wsFKUKj', yearUID: 'OJaWx05JgII', validUntilYear: 2023, displayOrder: 38 },

        // 40. ITN Policies - 2024 onwards
        { intervention: 'ITN', strategy: 'ITNs distributed free of charge through through mass campaign to all age groups', policyUID: 'uo1cpPaAkBT', yearUID: 'KgPhKTibt2E', displayOrder: 41 },
        { intervention: 'ITN', strategy: 'ITNs distributed free of charge through routine channels to all age groups', policyUID: 'i1zrvg8Gy6Q', yearUID: 'YD0otwy5ktJ', displayOrder: 42 },
  
        // 40. ITN Policies - 2023 and earlier
        { intervention: 'ITN', strategy: 'ITNs/LLINs distributed free of charge', policyUID: 'Vm1oCupLZsS', yearUID: 'HzrPyUbuI3d', validUntilYear: 2023, displayOrder: 43 },
        { intervention: 'ITN', strategy: 'ITNs/ LLINs distributed through mass campaigns', policyUID: 'gagBPnUGmaY', yearUID: 'vrqd6AO3eO0', validUntilYear: 2023, displayOrder: 44 },
        
        // 50. IRS Policies
        { intervention: 'IRS', strategy: 'IRS is an intervention at the NMP', policyUID: 'JKP3ANVLyjN', yearUID: 'tbntOU0xvJo', displayOrder: 51 },
        { intervention: 'IRS', strategy: 'DDT is used for IRS', policyUID: 'H9P0BVxKBYM', yearUID: 'VDihj2VLq4A', displayOrder: 52 },
        
        // 60. Larval Control Policies
        { intervention: 'Larval source management ', strategy: 'Use of Larval source management', policyUID: 'VBkox9y1nbh', yearUID: 'htRtowcXu3u', displayOrder: 60 }
        
      ];
      
      // Filter policies based on the selected year
      const currentYear = parseInt(period);
      const filteredPolicyData = policyData.filter(policy => {
        // Check validUntilYear (inclusive) - policy is valid until this year (inclusive)
        if (policy.validUntilYear && currentYear > policy.validUntilYear) {
          return false; // Hide policy for this year and later
        }
        
        // Check validFromYear (inclusive) - policy is valid from this year onwards
        if (policy.validFromYear && currentYear < policy.validFromYear) {
          return false; // Hide policy for years before this
        }
        
        return true; // Show policy
      });
      

      // Sort policies by displayOrder (ascending), with undefined orders at the end
      const sortedPolicyData = filteredPolicyData.sort((a, b) => {
        const orderA = a.displayOrder ?? 999999; // Put undefined orders at the end
        const orderB = b.displayOrder ?? 999999;
        return orderA - orderB;
      });
      

      const policies: PolicyData[] = sortedPolicyData.map((item) => {
        const rawPolicyValue = textDataMap.get(item.policyUID) || 'N';
        const yearValue = dataMap.get(item.yearUID) || null;
        
        
        // Process the policy text value
        const policyResult = this.processPolicyValue(rawPolicyValue);
        
        if (item.policyUID === 'kfqivXVpG02' || item.policyUID === 'wgwQAH2zsxI') {
          return {
            intervention: item.intervention,
            strategy: item.strategy,
            policy: policyResult.displayText,
            implemented: policyResult.implemented,
            yearAdopted: yearValue ? Number(yearValue) : null
          };
        }
        
        return {
          intervention: item.intervention,
          strategy: item.strategy,
          policy: policyResult.displayText,
          implemented: policyResult.implemented,
          yearAdopted: yearValue ? Number(yearValue) : null
        };
      });

      // Process treatment policy with actual data elements
      const treatmentCategories = [
        {
          category: 'First-line treatment of unconfirmed malaria',
          medicineUID: 'KSqJwXVSfbD',
          yearUID: 'cBQKI5gCOwN'
        },
        {
          category: 'First-line treatment of P. falciparum',
          medicineUID: 'gz7J7ikcJ1e',
          yearUID: 'u4VCjjdqrVJ'
        },
        {
          category: 'For treatment failure of P. falciparum',
          medicineUID: 'e6JiciQzwuh',
          yearUID: 'SQ8KJ8Xy2Pr'
        },
        {
          category: 'Treatment of severe malaria',
          medicineUID: 'zW6EYvOjMIo',
          yearUID: 'r3yxLB3VYRe'
        },
        {
          category: 'Treatment of P. vivax',
          medicineUID: 'lOvt1oXLdBr',
          yearUID: 'IA5JzgWAIop'
        },
        /*{
          category: 'Dosage of primaquine for radical treatment of P. vivax',
          medicineUID: 'aLWOXICfAbR',
          yearUID: null // No year UID provided
        }*/
      ];

      const treatment: TreatmentPolicy[] = await Promise.all(treatmentCategories.map(async item => {
        // Get medicine name from text data map
        const medicine = textDataMap.get(item.medicineUID) || '-';
        
        // Get year adopted
        const yearAdopted = item.yearUID ? dataMap.get(item.yearUID) || null : null;
        
        return {
          category: item.category,
          medicine,
          yearAdopted: yearAdopted ? Number(yearAdopted) : null
        };
      }));

      // Process therapeutic efficacy data
     
      const therapeuticEfficacy = [
        {
          medicine: textDataMap.get('UIwEygmwj1J') || '-',
          year: dataMap.get('l7q5DJ4yQMP') ? Number(dataMap.get('l7q5DJ4yQMP')) : null,
          min: dataMap.get('BlBY4UdnWZM') >=0 ? Number(dataMap.get('BlBY4UdnWZM')) : null,
          median: dataMap.get('WMbpMQqde0V') >=0 ? Number(dataMap.get('WMbpMQqde0V')) : null,
          max: dataMap.get('YHpCsWMQ6pE') >=0 ? Number(dataMap.get('YHpCsWMQ6pE')) : null,
          followUp: textDataMap.get('IBovXuvqLqM') || '-',
          numberOfStudies: dataMap.get('kcRHmPlregB') || null,
          species: textDataMap.get('lmkabfeVd1U') || '-'
        },
        {
          medicine: textDataMap.get('rRs7tyHlgRc') || '-',
          year: dataMap.get('NSNQbWC8PiS') ? Number(dataMap.get('NSNQbWC8PiS')) : null,
          min: dataMap.get('vB7s4Xq6pkx') >=0 ? Number(dataMap.get('vB7s4Xq6pkx')) : null,
          median: dataMap.get('QA2HfJ5ZOQ0')>=0 ? Number(dataMap.get('QA2HfJ5ZOQ0')) : null,
          max: dataMap.get('w8R5rKb5KuT') >=0 ? Number(dataMap.get('w8R5rKb5KuT')) : null,
          followUp: textDataMap.get('MCb8TWRSlb0') || '-',
          numberOfStudies: dataMap.get('RpyoOJfvdfW') || null,
          species: textDataMap.get('LRksI6Vhz98') || '-'
        },
        {
          medicine: textDataMap.get('NrMNyIUB7RQ') || '-',
          year: dataMap.get('rrKtSwyOGd9') ? Number(dataMap.get('rrKtSwyOGd9')) : null,
          min: dataMap.get('a6bMWsqDlcR') >=0 ? Number(dataMap.get('a6bMWsqDlcR')) : null,
          median: dataMap.get('l87IZFzITds') >=0 ? Number(dataMap.get('l87IZFzITds')) : null,
          max: dataMap.get('TvBs5GvflzK') >=0 ? parseFloat(dataMap.get('TvBs5GvflzK')) : null,
          followUp: textDataMap.get('TzuDFOcom3h') || '-',
          numberOfStudies: dataMap.get('k7AvoFS3jii') || null,
          species: textDataMap.get('WdskU0t2N1i') || '-'
        },
        {
          medicine: textDataMap.get('kp667EGomur') || '-',
          year: dataMap.get('C1WcroDjXOI') ? Number(dataMap.get('C1WcroDjXOI')) : null,
          min: dataMap.get('b9Biv0I4khx') >=0 ? Number(dataMap.get('b9Biv0I4khx')) : null,
          median: dataMap.get('K4IETv0ObQb') >=0 ? Number(dataMap.get('K4IETv0ObQb')) : null,
          max: dataMap.get('bk4xSYYUTwX') >=0 ? parseFloat(dataMap.get('bk4xSYYUTwX')) : null,
          followUp: textDataMap.get('aQdJEFAqmg2') || '-',
          numberOfStudies: dataMap.get('Vh3SiBeiLqT') || null,
          species: textDataMap.get('ejBlfRCpZAB') || '-'
        }
      ];

      // Process resistance status data
      const resistanceStatus = [
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('JRiVdTENIoc') || '') || '-',
          years: textDataMap.get('e0EfJGiSb79') || '-',
          sitesPct: dataMap.get('UKNTRFYcgr6') || null,
          vectors: textDataMap.get('YqvLJLueLT1') || '-',
          used: textDataMap.get('Ub4bQGesaQa') || '-'
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('OXa48KUAIpl') || '') || '-',
          years: textDataMap.get('NU9WgELSDVk') || '-',
          sitesPct: dataMap.get('FYGTLutUdIA') || null,
          vectors: textDataMap.get('jGFk8LVWdyS') || '-',
          used: textDataMap.get('MnqhjD2JGWb') || '-'
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('GI8boxUVl0X') || '') || '-',
          years: textDataMap.get('AVEJomeEnuA') || '-',
          sitesPct: dataMap.get('Putx3c0luqG') || null,
          vectors: textDataMap.get('hJ3v9S8AK5S') || '-',
          used: textDataMap.get('jDFQP0JQamH') || '-'
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('catAlhTNBdV') || '') || '-',
          years: textDataMap.get('AlLE4Na6ZaK') || '-',
          sitesPct: dataMap.get('id9O30pMkaD') || null,
          vectors: textDataMap.get('b4mMqIHFcIV') || '-',
          used: textDataMap.get('dQ8Zy175oQc') || '-'
        }
      ];

      // Process RDT type data
      const rdtType = textDataMap.get('YNRlSV0dMPf') || '-';

      return {
        population,
        parasites,
        cases,
        estimates,
        policies,
        treatment,
        therapeuticEfficacy,
        resistanceStatus,
        rdtType,
        showEstimates,
        countryCode
      };

    } catch (error) {
      console.error('Error processing country data:', error);
      throw error;
    }
  }
}

export const dataProcessingService = new DataProcessingService();