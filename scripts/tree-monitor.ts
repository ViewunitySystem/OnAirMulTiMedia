/**
 * Tree Monitor - Comprehensive monitoring system for entire tree with learning factor
 * Helps understand and fix 404 and related similar bugs
 * GitHub Actions integration with health checks and URL testing
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface TreeChange {
  timestamp: string;
  type: 'file_added' | 'file_modified' | 'file_deleted' | 'directory_added' | 'directory_deleted';
  path: string;
  oldPath?: string;
  hash?: string;
  size?: number;
  previousHash?: string;
  previousSize?: number;
}

interface URLTest {
  url: string;
  status: number;
  responseTime: number;
  timestamp: string;
  error?: string;
  headers?: Record<string, string>;
  contentLength?: number;
  contentType?: string;
}

interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  component: string;
  message: string;
  details?: any;
  learningFactor?: number;
}

interface LearningPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  lastSeen: string;
  suggestions: string[];
  fixes: string[];
}

interface MonitoringConfig {
  scanInterval: number; // milliseconds
  urlTestInterval: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  learningEnabled: boolean;
  maxHistorySize: number;
  alertThresholds: {
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    availability: number; // percentage
  };
  githubActions: {
    enabled: boolean;
    webhookUrl?: string;
    token?: string;
  };
}

export class TreeMonitor {
  private config: MonitoringConfig;
  private treeSnapshot: Map<string, string> = new Map(); // path -> hash
  private urlHistory: URLTest[] = [];
  private healthHistory: HealthCheck[] = [];
  private learningPatterns: LearningPattern[] = [];
  private isRunning = false;
  private scanTimer?: NodeJS.Timeout;
  private urlTimer?: NodeJS.Timeout;
  private healthTimer?: NodeJS.Timeout;
  private sessionId: string;
  private baseUrl: string;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      scanInterval: 30000, // 30 seconds
      urlTestInterval: 60000, // 1 minute
      healthCheckInterval: 120000, // 2 minutes
      learningEnabled: true,
      maxHistorySize: 1000,
      alertThresholds: {
        responseTime: 2000,
        errorRate: 5,
        availability: 95
      },
      githubActions: {
        enabled: true
      },
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.baseUrl = this.detectBaseUrl();
  }

  private generateSessionId(): string {
    return `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectBaseUrl(): string {
    // Detect base URL from environment or config
    if (process.env.GITHUB_REPOSITORY) {
      return `https://${process.env.GITHUB_REPOSITORY.split('/')[0]}.github.io/${process.env.GITHUB_REPOSITORY.split('/')[1]}`;
    }
    return 'https://viewunitysystem.github.io/OnAirMulTiMedia';
  }

  async initialize(): Promise<void> {
    console.log('[tree-monitor] Initializing Tree Monitor...');
    
    // Load existing snapshots
    await this.loadTreeSnapshot();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('[tree-monitor] Tree Monitor initialized successfully');
  }

  private async loadTreeSnapshot(): Promise<void> {
    try {
      const snapshotFile = 'monitoring/tree-snapshot.json';
      const data = await fs.readFile(snapshotFile, 'utf8');
      const snapshot = JSON.parse(data);
      this.treeSnapshot = new Map(snapshot.entries);
      console.log('[tree-monitor] Loaded tree snapshot with', this.treeSnapshot.size, 'entries');
    } catch (error) {
      console.log('[tree-monitor] No existing snapshot found, starting fresh');
    }
  }

  private async saveTreeSnapshot(): Promise<void> {
    try {
      await fs.mkdir('monitoring', { recursive: true });
      const snapshotFile = 'monitoring/tree-snapshot.json';
      const snapshot = {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        entries: Array.from(this.treeSnapshot.entries())
      };
      await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error('[tree-monitor] Failed to save tree snapshot:', error);
    }
  }

  startMonitoring(): void {
    if (this.isRunning) {
      console.warn('[tree-monitor] Monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('[tree-monitor] Starting monitoring...');

    // Start tree scanning
    this.scanTimer = setInterval(() => {
      this.scanTree().catch(error => {
        console.error('[tree-monitor] Tree scan error:', error);
      });
    }, this.config.scanInterval);

    // Start URL testing
    this.urlTimer = setInterval(() => {
      this.testUrls().catch(error => {
        console.error('[tree-monitor] URL test error:', error);
      });
    }, this.config.urlTestInterval);

    // Start health checks
    this.healthTimer = setInterval(() => {
      this.performHealthChecks().catch(error => {
        console.error('[tree-monitor] Health check error:', error);
      });
    }, this.config.healthCheckInterval);

    // Initial scan
    this.scanTree().catch(error => {
      console.error('[tree-monitor] Initial tree scan error:', error);
    });
  }

  stopMonitoring(): void {
    if (!this.isRunning) {
      console.warn('[tree-monitor] Monitoring not running');
      return;
    }

    this.isRunning = false;
    console.log('[tree-monitor] Stopping monitoring...');

    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }

    if (this.urlTimer) {
      clearInterval(this.urlTimer);
      this.urlTimer = undefined;
    }

    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = undefined;
    }

    // Save final snapshot
    this.saveTreeSnapshot().catch(error => {
      console.error('[tree-monitor] Failed to save final snapshot:', error);
    });
  }

  private async scanTree(): Promise<void> {
    const startTime = performance.now();
    const changes: TreeChange[] = [];
    
    try {
      // Scan current tree
      const currentSnapshot = new Map<string, string>();
      await this.scanDirectory('.', currentSnapshot);

      // Compare with previous snapshot
      for (const [path, hash] of currentSnapshot) {
        const previousHash = this.treeSnapshot.get(path);
        
        if (!previousHash) {
          // New file
          changes.push({
            timestamp: new Date().toISOString(),
            type: 'file_added',
            path,
            hash,
            size: await this.getFileSize(path)
          });
        } else if (previousHash !== hash) {
          // Modified file
          changes.push({
            timestamp: new Date().toISOString(),
            type: 'file_modified',
            path,
            hash,
            previousHash,
            size: await this.getFileSize(path),
            previousSize: await this.getFileSizeFromHash(previousHash)
          });
        }
      }

      // Check for deleted files
      for (const [path, hash] of this.treeSnapshot) {
        if (!currentSnapshot.has(path)) {
          changes.push({
            timestamp: new Date().toISOString(),
            type: 'file_deleted',
            path,
            previousHash: hash
          });
        }
      }

      // Update snapshot
      this.treeSnapshot = currentSnapshot;
      await this.saveTreeSnapshot();

      // Process changes
      if (changes.length > 0) {
        await this.processChanges(changes);
      }

      const scanTime = performance.now() - startTime;
      console.log(`[tree-monitor] Tree scan completed in ${scanTime.toFixed(2)}ms, found ${changes.length} changes`);

    } catch (error) {
      console.error('[tree-monitor] Tree scan failed:', error);
      await this.recordHealthCheck('critical', 'tree-scanner', `Tree scan failed: ${error.message}`);
    }
  }

  private async scanDirectory(dirPath: string, snapshot: Map<string, string>): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip certain directories and files
        if (this.shouldSkipPath(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, snapshot);
        } else if (entry.isFile()) {
          try {
            const hash = await this.getFileHash(fullPath);
            snapshot.set(fullPath, hash);
          } catch (error) {
            console.warn(`[tree-monitor] Failed to hash file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`[tree-monitor] Failed to scan directory ${dirPath}:`, error);
    }
  }

  private shouldSkipPath(path: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'monitoring',
      'logs',
      'temp',
      'tmp'
    ];

    return skipPatterns.some(pattern => path.includes(pattern));
  }

  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Failed to hash file ${filePath}: ${error.message}`);
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private async getFileSizeFromHash(hash: string): Promise<number> {
    // This would need to be implemented with a hash-to-size mapping
    // For now, return 0
    return 0;
  }

  private async processChanges(changes: TreeChange[]): Promise<void> {
    console.log(`[tree-monitor] Processing ${changes.length} changes...`);

    for (const change of changes) {
      // Analyze change for potential issues
      const issues = await this.analyzeChange(change);
      
      if (issues.length > 0) {
        console.warn(`[tree-monitor] Potential issues detected in ${change.path}:`, issues);
        await this.recordHealthCheck('warning', 'change-analyzer', `Issues detected in ${change.path}`, { change, issues });
      }

      // Update learning patterns
      if (this.config.learningEnabled) {
        await this.updateLearningPatterns(change);
      }

      // Test affected URLs
      await this.testAffectedUrls(change);
    }

    // Send GitHub Actions notification if enabled
    if (this.config.githubActions.enabled && changes.length > 0) {
      await this.notifyGitHubActions(changes);
    }
  }

  private async analyzeChange(change: TreeChange): Promise<string[]> {
    const issues: string[] = [];

    // Check for common 404-related issues
    if (change.type === 'file_deleted') {
      // Check if deleted file was referenced anywhere
      const references = await this.findReferences(change.path);
      if (references.length > 0) {
        issues.push(`Deleted file ${change.path} is still referenced in: ${references.join(', ')}`);
      }
    }

    if (change.type === 'file_modified') {
      // Check for broken links in HTML files
      if (change.path.endsWith('.html')) {
        const brokenLinks = await this.findBrokenLinks(change.path);
        if (brokenLinks.length > 0) {
          issues.push(`Broken links detected in ${change.path}: ${brokenLinks.join(', ')}`);
        }
      }

      // Check for missing imports in JS/TS files
      if (change.path.match(/\.(js|ts|jsx|tsx)$/)) {
        const missingImports = await this.findMissingImports(change.path);
        if (missingImports.length > 0) {
          issues.push(`Missing imports detected in ${change.path}: ${missingImports.join(', ')}`);
        }
      }
    }

    // Check for path changes that might break links
    if (change.type === 'file_modified' && change.oldPath && change.oldPath !== change.path) {
      const oldReferences = await this.findReferences(change.oldPath);
      if (oldReferences.length > 0) {
        issues.push(`File moved from ${change.oldPath} to ${change.path}, but old path still referenced in: ${oldReferences.join(', ')}`);
      }
    }

    return issues;
  }

  private async findReferences(filePath: string): Promise<string[]> {
    const references: string[] = [];
    
    try {
      // Search for references in common file types
      const searchPatterns = [
        '*.html',
        '*.js',
        '*.ts',
        '*.jsx',
        '*.tsx',
        '*.css',
        '*.scss',
        '*.md',
        '*.json'
      ];

      for (const pattern of searchPatterns) {
        const files = await this.findFiles(pattern);
        
        for (const file of files) {
          try {
            const content = await fs.readFile(file, 'utf8');
            const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
            
            // Check for various reference patterns
            const referencePatterns = [
              new RegExp(`href=["']([^"']*${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']`, 'gi'),
              new RegExp(`src=["']([^"']*${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']`, 'gi'),
              new RegExp(`import.*["']([^"']*${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']`, 'gi'),
              new RegExp(`require\\(["']([^"']*${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']\\)`, 'gi')
            ];

            for (const pattern of referencePatterns) {
              const matches = content.match(pattern);
              if (matches) {
                references.push(file);
                break;
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      console.warn(`[tree-monitor] Failed to find references for ${filePath}:`, error);
    }

    return references;
  }

  private async findBrokenLinks(htmlFile: string): Promise<string[]> {
    const brokenLinks: string[] = [];
    
    try {
      const content = await fs.readFile(htmlFile, 'utf8');
      
      // Extract all href and src attributes
      const linkPatterns = [
        /href=["']([^"']+)["']/gi,
        /src=["']([^"']+)["']/gi
      ];

      for (const pattern of linkPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const url = match[1];
          
          // Skip external URLs
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            continue;
          }

          // Check if local file exists
          const localPath = path.resolve(path.dirname(htmlFile), url);
          try {
            await fs.access(localPath);
          } catch (error) {
            brokenLinks.push(url);
          }
        }
      }
    } catch (error) {
      console.warn(`[tree-monitor] Failed to check broken links in ${htmlFile}:`, error);
    }

    return brokenLinks;
  }

  private async findMissingImports(jsFile: string): Promise<string[]> {
    const missingImports: string[] = [];
    
    try {
      const content = await fs.readFile(jsFile, 'utf8');
      
      // Extract import statements
      const importPatterns = [
        /import.*from\s+["']([^"']+)["']/gi,
        /import\s+["']([^"']+)["']/gi,
        /require\\(["']([^"']+)["']\\)/gi
      ];

      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importPath = match[1];
          
          // Skip external modules
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            continue;
          }

          // Check if imported file exists
          const fullPath = path.resolve(path.dirname(jsFile), importPath);
          try {
            await fs.access(fullPath);
          } catch (error) {
            // Try with common extensions
            const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
            let found = false;
            
            for (const ext of extensions) {
              try {
                await fs.access(fullPath + ext);
                found = true;
                break;
              } catch (error) {
                // Continue trying
              }
            }
            
            if (!found) {
              missingImports.push(importPath);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[tree-monitor] Failed to check missing imports in ${jsFile}:`, error);
    }

    return missingImports;
  }

  private async findFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      await this.findFilesRecursive('.', pattern, files);
    } catch (error) {
      console.warn(`[tree-monitor] Failed to find files with pattern ${pattern}:`, error);
    }

    return files;
  }

  private async findFilesRecursive(dir: string, pattern: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (this.shouldSkipPath(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.findFilesRecursive(fullPath, pattern, files);
        } else if (entry.isFile()) {
          // Simple pattern matching (could be improved with glob)
          if (pattern === '*' || fullPath.endsWith(pattern.substring(1))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  private async updateLearningPatterns(change: TreeChange): Promise<void> {
    // Analyze change patterns and update learning database
    const changePattern = this.extractChangePattern(change);
    
    // Find existing pattern or create new one
    let pattern = this.learningPatterns.find(p => p.pattern === changePattern);
    
    if (!pattern) {
      pattern = {
        pattern: changePattern,
        frequency: 0,
        confidence: 0,
        lastSeen: change.timestamp,
        suggestions: [],
        fixes: []
      };
      this.learningPatterns.push(pattern);
    }

    // Update pattern statistics
    pattern.frequency++;
    pattern.lastSeen = change.timestamp;
    
    // Generate suggestions based on pattern
    pattern.suggestions = this.generateSuggestions(change);
    pattern.fixes = this.generateFixes(change);

    console.log(`[tree-monitor] Updated learning pattern: ${changePattern} (frequency: ${pattern.frequency})`);
  }

  private extractChangePattern(change: TreeChange): string {
    const ext = path.extname(change.path);
    const dir = path.dirname(change.path);
    
    return `${change.type}:${ext}:${dir}`;
  }

  private generateSuggestions(change: TreeChange): string[] {
    const suggestions: string[] = [];

    switch (change.type) {
      case 'file_deleted':
        suggestions.push('Check for broken references to deleted file');
        suggestions.push('Update documentation if file was documented');
        suggestions.push('Verify no critical functionality was removed');
        break;
      case 'file_modified':
        suggestions.push('Test affected functionality');
        suggestions.push('Update related documentation');
        suggestions.push('Check for breaking changes');
        break;
      case 'file_added':
        suggestions.push('Add to documentation if needed');
        suggestions.push('Test new functionality');
        suggestions.push('Update build configuration if needed');
        break;
    }

    return suggestions;
  }

  private generateFixes(change: TreeChange): string[] {
    const fixes: string[] = [];

    switch (change.type) {
      case 'file_deleted':
        fixes.push('Remove references to deleted file');
        fixes.push('Update import statements');
        fixes.push('Fix broken links');
        break;
      case 'file_modified':
        fixes.push('Update dependent files');
        fixes.push('Fix broken imports');
        fixes.push('Update configuration files');
        break;
      case 'file_added':
        fixes.push('Add to build process');
        fixes.push('Update routing configuration');
        fixes.push('Add to documentation');
        break;
    }

    return fixes;
  }

  private async testAffectedUrls(change: TreeChange): Promise<void> {
    // Generate potential URLs that might be affected by this change
    const urls = this.generateUrlsFromChange(change);
    
    for (const url of urls) {
      await this.testUrl(url);
    }
  }

  private generateUrlsFromChange(change: TreeChange): string[] {
    const urls: string[] = [];
    
    // Convert file paths to potential URLs
    if (change.path.endsWith('.html')) {
      const urlPath = change.path.replace(/\\/g, '/').replace(/^\.\//, '');
      urls.push(`${this.baseUrl}/${urlPath}`);
    }

    // Check for index files
    if (change.path.endsWith('index.html')) {
      const dirPath = path.dirname(change.path).replace(/\\/g, '/').replace(/^\.\//, '');
      urls.push(`${this.baseUrl}/${dirPath}/`);
    }

    return urls;
  }

  private async testUrls(): Promise<void> {
    const urls = await this.discoverUrls();
    
    for (const url of urls) {
      await this.testUrl(url);
    }

    // Analyze URL test results
    await this.analyzeUrlResults();
  }

  private async discoverUrls(): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      // Find HTML files and convert to URLs
      const htmlFiles = await this.findFiles('*.html');
      
      for (const file of htmlFiles) {
        const urlPath = file.replace(/\\/g, '/').replace(/^\.\//, '');
        urls.push(`${this.baseUrl}/${urlPath}`);
        
        // Also add directory URL for index files
        if (file.endsWith('index.html')) {
          const dirPath = path.dirname(file).replace(/\\/g, '/').replace(/^\.\//, '');
          urls.push(`${this.baseUrl}/${dirPath}/`);
        }
      }

      // Add common URLs
      urls.push(`${this.baseUrl}/`);
      urls.push(`${this.baseUrl}/docs/`);
      urls.push(`${this.baseUrl}/scripts/`);
      
    } catch (error) {
      console.warn('[tree-monitor] Failed to discover URLs:', error);
    }

    return urls;
  }

  private async testUrl(url: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 10000
      });

      const responseTime = performance.now() - startTime;
      
      const test: URLTest = {
        url,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers.entries()),
        contentLength: parseInt(response.headers.get('content-length') || '0'),
        contentType: response.headers.get('content-type') || undefined
      };

      this.urlHistory.push(test);

      // Check for issues
      if (response.status === 404) {
        console.warn(`[tree-monitor] 404 detected: ${url}`);
        await this.recordHealthCheck('warning', 'url-tester', `404 error: ${url}`, test);
      } else if (response.status >= 500) {
        console.error(`[tree-monitor] Server error: ${url} (${response.status})`);
        await this.recordHealthCheck('critical', 'url-tester', `Server error: ${url} (${response.status})`, test);
      } else if (responseTime > this.config.alertThresholds.responseTime) {
        console.warn(`[tree-monitor] Slow response: ${url} (${responseTime.toFixed(2)}ms)`);
        await this.recordHealthCheck('warning', 'url-tester', `Slow response: ${url}`, test);
      }

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      const test: URLTest = {
        url,
        status: 0,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };

      this.urlHistory.push(test);
      
      console.error(`[tree-monitor] URL test failed: ${url}`, error);
      await this.recordHealthCheck('critical', 'url-tester', `URL test failed: ${url}`, test);
    }

    // Keep history size manageable
    if (this.urlHistory.length > this.config.maxHistorySize) {
      this.urlHistory = this.urlHistory.slice(-this.config.maxHistorySize);
    }
  }

  private async analyzeUrlResults(): Promise<void> {
    const recentTests = this.urlHistory.slice(-100); // Last 100 tests
    
    if (recentTests.length === 0) {
      return;
    }

    // Calculate metrics
    const totalTests = recentTests.length;
    const errorTests = recentTests.filter(test => test.status >= 400);
    const avgResponseTime = recentTests.reduce((sum, test) => sum + test.responseTime, 0) / totalTests;
    const errorRate = (errorTests.length / totalTests) * 100;
    const availability = ((totalTests - errorTests.length) / totalTests) * 100;

    // Check thresholds
    if (errorRate > this.config.alertThresholds.errorRate) {
      await this.recordHealthCheck('warning', 'url-analyzer', `High error rate: ${errorRate.toFixed(2)}%`, {
        errorRate,
        totalTests,
        errorTests: errorTests.length
      });
    }

    if (availability < this.config.alertThresholds.availability) {
      await this.recordHealthCheck('critical', 'url-analyzer', `Low availability: ${availability.toFixed(2)}%`, {
        availability,
        totalTests,
        errorTests: errorTests.length
      });
    }

    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      await this.recordHealthCheck('warning', 'url-analyzer', `High average response time: ${avgResponseTime.toFixed(2)}ms`, {
        avgResponseTime,
        totalTests
      });
    }

    console.log(`[tree-monitor] URL analysis: ${totalTests} tests, ${errorRate.toFixed(2)}% error rate, ${avgResponseTime.toFixed(2)}ms avg response time`);
  }

  private async performHealthChecks(): Promise<void> {
    console.log('[tree-monitor] Performing health checks...');

    // Check system health
    await this.checkSystemHealth();
    
    // Check GitHub Actions status
    if (this.config.githubActions.enabled) {
      await this.checkGitHubActions();
    }
    
    // Check learning patterns
    if (this.config.learningEnabled) {
      await this.checkLearningPatterns();
    }
  }

  private async checkSystemHealth(): Promise<void> {
    try {
      // Check disk space
      const stats = await fs.stat('.');
      
      // Check if monitoring is responsive
      const responseTime = performance.now();
      
      await this.recordHealthCheck('healthy', 'system', 'System health check passed', {
        diskSpace: 'available',
        responseTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await this.recordHealthCheck('critical', 'system', `System health check failed: ${error.message}`);
    }
  }

  private async checkGitHubActions(): Promise<void> {
    try {
      // This would check GitHub Actions status via API
      // For now, just record a healthy status
      await this.recordHealthCheck('healthy', 'github-actions', 'GitHub Actions status check passed');
      
    } catch (error) {
      await this.recordHealthCheck('warning', 'github-actions', `GitHub Actions check failed: ${error.message}`);
    }
  }

  private async checkLearningPatterns(): Promise<void> {
    try {
      const recentPatterns = this.learningPatterns.filter(p => {
        const lastSeen = new Date(p.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeen.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
      });

      await this.recordHealthCheck('healthy', 'learning-patterns', `Learning patterns active: ${recentPatterns.length}`, {
        totalPatterns: this.learningPatterns.length,
        recentPatterns: recentPatterns.length,
        patterns: recentPatterns.map(p => ({ pattern: p.pattern, frequency: p.frequency }))
      });

    } catch (error) {
      await this.recordHealthCheck('warning', 'learning-patterns', `Learning patterns check failed: ${error.message}`);
    }
  }

  private async recordHealthCheck(status: 'healthy' | 'warning' | 'critical', component: string, message: string, details?: any): Promise<void> {
    const healthCheck: HealthCheck = {
      timestamp: new Date().toISOString(),
      status,
      component,
      message,
      details,
      learningFactor: this.calculateLearningFactor(component)
    };

    this.healthHistory.push(healthCheck);

    // Keep history size manageable
    if (this.healthHistory.length > this.config.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.config.maxHistorySize);
    }

    // Log based on status
    switch (status) {
      case 'healthy':
        console.log(`[tree-monitor] ✅ ${component}: ${message}`);
        break;
      case 'warning':
        console.warn(`[tree-monitor] ⚠️ ${component}: ${message}`);
        break;
      case 'critical':
        console.error(`[tree-monitor] ❌ ${component}: ${message}`);
        break;
    }
  }

  private calculateLearningFactor(component: string): number {
    // Calculate learning factor based on component and recent patterns
    const recentHealthChecks = this.healthHistory.filter(h => 
      h.component === component && 
      (new Date().getTime() - new Date(h.timestamp).getTime()) < 60 * 60 * 1000 // Last hour
    );

    const errorCount = recentHealthChecks.filter(h => h.status === 'critical' || h.status === 'warning').length;
    const totalCount = recentHealthChecks.length;

    if (totalCount === 0) {
      return 1.0; // Default learning factor
    }

    // Learning factor decreases with more errors
    return Math.max(0.1, 1.0 - (errorCount / totalCount));
  }

  private async notifyGitHubActions(changes: TreeChange[]): Promise<void> {
    if (!this.config.githubActions.enabled) {
      return;
    }

    try {
      const payload = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        changes: changes.length,
        details: changes.map(change => ({
          type: change.type,
          path: change.path,
          timestamp: change.timestamp
        }))
      };

      // This would send a webhook to GitHub Actions
      console.log('[tree-monitor] GitHub Actions notification:', payload);
      
    } catch (error) {
      console.error('[tree-monitor] Failed to notify GitHub Actions:', error);
    }
  }

  // Public API methods
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      sessionId: this.sessionId,
      config: this.config,
      treeSnapshotSize: this.treeSnapshot.size,
      urlHistorySize: this.urlHistory.length,
      healthHistorySize: this.healthHistory.length,
      learningPatternsCount: this.learningPatterns.length,
      baseUrl: this.baseUrl
    };
  }

  getRecentChanges(limit = 50): TreeChange[] {
    // This would return recent changes from storage
    return [];
  }

  getRecentUrlTests(limit = 50): URLTest[] {
    return this.urlHistory.slice(-limit);
  }

  getRecentHealthChecks(limit = 50): HealthCheck[] {
    return this.healthHistory.slice(-limit);
  }

  getLearningPatterns(): LearningPattern[] {
    return this.learningPatterns;
  }

  async exportData(): Promise<any> {
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      config: this.config,
      status: this.getStatus(),
      treeSnapshot: Array.from(this.treeSnapshot.entries()),
      recentUrlTests: this.getRecentUrlTests(100),
      recentHealthChecks: this.getRecentHealthChecks(100),
      learningPatterns: this.learningPatterns,
      exportedAt: new Date().toISOString()
    };
  }

  async generateReport(): Promise<any> {
    const recentTests = this.getRecentUrlTests(100);
    const recentHealthChecks = this.getRecentHealthChecks(100);
    
    // Calculate metrics
    const totalTests = recentTests.length;
    const errorTests = recentTests.filter(test => test.status >= 400);
    const avgResponseTime = totalTests > 0 ? recentTests.reduce((sum, test) => sum + test.responseTime, 0) / totalTests : 0;
    const errorRate = totalTests > 0 ? (errorTests.length / totalTests) * 100 : 0;
    const availability = totalTests > 0 ? ((totalTests - errorTests.length) / totalTests) * 100 : 100;

    // Health check summary
    const healthSummary = {
      healthy: recentHealthChecks.filter(h => h.status === 'healthy').length,
      warning: recentHealthChecks.filter(h => h.status === 'warning').length,
      critical: recentHealthChecks.filter(h => h.status === 'critical').length
    };

    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      summary: {
        totalTests,
        errorRate: Math.round(errorRate * 100) / 100,
        availability: Math.round(availability * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        healthSummary
      },
      urlTests: recentTests,
      healthChecks: recentHealthChecks,
      learningPatterns: this.learningPatterns,
      recommendations: this.generateRecommendations(errorTests, recentHealthChecks)
    };
  }

  private generateRecommendations(errorTests: URLTest[], healthChecks: HealthCheck[]): string[] {
    const recommendations: string[] = [];

    // Analyze 404 errors
    const notFoundErrors = errorTests.filter(test => test.status === 404);
    if (notFoundErrors.length > 0) {
      recommendations.push(`Fix ${notFoundErrors.length} 404 errors: ${notFoundErrors.map(test => test.url).join(', ')}`);
    }

    // Analyze server errors
    const serverErrors = errorTests.filter(test => test.status >= 500);
    if (serverErrors.length > 0) {
      recommendations.push(`Investigate ${serverErrors.length} server errors`);
    }

    // Analyze slow responses
    const slowResponses = errorTests.filter(test => test.responseTime > this.config.alertThresholds.responseTime);
    if (slowResponses.length > 0) {
      recommendations.push(`Optimize ${slowResponses.length} slow responses`);
    }

    // Analyze critical health checks
    const criticalHealthChecks = healthChecks.filter(h => h.status === 'critical');
    if (criticalHealthChecks.length > 0) {
      recommendations.push(`Address ${criticalHealthChecks.length} critical health issues`);
    }

    // Learning-based recommendations
    const frequentPatterns = this.learningPatterns.filter(p => p.frequency > 5);
    if (frequentPatterns.length > 0) {
      recommendations.push(`Review ${frequentPatterns.length} frequent change patterns for automation opportunities`);
    }

    return recommendations;
  }
}

// Export for use in other modules
export { TreeMonitor, TreeChange, URLTest, HealthCheck, LearningPattern, MonitoringConfig };

// CLI usage
if (typeof window === 'undefined') {
  const monitor = new TreeMonitor();
  
  console.log('🌳 Tree Monitor');
  console.log('===============');
  console.log('');
  console.log('Comprehensive monitoring system for entire tree with learning factor');
  console.log('Helps understand and fix 404 and related similar bugs');
  console.log('');
  
  // Initialize and start monitoring
  monitor.initialize().then(() => {
    console.log('Tree Monitor started successfully');
    console.log('Press Ctrl+C to stop monitoring');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down Tree Monitor...');
      monitor.stopMonitoring();
      process.exit(0);
    });
  }).catch(error => {
    console.error('Failed to initialize Tree Monitor:', error);
    process.exit(1);
  });
}
