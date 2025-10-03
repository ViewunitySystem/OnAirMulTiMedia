# 🚀 OnAirMulTiMedia - Complete CI/CD Pipeline Setup

## 📋 Overview

This repository now includes a **complete, production-ready CI/CD pipeline** with:

- ✅ **Multi-Target Deployment** (GitHub Pages + Firebase)
- ✅ **Self-Healing Architecture** (Automated fixes)
- ✅ **Security Hardening** (CSP, SRI, Headers)
- ✅ **Repository Hygiene** (Clean structure, proper .gitignore)
- ✅ **Comprehensive Testing** (Unit, E2E, Security)
- ✅ **Automated Quality Gates** (Linting, Formatting, Security)

## 🏗️ Architecture

### Deployment Targets

| Branch     | Target                    | URL                                    |
|------------|---------------------------|----------------------------------------|
| `gh-pages` | GitHub Pages + Firebase Prod | https://viewunitysystem.github.io/OnAirMulTiMedia/ |
| `mainzero` | Firebase Staging          | https://onairmultimedia-staging.web.app/ |
| `main`     | Firebase Development      | https://onairmultimedia-dev.web.app/ |

### Self-Healing Features

- 🔧 **Automatic HTML fixes** (redirects, frame-busting)
- 🔧 **Service Worker management** (offline support)
- 🔧 **Security header injection** (CSP, security headers)
- 🔧 **Repository hygiene** (binary cleanup, lockfile management)
- 🔧 **GitHub Pages source verification** (enforces gh-pages branch)

## 🛠️ Setup Instructions

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/ViewunitySystem/OnAirMulTiMedia.git
cd OnAirMulTiMedia

# Install dependencies
npm install

# Install Git hooks
npx husky install
```

### 2. Firebase Configuration

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init hosting

# Deploy to test
firebase deploy --only hosting
```

### 3. GitHub Secrets Setup

Add these secrets to your GitHub repository:

- `FIREBASE_TOKEN`: Get from `firebase login:ci`
- `GITHUB_TOKEN`: Automatically provided by GitHub

### 4. Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run security audit
npm run security

# Run self-healing
npm run selfheal
```

## 🔧 Workflow Files

### `.github/workflows/deploy-multi.yml`
- **Multi-target deployment** (Pages + Firebase)
- **Branch-based routing** (gh-pages → prod, mainzero → staging, main → dev)
- **PR preview channels** (Firebase hosting channels)
- **Security scanning** (dependency audit, vulnerability check)
- **Performance testing** (Lighthouse CI)

### `.github/workflows/ci-selfheal.yml`
- **Self-healing automation** (every 30 minutes)
- **Repository hygiene checks** (binary files, lockfiles)
- **Security header validation**
- **Automated PR creation** for fixes
- **GitHub Pages source verification**

## 🔒 Security Features

### Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self' wss://*; base-uri 'none'; frame-ancestors 'self'; upgrade-insecure-requests">
```

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Subresource Integrity (SRI)
- Automatic SRI generation for external resources
- Integrity verification for all scripts and stylesheets

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- **Core functionality testing**
- **Security header validation**
- **Service Worker testing**
- **Error handling verification**

### E2E Tests (Playwright)
- **Cross-browser compatibility** (Chrome, Firefox, Safari)
- **Mobile responsiveness** (iOS, Android)
- **Offline functionality** (Service Worker)
- **Accessibility compliance**

### Security Tests
- **Dependency vulnerability scanning**
- **CSP violation detection**
- **Security header validation**
- **Content injection prevention**

## 📊 Quality Gates

### Pre-commit Hooks
- ESLint (code quality)
- Prettier (code formatting)
- Unit tests (functionality)

### Pre-push Hooks
- Security audit (vulnerabilities)
- Full test suite (comprehensive testing)
- E2E tests (integration testing)

### CI/CD Gates
- Build verification
- Test execution
- Security scanning
- Performance testing
- Self-healing validation

## 🔄 Self-Healing Rules

### Automatic Fixes
1. **HTML Redirects** → Convert to iframe-based loading
2. **Frame-busting** → Remove for iframe compatibility
3. **Service Worker** → Create if missing
4. **Offline Page** → Generate fallback content
5. **Security Headers** → Inject CSP and security headers
6. **Repository Hygiene** → Clean binary files, add lockfiles

### Manual Review
- All automated fixes create PRs for review
- Critical changes require manual approval
- Security fixes are prioritized

## 📈 Monitoring & Observability

### Deployment Status
- **GitHub Pages**: https://viewunitysystem.github.io/OnAirMulTiMedia/
- **Firebase Prod**: https://onairmultimedia.web.app/
- **Firebase Staging**: https://onairmultimedia-staging.web.app/
- **Firebase Dev**: https://onairmultimedia-dev.web.app/

### Health Checks
- Automated status monitoring (every 30 minutes)
- Deployment verification
- Performance metrics
- Security compliance

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Deployment Fails**
   - Check `FIREBASE_TOKEN` secret
   - Verify Firebase project configuration
   - Ensure proper permissions

2. **GitHub Pages Not Updating**
   - Verify `gh-pages` branch is set as source
   - Check Pages build logs
   - Ensure proper file structure

3. **Self-Healing Not Working**
   - Check workflow permissions
   - Verify branch protection rules
   - Review self-healing logs

4. **Tests Failing**
   - Check Node.js version (requires 20+)
   - Verify dependencies installation
   - Review test configuration

### Debug Commands

```bash
# Check Firebase status
firebase projects:list

# Verify GitHub Pages
gh api repos/ViewunitySystem/OnAirMulTiMedia/pages

# Run self-healing locally
npm run selfheal

# Check security
npm run security

# Test locally
npm run test:e2e:ui
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Playwright Testing](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [ESLint Configuration](https://eslint.org/docs/latest/use/configure/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 🎯 Next Steps

1. **Review and merge** the generated PRs
2. **Configure GitHub secrets** for Firebase
3. **Test the deployment** on all targets
4. **Monitor the self-healing** system
5. **Customize security policies** as needed
6. **Add additional tests** for specific features

---

**Status**: ✅ **Complete CI/CD Pipeline Ready**
**Last Updated**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Pipeline Version**: 1.0.0
