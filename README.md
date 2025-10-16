# WMR Country Profile

World Malaria Report Country Profile

## Features

- **Operation**: A DHIS2 integrated application
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

### Building for DHIS2

```bash
npm run build
zip the contents of the dist folder, rename and install
```

### Installing in DHIS2

1. Create a ZIP file containing the `dist` folder contents and `manifest.webapp`
2. Upload through DHIS2 App Management
3. The app will automatically use the existing DHIS2 session

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
