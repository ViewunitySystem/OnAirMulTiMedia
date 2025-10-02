import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.webtritSwipe?.enabled,
  run: async (cfg:any)=>{
    const requiredFiles = cfg.rules.webtritSwipe.requiredFiles || ['webtrit-swipe.js'];
    const integrationPoints = cfg.rules.webtritSwipe.integrationPoints || ['info.html', 'index.html'];
    
    let changed = false;
    const issues = [];
    
    // Check if required files exist
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        issues.push(`Missing required file: ${file}`);
      }
    }
    
    // Check integration points
    for (const file of integrationPoints) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if WebTrit Swipe is integrated
      if (!content.includes('webtrit-swipe.js') && !content.includes('WebTritSwipe')) {
        // Add WebTrit Swipe integration
        if (file === 'info.html') {
          const scriptTag = '<script src="/webtrit-swipe.js"></script>';
          const newContent = content.replace('</head>', `${scriptTag}\n</head>`);
          
          if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            changed = true;
            issues.push(`Added WebTrit Swipe integration to ${file}`);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        webtritSwipeIssues: issues,
        recommendation: 'WebTrit Swipe Technology integration completed'
      };
      
      fs.writeFileSync('.selfheal-webtrit-swipe.json', JSON.stringify(report, null, 2));
    }
    
    return { 
      changed, 
      issues: issues.length,
      details: issues.join('; ')
    };
  }
}



