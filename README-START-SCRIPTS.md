# 🚀 OnAirMulTiMedia - Start-Skripte für alle Betriebssysteme

## 📋 Übersicht

Diese Start-Skripte ermöglichen den kompletten Start der OnAirMulTiMedia-Entwicklungsumgebung mit einem einzigen Befehl.

## 🖥️ Verfügbare Start-Skripte

### Windows
- **`start-oamtm.bat`** - Batch-Datei für Windows (Doppelklick oder CMD)
- **`start-oamtm.ps1`** - PowerShell-Skript für erweiterte Kontrolle

### Linux/macOS
- **`start-oamtm.sh`** - Bash-Skript für Unix-Systeme

## 🎯 Was die Skripte machen

1. **Node.js Version prüfen** (>= v18)
2. **Paketmanager ermitteln** (npm/pnpm/yarn)
3. **Abhängigkeiten installieren** (npm ci/pnpm install/yarn install)
4. **TypeScript/ts-node vorbereiten** (für Self-Healing)
5. **Self-Healing ausführen** (falls `scripts/selfheal.ts` vorhanden)
6. **Rust-Backend starten** (falls `Cargo.toml` vorhanden)
7. **Firebase Emulator starten** (falls `firebase.json` vorhanden)
8. **WebUI Dev-Server starten** (Vite auf Port 5173)
9. **Browser öffnen** (http://localhost:5173)

## 🚀 Verwendung

### Windows (Batch)
```cmd
# Doppelklick auf start-oamtm.bat
# ODER
start-oamtm.bat
```

### Windows (PowerShell)
```powershell
# Mit Standard-Parametern
.\start-oamtm.ps1

# Mit benutzerdefinierten Parametern
.\start-oamtm.ps1 -Port 3000 -FirebaseTarget emulator -WebuiDir frontend
```

### Linux/macOS
```bash
# Ausführbar machen (einmalig)
chmod +x start-oamtm.sh

# Ausführen
./start-oamtm.sh
```

## ⚙️ Konfiguration

### Umgebungsvariablen (.env.local)
Erstellen Sie eine `.env.local` Datei im Repo-Root:

```env
PORT=3000
FIREBASE_TARGET=emulator
WEBUI_DIR=frontend
```

### PowerShell-Parameter
- `-Port`: Port für den Dev-Server (Standard: 5173)
- `-FirebaseTarget`: Firebase-Target (Standard: dev)
- `-WebuiDir`: WebUI-Verzeichnis (Standard: webui)

## 🔧 Anpassungen

### WebUI-Verzeichnis ändern
Wenn Ihr Frontend in einem anderen Verzeichnis liegt:

**Windows (Batch):**
```bat
set WEBUI_DIR=frontend
```

**Linux/macOS:**
```bash
WEBUI_DIR=frontend
```

**PowerShell:**
```powershell
.\start-oamtm.ps1 -WebuiDir frontend
```

### Firebase Emulator aktivieren
**Windows (Batch):**
```bat
set FIREBASE_TARGET=emulator
```

**Linux/macOS:**
```bash
FIREBASE_TARGET=emulator
```

**PowerShell:**
```powershell
.\start-oamtm.ps1 -FirebaseTarget emulator
```

## 🐛 Fehlerbehebung

### Node.js nicht gefunden
- Installieren Sie Node.js >= v18 von [nodejs.org](https://nodejs.org)

### Paketmanager nicht gefunden
- Installieren Sie npm (mit Node.js), pnpm oder yarn

### Port bereits belegt
- Ändern Sie den Port in der Konfiguration
- Oder beenden Sie den Prozess, der den Port verwendet

### Firebase-Fehler
- Stellen Sie sicher, dass Firebase CLI installiert ist: `npm i -g firebase-tools`
- Führen Sie `firebase login` aus

## 📁 Projektstruktur

```
OnAirMulTiMedia/
├── start-oamtm.bat          # Windows Batch
├── start-oamtm.ps1          # Windows PowerShell
├── start-oamtm.sh           # Linux/macOS Bash
├── package.json             # Node.js Abhängigkeiten
├── firebase.json            # Firebase Konfiguration
├── Cargo.toml               # Rust Backend (optional)
├── scripts/
│   └── selfheal.ts          # Self-Healing Script (optional)
├── webui/                   # WebUI Verzeichnis (optional)
│   └── package.json
└── .env.local               # Lokale Konfiguration (optional)
```

## 🎉 Nach dem Start

Nach erfolgreichem Start sollten Sie sehen:

- **WebUI**: http://localhost:5173 (oder konfigurierter Port)
- **Rust-Backend**: Läuft im Hintergrund (falls vorhanden)
- **Firebase Emulator**: Läuft im Hintergrund (falls aktiviert)

## 🔄 Entwicklungsworkflow

1. **Start**: Skript ausführen
2. **Entwicklung**: Code in Ihrem Editor bearbeiten
3. **Hot-Reload**: Änderungen werden automatisch übernommen
4. **Beenden**: Ctrl+C (Linux/macOS) oder Fenster schließen (Windows)

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Fehlermeldungen in der Konsole
2. Stellen Sie sicher, dass alle Abhängigkeiten installiert sind
3. Überprüfen Sie die Node.js-Version (>= v18)
4. Kontaktieren Sie das Entwicklungsteam

---

**🎯 Ziel**: Ein-Klick-Start der kompletten OnAirMulTiMedia-Entwicklungsumgebung für alle Betriebssysteme.
