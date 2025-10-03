/**
 * OAMTM Capacitor Starter
 * Android/iOS native integration with Intents/URL Schemes
 */

class CapacitorStarter {
  constructor() {
    this.platform = this.detectPlatform();
    this.capacitor = this.detectCapacitor();
    this.initialize();
  }

  detectPlatform() {
    const ua = navigator.userAgent;
    return {
      android: /Android/i.test(ua),
      ios: /iPad|iPhone|iPod/.test(ua),
      web: !window.Capacitor,
      native: !!window.Capacitor
    };
  }

  detectCapacitor() {
    if (!window.Capacitor) {
      return {
        available: false,
        platform: 'web',
        plugins: {}
      };
    }

    return {
      available: true,
      platform: window.Capacitor.getPlatform(),
      plugins: {
        app: !!window.Capacitor.Plugins.App,
        camera: !!window.Capacitor.Plugins.Camera,
        contacts: !!window.Capacitor.Plugins.Contacts,
        device: !!window.Capacitor.Plugins.Device,
        geolocation: !!window.Capacitor.Plugins.Geolocation,
        localNotifications: !!window.Capacitor.Plugins.LocalNotifications,
        pushNotifications: !!window.Capacitor.Plugins.PushNotifications,
        share: !!window.Capacitor.Plugins.Share,
        statusBar: !!window.Capacitor.Plugins.StatusBar,
        splashScreen: !!window.Capacitor.Plugins.SplashScreen,
        keyboard: !!window.Capacitor.Plugins.Keyboard,
        haptics: !!window.Capacitor.Plugins.Haptics,
        filesystem: !!window.Capacitor.Plugins.Filesystem,
        network: !!window.Capacitor.Plugins.Network,
        clipboard: !!window.Capacitor.Plugins.Clipboard,
        browser: !!window.Capacitor.Plugins.Browser,
        toast: !!window.Capacitor.Plugins.Toast
      }
    };
  }

  async initialize() {
    if (this.capacitor.available) {
      await this.setupCapacitor();
    }
    this.setupIntents();
    this.setupURLSchemes();
  }

