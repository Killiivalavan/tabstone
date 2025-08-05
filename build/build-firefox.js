#!/usr/bin/env node

/**
 * Firefox Build Script for TABSTONE
 * Builds Firefox-compatible extension from src/ directory
 */

const fs = require('fs').promises;
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const BUILD_DIR = path.join(__dirname, '..', 'dist', 'firefox');

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Copy a single file
async function copyFile(src, dest) {
  await fs.copyFile(src, dest);
}

// Copy directory recursively
async function copyDirectory(src, dest) {
  await ensureDir(dest);
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      // Ensure the destination directory exists before copying the file
      const destDir = path.dirname(destPath);
      await ensureDir(destDir);
      await copyFile(srcPath, destPath);
    }
  }
}

// Transform manifest for Firefox (Manifest V2)
async function transformManifest() {
  console.log('📝 Transforming manifest for Firefox...');
  
  const manifestPath = path.join(SRC_DIR, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  
  // Parse the JSON
  const manifest = JSON.parse(manifestContent);
  
  // Convert Manifest V3 to V2
  const firefoxManifest = {
    manifest_version: 2,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    permissions: [...(manifest.permissions || []), ...(manifest.host_permissions || [])],
    browser_action: {
      default_popup: manifest.action?.default_popup,
      default_icon: manifest.action?.default_icon
    },
    background: {
      scripts: [manifest.background?.service_worker]
    },
    icons: manifest.icons,
    content_security_policy: manifest.content_security_policy?.extension_pages 
      ? `script-src 'self'; object-src 'self'` 
      : undefined,
    browser_specific_settings: {
      gecko: {
        id: "tabstone@example.com",
        strict_min_version: "79.0"
      }
    }
  };
  
  // Remove undefined values
  Object.keys(firefoxManifest).forEach(key => {
    if (firefoxManifest[key] === undefined) {
      delete firefoxManifest[key];
    }
  });
  
  const destPath = path.join(BUILD_DIR, 'manifest.json');
  await fs.writeFile(destPath, JSON.stringify(firefoxManifest, null, 2));
  
  console.log('✅ Firefox manifest created');
}

// Transform JavaScript files to use browser.* APIs
async function transformJavaScript(filePath, destPath) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // For Firefox, we need to handle the compatibility layer properly
  // Since we're using browserAPI in our code, we need to ensure it works in Firefox
  
  // Remove the compatibility.js import since Firefox has native browser.* APIs
  content = content.replace(/<script src="\.\.\/compatibility\.js"><\/script>\n?/g, '');
  
  // Replace browserAPI with browser for Firefox
  content = content.replace(/browserAPI\./g, 'browser.');
  
  // Ensure proper error handling for Firefox
  content = content.replace(/browser\.runtime\.lastError/g, 'browser.runtime.lastError');
  
  await fs.writeFile(destPath, content);
}

// Transform HTML files to remove compatibility script for Firefox
async function transformHtml(filePath, destPath) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // Remove the compatibility.js script tag for Firefox
  content = content.replace(/<script src="\.\.\/compatibility\.js"><\/script>\n?/g, '');
  
  await fs.writeFile(destPath, content);
}

// Process JavaScript files and copy HTML/CSS
async function processJavaScriptFiles(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    // Skip assets directory - it's handled separately
    if (entry.name === 'assets') {
      continue;
    }
    
    // Skip manifest.json - it's handled by transformManifest
    if (entry.name === 'manifest.json') {
      continue;
    }
    
    if (entry.isDirectory()) {
      await ensureDir(destPath);
      await processJavaScriptFiles(srcPath, destPath);
    } else if (entry.name.endsWith('.js')) {
      await ensureDir(path.dirname(destPath));
      await transformJavaScript(srcPath, destPath);
    } else if (entry.name.endsWith('.html')) {
      await ensureDir(path.dirname(destPath));
      await transformHtml(srcPath, destPath);
    } else {
      // Copy CSS and other files as-is
      await ensureDir(path.dirname(destPath));
      await copyFile(srcPath, destPath);
    }
  }
}

// Copy assets directory
async function copyAssets() {
  console.log('📁 Copying assets...');
  
  const assetsSrc = path.join(SRC_DIR, 'assets');
  const assetsDest = path.join(BUILD_DIR, 'assets');
  
  try {
    // Check if assets directory exists
    await fs.access(assetsSrc);
    await copyDirectory(assetsSrc, assetsDest);
    console.log('✅ Assets copied');
  } catch (error) {
    console.log('ℹ️  No assets directory found, skipping...');
  }
}

// Validate the build
async function validateBuild() {
  console.log('🔍 Validating Firefox build...');
  
  const requiredFiles = [
    'manifest.json',
    'background/background.js',
    'popup/popup.html',
    'popup/popup.js'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(BUILD_DIR, file));
      console.log(`✅ ${file} exists`);
    } catch {
      throw new Error(`❌ Required file missing: ${file}`);
    }
  }
  
  // Validate manifest
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  if (manifest.manifest_version !== 2 && manifest.manifest_version !== "2") {
    throw new Error('❌ Firefox build must use Manifest V2');
  }
  
  if (!manifest.background.scripts) {
    throw new Error('❌ Firefox build must use background scripts');
  }
  
  if (!manifest.browser_specific_settings?.gecko?.id) {
    throw new Error('❌ Firefox build must have gecko ID');
  }
  
  console.log('✅ Firefox build validation passed');
}

// Main build function
async function buildFirefox() {
  console.log('🦊 Building TABSTONE for Firefox...\n');
  
  try {
    // Clean build directory
    console.log('🧹 Cleaning build directory...');
    await fs.rmdir(BUILD_DIR, { recursive: true }).catch(() => {});
    await ensureDir(BUILD_DIR);
    
    // Transform manifest
    await transformManifest();
    
    // Process JavaScript files and copy HTML/CSS
    console.log('🔄 Processing source files...');
    await processJavaScriptFiles(SRC_DIR, BUILD_DIR);
    
    // Copy assets
    await copyAssets();
    
    // Validate build
    await validateBuild();
    
    console.log('\n🎉 Firefox build completed successfully!');
    console.log(`📁 Build output: ${BUILD_DIR}`);
    console.log('\n💡 To test in Firefox:');
    console.log('   1. Open Firefox');
    console.log('   2. Go to about:debugging');
    console.log('   3. Click "This Firefox"');
    console.log('   4. Click "Load Temporary Add-on"');
    console.log('   5. Select the manifest.json from dist/firefox/');
    console.log('\n💡 To package for submission:');
    console.log('   - Manually zip the contents of dist/firefox/');
    console.log('   - Upload to Firefox Add-ons');
    
  } catch (error) {
    console.error('\n❌ Firefox build failed:', error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  buildFirefox();
}

module.exports = { buildFirefox };