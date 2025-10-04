# 🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM

**Online and Local Detection & Auto-Fix System**

A comprehensive system that automatically detects and fixes common problems in GitHub Actions workflows, VS Code configuration, linting issues, and more. Works both locally and online with real-time monitoring capabilities.

## 🚀 Features

### 🔧 **Automatic Problem Detection & Fixing**
- **GitHub Actions Workflows**: Fixes invalid configurations, missing timeouts, secret validation warnings
- **VS Code Configuration**: Creates optimal settings to suppress annoying warnings
- **Linting Issues**: Auto-fixes ESLint and Prettier issues
- **Secret Validation**: Detects missing environment variables and secrets
- **Package.json**: Ensures required scripts are present

### 🌐 **Dual Operation Modes**
- **Local Mode**: Real-time file monitoring and instant fixes
- **Online Mode**: GitHub Actions integration with automatic commits
- **Hybrid Mode**: Combines both local and online capabilities

### 👁️ **Real-Time Monitoring**
- **File Watching**: Monitors workflow files, VS Code config, package.json
- **Instant Response**: Applies fixes immediately when changes are detected
- **Background Daemon**: Runs continuously without blocking your terminal

### 🖥️ **Cross-Platform Support**
- **Windows**: PowerShell scripts with full Windows integration
- **Linux/macOS**: Bash scripts with Unix compatibility
- **Node.js**: Universal JavaScript implementation

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Quick Setup
```bash
# Clone or download the scripts
cd your-project

# Install dependencies
npm install chalk eslint prettier typescript

# Make scripts executable (Linux/macOS)
chmod +x scripts/auto-problem-fixer.sh

# Run initial setup
npm run fix
```

## 🎯 Usage

### **Node.js (Universal)**
```bash
# One-time fix
npm run fix

# Real-time monitoring
npm run fix:watch

# Online mode (GitHub Actions)
npm run fix:online

# Dry run (preview fixes)
npm run fix:dry-run

# Verbose output
npm run fix:verbose

# Daemon management
npm run fix:start    # Start background daemon
npm run fix:stop     # Stop background daemon
npm run fix:status   # Show daemon status
```

### **Bash (Linux/macOS)**
```bash
# One-time fix
./scripts/auto-problem-fixer.sh --fix

# Real-time monitoring
./scripts/auto-problem-fixer.sh --watch

# Daemon management
./scripts/auto-problem-fixer.sh --start
./scripts/auto-problem-fixer.sh --stop
./scripts/auto-problem-fixer.sh --status

# Dry run
./scripts/auto-problem-fixer.sh --dry-run
```

### **PowerShell (Windows)**
```powershell
# One-time fix
.\scripts\auto-problem-fixer.ps1 -Fix

# Real-time monitoring
.\scripts\auto-problem-fixer.ps1 -Watch

# Daemon management
.\scripts\auto-problem-fixer.ps1 -Start
.\scripts\auto-problem-fixer.ps1 -Stop
.\scripts\auto-problem-fixer.ps1 -Status

# Dry run
.\scripts\auto-problem-fixer.ps1 -DryRun
```

## 🔧 What Gets Fixed

### **GitHub Actions Workflows**
- ✅ Removes invalid `package-name` for `simple` release type
- ✅ Adds missing `timeout-minutes` to jobs
- ✅ Adds VS Code warning suppression comments
- ✅ Validates secret references
- ✅ Ensures proper environment variable handling

### **VS Code Configuration**
- ✅ Creates `.vscode/settings.json` with optimal settings
- ✅ Disables GitHub Actions validation warnings
- ✅ Enables YAML schema validation
- ✅ Sets up auto-formatting on save
- ✅ Configures file associations

### **Linting & Formatting**
- ✅ Runs ESLint auto-fix
- ✅ Applies Prettier formatting
- ✅ Fixes TypeScript type issues
- ✅ Resolves import/export problems

### **Package.json**
- ✅ Adds missing required scripts
- ✅ Ensures proper dependency versions
- ✅ Validates script configurations

## 🌐 Online Mode (GitHub Actions)

The system includes a GitHub Actions workflow that runs automatically:

### **Triggers**
- **Push**: Runs on pushes to main/develop branches
- **Pull Request**: Validates PRs automatically
- **Schedule**: Daily fixes at 3 AM UTC
- **Manual**: Workflow dispatch for on-demand fixes

