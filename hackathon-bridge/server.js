import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { Server as IOServer } from 'socket.io';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import Ajv from 'ajv';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'audit.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --- Database init (synchronous, safe for boot) ---
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  variant TEXT,
  capabilities TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER,
  closed_at INTEGER
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id TEXT,
  session_id TEXT,
  joined_at INTEGER,
  PRIMARY KEY (room_id, session_id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  level TEXT NOT NULL,
  type TEXT NOT NULL,
  session_id TEXT,
  room_id TEXT,
  target TEXT,
  payload TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  session_id TEXT,
  user_id TEXT,
  body TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT,
  path TEXT,
  size INTEGER,
  uploader_session_id TEXT,
  room_id TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS github_stats (
  ts INTEGER PRIMARY KEY,
  repo TEXT NOT NULL,
  stars INTEGER,
  forks INTEGER,
  watchers INTEGER,
  open_issues INTEGER,
  release_count INTEGER,
  release_downloads INTEGER,
  latest_release_tag TEXT
);

CREATE TABLE IF NOT EXISTS user_contribs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  content TEXT NOT NULL,
  created_at INTEGER,
  approved INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  blueprint_json TEXT NOT NULL,
  regulatory_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS module_checklists (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  item TEXT NOT NULL,
  status INTEGER DEFAULT 0,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS open_core_manifest (
  version TEXT PRIMARY KEY,
  markdown TEXT NOT NULL,
  created_at INTEGER
);
`);

// --- Express app ---
const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1gb' }));
app.use(morgan('dev'));

// Static public (overlay + test client)
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// COOP/COEP not set to allow 3rd-party embeds like YouTube in inlay

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = nanoid();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({ storage });

// --- Audit helper ---
const insertEvent = db.prepare(`INSERT INTO events (id, ts, level, type, session_id, room_id, target, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`);
function audit({ level = 'info', type, session_id = null, room_id = null, target = null, payload = {} }) {
  const id = nanoid();
  const ts = Date.now();
  const event = { id, ts, level, type, session_id, room_id, target, payload };
  insertEvent.run(id, ts, level, type, session_id, room_id, target, JSON.stringify(payload));
  io.of('/audit').emit('audit:event', event);
  return event;
}

// --- REST API ---
// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Register variant/capabilities (optional, but auditable)
app.post('/api/variant/register', (req, res) => {
  const { userId, variant, capabilities } = req.body || {};
  const session_id = nanoid();
  audit({ type: 'variant_register', payload: { userId, variant, capabilities }, session_id });
  res.json({ session_id });
});

// Rooms
const createRoomStmt = db.prepare('INSERT INTO rooms (id, name, created_by, created_at) VALUES (?, ?, ?, ?);');
app.post('/api/rooms', (req, res) => {
  const { name, created_by } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = nanoid();
  createRoomStmt.run(id, name, created_by || null, Date.now());
  const ev = audit({ type: 'room_create', payload: { id, name, created_by } });
  res.json({ id, name, created_by, event: ev });
});

app.get('/api/rooms', (req, res) => {
  const rows = db.prepare('SELECT * FROM rooms ORDER BY created_at DESC;').all();
  res.json(rows);
});

// Logs query
app.get('/api/logs', (req, res) => {
  const { type, level, room_id, session_id, limit = 200 } = req.query;
  const clauses = [];
  const params = {};
  if (type) { clauses.push('type = @type'); params.type = type; }
  if (level) { clauses.push('level = @level'); params.level = level; }
  if (room_id) { clauses.push('room_id = @room_id'); params.room_id = room_id; }
  if (session_id) { clauses.push('session_id = @session_id'); params.session_id = session_id; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT * FROM events ${where} ORDER BY ts DESC LIMIT @limit;`);
  const rows = stmt.all({ ...params, limit: Number(limit) });
  res.json(rows.map(r => ({ ...r, payload: JSON.parse(r.payload || '{}') })));
});

