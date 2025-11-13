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
