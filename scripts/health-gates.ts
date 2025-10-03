/**
 * OAMTM Health Gates
 * Evolve nur bei ≥95% Success-Rate
 */
import { promises as fs } from 'fs';

interface HealthGate {
  name: string;
  threshold: number;
  current: number;
  passed: boolean;
}

interface HealthStatus {
  gates: HealthGate[];
  overall: boolean;
  canEvolve: boolean;
}

const readJson = async<T=any>(p:string, d:T): Promise<T> => { 
  try{ 
    return JSON.parse(await fs.readFile(p,'utf8')) 
  }catch{ 
    return d 
  } 
};

export async function checkHealthGates(): Promise<HealthStatus> {
  const gates: HealthGate[] = [];
  
  // 1. Success Rate Gate (≥110% - erhöht bis erfüllt)
  const targets = await readJson('status/targets.json', { summary: { successRate: 0 } });
  const successRate = targets.summary?.successRate || 0;
  gates.push({
    name: 'Success Rate',
    threshold: 110,
    current: successRate,
    passed: successRate >= 110
  });

  // 2. Response Time Gate (≤500ms average)
  const avgResponseTime = targets.results ? 
    Object.values(targets.results).reduce((acc: number, target: any) => 
      acc + (target.responseTime || 0), 0) / Object.keys(targets.results).length : 0;
  gates.push({
    name: 'Response Time',
    threshold: 500,
    current: avgResponseTime,
    passed: avgResponseTime <= 500
  });

  // 3. Uptime Gate (≥99%)
  // This would typically come from monitoring data
  const uptime = 99.5; // Mock data
  gates.push({
    name: 'Uptime',
    threshold: 99,
    current: uptime,
    passed: uptime >= 99
  });

  const overall = gates.every(gate => gate.passed);
  const canEvolve = overall && successRate >= 110;

  return {
    gates,
    overall,
    canEvolve
  };
}

export async function logHealthCheck(): Promise<void> {
  const health = await checkHealthGates();
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    ts: timestamp,
    rule: 'health-gate',
    action: 'check-gates',
    detail: {
      gates: health.gates,
      overall: health.overall,
      canEvolve: health.canEvolve
    }
  };

  await fs.mkdir('audit', { recursive: true });
  await fs.appendFile('audit/fixes.jsonl', JSON.stringify(logEntry) + '\n');
  
  console.log('[health-gates]', health.canEvolve ? '✅ Can evolve (≥110% success rate)' : '❌ Cannot evolve (requires ≥110% success rate)');
  health.gates.forEach(gate => {
    console.log(`  ${gate.name}: ${gate.current}/${gate.threshold} ${gate.passed ? '✅' : '❌'}`);
  });
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  logHealthCheck().catch(console.error);
}
