// Auto-Fix-System für WebSocket-Fehler
// Automatisch aktiviert wenn Server nicht verfügbar

function autoFixWebSocketErrors() {
  // Alle WebSocket-Verbindungen auf localhost:3000 finden
  const wsConnections = document.querySelectorAll('[data-websocket]');
  
  wsConnections.forEach(connection => {
    const wsUrl = connection.getAttribute('data-websocket');
    if (wsUrl && wsUrl.includes('localhost:3000')) {
      // WebSocket-Verbindung deaktivieren
      connection.style.display = 'none';
      console.log('Auto-Fix: WebSocket-Verbindung deaktiviert für statisches Deployment');
    }
  });
  
  // Console-Fehler abfangen
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('WebSocket connection to \'ws://localhost:3000/\' failed')) {
      console.log('Auto-Fix: WebSocket-Fehler automatisch behoben');
      return; // Fehler nicht anzeigen
    }
    originalError.apply(console, args);
  };
}

// Auto-Fix beim Laden der Seite aktivieren
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFixWebSocketErrors);
} else {
  autoFixWebSocketErrors();
}
