# 🪦 TABSTONE

> **Ghost your tabs — guilt-free.**

A cross-browser extension that helps you declutter browser tabs without forgetting them forever. Instead of keeping dozens of tabs open indefinitely, you can "bury" your current tabs into a visually themed "graveyard" where they can be organized into named groups and later "resurrected" (reopened) individually or as groups.

## ✨ Core Functionalities

- **🪦 Bury All Tabs**: Close all current tabs while saving them to a named group
- **📁 Group Management**: Organize buried tabs into custom-named groups
- **🔄 Resurrect Tabs**: Reopen individual tabs or entire groups
- **🗑️ Cleanup**: Delete individual tabs or entire groups
- **💾 Local Storage**: All data stored locally for privacy
- **🎨 Thematic Design**: Graveyard aesthetic with dark theme

## 🏗️ Tech Stack

- **Platform**: Cross-browser WebExtension (Chrome & Firefox)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: Browser Storage API (chrome.storage.local / browser.storage.local)
- **APIs**: Tabs API, Storage API, Runtime API
- **Build System**: Custom Node.js build scripts for multi-browser compatibility
- **No Dependencies**: Pure vanilla implementation

## 🌐 Multi-Browser Support

TABSTONE supports both Chrome and Firefox with a unified codebase:

- **Chrome**: Manifest V3 with service worker background
- **Firefox**: Manifest V2 with background scripts (auto-converted)
- **Unified API Layer**: Direct browser detection for seamless cross-platform compatibility
- **Build Process**: Automated transformation for browser-specific requirements

## 🚀 Development Setup

### Prerequisites
- Node.js >= 16.0.0
- Chrome and/or Firefox browser

### Installation
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TABSTONE
   ```

2. **Build for your target browser**
   ```bash
   # Build for Chrome
   npm run build:chrome
   
   # Build for Firefox
   npm run build:firefox
   
   # Build for both browsers
   npm run build:all
   ```

3. **Load the extension**
   - **Chrome**: Load `dist/chrome/` as unpacked extension
   - **Firefox**: Load `dist/firefox/` as temporary add-on

## 🔧 Build Process

The project uses custom build scripts to handle browser-specific requirements:

### Build Scripts
- **`build-chrome.js`**: Transforms source for Chrome Manifest V3
- **`build-firefox.js`**: Converts to Firefox Manifest V2 compatibility
- **`update-manifest-version.js`**: Automated version management

### Key Transformations
- **Manifest Conversion**: V3 → V2 for Firefox compatibility
- **API Adaptation**: Chrome APIs → Firefox APIs where needed
- **Browser Detection**: Unified `browserAPI` layer for cross-platform support

### Available Commands
```bash
# Development
npm run dev:chrome          # Build and load in Chrome
npm run dev:firefox         # Build and load in Firefox

# Testing
npm run test:chrome         # Build and test Chrome version
npm run test:firefox        # Build and test Firefox version

# Packaging
npm run package:chrome      # Build Chrome package
npm run package:firefox     # Build Firefox package
npm run package:all         # Build both packages

# Version Management
npm run version:bump:patch  # Bump patch version
npm run version:bump:minor  # Bump minor version
npm run version:bump:major  # Bump major version

# Release
npm run release             # Full release process
```

## 📁 Project Structure

```
TABSTONE/
├── src/                    # Source code
│   ├── manifest.json      # Base manifest (Manifest V3)
│   ├── popup/             # Extension popup UI
│   ├── background/        # Background service worker
│   ├── graveyard/         # Graveyard page
│   └── assets/            # Icons and branding
├── build/                 # Build scripts
│   ├── build-chrome.js    # Chrome build process
│   ├── build-firefox.js   # Firefox build process
│   └── update-manifest-version.js
├── dist/                  # Build outputs (gitignored)
│   ├── chrome/           # Chrome-compatible build
│   └── firefox/          # Firefox-compatible build
└── docs/                 # Project documentation
```

## 🔄 Browser Compatibility

### Chrome (Manifest V3)
- Service worker background script
- Modern Chrome APIs
- Manifest V3 features

### Firefox (Manifest V2)
- Background scripts (auto-converted from service worker)
- Firefox-specific manifest adjustments
- Compatible API layer

### Unified Features
- Cross-platform tab management
- Consistent storage API usage
- Shared UI components
- Identical functionality across browsers

---

**Because tab anxiety is real - built by Killiivalavan** 