// Messages fetch
app.get('/api/messages', (req, res) => {
  const { room_id, limit = 100 } = req.query;
  if (!room_id) return res.status(400).json({ error: 'room_id required' });
  const stmt = db.prepare('SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?;');
  const rows = stmt.all(room_id, Number(limit));
  res.json(rows);
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  const f = req.file;
  const { room_id = null, uploader_session_id = null } = req.body || {};
  const id = nanoid();
  const insert = db.prepare('INSERT INTO files (id, filename, path, size, uploader_session_id, room_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);');
  insert.run(id, f.originalname, f.filename, f.size, uploader_session_id, room_id, Date.now());
  const fileInfo = { id, url: `/uploads/${f.filename}`, name: f.originalname, size: f.size, room_id };
  audit({ type: 'file_upload', session_id: uploader_session_id, room_id, payload: fileInfo });
  res.json(fileInfo);
});

app.get('/api/files', (req, res) => {
  const { room_id } = req.query;
  const rows = room_id
    ? db.prepare('SELECT * FROM files WHERE room_id = ? ORDER BY created_at DESC;').all(room_id)
    : db.prepare('SELECT * FROM files ORDER BY created_at DESC;').all();
  res.json(rows.map(r => ({ id: r.id, name: r.filename, url: `/uploads/${r.path}`, size: r.size, room_id: r.room_id, created_at: r.created_at })));
});

// ---------------- GitHub Monitoring ----------------
const GITHUB_REPO = process.env.GITHUB_REPO || 'ViewunitySystem/OnAirMulTiMedia';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

