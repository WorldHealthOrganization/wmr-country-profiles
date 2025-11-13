#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const contextFile = path.join(process.cwd(), 'src/context/DHIS2Context.tsx');

console.log('🧹 Cleaning development credentials from DHIS2Context.tsx...');

try {
  // Read the file
  let content = fs.readFileSync(contextFile, 'utf8');
  
  // Pattern to match the development authentication section
  const devAuthPattern = /\/\* Development mode - using token authentication[\s\S]*?\*\//g;
  const devAuthPattern2 = /\/\/ Development mode - using username\/password authentication[\s\S]*?await connect\(config\);/g;
  
  // Remove the commented token authentication section
  content = content.replace(devAuthPattern, '');
  
  // Remove the username/password authentication section
  content = content.replace(devAuthPattern2, `// Development mode - credentials removed for production
      // Use environment variables or secure configuration in production
      throw new Error('Development credentials removed for production build');`);
  
  // Write the cleaned content back
  fs.writeFileSync(contextFile, content, 'utf8');
  
  console.log('Development credentials successfully removed!');
  console.log('Safe to build for production distribution');
  
} catch (error) {
  console.error('Error cleaning credentials:', error.message);
  process.exit(1);
}

