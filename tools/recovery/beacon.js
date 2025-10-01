import fs from 'node:fs';

const reason = process.argv[2] || 'unknown';
const ev = { 
  event: 'SELF_HEAL_TRIGGER', 
  action: 'recovery', 
  reason, 
  ts: new Date().toISOString() 
};

fs.appendFileSync('audit/events/recovery.jsonl', JSON.stringify(ev) + '\n');
console.log('Beacon emitted');
