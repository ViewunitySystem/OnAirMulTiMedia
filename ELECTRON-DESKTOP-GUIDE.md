# OAMTM Desktop App Setup Guide

## Electron Configuration

### 1. Main Process (`electron/main.js`)
- **Window Management**: Creates main window with security settings
- **Menu System**: Custom menu with navigation shortcuts
- **Security**: Prevents new window creation, handles external links
- **IPC Handlers**: Communication between main and renderer processes

### 2. Preload Script (`electron/preload.js`)
- **Context Bridge**: Secure communication between main and renderer
- **API Exposure**: Exposes safe methods to renderer process
- **Platform Detection**: Adds platform-specific CSS classes
- **Version Info**: Logs app version to console

### 3. Build Configuration (`electron-builder.json`)
- **Multi-Platform**: Windows (NSIS, Portable), macOS (DMG, ZIP), Linux (AppImage, DEB, RPM)
- **Code Signing**: Ready for macOS and Windows code signing
- **Auto-Updater**: GitHub releases integration
- **Security**: Hardened runtime for macOS

## Build Commands

### Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for current platform
npm run build:electron
```

### Production Builds
```bash
# Windows
npm run build:electron:win

# macOS
npm run build:electron:mac

# Linux
npm run build:electron:linux

# All platforms
npm run build:electron
```

## Package.json Scripts
```json
{
  "scripts": {
    "electron:dev": "electron electron/main.js",
    "build:electron": "electron-builder",
    "build:electron:win": "electron-builder --win",
    "build:electron:mac": "electron-builder --mac",
    "build:electron:linux": "electron-builder --linux"
  }
}
```

## Security Features

### 1. Context Isolation
- `contextIsolation: true` - Prevents direct access to Node.js APIs
- `nodeIntegration: false` - Disables Node.js integration in renderer
- `enableRemoteModule: false` - Disables deprecated remote module

### 2. Content Security
- `webSecurity: true` - Enables web security features
- `allowRunningInsecureContent: false` - Blocks insecure content
- External link handling via `shell.openExternal()`

### 3. Preload Script
- Exposes only necessary APIs via `contextBridge`
- No direct access to Node.js APIs from renderer
- Secure IPC communication

## Platform-Specific Features

### Windows
- **NSIS Installer**: Full-featured installer with shortcuts
- **Portable Version**: No installation required
- **Code Signing**: Ready for Authenticode signing
- **Auto-Updater**: Windows update mechanism

### macOS
- **DMG Package**: Drag-and-drop installation
- **ZIP Archive**: Alternative distribution method
- **Hardened Runtime**: Enhanced security
- **Notarization**: Ready for Apple notarization
- **Universal Binary**: Intel and Apple Silicon support

### Linux
- **AppImage**: Universal Linux package
- **DEB Package**: Debian/Ubuntu package
- **RPM Package**: Red Hat/Fedora package
- **Desktop Integration**: Proper desktop file creation

## Menu System

### Keyboard Shortcuts
- `Cmd/Ctrl+U`: User Studio
- `Cmd/Ctrl+A`: Audit Manifest
- `Cmd/Ctrl+D`: Serverfarm Dashboard
- `Cmd/Ctrl+H`: Home
- `Cmd/Ctrl+R`: Reload
- `Cmd/Ctrl+Shift+R`: Force Reload
- `Alt+Cmd/Ctrl+Shift+I`: Developer Tools

### Navigation Menu
- Direct access to all OAMTM features
- External link handling
- Window management shortcuts

## Auto-Updater Integration

### GitHub Releases
```json
{
  "publish": {
    "provider": "github",
    "owner": "ViewunitySystem",
    "repo": "OnAirMulTiMedia"
  }
}
```

### Update Process
1. **Check for Updates**: On app startup
2. **Download**: Background download of new version
3. **Install**: Automatic installation on restart
4. **Notify**: User notification of available updates

## Troubleshooting

### Common Issues
1. **Build Fails**: Check Node.js version and dependencies
2. **Code Signing**: Ensure certificates are properly configured
3. **Auto-Updater**: Verify GitHub token permissions
4. **Security Warnings**: Check CSP and security settings

### Debug Commands
```bash
# Check Electron version
npx electron --version

# Run with debug flags
npx electron --inspect electron/main.js

# Check build configuration
npx electron-builder --help
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Build Electron App
  run: |
    npm run build:electron:win
    npm run build:electron:mac
    npm run build:electron:linux

- name: Upload Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: electron-builds
    path: release/
```

### Release Process
1. **Tag Release**: Create GitHub release tag
2. **Build Artifacts**: Generate platform-specific packages
3. **Upload**: Upload to GitHub releases
4. **Notify**: Auto-updater will detect new version
