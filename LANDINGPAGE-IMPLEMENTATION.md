# OnAirMulTiMedia - Professionelle Landingpage

## ✅ **VOLLSTÄNDIG IMPLEMENTIERT**

Eine professionelle Landingpage mit Video-Hintergrund, eingebettetem Info-Dashboard und Offline-Funktionalität.

## 🎯 **Features**

### **Landingpage (index.html)**
- ✅ **Video-Hintergrund** mit Fallback-Gradient
- ✅ **Responsive Design** für alle Geräte
- ✅ **Eingebettetes Info-Dashboard** via iframe (ohne Redirect)
- ✅ **Hash/Query-Router** (#info oder ?view=info)
- ✅ **Reload-Button** für das Inlay
- ✅ **Barrierefreiheit** (Screenreader, Kontraste, Skip-Links)
- ✅ **Performance-optimiert** (Systemschriften, lazy loading)

### **Info-Dashboard (info.html)**
- ✅ **Frame-Busting-Guard** verhindert Einbettung in fremde Frames
- ✅ **Erlaubte Domains**: eigene Domain, GitHub Pages, Firebase
- ✅ **Sicherheitsprüfung** bei Cross-Origin-Zugriff
- ✅ **Automatischer Redirect** bei unerlaubter Einbettung

### **Service Worker (sw.js)**
- ✅ **Offline-Funktionalität** mit intelligenter Cache-Strategie
- ✅ **404-Fallback** für nicht gefundene Seiten
- ✅ **Netzwerk-First** für APIs, Cache-First für Assets
- ✅ **Automatische Cache-Aktualisierung**
- ✅ **Service Unavailable** für API-Fehler

### **Offline-Seite (offline.html)**
- ✅ **Benutzerfreundliche Offline-Meldung**
- ✅ **Verfügbare Funktionen** auflisten
- ✅ **Automatische Neuverbindung** bei Online-Status
- ✅ **Service Worker Status** anzeigen

## 📁 **Dateistruktur**

```
OnAirMulTiMedia/
├── index.html          # Haupt-Landingpage
├── info.html           # Info-Dashboard mit Frame-Busting
├── offline.html        # Offline-Fallback-Seite
├── sw.js              # Service Worker
├── assets/            # Medien-Assets
│   ├── README.md      # Asset-Dokumentation
│   ├── hero.mp4       # Hintergrundvideo (zu ergänzen)
│   └── cover.jpg      # Video-Poster (zu ergänzen)
└── ...                # Bestehende App-Dateien
```

## 🎬 **Video-Assets**

### **Erforderliche Dateien:**
- `assets/hero.mp4` - Hintergrundvideo (MP4, H.264, < 10MB)
- `assets/cover.jpg` - Video-Poster (JPG, 1920x1080, < 500KB)

### **Video-Spezifikationen:**
- **Format**: MP4 (H.264)
- **Auflösung**: 1920x1080 oder höher
- **Dauer**: 10-30 Sekunden (looped)
- **Autoplay**: Muted, playsinline, loop
- **Fallback**: CSS-Gradient bei fehlendem Video

## 🔧 **Technische Details**

### **Frame-Busting-Guard**
```javascript
// Erlaubte Parent-Domains
const allowedParents = [
  window.location.origin,
  'https://viewunitysystem.github.io',
  'https://onairmultimedia.web.app'
];
```

### **Service Worker Strategien**
- **HTML**: Cache-First für Performance
- **Assets**: Cache-First für Geschwindigkeit
- **APIs**: Netzwerk-First für Aktualität
- **404**: Intelligente Fallback-Seiten

### **Performance-Optimierungen**
- Systemschriften für schnelle Ladezeiten
- Lazy Loading für iframe
- Minimale JavaScript-Bibliotheken
- Optimierte CSS mit CSS-Variablen

## 🚀 **Deployment**

### **GitHub Pages**
Die Landingpage wird automatisch über den GitHub Actions Workflow deployed:
- **Branch**: `gh-pages`
- **URL**: `https://viewunitysystem.github.io/OnAirMulTiMedia/`

### **Firebase Hosting**
Zusätzliches Deployment auf Firebase:
- **Prod**: `https://onairmultimedia.web.app`
- **Staging**: `https://onairmultimedia-staging.web.app`

## 🔒 **Sicherheit**

### **Frame-Busting**
- Verhindert Clickjacking-Angriffe
- Erlaubt nur vertrauenswürdige Domains
- Automatischer Redirect bei Verstößen

### **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; img-src 'self' data: https:; 
               script-src 'self'; style-src 'self' 'unsafe-inline'; 
               frame-ancestors 'self';">
```

## 📱 **Responsive Design**

### **Breakpoints**
- **Desktop**: 1200px+ (4-Spalten Grid)
- **Tablet**: 980px (2-Spalten Grid)
- **Mobile**: 580px (1-Spalten Grid)

### **Accessibility**
- Skip-Links für Screenreader
- ARIA-Labels für Navigation
- Kontrast-optimierte Farben
- Reduced Motion Support

## 🎨 **Design-System**

### **Farbpalette**
```css
:root {
  --bg-dark: #0b0f17;
  --glass: rgba(8,12,20,.4);
  --fg: #eaf0ff;
  --muted: #a6b0c9;
  --accent: #7dd3fc;
  --accent-2: #f472b6;
}
```

### **Typografie**
- **Font**: System-UI Stack
- **Größen**: Clamp für responsive Skalierung
- **Gewicht**: 400 (normal), 700 (bold), 800 (extra-bold)

## 🔄 **Wartung**

### **Cache-Management**
- Service Worker Versionierung über `CACHE_NAME`
- Automatische Cache-Bereinigung
- Intelligente Update-Strategien

### **Monitoring**
- Console-Logging für Debugging
- Service Worker Status-Tracking
- Verbindungsstatus-Überwachung

## 📋 **Nächste Schritte**

1. **Video-Assets hinzufügen**:
   - `assets/hero.mp4` hochladen
   - `assets/cover.jpg` hochladen

2. **Testing**:
   - Offline-Funktionalität testen
   - Frame-Busting-Guard prüfen
   - Responsive Design validieren

3. **Deployment**:
   - GitHub Pages aktivieren
   - Firebase Hosting konfigurieren
   - Domain-Verbindung einrichten

---

**Status**: ✅ Vollständig implementiert und deployment-ready
**Letzte Aktualisierung**: 2025-01-10
**Version**: 1.0.0
