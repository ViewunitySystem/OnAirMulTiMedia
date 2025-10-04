/**
 * 1100% Max Performance Self-Heal Pack
 * Fix-Logger für Auto-Dokumentation
 * TypeScript Implementation für type-safe logging
 */

import { appendFile, readFile, writeFile } from 'node:fs/promises';

export interface FixLogEntry {
  rule: string;
  page?: string;
  detail?: any;
  status?: 'queued' | 'applied' | 'failed' | 'skipped';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FixLogStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byRule: Record<string, number>;
  last24h: number;
  successRate: number;
}

/**
 * Log a fix entry to the fixes.jsonl file
 */
export async function fixLog(entry: FixLogEntry): Promise<void> {
  const row = {
    ts: new Date().toISOString(),
    ...entry
  } as FixLogEntry & { ts: string };
  
  try {
    await appendFile('audit/fixes.jsonl', JSON.stringify(row) + '\n');
    console.log(`📝 [fix-log] Logged: ${entry.rule} - ${entry.status || 'unknown'}`);
  } catch (error) {
    console.error('❌ [fix-log] Failed to write:', error);
    throw error;
  }
}

/**
 * Read and parse all fix entries
 */
export async function readFixLogs(): Promise<(FixLogEntry & { ts: string })[]> {
  try {
    const content = await readFile('audit/fixes.jsonl', 'utf8');
    return content
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('⚠️ [fix-log] No fixes.jsonl found, returning empty array');
    return [];
  }
}

/**
 * Get statistics from fix logs
 */
export async function getFixLogStats(): Promise<FixLogStats> {
  const logs = await readFixLogs();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const last24hLogs = logs.filter(log => new Date(log.ts) > last24h);
  const successful = logs.filter(log => log.status === 'applied');
  
  return {
    total: logs.length,
    byStatus: logs.reduce((acc, log) => {
      acc[log.status || 'unknown'] = (acc[log.status || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: logs.reduce((acc, log) => {
      acc[log.priority || 'unknown'] = (acc[log.priority || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byRule: logs.reduce((acc, log) => {
      acc[log.rule] = (acc[log.rule] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    last24h: last24hLogs.length,
    successRate: logs.length > 0 ? (successful.length / logs.length) * 100 : 0
  };
}

/**
 * Clean up old fix logs (keep last 1000 entries)
 */
export async function cleanupFixLogs(): Promise<void> {
  const logs = await readFixLogs();
  
  if (logs.length <= 1000) {
    console.log('ℹ️ [fix-log] No cleanup needed');
    return;
  }
  
  const recentLogs = logs.slice(-1000);
  const content = recentLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
  
  await writeFile('audit/fixes.jsonl', content);
  console.log(`🧹 [fix-log] Cleaned up, kept ${recentLogs.length} recent entries`);
}

/**
 * Export fix logs to JSON for analysis
 */
export async function exportFixLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
  const logs = await readFixLogs();
  
  if (format === 'csv') {
    const headers = ['timestamp', 'rule', 'page', 'status', 'priority', 'duration', 'error'];
    const rows = logs.map(log => [
      log.ts,
      log.rule,
      log.page || '',
      log.status || '',
      log.priority || '',
      log.duration || '',
      log.error || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  
  return JSON.stringify(logs, null, 2);
}

/**
 * Batch log multiple entries efficiently
 */
export async function batchFixLog(entries: FixLogEntry[]): Promise<void> {
  const rows = entries.map(entry => ({
    ts: new Date().toISOString(),
    ...entry
  }));
  
  const content = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
  
  try {
    await appendFile('audit/fixes.jsonl', content);
    console.log(`📝 [fix-log] Batch logged ${entries.length} entries`);
  } catch (error) {
    console.error('❌ [fix-log] Failed to batch write:', error);
    throw error;
  }
}

/**
 * Get fix logs for a specific page
 */
export async function getFixLogsForPage(page: string): Promise<(FixLogEntry & { ts: string })[]> {
  const logs = await readFixLogs();
  return logs.filter(log => log.page === page);
}

/**
 * Get fix logs for a specific rule
 */
export async function getFixLogsForRule(rule: string): Promise<(FixLogEntry & { ts: string })[]> {
  const logs = await readFixLogs();
  return logs.filter(log => log.rule === rule);
}

/**
 * Get recent fix logs (last N entries)
 */
export async function getRecentFixLogs(count: number = 50): Promise<(FixLogEntry & { ts: string })[]> {
  const logs = await readFixLogs();
  return logs.slice(-count);
}

// Utility functions for common logging patterns
export const fixLoggers = {
  async cspViolation(page: string, detail: any) {
    await fixLog({
      rule: 'csp',
      page,
      detail,
      status: 'queued',
      priority: 'critical'
    });
  },
  
  async pageNotFound(page: string, detail: any) {
    await fixLog({
      rule: '404',
      page,
      detail,
      status: 'queued',
      priority: 'high'
    });
  },
  
  async assetLoadError(page: string, detail: any) {
    await fixLog({
      rule: 'assets',
      page,
      detail,
      status: 'queued',
      priority: 'medium'
    });
  },
  
  async timeoutError(page: string, detail: any) {
    await fixLog({
      rule: 'timeout',
      page,
      detail,
      status: 'queued',
      priority: 'high'
    });
  },
  
  async recoveryApplied(rule: string, page: string, duration: number) {
    await fixLog({
      rule,
      page,
      status: 'applied',
      duration,
      priority: 'medium'
    });
  },
  
  async recoveryFailed(rule: string, page: string, error: string) {
    await fixLog({
      rule,
      page,
      status: 'failed',
      error,
      priority: 'critical'
    });
  }
};