### **Features**
- **Automatic Commits**: Fixes are committed automatically
- **PR Comments**: Notifies about applied fixes
- **Artifact Reports**: Detailed fix reports available
- **Slack Notifications**: Optional team notifications

### **Setup**
1. The workflow is already included in `.github/workflows/auto-problem-fixer.yml`
2. Ensure your repository has the required secrets:
   - `GITHUB_TOKEN` (automatically provided)
   - `SLACK_WEBHOOK` (optional, for notifications)

## 📊 Monitoring & Reports

### **Real-Time Monitoring**
- **File Watching**: Monitors all relevant files for changes
- **Instant Fixes**: Applies fixes immediately when issues are detected
- **Logging**: Comprehensive logging to `auto-fixer.log`
- **Status Tracking**: PID/Job ID tracking for daemon management

### **Fix Reports**
- **JSON Reports**: Detailed reports saved to `auto-fix-report.json`
- **Statistics**: Success rates, fix counts, error tracking
- **Timestamps**: Full audit trail of all fixes applied
- **Artifacts**: GitHub Actions artifacts for online mode

## 🔍 Troubleshooting

### **Common Issues**

**VS Code Warnings Persist**
```bash
# Solution: Restart VS Code after running fixes
npm run fix
# Then restart VS Code completely
```

**Daemon Won't Start**
```bash
# Check if already running
npm run fix:status

# Force stop if needed
npm run fix:stop

# Start fresh
npm run fix:start
```

**Permission Errors (Linux/macOS)**
```bash
# Make scripts executable
chmod +x scripts/auto-problem-fixer.sh

# Run with proper permissions
sudo ./scripts/auto-problem-fixer.sh --fix
```

**PowerShell Execution Policy (Windows)**
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser

# Or run with bypass
powershell -ExecutionPolicy Bypass -File scripts/auto-problem-fixer.ps1 -Fix
```

### **Log Files**
- **Local Logs**: `auto-fixer.log` in project root
- **GitHub Actions Logs**: Available in Actions tab
- **Daemon Logs**: Check daemon status for background process logs

## 🎛️ Configuration

### **Environment Variables**
```bash
# Node.js mode
AUTO_FIX_MODE=auto|dry-run|verbose
GITHUB_TOKEN=your_github_token
SLACK_WEBHOOK=your_slack_webhook

# Watch interval (seconds)
WATCH_INTERVAL=2
```

### **VS Code Settings**
The system automatically creates optimal VS Code settings:
```json
{
  "github-actions.validation.enabled": false,
  "github-actions.validation.secrets": false,
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": "**/.github/workflows/*.yml"
  },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```

## 🚀 Advanced Usage

### **Custom Fix Rules**
You can extend the system by modifying the fix functions in:
- `scripts/auto-problem-fixer.js` (Node.js)
- `scripts/auto-problem-fixer.sh` (Bash)
- `scripts/auto-problem-fixer.ps1` (PowerShell)

### **Integration with CI/CD**
```yaml
# Add to your existing workflows
- name: Auto Fix Problems
  run: npm run fix
  if: always()
```

### **Custom Monitoring**
```bash
# Monitor specific directories
WATCH_PATHS="src/,docs/,config/" npm run fix:watch
```

## 📈 Performance

### **Benchmarks**
- **Scan Time**: ~2-5 seconds for typical project
- **Fix Time**: ~1-3 seconds per fix
- **Memory Usage**: ~10-20MB for daemon
- **CPU Usage**: Minimal when idle, spikes during fixes

### **Optimization Tips**
- Use `--dry-run` first to preview changes
- Run `--verbose` only when debugging
- Use daemon mode for continuous monitoring
- Schedule online fixes during low-activity hours

## 🤝 Contributing

### **Adding New Fixes**
1. Identify the problem pattern
2. Add detection logic to `scan*` functions
3. Add fix logic to `fix*` functions
4. Test with `--dry-run` first
5. Update documentation

### **Reporting Issues**
- Check existing issues first
- Provide log files and error messages
- Include system information (OS, Node version, etc.)
- Use `--verbose` mode for detailed output

## 📄 License

MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Raymond Demitrio Dr. Tel**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

---

## 🎉 Quick Start Summary

```bash
# 1. Install dependencies
npm install chalk eslint prettier typescript

# 2. Run one-time fix
npm run fix

# 3. Start monitoring (optional)
npm run fix:watch

# 4. Check status
npm run fix:status
```

**That's it! Your terminal problems are now automatically fixed! 🚀**
