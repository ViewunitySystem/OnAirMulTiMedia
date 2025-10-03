/**
 * WebTrit-Swipe Universal Integration
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Universal Swipe-Navigation für ALLE Module:
 * - Blueprints, Manifest, Regulatory, Audit Export
 * - Info Dashboard, Overlay, Test Client
 * - Touch + Keyboard + Voice Control
 */

class WebTritSwipe {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onSwipe = options.onSwipe || ((dir) => console.log('Swipe:', dir));
    this.threshold = options.threshold || 50;
    this.velocityThreshold = options.velocityThreshold || 0.3;
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.isDown = false;
    
    this.init();
  }
  
  init() {
    // Touch Events
    this.container.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
    this.container.addEventListener('touchmove', (e) => this.handleMove(e.touches[0]));
    this.container.addEventListener('touchend', (e) => this.handleEnd(e.changedTouches[0]));
    
    // Mouse Events (Desktop Fallback)
    this.container.addEventListener('mousedown', (e) => { this.isDown = true; this.handleStart(e); });
    this.container.addEventListener('mousemove', (e) => { if(this.isDown) this.handleMove(e); });
    this.container.addEventListener('mouseup', (e) => { this.isDown = false; this.handleEnd(e); });
    
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':  this.onSwipe('left'); break;
        case 'ArrowRight': this.onSwipe('right'); break;
        case 'ArrowUp':    this.onSwipe('up'); break;
        case 'ArrowDown':  this.onSwipe('down'); break;
      }
    });
    
    // Voice Control (Web Speech API)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.initVoiceControl();
    }
  }
  
  handleStart(point) {
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.startTime = Date.now();
  }
  
  handleMove(point) {
    // Visual feedback could be added here
  }
  
  handleEnd(point) {
    const endX = point.clientX;
    const endY = point.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Velocity = distance / time
    const velocity = Math.max(absX, absY) / deltaTime;
    
    // Check threshold
    if (Math.max(absX, absY) < this.threshold) return;
    if (velocity < this.velocityThreshold) return;
    
    // Determine direction
    let direction = null;
    
    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    if (direction) {
      this.onSwipe(direction);
      this.showSwipeFeedback(direction);
    }
  }
  
  showSwipeFeedback(direction) {
    const arrows = {
      'left': '←',
      'right': '→',
      'up': '↑',
      'down': '↓'
    };
    
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
      color: #3b82f6;
      pointer-events: none;
      z-index: 9999;
      animation: swipe-feedback 0.3s ease-out;
    `;
    feedback.textContent = arrows[direction];
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes swipe-feedback {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 300);
  }
  
  initVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'de-DE';
    
    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase();
      
      if (command.includes('links')) this.onSwipe('left');
      if (command.includes('rechts')) this.onSwipe('right');
      if (command.includes('hoch') || command.includes('oben')) this.onSwipe('up');
      if (command.includes('runter') || command.includes('unten')) this.onSwipe('down');
      if (command.includes('zurück')) this.onSwipe('left');
      if (command.includes('weiter')) this.onSwipe('right');
    };
    
    // Start listening (optional - could be activated by button)
    // recognition.start();
    
    // Store for external control
    this.voiceRecognition = recognition;
  }
  
  destroy() {
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
  }
}

/**
 * WebTrit-Swipe Module Navigator
 * Swipe zwischen verschiedenen Modulen/Seiten
 */
class WebTritModuleNavigator {
  constructor() {
    this.modules = [
      { id: 'info', name: 'Info Dashboard', url: '/info.html', icon: '📊' },
      { id: 'blueprints', name: 'Blueprints', url: '/blueprints.html', icon: '📐' },
      { id: 'manifest', name: 'Manifest', url: '/manifest.html', icon: '📜' },
      { id: 'regulatory', name: 'Regulatory', url: '/regulatory.html', icon: '⚖️' },
      { id: 'audit-export', name: 'Audit Export', url: '/audit-export.html', icon: '📋' },
      { id: 'overlay', name: 'Overlay', url: '/overlay.html', icon: '🔍' },
      { id: 'client', name: 'Test Client', url: '/client.html', icon: '🧪' }
    ];
    
    this.currentIndex = this.getCurrentIndex();
    this.init();
  }
  
  getCurrentIndex() {
    const currentPath = window.location.pathname;
    const index = this.modules.findIndex(m => m.url === currentPath);
    return index >= 0 ? index : 0;
  }
  
  init() {
    const swipe = new WebTritSwipe({
      onSwipe: (direction) => {
        switch(direction) {
          case 'left':
            this.next();
            break;
          case 'right':
            this.previous();
            break;
          case 'up':
            this.showModuleOverview();
            break;
          case 'down':
            // Refresh current page
            window.location.reload();
            break;
        }
      }
    });
    
    this.createNavigationHUD();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.modules.length;
    this.navigate();
  }
  
  previous() {
    this.currentIndex = (this.currentIndex - 1 + this.modules.length) % this.modules.length;
    this.navigate();
  }
  
  navigate() {
    const module = this.modules[this.currentIndex];
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
  
  showModuleOverview() {
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
    
    this.modules.forEach((module, idx) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #111827;
        border: 1px solid #1f2a52;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        ${idx === this.currentIndex ? 'border-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);' : ''}
      `;
      
      card.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${module.icon}</div>
        <div style="font-size: 1.2rem; color: #e5e7eb; font-weight: 600;">${module.name}</div>
      `;
      
      card.addEventListener('click', () => {
        this.currentIndex = idx;
        this.navigate();
        overlay.remove();
      });
      
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px) scale(1.05)';
        card.style.borderColor = '#3b82f6';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
        if (idx !== this.currentIndex) card.style.borderColor = '#1f2a52';
      });
      
      overlay.appendChild(card);
    });
    
    // Close on click outside or Escape
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
    
    document.body.appendChild(overlay);
  }
  
  createNavigationHUD() {
    const hud = document.createElement('div');
    hud.id = 'webtrit-hud';
    hud.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid #1f2a52;
      border-radius: 12px;
      padding: 12px;
      z-index: 9997;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: #9ca3af;
      backdrop-filter: blur(8px);
    `;
    
    const current = this.modules[this.currentIndex];
    hud.innerHTML = `
      <span style="color: #3b82f6; font-size: 1.5rem;">${current.icon}</span>
      <div>
        <div style="color: #e5e7eb; font-weight: 600;">${current.name}</div>
        <div style="font-size: 10px;">← Prev | Next → | ↑ Menu | ↓ Refresh</div>
      </div>
      <button id="webtrit-menu-btn" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">☰</button>
    `;
    
    document.body.appendChild(hud);
    
    document.getElementById('webtrit-menu-btn').addEventListener('click', () => {
      this.showModuleOverview();
    });
  }
}

// Global Instance
if (typeof window !== 'undefined') {
  window.WebTritSwipe = WebTritSwipe;
  window.WebTritModuleNavigator = WebTritModuleNavigator;
  
  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new WebTritModuleNavigator();
    });
  } else {
    new WebTritModuleNavigator();
  }
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slide-in-left {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slide-in-up {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slide-in-down {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

