# 🚀 OnAirMulTiMedia Self-Healing & Auto-Maintenance System

Ein universelles **Self‑Healing & Auto‑Maintenance**‑System für GitHub Pages + Serverless‑Dienste.

## 🎯 Was es löst

* ✅ **Redirect-Fehler** in `index.html` → ersetzt durch iframe‑Host
* ✅ **Frame-Busting** in `info.html` → entfernt automatisch
* ✅ **404/Offline-Fehler** → Service Worker Fallback
* ✅ **Doppelte Dateien/Code** → Reports via jscpd
* ✅ **TODO/MOCK/PLACEHOLDER** → Automatische Erkennung
* ✅ **Cron-Maintenance** + Auto-PRs bei Problemen
* ✅ **Telemetry-Integration** (Sentry + OpenTelemetry)
* ✅ **WebRTC Remote-Control** POC
* ✅ **Settings-UI** für API-Keys (Demo)

## 🏗️ Architektur

```
OnAirMulTiMedia/
├─ .github/workflows/ci-selfheal.yml      # CI + Cron: Linter, Tests, Self-Healing, PRs
├─ selfheal.config.json                   # Regeln + Schwellwerte
├─ scripts/
│  ├─ selfheal.ts                         # Orchestrator (lädt Regeln, schreibt Patches)
│  └─ rules/                              # Einzelne Detektoren/Fixer
│     ├─ rule-pages-single-source.ts      # Nur eine Pages-Quelle
│     ├─ rule-index-no-redirect.ts        # Entfernt Redirect, ersetzt durch iframe-Host
│     ├─ rule-info-no-framebust.ts        # Entfernt Frame-Busting
│     ├─ rule-sw-404-fallback.ts          # Service Worker + 404/Offline-Fallback
│     ├─ rule-duplication-jscpd.ts        # Duplikate prüfen (jscpd)
│     ├─ rule-mocks-placeholders.ts       # TODO/XXX/CHANGEME/MOCK erkennen
│     └─ rule-html-validators.ts          # Grundlegende HTML Checks
├─ public/
│  ├─ sw.js                               # Wird bei Bedarf generiert/aktualisiert
│  └─ offline.html                        # Offline/404 Fallback (App-Shell)
├─ tests/
│  └─ e2e.spec.ts                         # Playwright: Startseite lädt iframe + Routen OK
├─ web-remote/
│  ├─ controller.html                     # WebRTC Fernsteuerung
│  └─ display.html                        # Anzeige-Client
├─ telemetry/
│  └─ telemetry-dashboard.html            # Sentry + OpenTelemetry Integration
├─ settings/
│  └─ settings-panel.html                 # UI für API-Keys/Schalter (Client-seitig)
└─ package.json                           # Tools & Scripts
```

## ⚙️ Installation & Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. GitHub Secrets konfigurieren

In **Repository Settings → Secrets** setzen:

* `SENTRY_DSN` - Sentry Error Tracking DSN
* `DB_URL` - Datenbank-URL (optional)
* `GITHUB_TOKEN` - GitHub Token für API-Zugriff

### 3. Self-Healing aktivieren

```bash
# Manueller Test-Lauf
npm run selfheal

# E2E-Tests
npm run test:e2e

# Duplikat-Check
npm run duplication
```

### 4. GitHub Actions aktivieren

Das System läuft automatisch:
* **Bei jedem Push** → Tests + Self-Healing
* **Alle 30 Minuten** → Maintenance-Lauf
* **Bei Problemen** → Automatische PRs mit Fixes

## 🔧 Konfiguration

### `selfheal.config.json`

```json
{
  "rules": {
    "pagesSingleSource": { "enabled": true },
    "indexNoRedirect": { "enabled": true, "iframeSrc": "./info.html" },
    "infoNoFramebust": { "enabled": true },
    "serviceWorkerFallback": { "enabled": true, "offlinePath": "public/offline.html" },
    "duplication": { "enabled": true, "maxPercent": 1 },
    "mocksPlaceholders": { "enabled": true, "patterns": ["TODO", "XXX", "CHANGEME", "MOCK", "DUMMY", "PLACEHOLDER"] },
    "htmlValidators": { "enabled": true }
  }
}
```

## 🧩 Verfügbare Regeln

### `rule-index-no-redirect.ts`
* Entfernt Meta-Refresh + JS-Redirects
* Erstellt/aktualisiert iframe#inlay für info.html
* Verhindert mehrfache Weiterleitungen

### `rule-info-no-framebust.ts`
* Entfernt Frame-Busting-Code
* Macht info.html iframe-kompatibel
* Verhindert `window.top.location` Redirects