async function fetchGitHubJSON(endpoint){
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${endpoint}`);
  return res.json();
}

const insertGH = db.prepare(`INSERT OR REPLACE INTO github_stats (ts, repo, stars, forks, watchers, open_issues, release_count, release_downloads, latest_release_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`);

async function refreshGitHubStats(){
  const ts = Date.now();
  try {
    const repo = await fetchGitHubJSON(`/repos/${GITHUB_REPO}`);
    const releases = await fetchGitHubJSON(`/repos/${GITHUB_REPO}/releases?per_page=100`);
    let downloads = 0; let latestTag = null;
    for (const r of releases){
      latestTag = latestTag || r.tag_name;
      for (const a of (r.assets || [])) downloads += a.download_count || 0;
    }
    insertGH.run(ts, GITHUB_REPO, repo.stargazers_count||0, repo.forks_count||0, repo.subscribers_count||0, repo.open_issues_count||0, releases.length||0, downloads, latestTag||null);
    const payload = { ts, repo: GITHUB_REPO, stars: repo.stargazers_count, forks: repo.forks_count, watchers: repo.subscribers_count, open_issues: repo.open_issues_count, release_count: releases.length, release_downloads: downloads, latest_release_tag: latestTag };
    audit({ type: 'github_update', level: 'info', payload });
    return payload;
  } catch (e){
    audit({ type: 'github_error', level: 'error', payload: { message: e.message } });
    throw e;
  }
}

app.get('/api/github/stats', (req,res)=>{
  const row = db.prepare('SELECT * FROM github_stats ORDER BY ts DESC LIMIT 1;').get();
  if (!row) return res.status(404).json({ error: 'no stats yet' });
  res.json(row);
});

app.get('/api/github/history', (req,res)=>{
  const limit = Number(req.query.limit || 200);
  const rows = db.prepare('SELECT * FROM github_stats ORDER BY ts DESC LIMIT ?;').all(limit);
  res.json(rows);
});

app.post('/api/github/refresh', async (req,res)=>{
  const key = req.headers['x-admin-key'] || '';
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  try { const payload = await refreshGitHubStats(); res.json(payload); } catch (e){ res.status(500).json({ error: e.message }); }
});

// Schedule refresh every 10 minutes
setInterval(()=>{ refreshGitHubStats().catch(()=>{}); }, 10 * 60 * 1000);
refreshGitHubStats().catch(()=>{});

// ---------------- User-Contributed Info ----------------
const insertContrib = db.prepare('INSERT INTO user_contribs (id, user_id, content, created_at, approved) VALUES (?, ?, ?, ?, 0);');
const listContribs = db.prepare('SELECT * FROM user_contribs WHERE approved = 1 ORDER BY created_at DESC LIMIT ?;');
const approveContrib = db.prepare('UPDATE user_contribs SET approved = 1 WHERE id = ?;');

app.get('/api/contribs', (req,res)=>{
  const limit = Number(req.query.limit || 100);
  const rows = listContribs.all(limit);
  res.json(rows);
});

app.post('/api/contribs', (req,res)=>{
  const { user_id = 'anon', content } = req.body || {};
  if (!content || typeof content !== 'string' || content.length < 5) return res.status(400).json({ error:'content too short' });
  if (content.length > 2000) return res.status(400).json({ error:'content too long' });
  const id = nanoid();
  insertContrib.run(id, String(user_id).slice(0,64), content, Date.now());
  audit({ type:'contrib_submit', payload:{ id, user_id } });
  res.json({ id, queued: true });
});

app.post('/api/contribs/:id/approve', (req,res)=>{
  const key = req.headers['x-admin-key'] || '';
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  approveContrib.run(req.params.id);
  audit({ type:'contrib_approve', payload:{ id: req.params.id } });
  res.json({ ok: true });
});

// ---------------- Blueprint Validation ----------------
const schemaPath = path.join(PUBLIC_DIR, 'schemas', 'blueprint.schema.json');
const ensureDir = (p)=> {try{fs.mkdirSync(p,{recursive:true})}catch(e){}};
ensureDir(path.dirname(schemaPath));

let blueprintSchema = {};
let validateBlueprint = ()=>true;

try {
  if (fs.existsSync(schemaPath)) {
    blueprintSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const ajv = new Ajv({ allErrors: true, strict: false });
    validateBlueprint = ajv.compile(blueprintSchema);
  }
} catch(e){ console.warn('Blueprint schema not loaded:', e.message); }

const insertModule = db.prepare('INSERT INTO modules (id, name, description, blueprint_json, regulatory_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);');
const updateModule = db.prepare('UPDATE modules SET name=?, description=?, blueprint_json=?, regulatory_json=?, updated_at=? WHERE id=?;');
const getModule = db.prepare('SELECT * FROM modules WHERE id = ?;');
const listModulesStmt = db.prepare('SELECT id, name, description, created_at, updated_at FROM modules ORDER BY created_at DESC;');
const insertChecklist = db.prepare('INSERT INTO module_checklists (id, module_id, item, status, updated_at) VALUES (?, ?, ?, ?, ?);');
const listChecklist = db.prepare('SELECT id, item, status, updated_at FROM module_checklists WHERE module_id = ? ORDER BY updated_at DESC;');
const updateChecklistItem = db.prepare('UPDATE module_checklists SET status = ?, updated_at = ? WHERE id = ? AND module_id = ?;');

function seedChecklist(module_id){
  const defaults = ['Modul initialisiert korrekt','Lizenzprüfung erfolgt lokal','Signalpfad dokumentiert','Recovery bei Fehler getestet'];
  for (const item of defaults){
    insertChecklist.run(nanoid(), module_id, item, 0, Date.now());
  }
}

app.get('/api/schema/blueprint', (req,res)=> res.json(blueprintSchema));

app.post('/api/modules/register', (req,res)=>{
  const bp = req.body;
  const valid = validateBlueprint(bp);
  if (!valid) return res.status(400).json({ error: 'invalid_blueprint', details: validateBlueprint.errors });
  const id = bp.module;
  const name = bp.module;
  const desc = bp.description || '';
  const now = Date.now();
  const reg = JSON.stringify(bp.regulatory || {});
  const existing = getModule.get(id);
  if (existing) {
    updateModule.run(name, desc, JSON.stringify(bp), reg, now, id);
  } else {
    insertModule.run(id, name, desc, JSON.stringify(bp), reg, now, now);
    seedChecklist(id);
  }
  audit({ type:'module_register', payload:{ id, name } });
  res.json({ id, ok: true });
});

app.get('/api/modules', (req,res)=>{ res.json(listModulesStmt.all()); });
app.get('/api/modules/:id', (req,res)=>{
  const row = getModule.get(req.params.id);
  if (!row) return res.status(404).json({ error:'not_found' });
  res.json({ ...row, blueprint_json: JSON.parse(row.blueprint_json||'{}'), regulatory_json: JSON.parse(row.regulatory_json||'{}') });
});
app.get('/api/modules/:id/checklist', (req,res)=>{ res.json(listChecklist.all(req.params.id)); });
app.post('/api/modules/:id/checklist', (req,res)=>{
  const { id, status } = req.body || {};
  if (!id || typeof status !== 'number') return res.status(400).json({ error:'id+status required' });
  updateChecklistItem.run(status ? 1 : 0, Date.now(), id, req.params.id);
  audit({ type:'checklist_update', payload:{ module_id: req.params.id, item_id: id, status: !!status } });
  res.json({ ok:true });
});

// ---------------- Audit Export (JSON, Markdown, PDF+QR) ----------------
function fetchEvents({ type=null, room_id=null, session_id=null, limit=1000 }){
  const clauses=[]; const params={};
  if (type) { clauses.push('type = @type'); params.type = type; }
  if (room_id) { clauses.push('room_id = @room_id'); params.room_id = room_id; }
  if (session_id) { clauses.push('session_id = @session_id'); params.session_id = session_id; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT * FROM events ${where} ORDER BY ts ASC LIMIT @limit;`);
  const rows = stmt.all({ ...params, limit });
  return rows.map(r => ({ ...r, payload: JSON.parse(r.payload || '{}') }));
}

