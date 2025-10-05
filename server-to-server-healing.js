// Server-to-Server Auto-Healing Cron Job
// Läuft automatisch alle 30 Sekunden auf jedem Server

const AUTO_HEAL_INTERVAL = 30000; // 30 Sekunden
const SERVERS = [
    'https://onair-edge.telcotelekom.workers.dev',
    'https://viewunitysystem.github.io/OnAirMulTiMedia',
    'https://onairmultimedia.web.app'
];

class ServerToServerAutoHealing {
    constructor() {
        this.isRunning = false;
        this.healingInterval = null;
        this.lastHealResults = null;
    }

    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🔄 Server-to-Server Auto-Healing started');
        
        // Sofortige erste Heilung
        await this.performHealing();
        
        // Automatische Heilung alle 30 Sekunden
        this.healingInterval = setInterval(async () => {
            await this.performHealing();
        }, AUTO_HEAL_INTERVAL);
    }

    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.healingInterval) {
            clearInterval(this.healingInterval);
            this.healingInterval = null;
        }
        
        console.log('⏹️ Server-to-Server Auto-Healing stopped');
    }

    async performHealing() {
        const healResults = {
            timestamp: new Date().toISOString(),
            server: window.location.origin,
            scans: [],
            fixes: [],
            errors: []
        };

        console.log('🔍 Starting server-to-server healing scan...');

        for (const server of SERVERS) {
            if (server === window.location.origin) continue; // Nicht sich selbst scannen
            
            try {
                // Server scannen
                const scanResult = await this.scanServer(server);
                healResults.scans.push(scanResult);

                // Bugs reparieren
                if (scanResult.bugs && scanResult.bugs.length > 0) {
                    const fixResults = await this.fixServerBugs(server, scanResult.bugs);
                    healResults.fixes.push(...fixResults);
                }

            } catch (error) {
                healResults.errors.push({
                    server: server,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.warn(`❌ Healing failed for ${server}:`, error);
            }
        }

        this.lastHealResults = healResults;
        console.log('✅ Server-to-Server healing completed:', healResults);
        
        return healResults;
    }

    async scanServer(serverUrl) {
        try {
            const response = await fetch(`${serverUrl}/auto-heal`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    server: serverUrl,
                    status: 'healthy',
                    bugs: data.bugs || [],
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    server: serverUrl,
                    status: 'unhealthy',
                    bugs: [],
                    error: `HTTP ${response.status}`,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                server: serverUrl,
                status: 'error',
                bugs: [],
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async fixServerBugs(serverUrl, bugs) {
        const fixResults = [];

        for (const bug of bugs) {
            try {
                const fix = this.generateFix(bug);
                if (fix) {
                    const fixResult = await this.applyFix(serverUrl, bug, fix);
                    fixResults.push({
                        server: serverUrl,
                        bug: bug.type,
                        fix: fix.type,
                        success: fixResult,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                fixResults.push({
                    server: serverUrl,
                    bug: bug.type,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return fixResults;
    }

    generateFix(bug) {
        const fixTemplates = {
            javascript: {
                'process is not defined': {
                    fix: 'if (typeof process !== \'undefined\') { /* process code */ }',
                    type: 'conditional-check'
                },
                'addAll failed': {
                    fix: 'Promise.allSettled(resources.map(r => cache.put(r, fetch(r))))',
                    type: 'promise-handling'
                }
            },
            css: {
                'missing property': {
                    fix: '/* Add missing CSS property */',
                    type: 'property-addition'
                }
            },
            api: {
                '404': {
                    fix: 'Add missing endpoint or redirect',
                    type: 'endpoint-creation'
                },
                '500': {
                    fix: 'Add error handling and fallback',
                    type: 'error-handling'
                }
            }
        };

        const bugType = fixTemplates[bug.type];
        if (bugType) {
            for (const [pattern, fix] of Object.entries(bugType)) {
                if (bug.message.toLowerCase().includes(pattern.toLowerCase())) {
                    return {
                        ...fix,
                        bug: bug,
                        timestamp: new Date().toISOString()
                    };
                }
            }
        }

        return null;
    }

    async applyFix(serverUrl, bug, fix) {
        try {
            const response = await fetch(`${serverUrl}/server-fix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetServer: serverUrl, bug, fix })
            });

            return response.ok;
        } catch (error) {
            console.warn(`Failed to apply fix to ${serverUrl}:`, error);
            return false;
        }
    }

    getLastResults() {
        return this.lastHealResults;
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: AUTO_HEAL_INTERVAL,
            servers: SERVERS,
            lastResults: this.lastHealResults
        };
    }
}

// Auto-Start wenn im Browser
if (typeof window !== 'undefined') {
    window.serverToServerHealing = new ServerToServerAutoHealing();
    
    // Starte automatisch wenn Seite geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.serverToServerHealing.start();
        });
    } else {
        window.serverToServerHealing.start();
    }
}

// Export für Module-System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServerToServerAutoHealing;
}
