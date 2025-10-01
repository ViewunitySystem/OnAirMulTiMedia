# 🧪 Testing Documentation - OnAirMulTiMedia / HFRF Universal SDR

## Overview
Comprehensive CI/CD testing pipeline for the OnAirMulTiMedia platform, including frontend validation, RF/SDR regulatory compliance, and security scanning.

**Last Updated:** 2025-10-01  
**Version:** 2.0.0  
**Project:** OnAirMulTiMedia - Globales Tor zur Welt by Raymond Demitrio Dr. Tel (DD5BE)

---

## 🎯 Test Categories

### 🚀 ADVANCED COMPREHENSIVE TESTING SYSTEM v2.0

This testing system goes **beyond basic validation** to continuously hunt for improvements, validate against all app requirements, and ensure production-ready quality.

### 1. Frontend Validation (`frontend-check`) ⭐ CRITICAL
Validates all HTML, CSS, JavaScript, and multimedia features.

**Tests Include:**
- ✅ HTML5 validation (DOCTYPE, meta tags, structure)
- ✅ JSON schema and blueprint validation
- ✅ JavaScript syntax checking
- ✅ Multimedia features (video/audio controls)
- ✅ Responsive design verification
- ✅ Service Worker registration
- ✅ Performance monitoring presence
- ✅ Internal link validation

**Example Output:**
```bash
🔍 Validating HTML files...
✅ index.html has DOCTYPE
✅ index.html has charset
✅ index.html has viewport
✅ Video controls present
✅ Audio controls present
✅ Responsive CSS present
✅ Service Worker registration present
```

---

### 2. RF/SDR Regulatory Compliance (`regulatory-compliance`) ⭐ CRITICAL
**NEW in v2.0.0** - Critical for amateur radio and SDR applications.

**Tests Include:**
- 📡 Blueprint schema validation (JSON Schema)
- 📡 RF frequency range compliance
- 📡 Amateur radio license verification
- 📡 Regulatory reference validation
- 📡 Callsign verification (DD5BE)
- 📡 Required disclaimer checks

**Regulatory Bands Checked:**
```python
HF:  1.8-2.0, 3.5-4.0, 7.0-7.3, 10.1-10.15, 14.0-14.35, 18.068-18.168, 
     21.0-21.45, 24.89-24.99, 28.0-29.7 MHz
VHF: 50.0-54.0, 144.0-148.0 MHz
UHF: 420.0-450.0, 902.0-928.0, 1240.0-1300.0 MHz
```

**Blueprint Validation:**
- Validates against `schemas/blueprint.schema.json`
- Checks required fields: `module`, `interfaces`, `validation`, `regulatory`
- Verifies RF modules have proper licensing documentation

**Example Output:**
```bash
🔍 Validating blueprints against JSON schema...
✅ rf_validation_engine.json is valid
📡 RFValidationEngine: RF module detected
   License required: True
   Regulatory references: 2
   ✅ Regulatory compliance documented
✅ Valid amateur radio callsign DD5BE found
```

---

### 3. Performance & Quality Analysis (`performance-quality`) 🆕
**NEW in v2.0.0** - Comprehensive performance, accessibility, and quality testing.

**Tests Include:**
- 🚀 **Lighthouse Performance Audit** - Google Lighthouse CI integration
- ⏱️ **Page Load Performance** - File size analysis, inline code detection
- ♿ **WCAG 2.1 Accessibility** - pa11y automated accessibility testing
- 🔍 **SEO Validation** - Meta tags, Open Graph, heading structure
- 📱 **PWA Compliance** - Manifest, service worker, icons, HTTPS
- 🔗 **Link Checker** - Automated broken link detection with linkinator
- 📊 **Code Quality Metrics** - LOC, comments, console.log detection, TODO/FIXME tracking

**Example Output:**
```bash
🚀 Running Lighthouse Performance Audit...
⏱️ Analyzing page load performance...
📄 index.html
   Size: 18.45 KB
   ✅ Good file size for performance
♿ Running accessibility tests...
✅ WCAG 2.1 AA compliance passed
🔍 SEO Validation...
✅ All SEO elements present
📱 PWA Compliance Check
✅ Web App Manifest
✅ Service Worker
🔗 Link Check Results:
✅ No broken links detected!
```

---

### 4. Dependency & Security Monitoring (`dependency-monitoring`) 🆕
**NEW in v2.0.0** - Continuously hunts for outdated dependencies and security issues.