function toMarkdown(title, events){
  const lines = [`# ${title}`, '', `Export: ${new Date().toISOString()}`, '', '| time | level | type | session | room | payload |', '|---|---|---|---|---|---|'];
  for (const e of events){
    lines.push(`| ${new Date(e.ts).toISOString()} | ${e.level} | ${e.type} | ${e.session_id||''} | ${e.room_id||''} | \`${JSON.stringify(e.payload)}\` |`);
  }
  return lines.join('\n');
}

async function generatePDF(title, events, jsonLink){
  const outDir = path.join(DATA_DIR, 'exports'); ensureDir(outDir);
  const file = path.join(outDir, `export-${nanoid()}.pdf`);
  return new Promise(async (resolve, reject)=>{
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(file);
      doc.pipe(stream);

      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Export: ${new Date().toISOString()}`);
      doc.moveDown(0.5);

      if (jsonLink){
        const qrDataUrl = await QRCode.toDataURL(jsonLink, { margin: 1, scale: 4 });
        const base64 = qrDataUrl.split(',')[1];
        const buf = Buffer.from(base64, 'base64');
        doc.image(buf, { fit: [120,120], align: 'left' });
        doc.text('JSON Export', 170, 100);
        doc.moveDown(2);
      }

      doc.fillColor('black');
      doc.fontSize(12).text('Timeline', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);
      for (const e of events){
        doc.text(`${new Date(e.ts).toISOString()}  [${e.level}]  ${e.type}`);
        if (e.session_id || e.room_id) doc.fillColor('#555').text(`session:${e.session_id||'-'}  room:${e.room_id||'-'}`);
        doc.fillColor('#333').text(JSON.stringify(e.payload));
        doc.fillColor('#999').moveDown(0.2).text('—');
        doc.fillColor('black');
      }

      doc.end();
      stream.on('finish', ()=> resolve(file));
      stream.on('error', reject);
    } catch (err){ reject(err); }
  });
}

app.get('/api/audit/export', async (req,res)=>{
  try {
    const { format = 'json', type = null, room_id = null, session_id = null, title = 'Audit Export' } = req.query;
    const limit = Math.min(Number(req.query.limit || 1000), 5000);
    const events = fetchEvents({ type, room_id, session_id, limit });
    if (format === 'json') return res.json({ title, generated_at: Date.now(), events });
    if (format === 'md')  return res.type('text/markdown').send(toMarkdown(title, events));
    if (format === 'pdf'){
      const jsonURL = `${req.protocol}://${req.get('host')}${req.path}?${new URLSearchParams({ format: 'json', type: type||'', room_id: room_id||'', session_id: session_id||'', limit: String(limit), title })}`;
      const file = await generatePDF(String(title), events, jsonURL);
      return res.download(file, path.basename(file));
    }
    return res.status(400).json({ error:'unsupported format' });
  } catch (e){ res.status(500).json({ error: e.message }); }
});

// ---------------- Open-Core Manifest ----------------
const insertManifest = db.prepare('INSERT OR REPLACE INTO open_core_manifest (version, markdown, created_at) VALUES (?, ?, ?);');
const getManifest = db.prepare('SELECT * FROM open_core_manifest ORDER BY created_at DESC LIMIT 1;');
const listManifest = db.prepare('SELECT version, created_at FROM open_core_manifest ORDER BY created_at DESC;');
const readManifest = db.prepare('SELECT * FROM open_core_manifest WHERE version = ?;');

