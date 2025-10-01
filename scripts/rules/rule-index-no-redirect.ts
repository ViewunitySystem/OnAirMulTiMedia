import * as fs from 'node:fs';
import * as cheerio from 'cheerio';

export default {
  enabled: (cfg:any)=>cfg.rules.indexNoRedirect?.enabled,
  run: async (cfg:any)=>{
    const file = 'index.html';
    if (!fs.existsSync(file)) return;
    const html = fs.readFileSync(file,'utf8');
    const $ = cheerio.load(html);

    // Entferne Meta-Refresh + JS-Redirects
    $('meta[http-equiv="refresh"]').remove();
    $('script').each((_,el)=>{
      const t = $(el).html()||'';
      if(/location\.(replace|href)|window\.location|top\.location/.test(t)) $(el).remove();
    });

    // Stelle sicher, dass ein iframe auf info.html existiert
    const src = cfg.rules.indexNoRedirect.iframeSrc || './info.html';
    if ($('iframe#inlay').length===0) {
      $('body').empty().append(`<iframe id="inlay" src="${src}" style="border:0;width:100%;height:100vh" loading="lazy" referrerpolicy="no-referrer"></iframe>`);
    } else {
      $('iframe#inlay').attr('src', src);
    }

    fs.writeFileSync(file, $.html());
    return { changed: true };
  }
}

