import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { globby } from 'globby';

export default {
  enabled: (cfg:any)=>cfg.rules.duplication?.enabled,
  run: async (cfg:any)=>{
    try {
      // Erweiterte Duplikat-Check mit verschiedenen Schwellwerten
      const thresholds = {
        minLines: cfg.rules.duplication.minLines || 5,
        minTokens: cfg.rules.duplication.minTokens || 50,
        maxPercent: cfg.rules.duplication.maxPercent || 5
      };
      
      // JSCPD mit erweiterten Optionen
      execSync(`npx jscpd --min-lines ${thresholds.minLines} --min-tokens ${thresholds.minTokens} --reporters json,html --output jscpd-report --silent`);
      
      const rep = JSON.parse(fs.readFileSync('jscpd-report/jscpd-report.json','utf8'));
      const percent = rep.statistics?.percentage || 0;
      
      // Erweiterte Analyse
      const analysis = {
        timestamp: new Date().toISOString(),
        duplicatePercentage: percent,
        threshold: thresholds.maxPercent,
        status: percent > thresholds.maxPercent ? 'WARNING' : 'OK',
        files: rep.duplicates || [],
        statistics: rep.statistics || {},
        recommendations: []
      };
      
      // Empfehlungen basierend auf Duplikaten
      if (percent > thresholds.maxPercent) {
        analysis.recommendations.push('Consider refactoring duplicate code blocks');
        analysis.recommendations.push('Extract common functionality into shared modules');
        analysis.recommendations.push('Review similar functions for consolidation');
      }
      
      // Spezifische Datei-Analyse
      const duplicateFiles = new Set();
      analysis.files.forEach((dup: any) => {
        duplicateFiles.add(dup.firstFile.name);
        duplicateFiles.add(dup.secondFile.name);
      });
      
      analysis.duplicateFiles = Array.from(duplicateFiles);
      
      // Speichere erweiterte Analyse
      fs.writeFileSync('.selfheal-duplication.json', JSON.stringify(analysis, null, 2));
      
      // Erstelle HTML-Report für bessere Visualisierung
      const htmlReport = generateHTMLReport(analysis);
      fs.writeFileSync('jscpd-report/duplicate-analysis.html', htmlReport);
      
      return { 
        changed: percent > thresholds.maxPercent,
        analysis: analysis
      };
    } catch(e) {
      console.warn('[Duplication] JSCPD failed:', e.message);
      return { changed: false };
    }
  }
}

function generateHTMLReport(analysis: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duplicate Code Analysis - OnAirMulTiMedia</title>
    <style>
        body { font-family: system-ui; margin: 2rem; background: #0a0e27; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1a1e37; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .status { padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        .status.ok { background: #00ff88; color: #000; }
        .status.warning { background: #ff6b6b; color: #fff; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .stat-card { background: #1a1e37; padding: 1rem; border-radius: 10px; text-align: center; }
        .recommendations { background: #1a1e37; padding: 1rem; border-radius: 10px; margin: 1rem 0; }
        .file-list { background: #1a1e37; padding: 1rem; border-radius: 10px; margin: 1rem 0; }
        .file-item { padding: 0.5rem; border-bottom: 1px solid #333; }
        .file-item:last-child { border-bottom: none; }
        pre { background: #000; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Duplicate Code Analysis</h1>
            <p>OnAirMulTiMedia Self-Healing System</p>
            <div class="status ${analysis.status.toLowerCase()}">
                Status: ${analysis.status} (${analysis.duplicatePercentage.toFixed(2)}% duplicates)
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Duplicate Percentage</h3>
                <p style="font-size: 2rem; color: ${analysis.status === 'OK' ? '#00ff88' : '#ff6b6b'};">${analysis.duplicatePercentage.toFixed(2)}%</p>
            </div>
            <div class="stat-card">
                <h3>Threshold</h3>
                <p style="font-size: 2rem;">${analysis.threshold}%</p>
            </div>
            <div class="stat-card">
                <h3>Duplicate Files</h3>
                <p style="font-size: 2rem;">${analysis.duplicateFiles.length}</p>
            </div>
            <div class="stat-card">
                <h3>Analysis Time</h3>
                <p style="font-size: 1rem;">${new Date(analysis.timestamp).toLocaleString()}</p>
            </div>
        </div>
        
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${analysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="file-list">
            <h3>📁 Files with Duplicates</h3>
            ${analysis.duplicateFiles.map((file: string) => `<div class="file-item">${file}</div>`).join('')}
        </div>
        
        <div class="file-list">
            <h3>📊 Detailed Statistics</h3>
            <pre>${JSON.stringify(analysis.statistics, null, 2)}</pre>
        </div>
    </div>
</body>
</html>`;
}
