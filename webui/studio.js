// Studio Manager mit lokalen Daten (keine API-Abhängigkeiten)
const $ = s => document.querySelector(s);

// Lokale AI Draft Simulation
$('#aiDraft').addEventListener('click', async () => {
  const title = $('#title').value.trim();
  const desc  = $('#desc').value.trim();
  const target= $('#target').value;
  
  if (!title || !desc) {
    setStatus('Bitte Titel und Beschreibung ausfüllen', 'error');
    return;
  }
  
  setStatus('AI generiert Vorschlag …');
  
  try {
    // Simuliere AI Draft Generation
    const code = generateAIDraft(title, desc, target);
    $('#code').value = code;
    setStatus('Vorschlag erstellt. Prüfe/ändere den Code und nutze Vorschau.', 'success');
  } catch (error) {
    setStatus('Fehler beim AI-Vorschlag: ' + error.message, 'error');
  }
});

$('#preview').addEventListener('click', () => {
  const code = $('#code').value.trim();
  if (!code) {
    setStatus('Bitte Code eingeben für Vorschau', 'error');
    return;
  }
  
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Preview</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #f0f0f0; }
    .preview-container { background: white; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="preview-container">
    <h3>Live Preview</h3>
    <div id="preview-content"></div>
  </div>
  <script>
    try {
      ${escapeJs(code)}
    } catch (error) {
      document.getElementById('preview-content').innerHTML = 
        '<p style="color: red;">Fehler: ' + error.message + '</p>';
    }
  </script>
</body>
</html>`;
  
  const blob = new Blob([html], {type:'text/html'});
  $('#sandbox').src = URL.createObjectURL(blob);
  setStatus('Vorschau aktualisiert', 'success');
});

$('#submit').addEventListener('click', async () => {
  const payload = {
    title: $('#title').value.trim(),
    description: $('#desc').value.trim(),
    target: $('#target').value,
    code: $('#code').value.trim()
  };
  
  if (!payload.title || !payload.description || !payload.code) {
    setStatus('Bitte alle Felder ausfüllen', 'error');
    return;
  }
  
  setStatus('Sende zur Prüfung …');
  
  try {
    // Simuliere Submission
    const result = simulateSubmission(payload);
    
    if (result.ok) {
      setStatus(`✅ Eingereicht: PR #${result.pr} - Simulation erfolgreich`, 'success');
      // Reset form
      $('#title').value = '';
      $('#desc').value = '';
      $('#code').value = '';
    } else {
      setStatus(`❌ Fehler: ${result.error}`, 'error');
    }
  } catch (error) {
    setStatus('Fehler beim Einreichen: ' + error.message, 'error');
  }
});

