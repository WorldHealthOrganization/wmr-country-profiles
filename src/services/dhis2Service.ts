import { DHIS2Config, DHIS2User, Country, AnalyticsResponse, OptionSet } from '../types/dhis2';
import type { OrganisationUnitDetails } from '../types/dhis2';

// Check if running in DHIS2 environment
function isRunningInDHIS2(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.href.includes('/dhis-web-') || 
          window.location.href.includes('/api/apps/') ||
          document.cookie.includes('JSESSIONID'));
}

// Get DHIS2 base URL when running in production
function getDHIS2BaseUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // Use DHIS2's built-in context path detection if available
  if (typeof window !== 'undefined' && (window as any).dhis2) {
    const dhis2 = (window as any).dhis2;
    if (dhis2.settings && dhis2.settings.baseUrl) {
      return dhis2.settings.baseUrl;
    }
  }
  
  // Fallback: try to get from manifest or system info
  if (typeof window !== 'undefined' && (window as any).manifest) {
    const manifest = (window as any).manifest;
    if (manifest.baseUrl) {
      return manifest.baseUrl;
    }
  }
  
  // Final fallback: manual extraction from URL
  const { protocol, hostname, port, pathname } = window.location;
  const portStr = port ? `:${port}` : '';
  
  let contextPath = '';
  if (pathname.includes('/dhis-web-')) {
    const dhisWebIndex = pathname.indexOf('/dhis-web-');
    contextPath = pathname.substring(0, dhisWebIndex);
  } else if (pathname.includes('/api/apps/')) {
    const apiIndex = pathname.indexOf('/api/apps/');
    contextPath = pathname.substring(0, apiIndex);
  } else if (pathname.includes('/dhis2')) {
    const dhis2Index = pathname.indexOf('/dhis2');
    contextPath = pathname.substring(0, dhis2Index + 6);
  } else if (pathname.includes('/dhis')) {
    const dhisIndex = pathname.indexOf('/dhis');
    contextPath = pathname.substring(0, dhisIndex + 5);
  }
  
  return `${protocol}//${hostname}${portStr}${contextPath}`;
}

class DHIS2Service {
  private config: DHIS2Config | null = null;
  private authHeader: string | null = null;
  private isProduction: boolean = false;

  setConfig(config: DHIS2Config) {
    this.config = config;
    this.isProduction = false;
    
    if (config.token) {
      this.authHeader = 'Bearer ' + config.token;
    } else if (config.username && config.password) {
      this.authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
    } else {
      throw new Error('Either token or username/password must be provided');
    }
  }

  // Initialize for production DHIS2 environment
  initializeProduction() {
    this.isProduction = true;
    this.config = {
      baseUrl: getDHIS2BaseUrl()
    };
    // In production, we rely on session cookies, no explicit auth header needed
    this.authHeader = null;
    
  }

