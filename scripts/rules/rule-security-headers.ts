import * as fs from 'node:fs';
import * as cheerio from 'cheerio';

export default {
  enabled: (cfg:any)=>cfg.rules.securityHeaders?.enabled,
  run: async (cfg:any)=>{
    const headers = cfg.rules.securityHeaders.headers || [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];
    
    let changed = false;
    const issues = [];
    
    // Check HTML files
    const htmlFiles = ['index.html', 'info.html'];
    
    for (const file of htmlFiles) {
      if (!fs.existsSync(file)) continue;
      
      const html = fs.readFileSync(file, 'utf8');
      const $ = cheerio.load(html);
      
      // Check for security headers in meta tags
      const existingHeaders = new Set();
      $('meta[http-equiv]').each((_, el) => {
        const httpEquiv = $(el).attr('http-equiv');
        if (httpEquiv) {
          existingHeaders.add(httpEquiv);
        }
      });
      
      // Add missing security headers
      for (const header of headers) {
        if (!existingHeaders.has(header)) {
          let content = '';
          
          switch (header) {
            case 'Content-Security-Policy':
              content = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self' wss://*; base-uri 'none'; frame-ancestors 'self'; upgrade-insecure-requests";
              break;
            case 'X-Frame-Options':
              content = 'SAMEORIGIN';
              break;
            case 'X-Content-Type-Options':
              content = 'nosniff';
              break;
            case 'Referrer-Policy':
              content = 'no-referrer';
              break;
            case 'Strict-Transport-Security':
              content = 'max-age=31536000; includeSubDomains';
              break;
          }
          
          if (content) {
            $('head').prepend(`<meta http-equiv="${header}" content="${content}">`);
            changed = true;
            issues.push(`Added ${header} to ${file}`);
          }
        }
      }
      
      if (changed) {
        fs.writeFileSync(file, $.html());
      }
    }
    
    if (issues.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        securityHeadersAdded: issues,
        recommendation: 'Security headers have been added to HTML files'
      };
      
      fs.writeFileSync('.selfheal-security-headers.json', JSON.stringify(report, null, 2));
    }
    
    return { 
      changed, 
      issues: issues.length,
      details: issues.join('; ')
    };
  }
}
