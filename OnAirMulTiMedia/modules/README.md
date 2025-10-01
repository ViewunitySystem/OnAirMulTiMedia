# CanvasSwipe – Touch-Gesten für Canvas-Apps

Universal Swipe-Navigation mit Audit-Trail für HTML5 Canvas-basierte Anwendungen.

## Funktionen
- **Multi-Directional Swipe**: Links, Rechts, Hoch, Runter
- **Gesture Recognition**: Velocity-basierte Erkennung
- **Canvas Integration**: Direkte Canvas-Event-Verarbeitung
- **Audit-Trail**: Jede Geste wird geloggt

## Schnittstellen (Data Contract)

**Input (Gesture)**
```json
{
  "gesture_type": "swipe",
  "direction": "left|right|up|down",
  "start_x": 120,
  "start_y": 340,
  "end_x": 450,
  "end_y": 350,
  "velocity": 0.8,
  "timestamp": "2025-10-01T08:45:00Z"
}
```

**Output (Action)**
```json
{
  "action": "navigate",
  "target": "previous_page",
  "audit_id": "evt_swipe_123",
  "processed": true
}
```

## Algorithmik
- **Velocity**: `distance / time` (Mindest-Threshold: 0.3)
- **Direction**: `Math.abs(deltaX) > Math.abs(deltaY)` → horizontal/vertical
- **Threshold**: Mindest-Distanz 50px

## Implementierung
- JavaScript: `webtrit-swipe.js` (423 lines)
- Class: `WebTritSwipe` - Universal Swipe Handler
- Class: `WebTritModuleNavigator` - Module Navigation

## Integration
```javascript
// Usage
const swipe = new WebTritSwipe({
  container: document.body,
  onSwipe: (direction) => {
    console.log('Swiped:', direction);
    // Your navigation logic
  },
  threshold: 50,
  velocityThreshold: 0.3
});
```

## Features
- ✅ Touch Events (mobile)
- ✅ Mouse Events (desktop fallback)
- ✅ Keyboard Navigation (Arrow keys)
- ✅ Voice Control (optional, Web Speech API)
- ✅ Visual Feedback (arrows)
- ✅ Module Overview (Swipe up)
- ✅ Navigation HUD

## UI Integration
- ✅ index.html - Module navigation
- ✅ test-dashboard.html - Panel swipe
- ✅ nomadic_swipe_nemo.html - Tab swipe
- ✅ Alle anderen Seiten via webtrit-swipe.js

## Audit Events
- `SWIPE_LEFT` - Navigation zurück
- `SWIPE_RIGHT` - Navigation vor
- `SWIPE_UP` - Übersicht anzeigen
- `SWIPE_DOWN` - Refresh/Reload

## Checkliste
- [ ] Swipe-Threshold konfiguriert
- [ ] Velocity-Erkennung aktiv
- [ ] Visual Feedback funktioniert
- [ ] Audit-Events werden geloggt

