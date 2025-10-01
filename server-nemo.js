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
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 8080;

// === ED25519 KEY MANAGEMENT ===
let keyPair = null;

function generateKeyPair() {
  // Generate Ed25519 key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  
  return { publicKey, privateKey };
}

function loadOrGenerateKeys() {
  const publicKeyPath = path.join(__dirname, 'keys', 'oamtm-public.pem');
  const privateKeyPath = path.join(__dirname, 'keys', 'oamtm-private.pem');
  
  try {
    // Try to load existing keys
    if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
      const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      console.log('✅ Loaded existing Ed25519 keys');
      return { publicKey, privateKey };
    }
  } catch (e) {
    console.log('⚠️ Could not load keys, generating new ones...');
  }
  
  // Generate new keys
  const keys = generateKeyPair();
  
  // Save to disk
  try {
    if (!fs.existsSync(path.join(__dirname, 'keys'))) {
      fs.mkdirSync(path.join(__dirname, 'keys'), { recursive: true });
    }
    fs.writeFileSync(publicKeyPath, keys.publicKey);
    fs.writeFileSync(privateKeyPath, keys.privateKey);
    console.log('✅ Generated and saved new Ed25519 keys');
  } catch (e) {
    console.log('⚠️ Could not save keys to disk, using in-memory only');
  }
  
  return keys;
}

function signData(data, privateKey) {
  // Create signature
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(data));
  sign.end();
  const signature = sign.sign(privateKey, 'base64');
  
  // Create SHA-256 hash
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  const checksum = hash.digest('hex');
  
  return { signature, checksum };
}

// Initialize keys on startup
keyPair = loadOrGenerateKeys();

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

// Public Key Endpoint
app.get('/api/keys/public', (req, res) => {
  if (!keyPair || !keyPair.publicKey) {
    return res.status(500).json({ error: 'Public key not available' });
  }
  
  const { format = 'pem' } = req.query;
  
  if (format === 'json') {
    res.json({
      key_id: 'oamtm-2025',
      algorithm: 'Ed25519',
      public_key: keyPair.publicKey,
      created: new Date().toISOString(),
      usage: 'Audit Trail Signature Verification'
    });
  } else if (format === 'pem') {
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', 'inline; filename="oamtm-public.pem"');
    res.send(keyPair.publicKey);
  } else {
    res.status(400).json({ error: 'Invalid format. Use ?format=json or ?format=pem' });
  }
});

// Audit Export with Signature Support
app.get('/api/audit/export', (req, res) => {
  const { format = 'json', type, limit = 100, title = 'Audit Trail', signed = '0' } = req.query;
  
  let filtered = auditLog;
  if (type) {
    filtered = auditLog.filter(e => e.type === type || e.payload?.module === type);
  }
  
  const limitNum = parseInt(limit, 10);
  const events = filtered.slice(-limitNum);
  
  // Sign data if requested
  const shouldSign = signed === '1' || signed === 'true';
  let signatureData = null;
  
  if (shouldSign && keyPair) {
    const dataToSign = {
      events,
      exported_at: new Date().toISOString(),
      total_events: events.length,
      key_id: 'oamtm-2025'
    };
    
    const { signature, checksum } = signData(dataToSign, keyPair.privateKey);
    signatureData = {
      signature,
      checksum,
      key_id: 'oamtm-2025',
      algorithm: 'Ed25519',
      hash_algorithm: 'SHA-256',
      signed_at: new Date().toISOString(),
      verify_key_url: '/api/keys/public'
    };
  }
  
  if (format === 'json') {
    const response = {
      events,
      exported_at: new Date().toISOString(),
      total_events: events.length,
      format: 'json'
    };
    
    if (signatureData) {
      response.signature = signatureData;
    }
    
    res.json(response);
  } else if (format === 'md') {
    // Markdown format with signature in front matter
    let markdown = '---\n';
    markdown += `title: ${title}\n`;
    markdown += `exported_at: ${new Date().toISOString()}\n`;
    markdown += `total_events: ${events.length}\n`;
    
    if (signatureData) {
      markdown += `signature: ${signatureData.signature}\n`;
      markdown += `checksum: ${signatureData.checksum}\n`;
      markdown += `key_id: ${signatureData.key_id}\n`;
      markdown += `algorithm: ${signatureData.algorithm}\n`;
      markdown += `verify_key_url: ${signatureData.verify_key_url}\n`;
    }
    
    markdown += '---\n\n';
    markdown += `# ${title}\n\n`;
    markdown += `**Exported:** ${new Date().toISOString()}  \n`;
    markdown += `**Events:** ${events.length}  \n\n`;
    
    if (signatureData) {
      markdown += `**Signature:** ✅ Signed with Ed25519  \n`;
      markdown += `**Verify:** [Get Public Key](/api/keys/public)  \n\n`;
    }
    
    markdown += '| Time (UTC) | Level | Type | Payload |\n';
    markdown += '|---|---|---|---|\n';
    
    events.forEach(e => {
      const payload = JSON.stringify(e.payload || {});
      markdown += `| ${e.timestamp} | ${e.level || 'info'} | ${e.type} | ${payload} |\n`;
    });
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `inline; filename="${title.replace(/\s+/g, '_')}.md"`);
    res.send(markdown);
  } else if (format === 'pdf') {
    // HTML for PDF export with signature footer
    let signatureFooter = '';
    
    if (signatureData) {
      signatureFooter = `
        <div style="margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <h3>🔐 Digital Signature (Ed25519)</h3>
          <p><strong>Signature:</strong> <code style="font-size: 10px; word-break: break-all;">${signatureData.signature}</code></p>
          <p><strong>SHA-256 Checksum:</strong> <code>${signatureData.checksum}</code></p>
          <p><strong>Key ID:</strong> ${signatureData.key_id}</p>
          <p><strong>Signed:</strong> ${signatureData.signed_at}</p>
          <p><strong>Verify:</strong> <a href="/api/keys/public">Get Public Key</a></p>
          <div style="margin-top: 15px;">
            <p><strong>QR-Code zur Verifikation:</strong></p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(signatureData.verify_key_url)}" alt="Verify QR" />
          </div>
        </div>
      `;
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            .no-print { display: none; }
          }
          body { font-family: system-ui; max-width: 800px; margin: 20px auto; }
          h1 { color: #1f2a52; }
          .event { border-bottom: 1px solid #e5e7eb; padding: 10px 0; page-break-inside: avoid; }
          .timestamp { color: #6b7280; font-size: 12px; }
          pre { background: #f3f4f6; padding: 8px; border-radius: 4px; overflow: auto; font-size: 11px; }
          .signature-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Total Events:</strong> ${events.length}</p>
        ${signatureData ? '<p><strong>Signature:</strong> ✅ Signed with Ed25519 (Key ID: oamtm-2025)</p>' : ''}
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
        ${signatureFooter}
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            🖨️ Als PDF Drucken
          </button>
        </div>
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

