# 🪦 TABSTONE

> **Bury browser tabs guilt-free in a themed graveyard**

A Chrome Extension that helps users close browser tabs without losing them forever. Instead of keeping dozens of tabs open indefinitely, users can "bury" their current tabs into a visually themed "graveyard" where they can be organized into named groups and later "resurrected" (reopened) individually or as groups.

## 🎯 Project Overview

**Project Name**: TABSTONE  
**Type**: Chrome Extension  
**Timeline**: 12-hour hackathon-style sprint  
**Goal**: Help users close browser tabs guilt-free while preserving them for future reference

## ✨ Features

### Core Functionality
- **🪦 Bury All Tabs**: Close all current tabs while saving them to a named group
- **📁 Group Management**: Organize buried tabs into custom-named groups
- **🔄 Resurrect Tabs**: Reopen individual tabs or entire groups
- **🗑️ Cleanup**: Delete individual tabs or entire groups
- **💾 Local Storage**: All data stored locally for privacy

### User Experience
- **🎨 Thematic Design**: Graveyard aesthetic with dark theme
- **⚡ Fast Performance**: Quick popup loading and smooth interactions
- **🔒 Privacy-First**: No cloud sync, no data collection
- **♿ Accessible**: Keyboard navigation and screen reader support

## 🏗️ Architecture

### Technology Stack
- **Platform**: Chrome Extension (Manifest V3)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: chrome.storage.local
- **APIs**: Chrome Tabs API, Chrome Storage API
- **No Dependencies**: Pure vanilla implementation

### File Structure
```
TABSTONE/
├── manifest.json              # Extension manifest
├── popup/
│   ├── popup.html            # Popup interface
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styling
├── graveyard/
│   ├── graveyard.html        # Graveyard page
│   ├── graveyard.js          # Graveyard logic
│   └── graveyard.css         # Graveyard styling
├── background/
│   └── background.js         # Background script
├── assets/
│   ├── icons/                # Extension icons
│   └── images/               # UI images
├── docs/                     # Documentation
└── README.md                 # This file
```

## 🚀 Quick Start

### Development Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TABSTONE
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the TABSTONE folder

3. **Test the Extension**
   - Click the TABSTONE icon in your Chrome toolbar
   - Try burying some tabs and visiting the graveyard

### Building for Production
1. **Create a ZIP file** of the project folder
2. **Submit to Chrome Web Store** (if distributing publicly)
3. **Or distribute the ZIP** for manual installation

## 📖 Documentation

### Core Documentation
- **[App Flow](docs/APP_FLOW.md)**: Detailed user journey and interaction patterns
- **[Project Requirements](docs/PROJECT_REQUIREMENTS.md)**: Functional and non-functional requirements
- **[Tech Stack](docs/TECH_STACK.md)**: Technology choices and architecture decisions

### Key Concepts

#### Data Structure
```javascript
{
  "groupName1": {
    "timestamp": "2024-01-01T12:00:00Z",
    "tabs": [
      {
        "title": "Tab Title",
        "url": "https://example.com",
        "favicon": "data:image/...",
        "buriedAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

#### User Flow
1. **Bury Tabs**: User clicks extension → enters group name → buries tabs
2. **Visit Graveyard**: User clicks "Visit Graveyard" → views all groups
3. **Resurrect**: User clicks "Resurrect" → tabs reopen in new tabs
4. **Cleanup**: User deletes unwanted tabs or groups

## 🎨 Design Philosophy

### Visual Theme
- **Dark Theme**: Graveyard aesthetic with muted colors
- **Thematic Icons**: 🪦💀🌑🕯️ for visual consistency
- **Minimal UI**: Clean, focused interface without clutter

### User Experience
- **Guilt-Free**: Users can close tabs without fear of losing them
- **Organized**: Group tabs by purpose or context
- **Accessible**: Easy to find and resurrect when needed
- **Fast**: Quick interactions without waiting

## 🔧 Development

### Prerequisites
- Google Chrome (latest stable)
- Basic knowledge of HTML, CSS, JavaScript
- Chrome Extension development concepts

### Development Guidelines
- **Vanilla JavaScript**: No frameworks or build tools
- **Chrome APIs**: Use native Chrome Extension APIs
- **Local Storage**: All data stored locally
- **Performance**: Optimize for speed and efficiency

### Testing
- **Manual Testing**: Primary testing approach
- **Chrome DevTools**: Debug and inspect
- **Cross-Version**: Test on different Chrome versions

## 📋 Requirements

### Functional Requirements
- ✅ Bury all current tabs
- ✅ Bury selected tabs (optional)
- ✅ Group management with custom names
- ✅ Graveyard page with all groups
- ✅ Resurrect individual tabs
- ✅ Resurrect entire groups
- ✅ Delete individual tabs
- ✅ Delete entire groups
- ✅ Local storage persistence

### Non-Functional Requirements
- ✅ Fast loading (< 500ms popup, < 1s graveyard)
- ✅ Dark theme with graveyard aesthetic
- ✅ Keyboard navigation support
- ✅ Screen reader accessibility
- ✅ No external dependencies
- ✅ Chrome-only compatibility

## 🚧 Constraints

### Technical Constraints
- **No Backend**: Local storage only
- **No Frameworks**: Vanilla JavaScript implementation
- **No Build Tools**: Direct development approach
- **Chrome Only**: No cross-browser support

### Timeline Constraints
- **12-Hour Sprint**: Focused development timeline
- **MVP Focus**: Core functionality over features
- **Simple UI**: Minimal, usable interface
- **Working Over Perfect**: Functional over pixel-perfect

## 🔮 Future Enhancements

### Potential Features
- **Tab Selection**: Choose specific tabs to bury
- **Search**: Search through buried tabs
- **Export/Import**: Backup and restore data
- **Statistics**: Usage analytics and insights
- **Themes**: Multiple visual themes
- **Keyboard Shortcuts**: Quick access shortcuts

### Technical Improvements
- **TypeScript**: Type safety for larger codebase
- **Web Components**: Reusable UI components
- **Service Workers**: Offline functionality
- **IndexedDB**: Larger data storage capacity

## 🤝 Contributing

This is a hackathon project with a focused 12-hour timeline. However, if you'd like to contribute:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Chrome Extension APIs**: For providing the necessary browser integration
- **Graveyard Theme**: Inspired by the concept of preserving digital artifacts
- **Tab Management**: Addressing the common problem of tab clutter

## 📞 Support

For questions, issues, or feedback:
- **Issues**: Use the GitHub issues page
- **Documentation**: Check the docs folder
- **Development**: Follow the setup instructions above

---

**Built with ❤️ in 12 hours for guilt-free tab management** 