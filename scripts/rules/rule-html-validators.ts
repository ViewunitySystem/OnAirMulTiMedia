import { globby } from 'globby';
import * as fs from 'node:fs';
import * as cheerio from 'cheerio';

export default {
  enabled: (cfg:any)=>cfg.rules.htmlValidators?.enabled,
  run: async ()=>{
    const files = await globby(['**/*.html','!node_modules/**','!.git/**']);
    const issues: any[] = [];
    
    for(const f of files){
      const html = fs.readFileSync(f,'utf8');
      const $ = cheerio.load(html);
      
      // Grundlegende Checks
      if (!$('title').length) issues.push({file:f, issue: 'Missing title tag'});
      if (!$('meta[name="viewport"]').length) issues.push({file:f, issue: 'Missing viewport meta'});
      if ($('img:not([alt])').length) issues.push({file:f, issue: 'Images without alt text'});
      if ($('a:not([href])').length) issues.push({file:f, issue: 'Links without href'});
    }
    
    if (issues.length) fs.writeFileSync('.selfheal-html-issues.json', JSON.stringify(issues,null,2));
    return { changed: false };
  }
}