  async authenticate(): Promise<DHIS2User> {
    if (!this.config) {
      throw new Error('DHIS2 not configured');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/me`, {
        headers: this.isProduction ? {
          'Content-Type': 'application/json',
        } : {
          'Authorization': this.authHeader!,
          'Content-Type': 'application/json',
        },
        credentials: this.isProduction ? 'include' : 'omit', // Include cookies in production
        cache: 'no-cache',
        mode: this.isProduction ? 'same-origin' : 'cors'
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      return {
        id: userData.id || 'demo-user',
        displayName: userData.displayName || (this.isProduction ? 'DHIS2 User' : 'Demo User (Connected)'),
        username: userData.username || this.config.username || 'token-user',
      };
    } catch (error) {
      throw error;
    }
  }

  async getCountries(): Promise<Country[]> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured or authenticated');
    }

    try {
      // First, get the user's accessible organization units
      const userOrgUnitsResponse = await fetch(
        `${this.config.baseUrl}/api/me?fields=organisationUnits[id,displayName,shortName,code,level,path]`,
        {
          headers: this.isProduction ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': this.authHeader!,
            'Content-Type': 'application/json',
          },
          credentials: this.isProduction ? 'include' : 'omit',
          cache: 'no-cache',
          mode: this.isProduction ? 'same-origin' : 'cors'
        }
      );

      if (!userOrgUnitsResponse.ok) {
        throw new Error('Failed to fetch user organization units');
      }

      const userData = await userOrgUnitsResponse.json();
      const userOrgUnits = userData.organisationUnits || [];


      // Get user's accessible org unit IDs and paths for hierarchy checking
      const userOrgUnitIds = userOrgUnits.map((ou: any) => ou.id);
      const userOrgUnitPaths = userOrgUnits.map((ou: any) => ou.path);


      // Get the dataset organization units with path for hierarchy checking
      const datasetResponse = await fetch(
        `${this.config.baseUrl}/api/dataSets/CWuqJ3dtQC4?fields=organisationUnits[id,displayName,shortName,code,level,path]`,
        {
          headers: this.isProduction ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': this.authHeader!,
            'Content-Type': 'application/json',
          },
          credentials: this.isProduction ? 'include' : 'omit',
          cache: 'no-cache',
          mode: this.isProduction ? 'same-origin' : 'cors'
        }
      );

      if (!datasetResponse.ok) {
        throw new Error('Failed to fetch dataset organization units');
      }

      const datasetData = await datasetResponse.json();

      // Filter dataset org units to include those the user has access to
      // User has access if they're directly assigned OR if the org unit is a descendant OR if the user org unit is a descendant
      const accessibleOrgUnits = datasetData.organisationUnits?.filter((ou: any) => {
        // Direct access
        if (userOrgUnitIds.includes(ou.id)) {
          return true;
        }

        // Check if org unit is a descendant of any user org unit
        // Path format: /root/parent/child, so check if any user path is a prefix
        const isDescendantOfUser = userOrgUnitPaths.some((userPath: string) =>
          ou.path && ou.path.startsWith(userPath + '/')
        );

        if (isDescendantOfUser) {
          return true;
        }

        // Check if any user org unit is a descendant of this org unit
        // This handles cases where user has access to child org units but not parent
        const hasDescendantAccess = userOrgUnitPaths.some((userPath: string) =>
          userPath && userPath.startsWith(ou.path + '/')
        );

        return hasDescendantAccess;
      }) || [];


      // Filter for country-level org units (level 3)
      const countryLevelOrgUnits = accessibleOrgUnits.filter((ou: any) => ou.level === 3);


      if (countryLevelOrgUnits.length === 0) {
        // Fallback: return all accessible org units if no level 3 found
        return accessibleOrgUnits.sort((a: Country, b: Country) =>
          a.shortName.localeCompare(b.shortName)
        );
      }

      return countryLevelOrgUnits.sort((a: Country, b: Country) =>
        a.shortName.localeCompare(b.shortName)
      );
    } catch (error) {
      console.error('Failed to fetch countries from dataset:', error);
      throw error;
    }
  }


  async getAnalyticsData(
    dataElements: string[],
    orgUnit: string,
    period: string
  ): Promise<AnalyticsResponse> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured');
    }

    try {
      const dx = dataElements.join(';');
      const url = `${this.config.baseUrl}/api/analytics?dimension=dx:${dx}&dimension=ou:${orgUnit}&dimension=pe:${period}`;
      
      const response = await fetch(url, {
        headers: this.isProduction ? {
          'Content-Type': 'application/json',
        } : {
          'Authorization': this.authHeader!,
          'Content-Type': 'application/json',
        },
        credentials: this.isProduction ? 'include' : 'omit',
        cache: 'no-cache',
        mode: this.isProduction ? 'same-origin' : 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      throw error;
    }
  }

  async getOptionSet(id: string): Promise<OptionSet> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/optionSets/${id}?fields=id,options[code,displayName]`,
        {
          headers: this.isProduction ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': this.authHeader!,
            'Content-Type': 'application/json',
          },
          credentials: this.isProduction ? 'include' : 'omit',
          cache: 'no-cache',
          mode: this.isProduction ? 'same-origin' : 'cors'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch option set');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch option set:', error);
      throw error;
    }
  }

  async getOrganisationUnit(id: string): Promise<OrganisationUnitDetails> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/organisationUnits/${id}?fields=code,parent[id,code,displayName]`,
        {
          headers: this.isProduction ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': this.authHeader!,
            'Content-Type': 'application/json',
          },
          credentials: this.isProduction ? 'include' : 'omit',
          cache: 'no-cache',
          mode: this.isProduction ? 'same-origin' : 'cors'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organisation unit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch organisation unit:', error);
      throw error;
    }
  }

  async getDataElement(uid: string): Promise<{ comment?: string }> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/dataElements/${uid}?fields=comment`,
        {
          headers: this.isProduction ? {
            'Content-Type': 'application/json',
          } : {
            'Authorization': this.authHeader!,
            'Content-Type': 'application/json',
          },
          credentials: this.isProduction ? 'include' : 'omit',
          cache: 'no-cache',
          mode: this.isProduction ? 'same-origin' : 'cors'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data element: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch data element:', error);
      throw error;
    }
  }

  async getSQLViewData(sqlViewId: string, variables: Record<string, string> = {}): Promise<any> {
    if (!this.config || (!this.authHeader && !this.isProduction)) {
      throw new Error('DHIS2 not configured');
    }

    try {
      // Construct query parameters from variables
      const queryParams = new URLSearchParams();
      Object.entries(variables).forEach(([key, value]) => {
        queryParams.append('var', `${key}:${value}`);
      });
      
      const queryString = queryParams.toString();
      const url = `${this.config.baseUrl}/api/sqlViews/${sqlViewId}/data.json${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: this.isProduction ? {
          'Content-Type': 'application/json',
        } : {
          'Authorization': this.authHeader!,
          'Content-Type': 'application/json',
        },
        credentials: this.isProduction ? 'include' : 'omit',
        cache: 'no-cache',
        mode: this.isProduction ? 'same-origin' : 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SQL view data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error('Failed to fetch SQL view data:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.isProduction) {
      // In production, we don't disconnect - user manages session through DHIS2
      return;
    }
    this.config = null;
    this.authHeader = null;
  }
}

export const dhis2Service = new DHIS2Service();