#!/usr/bin/env node

/**
 * Production Build Script
 * Automatically removes development credentials and builds for distribution
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const contextFile = path.join(process.cwd(), 'src/context/DHIS2Context.tsx');
const backupFile = path.join(process.cwd(), 'src/context/DHIS2Context.tsx.backup');

console.log('🚀 Starting production build process...');

try {
  // Create backup of original file
  console.log('📋 Creating backup of DHIS2Context.tsx...');
  fs.copyFileSync(contextFile, backupFile);
  
  // Read the file
  let content = fs.readFileSync(contextFile, 'utf8');
  
  console.log('🧹 Removing development credentials...');
  
  // Remove the entire development authentication section
  const devSectionPattern = /\/\/ Development mode - using username\/password authentication[\s\S]*?await connect\(config\);/g;
  
  content = content.replace(devSectionPattern, `// Development credentials removed for production build
      throw new Error('This application must be run in production mode with proper DHIS2 authentication');`);
  
  // Write the cleaned content
  fs.writeFileSync(contextFile, content, 'utf8');
  
  console.log('🔨 Building for production...');
  
  // Set production environment and build
  process.env.NODE_ENV = 'production';
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('Production build completed successfully!');
  console.log('Distribution files are ready in the dist/ folder');
  
} catch (error) {
  console.error('Build failed:', error.message);
  
  // Restore backup if build failed
  if (fs.existsSync(backupFile)) {
    console.log('🔄 Restoring original file...');
    fs.copyFileSync(backupFile, contextFile);
    fs.unlinkSync(backupFile);
  }
  
  process.exit(1);
} finally {
  // Clean up backup file
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
}

