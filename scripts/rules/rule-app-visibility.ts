import * as fs from 'node:fs';
import * as cheerio from 'cheerio';

export default {
  enabled: (cfg:any)=>cfg.rules.appVisibility?.enabled,
  run: async (cfg:any)=>{
    const expectedApps = cfg.rules.appVisibility.expectedApps || 18;
    const checkFiles = cfg.rules.appVisibility.checkFiles || ['info.html', 'index.html'];
    
    let changed = false;
    const issues = [];
    
    for (const file of checkFiles) {
      if (!fs.existsSync(file)) continue;
      
      const html = fs.readFileSync(file, 'utf8');
      const $ = cheerio.load(html);
      
      // Count app links
      const appLinks = $('a[href]').length;
      const appSections = $('.item, .card, .app').length;
      
      if (appLinks < expectedApps) {
        issues.push(`Only ${appLinks} app links found in ${file}, expected ${expectedApps}`);
      }
      
      if (appSections < expectedApps) {
        issues.push(`Only ${appSections} app sections found in ${file}, expected ${expectedApps}`);
      }
      
      // Check for specific app categories
      const categories = ['Haupt-Apps', 'Navigation & Tools', 'Regulatory & Export', 'Settings & Monitoring', 'WebRTC Remote Control', 'Geschützte Bereiche'];
      const foundCategories = categories.filter(cat => html.includes(cat));
      
      if (foundCategories.length < categories.length) {
        issues.push(`Missing app categories in ${file}: ${categories.filter(cat => !foundCategories.includes(cat)).join(', ')}`);
      }
    }
    
    if (issues.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        appVisibilityIssues: issues,
        expectedApps: expectedApps,
        recommendation: 'Ensure all 18 apps are visible and properly categorized'
      };
      
      fs.writeFileSync('.selfheal-app-visibility.json', JSON.stringify(report, null, 2));
    }
    
    return { 
      changed, 
      issues: issues.length,
      details: issues.join('; ')
    };
  }
}
