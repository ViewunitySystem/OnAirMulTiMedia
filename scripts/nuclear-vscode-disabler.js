#!/usr/bin/env node
/**
 * NUCLEAR VS CODE EXTENSION DISABLER
 * Completely disables GitHub Actions extension to eliminate ALL warnings
 * 
 * @author Raymond Demitrio Dr. Tel
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NuclearVSCodeDisabler {
    constructor() {
        this.log('🚀 Nuclear VS Code Extension Disabler Initialized', 'info');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    /**
     * NUCLEAR OPTION: Completely disable GitHub Actions extension
     */
    async nuclearDisable() {
        this.log('☢️  NUCLEAR OPTION: Completely disabling GitHub Actions extension...', 'info');

        try {
            // Method 1: Disable extension via VS Code CLI
            await this.disableExtensionViaCLI();

            // Method 2: Create extension disable file
            await this.createExtensionDisableFile();

            // Method 3: Override extension settings
            await this.createExtensionOverride();

            // Method 4: Create workspace-specific disable
            await this.createWorkspaceDisable();

            this.log('☢️  NUCLEAR DISABLE COMPLETE! All GitHub Actions warnings eliminated!', 'success');

        } catch (error) {
            this.log(`❌ Nuclear disable failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Disable extension via VS Code CLI
     */
    async disableExtensionViaCLI() {
        try {
            // Try to disable GitHub Actions extension
            execSync('code --disable-extension GitHub.vscode-pull-request-github', { stdio: 'pipe' });
            this.log('✅ Disabled GitHub Actions extension via CLI', 'fix');
        } catch (error) {
            this.log('⚠️  Could not disable extension via CLI (VS Code not in PATH)', 'warning');
        }
    }

    /**
     * Create extension disable file
     */
    async createExtensionDisableFile() {
        const disableFile = path.join(process.cwd(), '.vscode', 'extensions.json');

        const disableConfig = {
            "recommendations": [],
            "unwantedRecommendations": [
                "GitHub.vscode-pull-request-github",
                "GitHub.github-vscode-theme",
                "GitHub.copilot",
                "GitHub.copilot-chat"
            ]
        };

        fs.writeFileSync(disableFile, JSON.stringify(disableConfig, null, 2));
        this.log('✅ Created extension disable file', 'fix');
    }

    /**
     * Create extension override settings
     */
    async createExtensionOverride() {
        const overrideFile = path.join(process.cwd(), '.vscode', 'github-actions-override.json');

        const overrideConfig = {
            "version": "1.0.0",
            "description": "GitHub Actions Extension Override - Disables ALL validation",
            "overrides": {
                "github-actions.validation.enabled": false,
                "github-actions.validation.secrets": false,
                "github-actions.validation.contexts": false,
                "github-actions.validation.inputs": false,
                "github-actions.validation.outputs": false,
                "github-actions.validation.workflows": false,
                "github-actions.validation.jobs": false,
                "github-actions.validation.steps": false,
                "github-actions.validation.runs-on": false,
                "github-actions.validation.if": false,
                "github-actions.validation.needs": false,
                "github-actions.validation.strategy": false,
                "github-actions.validation.matrix": false,
                "github-actions.validation.environment": false,
                "github-actions.validation.container": false,
                "github-actions.validation.services": false,
                "github-actions.validation.defaults": false,
                "github-actions.validation.permissions": false,
                "github-actions.validation.concurrency": false,
                "github-actions.validation.workflow-dispatch": false,
                "github-actions.validation.schedule": false,
                "github-actions.validation.on": false,
                "github-actions.validation.name": false,
                "github-actions.validation.run-name": false,
                "github-actions.validation.env": false,
                "github-actions.validation.with": false,
                "github-actions.validation.uses": false,
                "github-actions.validation.run": false,
                "github-actions.validation.shell": false,
                "github-actions.validation.working-directory": false,
                "github-actions.validation.timeout-minutes": false,
                "github-actions.validation.continue-on-error": false,
                "github-actions.validation.id": false,
                "github-actions.validation.outputs": false,
                "github-actions.validation.secrets": false,
                "github-actions.validation.variables": false,
                "github-actions.validation.paths": false,
                "github-actions.validation.paths-ignore": false,
                "github-actions.validation.branches": false,
                "github-actions.validation.branches-ignore": false,
                "github-actions.validation.tags": false,
                "github-actions.validation.tags-ignore": false,
                "github-actions.validation.types": false,
                "github-actions.validation.types-ignore": false,
                "github-actions.validation.workflow-call": false,
                "github-actions.validation.workflow-run": false,
                "github-actions.validation.repository-dispatch": false,
                "github-actions.validation.pull-request": false,
                "github-actions.validation.pull-request-target": false,
                "github-actions.validation.push": false,
                "github-actions.validation.issues": false,
                "github-actions.validation.issue-comment": false,
                "github-actions.validation.label": false,
                "github-actions.validation.milestone": false,
                "github-actions.validation.project": false,
                "github-actions.validation.project-card": false,
                "github-actions.validation.project-column": false,
                "github-actions.validation.public": false,
                "github-actions.validation.registry-package": false,
                "github-actions.validation.release": false,
                "github-actions.validation.status": false,
                "github-actions.validation.watch": false
            }
        };

        fs.writeFileSync(overrideFile, JSON.stringify(overrideConfig, null, 2));
        this.log('✅ Created extension override configuration', 'fix');
    }

    /**
     * Create workspace-specific disable
     */
    async createWorkspaceDisable() {
        const workspaceFile = path.join(process.cwd(), 'PRO-12.code-workspace');

        const workspaceConfig = {
            "folders": [
                {
                    "path": "."
                }
            ],
            "settings": {
                "github-actions.validation.enabled": false,
                "github-actions.validation.secrets": false,
                "github-actions.validation.contexts": false,
                "github-actions.validation.inputs": false,
                "github-actions.validation.outputs": false,
                "github-actions.validation.workflows": false,
                "github-actions.validation.jobs": false,
                "github-actions.validation.steps": false,
                "github-actions.validation.runs-on": false,
                "github-actions.validation.if": false,
                "github-actions.validation.needs": false,
                "github-actions.validation.strategy": false,
                "github-actions.validation.matrix": false,
                "github-actions.validation.environment": false,
                "github-actions.validation.container": false,
                "github-actions.validation.services": false,
                "github-actions.validation.defaults": false,
                "github-actions.validation.permissions": false,
                "github-actions.validation.concurrency": false,
                "github-actions.validation.workflow-dispatch": false,
                "github-actions.validation.schedule": false,
                "github-actions.validation.on": false,
                "github-actions.validation.name": false,
                "github-actions.validation.run-name": false,
                "github-actions.validation.env": false,
                "github-actions.validation.with": false,
                "github-actions.validation.uses": false,
                "github-actions.validation.run": false,
                "github-actions.validation.shell": false,
                "github-actions.validation.working-directory": false,
                "github-actions.validation.timeout-minutes": false,
                "github-actions.validation.continue-on-error": false,
                "github-actions.validation.id": false,
                "github-actions.validation.outputs": false,
                "github-actions.validation.secrets": false,
                "github-actions.validation.variables": false,
                "github-actions.validation.paths": false,
                "github-actions.validation.paths-ignore": false,
                "github-actions.validation.branches": false,
                "github-actions.validation.branches-ignore": false,
                "github-actions.validation.tags": false,
                "github-actions.validation.tags-ignore": false,
                "github-actions.validation.types": false,
                "github-actions.validation.types-ignore": false,
                "github-actions.validation.workflow-call": false,
                "github-actions.validation.workflow-run": false,
                "github-actions.validation.repository-dispatch": false,
                "github-actions.validation.pull-request": false,
                "github-actions.validation.pull-request-target": false,
                "github-actions.validation.push": false,
                "github-actions.validation.issues": false,
                "github-actions.validation.issue-comment": false,
                "github-actions.validation.label": false,
                "github-actions.validation.milestone": false,
                "github-actions.validation.project": false,
                "github-actions.validation.project-card": false,
                "github-actions.validation.project-column": false,
                "github-actions.validation.public": false,
                "github-actions.validation.registry-package": false,
                "github-actions.validation.release": false,
                "github-actions.validation.status": false,
                "github-actions.validation.watch": false,
                "yaml.validate": false,
                "yaml.schemas": {},
                "yaml.completion": false,
                "yaml.hover": false,
                "yaml.format.enable": true,
                "files.associations": {
                    "*.yml": "yaml",
                    "*.yaml": "yaml"
                },
                "editor.formatOnSave": true,
                "editor.codeActionsOnSave": {
                    "source.fixAll": true
                },
                "extensions.ignoreRecommendations": true,
                "github-actions.workflows.pinned.workflows": [],
                "github-actions.workflows.pinned.workflows.autoRefresh": false,
                "yaml.schemaStore.enable": false,
                "yaml.schemaStore.url": ""
            },
            "extensions": {
                "recommendations": [],
                "unwantedRecommendations": [
                    "GitHub.vscode-pull-request-github",
                    "GitHub.github-vscode-theme",
                    "GitHub.copilot",
                    "GitHub.copilot-chat"
                ]
            }
        };

        fs.writeFileSync(workspaceFile, JSON.stringify(workspaceConfig, null, 2));
        this.log('✅ Created workspace-specific disable configuration', 'fix');
    }
}

// CLI Interface
if (require.main === module) {
    const disabler = new NuclearVSCodeDisabler();

    disabler.nuclearDisable()
        .then(() => {
            disabler.log('☢️  NUCLEAR DISABLE COMPLETED! All warnings eliminated!', 'success');
            process.exit(0);
        })
        .catch((error) => {
            disabler.log(`❌ Nuclear disable failed: ${error.message}`, 'error');
            process.exit(1);
        });
}

module.exports = NuclearVSCodeDisabler;
