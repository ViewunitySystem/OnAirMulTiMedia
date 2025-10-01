import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.duplication?.enabled,
  run: async (cfg:any)=>{
    try {
      execSync('npx jscpd --silent --reporters json --output jscpd-report');
      const rep = JSON.parse(fs.readFileSync('jscpd-report/jscpd-report.json','utf8'));
      const percent = rep.statistics?.percentage || 0;
      if (percent > (cfg.rules.duplication.maxPercent||1)){
        fs.writeFileSync('.selfheal-duplication.json', JSON.stringify(rep,null,2));
      }
    } catch(e) {}
    return { changed: false };
  }
}
