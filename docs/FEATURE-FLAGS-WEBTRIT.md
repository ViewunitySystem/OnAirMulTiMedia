# Feature-Flags für WebTrit-Integration

## Environment-Variablen

### Production (gh-pages)
```bash
# WebTrit Integration - PRODUCTION
OAMTM_COMMS_ENABLED=false
WEBTRIT_SERVER_URL=https://webtrit-prod.example.com
WEBTRIT_JWT_SECRET=prod-secret-$(openssl rand -hex 32)
WEBTRIT_CLIENT_ID=oamtm-prod-client
WEBTRIT_CLIENT_SECRET=prod-client-secret-$(openssl rand -hex 16)

# CSP Configuration
CSP_WEBTRIT_SOURCES=https://webtrit-prod.example.com,wss://webtrit-prod.example.com
CSP_REPORT_URI=/api/csp-report

# Audit Configuration
AUDIT_WEBTRIT_ENABLED=true
AUDIT_WEBTRIT_FILE=audit/events/webtrit-tokens.jsonl
```

### Staging (mainzero)
```bash
# WebTrit Integration - STAGING
OAMTM_COMMS_ENABLED=true
WEBTRIT_SERVER_URL=https://webtrit-staging.example.com
WEBTRIT_JWT_SECRET=staging-secret-$(openssl rand -hex 32)
WEBTRIT_CLIENT_ID=oamtm-staging-client
WEBTRIT_CLIENT_SECRET=staging-client-secret-$(openssl rand -hex 16)

# CSP Configuration
CSP_WEBTRIT_SOURCES=https://webtrit-staging.example.com,wss://webtrit-staging.example.com
CSP_REPORT_URI=/api/csp-report

# Audit Configuration
AUDIT_WEBTRIT_ENABLED=true
AUDIT_WEBTRIT_FILE=audit/events/webtrit-tokens.jsonl
```

### Development (main)
```bash
# WebTrit Integration - DEVELOPMENT
OAMTM_COMMS_ENABLED=true
WEBTRIT_SERVER_URL=http://localhost:3000
WEBTRIT_JWT_SECRET=dev-secret-$(openssl rand -hex 32)
WEBTRIT_CLIENT_ID=oamtm-dev-client
WEBTRIT_CLIENT_SECRET=dev-client-secret-$(openssl rand -hex 16)

# CSP Configuration
CSP_WEBTRIT_SOURCES=http://localhost:3000,ws://localhost:3000
CSP_REPORT_URI=/api/csp-report

# Audit Configuration
AUDIT_WEBTRIT_ENABLED=true
AUDIT_WEBTRIT_FILE=audit/events/webtrit-tokens.jsonl
```

## Feature-Flag-Service

```javascript
// Feature-Flag-Management für WebTrit-Integration
class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.loadFlags();
  }

  loadFlags() {
    // Environment-basierte Flags
    this.flags.set('comms_enabled', process.env.OAMTM_COMMS_ENABLED === 'true');
    this.flags.set('webtrit_enabled', process.env.WEBTRIT_SERVER_URL ? true : false);
    this.flags.set('audit_enabled', process.env.AUDIT_WEBTRIT_ENABLED === 'true');
    
    // URL-Parameter-basierte Flags
    const urlParams = new URLSearchParams(window.location.search);
    this.flags.set('comms_url_flag', urlParams.get('comms') === '1');
    
    // LocalStorage-basierte Flags (für Testing)
    const localFlags = localStorage.getItem('oamtm:feature-flags');
    if (localFlags) {
      try {
        const parsed = JSON.parse(localFlags);
        Object.entries(parsed).forEach(([key, value]) => {
          this.flags.set(`local_${key}`, value);
        });
      } catch (e) {
        console.warn('Invalid feature flags in localStorage');
      }
    }
  }

  isEnabled(flagName) {
    // Priorität: URL > LocalStorage > Environment
    if (this.flags.has(`local_${flagName}`)) {
      return this.flags.get(`local_${flagName}`);
    }
    
    if (this.flags.has(`${flagName}_url_flag`)) {
      return this.flags.get(`${flagName}_url_flag`);
    }
    
    return this.flags.get(flagName) || false;
  }

  setFlag(flagName, value) {
    this.flags.set(`local_${flagName}`, value);
    
    // In LocalStorage persistieren
    const localFlags = JSON.parse(localStorage.getItem('oamtm:feature-flags') || '{}');
    localFlags[flagName] = value;
    localStorage.setItem('oamtm:feature-flags', JSON.stringify(localFlags));
    
    // Event emittieren für CSP-Update
    window.dispatchEvent(new CustomEvent('oamtm:comms:toggle', {
      detail: { flag: flagName, value }
    }));
  }

  getFlags() {
    return Object.fromEntries(this.flags);
  }
}

// Singleton Instance
export const featureFlags = new FeatureFlagService();
```

