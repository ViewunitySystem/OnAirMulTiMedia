# SignalMirror

**Zweck:** Signal-Spiegelung zwischen verschiedenen Kommunikationskanälen (RF → WebRTC, SMS → Canvas, etc.)

## Features
- Multi-Adapter-Architektur
- Real-time Signal-Conversion
- License-Tracking
- Audit-Logging

## Usage
```typescript
import { mirror } from './src/mirror';
const result = await mirror({
  source: 'rf',
  target: 'webrtc', 
  payload: { frequency: 433.92, data: '...' }
});
```
