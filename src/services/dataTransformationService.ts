// Data Transformation Service for DHIS2 Analytics Data
// Handles various data processing rules before plotting to charts

export type TransformationRule = 'multiplyBy100' | 'cut100' | 'nullZeros' | 'none';

interface DataElementTransformation {
  uid: string;
  rules: TransformationRule[];
  description?: string;
}

class DataTransformationService {
  private transformationRules: Map<string, TransformationRule[]> = new Map();

  constructor() {
    // Initialize with default transformation rules
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Add default transformation rules here
    // Example: Reporting completeness should be multiplied by 100
    this.addRules('BJXyRAkf2HZ', ['multiplyBy100'], 'Malaria reporting completeness');
    this.addRules('Uvn6LCg7dVU', ['multiplyBy100'], 'Care sought from any provider');
    this.addRules('o4iFtiN0YZh', ['multiplyBy100'], 'Care sought from public health facility');
    this.addRules('Rdbxu0qoX8U', ['multiplyBy100'], 'Suspected cases tested (%)');
    this.addRules('niYxtlxx68s', ['multiplyBy100', 'nullZeros', 'cut100'], 'At risk protected with IRS');

    
    this.addRules('IGQENa04DFm', ['nullZeros'], '%<5 fever cases who had finger/heel stick (survey)');
    this.addRules('heI5NQZqZRW', ['nullZeros'], 'ACTs as % of all antimalarials received by <5(survey)');

    this.addRules('ZoMFYowPAkO', ['multiplyBy100', 'nullZeros'], 'Slide positivity rate');
    this.addRules('eVYQuP1faAt', ['multiplyBy100', 'nullZeros'], 'RDT positivity rate');

    this.addRules('ZnSwOwcQt52', ['nullZeros'], '% <5 with a positive microscopy slide on the day of the survey');
    this.addRules('gZrHErmb74i', ['nullZeros'], '% <5 with a positive rdt on the day of the survey');

    this.addRules('P7pI8pyU313', ['nullZeros'], 'Inpatient malaria deaths');
    this.addRules('jDevPHyqPDX', ['nullZeros'], 'Inpatient malaria deaths - Under 5 yrs');

    this.addRules('Ruv1osltwn4', ['cut100', 'nullZeros'], 'At high risk protected with ITNs');

    this.addRules('SQWZ8POEhMI', ['nullZeros'], '% of the population who slept under an ITN the previous night(survey)');
    this.addRules('rVUHAOEXV67', ['multiplyBy100'], '% population that has access to ITNs (Modelled))');

    this.addRules('LSlfr3VzLCp', ['nullZeros'], '% of households with at least 1 ITN (survey)'); 
  }

  /**
   * Add transformation rules for a specific data element
   */
  addRules(uid: string, rules: TransformationRule[], description?: string): void {
    this.transformationRules.set(uid, rules);
  }

  /**
   * Add a single transformation rule for a specific data element (convenience method)
   */
  addRule(uid: string, rule: TransformationRule, description?: string): void {
    this.addRules(uid, [rule], description);
  }

  /**
   * Remove transformation rules for a specific data element
   */
  removeRule(uid: string): void {
    this.transformationRules.delete(uid);
  }

  /**
   * Get the transformation rules for a specific data element
   */
  getRules(uid: string): TransformationRule[] {
    return this.transformationRules.get(uid) || ['none'];
  }

  /**
   * Transform a single value based on the data element's rules
   */
  transformValue(value: number | null, dataElementUID: string): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const rules = this.getRules(dataElementUID);
    
    let transformedValue = value;
    
    for (const rule of rules) {
      switch (rule) {
        case 'multiplyBy100':
          transformedValue = transformedValue * 100;
          break;
        case 'cut100':
          transformedValue = Math.min(transformedValue, 100);
          break;
        case 'nullZeros':
          transformedValue = transformedValue === 0 ? null : transformedValue;
          break;
        case 'none':
        default:
          // No transformation
          break;
      }
      if (transformedValue === null) break; // Stop if value becomes null
    }
    
    return transformedValue;
  }

  /**
   * Transform an array of values for a specific data element
   */
  transformValueArray(values: (number | null)[], dataElementUID: string): (number | null)[] {
    return values.map(value => this.transformValue(value, dataElementUID));
  }

  /**
   * Transform analytics data rows based on configured rules
   * Returns a new array with transformed values
   */
  transformAnalyticsRows(rows: string[][]): string[][] {
    return rows.map(row => {
      if (row.length < 4) return row;
      
      const dataElementUID = row[0];
      const rawValue = parseFloat(row[3]);
      
      if (isNaN(rawValue)) return row;
      
      const transformedValue = this.transformValue(rawValue, dataElementUID);
      
      // Create new row with transformed value
      return [
        row[0], // data element
        row[1], // org unit
        row[2], // period
        transformedValue !== null ? transformedValue.toString() : row[3] // transformed value
      ];
    });
  }

  /**
   * Batch add multiple transformation rules
   */
  addMultipleRules(transformations: DataElementTransformation[]): void {
    transformations.forEach(({ uid, rules, description }) => {
      this.addRules(uid, rules, description);
    });
  }

  /**
   * Get all configured transformation rules
   */
  getAllRules(): Map<string, TransformationRule[]> {
    return new Map(this.transformationRules);
  }

  /**
   * Parse and add rule from string format: "UID: BJXyRAkf2HZ should multiplyBy100,nullZeros"
   */
  addRuleFromString(ruleString: string): boolean {
    const match = ruleString.match(/UID:\s*([A-Za-z0-9]{11})\s+should\s+(.+)/i);
    
    if (match) {
      const uid = match[1];
      const rulesString = match[2];
      const rules = rulesString.split(',').map(r => r.trim().toLowerCase() as TransformationRule);
      this.addRules(uid, rules, `Added via string: ${ruleString}`);
      return true;
    }
    
    console.warn(`Could not parse rule string: ${ruleString}`);
    return false;
  }

  /**
   * Clear all transformation rules
   */
  clearAllRules(): void {
    this.transformationRules.clear();
  }

  /**
   * Log all current transformation rules
   */
  logAllRules(): void {
    // This method is kept for potential debugging but doesn't log by default
  }
}

// Export singleton instance
export const dataTransformationService = new DataTransformationService();

// Export types for use in other files
export type { DataElementTransformation };