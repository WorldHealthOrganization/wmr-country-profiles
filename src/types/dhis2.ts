export interface DHIS2Config {
  baseUrl: string;
  username?: string;
  password?: string;
  token?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: DHIS2User | null;
}

export interface DHIS2User {
  id: string;
  displayName: string;
  username: string;
}

export interface Country {
  id: string;
  displayName: string;
  shortName: string;
  code: string;
}

export interface DataValue {
  dataElement: string;
  period: string;
  orgUnit: string;
  value: string;
}

export interface AnalyticsResponse {
  headers: Array<{ name: string; column: string; valueType: string }>;
  rows: string[][];
}

export interface OptionSetValue {
  code: string;
  displayName: string;
}

export interface OptionSet {
  id: string;
  options: OptionSetValue[];
}

export interface OrganisationUnitDetails {
  code: string;
  parent?: {
    id: string;
    code: string;
    displayName: string;
  };
}

export interface PopulationData {
  highTransmission: number;
  lowTransmission: number;
  malariaFree: number;
  total: number;
}

export interface ParasiteData {
  pFalciparum: number;
  pVivax: number;
  anophelesSpecies: string[];
}

export interface CasesData {
  totalCases: number;
  totalConfirmedCases: number;
  reportedIndigenousConfirmedCases: number;
  confirmedHealthFacility: number;
  confirmedCommunity: number;
  confirmedPrivateSector: number;
  reportedDeaths: number;
  indigenousDeaths: number;
  paramEpiDisplay: number;
  footnoteText: string | null;
  indigSource: number; // Keep for charts
}

export interface EstimatesData {
  estimatedCases: number;
  casesLowerBound: number;
  casesUpperBound: number;
  estimatedDeaths: number;
  deathsLowerBound: number;
  deathsUpperBound: number;
}

export interface PolicyData {
  intervention: string;
  strategy: string;
  policy: string;
  implemented: boolean;
  yearAdopted: number | null;
}

export interface TreatmentPolicy {
  category: string;
  medicine: string;
  yearAdopted: number | null;
}

export interface TherapeuticEfficacyData {
  medicine: string;
  year: number | null;
  min: number | null;
  median: number | null;
  max: number | null;
  followUp: string;
  numberOfStudies: number | null;
  species: string;
}

export interface ResistanceStatusData {
  insecticideClass: string;
  years: string;
  sites: number | null;
  vectors: string;
  used: boolean | null;
}

export interface CountryProfileData {
  population: PopulationData;
  parasites: ParasiteData;
  cases: CasesData;
  estimates: EstimatesData;
  policies: PolicyData[];
  treatment: TreatmentPolicy[];
  therapeuticEfficacy: TherapeuticEfficacyData[];
  resistanceStatus: ResistanceStatusData[];
  rdtType: string;
  showEstimates: boolean;
  countryCode: string;
}