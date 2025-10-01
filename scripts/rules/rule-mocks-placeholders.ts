import { globby } from 'globby';
import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.mocksPlaceholders?.enabled,
  run: async (cfg:any)=>{
    const pats: string[] = cfg.rules.mocksPlaceholders.patterns || [];
    const files = await globby(['**/*.{js,ts,tsx,css,html,md}','!node_modules/**','!.git/**']);
    const hits: any[] = [];
    for(const f of files){
      const txt = fs.readFileSync(f,'utf8');
      pats.forEach(p=>{ if (new RegExp(`\\b${p}\\b`).test(txt)) hits.push({file:f, p}); });
    }
    if (hits.length) fs.writeFileSync('.selfheal-placeholders.json', JSON.stringify(hits,null,2));
    return { changed: false };
  }
}

