# WMR Country Profile

World Malaria Report Country Profile

## Features

- **Dual Mode Operation**: A DHIS2 integrated application
- **Country Profiles**: Generates malaria epidemiological profiles
- **Print-PDF**: PDF-ready layouts with chart snapshots

## Development Mode
In development mode, the app uses user credentials or token-based authentication to connect to a DHIS2 instance:

```bash
npm install
npm run dev
```

The app will automatically detect if it's running in development mode and use the configured token authentication.

## Production Deployment (DHIS2 App)

### Creating Distribution File

To create a ready-to-upload ZIP file for DHIS2:

```bash
npm run dist
```

This command will:
1. Clean development credentials from the code
2. Build the production version
3. Create a ZIP file (`wmr-country-profiles.zip`) in the project root

### Manual Build (Alternative)

If you prefer to build manually:

```bash
npm run build
```

Then manually create a ZIP file containing all contents of the `dist` folder.

### Installing in DHIS2

1. Run `npm run dist` to create the distribution ZIP file
2. Log into your DHIS2 instance
3. Go to **App Management** (Settings → Apps)
4. Click **Install App** or **Upload App**
5. Select the `wmr-country-profiles.zip` file
6. The app will be installed and available in the Apps menu
7. The app will automatically use the existing DHIS2 session for authentication

### DHIS2 App Structure

```
wmr-country-profile.zip
├── manifest.webapp
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── img/
    └── [year]/
        └── [map files]
```

## Authentication

### Development Mode
- Uses Bearer token authentication/user credentials
- Configurable DHIS2 endpoint
- CORS-enabled requests

### Production Mode (DHIS2 App)
- Automatic session detection

## Technical Architecture

### Data Flow

1. **Authentication**: Auto-detects environment and uses appropriate auth method
2. **Country Selection**: Fetches countries with dataset access
3. **Data Loading**: Retrieves analytics data, policies, and metadata
4. **Processing**: Transforms raw data into structured country profile
5. **Visualization**: Renders interactive charts and tables
6. **Export**: Generates print-ready PDF with embedded chart images

## Environment Detection

The app automatically detects its runtime environment:

```typescript
function isRunningInDHIS2(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.pathname.includes('/dhis-web-') || 
          window.location.pathname.includes('/api/apps/') ||
          document.cookie.includes('JSESSIONID'));
}
```

## DHIS2 Data Preparation Guide

This guide provides comprehensive instructions for preparing data in DHIS2 to ensure the WMR Country Profile application functions correctly.