**Tests Include:**
- 📦 **Outdated Dependencies** - npm outdated check
- 🔒 **Vulnerability Scanning** - npm audit for known CVEs
- ⚖️ **License Compliance** - Automated license checking
- 🔄 **GitHub Actions Versions** - Action version tracking and update reminders

**Example Output:**
```bash
📦 Checking for outdated dependencies...
🔒 Checking for known vulnerabilities...
found 0 vulnerabilities
⚖️ License Compliance: All dependencies compliant
🔄 GitHub Actions versions tracked
💡 Tip: Regularly update to latest versions
```

---

### 5. Browser Compatibility (`browser-compatibility`) 🆕
**NEW in v2.0.0** - Ensures cross-browser compatibility and responsive design.

**Tests Include:**
- 🌐 **Modern Feature Detection** - Flexbox, Grid, CSS Variables, ES6+
- 📱 **Responsive Design** - Viewport, media queries, responsive units
- 💡 **Polyfill Recommendations** - Identifies features needing polyfills
- ✅ **Feature Support Matrix** - Service Worker, Local Storage, Fetch API

**Example Output:**
```bash
🌐 Browser Feature Usage:
📄 index.html:
   • Flexbox
   • CSS Variables
   • Arrow Functions
   • Service Worker
   • Local Storage
💡 Ensure these features are supported in target browsers
📱 Responsive Design Check:
✅ Viewport meta tag present
✅ Media queries: 5
✅ Responsive units usage: 147
```

---

### 6. Node.js Build & Test (`nodejs-build`)
Tests Node.js components across multiple versions.

**Matrix Strategy:**
- Node.js 16.x
- Node.js 18.x ✨ (Primary)
- Node.js 20.x

**Tests Include:**
- ✅ Dependency installation
- ✅ Build process
- ✅ Unit tests (if configured)
- ✅ Integration tests

**Conditionally Runs:** Only if `package.json` exists

---

### 4. Rust Build & Test (`rust-build`)
Tests Rust/SDR backend components.

**Matrix Strategy:**
- Ubuntu Latest
- Windows Latest

**Tests Include:**
- ✅ Cargo build (release mode)
- ✅ Cargo test suite
- ✅ Clippy linting (strict mode)
- ✅ Cross-platform compatibility

**Conditionally Runs:** Only if `Cargo.toml` exists

---

### 5. Security Scanning (`security-scan`)
Snyk security vulnerability scanning.

**Tests Include:**
- 🔒 Node.js dependency vulnerabilities
- 🔒 Rust dependency vulnerabilities
- 🔒 Severity threshold: HIGH
- 🔒 Continuous monitoring

**Note:** Requires `SNYK_TOKEN` secret configured in repository settings.

---

### 6. Dependency Review (`dependency-review`)
Automated dependency review for pull requests.

**Tests Include:**
- 📦 New dependency analysis
- 📦 License compatibility
- 📦 Security vulnerability detection
- 📦 Fail threshold: MODERATE

**Runs On:** Pull requests only

---

### 7. GitHub Pages Deployment (`deploy-pages`)
Automated deployment to GitHub Pages.

**Deployment Process:**
1. Setup GitHub Pages
2. Upload artifact (complete project)
3. Deploy to: `https://viewunitysystem.github.io/OnAirMulTiMedia/`
4. Generate deployment summary

**Runs On:** Push to `gh-pages` branch only

---

## 🚀 Running Tests Locally

### Frontend Tests
```bash
# Validate HTML files
for file in *.html; do
  grep -q "<!DOCTYPE html>" "$file" && echo "✅ $file" || echo "❌ $file"
done

# Validate JSON
python3 -m json.tool schemas/blueprint.schema.json
python3 -m json.tool blueprints/rf_validation_engine.json

# Check JavaScript syntax
node --check *.js
```

### Regulatory Compliance Tests
```bash
# Install Python dependencies
pip install jsonschema

# Run blueprint validation
python3 << 'EOF'
import json, jsonschema
with open('schemas/blueprint.schema.json') as f:
    schema = json.load(f)
with open('blueprints/rf_validation_engine.json') as f:
    blueprint = json.load(f)
jsonschema.validate(instance=blueprint, schema=schema)
print("✅ Blueprint is valid")
EOF
```

### Node.js Tests
```bash
# Install dependencies
npm ci

# Run tests
npm test

# Run build
npm run build
```

