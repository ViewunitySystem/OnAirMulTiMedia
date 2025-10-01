import fs from 'node:fs';

const p = process.argv[2];
const m = JSON.parse(fs.readFileSync(p, 'utf8'));

if(!Array.isArray(m.modules)) throw new Error('manifest.modules missing');

console.log('manifest ok');
