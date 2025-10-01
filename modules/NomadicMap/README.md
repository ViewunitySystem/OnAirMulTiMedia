# NomadicMap

**Zweck:** Dynamische Wegpunkt-Navigation und Pfad-Modellierung

## Features
- Flexible Waypoint-Struktur
- Pfad-Optimierung
- Hint-System für Navigation
- Mobile-First-Design

## Usage
```typescript
import { NomadicPath, empty } from './src/model';
const path: NomadicPath = {
  path: [
    { t: 'start', hint: 'Begin here' },
    { t: 'checkpoint1' },
    { t: 'finish', hint: 'End point' }
  ]
};
```

