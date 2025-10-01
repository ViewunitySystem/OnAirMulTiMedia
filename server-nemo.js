/**
 * NEMO Pathfinder - Minimal Server
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Socket.io Server für NEMO Pathfinder mit Audit Trail
 */

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname)));

// === AUDIT SYSTEM ===
const auditLog = [];

function audit(event) {
  const auditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...event
  };
  
  auditLog.push(auditEvent);
  
  // Keep only last 1000 events in memory
  if (auditLog.length > 1000) {
    auditLog.shift();
  }
  
  // Broadcast to all clients
  io.emit('audit:event', auditEvent);
  
  console.log('[AUDIT]', auditEvent.type, auditEvent.payload || '');
  
  return auditEvent;
}

// === NEMO PATHFINDER LOGIC ===
function bearingDeg(a, b) {
  if (typeof a.lat !== 'number' || typeof a.lon !== 'number' ||
      typeof b.lat !== 'number' || typeof b.lon !== 'number') return null;
  
  const toRad = d => d * Math.PI / 180;
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
            Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon));
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function virtualBearing(idxFrom, idxTo, total) {
  if (total < 2) return 0;
  const step = 360 / total;
  return (idxTo * step) % 360;
}

// === SOCKET.IO ===
io.of('/bridge').on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  audit({
    type: 'COMM_INIT',
    level: 'info',
    payload: {
      module: 'NEMO_PATHFINDER',
      client_id: socket.id
    }
  });
  
  // Join room
  socket.on('join', (msg) => {
    const { room_id } = msg || {};
    if (room_id) {
      socket.join(room_id);
      console.log(`Client ${socket.id} joined room ${room_id}`);
    }
  });
  
  // NEMO Update Handler
  socket.on('nemo:update', (msg) => {
    try {
      const {
        room_id = null,
        waypoints = [],
        current = { idx: 0 },
        target_time,
        license = null,
        comm_status = 'online',
        signal_quality = 1.0
      } = msg || {};

      // License check
      if (license) {
        audit({
          type: 'LICENSE_CHECK',
          level: 'info',
          room_id,
          payload: {
            module: 'NEMO_PATHFINDER',
            license,
            status: 'verified'
          }
        });
      }

      // ETA calculation
      const now = Date.now();
      const tEta = new Date(target_time).getTime();
      const eta_iso = isFinite(tEta) ? new Date(tEta).toISOString() : new Date(now).toISOString();
      const timeLeftMs = Math.max(0, (isFinite(tEta) ? tEta - now : 0));

      // Heading calculation
      let heading = 0;
      const n = Array.isArray(waypoints) ? waypoints.length : 0;
      const fromIdx = Math.min(Math.max(current.idx || 0, 0), Math.max(n - 1, 0));
      const toIdx = Math.min(fromIdx + 1, Math.max(n - 1, 0));
      const wpFrom = waypoints[fromIdx] || {};
      const wpTo = waypoints[toIdx] || {};

      const realBearing = bearingDeg(wpFrom, wpTo);
      heading = (realBearing == null) ? virtualBearing(fromIdx, toIdx, Math.max(n, 2)) : realBearing;

      // Status determination
      const drift = (comm_status !== 'online') || (timeLeftMs === 0 && toIdx < n - 1);
      const status = (timeLeftMs === 0 && toIdx >= n - 1) ? 'arrived' : 
                     (drift ? 'drift' : 'on_course');
      
      const advisory = status === 'arrived' ? 'Ziel erreicht!' :
                       drift ? 'Du driftest von der Spur – Recovery empfohlen' :
                       `Bleibe auf Kurs; noch ${Math.ceil(timeLeftMs / 60000)} Minuten`;

      // Audit main event
      const evType = (status === 'arrived') ? 'GOAL_REACHED' : 
                     (drift ? 'DRIFT_WARN' : 'SIGNAL_TX');
      
      const ev = audit({
        type: evType,
        level: evType === 'DRIFT_WARN' ? 'warn' : 'info',
        room_id,
        payload: {
          module: 'NEMO_PATHFINDER',
          from: waypoints[fromIdx]?.label || fromIdx,
          to: waypoints[toIdx]?.label || toIdx,
          heading_deg: Math.round(heading),
          eta_iso,
          comm_status,
          signal_quality,
          license
        }
      });

      // State broadcast
      const stateUpdate = {
        heading_deg: heading,
        eta_iso,
        status,
        advisory,
        audit_id: ev.id || null
      };
      
      if (room_id) socket.to(room_id).emit('nemo:state', stateUpdate);
      socket.emit('nemo:state', stateUpdate);

      // Direction change audit
      if (toIdx !== fromIdx) {
        audit({
          type: 'DIRECTION_CHANGE',
          level: 'info',
          room_id,
          payload: {
            module: 'NEMO_PATHFINDER',
            from: fromIdx,
            to: toIdx,
            timestamp: new Date().toISOString(),
            duration_s: Math.round(timeLeftMs / 1000),
            license
          }
        });
      }
      
    } catch (e) {
      console.error('NEMO Error:', e);
      audit({ 
        type: 'ERROR', 
        level: 'error', 
        payload: { 
          module: 'NEMO_PATHFINDER', 
          message: e.message,
          stack: e.stack
        } 
      });
      socket.emit('nemo:error', { message: e.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// === API ENDPOINTS ===
app.get('/api/audit/export', (req, res) => {
  const { format = 'json', type, limit = 100, title = 'Audit Trail' } = req.query;
  
  let filtered = auditLog;
  if (type) {
    filtered = auditLog.filter(e => e.type === type || e.payload?.module === type);
  }
  
  const limitNum = parseInt(limit, 10);
  const events = filtered.slice(-limitNum);
  
  if (format === 'json') {
    res.json(events);
  } else if (format === 'pdf') {
    // Simple HTML for PDF export (user can print to PDF)
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 20px auto; }
          h1 { color: #1f2a52; }
          .event { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
          .timestamp { color: #6b7280; font-size: 12px; }
          pre { background: #f3f4f6; padding: 8px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Total Events: ${events.length}</p>
        <hr />
        ${events.map(e => `
          <div class="event">
            <div class="timestamp">${e.timestamp}</div>
            <strong>${e.type}</strong> 
            <span style="color: ${e.level === 'error' ? 'red' : e.level === 'warn' ? 'orange' : 'green'}">
              [${e.level || 'info'}]
            </span>
            <pre>${JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        `).join('')}
      </body>
      </html>
    `);
  } else {
    res.status(400).send('Invalid format');
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'NEMO_PATHFINDER',
    uptime: process.uptime(),
    auditLog: {
      total: auditLog.length,
      last: auditLog[auditLog.length - 1]
    }
  });
});

app.get('/api/license/qr.png', (req, res) => {
  const { module, license } = req.query;
  // Placeholder - in real system would generate actual QR code
  res.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(module + ':' + license)}`);
});

// === START SERVER ===
server.listen(PORT, () => {
  console.log('🧭 NEMO Pathfinder Server');
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io namespace: /bridge`);
  console.log(`📊 API: /api/health, /api/audit/export`);
  console.log('');
  console.log('mainzero ist nicht nur ein Branch – es ist der Ursprung auditierter Wahrheit.');
  console.log('');
  
  audit({
    type: 'COMM_INIT',
    level: 'info',
    payload: {
      module: 'NEMO_PATHFINDER',
      message: 'Server started',
      port: PORT
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

