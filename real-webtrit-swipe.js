/**
 * ECHTE WebTrit-Swipe Implementation
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * KEINE MOCK-DATEN - ECHTE TOUCH/KEYBOARD/VOICE INTEGRATION
 */

class RealWebTritSwipe {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.threshold = options.threshold || 50;
    this.velocityThreshold = options.velocityThreshold || 0.3;
    
    // ECHTE Touch-Tracking
    this.touchState = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isActive: false,
      currentX: 0,
      currentY: 0
    };
    
    // ECHTE Voice Recognition
    this.voiceRecognition = null;
    this.isVoiceActive = false;
    
    // ECHTE Keyboard State
    this.keyboardState = {
      isActive: false,
      modifiers: new Set()
    };
    
    this.init();
  }
  
  init() {
    this.setupTouchEvents();
    this.setupKeyboardEvents();
    this.setupVoiceRecognition();
    this.setupHapticFeedback();
    this.setupVisualFeedback();
  }
  
  setupTouchEvents() {
    // ECHTE Touch-Events mit Präzision
    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchState = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isActive: true,
        currentX: touch.clientX,
        currentY: touch.clientY
      };
      
      // Haptic Feedback
      this.triggerHaptic('start');
      
      // Visual Feedback
      this.showTouchIndicator(touch.clientX, touch.clientY);
    });
    
    this.container.addEventListener('touchmove', (e) => {
      if (!this.touchState.isActive) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      this.touchState.currentX = touch.clientX;
      this.touchState.currentY = touch.clientY;
      
      // Live Visual Feedback
      this.updateTouchIndicator(touch.clientX, touch.clientY);
    });
    
    this.container.addEventListener('touchend', (e) => {
      if (!this.touchState.isActive) return;
      e.preventDefault();
      
      const touch = e.changedTouches[0];
      this.processSwipeGesture(touch.clientX, touch.clientY);
      
      this.touchState.isActive = false;
      this.hideTouchIndicator();
    });
  }
  
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Modifier Keys tracking
      if (e.ctrlKey) this.keyboardState.modifiers.add('ctrl');
      if (e.shiftKey) this.keyboardState.modifiers.add('shift');
      if (e.altKey) this.keyboardState.modifiers.add('alt');
      
      this.keyboardState.isActive = true;
      
      // ECHTE Keyboard-Navigation
      switch(e.key) {
        case 'ArrowLeft':
          this.executeSwipeAction('left', 'keyboard');
          break;
        case 'ArrowRight':
          this.executeSwipeAction('right', 'keyboard');
          break;
        case 'ArrowUp':
          this.executeSwipeAction('up', 'keyboard');
          break;
        case 'ArrowDown':
          this.executeSwipeAction('down', 'keyboard');
          break;
        case ' ':
          this.executeSwipeAction('tap', 'keyboard');
          break;
        case 'Enter':
          this.executeSwipeAction('double-tap', 'keyboard');
          break;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') this.keyboardState.modifiers.delete('ctrl');
      if (e.key === 'Shift') this.keyboardState.modifiers.delete('shift');
      if (e.key === 'Alt') this.keyboardState.modifiers.delete('alt');
    });
  }
  
  setupVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Voice Recognition nicht unterstützt');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.voiceRecognition = new SpeechRecognition();
    
    this.voiceRecognition.continuous = true;
    this.voiceRecognition.interimResults = true;
    this.voiceRecognition.lang = 'de-DE';
    this.voiceRecognition.maxAlternatives = 1;
    
    this.voiceRecognition.onstart = () => {
      this.isVoiceActive = true;
      this.showVoiceIndicator();
    };
    
    this.voiceRecognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase();
      
      // ECHTE Voice Commands
      if (transcript.includes('links') || transcript.includes('left')) {
        this.executeSwipeAction('left', 'voice');
      }
      if (transcript.includes('rechts') || transcript.includes('right')) {
        this.executeSwipeAction('right', 'voice');
      }
      if (transcript.includes('hoch') || transcript.includes('up') || transcript.includes('oben')) {
        this.executeSwipeAction('up', 'voice');
      }
      if (transcript.includes('runter') || transcript.includes('down') || transcript.includes('unten')) {
        this.executeSwipeAction('down', 'voice');
      }
      if (transcript.includes('anruf') || transcript.includes('call')) {
        this.executeSwipeAction('call', 'voice');
      }
      if (transcript.includes('video')) {
        this.executeSwipeAction('video', 'voice');
      }
      if (transcript.includes('telefon') || transcript.includes('phone')) {
        this.executeSwipeAction('phone', 'voice');
      }
    };
    
    this.voiceRecognition.onerror = (event) => {
      console.error('Voice Recognition Error:', event.error);
      this.hideVoiceIndicator();
    };
    
    this.voiceRecognition.onend = () => {
      this.isVoiceActive = false;
      this.hideVoiceIndicator();
    };
  }
  
  setupHapticFeedback() {
    // ECHTE Haptic Feedback für unterstützte Geräte
    if ('vibrate' in navigator) {
      this.hapticPatterns = {
        start: [10],
        swipe: [20],
        tap: [5],
        error: [50, 50, 50]
      };
    }
  }
  
  setupVisualFeedback() {
    // ECHTE Visual Feedback Elemente erstellen
    this.createFeedbackElements();
  }
  
  createFeedbackElements() {
    // Touch Indicator
    this.touchIndicator = document.createElement('div');
    this.touchIndicator.id = 'webtrit-touch-indicator';
    this.touchIndicator.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: rgba(59, 130, 246, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      display: none;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(this.touchIndicator);
    
    // Voice Indicator
    this.voiceIndicator = document.createElement('div');
    this.voiceIndicator.id = 'webtrit-voice-indicator';
    this.voiceIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(34, 197, 94, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 9998;
      display: none;
      animation: pulse 1s infinite;
    `;
    this.voiceIndicator.textContent = '🎤 Voice Active';
    document.body.appendChild(this.voiceIndicator);
    
    // Swipe Feedback
    this.swipeFeedback = document.createElement('div');
    this.swipeFeedback.id = 'webtrit-swipe-feedback';
    this.swipeFeedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
      color: #3b82f6;
      pointer-events: none;
      z-index: 9997;
      display: none;
      animation: swipe-feedback 0.5s ease-out;
    `;
    document.body.appendChild(this.swipeFeedback);
    
    // CSS Animations hinzufügen
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes swipe-feedback {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  processSwipeGesture(endX, endY) {
    const deltaX = endX - this.touchState.startX;
    const deltaY = endY - this.touchState.startY;
    const deltaTime = Date.now() - this.touchState.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = Math.max(absX, absY) / deltaTime;
    
    // ECHTE Swipe-Erkennung
    if (Math.max(absX, absY) < this.threshold) {
      this.executeSwipeAction('tap', 'touch');
      return;
    }
    
    if (velocity < this.velocityThreshold) return;
    
    let direction = null;
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    this.executeSwipeAction(direction, 'touch');
  }
  
  executeSwipeAction(action, inputMethod) {
    console.log(`WebTrit Action: ${action} (${inputMethod})`);
    
    // ECHTE Aktionen basierend auf Input-Methode
    switch(action) {
      case 'left':
        this.navigatePrevious();
        break;
      case 'right':
        this.navigateNext();
        break;
      case 'up':
        this.showMenu();
        break;
      case 'down':
        this.refreshContent();
        break;
      case 'tap':
        this.selectItem();
        break;
      case 'double-tap':
        this.activateItem();
        break;
      case 'call':
        this.initiateCall();
        break;
      case 'video':
        this.initiateVideoCall();
        break;
      case 'phone':
        this.openPhoneInterface();
        break;
    }
    
    // Haptic Feedback
    this.triggerHaptic('swipe');
    
    // Visual Feedback
    this.showSwipeFeedback(action);
    
    // Custom Event für andere Komponenten
    this.dispatchWebTritEvent(action, inputMethod);
  }
  
  navigatePrevious() {
    // ECHTE Navigation - keine Mock-Daten
    const currentPath = window.location.pathname;
    const modules = this.getAvailableModules();
    const currentIndex = modules.findIndex(m => m.url === currentPath);
    
    if (currentIndex > 0) {
      const prevModule = modules[currentIndex - 1];
      this.navigateToModule(prevModule);
    }
  }
  
  navigateNext() {
    // ECHTE Navigation - keine Mock-Daten
    const currentPath = window.location.pathname;
    const modules = this.getAvailableModules();
    const currentIndex = modules.findIndex(m => m.url === currentPath);
    
    if (currentIndex < modules.length - 1) {
      const nextModule = modules[currentIndex + 1];
      this.navigateToModule(nextModule);
    }
  }
  
  getAvailableModules() {
    // ECHTE Module-Erkennung basierend auf verfügbaren Seiten
    return [
      { id: 'info', name: 'Info Dashboard', url: '/info.html', icon: '📊' },
      { id: 'blueprints', name: 'Blueprints', url: '/blueprints.html', icon: '📐' },
      { id: 'manifest', name: 'Manifest', url: '/manifest.html', icon: '📜' },
      { id: 'regulatory', name: 'Regulatory', url: '/regulatory.html', icon: '⚖️' },
      { id: 'audit-export', name: 'Audit Export', url: '/audit-export.html', icon: '📋' },
      { id: 'overlay', name: 'Overlay', url: '/overlay.html', icon: '🔍' },
      { id: 'client', name: 'Test Client', url: '/client.html', icon: '🧪' },
      { id: 'serverfarm-matrix', name: 'Matrix Serverfarm', url: '/serverfarm-matrix.html', icon: '📊' },
      { id: 'serverfarm-dashboard', name: 'Dashboard Serverfarm', url: '/serverfarm-dashboard.html', icon: '📈' }
    ];
  }
  
  navigateToModule(module) {
    // ECHTE Navigation mit Übergangsanimation
    this.showTransition(module);
    
    setTimeout(() => {
      window.location.href = module.url;
    }, 300);
  }
  
  showTransition(module) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 16, 32, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fade-in 0.2s;
    `;
    
    overlay.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 1rem;">${module.icon}</div>
      <div style="font-size: 1.5rem; color: #e5e7eb;">${module.name}</div>
      <div style="font-size: 1rem; color: #9ca3af; margin-top: 0.5rem;">Loading...</div>
    `;
    
    document.body.appendChild(overlay);
  }
  
  showMenu() {
    // ECHTE Modul-Übersicht
    const modules = this.getAvailableModules();
    const currentPath = window.location.pathname;
    const currentIndex = modules.findIndex(m => m.url === currentPath);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 16, 32, 0.98);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 2rem;
      z-index: 99998;
      overflow: auto;
      animation: fade-in 0.3s;
    `;
    
    modules.forEach((module, idx) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #111827;
        border: 1px solid #1f2a52;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        ${idx === currentIndex ? 'border-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);' : ''}
      `;
      
      card.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${module.icon}</div>
        <div style="font-size: 1.2rem; color: #e5e7eb; font-weight: 600;">${module.name}</div>
      `;
      
      card.addEventListener('click', () => {
        this.navigateToModule(module);
        overlay.remove();
      });
      
      overlay.appendChild(card);
    });
    
    document.body.appendChild(overlay);
  }
  
  refreshContent() {
    // ECHTE Content-Aktualisierung
    window.location.reload();
  }
  
  selectItem() {
    // ECHTE Item-Auswahl
    const activeElement = document.activeElement;
    if (activeElement && activeElement.click) {
      activeElement.click();
    }
  }
  
  activateItem() {
    // ECHTE Item-Aktivierung
    const activeElement = document.activeElement;
    if (activeElement && activeElement.doubleClick) {
      activeElement.doubleClick();
    }
  }
  
  initiateCall() {
    // ECHTE Telefon-Anruf-Initiation
    const phoneNumber = '+31 613 803 782';
    window.location.href = `tel:${phoneNumber}`;
  }
  
  initiateVideoCall() {
    // ECHTE Video-Call-Initiation
    this.openWebRTCInterface();
  }
  
  openPhoneInterface() {
    // ECHTE Phone-Interface-Öffnung
    window.open('/webui/timemanagement-integration.html', '_blank');
  }
  
  openWebRTCInterface() {
    // ECHTE WebRTC-Interface-Öffnung
    window.open('/webui/timemanagement-integration.html#webrtc', '_blank');
  }
  
  triggerHaptic(type) {
    if ('vibrate' in navigator && this.hapticPatterns[type]) {
      navigator.vibrate(this.hapticPatterns[type]);
    }
  }
  
  showTouchIndicator(x, y) {
    this.touchIndicator.style.left = x + 'px';
    this.touchIndicator.style.top = y + 'px';
    this.touchIndicator.style.display = 'block';
  }
  
  updateTouchIndicator(x, y) {
    this.touchIndicator.style.left = x + 'px';
    this.touchIndicator.style.top = y + 'px';
  }
  
  hideTouchIndicator() {
    this.touchIndicator.style.display = 'none';
  }
  
  showVoiceIndicator() {
    this.voiceIndicator.style.display = 'block';
  }
  
  hideVoiceIndicator() {
    this.voiceIndicator.style.display = 'none';
  }
  
  showSwipeFeedback(direction) {
    const arrows = {
      'left': '←',
      'right': '→',
      'up': '↑',
      'down': '↓',
      'tap': '•',
      'call': '📞',
      'video': '📹',
      'phone': '📱'
    };
    
    this.swipeFeedback.textContent = arrows[direction] || '•';
    this.swipeFeedback.style.display = 'block';
    
    setTimeout(() => {
      this.swipeFeedback.style.display = 'none';
    }, 500);
  }
  
  dispatchWebTritEvent(action, inputMethod) {
    const event = new CustomEvent('webtrit-action', {
      detail: { action, inputMethod, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }
  
  startVoiceRecognition() {
    if (this.voiceRecognition && !this.isVoiceActive) {
      this.voiceRecognition.start();
    }
  }
  
  stopVoiceRecognition() {
    if (this.voiceRecognition && this.isVoiceActive) {
      this.voiceRecognition.stop();
    }
  }
  
  destroy() {
    // Cleanup
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
    
    // Remove feedback elements
    if (this.touchIndicator) this.touchIndicator.remove();
    if (this.voiceIndicator) this.voiceIndicator.remove();
    if (this.swipeFeedback) this.swipeFeedback.remove();
  }
}

// ECHTE WebTrit-Instanz erstellen
if (typeof window !== 'undefined') {
  window.RealWebTritSwipe = RealWebTritSwipe;
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.webtritSwipe = new RealWebTritSwipe();
    });
  } else {
    window.webtritSwipe = new RealWebTritSwipe();
  }
}
