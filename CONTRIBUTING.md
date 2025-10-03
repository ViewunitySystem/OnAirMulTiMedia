# 🤝 Contributing to OnAirMulTiMedia

**Willkommen in der OnAirMulTiMedia Community!**

Wir freuen uns über Ihre Beiträge zu diesem Universal SDR System. Hier finden Sie alle Informationen, die Sie benötigen, um effektiv zu unserem Projekt beizutragen.

## 🎯 Wie Sie Beitragen Können

### 💻 Code Contributions
- **Bug Fixes**: Fehler beheben und Verbesserungen
- **New Features**: Neue Funktionalitäten entwickeln
- **Documentation**: Dokumentation verbessern
- **Testing**: Tests schreiben und ausführen
- **Performance**: Optimierungen und Performance-Verbesserungen

### 📚 Documentation
- **README Updates**: Anleitungen verbessern
- **Code Comments**: Code dokumentieren
- **Wiki**: Wiki-Artikel schreiben
- **Tutorials**: Step-by-Step Anleitungen
- **Translations**: Übersetzungen in andere Sprachen

### 🐛 Bug Reports & Feature Requests
- **Issues**: Bugs melden und Features vorschlagen
- **Discussions**: Ideen diskutieren
- **Feedback**: Feedback zu bestehenden Features
- **User Stories**: Anwendungsfälle beschreiben

## 🚀 Erste Schritte

### 1. Repository Forken
```bash
# GitHub Repository forken
# Dann klonen Sie Ihr Fork
git clone https://github.com/IHR-USERNAME/OnAirMulTiMedia.git
cd OnAirMulTiMedia
```

### 2. Development Environment Setup
```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Tests ausführen
npm test
```

### 3. Branch erstellen
```bash
# Neuen Branch für Ihr Feature erstellen
git checkout -b feature/ihr-feature-name
# oder für Bug Fixes
git checkout -b bugfix/bug-description
```

## 📝 Code Standards

### JavaScript/TypeScript
- **ES6+**: Verwenden Sie moderne JavaScript Features
- **Comments**: Kommentieren Sie komplexe Logik
- **Functions**: Kleine, fokussierte Funktionen
- **Error Handling**: Proper Error Handling implementieren

```javascript
// ✅ Guter Code
function calculateSpectrum(data) {
    // Validierung der Eingabedaten
    if (!data || !Array.isArray(data)) {
        throw new Error('Invalid spectrum data');
    }
    
    // Spektrum-Berechnung
    return data.map(value => Math.sqrt(value));
}

// ❌ Schlechter Code
function calc(d) {
    return d.map(v => Math.sqrt(v));
}
```

### HTML/CSS
- **Semantic HTML**: Verwenden Sie semantische HTML-Tags
- **Accessibility**: ARIA-Labels und Accessibility-Features
- **Responsive Design**: Mobile-first Approach
- **CSS Variables**: Für konsistente Styling

```html
<!-- ✅ Guter HTML -->
<main role="main" aria-label="SDR Control Panel">
    <section class="spectrum-display" aria-live="polite">
        <h2>Spectrum Analysis</h2>
        <canvas id="spectrum" 
                role="img" 
                aria-label="Real-time spectrum visualization">
        </canvas>
    </section>
</main>
```

### Rust (für SDR Backend)
- **Cargo**: Verwenden Sie Cargo für Dependency Management
- **Documentation**: Rustdoc Comments
- **Error Handling**: Result<T, E> verwenden
- **Performance**: Effiziente Algorithmen

```rust
/// Berechnet das Spektrum der eingehenden Daten
/// 
/// # Arguments
/// * `data` - Rohdaten für die Spektrum-Berechnung
/// 
/// # Returns
/// * `Result<Vec<f64>, SpectrumError>` - Berechnetes Spektrum oder Fehler
pub fn calculate_spectrum(data: &[f64]) -> Result<Vec<f64>, SpectrumError> {
    if data.is_empty() {
        return Err(SpectrumError::EmptyData);
    }
    
    // Spektrum-Berechnung implementieren
    Ok(data.iter().map(|&x| x.sqrt()).collect())
}
```

