#!/usr/bin/env node

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

/**
 * 🔧 BUILD-HASH GENERATOR für GitHub Pages
 * 
 * Generiert automatisch 9729e1c-mgdtet46-rhl7oo und ersetzt es in:
 * - index.html (Asset-URLs, SW-Registrierung)
 * - sw.js (Cache-Namen, Asset-Listen)
 * - Modul-Imports (Versionierung)
 * - CSS/JS Assets (Dateinamen)
 */

class BuildHashGenerator {
    constructor() {
        this.buildHash = this.generateBuildHash();
        this.projectRoot = process.cwd();
        this.replacements = new Map();

        console.log(`🔧 9729e1c-mgdtet46-rhl7oo generiert: ${this.buildHash}`);
    }

    generateBuildHash() {
        // Kombiniere Git-Commit + Timestamp + Random für eindeutige Hashes
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const gitCommit = this.getGitCommit();

        return `${gitCommit}-${timestamp}-${random}`;
    }

    getGitCommit() {
        try {
            return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'dev';
        }
    }

    async processFiles() {
        console.log('📁 Verarbeite Dateien...');

        // 1. HTML-Dateien (index.html, etc.)
        await this.processHtmlFiles();

        // 2. Service Worker
        await this.processServiceWorker();

        // 3. Asset-Dateien (CSS, JS)
        await this.processAssets();

        // 4. Modul-Imports
        await this.processModuleImports();

        console.log('✅ Build-Hash Verarbeitung abgeschlossen');
    }

    async processHtmlFiles() {
        const htmlFiles = [
            'index.html',
            'docs/tool-map.html',
            'backup/backup-ui.html',
            'serverfarm-dashboard.html',
            'cloud-sql-dashboard.html'
        ];

        for (const file of htmlFiles) {
            try {
                const filePath = join(this.projectRoot, file);
                const content = await readFile(filePath, 'utf8');

                // Ersetze 9729e1c-mgdtet46-rhl7oo Platzhalter
                const updatedContent = content
                    .replace(/9729e1c-mgdtet46-rhl7oo/g, this.buildHash)
                    .replace(/v=\?\w+/g, `v=${this.buildHash}`)
                    .replace(/style\.\w+\.css/g, `style.${this.buildHash}.css`)
                    .replace(/app\.\w+\.js/g, `app.${this.buildHash}.js`);

                if (updatedContent !== content) {
                    await writeFile(filePath, updatedContent);
                    console.log(`✅ ${file} aktualisiert`);
                }
            } catch (error) {
                console.warn(`⚠️ ${file} nicht gefunden oder Fehler:`, error.message);
            }
        }
    }

    async processServiceWorker() {
        const swPath = join(this.projectRoot, 'sw.js');

        try {
            const content = await readFile(swPath, 'utf8');

            const updatedContent = content
                .replace(/CACHE_NAME = '[^']*'/, `CACHE_NAME = 'oamtm-v${this.buildHash}'`)
                .replace(/9729e1c-mgdtet46-rhl7oo/g, this.buildHash)
                .replace(/style\.\w+\.css/g, `style.${this.buildHash}.css`)
                .replace(/app\.\w+\.js/g, `app.${this.buildHash}.js`);

            if (updatedContent !== content) {
                await writeFile(swPath, updatedContent);
                console.log('✅ sw.js aktualisiert');
            }
        } catch (error) {
            console.warn('⚠️ sw.js nicht gefunden:', error.message);
        }
    }

    async processAssets() {
        const assetDirs = ['assets', 'css', 'js', 'scripts'];

        for (const dir of assetDirs) {
            try {
                const dirPath = join(this.projectRoot, dir);
                const files = await readdir(dirPath);

                for (const file of files) {
                    const filePath = join(dirPath, file);
                    const stats = await stat(filePath);

                    if (stats.isFile() && this.isAssetFile(file)) {
                        await this.processAssetFile(filePath, file);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Verzeichnis ${dir} nicht gefunden:`, error.message);
            }
        }
    }

    isAssetFile(filename) {
        const ext = extname(filename).toLowerCase();
        return ['.css', '.js', '.mjs'].includes(ext);
    }

    async processAssetFile(filePath, filename) {
        try {
            const content = await readFile(filePath, 'utf8');

            // Ersetze 9729e1c-mgdtet46-rhl7oo in Asset-Inhalten
            const updatedContent = content
                .replace(/9729e1c-mgdtet46-rhl7oo/g, this.buildHash)
                .replace(/v=\?\w+/g, `v=${this.buildHash}`);

            if (updatedContent !== content) {
                await writeFile(filePath, updatedContent);
                console.log(`✅ Asset ${filename} aktualisiert`);
            }
        } catch (error) {
            console.warn(`⚠️ Asset ${filename} Fehler:`, error.message);
        }
    }

    async processModuleImports() {
        const moduleFiles = [
            'scripts/feature-detection.mjs',
            'webtrit-swipe.js',
            'real-webtrit-swipe.js',
            'js/cloud-sql-api.js'
        ];

        for (const file of moduleFiles) {
            try {
                const filePath = join(this.projectRoot, file);
                const content = await readFile(filePath, 'utf8');

                const updatedContent = content
                    .replace(/9729e1c-mgdtet46-rhl7oo/g, this.buildHash)
                    .replace(/v=\?\w+/g, `v=${this.buildHash}`);

                if (updatedContent !== content) {
                    await writeFile(filePath, updatedContent);
                    console.log(`✅ Modul ${file} aktualisiert`);
                }
            } catch (error) {
                console.warn(`⚠️ Modul ${file} nicht gefunden:`, error.message);
            }
        }
    }

    async generateBuildManifest() {
        const manifest = {
            buildHash: this.buildHash,
            timestamp: new Date().toISOString(),
            gitCommit: this.getGitCommit(),
            version: '1.0.0',
            assets: {
                css: `style.${this.buildHash}.css`,
                js: `app.${this.buildHash}.js`,
                sw: `sw.js?v=${this.buildHash}`
            }
        };

        const manifestPath = join(this.projectRoot, 'build-manifest.json');
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        console.log('✅ Build-Manifest erstellt:', manifestPath);
        return manifest;
    }

    async run() {
        console.log('🚀 BUILD-HASH GENERATOR gestartet');
        console.log('================================');

        await this.processFiles();
        await this.generateBuildManifest();

        console.log('================================');
        console.log(`🎉 Build-Hash ${this.buildHash} erfolgreich generiert!`);
        console.log('📋 Nächste Schritte:');
        console.log('   1. Git commit & push');
        console.log('   2. GitHub Pages wird automatisch deployed');
        console.log('   3. Browser-Cache wird durch neue Hash-Werte invalidiert');
    }
}

// CLI Support
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new BuildHashGenerator();
    generator.run().catch(console.error);
}

export { BuildHashGenerator };
