import { globby } from 'globby';
import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.binaryFiles?.enabled,
  run: async (cfg:any)=>{
    const patterns = cfg.rules.binaryFiles.patterns || ['*.exe', '*.msi', '*.dmg'];
    const excludePaths = cfg.rules.binaryFiles.excludePaths || ['node_modules/**', '.git/**'];
    
    const files = await globby(patterns, { ignore: excludePaths });
    
    if (files.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        binaryFiles: files,
        recommendation: 'Remove binary files and use Release Assets instead',
        action: 'Manual cleanup required'
      };
      
      fs.writeFileSync('.selfheal-binary-files.json', JSON.stringify(report, null, 2));
      
      return { 
        changed: false, 
        errors: files.length,
        details: `Found ${files.length} binary files: ${files.join(', ')}`
      };
    }
    
    return { changed: false };
  }
}