### `rule-sw-404-fallback.ts`
* Generiert Service Worker für Offline/404-Fallback
* Erstellt offline.html App-Shell
* Registriert SW automatisch in index.html

### `rule-duplication-jscpd.ts`
* Prüft Code-Duplikate mit jscpd
* Erstellt Reports bei Überschreitung der Schwellwerte
* Verhindert Code-Redundanz

### `rule-mocks-placeholders.ts`
* Scannt nach TODO/XXX/MOCK/PLACEHOLDER
* Erstellt Reports für unfertigen Code
* Verhindert Mock-Code in Produktion

### `rule-html-validators.ts`
* Grundlegende HTML-Validierung
* Prüft auf fehlende title/viewport/alt-Tags
* Accessibility-Checks

## 🧪 E2E-Tests

### `tests/e2e.spec.ts`

```typescript
test('Startseite lädt info.html im iframe', async ({ page }) => {
  await page.goto('https://viewunitysystem.github.io/OnAirMulTiMedia/?cb=test');
  const frame = await page.frameLocator('iframe#inlay').first();
  await expect(frame.locator('body')).toBeVisible();
});
```

## 📊 Telemetry-Integration

### Sentry Error Tracking

```html
<script src="https://browser.sentry-cdn.com/7.120.0/bundle.tracing.min.js"></script>
<script>
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    tracesSampleRate: 0.1
  });
</script>
```

### OpenTelemetry Tracing

```typescript
const span = window.telemetry.startSpan('operation');
// ... Operation ausführen ...
window.telemetry.endSpan(span.id);
```

## 📡 WebRTC Remote-Control

### Controller (`web-remote/controller.html`)
* Erstellt WebRTC-Verbindung
* Sendet JavaScript-Befehle an Display
* Preset-Befehle für häufige Aktionen

### Display (`web-remote/display.html`)
* Empfängt WebRTC-Verbindung
* Führt empfangene Befehle aus
* Zeigt Verbindungsstatus an

## 🔐 Settings-Panel

### `settings/settings-panel.html`
* API-Keys verwalten (Client-seitig)
* Feature-Toggles
* WebRTC-Konfiguration
* Datenbank-Einstellungen
* Export/Import-Funktionen

## 🚀 Workflow

1. **Push** → GitHub Action läuft
2. **Tests** → Playwright E2E-Tests
3. **Self-Healing** → Regeln prüfen und fixen
4. **PR-Erstellung** → Bei gefundenen Problemen
5. **Merge** → Fixes werden live
6. **Cron-Maintenance** → Kontinuierliche Überwachung

## 🔮 Erweiterbarkeit

### Neue Regeln hinzufügen

1. **Regel erstellen**: `scripts/rules/rule-neue-regel.ts`
2. **Export hinzufügen**: `scripts/rules/index.ts`
3. **Konfiguration**: `selfheal.config.json`
4. **Testen**: `npm run selfheal`

### Beispiel-Regel

```typescript
export default {
  enabled: (cfg:any)=>cfg.rules.meineRegel?.enabled,
  run: async (cfg:any)=>{
    // Regel-Logik hier
    return { changed: true };
  }
}
```

## ⚠️ Sicherheitshinweise

* **API-Keys** nie im Client speichern (nur Demo)
* **Sentry DSN** öffentlich sichtbar (nicht kritisch)
* **WebRTC** nur für interne Nutzung
* **Service Worker** mit HTTPS erforderlich

## 📈 Monitoring

### GitHub Actions
* **CI-Status** in Repository-Actions
* **Artefakte** mit Reports
* **PRs** bei automatischen Fixes

### Telemetry-Dashboard
* **Sentry** für Fehler-Tracking
* **OpenTelemetry** für Performance
* **Custom Metrics** möglich

## 🎯 Live-URLs

* **Hauptseite**: https://viewunitysystem.github.io/OnAirMulTiMedia/
* **Settings**: https://viewunitysystem.github.io/OnAirMulTiMedia/settings/settings-panel.html
* **Remote Control**: https://viewunitysystem.github.io/OnAirMulTiMedia/web-remote/
* **Telemetry**: https://viewunitysystem.github.io/OnAirMulTiMedia/telemetry/telemetry-dashboard.html

## 📞 Support

* **Issues**: https://github.com/ViewunitySystem/OnAirMulTiMedia/issues
* **Documentation**: Diese README
* **Developer**: Raymond Demitrio Dr. Tel

---

**Status**: ✅ **AKTIV** - Self-Healing läuft kontinuierlich  
**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-01-18

