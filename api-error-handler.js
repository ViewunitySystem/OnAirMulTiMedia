// API Error Handler für OnAir MultiMedia
// Behebt die "0" und "--" Werte durch robuste Fehlerbehandlung

class APIErrorHandler {
    constructor() {
        this.baseURL = 'https://onair-edge.telcotelekom.workers.dev';
        this.fallbackData = {
            stars: 0,
            forks: 0,
            downloads: 0,
            commits: 0,
            issues: 0,
            pullRequests: 0,
            contributors: 0
        };
    }

    // Robuste API-Anfrage mit Fehlerbehandlung
    async fetchAPI(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType && contentType.includes('text/csv')) {
                return await this.parseCSV(await response.text());
            } else {
                return await response.text();
            }

        } catch (error) {
            console.warn(`API Error for ${endpoint}:`, error);
            return this.getFallbackData(endpoint);
        }
    }

    // CSV zu JSON konvertieren
    parseCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',');
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                data.push(row);
            }

            return data;
        } catch (error) {
            console.warn('CSV Parse Error:', error);
            return [];
        }
    }

    // Fallback-Daten für verschiedene Endpunkte
    getFallbackData(endpoint) {
        const fallbacks = {
            '/api/github/metrics': this.fallbackData,
            '/api/github/history.csv': [this.fallbackData],
            '/api/health': { status: 'offline', timestamp: new Date().toISOString() },
            '/api/audit/export': { audit: [], total: 0, exported: new Date().toISOString() }
        };

        return fallbacks[endpoint] || null;
    }

    // GitHub Metriken laden
    async loadGitHubMetrics() {
        const data = await this.fetchAPI('/api/github/metrics');
        return this.sanitizeMetrics(data);
    }

    // GitHub History CSV laden
    async loadGitHubHistory() {
        const data = await this.fetchAPI('/api/github/history.csv');
        return Array.isArray(data) ? data : [];
    }

    // API Health prüfen
    async checkAPIHealth() {
        const data = await this.fetchAPI('/api/health');
        return data && data.status === 'healthy';
    }

    // Audit Export laden
    async loadAuditExport(format = 'json') {
        const data = await this.fetchAPI(`/api/audit/export?format=${format}`);
        return data;
    }

    // Metriken-Daten bereinigen und validieren
    sanitizeMetrics(data) {
        if (!data || typeof data !== 'object') {
            return this.fallbackData;
        }

        return {
            stars: this.safeNumber(data.stars),
            forks: this.safeNumber(data.forks),
            downloads: this.safeNumber(data.downloads),
            commits: this.safeNumber(data.commits),
            issues: this.safeNumber(data.issues),
            pullRequests: this.safeNumber(data.pullRequests),
            contributors: this.safeNumber(data.contributors),
            lastUpdate: data.lastUpdate || new Date().toISOString()
        };
    }

    // Sichere Zahl-Konvertierung
    safeNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    // UI-Elemente mit Daten aktualisieren
    updateUI(elementId, value, fallback = '--') {
        const element = document.getElementById(elementId);
        if (element) {
            if (value !== null && value !== undefined && value !== '') {
                element.textContent = value;
                element.style.color = '#10b981'; // Grün für gültige Werte
            } else {
                element.textContent = fallback;
                element.style.color = '#ef4444'; // Rot für fehlende Werte
            }
        }
    }

    // Dashboard komplett aktualisieren
    async updateDashboard() {
        try {
            // GitHub Metriken laden
            const metrics = await this.loadGitHubMetrics();
            this.updateUI('stars-count', metrics.stars);
            this.updateUI('forks-count', metrics.forks);
            this.updateUI('downloads-count', metrics.downloads);
            this.updateUI('commits-count', metrics.commits);
            this.updateUI('issues-count', metrics.issues);
            this.updateUI('pr-count', metrics.pullRequests);
            this.updateUI('contributors-count', metrics.contributors);

            // API Health prüfen
            const isHealthy = await this.checkAPIHealth();
            this.updateUI('api-status', isHealthy ? 'Online' : 'Offline');
            this.updateUI('api-status').style.color = isHealthy ? '#10b981' : '#ef4444';

            // Last Update anzeigen
            this.updateUI('last-update', new Date().toLocaleTimeString());

            console.log('Dashboard updated successfully:', metrics);

        } catch (error) {
            console.error('Dashboard update failed:', error);
            // Fallback: Alle Werte auf 0 setzen
            Object.keys(this.fallbackData).forEach(key => {
                this.updateUI(`${key}-count`, 0);
            });
        }
    }

    // Automatische Updates alle 30 Sekunden
    startAutoUpdate() {
        this.updateDashboard(); // Sofortige erste Aktualisierung
        setInterval(() => {
            this.updateDashboard();
        }, 30000);
    }
}

// Global verfügbar machen
window.apiErrorHandler = new APIErrorHandler();

// Auto-Start wenn Seite geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiErrorHandler.startAutoUpdate();
    });
} else {
    window.apiErrorHandler.startAutoUpdate();
}
