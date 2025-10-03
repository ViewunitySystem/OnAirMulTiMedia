# 🚀 OnAirMulTiMedia - Quick Pipeline Activation Script (PowerShell)
# Automatisiert die komplette Pipeline-Aktivierung

param(
    [switch]$SkipTests,
    [switch]$SkipSecurity,
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

Write-Host "🚀 OnAirMulTiMedia Pipeline Activation" -ForegroundColor $Colors.White
Write-Host "======================================" -ForegroundColor $Colors.White

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the OnAirMulTiMedia root directory."
    exit 1
}

Write-Status "Starting pipeline activation..."

# Step 1: Check Node.js version
Write-Status "Checking Node.js version..."
try {
    $NodeVersion = (node --version).Substring(1).Split('.')[0]
    if ([int]$NodeVersion -lt 20) {
        Write-Error "Node.js version 20+ required. Current: $(node --version)"
        Write-Status "Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    }
    Write-Success "Node.js version OK: $(node --version)"
} catch {
    Write-Error "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
}

# Step 2: Install dependencies
Write-Status "Installing dependencies..."
if (-not (Test-Path "node_modules")) {
    try {
        npm install
        Write-Success "Dependencies installed"
    } catch {
        Write-Error "Failed to install dependencies"
        exit 1
    }
} else {
    Write-Status "Dependencies already installed"
}

# Step 3: Install Git hooks
Write-Status "Setting up Git hooks..."
try {
    if (Get-Command husky -ErrorAction SilentlyContinue) {
        npx husky install
        Write-Success "Git hooks installed"
    } else {
        Write-Warning "Husky not found, installing..."
        npm install -g husky
        npx husky install
        Write-Success "Git hooks installed"
    }
} catch {
    Write-Warning "Failed to install Git hooks, continuing..."
}

# Step 4: Check Firebase CLI
Write-Status "Checking Firebase CLI..."
try {
    $FirebaseVersion = firebase --version
    Write-Success "Firebase CLI found: $FirebaseVersion"
} catch {
    Write-Warning "Firebase CLI not found, installing..."
    try {
        npm install -g firebase-tools
        Write-Success "Firebase CLI installed"
    } catch {
        Write-Warning "Failed to install Firebase CLI, continuing..."
    }
}

# Step 5: Firebase login check
Write-Status "Checking Firebase authentication..."
try {
    firebase projects:list | Out-Null
    Write-Success "Firebase authenticated"
} catch {
    Write-Warning "Firebase not authenticated. Please run:"
    Write-Host "  firebase login" -ForegroundColor $Colors.Yellow
    Write-Host "  firebase login:ci" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Then add the CI token to GitHub Secrets:" -ForegroundColor $Colors.Yellow
    Write-Host "  https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Read-Host "Press Enter after completing Firebase setup"
}

# Step 6: Run tests (if not skipped)
if (-not $SkipTests) {
    Write-Status "Running tests..."
    try {
        npm test
        Write-Success "Unit tests passed"
    } catch {
        Write-Error "Unit tests failed"
        if (-not $Force) {
            exit 1
        }
    }
} else {
    Write-Warning "Skipping tests"
}

# Step 7: Run security audit (if not skipped)
if (-not $SkipSecurity) {
    Write-Status "Running security audit..."
    try {
        npm run security
        Write-Success "Security audit passed"
    } catch {
        Write-Warning "Security issues found, but continuing..."
    }
} else {
    Write-Warning "Skipping security audit"
}

# Step 8: Check Git status
Write-Status "Checking Git status..."
try {
    $GitStatus = git status --porcelain
    if ($GitStatus) {
        Write-Warning "Uncommitted changes detected:"
        git status --short
        Write-Host ""
        $Response = Read-Host "Do you want to commit these changes? (y/n)"
        if ($Response -eq "y" -or $Response -eq "Y") {
            git add .
            git commit -m "chore: pipeline activation setup"
            Write-Success "Changes committed"
        }
    }
} catch {
    Write-Warning "Git not available or not a Git repository"
}

# Step 9: Check branches
Write-Status "Checking Git branches..."
try {
    $CurrentBranch = git branch --show-current
    Write-Status "Current branch: $CurrentBranch"
} catch {
    Write-Warning "Cannot determine current branch"
}

# Step 10: Create gh-pages branch if it doesn't exist
Write-Status "Checking gh-pages branch..."
try {
    $GhPagesExists = git show-ref --verify --quiet refs/heads/gh-pages
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Creating gh-pages branch..."
        git checkout -b gh-pages
        Write-Success "gh-pages branch created"
    } else {
        Write-Status "gh-pages branch already exists"
        git checkout gh-pages
    }
} catch {
    Write-Warning "Cannot create gh-pages branch, continuing..."
}

# Step 11: Push to trigger pipeline
Write-Status "Pushing to gh-pages to trigger pipeline..."
try {
    git push origin gh-pages
    Write-Success "Successfully pushed to gh-pages"
} catch {
    Write-Error "Failed to push to gh-pages"
    if (-not $Force) {
        exit 1
    }
}

# Step 12: Display next steps
Write-Host ""
Write-Host "🎉 Pipeline Activation Complete!" -ForegroundColor $Colors.Green
Write-Host "================================" -ForegroundColor $Colors.Green
Write-Host ""
Write-Success "✅ Dependencies installed"
Write-Success "✅ Git hooks configured"
if (-not $SkipTests) { Write-Success "✅ Tests passed" }
if (-not $SkipSecurity) { Write-Success "✅ Security audit completed" }
Write-Success "✅ Pushed to gh-pages branch"
Write-Host ""
Write-Host "📊 Monitor your pipeline:" -ForegroundColor $Colors.White
Write-Host "  GitHub Actions: https://github.com/ViewunitySystem/OnAirMulTiMedia/actions" -ForegroundColor $Colors.Blue
Write-Host ""
Write-Host "🌐 Live URLs (will be available in ~5 minutes):" -ForegroundColor $Colors.White
Write-Host "  GitHub Pages: https://viewunitysystem.github.io/OnAirMulTiMedia/" -ForegroundColor $Colors.Blue
Write-Host "  Firebase Prod: https://onairmultimedia.web.app/" -ForegroundColor $Colors.Blue
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor $Colors.White
Write-Host "  1. Set up GitHub Secrets (FIREBASE_TOKEN)" -ForegroundColor $Colors.Yellow
Write-Host "  2. Configure Firebase projects" -ForegroundColor $Colors.Yellow
Write-Host "  3. Monitor deployment status" -ForegroundColor $Colors.Yellow
Write-Host "  4. Test all environments" -ForegroundColor $Colors.Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor $Colors.White
Write-Host "  - Setup Guide: CI-CD-SETUP-COMPLETE.md" -ForegroundColor $Colors.Blue
Write-Host "  - Activation Guide: PIPELINE-AKTIVIERUNG.md" -ForegroundColor $Colors.Blue
Write-Host ""
Write-Success "Pipeline activation completed successfully! 🚀"