## 🔄 Pull Request Process

### 1. Vor dem PR
- [ ] Code getestet
- [ ] Dokumentation aktualisiert
- [ ] Tests geschrieben/aktualisiert
- [ ] Linting bestanden
- [ ] Keine Konflikte mit main Branch

### 2. PR Template
```markdown
## 📝 Beschreibung
Kurze Beschreibung der Änderungen

## 🔗 Related Issues
Fixes #123

## 🧪 Tests
- [ ] Unit Tests hinzugefügt
- [ ] Integration Tests bestanden
- [ ] Manual Testing durchgeführt

## 📱 Geräte-Tests
- [ ] Desktop (Windows/macOS/Linux)
- [ ] Mobile (iOS/Android)
- [ ] Tablet (iPad/Android)
- [ ] Browser Compatibility

## 📸 Screenshots (falls UI-Änderungen)
[Fügen Sie Screenshots hinzu]

## 📋 Checklist
- [ ] Code folgt den Standards
- [ ] Selbst-Review durchgeführt
- [ ] Kommentare zu komplexen Code-Teilen
- [ ] Dokumentation aktualisiert
- [ ] Keine Console-Warnings
```

### 3. PR Review Process
1. **Automated Checks**: CI/CD Pipeline
2. **Code Review**: Mindestens 1 Reviewer
3. **Testing**: Automatische und manuelle Tests
4. **Documentation**: Docs aktualisiert
5. **Merge**: Nach Approval

## 🧪 Testing Guidelines

### Unit Tests
```javascript
// test/spectrum.test.js
describe('Spectrum Calculation', () => {
    test('should calculate spectrum correctly', () => {
        const input = [1, 4, 9, 16];
        const expected = [1, 2, 3, 4];
        const result = calculateSpectrum(input);
        expect(result).toEqual(expected);
    });
    
    test('should handle empty data', () => {
        expect(() => calculateSpectrum([])).toThrow('Invalid spectrum data');
    });
});
```

### Integration Tests
```javascript
// test/integration.test.js
describe('API Integration', () => {
    test('should return spectrum data', async () => {
        const response = await fetch('/api/spectrum');
        const data = await response.json();
        expect(data).toHaveProperty('frequencies');
        expect(data).toHaveProperty('amplitudes');
    });
});
```

### Browser Tests
- **Cross-Browser**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Chrome Mobile
- **Performance**: Lighthouse Scores
- **Accessibility**: WAVE, axe-core

## 🌍 Internationalisierung

### Neue Sprachen hinzufügen
```javascript
// i18n/languages/de.js
export default {
    'spectrum.title': 'Spektrum Analyse',
    'spectrum.description': 'Real-time Frequenz-Spektrum',
    'error.network': 'Netzwerk-Fehler aufgetreten'
};
```

### Translation Guidelines
- **Context**: Vollständige Sätze verwenden
- **Pluralization**: Richtig behandeln
- **Cultural**: Kulturelle Unterschiede berücksichtigen
- **Technical Terms**: Konsistente Übersetzungen

## 🎨 UI/UX Guidelines

### Design Principles
- **Accessibility First**: WCAG 2.1 AA Compliance
- **Mobile First**: Responsive Design
- **Progressive Enhancement**: Funktioniert ohne JavaScript
- **Performance**: Schnelle Ladezeiten

### Color Scheme
```css
:root {
    --primary-color: #FF6B35;
    --secondary-color: #004E89;
    --background-color: #1A1A1A;
    --text-color: #FFFFFF;
    --accent-color: #00D4AA;
}
```

### Typography
- **Font Family**: System fonts für Performance
- **Font Sizes**: Responsive Typography
- **Line Height**: 1.5 für Lesbarkeit
- **Contrast**: Mindestens 4.5:1

## 🔧 Development Tools

### Recommended Tools
- **Editor**: VS Code mit Extensions
- **Browser**: Chrome DevTools
- **Testing**: Jest, Cypress
- **Linting**: ESLint, Prettier
- **Git**: GitKraken oder SourceTree

### VS Code Extensions
```json
{
    "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.live-server"
    ]
}
```

