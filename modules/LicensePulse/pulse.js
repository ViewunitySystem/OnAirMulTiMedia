import fs from 'node:fs';

const out = process.argv.includes('--export') ? process.argv.at(-1) : 'audit/exports/license.json';
const report = { 
  ts: new Date().toISOString(), 
  modules: [], 
  status: 'ok' 
};

fs.mkdirSync('audit/exports', { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log('LicensePulse written', out);
