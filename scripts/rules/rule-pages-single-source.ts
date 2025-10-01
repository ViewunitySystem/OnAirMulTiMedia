import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

export default {
  enabled: (cfg:any)=>cfg.rules.pagesSingleSource?.enabled,
  run: async ()=>{
    try {
      // Prüfe GitHub Pages Source-Einstellung
      const result = execSync('gh api repos/ViewunitySystem/OnAirMulTiMedia/pages', { encoding: 'utf8' });
      const pagesConfig = JSON.parse(result);
      
      // Stelle sicher dass nur gh-pages/root als Quelle verwendet wird
      if (pagesConfig.source?.branch !== 'gh-pages' || pagesConfig.source?.path !== '/') {
        fs.writeFileSync('.selfheal-pages-source.json', JSON.stringify({
          current: pagesConfig.source,
          recommended: { branch: 'gh-pages', path: '/' },
          message: 'GitHub Pages should use gh-pages branch with root path'
        }, null, 2));
      }
    } catch(e) {
      // Fallback: Lokale Prüfung
      fs.writeFileSync('.selfheal-pages-source.json', JSON.stringify({
        error: 'Could not check GitHub Pages config',
        recommendation: 'Ensure gh-pages branch is set as Pages source'
      }, null, 2));
    }
    return { changed: false };
  }
}
