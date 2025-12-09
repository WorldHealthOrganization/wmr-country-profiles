import { AnalyticsResponse, CountryProfileData, PopulationData, ParasiteData, CasesData, EstimatesData, PolicyData, TreatmentPolicy } from '../types/dhis2';
import { dhis2Service } from './dhis2Service';
import { isE2025Country } from '../config/dhis2DataElements';

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
        return { displayText: 'Yes*', implemented: true };
      case 'Y1':
        return { displayText: 'Yes', implemented: true };
      case 'N':
        return { displayText: 'No', implemented: false };
      default:
        return { displayText: '-', implemented: false };
    }
  }

  convertToBoolean(value: string | number | null | undefined): boolean | null {
    if (value === null || value === undefined) return null;
    
    // Handle numeric values (1 = Yes, 0 = No)
    if (typeof value === 'number') {
      return value === 1;
    }
    
    // Handle string values
    const upperValue = String(value).toUpperCase().trim();
    if (upperValue === 'Y' || upperValue === 'YES' || upperValue === 'TRUE' || upperValue === '1') {
      return true;
    }
    if (upperValue === 'N' || upperValue === 'NO' || upperValue === 'FALSE' || upperValue === '0') {
      return false;
    }
    return null;
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
    return dataMap.get(formula) || 0;
  }

  async processCountryData(orgUnit: string, period: string): Promise<CountryProfileData> {
    // First, get country code, INDIG_Source (for charts), and PARAM_EPI_DISPLAY (for profile display)
    const countryInfoElements = ['r9twqeAdnRe', 'Uk5ZiClT56N']; // INDIG_Source, PARAM_EPI_DISPLAY
    
    // Define all data elements needed for the country profile
    const populationElements = ['LQSgzKhQoh8', 'JsmA90dQeAh', 'fh1QtNCJUyq', 'eDlvedXdgwP'];
    const parasiteElements = ['tEKjyFJFiw0', 'PIUtvDhX4s6', 'EZiGVGfTyLe', 'IxSMxz5GT9U', 'e76O7EJtWGk', 'KT39UBQaP1w', 'uu7tSgybizF', 'sQmvMbqADAw'];
    // Cases elements: includes all needed for different EPI_DISPLAY values
    const casesElements = ['yJfOFMOsfoQ', 'TfL9cVeMHyd', 'gyAhkgE9tlU', 'WuN5NAumc6J', 'Z8mZlV7MnkP', 'Zgw9XVftBa9', 'Ykqy9bxrjEW', 'gbrU43t4EVZ', 'LpmvOoiEVf0'];
    const estimatesElements = ['an08m0ybMb1', 'b6YD3A8Dr2Q', 'KKWevgN9TXF', 'teNpUQqjMSQ', 'NTePqFiUuS0', 'uPJpcydAwET'];
    
    // Therapeutic efficacy text elements (Medicine, Follow-up, Species)
    const therapeuticTextElements = ['UIwEygmwj1J', 'IBovXuvqLqM', 'lmkabfeVd1U', 'rRs7tyHlgRc', 'MCb8TWRSlb0', 'LRksI6Vhz98', 'NrMNyIUB7RQ', 'TzuDFOcom3h', 'WdskU0t2N1i', 'kp667EGomur', 'aQdJEFAqmg2', 'ejBlfRCpZAB'];

    // Policy elements (Yes/No and Year adopted), from top to bottom (column D)
    const policyYesNoElements = [
      'Vm1oCupLZsS', 'gagBPnUGmaY', // ITN policies
      'JKP3ANVLyjN', 'H9P0BVxKBYM', 'VBkox9y1nbh', 'geSDyXkZNU1', 'Q260gqIU0A1',
      'apgTbakUcGw', 'myQQJ1wGzIs', 'rSxvwUOJEQN', 'lLdqBPGWhu1', 'DyINPGgopL3',
      'MrVSpLKqDsp', 'anvAOV5ht6p', 'LFuetZdwR81', 'DP8ImP6qAK2', 'uVy7wsFKUKj',
      'AXnVeNe9yF9','gzyORQNEpkZ','KmPLPFZJpHU','XHwHMqT5nmK'
    ];
    //from top to bottom (column D)
    const policyYearElements = [
      'HzrPyUbuI3d', 'vrqd6AO3eO0',
      'tbntOU0xvJo', 'VDihj2VLq4A', 'htRtowcXu3u', 'n1L03jjC8ej', 'E6hsEdJtWim', 
      'kVxe33FsZSS', 'NAHlVK5KLSo', 'sRQbAHXFZqi', 'NJZIDMAfHWt', 'UKsKOT9K9SQ', 
      'K822hl8P5cJ', 'TtbfDs5cXt3', 'bsgecIQFQvp', 'BSYYdY5DPw4', 'OJaWx05JgII',
      'sWXSI2KOQiQ','HhSG5KOszRE','SEzJzC07clE','vHp4LHvdhGt'
    ];
    
    // Treatment policy elements (medicine and year adopted pairs)
    const treatmentPolicyElements = [
      'KSqJwXVSfbD', 'cBQKI5gCOwN', // First-line treatment of unconfirmed malaria
      'gz7J7ikcJ1e', 'u4VCjjdqrVJ', // First-line treatment of P. falciparum
      'e6JiciQzwuh', 'SQ8KJ8Xy2Pr', // For treatment failure of P. falciparum
      'zW6EYvOjMIo', 'r3yxLB3VYRe', // Treatment of severe malaria
      'lOvt1oXLdBr', 'IA5JzgWAIop' // Treatment of P. vivax
      //'aLWOXICfAbR'                  // Dosage of primaquine for radical treatment of P. vivax
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
      'MnqhjD2JGWb', // Years
      'FYGTLutUdIA', // (%) sites1
      'jGFk8LVWdyS', // Vectors2
      'NU9WgELSDVk', // Used3
      // Row 3
      'GI8boxUVl0X', // Insecticide class
      'jDFQP0JQamH', // Years
      'Putx3c0luqG', // (%) sites1
      'hJ3v9S8AK5S', // Vectors2
      'AVEJomeEnuA', // Used3
      // Row 4
      'catAlhTNBdV', // Insecticide class
      'dQ8Zy175oQc', // Years
      'id9O30pMkaD', // (%) sites1
      'b4mMqIHFcIV', // Vectors2
      'AlLE4Na6ZaK'  // Used3
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
          
          // Log raw analytics data for therapeutic efficacy year UIDs
          const yearUIDs = ['l7q5DJ4yQMP', 'NSNQbWC8PiS', 'rrKtSwyOGd9', 'C1WcroDjXOI'];
          if (yearUIDs.includes(dataElement)) {
            console.log(`🔬 Raw Analytics - Year UID ${dataElement}:`, {
              rawValue: rawValue,
              rawValueType: typeof rawValue,
              isNaN: isNaN(Number(rawValue)),
              parsedAsNumber: parseFloat(rawValue)
            });
          }
          
          // Check if this is a text data element (policies, medicines, anopheles species, etc.)
          // Note: Sites elements (UKNTRFYcgr6, FYGTLutUdIA, Putx3c0luqG, id9O30pMkaD) are text and should be in this list
          // Note: Used elements (Ub4bQGesaQa, NU9WgELSDVk, AVEJomeEnuA, AlLE4Na6ZaK) are numeric (1/0) and should NOT be in this list
          const anophelesElements = ['EZiGVGfTyLe', 'IxSMxz5GT9U', 'e76O7EJtWGk', 'KT39UBQaP1w', 'uu7tSgybizF', 'sQmvMbqADAw'];
          const resistanceTextElements = ['JRiVdTENIoc', 'e0EfJGiSb79', 'YqvLJLueLT1', 'OXa48KUAIpl', 'jGFk8LVWdyS', 'MnqhjD2JGWb', 'GI8boxUVl0X', 'hJ3v9S8AK5S', 'jDFQP0JQamH', 'catAlhTNBdV', 'b4mMqIHFcIV', 'dQ8Zy175oQc'];
          // Sites elements - treat as text to preserve text values
          const sitesElements = ['UKNTRFYcgr6', 'FYGTLutUdIA', 'Putx3c0luqG', 'id9O30pMkaD'];
          // Therapeutic efficacy year UIDs - treat as text to preserve year ranges like "2016-2020"
          const therapeuticYearUIDs = ['l7q5DJ4yQMP', 'NSNQbWC8PiS', 'rrKtSwyOGd9', 'C1WcroDjXOI'];
          
          if (policyYesNoElements.includes(dataElement) || treatmentMedicineElements.includes(dataElement) || anophelesElements.includes(dataElement) || resistanceTextElements.includes(dataElement) || sitesElements.includes(dataElement) || therapeuticYearUIDs.includes(dataElement) || dataElement === 'UIwEygmwj1J' || dataElement === 'IBovXuvqLqM' || dataElement === 'lmkabfeVd1U' || dataElement === 'YNRlSV0dMPf' || dataElement === 'LpmvOoiEVf0' 
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
      const indigSource = dataMap.get('r9twqeAdnRe') || 0; // Keep for charts
      const param_EPI_DISPLAY = dataMap.get('Uk5ZiClT56N') || 0; // For profile display logic
      
      const isE2025 = isE2025Country(countryCode);
      
      const estIndigCountriesArray = ["COM","SWZ","THA"];
      const showEstForIndigCountry = estIndigCountriesArray.includes(countryCode);
      
      const E2025ShowEstimatesArray = ["NPL"];
      const E2025ShowEst = E2025ShowEstimatesArray.includes(countryCode);
      
      const showEstimates = !isE2025 || E2025ShowEst;

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

      // Process cases data - fetch all needed values
      const totalCases = dataMap.get('yJfOFMOsfoQ') || 0;
      const totalConfirmedCases = dataMap.get('TfL9cVeMHyd') || 0;
      const reportedIndigenousConfirmedCases = dataMap.get('gyAhkgE9tlU') || 0;
      const confirmedHealthFacility = dataMap.get('WuN5NAumc6J') || 0;
      const confirmedCommunity = dataMap.get('Z8mZlV7MnkP') || 0;
      const confirmedPrivateSector = dataMap.get('Zgw9XVftBa9') || 0;
      const reportedDeaths = dataMap.get('Ykqy9bxrjEW') || 0;
      const indigenousDeaths = dataMap.get('gbrU43t4EVZ') || 0;
      
      // Get footnote text
      const footnoteText = textDataMap.get('LpmvOoiEVf0') || null;

      const cases: CasesData = {
        totalCases,
        totalConfirmedCases,
        reportedIndigenousConfirmedCases,
        confirmedHealthFacility,
        confirmedCommunity,
        confirmedPrivateSector,
        reportedDeaths,
        indigenousDeaths,
        paramEpiDisplay: param_EPI_DISPLAY,
        footnoteText,
        indigSource: indigSource // Keep for charts
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
    
        //Treatment Policies - 2023 and earlier
        { intervention: 'Treatment', strategy: 'Primaquine is used for radical treatment of P. vivax', policyUID: 'ugIeZT18C10', yearUID: 'AL004HeA4Tj', validUntilYear: 2023, displayOrder: 12 },
        { intervention: 'Treatment', strategy: 'G6PD test is a requirement before treatment with primaquine', policyUID: 'NYYgVn2hLl6', yearUID: 'uVNMyFdMcHT', validUntilYear: 2023, displayOrder: 13 },
        { intervention: 'Treatment', strategy: 'Directly observed treatment with primaquine is undertaken', policyUID: 'E7xOl37PtKW', yearUID: 'fZnwco6AY75', validUntilYear: 2023, displayOrder: 14 },
        { intervention: 'Treatment', strategy: 'System for monitoring of adverse reaction to antimalarials exists', policyUID: 'TmkBWN7YSsS', yearUID: 'uRsupJISCmR', validUntilYear: 2023, displayOrder: 15 },
    
        { intervention: 'Treatment', strategy: 'ACT is delivered at community', policyUID: 'AXnVeNe9yF9', yearUID: 'sWXSI2KOQiQ', displayOrder: 11 },
        { intervention: 'Treatment', strategy: 'Pre-referral Rx with rectal artesunate suppositories at community level', policyUID: 'gzyORQNEpkZ', yearUID: 'HhSG5KOszRE', displayOrder: 16 },
        { intervention: 'Treatment', strategy: 'Single dose of primaquine is used as gametocidal medicine for P. falciparum', policyUID: 'KmPLPFZJpHU', yearUID: 'SEzJzC07clE', displayOrder: 17 },
        { intervention: 'Treatment', strategy: 'The sale of oral artemisinin- based monotherapy drugs', policyUID: 'MrVSpLKqDsp', yearUID: 'K822hl8P5cJ', displayOrder: 18 },
        
        // 20. IPT Policies
        { intervention: 'IPT', strategy: 'IPT used to prevent malaria during pregnancy', policyUID: 'geSDyXkZNU1', yearUID: 'n1L03jjC8ej', displayOrder: 20 },
        { intervention: 'IPT', strategy: 'Community based delivery of IPTp (c-IPTp) is used to prevent malaria during pregnancy aligned with WHO recommendation', policyUID: 'Q260gqIU0A1', yearUID: 'E6hsEdJtWim', validFromYear: 2024, displayOrder: 21 },
        { intervention: 'IPT', strategy: 'Seasonal malaria chemoprevention (SMC) is used, aligned with WHO recommendation', policyUID: 'apgTbakUcGw', yearUID: 'kVxe33FsZSS', validFromYear: 2024, displayOrder: 22 },
        { intervention: 'IPT', strategy: 'Perennial Malaria Chemoprevention (PMC) is used, aligned with WHO recommendation', policyUID: 'myQQJ1wGzIs', yearUID: 'NAHlVK5KLSo', validFromYear: 2024, displayOrder: 23 },
        { intervention: 'IPT', strategy: 'Intermittent Preventive Treatment in school-aged children (IPTsc) is used, aligned with WHO recommendation', policyUID: 'rSxvwUOJEQN', yearUID: 'sRQbAHXFZqi', validFromYear: 2024, displayOrder: 24 },
        //{ intervention: 'IPT', strategy: 'Post-Discharge Malaria Chemoprevention (PDMC) is used, aligned with WHO recommendation', policyUID: 'PG4Gb8CSs9u', yearUID: 'hsGBa8ww12w', validFromYear: 2024, displayOrder: 25 },
        
        // 30. Surveillance Policies
        { intervention: 'Surveillance', strategy: 'Malaria is a notifiable disease', policyUID: 'anvAOV5ht6p', yearUID: 'TtbfDs5cXt3', displayOrder: 30 },
        { intervention: 'Surveillance', strategy: 'Case investigation and classification is undertaken', policyUID: 'LFuetZdwR81', yearUID: 'bsgecIQFQvp', displayOrder: 31 },
        { intervention: 'Surveillance', strategy: 'Foci investigation and classification is undertaken', policyUID: 'DP8ImP6qAK2', yearUID: 'BSYYdY5DPw4', displayOrder: 32 },
        
        // 30. Surveillance Policies - 2023 and earlier
        { intervention: 'Surveillance', strategy: 'ACD for case investigation (reactive)', policyUID: 'xlnxh4R7Gwt', yearUID: 'QcqpJldcsHj', validUntilYear: 2023, displayOrder: 33 },
        { intervention: 'Surveillance', strategy: 'ACD at community level of febrile cases (pro-active)', policyUID: 'iTbPoUugAiA', yearUID: 'Bo0riNVa5V7', validUntilYear: 2023, displayOrder: 34 },
        { intervention: 'Surveillance', strategy: 'Mass screening is undertaken', policyUID: 'MSf8VHWAkLj', yearUID: 'pYzj15BVyl8', validUntilYear: 2023, displayOrder: 35 },
        { intervention: 'Surveillance', strategy: 'Uncomplicated P. falciparum cases routinely admitted', policyUID: 'usY6jfPj7jb', yearUID: 'Q3BxJwzOjn8', validUntilYear: 2023, displayOrder: 36 },
        { intervention: 'Surveillance', strategy: 'Uncomplicated P. vivax cases routinely admitted', policyUID: 'tNePhPWXIce', yearUID: 'fqTk6BHqgzk', validUntilYear: 2023, displayOrder: 37 },
        { intervention: 'Surveillance', strategy: 'Case reporting from private sector is mandatory', policyUID: 'uVy7wsFKUKj', yearUID: 'OJaWx05JgII', displayOrder: 38 },

        // 40. ITN Policies - 2024 onwards
        { intervention: 'ITN', strategy: 'ITNs distributed free of charge through through mass campaign to all age groups', policyUID: 'gagBPnUGmaY', yearUID: 'vrqd6AO3eO0', displayOrder: 41 },
        { intervention: 'ITN', strategy: 'ITNs distributed free of charge through routine channels to all age groups', policyUID: 'Vm1oCupLZsS', yearUID: 'HzrPyUbuI3d', displayOrder: 42 },
        { intervention: 'ITN', strategy: 'ITNs durability is monitored', policyUID: 'XHwHMqT5nmK', yearUID: 'vHp4LHvdhGt', displayOrder: 43 },
    
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
        
        // Special handling for 'The sale of oral artemisinin- based monotherapy drugs'
        // This field can contain text values instead of Y/N/Y1
        if (item.policyUID === 'MrVSpLKqDsp') {
          const normalizedValue = rawPolicyValue?.trim();
          if (normalizedValue === 'has never been allowed' || normalizedValue === 'is banned') {
            return {
              intervention: item.intervention,
              strategy: item.strategy,
              policy: normalizedValue,
              implemented: true, // Green badge for these text values
              yearAdopted: yearValue ? Number(yearValue) : null
            };
          } else {
            // For any other value, show it but mark as not implemented (red badge)
            return {
              intervention: item.intervention,
              strategy: item.strategy,
              policy: rawPolicyValue || '-',
              implemented: false,
              yearAdopted: yearValue ? Number(yearValue) : null
            };
          }
        }
        
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
     
      // Log raw year data for therapeutic efficacy
      const yearUIDs = ['l7q5DJ4yQMP', 'NSNQbWC8PiS', 'rrKtSwyOGd9', 'C1WcroDjXOI'];
      console.log('🔬 Therapeutic Efficacy - Raw Year Data:');
      yearUIDs.forEach((uid, index) => {
        const dataMapValue = dataMap.get(uid);
        const textDataMapValue = textDataMap.get(uid);
        console.log(`Row ${index + 1} - UID ${uid}:`, {
          inDataMap: dataMapValue !== undefined,
          dataMapValue: dataMapValue,
          dataMapType: typeof dataMapValue,
          inTextDataMap: textDataMapValue !== undefined,
          textDataMapValue: textDataMapValue,
          textDataMapType: typeof textDataMapValue
        });
      });
      
      const therapeuticEfficacy = [
        {
          medicine: textDataMap.get('UIwEygmwj1J') || '-',
          year: textDataMap.get('l7q5DJ4yQMP') || null,
          min: (dataMap.get('BlBY4UdnWZM') ?? 0) >= 0 ? Number(dataMap.get('BlBY4UdnWZM') ?? 0) : null,
          median: (dataMap.get('WMbpMQqde0V') ?? 0) >= 0 ? Number(dataMap.get('WMbpMQqde0V') ?? 0) : null,
          max: (dataMap.get('YHpCsWMQ6pE') ?? 0) >= 0 ? Number(dataMap.get('YHpCsWMQ6pE') ?? 0) : null,
          followUp: textDataMap.get('IBovXuvqLqM') || '-',
          numberOfStudies: dataMap.get('kcRHmPlregB') || null,
          species: textDataMap.get('lmkabfeVd1U') || '-'
        },
        {
          medicine: textDataMap.get('rRs7tyHlgRc') || '-',
          year: textDataMap.get('NSNQbWC8PiS') || null,
          min: (dataMap.get('vB7s4Xq6pkx') ?? 0) >= 0 ? Number(dataMap.get('vB7s4Xq6pkx') ?? 0) : null,
          median: (dataMap.get('QA2HfJ5ZOQ0') ?? 0) >= 0 ? Number(dataMap.get('QA2HfJ5ZOQ0') ?? 0) : null,
          max: (dataMap.get('w8R5rKb5KuT') ?? 0) >= 0 ? Number(dataMap.get('w8R5rKb5KuT') ?? 0) : null,
          followUp: textDataMap.get('MCb8TWRSlb0') || '-',
          numberOfStudies: dataMap.get('RpyoOJfvdfW') || null,
          species: textDataMap.get('LRksI6Vhz98') || '-'
        },
        {
          medicine: textDataMap.get('NrMNyIUB7RQ') || '-',
          year: textDataMap.get('rrKtSwyOGd9') || null,
          min: (dataMap.get('a6bMWsqDlcR') ?? 0) >= 0 ? Number(dataMap.get('a6bMWsqDlcR') ?? 0) : null,
          median: (dataMap.get('l87IZFzITds') ?? 0) >= 0 ? Number(dataMap.get('l87IZFzITds') ?? 0) : null,
          max: (dataMap.get('TvBs5GvflzK') ?? 0) >= 0 ? Number(dataMap.get('TvBs5GvflzK') ?? 0) : null,
          followUp: textDataMap.get('TzuDFOcom3h') || '-',
          numberOfStudies: dataMap.get('k7AvoFS3jii') || null,
          species: textDataMap.get('WdskU0t2N1i') || '-'
        },
        {
          medicine: textDataMap.get('kp667EGomur') || '-',
          year: textDataMap.get('C1WcroDjXOI') || null,
          min: (dataMap.get('b9Biv0I4khx') ?? 0) >= 0 ? Number(dataMap.get('b9Biv0I4khx') ?? 0) : null,
          median: (dataMap.get('K4IETv0ObQb') ?? 0) >= 0 ? Number(dataMap.get('K4IETv0ObQb') ?? 0) : null,
          max: (dataMap.get('bk4xSYYUTwX') ?? 0) >= 0 ? Number(dataMap.get('bk4xSYYUTwX') ?? 0) : null,
          followUp: textDataMap.get('aQdJEFAqmg2') || '-',
          numberOfStudies: dataMap.get('Vh3SiBeiLqT') || null,
          species: textDataMap.get('ejBlfRCpZAB') || '-'
        }
      ];
      
      // Log processed year values
      console.log('🔬 Therapeutic Efficacy - Processed Year Values:');
      therapeuticEfficacy.forEach((eff, index) => {
        console.log(`Row ${index + 1}:`, { medicine: eff.medicine, year: eff.year, yearType: typeof eff.year });
      });

      // Process resistance status data
      const resistanceStatus = [
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('JRiVdTENIoc') || '') || '-',
          years: textDataMap.get('e0EfJGiSb79') || '-',
          sites: textDataMap.get('UKNTRFYcgr6') || null,
          vectors: textDataMap.get('YqvLJLueLT1') || '-',
          used: this.convertToBoolean(dataMap.get('Ub4bQGesaQa'))
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('OXa48KUAIpl') || '') || '-',
          years: textDataMap.get('MnqhjD2JGWb') || '-',
          sites: textDataMap.get('FYGTLutUdIA') || null,
          vectors: textDataMap.get('jGFk8LVWdyS') || '-',
          used: this.convertToBoolean(dataMap.get('NU9WgELSDVk'))
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('GI8boxUVl0X') || '') || '-',
          years: textDataMap.get('jDFQP0JQamH') || '-',
          sites: textDataMap.get('Putx3c0luqG') || null,
          vectors: textDataMap.get('hJ3v9S8AK5S') || '-',
          used: this.convertToBoolean(dataMap.get('AVEJomeEnuA'))
        },
        {
          insecticideClass: await this.getOptionSetValue('eHrT4UiAgh8', textDataMap.get('catAlhTNBdV') || '') || '-',
          years: textDataMap.get('dQ8Zy175oQc') || '-',
          sites: textDataMap.get('id9O30pMkaD') || null,
          vectors: textDataMap.get('b4mMqIHFcIV') || '-',
          used: this.convertToBoolean(dataMap.get('AlLE4Na6ZaK'))
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