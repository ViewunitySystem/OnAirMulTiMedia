# Content Security Policy (CSP) für WebTrit-Integration

## Aktuelle CSP-Konfiguration

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.github.com https://webtrit.example.com wss://webtrit.example.com;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self' https://viewunitysystem.github.io https://onairmultimedia.web.app;
">
```

## WebTrit-spezifische CSP-Erweiterungen

### 1. Connect-Source Erweiterung
```javascript
// Dynamische CSP-Erweiterung basierend auf Environment
function getCSPDirectives() {
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'media-src': ["'self'", "blob:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'", "https://viewunitysystem.github.io", "https://onairmultimedia.web.app"]
  };

  // WebTrit-Backend basierend auf Environment hinzufügen
  const webtritSources = [];
  
  if (process.env.NODE_ENV === 'production') {
    webtritSources.push(
      'https://webtrit-prod.example.com',
      'wss://webtrit-prod.example.com'
    );
  } else if (process.env.NODE_ENV === 'staging') {
    webtritSources.push(
      'https://webtrit-staging.example.com',
      'wss://webtrit-staging.example.com'
    );
  } else {
    // Development
    webtritSources.push(
      'https://webtrit-dev.example.com',
      'wss://webtrit-dev.example.com',
      'http://localhost:3000',
      'ws://localhost:3000'
    );
  }

  // GitHub API für Dashboard
  webtritSources.push('https://api.github.com');

  baseDirectives['connect-src'] = ["'self'", ...webtritSources];

  return baseDirectives;
}

// CSP-String generieren
function generateCSPString() {
  const directives = getCSPDirectives();
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
```

### 2. Feature-Flag basierte CSP
```javascript
// CSP basierend auf Feature-Flags anpassen
function getFeatureFlagCSP() {
  const commsEnabled = process.env.OAMTM_COMMS_ENABLED === 'true' || 
                       new URLSearchParams(window.location.search).get('comms') === '1';

  if (!commsEnabled) {
    // WebTrit-Quellen entfernen wenn Comms deaktiviert
    return generateCSPString().replace(/https:\/\/webtrit[^;]*/g, '');
  }

  return generateCSPString();
}
```

### 3. Dynamische CSP-Update
```javascript
// CSP zur Laufzeit aktualisieren (für Feature-Flags)
function updateCSP() {
  const newCSP = getFeatureFlagCSP();
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (meta) {
    meta.setAttribute('content', newCSP);
  } else {
    // Meta-Tag erstellen falls nicht vorhanden
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('http-equiv', 'Content-Security-Policy');
    metaTag.setAttribute('content', newCSP);
    document.head.appendChild(metaTag);
  }
}

// CSP bei Feature-Flag-Änderung aktualisieren
window.addEventListener('oamtm:comms:toggle', updateCSP);
```

## Environment-spezifische Konfiguration

### Production (gh-pages)
```bash
OAMTM_COMMS_ENABLED=false
WEBTRIT_SERVER_URL=https://webtrit-prod.example.com
WEBTRIT_JWT_SECRET=production-secret-key
```

### Staging (mainzero)
```bash
OAMTM_COMMS_ENABLED=true
WEBTRIT_SERVER_URL=https://webtrit-staging.example.com
WEBTRIT_JWT_SECRET=staging-secret-key
```

### Development (main)
```bash
OAMTM_COMMS_ENABLED=true
WEBTRIT_SERVER_URL=http://localhost:3000
WEBTRIT_JWT_SECRET=dev-secret-key
```

## CI/CD Integration

### GitHub Actions CSP-Check
```yaml
- name: CSP Validation
  run: |
    # CSP-Syntax prüfen
    node scripts/validate-csp.js
    
    # WebTrit-Quellen validieren
    node scripts/check-webtrit-sources.js
```

### CSP-Report-Endpoint
```javascript
// CSP Violation Reporting
app.post('/api/csp-report', (req, res) => {
  const violation = req.body;
  
  // Audit-Event für CSP-Verletzungen
  emitAudit({
    event: 'CSP_VIOLATION',
    violation,
    timestamp: new Date().toISOString(),
    user_agent: req.get('User-Agent'),
    url: violation.documentURI
  });
  
  res.status(204).send();
});
```

## Sicherheitshinweise

1. **WebTrit-Quellen** nur bei aktiviertem Feature-Flag hinzufügen
2. **JWT-Secrets** environment-spezifisch und stark
3. **CSP-Reports** für Monitoring von Verletzungen
4. **Feature-Flags** über URL-Parameter und Environment-Variablen
5. **Audit-Trail** für alle CSP-Änderungen und Verletzungen