## URL-Parameter-basierte Flags

### Aktivierung über URL
```
# Comms aktivieren
https://viewunitysystem.github.io/OnAirMulTiMedia/?comms=1

# Comms deaktivieren
https://viewunitysystem.github.io/OnAirMulTiMedia/?comms=0

# Multiple Flags
https://viewunitysystem.github.io/OnAirMulTiMedia/?comms=1&debug=1&audit=1
```

### URL-Parameter-Parser
```javascript
// URL-Parameter für Feature-Flags parsen
function parseFeatureFlags() {
  const params = new URLSearchParams(window.location.search);
  const flags = {};
  
  // Comms-Flag
  if (params.has('comms')) {
    flags.comms = params.get('comms') === '1';
  }
  
  // Debug-Flag
  if (params.has('debug')) {
    flags.debug = params.get('debug') === '1';
  }
  
  // Audit-Flag
  if (params.has('audit')) {
    flags.audit = params.get('audit') === '1';
  }
  
  return flags;
}
```

## CI/CD Integration

### GitHub Actions Environment-Setup
```yaml
name: Deploy with Feature Flags
on:
  push:
    branches: [gh-pages, mainzero, main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set Feature Flags
        run: |
          if [ "${{ github.ref }}" = "refs/heads/gh-pages" ]; then
            echo "OAMTM_COMMS_ENABLED=false" >> $GITHUB_ENV
            echo "WEBTRIT_SERVER_URL=https://webtrit-prod.example.com" >> $GITHUB_ENV
          elif [ "${{ github.ref }}" = "refs/heads/mainzero" ]; then
            echo "OAMTM_COMMS_ENABLED=true" >> $GITHUB_ENV
            echo "WEBTRIT_SERVER_URL=https://webtrit-staging.example.com" >> $GITHUB_ENV
          else
            echo "OAMTM_COMMS_ENABLED=true" >> $GITHUB_ENV
            echo "WEBTRIT_SERVER_URL=http://localhost:3000" >> $GITHUB_ENV
          fi
      
      - name: Deploy
        run: |
          # Deployment mit Environment-Variablen
          npm run build
          npm run deploy
```

## Testing

### Feature-Flag-Tests
```javascript
// Tests für Feature-Flag-Service
describe('FeatureFlagService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete process.env.OAMTM_COMMS_ENABLED;
  });

  test('should load environment flags', () => {
    process.env.OAMTM_COMMS_ENABLED = 'true';
    const service = new FeatureFlagService();
    expect(service.isEnabled('comms_enabled')).toBe(true);
  });

  test('should prioritize URL flags over environment', () => {
    process.env.OAMTM_COMMS_ENABLED = 'false';
    window.location.search = '?comms=1';
    const service = new FeatureFlagService();
    expect(service.isEnabled('comms_enabled')).toBe(true);
  });

  test('should persist local flags', () => {
    const service = new FeatureFlagService();
    service.setFlag('test_flag', true);
    expect(service.isEnabled('test_flag')).toBe(true);
    
    // Reload service
    const service2 = new FeatureFlagService();
    expect(service2.isEnabled('test_flag')).toBe(true);
  });
});
```

## Monitoring

### Feature-Flag-Metrics
```javascript
// Metrics für Feature-Flag-Usage
class FeatureFlagMetrics {
  constructor() {
    this.usage = new Map();
  }

  trackUsage(flagName, enabled) {
    const key = `${flagName}_${enabled}`;
    this.usage.set(key, (this.usage.get(key) || 0) + 1);
    
    // Audit-Event
    emitAudit({
      event: 'FEATURE_FLAG_USAGE',
      flag: flagName,
      enabled,
      timestamp: new Date().toISOString()
    });
  }

  getMetrics() {
    return Object.fromEntries(this.usage);
  }
}
```
