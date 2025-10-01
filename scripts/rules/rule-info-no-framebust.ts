import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.infoNoFramebust?.enabled,
  run: async ()=>{
    const file = 'info.html';
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file,'utf8');
    const before = txt;
    // Häufige Varianten
    txt = txt.replace(/if\s*\(\s*window\.top\s*!==\s*window\.self\s*\)\s*window\.top\.location\s*=.*?;?/gs,'');
    txt = txt.replace(/top\.location\s*=.*?;?/gs,'');
    if (txt !== before) fs.writeFileSync(file, txt);
    return { changed: txt !== before };
  }
}

