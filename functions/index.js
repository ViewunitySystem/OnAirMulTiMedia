// Firebase Functions - Core API
import functions from 'firebase-functions';
import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health Check
app.get('/health', async (_req, res) => {
  try {
    await db.collection('_health').doc('ping').set({ ts: admin.firestore.Timestamp.now() }, { merge: true });
    res.json({ ok: true, region: process.env.FUNCTION_REGION || 'default' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Status
app.get('/status', async (_req, res) => {
  const snap = await db.collection('status').doc('kpis').get();
  const data = snap.exists ? snap.data() : {};
  res.json({
    uptimeSec: process.uptime() | 0,
    appsOnline: data.appsOnline || 1,
    modulesLoaded: (data.modulesLoaded || []).length,
    lastDeploy: data.lastDeploy || new Date().toISOString(),
  });
});

// Metrics
app.get('/metrics', async (_req, res) => {
  const m = (await db.collection('metrics').doc('public').get()).data() || {};
  res.json({
    stars: m.stars || 0,
    forks: m.forks || 0,
    releases: m.releases || 1,
    downloads: m.downloads || 0,
    updatedAt: new Date().toISOString(),
  });
});

// Audit Export
app.get('/audit/export', async (_req, res) => {
  const q = await db.collection('audit').orderBy('ts', 'desc').limit(1000).get();
  const rows = q.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(rows));
});

// RTC Config (Alternative zu Worker)
app.get('/rtc-config', async (_req, res) => {
  const secret = process.env.TURN_SHARED_SECRET || functions.config().turn?.secret;
  const realm = process.env.TURN_REALM || functions.config().turn?.realm;
  if (!secret || !realm) return res.status(500).json({ ok: false, error: 'TURN secret/realm missing' });
  
  const lifetimeSec = 3600;
  const username = `${Math.floor(Date.now()/1000) + lifetimeSec}`;
  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha1', secret).update(username).digest('base64');
  
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
      { urls: [`turn:${realm}:3478?transport=udp`, `turn:${realm}:3478?transport=tcp`], username, credential: hmac },
    ],
    ttl: lifetimeSec,
  });
});

export const api = functions.region('europe-west1').https.onRequest(app);