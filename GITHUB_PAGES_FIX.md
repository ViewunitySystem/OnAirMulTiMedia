# 🚨 GITHUB PAGES FIX - Repository-Bereinigung

## PROBLEM IDENTIFIZIERT
- **Mehrere Branches** mit Webdateien: `gh-pages` + `mainzero`
- **GitHub Pages Source** unklar - welcher Branch ist aktiv?
- **index.html Redirect** statt Iframe-Einbettung
- **Live-Site** zeigt weiterhin "Redirecting to Info Dashboard..."

## SOFORTIGE LÖSUNG

### 1. GitHub Pages Source festlegen
```bash
# Repository Settings → Pages
# Source: Deploy from a branch
# Branch: gh-pages (empfohlen)
# Folder: / (root)
```

### 2. Branch-Bereinigung
```bash
# Option A: gh-pages als Haupt-Branch (EMPFOHLEN)
# - gh-pages/index.html = Haupt-Startseite mit Iframe
# - gh-pages/info.html = Dashboard-Inhalt
# - mainzero = nur Quellcode, nicht für Pages

# Option B: mainzero als Haupt-Branch
# - Settings → Pages → Source: mainzero / root
# - index22.html umbenennen/entfernen
# - gh-pages deaktivieren
```

### 3. index.html Fix (für gh-pages Branch)
```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OnAirMulTiMedia - Amateur Radio SDR Platform</title>
  
  <!-- WICHTIG: KEINE Meta-Refresh oder JS-Redirects! -->
  
  <meta name="description" content="Open-source Software-Defined Radio platform">
  <meta name="author" content="Raymond Demitrio Dr. Tel">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; width: 100%; overflow: hidden; font-family: system-ui; background: #0a0e27; color: #fff; }
    #app { width: 100%; height: 100%; display: flex; flex-direction: column; }
    #inlay { border: 0; width: 100%; height: 100%; flex: 1; background: #0a0e27; }
    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1; }
    .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #00ff88; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="app">
    <div id="loading">
      <div class="spinner"></div>
      <p>Loading Info Dashboard...</p>
    </div>
    
    <!-- HAUPT-IFRAME für Info Dashboard -->
    <iframe
      id="inlay"
      name="inlay"
      src="./info.html"
      title="OnAirMulTiMedia Info Dashboard"
      loading="eager"
      referrerpolicy="no-referrer"
      allow="fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    ></iframe>
  </div>

  <noscript>
    <strong>JavaScript ist deaktiviert.</strong><br>
    Bitte aktiviere JavaScript oder gehe direkt zur 
    <a href="./info.html">Info-Seite</a>.
  </noscript>

  <script>
    const iframe = document.getElementById('inlay');
    const loading = document.getElementById('loading');
    const params = new URLSearchParams(location.search).toString();
    
    // Query-Parameter weitergeben
    if (params) {
      iframe.src = `./info.html?${params}`;
    }
    
    // Ladeanzeige ausblenden
    iframe.addEventListener('load', () => {
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 300);
      }
    });
    
    // Error Handling
    iframe.addEventListener('error', () => {
      if (loading) {
        loading.innerHTML = `
          <div class="spinner"></div>
          <p style="color: #ff6b6b;">Fehler beim Laden der Info-Seite.</p>
          <p><a href="./info.html" style="color: #00ff88;">Direkt zur Info-Seite</a></p>
        `;
      }
    });
    
    // Prevent multiple redirects
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      if (window.location.search.includes('redirect')) {
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  </script>
</body>
</html>
```

### 4. info.html Frame-Busting entfernen
```html
<!-- ENTFERNEN falls vorhanden: -->
<script>
  // ENTFERNEN: if (self !== top) { top.location = self.location; }
  // ENTFERNEN: if (window.top !== window.self) { window.top.location = window.self.location; }
</script>
```

### 5. Cache-Buster Test
```
https://viewunitysystem.github.io/OnAirMulTiMedia/?v=now
https://viewunitysystem.github.io/OnAirMulTiMedia/?t=20250118
```

## SCHRITTE ZUR UMSETZUNG

1. **Repository Settings prüfen**
   - Settings → Pages → Source Branch festlegen
   - gh-pages empfohlen

2. **Branch-Bereinigung**
   - Nur einen Branch für Pages verwenden
   - Anderen Branch als Quellcode behalten

3. **Dateien korrigieren**
   - index.html mit Iframe-Logik
   - info.html ohne Frame-Busting
   - Keine doppelten index.html

4. **Push und Test**
   - Änderungen committen und pushen
   - Cache-Buster verwenden
   - Live-Site testen

## ERWARTETES ERGEBNIS
- ✅ https://viewunitysystem.github.io/OnAirMulTiMedia/ zeigt Startseite mit Iframe
- ✅ info.html wird korrekt eingebettet
- ✅ Keine Weiterleitung mehr
- ✅ Responsive Design funktioniert

---
**Erstellt:** 2025-01-18  
**Status:** 🚨 KRITISCH - Repository-Bereinigung erforderlich  
**Priorität:** HOCH - Live-Site funktioniert nicht korrekt

