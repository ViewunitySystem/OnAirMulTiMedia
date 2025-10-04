#!/usr/bin/env node
/**
 * Due Diligence Report Generator - FOSS-Only Pilot
 * Generiert umfassende Due Diligence Reports
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DueDiligenceReportGenerator {
    constructor() {
        this.report = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                tool: 'Due Diligence Report Generator (FOSS Pilot)',
                platform: 'Live Data Platform'
            },
            executiveSummary: {},
            technicalAssessment: {},
            riskAnalysis: {},
            investmentRecommendation: {},
            detailedResults: {},
            appendices: {}
        };
    }

    async generateReport() {
        console.log('📊 Starting Due Diligence Report Generation...');

        try {
            // Collect all available data
            await this.collectClaimsData();
            await this.collectBenchmarkData();
            await this.collectSystemData();

            // Generate report sections
            await this.generateExecutiveSummary();
            await this.generateTechnicalAssessment();
            await this.generateRiskAnalysis();
            await this.generateInvestmentRecommendation();
            await this.generateDetailedResults();

            // Write reports
            await this.writeReports();

            console.log('✅ Due Diligence Report Generated Successfully!');
            return this.report;

        } catch (error) {
            console.error('❌ Error generating report:', error);
            throw error;
        }
    }

    async collectClaimsData() {
        console.log('🔍 Collecting claims data...');

        try {
            const claimsReport = JSON.parse(await fs.readFile('due/results/claims-report.json', 'utf8'));
            this.report.detailedResults.claims = claimsReport;
        } catch (error) {
            console.log('⚠️ Claims data not available:', error.message);
            this.report.detailedResults.claims = { error: 'Claims data not available' };
        }
    }

    async collectBenchmarkData() {
        console.log('📊 Collecting benchmark data...');

        const benchmarks = {
            hls: await this.loadBenchmarkReport('hls'),
            rtmp: await this.loadBenchmarkReport('rtmp'),
            icecast: await this.loadBenchmarkReport('icecast')
        };

        this.report.detailedResults.benchmarks = benchmarks;
    }

    async loadBenchmarkReport(type) {
        try {
            const reportPath = `due/bench-results/${type}/${type}-report.md`;
            const content = await fs.readFile(reportPath, 'utf8');
            return {
                available: true,
                content: content,
                summary: this.extractBenchmarkSummary(content)
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    extractBenchmarkSummary(content) {
        const summary = {
            tests: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        };

        // Count test results
        const passMatches = content.match(/✅/g);
        const failMatches = content.match(/❌/g);
        const warnMatches = content.match(/⚠️/g);

        summary.passed = passMatches ? passMatches.length : 0;
        summary.failed = failMatches ? failMatches.length : 0;
        summary.warnings = warnMatches ? warnMatches.length : 0;
        summary.tests = summary.passed + summary.failed + summary.warnings;

        return summary;
    }

    async collectSystemData() {
        console.log('💻 Collecting system data...');

        try {
            // Try to get package.json info
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            this.report.detailedResults.system = {
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description,
                dependencies: Object.keys(packageJson.dependencies || {}),
                devDependencies: Object.keys(packageJson.devDependencies || {}),
                scripts: Object.keys(packageJson.scripts || {})
            };
        } catch (error) {
            console.log('⚠️ System data not available:', error.message);
            this.report.detailedResults.system = { error: 'System data not available' };
        }
    }

    async generateExecutiveSummary() {
        console.log('📋 Generating executive summary...');

        const claims = this.report.detailedResults.claims;
        const benchmarks = this.report.detailedResults.benchmarks;

        // Calculate overall score
        let totalScore = 0;
        let maxScore = 0;

        // Claims score (0-40 points)
        if (claims && !claims.error) {
            const claimsScore = Math.min(40, claims.metadata.totalClaims * 2);
            totalScore += claimsScore;
        }
        maxScore += 40;

        // Benchmark scores (0-60 points total)
        const benchmarkTypes = ['hls', 'rtmp', 'icecast'];
        benchmarkTypes.forEach(type => {
            if (benchmarks[type] && benchmarks[type].available) {
                const summary = benchmarks[type].summary;
                const typeScore = summary.tests > 0 ? (summary.passed / summary.tests) * 20 : 0;
                totalScore += typeScore;
            }
            maxScore += 20;
        });

        const overallScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        this.report.executiveSummary = {
            overallScore: Math.round(overallScore),
            status: this.getOverallStatus(overallScore),
            keyFindings: this.generateKeyFindings(claims, benchmarks),
            recommendations: this.generateTopRecommendations(claims, benchmarks),
            riskLevel: this.assessRiskLevel(overallScore),
            investmentReadiness: this.assessInvestmentReadiness(overallScore)
        };
    }

    getOverallStatus(score) {
        if (score >= 80) return 'GREEN';
        if (score >= 60) return 'YELLOW';
        return 'RED';
    }

    generateKeyFindings(claims, benchmarks) {
        const findings = [];

        if (claims && !claims.error) {
            findings.push(`Claims Analysis: ${claims.metadata.totalClaims} claims identified`);

            if (claims.summary.security > 0) {
                findings.push(`Security Claims: ${claims.summary.security} security-related claims found`);
            } else {
                findings.push('Security Claims: No security claims identified (concern)');
            }

            if (claims.summary.performance > 0) {
                findings.push(`Performance Claims: ${claims.summary.performance} performance claims found`);
            } else {
                findings.push('Performance Claims: No performance claims identified (concern)');
            }
        }

        // Benchmark findings
        const benchmarkTypes = ['hls', 'rtmp', 'icecast'];
        benchmarkTypes.forEach(type => {
            if (benchmarks[type] && benchmarks[type].available) {
                const summary = benchmarks[type].summary;
                findings.push(`${type.toUpperCase()} Benchmark: ${summary.passed}/${summary.tests} tests passed`);
            }
        });

        return findings;
    }

    generateTopRecommendations(claims, benchmarks) {
        const recommendations = [];

        if (claims && !claims.error && claims.recommendations) {
            recommendations.push(...claims.recommendations.slice(0, 3));
        }

        // Add benchmark-specific recommendations
        const benchmarkTypes = ['hls', 'rtmp', 'icecast'];
        benchmarkTypes.forEach(type => {
            if (benchmarks[type] && benchmarks[type].available) {
                const summary = benchmarks[type].summary;
                if (summary.failed > 0) {
                    recommendations.push({
                        type: `${type.toUpperCase()}_benchmark_failures`,
                        severity: 'medium',
                        message: `${summary.failed} ${type.toUpperCase()} benchmark tests failed`,
                        action: `Review and fix ${type.toUpperCase()} benchmark failures`
                    });
                }
            }
        });

        return recommendations.slice(0, 5);
    }

    assessRiskLevel(score) {
        if (score >= 80) return 'LOW';
        if (score >= 60) return 'MEDIUM';
        return 'HIGH';
    }

    assessInvestmentReadiness(score) {
        if (score >= 80) return 'READY';
        if (score >= 60) return 'CONDITIONAL';
        return 'NOT_READY';
    }

    async generateTechnicalAssessment() {
        console.log('🔧 Generating technical assessment...');

        const claims = this.report.detailedResults.claims;
        const benchmarks = this.report.detailedResults.benchmarks;
        const system = this.report.detailedResults.system;

        this.report.technicalAssessment = {
            architecture: {
                score: this.assessArchitecture(claims, system),
                findings: this.assessArchitectureFindings(claims, system)
            },
            codeQuality: {
                score: this.assessCodeQuality(claims, system),
                findings: this.assessCodeQualityFindings(claims, system)
            },
            performance: {
                score: this.assessPerformance(benchmarks),
                findings: this.assessPerformanceFindings(benchmarks)
            },
            security: {
                score: this.assessSecurity(claims),
                findings: this.assessSecurityFindings(claims)
            },
            scalability: {
                score: this.assessScalability(claims, benchmarks),
                findings: this.assessScalabilityFindings(claims, benchmarks)
            }
        };
    }

    assessArchitecture(claims, system) {
        let score = 50; // Base score

        if (system && !system.error) {
            if (system.dependencies && system.dependencies.length > 0) {
                score += 20; // Has dependencies
            }
            if (system.scripts && system.scripts.length > 5) {
                score += 15; // Good script coverage
            }
        }

        if (claims && !claims.error) {
            if (claims.summary.features > 10) {
                score += 15; // Good feature documentation
            }
        }

        return Math.min(100, score);
    }

    assessArchitectureFindings(claims, system) {
        const findings = [];

        if (system && !system.error) {
            findings.push(`Dependencies: ${system.dependencies?.length || 0} production dependencies`);
            findings.push(`Scripts: ${system.scripts?.length || 0} npm scripts available`);
        }

        if (claims && !claims.error) {
            findings.push(`Features: ${claims.summary.features} features documented`);
            findings.push(`Capabilities: ${claims.summary.capabilities} capabilities documented`);
        }

        return findings;
    }

    assessCodeQuality(claims, system) {
        let score = 60; // Base score

        if (system && !system.error) {
            if (system.devDependencies && system.devDependencies.length > 5) {
                score += 20; // Good dev dependencies
            }
            if (system.scripts && system.scripts.includes('test')) {
                score += 10; // Has tests
            }
            if (system.scripts && system.scripts.includes('lint')) {
                score += 10; // Has linting
            }
        }

        return Math.min(100, score);
    }

    assessCodeQualityFindings(claims, system) {
        const findings = [];

        if (system && !system.error) {
            findings.push(`Dev Dependencies: ${system.devDependencies?.length || 0} development dependencies`);
            findings.push(`Test Script: ${system.scripts?.includes('test') ? 'Available' : 'Missing'}`);
            findings.push(`Lint Script: ${system.scripts?.includes('lint') ? 'Available' : 'Missing'}`);
        }

        return findings;
    }

    assessPerformance(benchmarks) {
        let score = 0;
        let maxScore = 0;

        const benchmarkTypes = ['hls', 'rtmp', 'icecast'];
        benchmarkTypes.forEach(type => {
            if (benchmarks[type] && benchmarks[type].available) {
                const summary = benchmarks[type].summary;
                if (summary.tests > 0) {
                    score += (summary.passed / summary.tests) * 33.33;
                }
            }
            maxScore += 33.33;
        });

        return Math.round(score);
    }

    assessPerformanceFindings(benchmarks) {
        const findings = [];

        const benchmarkTypes = ['hls', 'rtmp', 'icecast'];
        benchmarkTypes.forEach(type => {
            if (benchmarks[type] && benchmarks[type].available) {
                const summary = benchmarks[type].summary;
                findings.push(`${type.toUpperCase()}: ${summary.passed}/${summary.tests} tests passed`);
            } else {
                findings.push(`${type.toUpperCase()}: No benchmark data available`);
            }
        });

        return findings;
    }

    assessSecurity(claims) {
        let score = 30; // Base score

        if (claims && !claims.error) {
            if (claims.summary.security > 0) {
                score += 40; // Has security claims
            }
            if (claims.summary.compliance > 0) {
                score += 30; // Has compliance claims
            }
        }

        return Math.min(100, score);
    }

    assessSecurityFindings(claims) {
        const findings = [];

        if (claims && !claims.error) {
            findings.push(`Security Claims: ${claims.summary.security}`);
            findings.push(`Compliance Claims: ${claims.summary.compliance}`);
        } else {
            findings.push('Security Claims: No security analysis available');
        }

        return findings;
    }

    assessScalability(claims, benchmarks) {
        let score = 40; // Base score

        if (claims && !claims.error) {
            if (claims.summary.capabilities > 5) {
                score += 30; // Good capability documentation
            }
            if (claims.summary.requirements > 0) {
                score += 30; // Has requirements documented
            }
        }

        return Math.min(100, score);
    }

    assessScalabilityFindings(claims, benchmarks) {
        const findings = [];

        if (claims && !claims.error) {
            findings.push(`Capabilities: ${claims.summary.capabilities} capabilities documented`);
            findings.push(`Requirements: ${claims.summary.requirements} requirements documented`);
        }

        return findings;
    }

    async generateRiskAnalysis() {
        console.log('⚠️ Generating risk analysis...');

        const technicalAssessment = this.report.technicalAssessment;
        const executiveSummary = this.report.executiveSummary;

        this.report.riskAnalysis = {
            overallRiskLevel: executiveSummary.riskLevel,
            technicalRisks: this.identifyTechnicalRisks(technicalAssessment),
            businessRisks: this.identifyBusinessRisks(executiveSummary),
            mitigationStrategies: this.generateMitigationStrategies(technicalAssessment)
        };
    }

    identifyTechnicalRisks(assessment) {
        const risks = [];

        if (assessment.architecture.score < 70) {
            risks.push({
                category: 'Architecture',
                severity: 'HIGH',
                description: 'Architecture assessment score below threshold',
                impact: 'May affect system stability and scalability'
            });
        }

        if (assessment.security.score < 60) {
            risks.push({
                category: 'Security',
                severity: 'CRITICAL',
                description: 'Security assessment score below threshold',
                impact: 'May expose system to security vulnerabilities'
            });
        }

        if (assessment.performance.score < 50) {
            risks.push({
                category: 'Performance',
                severity: 'MEDIUM',
                description: 'Performance assessment score below threshold',
                impact: 'May affect user experience and system efficiency'
            });
        }

        return risks;
    }

    identifyBusinessRisks(summary) {
        const risks = [];

        if (summary.overallScore < 60) {
            risks.push({
                category: 'Investment',
                severity: 'HIGH',
                description: 'Overall due diligence score below threshold',
                impact: 'High risk of investment failure'
            });
        }

        if (summary.investmentReadiness === 'NOT_READY') {
            risks.push({
                category: 'Readiness',
                severity: 'HIGH',
                description: 'System not ready for investment',
                impact: 'Additional development required before investment'
            });
        }

        return risks;
    }

    generateMitigationStrategies(assessment) {
        const strategies = [];

        if (assessment.security.score < 60) {
            strategies.push({
                risk: 'Security',
                strategy: 'Implement comprehensive security audit and penetration testing',
                timeline: '2-4 weeks',
                cost: 'Medium'
            });
        }

        if (assessment.performance.score < 50) {
            strategies.push({
                risk: 'Performance',
                strategy: 'Conduct performance optimization and load testing',
                timeline: '1-2 weeks',
                cost: 'Low'
            });
        }

        return strategies;
    }

    async generateInvestmentRecommendation() {
        console.log('💰 Generating investment recommendation...');

        const executiveSummary = this.report.executiveSummary;
        const technicalAssessment = this.report.technicalAssessment;
        const riskAnalysis = this.report.riskAnalysis;

        this.report.investmentRecommendation = {
            recommendation: this.getInvestmentRecommendation(executiveSummary),
            confidence: this.calculateConfidence(executiveSummary, technicalAssessment),
            requiredInvestment: this.estimateRequiredInvestment(executiveSummary, riskAnalysis),
            timeline: this.estimateTimeline(executiveSummary, riskAnalysis),
            conditions: this.generateInvestmentConditions(riskAnalysis),
            nextSteps: this.generateNextSteps(executiveSummary, riskAnalysis)
        };
    }

    getInvestmentRecommendation(summary) {
        switch (summary.status) {
            case 'GREEN':
                return 'PROCEED';
            case 'YELLOW':
                return 'PROCEED_WITH_CONDITIONS';
            case 'RED':
                return 'DO_NOT_PROCEED';
            default:
                return 'INSUFFICIENT_DATA';
        }
    }

    calculateConfidence(summary, assessment) {
        let confidence = summary.overallScore;

        // Adjust based on technical assessment
        const avgTechnicalScore = Object.values(assessment).reduce((sum, area) => sum + area.score, 0) / Object.keys(assessment).length;
        confidence = (confidence + avgTechnicalScore) / 2;

        if (confidence >= 80) return 'HIGH';
        if (confidence >= 60) return 'MEDIUM';
        return 'LOW';
    }

    estimateRequiredInvestment(summary, riskAnalysis) {
        let baseInvestment = 100000; // Base €100k

        if (summary.status === 'GREEN') {
            return baseInvestment;
        } else if (summary.status === 'YELLOW') {
            return baseInvestment * 1.5; // €150k
        } else {
            return baseInvestment * 2; // €200k
        }
    }

    estimateTimeline(summary, riskAnalysis) {
        if (summary.status === 'GREEN') {
            return '2-4 weeks';
        } else if (summary.status === 'YELLOW') {
            return '4-8 weeks';
        } else {
            return '8-12 weeks';
        }
    }

    generateInvestmentConditions(riskAnalysis) {
        const conditions = [];

        if (riskAnalysis.overallRiskLevel === 'HIGH') {
            conditions.push('Comprehensive risk mitigation plan required');
        }

        if (riskAnalysis.technicalRisks.some(risk => risk.severity === 'CRITICAL')) {
            conditions.push('Critical technical issues must be resolved');
        }

        return conditions;
    }

    generateNextSteps(summary, riskAnalysis) {
        const steps = [];

        if (summary.status === 'GREEN') {
            steps.push('Proceed with investment');
            steps.push('Begin integration planning');
            steps.push('Set up monitoring and metrics');
        } else if (summary.status === 'YELLOW') {
            steps.push('Address identified issues');
            steps.push('Conduct additional testing');
            steps.push('Re-evaluate after improvements');
        } else {
            steps.push('Do not proceed with investment');
            steps.push('Consider alternative solutions');
            steps.push('Reassess after significant improvements');
        }

        return steps;
    }

    async generateDetailedResults() {
        console.log('📋 Generating detailed results...');

        this.report.appendices = {
            claimsAnalysis: this.report.detailedResults.claims,
            benchmarkResults: this.report.detailedResults.benchmarks,
            systemInformation: this.report.detailedResults.system,
            testMatrix: await this.loadTestMatrix(),
            methodology: this.getMethodology()
        };
    }

    async loadTestMatrix() {
        try {
            const content = await fs.readFile('due/test-matrix.md', 'utf8');
            return { available: true, content: content };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    getMethodology() {
        return {
            approach: 'FOSS-Only Pilot Due Diligence',
            tools: [
                'Claims Harvester (Custom)',
                'HLS Benchmark (FFmpeg)',
                'RTMP Benchmark (FFmpeg)',
                'ICEcast Benchmark (FFmpeg)',
                'GitHub Actions CI/CD'
            ],
            limitations: [
                'Simulated streaming tests (no live servers)',
                'Limited security penetration testing',
                'No load testing with real users',
                'No third-party security audit'
            ],
            nextPhase: 'Enterprise Due Diligence with live servers and comprehensive testing'
        };
    }

    async writeReports() {
        console.log('📝 Writing reports...');

        // Ensure results directory exists
        await fs.mkdir('due/results', { recursive: true });

        // Write JSON report
        await fs.writeFile(
            'due/results/due-diligence-report.json',
            JSON.stringify(this.report, null, 2)
        );

        // Write Markdown report
        const markdownReport = this.generateMarkdownReport();
        await fs.writeFile(
            'due/results/due-diligence-report.md',
            markdownReport
        );

        // Write executive summary
        const executiveSummary = this.generateExecutiveSummaryMarkdown();
        await fs.writeFile(
            'due/results/executive-summary.md',
            executiveSummary
        );

        console.log('📁 Reports written to due/results/');
    }

    generateMarkdownReport() {
        const report = this.report;

        let markdown = `# Due Diligence Report - Live Data Platform\n\n`;
        markdown += `**Generated:** ${report.metadata.timestamp}\n`;
        markdown += `**Tool:** ${report.metadata.tool}\n`;
        markdown += `**Platform:** ${report.metadata.platform}\n\n`;

        // Executive Summary
        markdown += `## Executive Summary\n\n`;
        markdown += `**Overall Score:** ${report.executiveSummary.overallScore}/100\n`;
        markdown += `**Status:** ${report.executiveSummary.status}\n`;
        markdown += `**Risk Level:** ${report.executiveSummary.riskLevel}\n`;
        markdown += `**Investment Readiness:** ${report.executiveSummary.investmentReadiness}\n\n`;

        markdown += `### Key Findings\n`;
        report.executiveSummary.keyFindings.forEach((finding, index) => {
            markdown += `${index + 1}. ${finding}\n`;
        });

        markdown += `\n### Top Recommendations\n`;
        report.executiveSummary.recommendations.forEach((rec, index) => {
            markdown += `${index + 1}. **${rec.type}** (${rec.severity})\n`;
            markdown += `   - ${rec.message}\n`;
            markdown += `   - Action: ${rec.action}\n\n`;
        });

        // Technical Assessment
        markdown += `## Technical Assessment\n\n`;
        Object.entries(report.technicalAssessment).forEach(([area, assessment]) => {
            markdown += `### ${area.charAt(0).toUpperCase() + area.slice(1)}\n`;
            markdown += `**Score:** ${assessment.score}/100\n\n`;
            markdown += `**Findings:**\n`;
            assessment.findings.forEach((finding, index) => {
                markdown += `${index + 1}. ${finding}\n`;
            });
            markdown += `\n`;
        });

        // Risk Analysis
        markdown += `## Risk Analysis\n\n`;
        markdown += `**Overall Risk Level:** ${report.riskAnalysis.overallRiskLevel}\n\n`;

        markdown += `### Technical Risks\n`;
        report.riskAnalysis.technicalRisks.forEach((risk, index) => {
            markdown += `${index + 1}. **${risk.category}** (${risk.severity})\n`;
            markdown += `   - ${risk.description}\n`;
            markdown += `   - Impact: ${risk.impact}\n\n`;
        });

        markdown += `### Business Risks\n`;
        report.riskAnalysis.businessRisks.forEach((risk, index) => {
            markdown += `${index + 1}. **${risk.category}** (${risk.severity})\n`;
            markdown += `   - ${risk.description}\n`;
            markdown += `   - Impact: ${risk.impact}\n\n`;
        });

        // Investment Recommendation
        markdown += `## Investment Recommendation\n\n`;
        markdown += `**Recommendation:** ${report.investmentRecommendation.recommendation}\n`;
        markdown += `**Confidence:** ${report.investmentRecommendation.confidence}\n`;
        markdown += `**Required Investment:** €${report.investmentRecommendation.requiredInvestment.toLocaleString()}\n`;
        markdown += `**Timeline:** ${report.investmentRecommendation.timeline}\n\n`;

        markdown += `### Conditions\n`;
        report.investmentRecommendation.conditions.forEach((condition, index) => {
            markdown += `${index + 1}. ${condition}\n`;
        });

        markdown += `\n### Next Steps\n`;
        report.investmentRecommendation.nextSteps.forEach((step, index) => {
            markdown += `${index + 1}. ${step}\n`;
        });

        markdown += `\n---\n\n`;
        markdown += `*Generated by FOSS-Only Pilot Due Diligence System*\n`;
        markdown += `*For detailed technical results, see appendices in JSON report*\n`;

        return markdown;
    }

    generateExecutiveSummaryMarkdown() {
        const summary = this.report.executiveSummary;

        let markdown = `# Executive Summary - Due Diligence Report\n\n`;
        markdown += `**Live Data Platform**\n`;
        markdown += `**Date:** ${this.report.metadata.timestamp}\n\n`;

        markdown += `## Investment Decision\n\n`;
        markdown += `**Recommendation:** ${summary.status === 'GREEN' ? '✅ PROCEED' : summary.status === 'YELLOW' ? '⚠️ PROCEED WITH CONDITIONS' : '❌ DO NOT PROCEED'}\n\n`;

        markdown += `## Key Metrics\n\n`;
        markdown += `- **Overall Score:** ${summary.overallScore}/100\n`;
        markdown += `- **Risk Level:** ${summary.riskLevel}\n`;
        markdown += `- **Investment Readiness:** ${summary.investmentReadiness}\n\n`;

        markdown += `## Critical Findings\n\n`;
        summary.keyFindings.forEach((finding, index) => {
            markdown += `${index + 1}. ${finding}\n`;
        });

        markdown += `\n## Immediate Actions Required\n\n`;
        summary.recommendations.slice(0, 3).forEach((rec, index) => {
            markdown += `${index + 1}. **${rec.type}** - ${rec.action}\n`;
        });

        markdown += `\n---\n\n`;
        markdown += `*This is a FOSS-Only Pilot assessment. For enterprise-grade due diligence, additional testing with live servers and comprehensive security audits are recommended.*\n`;

        return markdown;
    }
}

// Main execution
async function main() {
    const generator = new DueDiligenceReportGenerator();

    try {
        const report = await generator.generateReport();

        console.log('\n🎯 Due Diligence Report Complete!');
        console.log('==================================');
        console.log(`📊 Overall Score: ${report.executiveSummary.overallScore}/100`);
        console.log(`🎯 Status: ${report.executiveSummary.status}`);
        console.log(`⚠️ Risk Level: ${report.executiveSummary.riskLevel}`);
        console.log(`💰 Investment Readiness: ${report.executiveSummary.investmentReadiness}`);
        console.log(`📁 Reports saved to: due/results/`);

        console.log('\n📋 Report Files:');
        console.log('  - due-diligence-report.json (Complete data)');
        console.log('  - due-diligence-report.md (Full report)');
        console.log('  - executive-summary.md (Executive summary)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Report generation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default DueDiligenceReportGenerator;