(function seedManifest(){
  const row = getManifest.get();
  if (!row){
    const md = `# Open-Core Manifest für auditierbare Kommunikation\n\n**Kernprinzipien**: Modularität • Auditierbarkeit • Legalität • Community-Validierung\n\n## §1 Architektur\n- Bridge, Overlay, Info-Board, Blueprints\n\n## §2 Audit-Trail\n- Ereignisse mit Zeitstempel, Export JSON/MD/PDF+QR\n\n## §3 Lizenzierung\n- Modul-bezogene Lizenzfelder im Blueprint\n\n## §4 Regulatorische Pfade\n- Referenzen je Modul\n\n## §5 UI als Kommunikationsraum\n- Inlay/Embeds, Gruppenräume, Synchronisation`;
    insertManifest.run('v1.0.0-audit', md, Date.now());
  }
})();

app.get('/api/manifest', (req,res)=>{
  const row = getManifest.get();
  if (!row) return res.status(404).json({ error:'not_found' });
  res.json(row);
});
app.get('/api/manifest/versions', (req,res)=>{ res.json(listManifest.all()); });
app.get('/api/manifest/:version', (req,res)=>{
  const row = readManifest.get(req.params.version);
  if (!row) return res.status(404).json({ error:'not_found' });
  res.json(row);
});
app.post('/api/manifest', (req,res)=>{
  const key = req.headers['x-admin-key'] || '';
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  const { version, markdown } = req.body || {};
  if (!version || !markdown) return res.status(400).json({ error:'version+markdown required' });
  insertManifest.run(version, markdown, Date.now());
  audit({ type:'manifest_update', payload:{ version } });
  res.json({ ok: true });
});

// --- HTTP + Socket.IO ---
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: '*' },
});

// Namespaces: /bridge for app users, /audit for overlay
const bridge = io.of('/bridge');
const auditNS = io.of('/audit');

// Session bookkeeping
const insertSession = db.prepare('INSERT INTO sessions (id, user_id, variant, capabilities, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);');
const closeSession = db.prepare('UPDATE sessions SET closed_at = ? WHERE id = ?;');
const addMember = db.prepare('INSERT OR REPLACE INTO room_members (room_id, session_id, joined_at) VALUES (?, ?, ?);');
const removeMember = db.prepare('DELETE FROM room_members WHERE room_id = ? AND session_id = ?;');
const addMessage = db.prepare('INSERT INTO messages (id, room_id, session_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?);');