## 📊 Performance Guidelines

### Frontend Performance
- **Bundle Size**: < 500KB initial
- **Loading Time**: < 3s First Contentful Paint
- **Memory Usage**: < 100MB für SDR Operationen
- **Canvas Performance**: 60fps für Visualisierungen

### Backend Performance
- **Response Time**: < 100ms für API Calls
- **Throughput**: > 1000 requests/second
- **Memory**: Efficient memory usage
- **CPU**: Optimierte Algorithmen

## 🛡️ Security Guidelines

### Security Best Practices
- **Input Validation**: Alle Eingaben validieren
- **XSS Prevention**: Content Security Policy
- **CSRF Protection**: CSRF Tokens
- **HTTPS**: Immer HTTPS verwenden

### Data Privacy
- **Local Storage**: Keine sensiblen Daten
- **No Tracking**: Keine User-Tracking
- **GDPR Compliance**: Datenschutz-Grundverordnung
- **Transparency**: Offene Kommunikation

## 🎵 Producer Info Integration

### Musik & Audio
- **Audio Quality**: High-Quality Audio Processing
- **Real-time**: Low-latency Audio
- **Formats**: Multiple Audio Formats
- **Effects**: Audio Effects und Processing

### SDR Integration
- **Frequency Ranges**: Alle Amateurfunk-Bänder
- **Modulations**: AM, FM, SSB, Digital
- **Protocols**: APRS, DMR, D-STAR, etc.
- **Hardware**: HackRF, LimeSDR Support

## 🚨 Code of Conduct

### Unser Versprechen
Wir verpflichten uns, eine einladende und respektvolle Umgebung für alle zu schaffen, unabhängig von:
- Alter, Körpergröße, Behinderung, ethnischer Zugehörigkeit
- Geschlechtsmerkmalen, Geschlechtsidentität und -ausdruck
- Erfahrungsgrad, Bildung, sozioökonomischem Status
- Nationalität, persönlichem Aussehen, Rasse, Religion
- Geschlechtlicher Identität und Orientierung

### Erwartetes Verhalten
- Verwendung einer einladenden und inklusiven Sprache
- Respekt vor unterschiedlichen Standpunkten und Erfahrungen
- Annahme konstruktiver Kritik
- Fokus auf das, was für die Community am besten ist
- Empathie gegenüber anderen Community-Mitgliedern

### Inakzeptables Verhalten
- Verwendung sexualisierter Sprache oder Bilder
- Trolling, beleidigende/abwertende Kommentare
- Öffentliche oder private Belästigung
- Veröffentlichung privater Informationen ohne Erlaubnis
- Anderes Verhalten, das in einem professionellen Umfeld unangemessen wäre

## 📞 Support & Contact

### Getting Help
- **GitHub Issues**: Für Bugs und Feature Requests
- **Discussions**: Für Fragen und Ideen
- **Wiki**: Für Dokumentation und Tutorials
- **Email**: gentlyoverdone@outlook.com

### Maintainer Contact
- **Name**: Raymond Demitrio Dr. Tel
- **GitHub**: @ViewunitySystem
- **Email**: gentlyoverdone@outlook.com
- **Callsign**: DD5BE

## 🎉 Recognition

### Contributors Hall of Fame
Wir würdigen alle Contributors:
- **Code Contributors**: In README und Release Notes
- **Documentation**: Wiki und Docs Contributors
- **Testing**: Beta Testers und Feedback
- **Community**: Active Community Members

### Special Thanks
- **Early Adopters**: Erste User und Feedback
- **Bug Reporters**: Detaillierte Bug Reports
- **Feature Suggesters**: Innovative Ideen
- **Translators**: Multi-Language Support

---

## 🚀 Ready to Contribute?

1. **Fork** das Repository
2. **Create** einen Feature Branch
3. **Code** Ihre Änderungen
4. **Test** gründlich
5. **Submit** einen Pull Request

**Willkommen in der OnAirMulTiMedia Community! 🎉**

---

**© 2025 Raymond Demitrio Dr. Tel - OnAirMulTiMedia**  
**Universal Communication Platform**
