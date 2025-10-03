/**
 * 1100% Max Performance Self-Heal Pack
 * Error-Atlas Fix-Linker
 * Verknüpft Events mit Heilpfaden basierend auf Error-Map
 */

import { readFile, appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface UcmEvent {
  ts: string;
  src: string;
  level: string;
  msg: string;
  code?: string;
  meta?: any;
}

interface HealingRule {
  via: string;
  rule: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  auto_fix: boolean;
}

interface ErrorMap {
  version: number;
  generatedAt: string;
  sources: string[];
  taxonomy: {
    systemic: string[];
    technical: string[];
    regulatory: string[];
    philosophical: string[];
  };
  routes: Array<{
    id: string;
    url: string;
    expect: string[];
    recoverable: boolean;
    tags: string[];
  }>;
  healing: {
    systemic: Record<string, HealingRule>;
    technical: Record<string, HealingRule>;
    regulatory: Record<string, HealingRule>;
    philosophical: Record<string, HealingRule>;
  };
  audio_mapping: Record<string, any>;
  visual_mapping: Record<string, any>;
  performance: any;
}

interface FixAction {
  ts: string;
  ev: UcmEvent;
  key: string;
  category: string;
  rule: HealingRule;
  status: 'queued' | 'applied' | 'failed' | 'skipped';
  priority: string;
  auto_fix: boolean;
  estimated_duration?: number;
  success_probability?: number;
}

/**
 * Main Fix-Linker Class
 */
export class FixLinker {
  private errorMap: ErrorMap | null = null;
  private classificationCache: Map<string, string> = new Map();

  constructor() {
    this.loadErrorMap();
  }

  /**
   * Load error map configuration
   */
  private async loadErrorMap(): Promise<void> {
    try {
      const content = await readFile('audit/error-map.json', 'utf8');
      this.errorMap = JSON.parse(content);
      console.log('✅ [fix-linker] Error map loaded');
    } catch (error) {
      console.warn('⚠️ [fix-linker] No error map found, using defaults');
      this.errorMap = this.createDefaultErrorMap();
    }
  }

  /**
   * Create default error map if none exists
   */
  private createDefaultErrorMap(): ErrorMap {
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      sources: ['console', 'network', 'system'],
      taxonomy: {
        systemic: ['module_unregistered', 'recovery_unlinked'],
        technical: ['404', 'csp_violation', 'timeout'],
        regulatory: ['gdpr_export_missing'],
        philosophical: ['treat_as_defect']
      },
      routes: [],
      healing: {
        systemic: {
          module_unregistered: { via: 'register_in_manifest', rule: 'link_to_dashboard', priority: 'high', auto_fix: true },
          recovery_unlinked: { via: 'add_trigger', rule: 'rule-recovery-bridge', priority: 'critical', auto_fix: true }
        },
        technical: {
          '404': { via: 'redirect_or_mirror', rule: '404_autofix', priority: 'high', auto_fix: true },
          csp_violation: { via: 'inject_meta', rule: 'csp_enforcer', priority: 'high', auto_fix: true },
          timeout: { via: 'retry_with_backoff', rule: 'timeout_retry', priority: 'medium', auto_fix: true }
        },
        regulatory: {
          gdpr_export_missing: { via: 'jsonl_zip_export', rule: 'privacy_export', priority: 'high', auto_fix: false }
        },
        philosophical: {
          treat_as_defect: { via: 'map_to_tone', rule: 'composer_engine', priority: 'low', auto_fix: true }
        }
      },
      audio_mapping: {},
      visual_mapping: {},
      performance: {}
    };
  }

  /**
   * Main fix-linker function
   */
  async processEvents(): Promise<FixAction[]> {
    console.log('🔗 [fix-linker] Processing events...');
    
    if (!this.errorMap) {
      throw new Error('Error map not loaded');
    }

    try {
      // Read UCM events
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
          console.log(`📖 [fix-linker] Read events from ${file}`);
          break;
        } catch {
          // Continue to next file
        }
      }

      // Parse events
      const events = eventsText
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line) as UcmEvent;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      console.log(`📊 [fix-linker] Processing ${events.length} events`);

      // Process events and generate fix actions
      const fixActions: FixAction[] = [];

      for (const event of events) {
        const classification = this.classifyEvent(event);
        if (!classification) continue;

        const { key, category } = classification;
        const rule = this.getHealingRule(key, category);
        if (!rule) continue;

        const fixAction: FixAction = {
          ts: new Date().toISOString(),
          ev: event,
          key,
          category,
          rule,
          status: 'queued',
          priority: rule.priority,
          auto_fix: rule.auto_fix,
          estimated_duration: this.estimateDuration(rule),
          success_probability: this.calculateSuccessProbability(rule, event)
        };

        fixActions.push(fixAction);
      }

      // Write fix actions to fixes.jsonl
      if (fixActions.length > 0) {
        const fixesContent = fixActions
          .map(action => JSON.stringify(action))
          .join('\n') + '\n';

        await appendFile('audit/fixes.jsonl', fixesContent);
        console.log(`✅ [fix-linker] Queued ${fixActions.length} fix actions`);
      } else {
        console.log('ℹ️ [fix-linker] No matching events found');
      }

      // Generate summary
      await this.generateSummary(fixActions);

      return fixActions;

    } catch (error) {
      console.error('❌ [fix-linker] Error processing events:', error.message);
      throw error;
    }
  }

  /**
   * Classify event into error category
   */
  private classifyEvent(event: UcmEvent): { key: string; category: string } | null {
    const msg = event.msg || '';
    const code = event.code || '';
    const src = event.src || '';

    // Check cache first
    const cacheKey = `${msg}-${code}-${src}`;
    if (this.classificationCache.has(cacheKey)) {
      const cached = this.classificationCache.get(cacheKey)!;
      return { key: cached, category: this.getCategoryForKey(cached) };
    }

    // Systemische Fehler
    if (/module.*not.*found|unregistered|missing/i.test(msg)) {
      const key = 'module_unregistered';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'systemic' };
    }

    if (/recovery.*not.*linked|unlinked|disconnected/i.test(msg)) {
      const key = 'recovery_unlinked';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'systemic' };
    }

    if (/audit.*incomplete|missing.*audit/i.test(msg)) {
      const key = 'audit_incomplete';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'systemic' };
    }

    if (/CSP|Content Security Policy/i.test(msg)) {
      const key = 'csp_disabled';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'systemic' };
    }

    if (/404|Not Found|File not found/i.test(msg) || code === 'HTTP_404') {
      const key = 'asset_missing';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'systemic' };
    }

    // Technische Fehler
    if (/redirect.*missing|404.*redirect/i.test(msg)) {
      const key = 'pages_redirect_missing';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    if (/firebase.*drift|target.*mismatch/i.test(msg)) {
      const key = 'firebase_drift';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    if (/SQLITE_BUSY|database.*locked|WAL.*blocked/i.test(msg)) {
      const key = 'sqlite_blocked';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    if (/CI.*interrupted|build.*failed|deploy.*failed/i.test(msg)) {
      const key = 'ci_interrupted';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    if (/manifest.*fail|manifest.*load.*error/i.test(msg)) {
      const key = 'manifest_load_fail';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    if (/timeout|request.*timeout|connection.*timeout/i.test(msg)) {
      const key = 'timeout';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'technical' };
    }

    // Regulatorische Fehler
    if (/GDPR|DSGVO|privacy.*export/i.test(msg)) {
      const key = 'gdpr_export_missing';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'regulatory' };
    }

    if (/RF.*proof|FCC|CEPT.*missing/i.test(msg)) {
      const key = 'rf_proof_missing';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'regulatory' };
    }

    if (/external.*unmoderated|access.*unrestricted/i.test(msg)) {
      const key = 'external_unmoderated';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'regulatory' };
    }

    // Philosophische Fehler
    if (/treat.*as.*defect|error.*as.*enemy/i.test(msg)) {
      const key = 'treat_as_defect';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'philosophical' };
    }

    if (/no.*resonance|lack.*harmony/i.test(msg)) {
      const key = 'no_resonance';
      this.classificationCache.set(cacheKey, key);
      return { key, category: 'philosophical' };
    }

    // Default fallback
    const key = 'recovery_unlinked';
    this.classificationCache.set(cacheKey, key);
    return { key, category: 'systemic' };
  }

  /**
   * Get healing rule for error key and category
   */
  private getHealingRule(key: string, category: string): HealingRule | null {
    if (!this.errorMap) return null;

    const categoryRules = this.errorMap.healing[category as keyof typeof this.errorMap.healing];
    if (!categoryRules) return null;

    return categoryRules[key] || null;
  }

  /**
   * Get category for error key
   */
  private getCategoryForKey(key: string): string {
    if (!this.errorMap) return 'systemic';

    for (const [category, rules] of Object.entries(this.errorMap.healing)) {
      if (key in rules) {
        return category;
      }
    }

    return 'systemic';
  }

  /**
   * Estimate duration for fix action
   */
  private estimateDuration(rule: HealingRule): number {
    const baseDurations = {
      'register_in_manifest': 1000,
      'add_trigger': 2000,
      'enable_ucm': 1500,
      'inject_meta': 500,
      'redirect_or_mirror': 3000,
      'append_route': 1000,
      'collect_console': 2000,
      '404_html+map': 1500,
      'sync_redirects': 5000,
      'WAL_mode': 1000,
      'retry_matrix': 3000,
      'validate_schema': 2000,
      'add_nav_entry': 1000,
      'mock+defer': 500,
      'jsonl_zip_export': 10000,
      'attach_spec': 5000,
      '2fa+license_gate': 15000,
      'throttle_free': 2000,
      'map_to_tone': 1000,
      'compose_answer': 2000,
      'elevate_conductor': 5000,
      'always_on': 1000
    };

    return baseDurations[rule.via as keyof typeof baseDurations] || 2000;
  }

  /**
   * Calculate success probability for fix action
   */
  private calculateSuccessProbability(rule: HealingRule, event: UcmEvent): number {
    let probability = 0.8; // Base probability

    // Adjust based on priority
    switch (rule.priority) {
      case 'critical':
        probability = 0.9;
        break;
      case 'high':
        probability = 0.85;
        break;
      case 'medium':
        probability = 0.8;
        break;
      case 'low':
        probability = 0.75;
        break;
    }

    // Adjust based on auto_fix capability
    if (rule.auto_fix) {
      probability += 0.1;
    } else {
      probability -= 0.2;
    }

    // Adjust based on event source
    if (event.src === 'system') {
      probability += 0.05;
    } else if (event.src === 'network') {
      probability -= 0.1;
    }

    return Math.min(0.99, Math.max(0.1, probability));
  }

  /**
   * Generate summary report
   */
  private async generateSummary(fixActions: FixAction[]): Promise<void> {
    try {
      const summary = {
        timestamp: new Date().toISOString(),
        total: fixActions.length,
        byCategory: fixActions.reduce((acc, action) => {
          acc[action.category] = (acc[action.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: fixActions.reduce((acc, action) => {
          acc[action.priority] = (acc[action.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byStatus: fixActions.reduce((acc, action) => {
          acc[action.status] = (acc[action.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        autoFixable: fixActions.filter(action => action.auto_fix).length,
        manualRequired: fixActions.filter(action => !action.auto_fix).length,
        averageSuccessProbability: fixActions.reduce((sum, action) => sum + (action.success_probability || 0), 0) / fixActions.length,
        estimatedTotalDuration: fixActions.reduce((sum, action) => sum + (action.estimated_duration || 0), 0)
      };

      await writeFile('audit/fix-linker-summary.json', JSON.stringify(summary, null, 2));
      console.log('📊 [fix-linker] Summary generated:', JSON.stringify(summary, null, 2));

    } catch (error) {
      console.warn('⚠️ [fix-linker] Failed to generate summary:', error.message);
    }
  }

  /**
   * Get classification statistics
   */
  getClassificationStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const [key, value] of this.classificationCache.entries()) {
      stats[value] = (stats[value] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.classificationCache.clear();
    console.log('🧹 [fix-linker] Classification cache cleared');
  }
}

// Export singleton instance
export const fixLinker = new FixLinker();

// Export convenience function
export async function processEvents(): Promise<FixAction[]> {
  return fixLinker.processEvents();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processEvents().catch(error => {
    console.error('❌ [fix-linker] Failed:', error.message);
    process.exit(1);
  });
}