### Table of Contents
1. [Overview](#overview)
2. [Data Element Requirements](#data-element-requirements)
3. [Data Transformation Rules](#data-transformation-rules)
4. [Text vs Numeric Data Elements](#text-vs-numeric-data-elements)
5. [Policy Values](#policy-values)
6. [Configuration Parameters](#configuration-parameters)
7. [Special Country Configurations](#special-country-configurations)
8. [Chart-Specific Requirements](#chart-specific-requirements)
9. [Data Format Requirements](#data-format-requirements)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The WMR Country Profile application requires specific data elements to be configured in DHIS2 with particular data types, value formats, and transformation rules. This guide details all requirements to ensure proper data display and functionality.

### Key Concepts

- **Data Elements**: Must be assigned to dataset `CWuqJ3dtQC4`
- **Organization Units**: Countries must be at level 3 (or level 4 for special cases like Tanzania Mainland/Zanzibar)
- **Data Types**: Some elements must be text, others numeric
- **Transformations**: Some values are automatically multiplied by 100, capped at 100, or nulled for zeros
- **Configuration Flags**: Certain data elements control which sections of the profile are displayed

---

## Data Element Requirements

### Required Dataset

All data elements must be assigned to dataset: **`CWuqJ3dtQC4`**

### Organization Unit Levels

- **Standard Countries**: Level 3 organization units
- **Special Cases**: 
  - Tanzania Mainland: Level 4, code `TZA-4-1`
  - Tanzania Zanzibar: Level 4, code `TZA-4-2`
  - These level 4 entities are automatically included in the country dropdown

### Country Filtering

The following countries are automatically excluded from the dropdown:
- `BLZ`, `BTN`, `CPV`, `MYT`, `MYS`, `SAU`, `SUR`, `TLS`, `TZA`
- Any country with code starting with `TZA-4-1` or `TZA-4-2`

---

## Data Transformation Rules

The application automatically applies transformations to certain data elements. **Important**: Enter values in DHIS2 in their **raw format** (before transformation).

### Transformation Types

#### 1. `multiplyBy100`
Multiplies the value by 100. Use when storing decimal percentages (e.g., 0.85 for 85%).

**Data Elements with `multiplyBy100`:**
- `BJXyRAkf2HZ` - Malaria reporting completeness
- `o4iFtiN0YZh` - Care sought from public health facility
- `nvqnQcEbuPA` - Care sought from any provider
- `ZnSwOwcQt52` - % <5 with a positive microscopy slide on the day of the survey
- `gZrHErmb74i` - % <5 with a positive RDT on the day of the survey
- `SQWZ8POEhMI` - % of the population who slept under an ITN the previous night (survey)
- `LSlfr3VzLCp` - % of households with at least 1 ITN (survey)
- `IGQENa04DFm` - %<5 fever cases who had finger/heel stick (survey)
- `heI5NQZqZRW` - ACTs as % of all antimalarials received by <5 (survey)
- `rVUHAOEXV67` - % population that has access to ITNs (Modelled)
- `ZoMFYowPAkO` - Slide positivity rate
- `eVYQuP1faAt` - RDT positivity rate

**Example**: 
- Enter in DHIS2: `0.85` (for 85%)
- Application displays: `85%`

#### 2. `cut100`
Caps the value at 100 (maximum). Values above 100 are set to 100.

**Data Elements with `cut100`:**
- `niYxtlxx68s` - At risk protected with IRS (also has `multiplyBy100` and `nullZeros`)
- `Ruv1osltwn4` - At high risk protected with ITNs (also has `nullZeros`)

**Example**:
- Enter in DHIS2: `1.05` (for 105%)
- Application displays: `100%` (capped)

#### 3. `nullZeros`
Converts zero values to null (displayed as "-" or hidden).

**Data Elements with `nullZeros`:**
- `o4iFtiN0YZh` - Care sought from public health facility
- `nvqnQcEbuPA` - Care sought from any provider
- `ZnSwOwcQt52` - % <5 with a positive microscopy slide
- `gZrHErmb74i` - % <5 with a positive RDT
- `SQWZ8POEhMI` - % population who slept under ITN
- `LSlfr3VzLCp` - % households with at least 1 ITN
- `IGQENa04DFm` - %<5 fever cases with finger/heel stick
- `heI5NQZqZRW` - ACTs as % of antimalarials
- `nmmmi0UJr0C` - Suspected cases tested (%)
- `niYxtlxx68s` - At risk protected with IRS
- `Ruv1osltwn4` - At high risk protected with ITNs

**Example**:
- Enter in DHIS2: `0`
- Application displays: `-` (null)

#### 4. Combined Rules

Some elements have multiple rules applied in sequence:

- `niYxtlxx68s` - At risk protected with IRS
  - Rules: `multiplyBy100`, `nullZeros`, `cut100`
  - Process: Multiply by 100 → If zero, set to null → Cap at 100

---

## Text vs Numeric Data Elements

### Text Data Elements

These elements **must** be configured as **Text** data type in DHIS2 to preserve text values:

#### Policy Elements (Yes/No values)
- `Vm1oCupLZsS`, `gagBPnUGmaY`, `JKP3ANVLyjN`, `H9P0BVxKBYM`, `VBkox9y1nbh`, `geSDyXkZNU1`, `Q260gqIU0A1`, `apgTbakUcGw`, `myQQJ1wGzIs`, `rSxvwUOJEQN`, `lLdqBPGWhu1`, `DyINPGgopL3`, `MrVSpLKqDsp`, `anvAOV5ht6p`, `LFuetZdwR81`, `DP8ImP6qAK2`, `uVy7wsFKUKj`, `AXnVeNe9yF9`, `gzyORQNEpkZ`, `KmPLPFZJpHU`, `XHwHMqT5nmK`

#### Treatment Medicine Elements
- `KSqJwXVSfbD`, `gz7J7ikcJ1e`, `e6JiciQzwuh`, `zW6EYvOjMIo`, `lOvt1oXLdBr`, `aLWOXICfAbR`

#### Therapeutic Efficacy Text Elements
- `UIwEygmwj1J`, `rRs7tyHlgRc`, `NrMNyIUB7RQ`, `kp667EGomur` - Medicine names
- `IBovXuvqLqM`, `MCb8TWRSlb0`, `TzuDFOcom3h`, `aQdJEFAqmg2` - Follow-up periods
- `lmkabfeVd1U`, `LRksI6Vhz98`, `WdskU0t2N1i`, `ejBlfRCpZAB` - Species
- **`l7q5DJ4yQMP`, `NSNQbWC8PiS`, `rrKtSwyOGd9`, `C1WcroDjXOI`** - Year (can be ranges like "2016-2020")

#### Anopheles Species Elements
- `EZiGVGfTyLe`, `IxSMxz5GT9U`, `e76O7EJtWGk`, `KT39UBQaP1w`, `uu7tSgybizF`, `sQmvMbqADAw`

#### Resistance Status Text Elements
- `JRiVdTENIoc`, `OXa48KUAIpl`, `GI8boxUVl0X`, `catAlhTNBdV` - Insecticide class
- `e0EfJGiSb79`, `MnqhjD2JGWb`, `jDFQP0JQamH`, `dQ8Zy175oQc` - Years
- `YqvLJLueLT1`, `jGFk8LVWdyS`, `hJ3v9S8AK5S`, `b4mMqIHFcIV` - Vectors
- **`UKNTRFYcgr6`, `FYGTLutUdIA`, `Putx3c0luqG`, `id9O30pMkaD`** - Sites (text values)

#### Other Text Elements
- `YNRlSV0dMPf` - RDT type
- `LpmvOoiEVf0` - Cases footnote text

### Numeric Data Elements

All other data elements should be **Numeric** type. These include:
- Population data
- Cases data
- Estimates data
- Policy year values
- Therapeutic efficacy numeric values (Min, Median, Max, No. of studies)
- Resistance status "Used" elements (`Ub4bQGesaQa`, `NU9WgELSDVk`, `AVEJomeEnuA`, `AlLE4Na6ZaK`)

---

## Policy Values

### Standard Policy Values

Policy elements accept the following values:

- **`Y`** → Displays as **"Yes*"** (with asterisk) - Policy implemented
- **`Y1`** → Displays as **"Yes"** (no asterisk) - Policy implemented
- **`N`** → Displays as **"No"** - Policy not implemented
- **Any other value** → Displays as **"-"** - Not implemented

### Special Policy: Oral Artemisinin-Based Monotherapy

**Data Element**: `MrVSpLKqDsp` - "The sale of oral artemisinin- based monotherapy drugs"

This element accepts **text values** instead of Y/N/Y1:

- **"Has never been allowed"** → Displays as "Has never been allowed" with **green badge** (implemented: true)
- **"is banned"** → Displays as "is banned" with **green badge** (implemented: true)
- **Any other value** → Displays the value with **red badge** (implemented: false)

**Note**: This is the only policy element that accepts free text values.

---

## Configuration Parameters

### PARAM_EPI_DISPLAY (`Uk5ZiClT56N`)

Controls which case data is displayed in the profile:

- **Value `1`**: Shows "Confirmed cases" (`TfL9cVeMHyd`) in Chart 1
- **Value `2`**: Shows "Indigenous malaria cases" (`gyAhkgE9tlU`) in Chart 1
- **Value `3`**: Shows "Indigenous malaria cases" (`gyAhkgE9tlU`) in Chart 1

**Impact on Display**:
- Chart 1 line data changes based on this value
- Cases table shows different columns based on this value

### INDIG_Source (`r9twqeAdnRe`)

Used for chart source attribution. No impact on display logic.

### Country Code

The organization unit's `code` field determines:
- E2025 country status
- Estimates display
- Chart variations

---

## Special Country Configurations

### E2025 Countries

Countries with elimination targets for 2025. List: `BLZ`, `BTN`, `BWA`, `CPV`, `COM`, `CRI`, `PRK`, `DOM`, `ECU`, `SWZ`, `GUF`, `GTM`, `HND`, `IRN`, `MYS`, `MEX`, `NPL`, `PAN`, `KOR`, `STP`, `SAU`, `ZAF`, `SUR`, `THA`, `TLS`, `VUT`

**Impact**:
- Chart 6 shows "Cases by classification" instead of "Malaria inpatients and deaths"
- Chart 7 shows different data elements based on E2025 status
- Estimates section is hidden by default (unless overridden)

### Estimates Display Logic

- **Default**: Estimates hidden for E2025 countries
- **Exception**: Nepal (`NPL`) shows estimates even if E2025
- **Special Cases**: `COM`, `SWZ`, `THA` have special indigenous case handling

### Region-Based Logic

- **African Region (`AFR`)**: Chart 7 shows different data elements for non-E2025 countries
- **Other Regions**: Chart 7 shows different data element combinations

---

## Chart-Specific Requirements

### Chart 1: Estimated vs Reported Cases

**Data Elements**:
- `an08m0ybMb1` - Estimated cases
- `TfL9cVeMHyd` - Confirmed cases (if PARAM_EPI_DISPLAY = 1)
- `gyAhkgE9tlU` - Indigenous malaria cases (if PARAM_EPI_DISPLAY = 2 or 3)

**Requirements**: Numeric values, no transformations

### Chart 2: Reporting and Care Seeking

**Data Elements**:
- `BJXyRAkf2HZ` - Malaria reporting completeness (multiplyBy100)
- `nvqnQcEbuPA` - Care sought from any provider (multiplyBy100, nullZeros)
- `o4iFtiN0YZh` - Care sought from public health facility (multiplyBy100, nullZeros)

**Requirements**: Enter as decimals (0.0-1.0), will be multiplied by 100

### Chart 3: Treatment Courses and Testing

**Data Elements**:
- `OCuA0tI3BCi` - 1st-line treatment courses distributed
- `nmmmi0UJr0C` - Suspected cases tested (%) (nullZeros)
- `IGQENa04DFm` - %<5 fever cases with finger/heel stick (multiplyBy100, nullZeros)
- `heI5NQZqZRW` - ACTs as % of antimalarials (multiplyBy100, nullZeros)

**Requirements**: Treatment courses as whole numbers, percentages as decimals

### Chart 4: Positivity Rates

**Data Elements**:
- `ZoMFYowPAkO` - Slide positivity rate (multiplyBy100)
- `eVYQuP1faAt` - RDT positivity rate (multiplyBy100)
- `ZnSwOwcQt52` - % <5 positive microscopy (multiplyBy100, nullZeros)
- `gZrHErmb74i` - % <5 positive RDT (multiplyBy100, nullZeros)

**Requirements**: Enter as decimals (0.0-1.0)

### Chart 5: Cases by Species

**Data Elements**:
- `Y00dFsUx6ES` - Cases (all species)
- `fpEWR1WmPZY` - Cases (P. vivax)

**Requirements**: Numeric values, no transformations

### Chart 6: Cases by Classification / Inpatients

**E2025 Countries**:
- `s9PrOj148cI` - Imported cases
- `ulmblp2rojh` - Indigenous cases (P. falciparum)
- `UMgazh7eqLm` - Indigenous cases (P. vivax)
- `m0jc79EVfzn` - Introduced cases
- `MFzhW1xlBFW` - Relapse cases

**Non-E2025 Countries**:
- `GPi56xW9OJJ` - Inpatient malaria cases
- `WoxQjgg6grm` - Inpatient malaria cases - Under 5 yrs
- `P7pI8pyU313` - Inpatient malaria deaths
- `jDevPHyqPDX` - Inpatient malaria deaths - Under 5 yrs

**Requirements**: Numeric values

### Chart 7: Coverage of ITN and IRS

**E2025 or Non-AFR Countries**:
- `bfRZJGS7KOh` - At risk protected with ITNs
- `niYxtlxx68s` - At risk protected with IRS (multiplyBy100, nullZeros, cut100)
- `SQWZ8POEhMI` - % population slept under ITN (multiplyBy100, nullZeros)
- `LSlfr3VzLCp` - % households with at least 1 ITN (multiplyBy100, nullZeros)

**Non-E2025 AFR Countries**:
- `rVUHAOEXV67` - % population access to ITNs (Modelled) (multiplyBy100)
- `niYxtlxx68s` - At risk protected with IRS
- `SQWZ8POEhMI` - % population slept under ITN
- `LSlfr3VzLCp` - % households with at least 1 ITN

**Special**: Uses `skipRounding=true` API parameter to preserve decimal precision

### Chart 8: Sources of Financing

**Data Elements**:
- `EZKlghYRnnB` - Government contribution
- `SQ1v0YjfAcW` - Global Fund
- `JrVZ5GeTlGs` - USAID/PMI
- `OGZljNFx3q9` - World Bank
- `W62lvp0yZAS` - WHO/UNICEF
- `ilA4hUUKuzV` - Other contributions

**Requirements**: 
- Numeric values in USD
- **Uses `skipRounding=true` API parameter** to preserve decimal precision
- Tooltips display with 1 decimal place

---

## Data Format Requirements

### Year Values

**Therapeutic Efficacy Years** (`l7q5DJ4yQMP`, `NSNQbWC8PiS`, `rrKtSwyOGd9`, `C1WcroDjXOI`):
- **Format**: Text data type
- **Accepted Values**: 
  - Single year: `"2016"`
  - Year range: `"2016-2020"`
- **Display**: Smaller font size to accommodate ranges

**Policy Years**: Numeric values (4-digit year, e.g., `2020`)

### Percentage Values

For elements with `multiplyBy100` transformation:
- **Enter in DHIS2**: Decimal format (0.0 to 1.0)
- **Example**: Enter `0.85` for 85%
- **Application displays**: `85%`

### Financial Values (Chart 8)

- **Format**: Numeric, in USD
- **Precision**: Preserve decimals (use `skipRounding=true` in API)
- **Example**: Enter `1234567.89` for $1,234,567.89

### Policy Values

- **Standard**: `Y`, `Y1`, or `N` (case-sensitive)
- **Special**: `MrVSpLKqDsp` accepts text: "Has never been allowed" or "is banned"

---

## Troubleshooting

### Common Issues

#### 1. Year Ranges Not Displaying

**Problem**: Year ranges like "2016-2020" show as "2016" only

**Solution**: 
- Ensure therapeutic efficacy year UIDs are configured as **Text** data type
- Check that values are stored as text strings, not numbers

#### 2. Percentages Showing Incorrectly

**Problem**: Percentages display as decimals (0.85 instead of 85%)

**Solution**:
- Verify data element has `multiplyBy100` transformation rule
- Check that values are entered as decimals (0.0-1.0) in DHIS2

#### 3. Policy Values Not Displaying

**Problem**: Policy shows "-" instead of Yes/No

**Solution**:
- Ensure policy elements are **Text** data type
- Verify values are exactly `Y`, `Y1`, or `N` (case-sensitive)
- For `MrVSpLKqDsp`, use exact text: "Has never been allowed" or "is banned"

#### 4. Financial Data Rounding

**Problem**: Chart 8 values are rounded

**Solution**:
- Application uses `skipRounding=true` automatically for Chart 8
- If still rounding, check DHIS2 analytics API settings
- Verify values are stored with decimal precision in DHIS2

#### 5. Countries Not Appearing in Dropdown

**Problem**: Country missing from selection list

**Solution**:
- Verify organization unit is assigned to dataset `CWuqJ3dtQC4`
- Check organization unit level (should be 3, or 4 for Tanzania subdivisions)
- Verify country code is not in exclusion list
- Ensure user has access to the organization unit

#### 6. Estimates Section Not Showing

**Problem**: Estimates section is hidden

**Solution**:
- Check if country is E2025 (estimates hidden by default)
- Exception: Nepal (`NPL`) shows estimates even if E2025
- Verify `showEstimates` logic in code

#### 7. Chart Variations Not Displaying Correctly

**Problem**: Wrong chart data for E2025 countries

**Solution**:
- Verify country code matches E2025 list exactly
- Check region code for Chart 7 variations
- Verify PARAM_EPI_DISPLAY value for Chart 1 variations

---

## Quick Reference: Data Element Categories

### Text Elements (Must be Text Data Type)
- All policy Yes/No elements
- Treatment medicine names
- Therapeutic efficacy: Medicine, Follow-up, Species, **Year**
- Anopheles species
- Resistance status: Insecticide class, Years, Vectors, **Sites**
- RDT type
- Cases footnote

### Numeric Elements (Must be Numeric Data Type)
- Population data
- Cases data
- Estimates data
- Policy years
- Therapeutic efficacy: Min, Median, Max, No. of studies
- Resistance status: Used (1/0)
- All chart numeric values

### Elements with Transformations
- See [Data Transformation Rules](#data-transformation-rules) section above

---

## Data Entry Checklist

Before data entry, verify:

- [ ] All data elements assigned to dataset `CWuqJ3dtQC4`
- [ ] Text elements configured as Text data type
- [ ] Numeric elements configured as Numeric data type
- [ ] Policy values use exact format: `Y`, `Y1`, or `N`
- [ ] Percentage values entered as decimals (0.0-1.0)
- [ ] Year ranges entered as text strings (e.g., "2016-2020")
- [ ] Organization units at correct level (3 for countries, 4 for Tanzania subdivisions)
- [ ] Country codes match ISO 3-letter codes
- [ ] PARAM_EPI_DISPLAY value set correctly
- [ ] Financial data entered with decimal precision

---

## Support

For issues or questions about data preparation:
1. Check this guide's troubleshooting section
2. Verify data element UIDs match exactly
3. Review browser console for error messages
4. Check DHIS2 analytics API response for raw values