// Hilfsfunktionen
function generateAIDraft(title, desc, target) {
  const templates = {
    'modules/user/': `// ${title}
// ${desc}

class ${title.replace(/[^a-zA-Z0-9]/g, '')} {
  constructor() {
    this.name = '${title}';
    this.description = '${desc}';
    this.target = '${target}';
  }

  init() {
    console.log('${title} initialisiert');
    this.setupUI();
    this.bindEvents();
  }

  setupUI() {
    // UI Setup hier
    const container = document.createElement('div');
    container.className = '${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}';
    container.innerHTML = \`
      <h2>\${this.name}</h2>
      <p>\${this.description}</p>
      <div class="controls">
        <button id="action-btn">Aktion</button>
      </div>
    \`;
    document.body.appendChild(container);
  }

  bindEvents() {
    const btn = document.getElementById('action-btn');
    if (btn) {
      btn.addEventListener('click', () => this.handleAction());
    }
  }

  handleAction() {
    console.log('Aktion ausgeführt');
    // Implementierung hier
  }
}

// Auto-Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ${title.replace(/[^a-zA-Z0-9]/g, '')}();
  });
} else {
  new ${title.replace(/[^a-zA-Z0-9]/g, '')}();
}`,
    'webui/components/': `// ${title} - Web Component
// ${desc}

class ${title.replace(/[^a-zA-Z0-9]/g, '')}Component extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }
        h3 {
          margin: 0 0 12px 0;
          color: #333;
        }
        .content {
          color: #666;
        }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
      </style>
      <div class="component">
        <h3>\${this.getAttribute('title') || '${title}'}</h3>
        <div class="content">\${this.getAttribute('content') || '${desc}'}</div>
        <button id="action-btn">Aktion</button>
      </div>
    \`;
  }

  setupEventListeners() {
    const btn = this.shadowRoot.getElementById('action-btn');
    if (btn) {
      btn.addEventListener('click', () => this.handleAction());
    }
  }

  handleAction() {
    this.dispatchEvent(new CustomEvent('action', {
      detail: { component: '${title}', action: 'clicked' }
    }));
  }
}

// Registriere das Custom Element
customElements.define('${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component', ${title.replace(/[^a-zA-Z0-9]/g, '')}Component);

// Demo Usage
document.addEventListener('DOMContentLoaded', () => {
  const demo = document.createElement('${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component');
  demo.setAttribute('title', '${title}');
  demo.setAttribute('content', '${desc}');
  document.body.appendChild(demo);
});`,
    'apps/user/': `// ${title} - User App
// ${desc}

class ${title.replace(/[^a-zA-Z0-9]/g, '')}App {
  constructor() {
    this.name = '${title}';
    this.version = '1.0.0';
    this.description = '${desc}';
    this.target = '${target}';
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log(\`Initialisiere \${this.name} v\${this.version}\`);
    
    try {
      await this.loadConfig();
      this.setupUI();
      this.bindEvents();
      this.startServices();
      this.isInitialized = true;
      console.log(\`\${this.name} erfolgreich initialisiert\`);
    } catch (error) {
      console.error(\`Fehler beim Initialisieren von \${this.name}:\`, error);
    }
  }

  async loadConfig() {
    // Simuliere Config Loading
    this.config = {
      theme: 'dark',
      language: 'de',
      features: ['feature1', 'feature2']
    };
  }

  setupUI() {
    const appContainer = document.createElement('div');
    appContainer.id = '${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-app';
    appContainer.className = 'app-container';
    
    appContainer.innerHTML = \`
      <header class="app-header">
        <h1>\${this.name}</h1>
        <div class="app-info">
          <span class="version">v\${this.version}</span>
          <span class="status" id="app-status">Bereit</span>
        </div>
      </header>
      <main class="app-main">
        <div class="app-content">
          <p>\${this.description}</p>
          <div class="app-controls">
            <button id="start-btn">Start</button>
            <button id="stop-btn">Stop</button>
            <button id="reset-btn">Reset</button>
          </div>
          <div class="app-output" id="app-output"></div>
        </div>
      </main>
      <footer class="app-footer">
        <div class="app-stats">
          <span>Status: <span id="status-text">Bereit</span></span>
          <span>Uptime: <span id="uptime-text">0s</span></span>
        </div>
      </footer>
    \`;
    
    document.body.appendChild(appContainer);
  }

  bindEvents() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
  }

  start() {
    document.getElementById('app-status').textContent = 'Läuft';
    document.getElementById('status-text').textContent = 'Aktiv';
    console.log(\`\${this.name} gestartet\`);
  }

  stop() {
    document.getElementById('app-status').textContent = 'Gestoppt';
    document.getElementById('status-text').textContent = 'Gestoppt';
    console.log(\`\${this.name} gestoppt\`);
  }

  reset() {
    document.getElementById('app-status').textContent = 'Bereit';
    document.getElementById('status-text').textContent = 'Bereit';
    console.log(\`\${this.name} zurückgesetzt\`);
  }

  startServices() {
    // Simuliere Service Start
    console.log('Services gestartet');
  }
}

// Auto-Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ${title.replace(/[^a-zA-Z0-9]/g, '')}App().init();
  });
} else {
  new ${title.replace(/[^a-zA-Z0-9]/g, '')}App().init();
}`
  };

  return templates[target] || `// ${title}
// ${desc}

console.log('${title} - ${desc}');
console.log('Target: ${target}');

// Implementierung hier
function init${title.replace(/[^a-zA-Z0-9]/g, '')}() {
  console.log('Initialisiere ${title}');
  // Code hier
}

init${title.replace(/[^a-zA-Z0-9]/g, '')}();`;
}

function simulateSubmission(payload) {
  // Simuliere Submission-Prozess
  const prNumber = Math.floor(Math.random() * 1000) + 100;
  
  return {
    ok: true,
    pr: prNumber,
    url: `https://github.com/ViewunitySystem/OnAirMulTiMedia/pull/${prNumber}`,
    message: 'Submission erfolgreich simuliert'
  };
}

function escapeJs(s) {
  return s.replace(/<\/(script)/gi, '<\\/$1');
}

function setStatus(message, type = 'info') {
  const statusEl = $('#status');
  statusEl.textContent = message;
  statusEl.className = `muted ${type}`;
  
  // Auto-hide nach 5 Sekunden
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'muted';
  }, 5000);
}

console.log('📝 Studio Manager mit lokalen Daten initialisiert');