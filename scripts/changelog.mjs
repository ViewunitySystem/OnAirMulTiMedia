import { readFile, writeFile } from 'node:fs/promises';
const fixes = (await readFile('audit/fixes.jsonl','utf8').catch(()=>''))
  .split('\n').filter(Boolean).map(x=>{ try{return JSON.parse(x)}catch{return null} }).filter(Boolean);
const latest = fixes.slice(-50).reverse();
await writeFile('audit/change-log.json', JSON.stringify({ ts:new Date().toISOString(), items: latest }, null, 2));
console.log('[changelog] items:', latest.length);
