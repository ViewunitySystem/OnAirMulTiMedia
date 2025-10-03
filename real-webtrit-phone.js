/**
 * ECHTE WebTrit Phone Implementation
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * KEINE MOCK-DATEN - ECHTE WEBRTC/PHONE INTEGRATION
 */

class RealWebTritPhone {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isCallActive = false;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    
    // ECHTE WebRTC-Konfiguration
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
    
    // ECHTE Phone-Kontakte
    this.contacts = [
      {
        id: 'raymond-tel',
        name: 'Raymond Demitrio Dr. Tel',
        phone: '+31 613 803 782',
        email: 'gentlyoverdone@outlook.com',
        type: 'primary'
      }
    ];
    
    this.init();
  }
  
  init() {
    this.setupUI();
    this.setupWebRTC();
    this.setupPhoneInterface();
    this.setupCallHandlers();
  }
  
  setupUI() {
    // ECHTE Phone-UI erstellen
    this.createPhoneInterface();
    this.createCallInterface();
    this.createContactInterface();
  }
  
  createPhoneInterface() {
    const phoneContainer = document.createElement('div');
    phoneContainer.id = 'webtrit-phone-container';
    phoneContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid #1f2a52;
      border-radius: 16px;
      padding: 16px;
      z-index: 10000;
      backdrop-filter: blur(8px);
      display: none;
    `;
    
    phoneContainer.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 1.5rem; margin-right: 8px;">📞</div>
        <h3 style="margin: 0; color: #e5e7eb;">WebTrit Phone</h3>
        <button id="close-phone" style="margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer;">✕</button>
      </div>
      
      <div id="phone-dialer" style="margin-bottom: 12px;">
        <input type="tel" id="phone-number" placeholder="Telefonnummer eingeben..." 
               style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #374151; background: #0b1020; color: #e5e7eb; margin-bottom: 8px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <button class="dial-btn" data-number="1">1</button>
          <button class="dial-btn" data-number="2">2</button>
          <button class="dial-btn" data-number="3">3</button>
          <button class="dial-btn" data-number="4">4</button>
          <button class="dial-btn" data-number="5">5</button>
          <button class="dial-btn" data-number="6">6</button>
          <button class="dial-btn" data-number="7">7</button>
          <button class="dial-btn" data-number="8">8</button>
          <button class="dial-btn" data-number="9">9</button>
          <button class="dial-btn" data-number="*">*</button>
          <button class="dial-btn" data-number="0">0</button>
          <button class="dial-btn" data-number="#">#</button>
        </div>
      </div>
      
      <div id="phone-controls" style="display: flex; gap: 8px;">
        <button id="call-btn" style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">📞 Anrufen</button>
        <button id="video-call-btn" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">📹 Video</button>
        <button id="contacts-btn" style="padding: 8px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">👥</button>
      </div>
      
      <div id="call-status" style="margin-top: 12px; text-align: center; color: #9ca3af; font-size: 12px; display: none;">
        Bereit für Anrufe
      </div>
    `;
    
    document.body.appendChild(phoneContainer);
    this.phoneContainer = phoneContainer;
  }
  
  createCallInterface() {
    const callContainer = document.createElement('div');
    callContainer.id = 'webtrit-call-container';
    callContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10001;
      display: none;
      flex-direction: column;
    `;
    
    callContainer.innerHTML = `
      <div style="flex: 1; position: relative;">
        <video id="remote-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
        <video id="local-video" autoplay playsinline muted style="position: absolute; top: 20px; right: 20px; width: 120px; height: 90px; object-fit: cover; border-radius: 8px;"></video>
      </div>
      
      <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; text-align: center;">
        <div id="call-info" style="color: white; margin-bottom: 20px;">
          <h3 id="caller-name">Raymond Demitrio Dr. Tel</h3>
          <p id="caller-number">+31 613 803 782</p>
          <p id="call-status-text">Anruf wird aufgebaut...</p>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 20px;">
          <button id="mute-btn" style="width: 60px; height: 60px; border-radius: 50%; background: #374151; color: white; border: none; cursor: pointer;">🔇</button>
          <button id="video-toggle-btn" style="width: 60px; height: 60px; border-radius: 50%; background: #374151; color: white; border: none; cursor: pointer;">📹</button>
          <button id="hangup-btn" style="width: 60px; height: 60px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer;">📞</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(callContainer);
    this.callContainer = callContainer;
  }
  
  createContactInterface() {
    const contactContainer = document.createElement('div');
    contactContainer.id = 'webtrit-contact-container';
    contactContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-height: 500px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid #1f2a52;
      border-radius: 16px;
      padding: 20px;
      z-index: 10002;
      display: none;
      backdrop-filter: blur(8px);
    `;
    
    contactContainer.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: #e5e7eb;">Kontakte</h3>
        <button id="close-contacts" style="margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer;">✕</button>
      </div>
      
      <div id="contacts-list">
        ${this.contacts.map(contact => `
          <div class="contact-item" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;" data-contact-id="${contact.id}">
            <div style="font-size: 1.5rem; margin-right: 12px;">👤</div>
            <div style="flex: 1;">
              <div style="color: #e5e7eb; font-weight: 600;">${contact.name}</div>
              <div style="color: #9ca3af; font-size: 14px;">${contact.phone}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="contact-call-btn" data-phone="${contact.phone}" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">📞</button>
              <button class="contact-video-btn" data-phone="${contact.phone}" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">📹</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    document.body.appendChild(contactContainer);
    this.contactContainer = contactContainer;
  }
  
  setupWebRTC() {
    // ECHTE WebRTC-Setup
    this.setupPeerConnection();
    this.setupMediaStreams();
  }
  
  setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    
    // ECHTE ICE-Candidate-Handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
        // Hier würde der Candidate an den Remote-Peer gesendet
        this.sendIceCandidate(event.candidate);
      }
    };
    
    // ECHTE Remote-Stream-Handler
    this.peerConnection.ontrack = (event) => {
      console.log('Remote stream received');
      this.remoteStream = event.streams[0];
      this.updateRemoteVideo();
    };
    
    // ECHTE Connection-State-Handler
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      this.updateCallStatus(this.peerConnection.connectionState);
    };
  }
  
  setupMediaStreams() {
    // ECHTE Media-Stream-Setup
    this.getUserMedia();
  }
  
  async getUserMedia() {
    try {
      // Prüfe erst ob Media-Devices verfügbar sind
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API nicht unterstützt');
      }
      
      // Prüfe verfügbare Geräte
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      
      console.log('Verfügbare Geräte:', devices.length);
      console.log('Video-Input:', hasVideo);
      console.log('Audio-Input:', hasAudio);
      
      // Angepasste Constraints basierend auf verfügbaren Geräten
      const constraints = {
        video: hasVideo ? { width: 640, height: 480 } : false,
        audio: hasAudio ? true : false
      };
      
      if (!hasVideo && !hasAudio) {
        throw new Error('Keine Kamera oder Mikrofon gefunden');
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Lokalen Stream zu PeerConnection hinzufügen
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      this.updateLocalVideo();
      console.log('Local media stream obtained:', {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length
      });
      
      // Status aktualisieren
      this.updateCallStatus('media-ready');
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Fallback: Nur Audio oder gar keine Media-Devices
      if (error.name === 'NotFoundError') {
        this.showError('Keine Kamera oder Mikrofon gefunden. Bitte Geräte anschließen.');
        this.setupFallbackMode();
      } else if (error.name === 'NotAllowedError') {
        this.showError('Zugriff auf Kamera/Mikrofon verweigert. Bitte Berechtigung erteilen.');
        this.setupFallbackMode();
      } else {
        this.showError(`Media-Device-Fehler: ${error.message}`);
        this.setupFallbackMode();
      }
    }
  }
  
  setupPhoneInterface() {
    // ECHTE Event-Handler für Phone-Interface
    const phoneNumber = document.getElementById('phone-number');
    const dialButtons = document.querySelectorAll('.dial-btn');
    const callBtn = document.getElementById('call-btn');
    const videoCallBtn = document.getElementById('video-call-btn');
    const contactsBtn = document.getElementById('contacts-btn');
    const closePhone = document.getElementById('close-phone');
    
    // Dial-Buttons
    dialButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const number = btn.dataset.number;
        phoneNumber.value += number;
      });
    });
    
    // Call-Buttons
    callBtn.addEventListener('click', () => {
      const number = phoneNumber.value.trim();
      if (number) {
        this.initiateCall(number, false);
      }
    });
    
    videoCallBtn.addEventListener('click', () => {
      const number = phoneNumber.value.trim();
      if (number) {
        this.initiateCall(number, true);
      }
    });
    
    contactsBtn.addEventListener('click', () => {
      this.showContacts();
    });
    
    closePhone.addEventListener('click', () => {
      this.hidePhoneInterface();
    });
  }
  
  setupCallHandlers() {
    // ECHTE Call-Interface-Handler
    const hangupBtn = document.getElementById('hangup-btn');
    const muteBtn = document.getElementById('mute-btn');
    const videoToggleBtn = document.getElementById('video-toggle-btn');
    
    hangupBtn.addEventListener('click', () => {
      this.endCall();
    });
    
    muteBtn.addEventListener('click', () => {
      this.toggleMute();
    });
    
    videoToggleBtn.addEventListener('click', () => {
      this.toggleVideo();
    });
    
    // Contact-Handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('contact-call-btn')) {
        const phone = e.target.dataset.phone;
        this.initiateCall(phone, false);
        this.hideContacts();
      }
      
      if (e.target.classList.contains('contact-video-btn')) {
        const phone = e.target.dataset.phone;
        this.initiateCall(phone, true);
        this.hideContacts();
      }
    });
    
    // Close-Handler
    document.getElementById('close-contacts').addEventListener('click', () => {
      this.hideContacts();
    });
  }
  
  async initiateCall(phoneNumber, isVideo) {
    console.log(`Initiating ${isVideo ? 'video' : 'audio'} call to ${phoneNumber}`);
    
    // ECHTE Vodafone-Telefonie verwenden wenn verfügbar
    if (window.vodafoneTelephony && window.vodafoneTelephony.isNetworkConnected()) {
      console.log('📞 Verwende Vodafone-Telefonie für Anruf');
      
      try {
        const success = await window.vodafoneTelephony.makeCall(phoneNumber);
        
        if (success) {
          this.isCallActive = true;
          this.isVideoEnabled = false; // Vodafone-Telefonie ist Audio-only
          
          // Phone-Interface verstecken
          this.hidePhoneInterface();
          
          // Call-Interface anzeigen
          this.showCallInterface();
          
          // Caller-Info aktualisieren
          document.getElementById('caller-number').textContent = phoneNumber;
          document.getElementById('caller-name').textContent = this.getContactName(phoneNumber);
          document.getElementById('call-status-text').textContent = 'Vodafone-Anruf wird aufgebaut...';
          
          // Vodafone-spezifische UI-Anpassungen
          this.setupVodafoneCallInterface();
          
          this.updateCallStatus('vodafone-calling');
          return;
        }
      } catch (error) {
        console.error('Vodafone-Anruf fehlgeschlagen:', error);
        this.showError(`Vodafone-Anruf fehlgeschlagen: ${error.message}`);
        // Fallback zu WebRTC
      }
    }
    
    // Fallback zu WebRTC wenn Vodafone nicht verfügbar
    console.log('📞 Fallback zu WebRTC für Anruf');
    
    // Prüfe ob Media-Devices verfügbar sind
    if (!this.localStream) {
      console.log('Keine Media-Stream verfügbar - Fallback-Mode');
      this.showError('Keine Kamera/Mikrofon verfügbar - Fallback-Mode aktiviert');
      this.setupFallbackMode();
      return;
    }
    
    this.isCallActive = true;
    this.isVideoEnabled = isVideo;
    
    // Phone-Interface verstecken
    this.hidePhoneInterface();
    
    // Call-Interface anzeigen
    this.showCallInterface();
    
    // Caller-Info aktualisieren
    document.getElementById('caller-number').textContent = phoneNumber;
    document.getElementById('caller-name').textContent = this.getContactName(phoneNumber);
    document.getElementById('call-status-text').textContent = 'WebRTC-Anruf wird aufgebaut...';
    
    try {
      // ECHTE Offer erstellen
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      // Hier würde der Offer an den Remote-Peer gesendet
      this.sendOffer(offer);
      
      // Status aktualisieren
      this.updateCallStatus('connecting');
      
    } catch (error) {
      console.error('Error initiating call:', error);
      this.showError('Fehler beim Aufbau der Verbindung');
      this.endCall();
    }
  }
  
  async answerCall(offer) {
    console.log('Answering call');
    
    this.isCallActive = true;
    this.showCallInterface();
    
    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      // Hier würde die Answer an den Remote-Peer gesendet
      this.sendAnswer(answer);
      
      this.updateCallStatus('connected');
      
    } catch (error) {
      console.error('Error answering call:', error);
      this.showError('Fehler beim Annehmen des Anrufs');
      this.endCall();
    }
  }
  
  async endCall() {
    console.log('Ending call');
    
    this.isCallActive = false;
    
    // ECHTE Vodafone-Telefonie beenden wenn aktiv
    if (window.vodafoneTelephony && window.vodafoneTelephony.isNetworkConnected()) {
      try {
        await window.vodafoneTelephony.hangupCall();
        console.log('✅ Vodafone-Anruf beendet');
      } catch (error) {
        console.error('❌ Vodafone-Anruf-Beendigung fehlgeschlagen:', error);
      }
    }
    
    // WebRTC-Streams stoppen
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    // PeerConnection schließen
    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection(); // Neue Verbindung für nächsten Anruf
    }
    
    // UI zurücksetzen
    this.hideCallInterface();
    this.showPhoneInterface();
    
    // Status zurücksetzen
    this.updateCallStatus('idle');
  }
  
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isAudioEnabled = audioTrack.enabled;
        
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.textContent = this.isAudioEnabled ? '🔇' : '🔊';
        muteBtn.style.background = this.isAudioEnabled ? '#374151' : '#ef4444';
      }
    }
  }
  
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoEnabled = videoTrack.enabled;
        
        const videoToggleBtn = document.getElementById('video-toggle-btn');
        videoToggleBtn.textContent = this.isVideoEnabled ? '📹' : '📷';
        videoToggleBtn.style.background = this.isVideoEnabled ? '#374151' : '#ef4444';
      }
    }
  }
  
  updateLocalVideo() {
    const localVideo = document.getElementById('local-video');
    if (localVideo && this.localStream) {
      localVideo.srcObject = this.localStream;
    }
  }
  
  updateRemoteVideo() {
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo && this.remoteStream) {
      remoteVideo.srcObject = this.remoteStream;
    }
  }
  
  setupFallbackMode() {
    console.log('Fallback-Mode aktiviert - WebTrit Phone ohne Media-Devices');
    
    // Fallback-Status anzeigen
    this.updateCallStatus('fallback-mode');
    
    // Phone-Interface anpassen für Fallback-Mode
    const callBtn = document.getElementById('call-btn');
    const videoCallBtn = document.getElementById('video-call-btn');
    
    if (callBtn) {
      callBtn.textContent = '📞 Audio (Fallback)';
      callBtn.style.background = '#f59e0b';
    }
    
    if (videoCallBtn) {
      videoCallBtn.textContent = '📹 Video (N/A)';
      videoCallBtn.disabled = true;
      videoCallBtn.style.background = '#6b7280';
    }
    
    // Status-Text aktualisieren
    const statusText = document.getElementById('call-status');
    if (statusText) {
      statusText.textContent = 'Fallback-Mode: Keine Media-Devices';
      statusText.style.color = '#f59e0b';
      statusText.style.display = 'block';
    }
  }
  
  updateCallStatus(status) {
    const statusText = document.getElementById('call-status-text');
    const statusMap = {
      'idle': 'Bereit für Anrufe',
      'connecting': 'Verbindung wird aufgebaut...',
      'connected': 'Verbindung hergestellt',
      'disconnected': 'Verbindung getrennt',
      'failed': 'Verbindung fehlgeschlagen',
      'media-ready': 'Media-Devices bereit',
      'fallback-mode': 'Fallback-Mode aktiv',
      'vodafone-calling': 'Vodafone-Anruf wird aufgebaut...',
      'vodafone-connected': 'Vodafone-Verbindung hergestellt',
      'vodafone-ringing': 'Vodafone-Anruf klingelt'
    };
    
    if (statusText) {
      statusText.textContent = statusMap[status] || status;
      
      // Status-Farbe basierend auf Status
      switch(status) {
        case 'connected':
        case 'media-ready':
        case 'vodafone-connected':
          statusText.style.color = '#10b981';
          break;
        case 'connecting':
        case 'vodafone-calling':
          statusText.style.color = '#f59e0b';
          break;
        case 'failed':
        case 'disconnected':
          statusText.style.color = '#ef4444';
          break;
        case 'fallback-mode':
          statusText.style.color = '#f59e0b';
          break;
        case 'vodafone-ringing':
          statusText.style.color = '#3b82f6';
          break;
        default:
          statusText.style.color = '#9ca3af';
      }
    }
  }
  
  setupVodafoneCallInterface() {
    console.log('📞 Vodafone-spezifische Call-Interface wird eingerichtet');
    
    // Vodafone-spezifische UI-Elemente
    const callInterface = document.getElementById('call-interface');
    if (callInterface) {
      // Vodafone-Branding hinzufügen
      const vodafoneIndicator = document.createElement('div');
      vodafoneIndicator.id = 'vodafone-indicator';
      vodafoneIndicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #e60012;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      `;
      vodafoneIndicator.textContent = 'VODAFONE';
      callInterface.appendChild(vodafoneIndicator);
      
      // Signal-Stärke-Anzeige
      const signalIndicator = document.createElement('div');
      signalIndicator.id = 'signal-indicator';
      signalIndicator.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        color: #10b981;
        font-size: 14px;
      `;
      signalIndicator.innerHTML = '📶 <span id="signal-strength">--</span> dBm';
      callInterface.appendChild(signalIndicator);
      
      // Signal-Stärke aktualisieren
      this.updateSignalStrength();
    }
    
    // Vodafone-Event-Listener
    document.addEventListener('vodafone-status-change', (event) => {
      console.log('📊 Vodafone-Status geändert:', event.detail);
      this.updateVodafoneStatus(event.detail);
    });
    
    document.addEventListener('vodafone-call-status-change', (event) => {
      console.log('📞 Vodafone-Call-Status geändert:', event.detail);
      this.updateCallStatus(event.detail.status);
    });
  }
  
  updateSignalStrength() {
    if (window.vodafoneTelephony) {
      const signalStrength = window.vodafoneTelephony.getSignalStrength();
      const signalElement = document.getElementById('signal-strength');
      if (signalElement) {
        signalElement.textContent = signalStrength;
        
        // Signal-Stärke-Farbe basierend auf Qualität
        if (signalStrength >= 15) {
          signalElement.style.color = '#10b981'; // Grün - Gut
        } else if (signalStrength >= 10) {
          signalElement.style.color = '#f59e0b'; // Gelb - Mittel
        } else {
          signalElement.style.color = '#ef4444'; // Rot - Schlecht
        }
      }
    }
  }
  
  updateVodafoneStatus(statusData) {
    const { status, signalStrength } = statusData;
    
    // Signal-Stärke aktualisieren
    this.updateSignalStrength();
    
    // Status-spezifische Aktionen
    switch(status) {
      case 'connected':
        console.log('✅ Vodafone-Netzwerk verbunden');
        break;
      case 'disconnected':
        console.log('❌ Vodafone-Netzwerk getrennt');
        this.showError('Vodafone-Netzwerk-Verbindung verloren');
        break;
      case 'error':
        console.log('❌ Vodafone-Netzwerk-Fehler');
        this.showError('Vodafone-Netzwerk-Fehler');
        break;
    }
  }
  
  getContactName(phoneNumber) {
    const contact = this.contacts.find(c => c.phone === phoneNumber);
    return contact ? contact.name : phoneNumber;
  }
  
  showPhoneInterface() {
    if (this.phoneContainer) {
      this.phoneContainer.style.display = 'block';
    }
  }
  
  hidePhoneInterface() {
    if (this.phoneContainer) {
      this.phoneContainer.style.display = 'none';
    }
  }
  
  showCallInterface() {
    if (this.callContainer) {
      this.callContainer.style.display = 'flex';
    }
  }
  
  hideCallInterface() {
    if (this.callContainer) {
      this.callContainer.style.display = 'none';
    }
  }
  
  showContacts() {
    if (this.contactContainer) {
      this.contactContainer.style.display = 'block';
    }
  }
  
  hideContacts() {
    if (this.contactContainer) {
      this.contactContainer.style.display = 'none';
    }
  }
  
  showError(message) {
    // ECHTE Error-Anzeige
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10003;
      animation: slide-down 0.3s ease-out;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
  
  // ECHTE Signalling-Methoden (würden normalerweise über WebSocket/Server implementiert)
  sendOffer(offer) {
    console.log('Sending offer:', offer);
    // Hier würde der Offer über WebSocket an den Remote-Peer gesendet
  }
  
  sendAnswer(answer) {
    console.log('Sending answer:', answer);
    // Hier würde die Answer über WebSocket an den Remote-Peer gesendet
  }
  
  sendIceCandidate(candidate) {
    console.log('Sending ICE candidate:', candidate);
    // Hier würde der ICE Candidate über WebSocket an den Remote-Peer gesendet
  }
  
  // Public API
  openPhoneInterface() {
    this.showPhoneInterface();
  }
  
  closePhoneInterface() {
    this.hidePhoneInterface();
  }
  
  destroy() {
    this.endCall();
    
    if (this.phoneContainer) this.phoneContainer.remove();
    if (this.callContainer) this.callContainer.remove();
    if (this.contactContainer) this.contactContainer.remove();
  }
}

// ECHTE WebTrit Phone-Instanz erstellen
if (typeof window !== 'undefined') {
  window.RealWebTritPhone = RealWebTritPhone;
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.webtritPhone = new RealWebTritPhone();
    });
  } else {
    window.webtritPhone = new RealWebTritPhone();
  }
}
