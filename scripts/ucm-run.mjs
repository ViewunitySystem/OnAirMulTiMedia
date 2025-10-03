import { spawn } from 'node:child_process';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG_PATH = path.resolve(__dirname, './ucm-config.json');
const OUT_DIR = path.resolve(process.cwd(), 'audit/console');
await mkdir(OUT_DIR, { recursive: true });
const DAY = new Date().toISOString().slice(0,10);
const OUT = path.join(OUT_DIR, `${DAY}.jsonl`);

// TEL Portal System spezifische Redaktion
const redact = (s='') => s
  .replace(/(api_key|token|secret)=([A-Za-z0-9-_]+)/gi, '$1=***')
  .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer ***')
  .replace(/(Werner8\/Werner8\/|FIREBASE_SA_|TEL1NL|back-ee052)/gi, '***')
  .replace(/(45\.87\.81\.214|digitalnotar\.in|tel1nl\.web\.app|back-ee052\.web\.app)/gi, '***');

const write = async (obj) => {
  try {
    await appendFile(OUT, JSON.stringify(obj) + '\n');
    console.log(`[UCM] Logged: ${obj.src} ${obj.level} - ${obj.msg?.substring(0,50)}...`);
  } catch (err) {
    console.error('[UCM] Write error:', err.message);
  }
};

const cfg = JSON.parse(await readFile(CFG_PATH, 'utf8'));

function attach(name, cmd, args=[], env={}){
  console.log(`[UCM] Starting process: ${name} (${cmd} ${args.join(' ')})`);
  const p = spawn(cmd, args, { env: { ...process.env, ...env }, shell: process.platform==='win32' });
  
  const pipe = (stream, level) => stream.on('data', async (buf)=>{
    const msg = redact(buf.toString().trim());
    if (msg) {
      await write({ 
        ts: new Date().toISOString(), 
        src: name, 
        level, 
        msg,
        meta: { pid: p.pid, cmd: `${cmd} ${args.join(' ')}` }
      });
    }
  });
  
  pipe(p.stdout, 'info'); 
  pipe(p.stderr, 'error');
  
  p.on('exit', async (code)=> {
    await write({ 
      ts: new Date().toISOString(), 
      src: name, 
      level: 'info', 
      msg: `Process exited with code ${code}`,
      meta: { pid: p.pid, exitCode: code }
    });
  });
  
  p.on('error', async (err) => {
    await write({ 
      ts: new Date().toISOString(), 
      src: name, 
      level: 'error', 
      msg: `Process error: ${err.message}`,
      meta: { pid: p.pid, error: err.code }
    });
  });
  
  return p;
}

// Starte/attach laut config (ereignisgetrieben – kein busy loop)
console.log('[UCM] Starting TEL Portal System monitoring...');
const procs = cfg.processes.map(p => attach(p.name, p.cmd, p.args, p.env));

// HTTP Ingest für Browser/SW/CI mit TEL-spezifischen Endpunkten
const server = http.createServer(async (req, res) => {
  // CORS Headers für Cross-Origin Requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200).end();
    return;
  }
  
  if (req.method === 'POST' && (req.url === '/log' || req.url === '/OnAirMulTiMedia/log')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const ev = JSON.parse(body);
        ev.ts = ev.ts || new Date().toISOString();
        ev.src = ev.src || 'unknown';
        ev.level = ev.level || 'info';
        ev.meta = { ...ev.meta, endpoint: req.url, ip: req.connection.remoteAddress };
        await write(ev);
        res.writeHead(204).end();
      } catch (err) {
        console.error('[UCM] Invalid JSON:', err.message);
        res.writeHead(400).end();
      }
    });
    return;
  }
  
  // Health Check Endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      processes: procs.length,
      uptime: process.uptime()
    }));
    return;
  }
  
  res.writeHead(404).end();
});

const port = cfg.port || 3737;
server.listen(port, () => {
  console.log(`[UCM] TEL Portal System Monitor running on port ${port}`);
  console.log(`[UCM] Endpoints: http://localhost:${port}/log, http://localhost:${port}/OnAirMulTiMedia/log`);
  console.log(`[UCM] Health: http://localhost:${port}/health`);
  console.log(`[UCM] Logs: ${OUT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[UCM] Shutting down...');
  procs.forEach(p => p.kill());
  server.close(() => process.exit(0));
});

// Rotation Hinweis (optional in CI): Neue Datei täglich (neuer Run), keine Endlosschleife notwendig.
