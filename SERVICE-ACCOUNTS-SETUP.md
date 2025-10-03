# 🔐 Google Service Accounts Setup für OAMTM Auto-Deploy

## Übersicht

Dieses Dokument beschreibt die Einrichtung von Google Service Accounts für das automatische Deployment von OnAirMulTiMedia zu GitHub Pages und Firebase Backup-Servern.

## 🎯 Ziele

- **GitHub Pages**: `https://viewunitysystem.github.io/OnAirMulTiMedia/`
- **Firebase Production**: `https://tel1nl.web.app/` (Projekt: `tel1nl`)
- **Firebase Backup**: `https://back-ee052.web.app/` (Projekt: `back-ee052`)

## 📋 Schritt-für-Schritt Anleitung

### 1. Service Account für tel1nl Projekt erstellen

#### 1.1 Firebase Console öffnen
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Wähle das Projekt **`tel1nl`**
3. Klicke auf das **Zahnrad-Symbol** → **Project settings**

#### 1.2 Service Account erstellen
1. Gehe zum Tab **Service accounts**
2. Klicke auf **Generate new private key**
3. Bestätige mit **Generate key**
4. **WICHTIG**: Lade die JSON-Datei sofort herunter (wird nur einmal angezeigt!)

#### 1.3 JSON-Datei sichern
- Speichere die Datei als `tel1nl-service-account.json`
- **Niemals** in Git committen!
- Datei enthält sensible Zugangsdaten

### 2. Service Account für back-ee052 Projekt erstellen

#### 2.1 Firebase Console öffnen
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Wähle das Projekt **`back-ee052`**
3. Klicke auf das **Zahnrad-Symbol** → **Project settings**

#### 2.2 Service Account erstellen
1. Gehe zum Tab **Service accounts**
2. Klicke auf **Generate new private key**
3. Bestätige mit **Generate key**
4. **WICHTIG**: Lade die JSON-Datei sofort herunter (wird nur einmal angezeigt!)

#### 2.3 JSON-Datei sichern
- Speichere die Datei als `back-ee052-service-account.json`
- **Niemals** in Git committen!
- Datei enthält sensible Zugangsdaten

### 3. GitHub Secrets konfigurieren

#### 3.1 GitHub Repository öffnen
1. Gehe zu [github.com/ViewunitySystem/OnAirMulTiMedia](https://github.com/ViewunitySystem/OnAirMulTiMedia)
2. Klicke auf **Settings** → **Secrets and variables** → **Actions**

#### 3.2 Secret FIREBASE_SA_TEL1NL erstellen
1. Klicke auf **New repository secret**
2. **Name**: `FIREBASE_SA_TEL1NL`
3. **Secret**: Kopiere den **kompletten Inhalt** der `tel1nl-service-account.json`
4. Klicke auf **Add secret**

#### 3.3 Secret FIREBASE_SA_BACK erstellen
1. Klicke auf **New repository secret**
2. **Name**: `FIREBASE_SA_BACK`
3. **Secret**: Kopiere den **kompletten Inhalt** der `back-ee052-service-account.json`
4. Klicke auf **Add secret**

## 🔒 Sicherheitshinweise

### ✅ Erlaubt
- Service Account JSON als GitHub Secret speichern
- Automatische Deployments über GitHub Actions
- Zugriff auf Firebase Hosting

### ❌ Verboten
- Service Account JSON in Git committen
- JSON-Dateien in öffentlichen Repositories
- Weitergabe der JSON-Dateien

## 🚀 Test der Konfiguration

### 1. GitHub Actions testen
1. Mache einen Commit auf den Branch `gh-pages`
2. Gehe zu **Actions** Tab im GitHub Repository
3. Überwache den Workflow `Auto-Deploy (Pages + Firebase Multi-Project)`

### 2. URLs prüfen
Nach erfolgreichem Deployment sollten alle URLs erreichbar sein:
- ✅ `https://viewunitysystem.github.io/OnAirMulTiMedia/`
- ✅ `https://tel1nl.web.app/`
- ✅ `https://back-ee052.web.app/`

## 🛠️ Troubleshooting

### Problem: "Permission denied"
**Lösung**: Service Account hat nicht genügend Berechtigungen
1. Gehe zu [console.cloud.google.com](https://console.cloud.google.com)
2. Wähle das entsprechende Projekt
3. Gehe zu **IAM & Admin** → **IAM**
4. Finde den Service Account
5. Füge die Rolle **Firebase Hosting Admin** hinzu

### Problem: "Invalid credentials"
**Lösung**: JSON-Datei ist beschädigt oder unvollständig
1. Erstelle einen neuen Service Account
2. Lade die JSON-Datei erneut herunter
3. Aktualisiere das GitHub Secret

### Problem: "Project not found"
**Lösung**: Falsche Projekt-ID in der JSON-Datei
1. Überprüfe die Projekt-ID in der JSON-Datei
2. Stelle sicher, dass das Projekt existiert
3. Überprüfe die `.firebaserc` Konfiguration

## 📊 Überwachung

### GitHub Actions Logs
- Gehe zu **Actions** → **Auto-Deploy (Pages + Firebase Multi-Project)**
- Klicke auf den neuesten Workflow
- Überprüfe die Logs für jeden Schritt

### Firebase Console
- Überwache die Deployments in der Firebase Console
- Prüfe die Hosting-Statistiken
- Überwache die Nutzung

## 🔄 Automatische Updates

Das System funktioniert automatisch bei:
- **Push** auf Branch `gh-pages`
- **Push** auf Branch `mainzero`
- **Manueller Trigger** über GitHub Actions

## 📞 Support

Bei Problemen:
1. Überprüfe die GitHub Actions Logs
2. Teste die URLs manuell
3. Überprüfe die Firebase Console
4. Kontaktiere den Maintainer: **Raymond Demitrio Dr. Tel**

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**
*"Automatisierte Deployment-Pipeline für maximale Verfügbarkeit"*

