/**
 * OAMTM Feature Detection System
 * Comprehensive OS capability detection for Web/PWA/Android/iOS/Desktop
 */

class FeatureDetector {
  constructor() {
    this.capabilities = {};
    this.platform = this.detectPlatform();
    this.initialize();
  }

  detectPlatform() {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isMobile = isAndroid || isIOS;
    const isDesktop = !isMobile && (window.navigator.platform.includes('Win') ||
      window.navigator.platform.includes('Mac') ||
      window.navigator.platform.includes('Linux'));

    return {
      android: isAndroid,
      ios: isIOS,
      mobile: isMobile,
      desktop: isDesktop,
      web: true,
      pwa: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  async initialize() {
    try {
      await this.detectWebAPIs();
      await this.detectNativeCapabilities();
      await this.detectOSFeatures();
      this.generateCapabilityMatrix();
    } catch (error) {
      console.warn('FeatureDetector initialization failed:', error);
      // Fallback to basic capabilities
      this.capabilities = this.getFallbackCapabilities();
      this.generateCapabilityMatrix();
    }
  }

  getFallbackCapabilities() {
    return {
      web: {
        share: true,
        contacts: false,
        webRTC: true,
        camera: true,
        microphone: true,
        screenShare: false,
        barcodeDetector: false,
        fileSystem: false,
        indexedDB: true,
        localStorage: true,
        sessionStorage: true,
        notifications: true,
        pushManager: true,
        serviceWorker: true,
        geolocation: true,
        vibration: true,
        battery: false,
        deviceOrientation: true,
        deviceMotion: true,
        webAssembly: true,
        webGL: true,
        webGL2: true,
        webXR: false,
        installPrompt: false,
        standalone: false,
        backgroundSync: false
      },
      native: {
        capacitor: false,
        cordova: false,
        camera: false,
        contacts: false,
        device: false,
        geolocation: false,
        localNotifications: false,
        pushNotifications: false,
        share: false,
        statusBar: false,
        splashScreen: false,
        keyboard: false,
        haptics: false,
        filesystem: false,
        network: false,
        clipboard: false,
        browser: false,
        app: false,
        toast: false
      },
      os: {
        android: {
          intents: false,
          launcher: false,
          backgroundServices: false,
          notificationChannels: false,
          adaptiveIcons: false,
          shortcuts: false
        },
        ios: {
          siriShortcuts: false,
          appClips: false,
          urlSchemes: false,
          backgroundAppRefresh: false,
          pushNotifications: false,
          hapticFeedback: false
        },
        desktop: {
          systemTray: false,
          autoUpdater: false,
          codeSigning: false,
          fileAssociations: false,
          globalShortcuts: false,
          powerMonitor: false
        }
      }
    };
  }

  async detectWebAPIs() {
    this.capabilities.web = {
      // Communication
      share: !!navigator.share,
      contacts: 'contacts' in navigator,
      webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),

      // Media
      camera: !!(navigator.mediaDevices?.getUserMedia),
      microphone: !!(navigator.mediaDevices?.getUserMedia),
      screenShare: 'getDisplayMedia' in navigator.mediaDevices,
      barcodeDetector: 'BarcodeDetector' in window,

      // Storage
      fileSystem: 'showOpenFilePicker' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,

      // Notifications
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      serviceWorker: 'serviceWorker' in navigator,

      // Location
      geolocation: 'geolocation' in navigator,

      // Device APIs
      vibration: 'vibrate' in navigator,
      battery: 'getBattery' in navigator,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      deviceMotion: 'DeviceMotionEvent' in window,

      // Advanced
      webAssembly: 'WebAssembly' in window,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webGL2: !!document.createElement('canvas').getContext('webgl2'),
      webXR: 'xr' in navigator,

      // PWA Features
      installPrompt: 'onbeforeinstallprompt' in window,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  async detectNativeCapabilities() {
    // Check for Capacitor/Cordova
    this.capabilities.native = {
      capacitor: !!(window.Capacitor),
      cordova: !!(window.cordova),

      // Native plugins (if available)
      camera: !!(window.Capacitor?.Plugins?.Camera),
      contacts: !!(window.Capacitor?.Plugins?.Contacts),
      device: !!(window.Capacitor?.Plugins?.Device),
      geolocation: !!(window.Capacitor?.Plugins?.Geolocation),
      localNotifications: !!(window.Capacitor?.Plugins?.LocalNotifications),
      pushNotifications: !!(window.Capacitor?.Plugins?.PushNotifications),
      share: !!(window.Capacitor?.Plugins?.Share),
      statusBar: !!(window.Capacitor?.Plugins?.StatusBar),
      splashScreen: !!(window.Capacitor?.Plugins?.SplashScreen),
      keyboard: !!(window.Capacitor?.Plugins?.Keyboard),
      haptics: !!(window.Capacitor?.Plugins?.Haptics),
      filesystem: !!(window.Capacitor?.Plugins?.Filesystem),
      network: !!(window.Capacitor?.Plugins?.Network),
      clipboard: !!(window.Capacitor?.Plugins?.Clipboard),
      browser: !!(window.Capacitor?.Plugins?.Browser),
      app: !!(window.Capacitor?.Plugins?.App),
      toast: !!(window.Capacitor?.Plugins?.Toast)
    };
  }

  async detectOSFeatures() {
    this.capabilities.os = {
      // Android specific
      android: {
        intents: this.platform.android,
        launcher: this.platform.android,
        backgroundServices: this.platform.android,
        notificationChannels: this.platform.android,
        adaptiveIcons: this.platform.android,
        shortcuts: this.platform.android
      },

      // iOS specific  
      ios: {
        siriShortcuts: this.platform.ios,
        appClips: this.platform.ios,
        urlSchemes: this.platform.ios,
        backgroundAppRefresh: this.platform.ios,
        pushNotifications: this.platform.ios,
        hapticFeedback: this.platform.ios
      },

      // Desktop specific
      desktop: {
        systemTray: this.platform.desktop,
        autoUpdater: this.platform.desktop,
        codeSigning: this.platform.desktop,
        fileAssociations: this.platform.desktop,
        globalShortcuts: this.platform.desktop,
        powerMonitor: this.platform.desktop
      }
    };
  }

  generateCapabilityMatrix() {
    this.matrix = {
      // Communication Matrix
      communication: {
        telephony: this.capabilities.web.share || this.capabilities.native.share,
        sms: this.capabilities.web.share || this.capabilities.native.share,
        email: this.capabilities.web.share,
        messaging: this.capabilities.web.webRTC || this.capabilities.native.pushNotifications,
        videoCall: this.capabilities.web.webRTC && this.capabilities.web.camera,
        voiceCall: this.capabilities.web.webRTC && this.capabilities.web.microphone
      },

      // Media Matrix
      media: {
        camera: this.capabilities.web.camera || this.capabilities.native.camera,
        microphone: this.capabilities.web.microphone || this.capabilities.native.device,
        screenRecord: this.capabilities.web.screenShare,
        qrScan: this.capabilities.web.barcodeDetector || this.capabilities.native.camera,
        fileAccess: this.capabilities.web.fileSystem || this.capabilities.native.filesystem,
        gallery: this.capabilities.web.fileSystem || this.capabilities.native.filesystem
      },

      // Data Matrix
      data: {
        contacts: this.capabilities.web.contacts || this.capabilities.native.contacts,
        calendar: this.capabilities.web.fileSystem, // Fallback to file import
        location: this.capabilities.web.geolocation || this.capabilities.native.geolocation,
        storage: this.capabilities.web.indexedDB || this.capabilities.native.filesystem,
        sync: this.capabilities.web.serviceWorker || this.capabilities.native.network,
        backup: this.capabilities.web.indexedDB || this.capabilities.native.filesystem
      },

      // System Matrix
      system: {
        notifications: this.capabilities.web.notifications || this.capabilities.native.localNotifications,
        background: this.capabilities.web.serviceWorker || this.capabilities.native.app,
        offline: this.capabilities.web.serviceWorker || this.capabilities.native.filesystem,
        install: this.capabilities.web.installPrompt || this.capabilities.native.app,
        updates: this.capabilities.native.app,
        launcher: this.capabilities.os.android.launcher || this.capabilities.os.ios.siriShortcuts
      }
    };
  }

  // Get capability status
  getCapability(category, feature) {
    return this.matrix[category]?.[feature] || false;
  }

  // Get all capabilities for a category
  getCategoryCapabilities(category) {
    return this.matrix[category] || {};
  }

  // Get platform-specific capabilities
  getPlatformCapabilities() {
    return this.capabilities;
  }

  // Generate capability report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      capabilities: this.capabilities,
      matrix: this.matrix,
      summary: {
        total: Object.keys(this.matrix).length,
        available: Object.values(this.matrix).reduce((acc, category) => {
          return acc + Object.values(category).filter(Boolean).length;
        }, 0),
        unavailable: Object.values(this.matrix).reduce((acc, category) => {
          return acc + Object.values(category).filter(cap => !cap).length;
        }, 0)
      }
    };

    return report;
  }

  // Export capabilities for consent management
  exportForConsent() {
    const consentData = {
      platform: this.platform,
      availableCapabilities: {},
      requiredPermissions: [],
      optionalPermissions: []
    };

    // Map capabilities to permissions
    Object.entries(this.matrix).forEach(([category, features]) => {
      Object.entries(features).forEach(([feature, available]) => {
        if (available) {
          consentData.availableCapabilities[`${category}.${feature}`] = true;

          // Map to permission requirements
          switch (feature) {
            case 'camera':
              consentData.requiredPermissions.push('camera');
              break;
            case 'microphone':
              consentData.requiredPermissions.push('microphone');
              break;
            case 'location':
              consentData.requiredPermissions.push('location');
              break;
            case 'contacts':
              consentData.requiredPermissions.push('contacts');
              break;
            case 'notifications':
              consentData.optionalPermissions.push('notifications');
              break;
          }
        }
      });
    });

    return consentData;
  }
}

// Export for use in other modules
export { FeatureDetector };

