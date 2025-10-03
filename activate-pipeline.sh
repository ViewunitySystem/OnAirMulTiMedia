#!/bin/bash

# 🚀 OnAirMulTiMedia - Quick Pipeline Activation Script
# Automatisiert die komplette Pipeline-Aktivierung

set -e  # Exit on any error

echo "🚀 OnAirMulTiMedia Pipeline Activation"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the OnAirMulTiMedia root directory."
    exit 1
fi

print_status "Starting pipeline activation..."

# Step 1: Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20+ required. Current: $(node --version)"
    print_status "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi
print_success "Node.js version OK: $(node --version)"

# Step 2: Install dependencies
print_status "Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Step 3: Install Git hooks
print_status "Setting up Git hooks..."
if command -v husky &> /dev/null; then
    npx husky install
    print_success "Git hooks installed"
else
    print_warning "Husky not found, installing..."
    npm install -g husky
    npx husky install
    print_success "Git hooks installed"
fi

# Step 4: Check Firebase CLI
print_status "Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found, installing..."
    npm install -g firebase-tools
    print_success "Firebase CLI installed"
else
    print_success "Firebase CLI found: $(firebase --version)"
fi

# Step 5: Firebase login check
print_status "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Firebase not authenticated. Please run:"
    echo "  firebase login"
    echo "  firebase login:ci"
    echo ""
    echo "Then add the CI token to GitHub Secrets:"
    echo "  https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions"
    echo ""
    read -p "Press Enter after completing Firebase setup..."
fi

# Step 6: Run tests
print_status "Running tests..."
if npm test; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Step 7: Run security audit
print_status "Running security audit..."
if npm run security; then
    print_success "Security audit passed"
else
    print_warning "Security issues found, but continuing..."
fi

# Step 8: Check Git status
print_status "Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted changes detected:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "chore: pipeline activation setup"
        print_success "Changes committed"
    fi
fi

# Step 9: Check branches
print_status "Checking Git branches..."
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Step 10: Create gh-pages branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/gh-pages; then
    print_status "Creating gh-pages branch..."
    git checkout -b gh-pages
    print_success "gh-pages branch created"
else
    print_status "gh-pages branch already exists"
    git checkout gh-pages
fi

# Step 11: Push to trigger pipeline
print_status "Pushing to gh-pages to trigger pipeline..."
if git push origin gh-pages; then
    print_success "Successfully pushed to gh-pages"
else
    print_error "Failed to push to gh-pages"
    exit 1
fi

# Step 12: Display next steps
echo ""
echo "🎉 Pipeline Activation Complete!"
echo "================================"
echo ""
print_success "✅ Dependencies installed"
print_success "✅ Git hooks configured"
print_success "✅ Tests passed"
print_success "✅ Security audit completed"
print_success "✅ Pushed to gh-pages branch"
echo ""
echo "📊 Monitor your pipeline:"
echo "  GitHub Actions: https://github.com/ViewunitySystem/OnAirMulTiMedia/actions"
echo ""
echo "🌐 Live URLs (will be available in ~5 minutes):"
echo "  GitHub Pages: https://viewunitysystem.github.io/OnAirMulTiMedia/"
echo "  Firebase Prod: https://onairmultimedia.web.app/"
echo ""
echo "🔧 Next steps:"
echo "  1. Set up GitHub Secrets (FIREBASE_TOKEN)"
echo "  2. Configure Firebase projects"
echo "  3. Monitor deployment status"
echo "  4. Test all environments"
echo ""
echo "📚 Documentation:"
echo "  - Setup Guide: CI-CD-SETUP-COMPLETE.md"
echo "  - Activation Guide: PIPELINE-AKTIVIERUNG.md"
echo ""
print_success "Pipeline activation completed successfully! 🚀"
