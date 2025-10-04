#!/usr/bin/env node
/**
 * Claims Harvester - Extrahiert Behauptungen aus README/Wiki/Issues
 * FOSS-Only Pilot Implementation für Due Diligence
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaimsHarvester {
    constructor() {
        this.claims = {
            performance: [],
            features: [],
            capabilities: [],
            limitations: [],
            requirements: [],
            security: [],
            compliance: []
        };

        this.patterns = {
            performance: [
                /(\d+)\s*(ms|milliseconds?|seconds?|minutes?|hours?)/gi,
                /(\d+)\s*(MB|GB|TB|KB)/gi,
                /(\d+)\s*(requests?|messages?|connections?)\s*per\s*(second|minute|hour)/gi,
                /(\d+\.?\d*)\s*(%|percent)/gi,
                /latency\s*[<>=]\s*(\d+)/gi,
                /throughput\s*[<>=]\s*(\d+)/gi,
                /uptime\s*[<>=]\s*(\d+\.?\d*)/gi
            ],
            features: [
                /supports?\s+([^.!?]+)/gi,
                /enables?\s+([^.!?]+)/gi,
                /provides?\s+([^.!?]+)/gi,
                /features?\s+([^.!?]+)/gi,
                /includes?\s+([^.!?]+)/gi,
                /offers?\s+([^.!?]+)/gi,
                /implements?\s+([^.!?]+)/gi
            ],
            capabilities: [
                /can\s+([^.!?]+)/gi,
                /able\s+to\s+([^.!?]+)/gi,
                /capable\s+of\s+([^.!?]+)/gi,
                /handles?\s+([^.!?]+)/gi,
                /processes?\s+([^.!?]+)/gi,
                /manages?\s+([^.!?]+)/gi
            ],
            limitations: [
                /limitations?\s+([^.!?]+)/gi,
                /restrictions?\s+([^.!?]+)/gi,
                /constraints?\s+([^.!?]+)/gi,
                /not\s+supported/gi,
                /not\s+available/gi,
                /not\s+implemented/gi,
                /missing/gi,
                /todo/gi,
                /fixme/gi
            ],
            requirements: [
                /requires?\s+([^.!?]+)/gi,
                /needs?\s+([^.!?]+)/gi,
                /depends?\s+on\s+([^.!?]+)/gi,
                /prerequisites?\s+([^.!?]+)/gi,
                /minimum\s+([^.!?]+)/gi,
                /at\s+least\s+([^.!?]+)/gi
            ],
            security: [
                /security\s+([^.!?]+)/gi,
                /encryption/gi,
                /authentication/gi,
                /authorization/gi,
                /vulnerability/gi,
                /secure/gi,
                /protected/gi,
                /HTTPS/gi,
                /SSL/gi,
                /TLS/gi
            ],
            compliance: [
                /compliance/gi,
                /GDPR/gi,
                /DSGVO/gi,
                /HIPAA/gi,
                /SOX/gi,
                /PCI/gi,
                /ISO\s*\d+/gi,
                /regulatory/gi,
                /audit/gi,
                /certification/gi
            ]
        };
    }

    async harvestClaims() {
        console.log('🔍 Starting claims harvesting...');

        try {
            // Analyze README files
            await this.analyzeReadmeFiles();

            // Analyze package.json
            await this.analyzePackageJson();

            // Analyze source code comments
            await this.analyzeSourceCode();

            // Analyze documentation
            await this.analyzeDocumentation();

            console.log('✅ Claims harvesting completed');
            return this.claims;

        } catch (error) {
            console.error('❌ Error during claims harvesting:', error);
            throw error;
        }
    }

    async analyzeReadmeFiles() {
        console.log('📖 Analyzing README files...');

        const readmeFiles = [
            'README.md',
            'live-data-platform/README.md',
            'docs/README.md'
        ];

        for (const file of readmeFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                this.extractClaimsFromText(content, file);
            } catch (error) {
                console.log(`⚠️ Could not read ${file}: ${error.message}`);
            }
        }
    }

    async analyzePackageJson() {
        console.log('📦 Analyzing package.json...');

        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

            // Extract features from description
            if (packageJson.description) {
                this.extractClaimsFromText(packageJson.description, 'package.json');
            }

            // Extract features from keywords
            if (packageJson.keywords) {
                packageJson.keywords.forEach(keyword => {
                    this.claims.features.push({
                        text: keyword,
                        source: 'package.json',
                        confidence: 'medium'
                    });
                });
            }

            // Analyze dependencies for capabilities
            if (packageJson.dependencies) {
                const deps = Object.keys(packageJson.dependencies);
                this.claims.capabilities.push({
                    text: `Dependencies: ${deps.join(', ')}`,
                    source: 'package.json',
                    confidence: 'high'
                });
            }

        } catch (error) {
            console.log(`⚠️ Could not analyze package.json: ${error.message}`);
        }
    }

    async analyzeSourceCode() {
        console.log('💻 Analyzing source code comments...');

        const sourceDirs = ['src', 'live-data-platform/src'];

        for (const dir of sourceDirs) {
            try {
                const files = await this.getFilesRecursively(dir, ['.ts', '.js', '.tsx', '.jsx']);

                for (const file of files) {
                    try {
                        const content = await fs.readFile(file, 'utf8');
                        this.extractClaimsFromComments(content, file);
                    } catch (error) {
                        console.log(`⚠️ Could not read ${file}: ${error.message}`);
                    }
                }
            } catch (error) {
                console.log(`⚠️ Could not analyze ${dir}: ${error.message}`);
            }
        }
    }

    async analyzeDocumentation() {
        console.log('📚 Analyzing documentation...');

        const docFiles = [
            'docs',
            'live-data-platform/docs',
            'MANIFEST.md',
            'REGULATORY.md',
            'SECURITY.md'
        ];

        for (const file of docFiles) {
            try {
                const stats = await fs.stat(file);
                if (stats.isDirectory()) {
                    const files = await this.getFilesRecursively(file, ['.md', '.txt']);
                    for (const docFile of files) {
                        try {
                            const content = await fs.readFile(docFile, 'utf8');
                            this.extractClaimsFromText(content, docFile);
                        } catch (error) {
                            console.log(`⚠️ Could not read ${docFile}: ${error.message}`);
                        }
                    }
                } else {
                    const content = await fs.readFile(file, 'utf8');
                    this.extractClaimsFromText(content, file);
                }
            } catch (error) {
                console.log(`⚠️ Could not analyze ${file}: ${error.message}`);
            }
        }
    }

    extractClaimsFromText(text, source) {
        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    this.claims[category].push({
                        text: match[0].trim(),
                        source: source,
                        confidence: this.calculateConfidence(match[0], source),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
    }

    extractClaimsFromComments(text, source) {
        // Extract comments (// and /* */)
        const commentPattern = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
        const comments = text.match(commentPattern) || [];

        comments.forEach(comment => {
            this.extractClaimsFromText(comment, source);
        });
    }

    calculateConfidence(text, source) {
        let confidence = 'low';

        // Higher confidence for official documentation
        if (source.includes('README') || source.includes('docs/')) {
            confidence = 'high';
        } else if (source.includes('package.json') || source.includes('src/')) {
            confidence = 'medium';
        }

        // Higher confidence for specific patterns
        if (text.match(/\d+\s*(ms|MB|GB|%)/)) {
            confidence = 'high';
        }

        return confidence;
    }

    async getFilesRecursively(dir, extensions) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.getFilesRecursively(fullPath, extensions);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️ Could not read directory ${dir}: ${error.message}`);
        }

        return files;
    }

    generateRecommendations(claims) {
        const recommendations = [];

        // Check for missing performance claims
        if (claims.performance.length === 0) {
            recommendations.push({
                type: 'missing_performance_claims',
                severity: 'medium',
                message: 'No performance claims found. Consider adding specific metrics.',
                action: 'Add performance benchmarks and metrics to documentation'
            });
        }

        // Check for security claims
        if (claims.security.length === 0) {
            recommendations.push({
                type: 'missing_security_claims',
                severity: 'high',
                message: 'No security claims found. Security documentation is critical.',
                action: 'Add security features and compliance information'
            });
        }

        // Check for limitations
        if (claims.limitations.length === 0) {
            recommendations.push({
                type: 'missing_limitations',
                severity: 'low',
                message: 'No limitations documented. Transparency about limitations builds trust.',
                action: 'Document known limitations and constraints'
            });
        }

        // Check claim consistency
        const totalClaims = Object.values(claims).flat().length;
        if (totalClaims < 10) {
            recommendations.push({
                type: 'insufficient_documentation',
                severity: 'medium',
                message: 'Limited claims found. Documentation may be insufficient.',
                action: 'Enhance documentation with more detailed feature descriptions'
            });
        }

        return recommendations;
    }

    async generateReport() {
        console.log('📊 Generating claims report...');

        const claims = await this.harvestClaims();
        const recommendations = this.generateRecommendations(claims);

        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                tool: 'Claims Harvester (FOSS Pilot)',
                totalClaims: Object.values(claims).flat().length
            },
            claimsByCategory: claims,
            summary: {
                performance: claims.performance.length,
                features: claims.features.length,
                capabilities: claims.capabilities.length,
                limitations: claims.limitations.length,
                requirements: claims.requirements.length,
                security: claims.security.length,
                compliance: claims.compliance.length
            },
            recommendations: recommendations,
            verificationStatus: 'pending',
            nextSteps: [
                'Verify claims through testing',
                'Cross-reference with implementation',
                'Update documentation based on findings'
            ]
        };

        // Ensure due directory exists
        await fs.mkdir('due/results', { recursive: true });

        // Write JSON report
        await fs.writeFile(
            'due/results/claims-report.json',
            JSON.stringify(report, null, 2)
        );

        // Write Markdown report
        const markdownReport = this.generateMarkdownReport(report);
        await fs.writeFile(
            'due/results/claims-report.md',
            markdownReport
        );

        console.log('✅ Claims report generated');
        console.log(`📊 Total claims found: ${report.metadata.totalClaims}`);
        console.log(`📁 Reports saved to: due/results/`);

        return report;
    }

    generateMarkdownReport(report) {
        let markdown = `# Claims Harvesting Report\n\n`;
        markdown += `**Generated:** ${report.metadata.timestamp}\n`;
        markdown += `**Tool:** ${report.metadata.tool}\n`;
        markdown += `**Total Claims:** ${report.metadata.totalClaims}\n\n`;

        markdown += `## Summary\n\n`;
        markdown += `| Category | Count |\n`;
        markdown += `|----------|-------|\n`;
        for (const [category, count] of Object.entries(report.summary)) {
            markdown += `| ${category} | ${count} |\n`;
        }

        markdown += `\n## Claims by Category\n\n`;

        for (const [category, claims] of Object.entries(report.claimsByCategory)) {
            if (claims.length > 0) {
                markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

                claims.forEach((claim, index) => {
                    markdown += `${index + 1}. **${claim.text}**\n`;
                    markdown += `   - Source: ${claim.source}\n`;
                    markdown += `   - Confidence: ${claim.confidence}\n\n`;
                });
            }
        }

        if (report.recommendations.length > 0) {
            markdown += `## Recommendations\n\n`;
            report.recommendations.forEach((rec, index) => {
                markdown += `${index + 1}. **${rec.type}** (${rec.severity})\n`;
                markdown += `   - ${rec.message}\n`;
                markdown += `   - Action: ${rec.action}\n\n`;
            });
        }

        markdown += `## Next Steps\n\n`;
        report.nextSteps.forEach((step, index) => {
            markdown += `${index + 1}. ${step}\n`;
        });

        return markdown;
    }
}

// Main execution
async function main() {
    const harvester = new ClaimsHarvester();

    try {
        const report = await harvester.generateReport();

        console.log('\n🎯 Claims Harvesting Complete!');
        console.log('================================');
        console.log(`📊 Total Claims: ${report.metadata.totalClaims}`);
        console.log(`🔍 Performance Claims: ${report.summary.performance}`);
        console.log(`✨ Feature Claims: ${report.summary.features}`);
        console.log(`🛡️ Security Claims: ${report.summary.security}`);
        console.log(`⚠️ Limitations: ${report.summary.limitations}`);

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.message}`);
            });
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Claims harvesting failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default ClaimsHarvester;
