# 🎶 Bug-Symphony mit Gitarren- & Audio-Integration

## 🧭 Konzept

Das OAMTM-System erweitert das Klangspiel zu einer **Bug-Symphonie**, die **Gitarren- und Audioelemente** integriert:

* **Fehler** = dissonanter Ton (Moll)
* **Fix** = harmonischer Akkord (Dur)
* **Recovery** = Reprise (Septakkord)
* **Audit-Export** = Partitur (PDF oder MIDI)

---

## 🛠️ Implementierte Bausteine

### 1. `docs/bug-symphony.html`

**Vollständige Web-Audio-Implementierung:**
- HTML + WebAudio API
- Gitarren- und Synth-Sounds (SoundFonts oder Samples)
- Live-Spektrum-Visualisierung (Canvas)
- User kann Bugs anklicken → hört Töne
- Interaktive Gitarren-Fretboard-Animation
- Real-time Metriken und Harmonie-Score
- Export-Funktionen (Audio, MIDI, Partitur)

**Features:**
- 🎸 **Gitarren-Sounds**: Bug (Moll), Fix (Dur), Recovery (Sept)
- 🎹 **Synthesizer**: Sine, Sawtooth, Square, Triangle Waves
- 🎼 **Komposition**: Bug-Symphonie, Zufalls-Melodie, Live-Modus
- 📊 **Metriken**: Bug-Count, Fix-Count, Recovery-Count, Harmonie-Score
- 🎵 **Visualisierung**: Live-Spektrum, Gitarren-Fretboard
- 💾 **Export**: WAV, MIDI, PDF, JSON

### 2. `scripts/composer-engine.ts`

**TypeScript-basierte Kompositions-Engine:**
- Mapping: Bugtyp → Tonart / Skala
- Harmonielehre-Integration
- Export als MIDI oder Audio
- Vollständige musikalische Analyse

**Harmonielehre:**
- **Dur** = Fix (harmonisch)
- **Moll** = Bug (dissonant)
- **Septakkord** = Recovery (komplex)
- **Diminished** = Error (spannungsreich)

**Tonarten-Mapping:**
- `bug` → A-Moll (dramatisch)
- `error` → E-Moll (mysteriös)
- `warning` → D-Moll (traurig)
- `fix` → C-Dur (fröhlich)
- `recovery` → G-Dur (hoffnungsvoll)

### 3. `docs/bug-symphony-integration.html`

**Integration-Dashboard:**
- Status-Übersicht aller Komponenten
- Live-Demo mit interaktiven Controls
- Harmonie-Score-Visualisierung
- Technische Details und API-Integration
- Export-Funktionen

---

## 🎸 Musikalische Features

### Gitarren-Akkorde
- **Bug (Moll)**: A-Moll (A-C-E) - dissonant
- **Fix (Dur)**: C-Dur (C-E-G) - harmonisch
- **Recovery (Sept)**: G7 (G-B-D-F) - Septakkord

### Synthesizer-Wellen
- **Sine Wave**: Sanfte, reine Töne
- **Sawtooth**: Scharfe, aggressive Klänge
- **Square**: Hohle, digitale Sounds
- **Triangle**: Weiche, warme Töne

### Kompositions-Parameter
- **Tempo**: 60-180 BPM basierend auf Harmonie-Score
- **Tonart**: Automatisch basierend auf Event-Typen
- **Komplexität**: Simple bis Very Complex
- **Dauer**: Dynamisch basierend auf Event-Anzahl

---

## 📊 Export-Formate

### MIDI-Export
- Standard MIDI-Dateien (.mid)
- Multi-Track (Chords + Melody)
- Instrument-Mapping (Piano + Guitar)
- Tempo und Time-Signature

### Audio-Export
- WAV-Dateien (44.1kHz, 32-bit Float)
- Synthetische Audio-Daten
- Vollständige Kompositionen
- High-Quality Audio

### Partitur-Export
- JSON-basierte Partituren
- Vollständige musikalische Analyse
- Metadaten (Tempo, Tonart, Komplexität)
- Harmonie-Analyse

### Audit-Score
- JSON-Export der Session-Daten
- Bug-Count, Fix-Count, Recovery-Count
- Harmonie-Score und Metriken
- Vollständige Audit-Trails

---

## 🔌 API-Integration

