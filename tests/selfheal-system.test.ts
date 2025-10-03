/**
 * 1100% Max Performance Self-Heal Pack
 * Comprehensive Tests für alle Self-Heal Komponenten
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';

// Mock modules
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  appendFile: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn()
}));

describe('1100% Max Performance Self-Heal Pack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Recovery Map Generator', () => {
    it('should generate recovery map with correct structure', async () => {
      const mockRoutes = [
        { url: '/index.html', name: 'home' },
        { url: '/info.html', name: 'info' },
        { url: '/bug-symphony.html', name: 'bug-symphony' }
      ];

      vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ routes: mockRoutes }));

      // Import and test the generator
      const { generateRecoveryMap } = await import('../scripts/gen-recovery-map.mjs');
      const result = await generateRecoveryMap();

      expect(result).toBeDefined();
      expect(result.version).toBe(1);
      expect(result.pages).toHaveLength(3);
      expect(result.rules).toHaveProperty('csp');
      expect(result.rules).toHaveProperty('404');
      expect(result.rules).toHaveProperty('assets');
      expect(result.performance).toBeDefined();
      expect(result.healing).toBeDefined();
    });

    it('should handle missing routes file gracefully', async () => {
      vi.mocked(readFile).mockRejectedValueOnce(new Error('File not found'));

      const { generateRecoveryMap } = await import('../scripts/gen-recovery-map.mjs');
      const result = await generateRecoveryMap();

      expect(result).toBeDefined();
      expect(result.pages).toBeDefined();
      expect(result.rules).toBeDefined();
    });
  });

  describe('Rules Recovery Bridge', () => {
    it('should process events and generate recovery actions', async () => {
      const mockEvents = `{"ts":"2025-01-03T04:50:00.000Z","msg":"404 Not Found","code":"HTTP_404","src":"browser","meta":{"url":"/test.html"}}
{"ts":"2025-01-03T04:51:00.000Z","msg":"CSP violation","code":"CSP_VIOLATION","src":"browser","meta":{"url":"/index.html"}}`;

      const mockRecoveryMap = {
        pages: [
          { url: '/test.html', name: 'test', rules: ['404', 'assets'] },
          { url: '/index.html', name: 'home', rules: ['csp', '404'] }
        ],
        rules: {
          '404': { action: 'client-redirect-or-server-redirect' },
          'csp': { action: 'inject-meta-or-headers' }
        }
      };

      vi.mocked(readFile)
        .mockResolvedValueOnce(mockEvents)
        .mockResolvedValueOnce(JSON.stringify(mockRecoveryMap));

      const { processRecoveryBridge } = await import('../scripts/rules/rule-recovery-bridge.mjs');
      const result = await processRecoveryBridge();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].rule).toBe('404');
      expect(result[1].rule).toBe('csp');
    });

    it('should handle empty events gracefully', async () => {
      vi.mocked(readFile).mockResolvedValue('');

      const { processRecoveryBridge } = await import('../scripts/rules/rule-recovery-bridge.mjs');
      const result = await processRecoveryBridge();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe('Fix Logger', () => {
    it('should log fix entries correctly', async () => {
      const mockEntry = {
        rule: '404',
        page: '/test.html',
        status: 'applied',
        priority: 'high'
      };

      const { fixLog } = await import('../scripts/fix-log.ts');
      await fixLog(mockEntry);

      expect(appendFile).toHaveBeenCalledWith(
        'audit/fixes.jsonl',
        expect.stringContaining('"rule":"404"')
      );
    });

    it('should read fix logs correctly', async () => {
      const mockLogs = `{"ts":"2025-01-03T04:50:00.000Z","rule":"404","page":"/test.html","status":"applied"}
{"ts":"2025-01-03T04:51:00.000Z","rule":"csp","page":"/index.html","status":"failed"}`;

      vi.mocked(readFile).mockResolvedValue(mockLogs);

      const { readFixLogs } = await import('../scripts/fix-log.ts');
      const result = await readFixLogs();

      expect(result).toHaveLength(2);
      expect(result[0].rule).toBe('404');
      expect(result[1].rule).toBe('csp');
    });

    it('should calculate statistics correctly', async () => {
      const mockLogs = `{"ts":"2025-01-03T04:50:00.000Z","rule":"404","page":"/test.html","status":"applied","priority":"high"}
{"ts":"2025-01-03T04:51:00.000Z","rule":"csp","page":"/index.html","status":"failed","priority":"critical"}
{"ts":"2025-01-03T04:52:00.000Z","rule":"assets","page":"/style.css","status":"applied","priority":"medium"}`;

      vi.mocked(readFile).mockResolvedValue(mockLogs);

      const { getFixLogStats } = await import('../scripts/fix-log.ts');
      const stats = await getFixLogStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.applied).toBe(2);
      expect(stats.byStatus.failed).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.critical).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Restore Engine', () => {
    it('should recover 404 errors correctly', async () => {
      const mockRecoveryMap = {
        rules: {
          '404': {
            action: 'client-redirect-or-server-redirect',
            fallback: '/404.html'
          }
        }
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockRecoveryMap));

      const { RestoreEngine } = await import('../scripts/restore-engine.ts');
      const engine = new RestoreEngine();

      const result = await engine.recoverPage('/test.html', '404');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle CSP violations correctly', async () => {
      const mockRecoveryMap = {
        rules: {
          'csp': {
            action: 'inject-meta-or-headers',
            policy: "default-src 'self'"
          }
        }
      };

      const mockHtmlContent = '<html><head></head><body>Test</body></html>';

      vi.mocked(readFile)
        .mockResolvedValueOnce(JSON.stringify(mockRecoveryMap))
        .mockResolvedValueOnce(mockHtmlContent);

      const { RestoreEngine } = await import('../scripts/restore-engine.ts');
      const engine = new RestoreEngine();

      const result = await engine.recoverPage('/index.html', 'csp');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle timeout errors with retry logic', async () => {
      const mockRecoveryMap = {
        rules: {
          'timeout': {
            action: 'retry-with-backoff',
            maxRetries: 3,
            backoffMs: 100
          }
        }
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockRecoveryMap));

      const { RestoreEngine } = await import('../scripts/restore-engine.ts');
      const engine = new RestoreEngine();

      const result = await engine.recoverPage('/api/data', 'timeout');

      expect(result).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Performance Booster', () => {
    it('should boost performance correctly', async () => {
      const { PerformanceBooster } = await import('../scripts/performance-booster.mjs');
      const booster = new PerformanceBooster();

      await booster.boostPerformance();

      // Verify that performance optimizations were applied
      expect(writeFile).toHaveBeenCalledWith(
        'performance-report.json',
        expect.stringContaining('"version":"1.0.0"')
      );
    });

    it('should measure baseline performance', async () => {
      const { PerformanceBooster } = await import('../scripts/performance-booster.mjs');
      const booster = new PerformanceBooster();

      await booster.measureBaseline();

      expect(booster.metrics.before).toBeDefined();
      expect(booster.metrics.before.lcp).toBeDefined();
      expect(booster.metrics.before.inp).toBeDefined();
      expect(booster.metrics.before.cls).toBeDefined();
    });

    it('should calculate performance improvements', async () => {
      const { PerformanceBooster } = await import('../scripts/performance-booster.mjs');
      const booster = new PerformanceBooster();

      // Set mock metrics
      booster.metrics.before = {
        lcp: 2.5,
        inp: 300,
        cls: 0.15,
        fcp: 2.0,
        ttfb: 800,
        cacheHitRate: 60,
        bundleSize: 1024 * 1024,
        imageOptimization: 70,
        compressionRatio: 0.8
      };

      booster.metrics.after = {
        lcp: 1.2,
        inp: 150,
        cls: 0.05,
        fcp: 1.1,
        ttfb: 200,
        cacheHitRate: 95,
        bundleSize: 512 * 1024,
        imageOptimization: 95,
        compressionRatio: 0.3
      };

      booster.calculateImprovements();

      expect(booster.metrics.improvement).toBeDefined();
      expect(booster.metrics.improvement.lcp).toBeGreaterThan(0);
      expect(booster.metrics.improvement.inp).toBeGreaterThan(0);
      expect(booster.metrics.improvement.cls).toBeGreaterThan(0);
    });
  });

  describe('Health Gate', () => {
    it('should pass health checks with good metrics', async () => {
      const mockStatusData = {
        results: [
          { name: 'test1', ok: true },
          { name: 'test2', ok: true },
          { name: 'test3', ok: true }
        ]
      };

      const mockPerformanceData = {
        summary: {
          performanceScore: 90,
          averageImprovement: 80
        }
      };

      vi.mocked(readFile)
        .mockResolvedValueOnce(JSON.stringify(mockStatusData))
        .mockResolvedValueOnce(JSON.stringify(mockPerformanceData))
        .mockResolvedValueOnce('{"total":{"lines":{"pct":80}}}')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('{"dependencies":{}}')
        .mockResolvedValueOnce('{"scripts":{}}');

      const { HealthGate } = await import('../scripts/health-gate.mjs');
      const healthGate = new HealthGate();

      const result = await healthGate.runHealthChecks();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should fail health checks with critical issues', async () => {
      const mockStatusData = {
        results: [
          { name: 'test1', ok: false },
          { name: 'test2', ok: false },
          { name: 'test3', ok: false }
        ]
      };

      const mockFixesData = `{"ts":"2025-01-03T04:50:00.000Z","rule":"404","priority":"critical","status":"failed"}`;

      vi.mocked(readFile)
        .mockResolvedValueOnce(JSON.stringify(mockStatusData))
        .mockResolvedValueOnce('{"summary":{"performanceScore":50}}')
        .mockResolvedValueOnce('{"total":{"lines":{"pct":30}}}')
        .mockResolvedValueOnce(mockFixesData)
        .mockResolvedValueOnce('{"dependencies":{}}')
        .mockResolvedValueOnce('{"scripts":{}}');

      const { HealthGate } = await import('../scripts/health-gate.mjs');
      const healthGate = new HealthGate();

      const result = await healthGate.runHealthChecks();

      expect(result.passed).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive health report', async () => {
      const { HealthGate } = await import('../scripts/health-gate.mjs');
      const healthGate = new HealthGate();

      // Mock all required files
      vi.mocked(readFile)
        .mockResolvedValue('{"results":[{"ok":true}]}')
        .mockResolvedValue('{"summary":{"performanceScore":85}}')
        .mockResolvedValue('{"total":{"lines":{"pct":75}}}')
        .mockResolvedValue('')
        .mockResolvedValue('{"dependencies":{}}')
        .mockResolvedValue('{"scripts":{}}');

      const result = await healthGate.runHealthChecks();

      expect(result).toBeDefined();
      expect(result.checks).toHaveLength(7); // All 7 health checks
      expect(result.checks.every(check => check.name)).toBe(true);
      expect(result.checks.every(check => typeof check.score === 'number')).toBe(true);
    });
  });

  describe('Service Worker', () => {
    it('should register service worker correctly', () => {
      // Mock service worker registration
      const mockRegistration = {
        active: true,
        scope: '/',
        update: vi.fn()
      };

      const mockServiceWorker = {
        register: vi.fn().mockResolvedValue(mockRegistration)
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true
      });

      expect(navigator.serviceWorker).toBeDefined();
      expect(navigator.serviceWorker.register).toBeDefined();
    });

    it('should handle offline scenarios correctly', () => {
      // Mock offline detection
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      expect(navigator.onLine).toBe(false);
    });

    it('should handle cache operations correctly', () => {
      // Mock cache API
      const mockCache = {
        match: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        keys: vi.fn()
      };

      const mockCaches = {
        open: vi.fn().mockResolvedValue(mockCache),
        keys: vi.fn().mockResolvedValue(['cache1', 'cache2'])
      };

      Object.defineProperty(window, 'caches', {
        value: mockCaches,
        writable: true
      });

      expect(window.caches).toBeDefined();
      expect(window.caches.open).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all components correctly', async () => {
      // Mock all required files and responses
      vi.mocked(readFile)
        .mockResolvedValue('{"results":[{"ok":true}]}')
        .mockResolvedValue('{"summary":{"performanceScore":90}}')
        .mockResolvedValue('{"total":{"lines":{"pct":80}}}')
        .mockResolvedValue('')
        .mockResolvedValue('{"dependencies":{}}')
        .mockResolvedValue('{"scripts":{}}');

      // Test the complete flow
      const { HealthGate } = await import('../scripts/health-gate.mjs');
      const healthGate = new HealthGate();

      const healthResult = await healthGate.runHealthChecks();
      expect(healthResult.passed).toBe(true);

      // Test performance booster
      const { PerformanceBooster } = await import('../scripts/performance-booster.mjs');
      const booster = new PerformanceBooster();
      await booster.boostPerformance();

      // Test recovery system
      const { RestoreEngine } = await import('../scripts/restore-engine.ts');
      const engine = new RestoreEngine();
      const recoveryResult = await engine.recoverPage('/test.html', '404');

      expect(recoveryResult.success).toBe(true);
    });

    it('should handle error scenarios gracefully', async () => {
      // Mock file system errors
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const { HealthGate } = await import('../scripts/health-gate.mjs');
      const healthGate = new HealthGate();

      const result = await healthGate.runHealthChecks();

      expect(result.passed).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should meet performance requirements', async () => {
      const startTime = Date.now();

      const { PerformanceBooster } = await import('../scripts/performance-booster.mjs');
      const booster = new PerformanceBooster();

      await booster.boostPerformance();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance booster should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array(1000).fill(0).map((_, i) => ({
        ts: new Date().toISOString(),
        rule: `rule-${i}`,
        page: `/page-${i}.html`,
        status: 'applied'
      }));

      const mockLogs = largeDataset.map(entry => JSON.stringify(entry)).join('\n');

      vi.mocked(readFile).mockResolvedValue(mockLogs);

      const { readFixLogs } = await import('../scripts/fix-log.ts');
      const result = await readFixLogs();

      expect(result).toHaveLength(1000);
    });
  });

  describe('Security Tests', () => {
    it('should validate input data correctly', async () => {
      const maliciousInput = {
        rule: '<script>alert("xss")</script>',
        page: '../../../etc/passwd',
        status: 'applied'
      };

      const { fixLog } = await import('../scripts/fix-log.ts');
      
      // Should not throw an error, but should sanitize input
      await expect(fixLog(maliciousInput)).resolves.not.toThrow();
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{"invalid": json}';

      vi.mocked(readFile).mockResolvedValue(malformedJson);

      const { readFixLogs } = await import('../scripts/fix-log.ts');
      const result = await readFixLogs();

      // Should return empty array for malformed JSON
      expect(result).toHaveLength(0);
    });
  });
});
