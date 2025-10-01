import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.lockfiles?.enabled,
  run: async (cfg:any)=>{
    const required = cfg.rules.lockfiles.required || ['package-lock.json', 'Cargo.lock'];
    const missing = [];
    
    for (const lockfile of required) {
      if (!fs.existsSync(lockfile)) {
        missing.push(lockfile);
      }
    }
    
    if (missing.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        missingLockfiles: missing,
        recommendation: 'Generate missing lockfiles for reproducible builds',
        action: 'Run: npm install && cargo build'
      };
      
      fs.writeFileSync('.selfheal-lockfiles.json', JSON.stringify(report, null, 2));
      
      return { 
        changed: false, 
        warnings: missing.length,
        details: `Missing lockfiles: ${missing.join(', ')}`
      };
    }
    
    return { changed: false };
  }
}