### Rust Tests
```bash
# Build project
cargo build --release

# Run tests
cargo test

# Run clippy
cargo clippy -- -D warnings
```

---

## 📊 Test Status Badges

Add to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/ViewUnitySystem/OnAirMulTiMedia/actions/workflows/ci.yml/badge.svg)
```

---

## 🔧 Configuration

### Required Files
- `.github/workflows/ci.yml` - Main CI/CD workflow
- `schemas/blueprint.schema.json` - Blueprint validation schema
- `blueprints/*.json` - RF/SDR module blueprints

### Optional Secrets
- `SNYK_TOKEN` - For security scanning (optional but recommended)

### Environment Variables
```yaml
NODE_VERSION: '18.x'  # Primary Node.js version
RUST_VERSION: 'stable'  # Rust toolchain version
```

---

## ✅ Success Criteria

All tests pass when:
- ✅ All HTML files are valid HTML5
- ✅ All JSON files are valid JSON
- ✅ All blueprints pass schema validation
- ✅ RF modules have regulatory documentation
- ✅ Amateur radio callsign is present
- ✅ JavaScript syntax is valid
- ✅ No high-severity security vulnerabilities
- ✅ All builds complete successfully

---

## 🐛 Troubleshooting

### "Unrecognized function: hashFiles" Error
**Status:** ⚠️ Linter false positive  
**Solution:** Ignore - `hashFiles()` is a valid GitHub Actions function

### "Context access might be invalid: SNYK_TOKEN" Warning
**Status:** ⚠️ Expected warning  
**Solution:** Configure `SNYK_TOKEN` in repository secrets or continue without (tests will skip)

### Blueprint Validation Fails
**Check:**
1. All required fields present: `module`, `interfaces`, `validation`, `regulatory`
2. JSON syntax is valid
3. Matches schema in `schemas/blueprint.schema.json`

### RF Module Missing Regulatory Info
**Fix:**
```json
{
  "regulatory": {
    "license_required": true,
    "references": [
      { "jurisdiction": "DE", "section": "BNetzA 226.4.5" }
    ]
  }
}
```

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [JSON Schema Specification](https://json-schema.org/)
- [Bundesnetzagentur (BNetzA) Regulations](https://www.bundesnetzagentur.de/)
- [Amateur Radio Licensing](https://www.darc.de/)

---

## 📝 Changelog

### v2.0.0 - COMPREHENSIVE TESTING SYSTEM (2025-10-01)
**Major Release:** Beyond basic testing - continuously hunting for improvements!

#### 🆕 New Test Jobs
- ✨ **RF/SDR Regulatory Compliance** - Critical for amateur radio (DD5BE)
- ✨ **Performance & Quality Analysis** - Lighthouse, accessibility, SEO, PWA
- ✨ **Dependency & Security Monitoring** - Continuous vulnerability tracking
- ✨ **Browser Compatibility** - Cross-browser validation & responsive design

#### 📊 Advanced Testing Features
- 🚀 **Lighthouse CI** - Google Performance Audits
- ♿ **WCAG 2.1 AA** - pa11y accessibility testing
- 🔗 **Automated Link Checking** - linkinator integration
- 📱 **PWA Compliance** - Manifest, service worker, icons
- 🔍 **SEO Validation** - Meta tags, Open Graph, structured data
- 📊 **Code Quality Metrics** - LOC, complexity, TODO tracking
- 🔒 **npm audit** - Automated vulnerability scanning
- ⚖️ **License Compliance** - Automated license checking
- 🌐 **Modern Feature Detection** - Flexbox, Grid, ES6+, polyfill recommendations

#### 🔧 Improvements
- Enhanced frontend validation with multimedia checks
- Blueprint schema validation with JSON Schema
- Amateur radio callsign verification (DD5BE)
- Comprehensive test summary with categorized results
- Critical test failure blocking
- Improved error messages and debugging output

#### 📚 Documentation
- Complete TESTING.md with all test categories
- TEST-QUICK-REFERENCE.md for rapid access
- Local testing commands for all checks
- Troubleshooting guides

### v1.0.0 (Initial)
- Basic HTML/JS validation
- Node.js and Rust build tests
- Security scanning
- GitHub Pages deployment

---

**Maintained by:** Raymond Demitrio Dr. Tel (DD5BE)  
**Project:** OnAirMulTiMedia - ET MUNDO ARIAL MAGNITUDO MUSICAL LIVE LIFE 24/7  
**License:** Follow amateur radio regulations and licensing requirements

