import { globby } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';
import rules from './rules';

const CHANGED_MARKER = '.selfheal-changed';
let changed = false;

(async () => {
  const cfg = JSON.parse(fs.readFileSync('selfheal.config.json','utf8'));
  for (const rule of Object.values(rules)) {
    if (!rule.enabled(cfg)) continue;
    const res = await rule.run(cfg);
    if (res?.changed) changed = true;
  }
  if (changed) fs.writeFileSync(CHANGED_MARKER, new Date().toISOString());
  console.log(changed ? 'SELFHEAL: changes written' : 'SELFHEAL: clean');
})();