  async setupCapacitor() {
    // Configure StatusBar
    if (this.capacitor.plugins.statusBar) {
      await window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
      await window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#2c3e50' });
    }

    // Configure SplashScreen
    if (this.capacitor.plugins.splashScreen) {
      await window.Capacitor.Plugins.SplashScreen.hide();
    }

    // Configure Keyboard
    if (this.capacitor.plugins.keyboard) {
      await window.Capacitor.Plugins.Keyboard.setAccessoryBarVisible({ isVisible: false });
    }

    // Setup App State Listeners
    if (this.capacitor.plugins.app) {
      window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url);
        this.handleDeepLink(data.url);
      });
    }

    // Setup Network Listeners
    if (this.capacitor.plugins.network) {
      window.Capacitor.Plugins.Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
      });
    }
  }

  setupIntents() {
    // Android Intent handling
    if (this.platform.android && this.capacitor.available) {
      this.setupAndroidIntents();
    }
  }

  setupAndroidIntents() {
    // Dialer Intent
    this.intentHandlers = {
      'android.intent.action.DIAL': (data) => {
        const phoneNumber = data.phone || data.tel;
        if (phoneNumber) {
          this.openDialer(phoneNumber);
        }
      },
      
      'android.intent.action.SEND': (data) => {
        const text = data.text || data.subject;
        const url = data.url;
        if (text || url) {
          this.shareContent({ text, url });
        }
      },
      
      'android.intent.action.VIEW': (data) => {
        const url = data.url;
        if (url) {
          this.openURL(url);
        }
      }
    };
  }

  setupURLSchemes() {
    // iOS URL Scheme handling
    if (this.platform.ios && this.capacitor.available) {
      this.setupIOSURLSchemes();
    }

    // Web URL Scheme handling
    this.setupWebURLSchemes();
  }

  setupIOSURLSchemes() {
    this.urlSchemes = {
      'oamtm://': (params) => {
        this.handleOAMTMDeepLink(params);
      },
      'tel:': (params) => {
        this.openDialer(params.phone);
      },
      'sms:': (params) => {
        this.openSMS(params.phone, params.body);
      },
      'mailto:': (params) => {
        this.openEmail(params.email, params.subject, params.body);
      }
    };
  }

  setupWebURLSchemes() {
    // Handle web URL schemes
    window.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]');
      if (link) {
        e.preventDefault();
        this.handleWebURLScheme(link.href);
      }
    });
  }

  // Intent Handlers
  async openDialer(phoneNumber) {
    if (this.capacitor.available) {
      if (this.platform.android) {
        // Android Intent
        await window.Capacitor.Plugins.Browser.open({ url: `tel:${phoneNumber}` });
      } else if (this.platform.ios) {
        // iOS URL Scheme
        await window.Capacitor.Plugins.Browser.open({ url: `tel:${phoneNumber}` });
      }
    } else {
      // Web fallback
      window.location.href = `tel:${phoneNumber}`;
    }
  }

  async openSMS(phoneNumber, body = '') {
    if (this.capacitor.available) {
      if (this.platform.android) {
        // Android Intent
        await window.Capacitor.Plugins.Browser.open({ 
          url: `sms:${phoneNumber}?body=${encodeURIComponent(body)}` 
        });
      } else if (this.platform.ios) {
        // iOS URL Scheme
        await window.Capacitor.Plugins.Browser.open({ 
          url: `sms:${phoneNumber}?body=${encodeURIComponent(body)}` 
        });
      }
    } else {
      // Web fallback
      window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(body)}`;
    }
  }

  async openEmail(email, subject = '', body = '') {
    if (this.capacitor.available) {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (body) params.append('body', body);
      
      await window.Capacitor.Plugins.Browser.open({ 
        url: `mailto:${email}?${params.toString()}` 
      });
    } else {
      // Web fallback
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (body) params.append('body', body);
      window.location.href = `mailto:${email}?${params.toString()}`;
    }
  }

  async shareContent({ text, url, title }) {
    if (this.capacitor.available && this.capacitor.plugins.share) {
      await window.Capacitor.Plugins.Share.share({
        text: text,
        url: url,
        title: title
      });
    } else if (navigator.share) {
      // Web Share API
      await navigator.share({ text, url, title });
    } else {
      // Fallback to clipboard
      if (this.capacitor.available && this.capacitor.plugins.clipboard) {
        await window.Capacitor.Plugins.Clipboard.write({
          string: `${text} ${url}`.trim()
        });
        this.showToast('Content copied to clipboard');
      }
    }
  }

  async openURL(url) {
    if (this.capacitor.available && this.capacitor.plugins.browser) {
      await window.Capacitor.Plugins.Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  }

  // Deep Link Handling
  handleDeepLink(url) {
    try {
      const urlObj = new URL(url);
      const scheme = urlObj.protocol;
      const params = Object.fromEntries(urlObj.searchParams);
      
      if (this.urlSchemes[scheme]) {
        this.urlSchemes[scheme](params);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  handleOAMTMDeepLink(params) {
    // Handle OAMTM-specific deep links
    const action = params.action;
    
    switch (action) {
      case 'join':
        this.handleMeetingJoin(params.mid);
        break;
      case 'mission':
        this.handleMissionStart(params.mission);
        break;
      case 'tool':
        this.handleToolOpen(params.tool);
        break;
      default:
        console.log('Unknown OAMTM action:', action);
    }
  }

  handleMeetingJoin(meetingId) {
    // Navigate to meeting
    window.location.href = `/meeting/${meetingId}`;
  }

  handleMissionStart(missionId) {
    // Navigate to mission
    window.location.href = `/mission/${missionId}`;
  }

  handleToolOpen(toolId) {
    // Navigate to tool
    window.location.href = `/tools/${toolId}`;
  }

  handleWebURLScheme(url) {
    if (url.startsWith('tel:')) {
      const phoneNumber = url.replace('tel:', '');
      this.openDialer(phoneNumber);
    } else if (url.startsWith('sms:')) {
      const [phone, ...bodyParts] = url.replace('sms:', '').split('?body=');
      const body = bodyParts.join('?body=');
      this.openSMS(phone, body);
    } else if (url.startsWith('mailto:')) {
      const [email, ...queryParts] = url.replace('mailto:', '').split('?');
      const query = new URLSearchParams(queryParts.join('?'));
      this.openEmail(email, query.get('subject'), query.get('body'));
    }
  }

  // Utility Methods
  async showToast(message) {
    if (this.capacitor.available && this.capacitor.plugins.toast) {
      await window.Capacitor.Plugins.Toast.show({
        text: message,
        duration: 'short'
      });
    } else {
      // Web fallback
      console.log('Toast:', message);
    }
  }

  async vibrate(duration = 100) {
    if (this.capacitor.available && this.capacitor.plugins.haptics) {
      await window.Capacitor.Plugins.Haptics.vibrate({ duration });
    } else if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  // Launcher Mode (Android)
  async enableLauncherMode() {
    if (this.platform.android && this.capacitor.available) {
      // This would require native Android code
      // For now, just log the intent
      console.log('Launcher mode would be enabled here');
      this.showToast('Launcher mode activation requires native implementation');
    }
  }

  // Siri Shortcuts (iOS)
  async setupSiriShortcuts() {
    if (this.platform.ios && this.capacitor.available) {
      // This would require native iOS code
      // For now, just log the intent
      console.log('Siri shortcuts would be set up here');
      this.showToast('Siri shortcuts require native implementation');
    }
  }

  // Get platform capabilities
  getCapabilities() {
    return {
      platform: this.platform,
      capacitor: this.capacitor,
      intents: this.intentHandlers || {},
      urlSchemes: this.urlSchemes || {},
      features: {
        dialer: true,
        sms: true,
        email: true,
        share: this.capacitor.plugins.share || navigator.share,
        camera: this.capacitor.plugins.camera,
        contacts: this.capacitor.plugins.contacts,
        notifications: this.capacitor.plugins.localNotifications || this.capacitor.plugins.pushNotifications,
        haptics: this.capacitor.plugins.haptics || navigator.vibrate,
        clipboard: this.capacitor.plugins.clipboard,
        filesystem: this.capacitor.plugins.filesystem,
        network: this.capacitor.plugins.network
      }
    };
  }

  // Generate integration report
  generateReport() {
    const capabilities = this.getCapabilities();
    
    return {
      timestamp: new Date().toISOString(),
      platform: capabilities.platform,
      capacitor: capabilities.capacitor,
      features: capabilities.features,
      integration: {
        deepLinks: Object.keys(capabilities.urlSchemes).length,
        intents: Object.keys(capabilities.intents).length,
        plugins: Object.values(capabilities.features).filter(Boolean).length
      },
      status: 'ready'
    };
  }
}

// Export for use in other modules
export { CapacitorStarter };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const starter = new CapacitorStarter();
  
  console.log('📱 OAMTM Capacitor Starter');
  console.log('==========================');
  console.log('');
  
  // Wait for initialization
  setTimeout(() => {
    const report = starter.generateReport();
    console.log('Integration Report:');
    console.log(JSON.stringify(report, null, 2));
  }, 1000);
}
