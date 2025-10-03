#!/usr/bin/env node

import { readFile, appendFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 1100% Max Performance Self-Heal Pack
 * Rules-Brücke: Events → Heilung
 * Liest UCM-Events + recovery-map und löst passende Heilschritte aus
 */

async function processRecoveryBridge() {
  console.log('🔗 [recovery-bridge] Processing events → healing...');
  
  try {
    // Read UCM events from console logs
    const eventFiles = [
      'audit/console/today.jsonl',
      'audit/events/console-events.jsonl',
      'audit/events.jsonl',
      'audit/console-events.jsonl'
    ];
    
    let eventsText = '';
    for (const file of eventFiles) {
      try {
        eventsText += await readFile(file, 'utf8');
        console.log(`📖 [recovery-bridge] Read events from ${file}`);
        break;
      } catch {
        // Continue to next file
      }
    }
    
    // Read recovery map
    const mapData = await readFile('audit/recovery-map.json', 'utf8');
    const map = JSON.parse(mapData);
    
    // Parse events
    const events = eventsText
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
    
    console.log(`📊 [recovery-bridge] Processing ${events.length} events`);
    
    // Process events and generate recovery actions
    const recoveryActions = [];
    
    for (const event of events) {
      const { msg = '', code = '', src = '', meta = {} } = event;
      
      // Detect error types
      const is404 = /404|Not Found|File not found|Resource not found/i.test(msg) || 
                   code === 'HTTP_404' || 
                   code === 'FILE_NOT_FOUND';
      
      const isCSP = /CSP|Content Security Policy|script-src|style-src/i.test(msg) ||
                   code === 'CSP_VIOLATION' ||
                   code === 'SECURITY_POLICY';
      
      const isAsset = /Failed to load|Loading chunk|Import error|Module not found/i.test(msg) ||
                     code === 'ASSET_LOAD_ERROR' ||
                     code === 'CHUNK_LOAD_ERROR';
      
      const isTimeout = /timeout|Request timeout|Connection timeout/i.test(msg) ||
                       code === 'TIMEOUT' ||
                       code === 'REQUEST_TIMEOUT';
      
      if (!is404 && !isCSP && !isAsset && !isTimeout) continue;
      
      // Find matching page in recovery map
      const page = map.pages.find(p => {
        const url = meta?.url || src || '';
        return url.includes(p.url) || 
               msg.includes(p.url) ||
               url.endsWith(p.name + '.html');
      });
      
      if (!page) continue;
      
      // Determine recovery action
      let action, rule;
      if (is404) {
        action = '404';
        rule = map.rules['404'];
      } else if (isCSP) {
        action = 'csp';
        rule = map.rules.csp;
      } else if (isAsset) {
        action = 'assets';
        rule = map.rules.assets;
      } else if (isTimeout) {
        action = 'timeout';
        rule = { action: 'retry-with-backoff', maxRetries: 3, backoffMs: 1000 };
      }
      
      // Generate recovery action
      const recoveryAction = {
        ts: new Date().toISOString(),
        page: page.url,
        pageName: page.name,
        rule: action,
        action: rule.action,
        priority: is404 ? 'high' : isCSP ? 'critical' : 'medium',
        status: 'queued',
        source: {
          event: event,
          detected: { is404, isCSP, isAsset, isTimeout }
        },
        config: rule
      };
      
      recoveryActions.push(recoveryAction);
    }
    
    // Write recovery actions to fixes.jsonl
    if (recoveryActions.length > 0) {
      const fixesContent = recoveryActions
        .map(action => JSON.stringify(action))
        .join('\n') + '\n';
      
      await appendFile('audit/fixes.jsonl', fixesContent);
      
      console.log(`✅ [recovery-bridge] Queued ${recoveryActions.length} recovery actions`);
      
      // Generate summary
      const summary = {
        ts: new Date().toISOString(),
        total: recoveryActions.length,
        byType: recoveryActions.reduce((acc, action) => {
          acc[action.rule] = (acc[action.rule] || 0) + 1;
          return acc;
        }, {}),
        byPriority: recoveryActions.reduce((acc, action) => {
          acc[action.priority] = (acc[action.priority] || 0) + 1;
          return acc;
        }, {}),
        pages: [...new Set(recoveryActions.map(a => a.page))]
      };
      
      await writeFile('audit/recovery-bridge-summary.json', JSON.stringify(summary, null, 2));
      
      console.log(`📊 [recovery-bridge] Summary:`, JSON.stringify(summary, null, 2));
      
    } else {
      console.log('ℹ️ [recovery-bridge] No matching events found');
    }
    
    return recoveryActions;
    
  } catch (error) {
    console.error('❌ [recovery-bridge] Error:', error.message);
    
    // Create error recovery action
    const errorRecovery = {
      ts: new Date().toISOString(),
      page: 'system',
      rule: 'error',
      action: 'log-and-continue',
      priority: 'critical',
      status: 'failed',
      error: error.message,
      stack: error.stack
    };
    
    try {
      await appendFile('audit/fixes.jsonl', JSON.stringify(errorRecovery) + '\n');
    } catch {
      // Ignore if we can't write
    }
    
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processRecoveryBridge().catch(process.exit);
}

export { processRecoveryBridge };
