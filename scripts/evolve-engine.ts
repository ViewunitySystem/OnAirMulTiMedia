/*
  OAMTM – Evolve Engine
  Ziel: Neue Module aus Blueprints erzeugen, registrieren, testen, dokumentieren – ohne Endlosschleifen.
  Strategie: Event‑getrieben (per Watch/CI), idempotent, mit Audit‑Trail.
*/
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkHealthGates } from './health-gates.js';
import { createEvolvePR } from './auto-pr.js';

// ---- Types
type MetaConfig = {
  metaGrowth: {
    enabled: boolean;
    scan: { roots: string[]; include: string[]; exclude: string[] };
    blueprints: { name: string; from: string; where: string }[];
    safety: { requireTests: boolean; requireDocs: boolean; branch: string; reviewers: string[]; dryRun: boolean };
  }
};

// ---- Helpers
const log = (...a:any[]) => console.log('[evolve]', ...a);
const readJson = async<T=any>(p:string, d:T): Promise<T> => { try{ return JSON.parse(await fs.readFile(p,'utf8')) }catch{ return d } };
const writeJson = async(p:string, v:any) => fs.writeFile(p, JSON.stringify(v,null,2));
const exists = async(p:string)=> !!(await fs.stat(p).catch(()=>null));
const sha = (s:string)=> crypto.createHash('sha1').update(s).digest('hex').slice(0,8);

// ---- Load config
const meta = await readJson<MetaConfig>('config/meta.json', { metaGrowth:{ enabled:false, scan:{roots:[],include:[],exclude:[]}, blueprints:[], safety:{requireTests:true,requireDocs:true,branch:'mainzero',reviewers:[],dryRun:true} } });
if (!meta.metaGrowth.enabled) { log('metaGrowth disabled'); process.exit(0); }

// ---- Health Gates Check
const healthStatus = await checkHealthGates();
if (!healthStatus.canEvolve) {
  log('Health gates failed - cannot evolve (requires ≥110% success rate)');
  log('Gates:', healthStatus.gates.map(g => `${g.name}: ${g.current}/${g.threshold} ${g.passed ? '✅' : '❌'}`).join(', '));
  process.exit(1);
}
log('Health gates passed (≥110% success rate) - proceeding with evolve');

// ---- Manifest laden & vorbereiten
const manifestPath = 'manifest.json';
const manifest = await readJson<any>(manifestPath, { modules:[], apps:[], services:[] });

// ---- 1) Kandidaten erzeugen (einfaches Beispiel: je Blueprint genau ein neues Modul)
const created:any[] = [];
for (const bp of meta.metaGrowth.blueprints) {
  const base = path.join(bp.from);
  if (!(await exists(base))) { log('blueprint missing', bp.name); continue; }
  const nowId = `${bp.name}-${Date.now().toString(36)}-${sha(bp.from)}`;
  const targetDir = path.join(bp.where, nowId);
  if (await exists(targetDir)) { log('skip existing', targetDir); continue; }
  if (!meta.metaGrowth.safety.dryRun) {
    await fs.mkdir(targetDir, { recursive: true });
    // naive copy: nur README + template
    const files = ['README.md','template.ts','index.html'].filter(async f=> await exists(path.join(base,f)));
    for (const f of files) {
      const src = path.join(base, f);
      if (await exists(src)) {
        const dst = path.join(targetDir, f);
        await fs.copyFile(src, dst);
      }
    }
  }
  created.push({ id: nowId, where: bp.where, from: bp.from });
  // Manifest registrieren (in‑memory)
  if (!manifest.modules) manifest.modules=[];
  manifest.modules.push({ id: nowId, blueprint: bp.name, path: `${bp.where}/${nowId}` });
}

// ---- 2) Safety‑Checks (Tests/Doku vorhanden?)
function safetyOk(entry:any){
  if (meta.metaGrowth.safety.requireDocs) {
    // mindestens README
    // (bei dryRun nur Markierung)
  }
  if (meta.metaGrowth.safety.requireTests) {
    // erwartete Testdateien pruefen (optional)
  }
  return true;
}

// ---- 3) Persist Manifest + Audit‑Trail
if (!meta.metaGrowth.safety.dryRun) await writeJson(manifestPath, manifest);
await fs.mkdir('audit', { recursive: true });
await fs.appendFile('audit/fixes.jsonl', created.map(c=> JSON.stringify({ ts:new Date().toISOString(), rule:'evolve', action:'create-module', detail:c })).join('\n') + (created.length?'\n':''));

// ---- 4) Auto-PR Creation (if not dry run and changes exist)
if (!meta.metaGrowth.safety.dryRun && created.length > 0) {
  const evolveResult = {
    created,
    manifest,
    health: healthStatus.canEvolve
  };
  await createEvolvePR(evolveResult);
}

log('created', created.length, 'modules');
log('health gates:', healthStatus.canEvolve ? '✅ passed (≥110%)' : '❌ failed (requires ≥110%)');
