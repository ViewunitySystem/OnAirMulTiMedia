import fs from 'node:fs';

const root = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root')+1] : 'modules';
const out  = process.argv.includes('--out')  ? process.argv[process.argv.indexOf('--out')+1]  : 'audit/events/discovery.jsonl';

const list = fs.readdirSync(root).filter(f => fs.statSync(`${root}/${f}`).isDirectory());

fs.mkdirSync('audit/events', { recursive: true });

for(const m of list){
  fs.appendFileSync(out, JSON.stringify({ 
    event: 'MODULE_DISCOVERED', 
    module: m, 
    ts: new Date().toISOString() 
  }) + '\n');
}

console.log('scanned', list.length, 'modules');
