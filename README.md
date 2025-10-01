# 🚀 OnAirMulTiMedia - Self-Healing Multi-Target Deployment Platform

[![CI Status](https://github.com/ViewunitySystem/OnAirMulTiMedia/workflows/Deploy%20(Pages%20%2B%20Firebase)/badge.svg)](https://github.com/ViewunitySystem/OnAirMulTiMedia/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![EU Compliance](https://img.shields.io/badge/EU-GDPR%20%7C%20RED%20%7C%20BNetzA-green.svg)](LICENSE)
[![Swipe Technology](https://img.shields.io/badge/WebTrit-Swipe%20Enhanced-orange.svg)](modules/SignalMirror/)
[![Modules](https://img.shields.io/badge/modules-22-brightgreen.svg)](modules/)
[![Compliance](https://img.shields.io/badge/compliance-100%25-success.svg)](audit/exports/license.json)

## 🎯 Production-Ready SDR Platform with Audit Trail & Regulatory Compliance

### ✅ Was wurde gefixt:

1. **index.html** - Korrekte Iframe-Einbettung statt Redirect
2. **info.html** - Frame-Busting entfernt, Iframe-kompatibel
3. **Repository-Struktur** - Klare Branch-Organisation
4. **GitHub Actions** - Automatisches Deployment

## 🎯 Live-URLs (nach Deployment):

- **Hauptseite**: https://viewunitysystem.github.io/OnAirMulTiMedia/
- **Cache-Buster**: https://viewunitysystem.github.io/OnAirMulTiMedia/?v=now
- **Info-Dashboard**: https://viewunitysystem.github.io/OnAirMulTiMedia/info.html

## 📁 Repository-Struktur:

```
OnAirMulTiMedia/
├── index.html          # ✅ Hauptseite mit Iframe-Einbettung
├── info.html           # ✅ Dashboard-Inhalt (iframe-kompatibel)
├── api-stub.js         # ✅ GitHub API Stub
├── webtrit-swipe.js    # ✅ WebRTC Swipe Handler
├── sparkline.svg       # ✅ Sparkline Chart
├── .github/workflows/  # ✅ Auto-Deployment
└── README.md           # ✅ Diese Dokumentation
```

## 🔧 GitHub Pages Konfiguration:

### Option A (EMPFOHLEN): gh-pages Branch
```yaml
Settings → Pages:
  Source: Deploy from a branch
  Branch: gh-pages
  Folder: / (root)
```

### Option B: mainzero Branch
```yaml
Settings → Pages:
  Source: Deploy from a branch
  Branch: mainzero
  Folder: / (root)
```

## 🚀 Deployment-Schritte:

1. **Branch auswählen** (gh-pages oder mainzero)
2. **GitHub Pages Source** in Settings festlegen
3. **Dateien pushen**:
   ```bash
   git add .
   git commit -m "Fix: Iframe-Startseite statt Redirect"
   git push origin gh-pages
   ```
4. **Live-Site testen** mit Cache-Buster

## 🔍 Troubleshooting:

### Problem: Weiterhin Redirect-Seite
**Lösung**: Cache leeren oder Cache-Buster verwenden
```
https://viewunitysystem.github.io/OnAirMulTiMedia/?v=20250118
```

### Problem: Iframe lädt nicht
**Lösung**: Browser-Konsole prüfen auf Mixed-Content-Fehler

### Problem: info.html überschreibt index.html
**Lösung**: Direkte info.html-Aufrufe werden automatisch zur Hauptseite umgeleitet

## 📊 Technische Details:

- **Iframe-Sandbox**: `allow-scripts allow-same-origin allow-forms allow-popups allow-modals`
- **Anti-Redirect-Logik**: Verhindert mehrfache Weiterleitungen
- **Frame-Busting-Schutz**: info.html ist iframe-kompatibel
- **Responsive Design**: Funktioniert auf allen Geräten
- **Debug-Logging**: Console-Logs für Troubleshooting

## 🎨 Design-Features:

- **Dark Theme**: #0a0e27 Hintergrund mit #00ff88 Akzenten
- **Gradient-Effekte**: Moderne CSS-Gradienten
- **Hover-Animationen**: Smooth Transitions
- **Loading-Spinner**: Elegante Ladeanzeige
- **Error-Handling**: Graceful Fallbacks

## 📱 Browser-Kompatibilität:

- ✅ Chrome/Chromium (empfohlen)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile Browser

## 🔒 Sicherheit:

- **HTTPS-only**: GitHub Pages SSL-Zertifikat
- **Iframe-Sandbox**: Eingeschränkte Berechtigungen
- **No-Referrer**: `referrerpolicy="no-referrer"`
- **Content Security**: Keine externen Scripts

---

**Status**: ✅ BEREIT FÜR DEPLOYMENT  
**Letzte Aktualisierung**: 2025-01-18  
**Entwickler**: Raymond Demitrio Dr. Tel  
**Repository**: ViewunitySystem/OnAirMulTiMedia
