#!/usr/bin/env node
/**
 * Simple Claims Harvester - FOSS-Only Pilot
 * Quick test version that works immediately
 */

import fs from 'fs/promises';
import path from 'path';

console.log('🔍 Starting Claims Harvester...');

try {
    // Create results directory
    await fs.mkdir('due/results', { recursive: true });
    console.log('✅ Created results directory');

    // Simple claims collection
    const claims = {
        performance: [],
        features: [],
        capabilities: [],
        limitations: [],
        requirements: [],
        security: [],
        compliance: []
    };

    // Try to read README.md
    try {
        const readmeContent = await fs.readFile('README.md', 'utf8');
        console.log('✅ Read README.md');

        // Extract simple claims
        if (readmeContent.includes('real-time')) {
            claims.features.push({
                text: 'Real-time data streaming',
                source: 'README.md',
                confidence: 'high'
            });
        }

        if (readmeContent.includes('weather')) {
            claims.features.push({
                text: 'Weather data integration',
                source: 'README.md',
                confidence: 'high'
            });
        }

        if (readmeContent.includes('space')) {
            claims.features.push({
                text: 'Space data integration',
                source: 'README.md',
                confidence: 'high'
            });
        }

        if (readmeContent.includes('API')) {
            claims.capabilities.push({
                text: 'REST API support',
                source: 'README.md',
                confidence: 'high'
            });
        }

        if (readmeContent.includes('SSE')) {
            claims.capabilities.push({
                text: 'Server-Sent Events support',
                source: 'README.md',
                confidence: 'high'
            });
        }

    } catch (error) {
        console.log('⚠️ Could not read README.md:', error.message);
    }

    // Try to read package.json
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        console.log('✅ Read package.json');

        if (packageJson.description) {
            claims.features.push({
                text: packageJson.description,
                source: 'package.json',
                confidence: 'high'
            });
        }

        if (packageJson.dependencies) {
            const depCount = Object.keys(packageJson.dependencies).length;
            claims.capabilities.push({
                text: `${depCount} production dependencies`,
                source: 'package.json',
                confidence: 'high'
            });
        }

    } catch (error) {
        console.log('⚠️ Could not read package.json:', error.message);
    }

    // Generate report
    const report = {
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            tool: 'Simple Claims Harvester (FOSS Pilot)',
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
        recommendations: [
            {
                type: 'documentation_enhancement',
                severity: 'low',
                message: 'Consider adding more detailed performance claims',
                action: 'Add specific metrics and benchmarks to documentation'
            }
        ],
        verificationStatus: 'pending',
        nextSteps: [
            'Verify claims through testing',
            'Cross-reference with implementation',
            'Update documentation based on findings'
        ]
    };

    // Write JSON report
    await fs.writeFile(
        'due/results/claims-report.json',
        JSON.stringify(report, null, 2)
    );
    console.log('✅ Wrote claims-report.json');

    // Write Markdown report
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

    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. **${rec.type}** (${rec.severity})\n`;
        markdown += `   - ${rec.message}\n`;
        markdown += `   - Action: ${rec.action}\n\n`;
    });

    markdown += `## Next Steps\n\n`;
    report.nextSteps.forEach((step, index) => {
        markdown += `${index + 1}. ${step}\n`;
    });

    await fs.writeFile(
        'due/results/claims-report.md',
        markdown
    );
    console.log('✅ Wrote claims-report.md');

    console.log('\n🎯 Claims Harvesting Complete!');
    console.log('================================');
    console.log(`📊 Total Claims: ${report.metadata.totalClaims}`);
    console.log(`🔍 Performance Claims: ${report.summary.performance}`);
    console.log(`✨ Feature Claims: ${report.summary.features}`);
    console.log(`🛡️ Security Claims: ${report.summary.security}`);
    console.log(`⚠️ Limitations: ${report.summary.limitations}`);

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.message}`);
    });

} catch (error) {
    console.error('❌ Claims harvesting failed:', error);
    process.exit(1);
}
