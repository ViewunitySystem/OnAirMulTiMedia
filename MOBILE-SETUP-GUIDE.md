# OAMTM Mobile Setup Guide

## Android Setup

### 1. Android Studio Installation
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 2. Capacitor Android Setup
```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Add Android platform
npx cap add android

# Sync web assets
npx cap sync android

# Open in Android Studio
npx cap open android
```

### 3. Build APK
```bash
# Debug APK
npx cap run android

# Release APK (requires signing)
npx cap build android
```

### 4. Signing Configuration
Create `android/app/build.gradle` signing config:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## iOS Setup

### 1. Xcode Installation
```bash
# Install Xcode from Mac App Store
# Install Xcode Command Line Tools
xcode-select --install
```

### 2. Capacitor iOS Setup
```bash
# Add iOS platform
npx cap add ios

# Sync web assets
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 3. Build IPA
```bash
# Debug build
npx cap run ios

# Release build (requires Apple Developer Account)
npx cap build ios
```

### 4. Code Signing
- Open project in Xcode
- Select project → Signing & Capabilities
- Set Team and Bundle Identifier
- Enable "Automatically manage signing"

## PWA Configuration

### 1. Service Worker
Create `sw.js`:
```javascript
const CACHE_NAME = 'oamtm-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/webui/user-studio.html',
  '/docs/audit-manifest.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### 2. Manifest
Create `manifest.json`:
```json
{
  "name": "OAMTM Serverfarm",
  "short_name": "OAMTM",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1020",
  "theme_color": "#93c5fd",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Build Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "mobile:android": "npx cap run android",
    "mobile:ios": "npx cap run ios",
    "mobile:sync": "npx cap sync",
    "mobile:build:android": "npx cap build android",
    "mobile:build:ios": "npx cap build ios"
  }
}
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Build Android APK
  run: |
    npx cap sync android
    cd android
    ./gradlew assembleRelease

- name: Build iOS (macOS only)
  if: runner.os == 'macOS'
  run: |
    npx cap sync ios
    npx cap build ios
```

## Troubleshooting

### Common Issues
1. **Android SDK not found**: Set ANDROID_HOME environment variable
2. **iOS build fails**: Check Xcode version and signing configuration
3. **Capacitor sync issues**: Delete node_modules and reinstall
4. **PWA not working**: Check service worker registration and manifest

### Debug Commands
```bash
# Check Capacitor status
npx cap doctor

# List platforms
npx cap ls

# Check Android setup
npx cap doctor android

# Check iOS setup
npx cap doctor ios
```
