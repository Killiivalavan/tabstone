#!/usr/bin/env node

/**
 * Version Synchronization Script for TABSTONE
 * Updates manifest.json version to match package.json
 */

const fs = require('fs').promises;
const path = require('path');

async function updateManifestVersion() {
  try {
    // Read package.json version
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    const newVersion = packageJson.version;
    
    console.log(`🔄 Updating manifest version to ${newVersion}...`);
    
    // Update src/manifest.json
    const manifestPath = path.join(process.cwd(), 'src', 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    const oldVersion = manifest.version;
    manifest.version = newVersion;
    
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Updated manifest version: ${oldVersion} → ${newVersion}`);
    
    // If builds exist, update them too
    const chromeBuild = path.join(process.cwd(), 'dist', 'chrome', 'manifest.json');
    const firefoxBuild = path.join(process.cwd(), 'dist', 'firefox', 'manifest.json');
    
    for (const buildPath of [chromeBuild, firefoxBuild]) {
      try {
        await fs.access(buildPath);
        const buildContent = await fs.readFile(buildPath, 'utf8');
        const buildManifest = JSON.parse(buildContent);
        buildManifest.version = newVersion;
        await fs.writeFile(buildPath, JSON.stringify(buildManifest, null, 2));
        console.log(`✅ Updated ${path.relative(process.cwd(), buildPath)}`);
      } catch (error) {
        // Build doesn't exist, skip
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to update manifest version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateManifestVersion();
}

module.exports = { updateManifestVersion };