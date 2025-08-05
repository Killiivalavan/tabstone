#!/usr/bin/env node

/**
 * Chrome Build Script for TABSTONE
 * Generates Chrome Web Store compatible extension
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'dist/chrome';
const SRC_DIR = 'src';

/**
 * Chrome-specific manifest transformations
 */
const CHROME_MANIFEST_REPLACEMENTS = {
  '"{{MANIFEST_VERSION}}"': '3',
  '"{{BACKGROUND_KEY}}"': '"service_worker"',
  '"{{BACKGROUND_VALUE}}"': '"background/background.js"',
  '"{{HOST_PERMISSIONS_KEY}}"': '"host_permissions"',
  '"{{CSP_KEY}}"': '"extension_pages"',
  '"{{OPTIONAL_PERMISSIONS_KEY}}"': '"optional_permissions"',
  '"{{BROWSER_SPECIFIC_API_KEY}}"': '"chrome_specific"'
};

/**
 * Chrome-specific API transformations
 */
const CHROME_API_REPLACEMENTS = [
  {
    from: /import\s+\{\s*api\s*\}\s+from\s+['"][^'"]*shared\/api\.js['"];?/g,
    to: '// Chrome native APIs used directly'
  },
  {
    from: /api\.(tabs|storage|runtime|action|permissions)/g,
    to: 'chrome.$1'
  }
];

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  await ensureDir(destDir);
  await fs.copyFile(src, dest);
}

async function copyDirectory(src, dest) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function transformManifest() {
  console.log('📝 Transforming manifest for Chrome...');
  
  let manifestContent = await fs.readFile(path.join(SRC_DIR, 'manifest.json'), 'utf8');
  
  // Apply Chrome-specific replacements
  for (const [placeholder, value] of Object.entries(CHROME_MANIFEST_REPLACEMENTS)) {
    manifestContent = manifestContent.replace(new RegExp(placeholder, 'g'), value);
  }
  
  // Remove Firefox-specific sections
  const manifest = JSON.parse(manifestContent);
  delete manifest.chrome_specific;
  
  // Ensure Chrome-specific fields
  if (!manifest.minimum_chrome_version) {
    manifest.minimum_chrome_version = '88';
  }
  
  const destPath = path.join(BUILD_DIR, 'manifest.json');
  await fs.writeFile(destPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Chrome manifest created');
}

async function transformJavaScript(filePath, destPath) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // Apply Chrome-specific API transformations
  for (const replacement of CHROME_API_REPLACEMENTS) {
    content = content.replace(replacement.from, replacement.to);
  }
  
  // Remove imports of api.js for Chrome build
  content = content.replace(/import.*from.*['"]\.\.\/shared\/api\.js['"];?\n?/g, '');
  
  await fs.writeFile(destPath, content);
}

// Transform HTML files for Chrome build - remove compatibility.js references
async function transformHtml(filePath, destPath) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // Remove the compatibility.js script tag for Chrome build (no longer needed)
  content = content.replace(/<script src="\.\.\/compatibility\.js"><\/script>\n?/g, '');
  
  await fs.writeFile(destPath, content);
}

async function processJavaScriptFiles(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'shared') {
      await ensureDir(destPath);
      await processJavaScriptFiles(srcPath, destPath);
    } else if (entry.name.endsWith('.js') && entry.name !== 'compatibility.js') {
      await transformJavaScript(srcPath, destPath);
    } else if (entry.name.endsWith('.html')) {
      await transformHtml(srcPath, destPath);
    } else if (entry.name.endsWith('.css')) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function copyAssets() {
  console.log('📁 Copying assets...');
  
  // Copy assets directory
  const assetsExists = await fs.access(path.join(SRC_DIR, 'assets')).then(() => true).catch(() => false);
  if (assetsExists) {
    await copyDirectory(path.join(SRC_DIR, 'assets'), path.join(BUILD_DIR, 'assets'));
  }
  
  console.log('✅ Assets copied');
}

async function validateBuild() {
  console.log('🔍 Validating Chrome build...');
  
  // Check if required files exist
  const requiredFiles = [
    'manifest.json',
    'background/background.js',
    'popup/popup.html',
    'popup/popup.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(BUILD_DIR, file);
    try {
      await fs.access(filePath);
      console.log(`✅ ${file} exists`);
    } catch {
      throw new Error(`❌ Required file missing: ${file}`);
    }
  }
  
  // Validate manifest
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  if (manifest.manifest_version !== 3) {
    throw new Error('❌ Chrome build must use Manifest V3');
  }
  
  if (!manifest.background.service_worker) {
    throw new Error('❌ Chrome build must use service_worker');
  }
  
  console.log('✅ Chrome build validation passed');
}

async function createPackage() {
  console.log('📦 Creating Chrome package...');
  
  try {
    execSync(`cd ${BUILD_DIR} && zip -r ../chrome-extension.zip .`, { stdio: 'inherit' });
    console.log('✅ Chrome package created: dist/chrome-extension.zip');
  } catch (error) {
    console.warn('⚠️  Could not create zip package (zip command not found)');
    console.log('💡 Manually zip the contents of dist/chrome/ for Chrome Web Store upload');
  }
}

async function buildChrome() {
  console.log('🚀 Building TABSTONE for Chrome...\n');
  
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
    
    // Create package
    await createPackage();
    
    console.log('\n🎉 Chrome build completed successfully!');
    console.log(`📁 Build output: ${BUILD_DIR}`);
    console.log('📦 Package: dist/chrome-extension.zip');
    console.log('\n🚀 Ready for Chrome Web Store upload!');
    
  } catch (error) {
    console.error('\n❌ Chrome build failed:', error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  buildChrome();
}

module.exports = { buildChrome };