bridge.on('connection', (socket) => {
  const session_id = nanoid();
  const user_id = socket.handshake.auth?.userId || socket.handshake.query?.userId || `user_${session_id.slice(0,6)}`;
  const variant = socket.handshake.auth?.variant || socket.handshake.query?.variant || null;
  const capabilities = socket.handshake.auth?.capabilities || socket.handshake.query?.capabilities || null;
  const ip = socket.handshake.address;
  const user_agent = socket.handshake.headers['user-agent'] || '';

  insertSession.run(session_id, user_id, variant, typeof capabilities === 'string' ? capabilities : JSON.stringify(capabilities || {}), ip, user_agent, Date.now());
  audit({ type: 'session_open', session_id, payload: { user_id, variant, ip } });

  socket.emit('bridge:welcome', { session_id, user_id });

  socket.on('disconnect', (reason) => {
    closeSession.run(Date.now(), session_id);
    audit({ type: 'session_close', session_id, payload: { reason } });
  });

  // Join / Leave rooms
  socket.on('room:join', ({ room_id }) => {
    if (!room_id) return;
    socket.join(room_id);
    addMember.run(room_id, session_id, Date.now());
    audit({ type: 'room_join', session_id, room_id, payload: { user_id } });
    bridge.to(room_id).emit('room:member_joined', { room_id, user_id, session_id });
  });

  socket.on('room:leave', ({ room_id }) => {
    if (!room_id) return;
    socket.leave(room_id);
    removeMember.run(room_id, session_id);
    audit({ type: 'room_leave', session_id, room_id, payload: { user_id } });
    bridge.to(room_id).emit('room:member_left', { room_id, user_id, session_id });
  });

  // Text message to room
  socket.on('msg:send', ({ room_id, body }) => {
    if (!room_id || !body) return;
    const id = nanoid();
    addMessage.run(id, room_id, session_id, user_id, body, Date.now());
    const msg = { id, room_id, session_id, user_id, body };
    audit({ type: 'message', session_id, room_id, payload: msg });
    bridge.to(room_id).emit('msg:new', msg);
  });

  // Typing indicator
  socket.on('typing', ({ room_id, status }) => {
    if (!room_id) return;
    audit({ type: 'typing', session_id, room_id, payload: { user_id, status: !!status } });
    bridge.to(room_id).emit('typing', { user_id, status: !!status });
  });

  // WebRTC signaling relay (offer/answer/ice) with optional target session
  const relay = (type, data) => {
    const { room_id, target_session_id = null, sdp = null, candidate = null, label = null } = data || {};
    const payload = { from: session_id, user_id, room_id, target_session_id, sdp, candidate, label };
    audit({ type, session_id, room_id, target: target_session_id, payload });
    if (target_session_id) {
      const targetSocket = [...bridge.sockets.values()].find(s => s.data?.session_id === target_session_id);
      if (targetSocket) targetSocket.emit(`webrtc:${type}`, payload);
    } else if (room_id) {
      socket.to(room_id).emit(`webrtc:${type}`, payload);
    }
  };
  socket.data.session_id = session_id;
  socket.on('webrtc:offer', (d) => relay('offer', d));
  socket.on('webrtc:answer', (d) => relay('answer', d));
  socket.on('webrtc:ice', (d) => relay('ice', d));

  // File shared to room (announce)
  socket.on('file:shared', ({ room_id, file }) => {
    if (!room_id || !file) return;
    audit({ type: 'file_shared', session_id, room_id, payload: { file, user_id } });
    bridge.to(room_id).emit('file:shared', { room_id, file, user_id });
  });

  // Inlay/Embed open & close (broadcast to room)
  socket.on('inlay:open', ({ room_id, url, title }) => {
    if (!url) return;
    audit({ type: 'inlay_open', session_id, room_id, payload: { url, title, user_id } });
    if (room_id) bridge.to(room_id).emit('inlay:open', { url, title, opened_by: user_id });
    else socket.emit('inlay:open', { url, title, opened_by: user_id });
  });

  socket.on('inlay:close', ({ room_id }) => {
    audit({ type: 'inlay_close', session_id, room_id, payload: { user_id } });
    if (room_id) bridge.to(room_id).emit('inlay:close', { closed_by: user_id });
    else socket.emit('inlay:close', { closed_by: user_id });
  });
});

// Audit namespace has read-only events; supports basic queries via socket
auditNS.on('connection', (socket) => {
  socket.emit('audit:hello', { ok: true });
  socket.on('audit:query', ({ type = null, room_id = null, limit = 200 }) => {
    const clauses = [];
    const params = {};
    if (type) { clauses.push('type = @type'); params.type = type; }
    if (room_id) { clauses.push('room_id = @room_id'); params.room_id = room_id; }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const stmt = db.prepare(`SELECT * FROM events ${where} ORDER BY ts DESC LIMIT @limit;`);
    const rows = stmt.all({ ...params, limit: Number(limit) });
    socket.emit('audit:results', rows.map(r => ({ ...r, payload: JSON.parse(r.payload || '{}') })));
  });
});

server.listen(PORT, () => {
  console.log(`OAMTM Hackathon Bridge listening on http://localhost:${PORT}`);
  console.log(`Overlay UI: http://localhost:${PORT}/overlay.html`);
  console.log(`Test Client: http://localhost:${PORT}/client.html`);
  console.log(`Info Dashboard: http://localhost:${PORT}/info.html`);
  console.log(`Blueprints & Checklisten: http://localhost:${PORT}/blueprints.html`);
  console.log(`Manifest (versioniert): http://localhost:${PORT}/manifest.html`);
  console.log(`Regulatory: http://localhost:${PORT}/regulatory.html`);
  console.log(`Audit Export: http://localhost:${PORT}/audit-export.html`);
});
