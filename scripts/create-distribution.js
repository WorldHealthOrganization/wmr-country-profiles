#!/usr/bin/env node

/**
 * Create DHIS2 Distribution File
 * Builds the production version and creates a ZIP file ready for DHIS2 upload
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const manifestFile = path.join(rootDir, 'public', 'manifest.webapp');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

console.log('🚀 Creating DHIS2 distribution file...\n');

try {
  // Step 1: Clean credentials and build
  console.log('📋 Step 1: Cleaning credentials...');
  execSync('node scripts/clean-credentials.js', { stdio: 'inherit', cwd: rootDir });
  
  console.log('\n🔨 Step 2: Building for production...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Step 3: Verify dist folder exists
  if (!fs.existsSync(distDir)) {
    throw new Error('Build failed: dist folder not found');
  }
  
  // Step 4: Copy manifest.webapp to dist if not already there
  const distManifest = path.join(distDir, 'manifest.webapp');
  if (fs.existsSync(manifestFile) && !fs.existsSync(distManifest)) {
    console.log('\n📄 Copying manifest.webapp to dist...');
    fs.copyFileSync(manifestFile, distManifest);
  }
  
  // Step 5: Create ZIP file
  console.log('\n📦 Step 3: Creating distribution ZIP file...');
  
  // Get app name from manifest or package.json
  let appName = 'wmr-country-profiles';
  if (fs.existsSync(distManifest)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(distManifest, 'utf8'));
      appName = manifest.namespace || manifest.name?.toLowerCase().replace(/\s+/g, '-') || appName;
    } catch (e) {
      console.warn('Could not read manifest.webapp, using default name');
    }
  }
  
  const zipFileName = `${appName}.zip`;
  const zipFilePath = path.join(rootDir, zipFileName);
  
  // Remove existing ZIP if it exists
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  
  // Check if dist folder has contents
  const distContents = fs.readdirSync(distDir);
  if (distContents.length === 0) {
    throw new Error('dist folder is empty');
  }
  
  // Try to use system zip command (works on macOS and Linux)
  try {
    // Use zip command (available on macOS/Linux)
    // Create zip from dist directory contents
    const originalCwd = process.cwd();
    process.chdir(distDir);
    execSync(`zip -r "${zipFilePath}" . -x "*.DS_Store" "*.git*"`, { stdio: 'inherit' });
    process.chdir(originalCwd);
    
    // Get file size
    const stats = fs.statSync(zipFilePath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`\nDistribution file created successfully!`);
    console.log(`Location: ${zipFilePath}`);
    console.log(`Size: ${sizeInMB} MB`);
    console.log(`\n Ready to upload to DHIS2!`);
    console.log(`   File: ${zipFileName}`);
    
  } catch (zipError) {
    // Fallback: manual instructions
    console.error('\n System zip command not available.');
    console.error('\n Manual steps to create ZIP file:');
    console.error(` 1. Navigate to: ${distDir}`);
    console.error(` 2. Select all files and folders (including manifest.webapp)`);
    console.error(` 3. Create a ZIP archive`);
    console.error(` 4. Name it: ${zipFileName}`);
    console.error(` 5. The ZIP file should be in: ${rootDir}`);
    console.error(`\n Or install zip utility and try again.`);
    throw new Error('ZIP creation failed. Please create manually or install zip utility.');
  }
  
} catch (error) {
  console.error('\nError creating distribution file:', error.message);
  process.exit(1);
}

