import { dhis2Service } from '../services/dhis2Service';

interface SurveyIndicator {
  survey: string;
  year: number;
}

function sortBy(field: string, options: { name: string; primer: (value: any) => any; reverse: boolean }) {
  return function(a: any, b: any) {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    
    // If primary field is equal, sort by secondary field
    const aSecondary = options.primer(a[options.name]);
    const bSecondary = options.primer(b[options.name]);
    
    if (options.reverse) {
      return bSecondary - aSecondary;
    }
    return aSecondary - bSecondary;
  };
}

function createSource(indicators: SurveyIndicator[]): string {
  let sourceStr = "";
  let strSurv = "";
  let strYear = "";
  const arrSurvYears: string[] = [];

  const sorted = indicators.sort(sortBy('survey', { name: 'year', primer: parseInt, reverse: false }));

  for (let j = 0; j < sorted.length; j++) {
    const currentSurvey = String(sorted[j].survey);
    const currentYear = String(sorted[j].year);
    
    if (j === 0) { // First pass
      strSurv = currentSurvey;
      strYear = currentYear;
    } else {
      if (sorted[j].survey !== sorted[j - 1].survey) {
        // Different survey, save previous and start new
        arrSurvYears.push(strSurv + " " + strYear);
        strSurv = currentSurvey;
        strYear = currentYear;
      } else {
        // Same survey, add year if not already present
        const yearStr = currentYear;
        if (strYear.indexOf(yearStr) === -1) {
          strYear += "," + yearStr;
        }
      }
    }
  }
  
  // Add the last survey
  if (strSurv) {
    arrSurvYears.push(strSurv + " " + strYear);
  }

  // Build final source string
  for (let i = 0; i < arrSurvYears.length; i++) {
    if (i === 0) {
      sourceStr += arrSurvYears[i];
    } else {
      sourceStr = sourceStr + ", " + arrSurvYears[i];
    }
  }
  
  return sourceStr.trim();
}

export async function getChartSource(dataElements: string[], orgUnitID: string): Promise<string> {
  // Use first data element as dx1, second as dx2 (or empty string if not available)
  const dx1 = dataElements[0] || '';
  const dx2 = dataElements.length > 1 ? dataElements[1] : '';
  
  try {
    const indicators: SurveyIndicator[] = [];
    
    // Call SQLView API
    const sqlViewData = await dhis2Service.getSQLViewData('WQHkspRCcD9', {
      qDE1: dx1,
      qDE2: dx2,
      orgUID: orgUnitID
    });
    
    // Process the grid data
    if (sqlViewData.listGrid && sqlViewData.listGrid.rows) {
      const surveyGrid = sqlViewData.listGrid.rows;
      
      for (let i = 0; i < surveyGrid.length; i++) {
        const surveyName = surveyGrid[i][0];
        const surveyYear = surveyGrid[i][1];
        
        if (surveyName && surveyYear) {
          const indicator: SurveyIndicator = {
            survey: surveyName,
            year: parseInt(surveyYear)
          };
          indicators.push(indicator);
        }
      }
    }
    
    // Create and return the source string
    return createSource(indicators);
  } catch (error) {
    console.error('Error in getChartSource:', error);
    return '';
  }
}