### OAMTM Monitoring
- Integration mit Tree-Monitoring-System
- Echtzeit-Bug-Events
- Automatische Komposition bei neuen Events
- Live-Harmonie-Score-Updates

### GitHub Actions
- Automatische Komposition bei neuen Bug-Events
- Integration mit Monitoring-Workflows
- Export bei erfolgreichen Deployments
- Audit-Trail-Integration

### Web Audio API
- Browser-basierte Audio-Synthese
- Real-time Audio-Processing
- Spektrum-Analyse und Visualisierung
- Cross-browser Kompatibilität

### TypeScript Engine
- Kompositions-Engine mit MIDI-Export
- Bug-Event-Analyse und -Mapping
- Musikalische Theorie-Integration
- Export-Funktionalität

---

## 🎵 Live-Features

### Interaktive Steuerung
- **Keyboard**: 1=Bug, 2=Fix, 3=Recovery, 4=Jam, Leertaste=Melodie
- **Mouse**: Klick auf Buttons für verschiedene Sounds
- **Touch**: Mobile-optimierte Bedienung
- **Gestures**: Swipe für Gitarren-Animation

### Real-time Visualisierung
- **Live-Spektrum**: Canvas-basierte Frequenz-Analyse
- **Gitarren-Fretboard**: Animierte Saiten-Vibration
- **Harmonie-Score**: Dynamische Anzeige der musikalischen Qualität
- **Metriken**: Live-Updates von Bug-Count, Fix-Count, etc.

### Jam-Session-Modus
- **Live-Komposition**: Echtzeit-Generierung von Musik
- **Multi-User**: Mehrere User erzeugen eine Live-Band
- **Karaoke**: Selbstheilung + Mitsingen
- **Recovery-Sounds**: Bass = Grundton, Percussion = Taktgeber

---

## 🚀 Verwendung

### 1. Bug-Symphony starten
```bash
npm run bug-symphony
```

### 2. Integration-Dashboard öffnen
```bash
npm run bug-symphony-integration
```

### 3. Composer Engine ausführen
```bash
npm run composer-engine
```

### 4. Live-Modus aktivieren
- Klicke auf "Live-Modus" im Dashboard
- Verwende Keyboard-Steuerung
- Generiere automatische Kompositionen

---

## 🎼 Erweiterungsoptionen

### Klang-Spiel-Modus
- Bugs als Gitarre spielen
- Interaktive Gitarren-Simulation
- Real-time Akkord-Generierung
- Harmonie-Feedback

### Jam-Mode
- Mehrere User erzeugen eine Live-Band
- Collaborative Komposition
- Real-time Synchronisation
- Multi-Device Support

### Karaoke
- Selbstheilung + Mitsingen
- Text-zu-Musik-Integration
- Voice-Recognition
- Harmonie-Guidance

### Recovery-Sounds
- Bass = Grundton
- Percussion = Taktgeber
- Melody = Hauptthema
- Harmony = Begleitung

---

## 📜 Fazit

Das OAMTM-System wird zu einer **musikalischen Entwicklungsumgebung**:

* **Debugging** = Komposition
* **Fixing** = Harmonie
* **Audit** = Partitur
* **User** = Musiker

### Vorteile
- **Kreative Bug-Behebung**: Bugs werden zu musikalischen Elementen
- **Harmonie-Feedback**: Sofortige Rückmeldung über Code-Qualität
- **Export-Funktionen**: MIDI, WAV, JSON für weitere Bearbeitung
- **Live-Integration**: Echtzeit-Komposition bei neuen Events
- **Interaktive Bedienung**: Keyboard, Mouse, Touch-Support

### Technische Highlights
- **Web Audio API**: Browser-basierte Audio-Synthese
- **TypeScript Engine**: Robuste Kompositions-Engine
- **MIDI-Export**: Standard-konforme MIDI-Dateien
- **Real-time Visualisierung**: Canvas-basierte Spektrum-Analyse
- **OAMTM Integration**: Nahtlose Verbindung mit Monitoring-System

---

## 🔗 Links

- **Bug-Symphony**: `docs/bug-symphony.html`
- **Integration**: `docs/bug-symphony-integration.html`
- **Composer Engine**: `scripts/composer-engine.ts`
- **Package Scripts**: `package.json`

---

👉 **Nächster Schritt**: Erweiterte MIDI-Export-Funktionalität und PDF-Partitur-Generierung implementieren.
