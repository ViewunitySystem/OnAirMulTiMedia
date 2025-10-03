# 🔐 GitHub Secrets Configuration Guide

## 🎯 Ziel
Konfiguration der GitHub Secrets für automatisches Firebase-Deployment

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: Firebase Service Accounts erstellen

#### 1.1 tel1nl Projekt (Production)
1. Öffne [Firebase Console](https://console.firebase.google.com)
2. Wähle Projekt **`tel1nl`**
3. Zahnrad-Symbol → **Project settings**
4. Tab **Service accounts**
5. **Generate new private key** → **Generate key**
6. **WICHTIG**: JSON-Datei sofort herunterladen (nur einmal verfügbar!)
7. Speichere als `tel1nl-service-account.json`

#### 1.2 back-ee052 Projekt (Backup)
1. Öffne [Firebase Console](https://console.firebase.google.com)
2. Wähle Projekt **`back-ee052`**
3. Zahnrad-Symbol → **Project settings**
4. Tab **Service accounts**
5. **Generate new private key** → **Generate key**
6. **WICHTIG**: JSON-Datei sofort herunterladen (nur einmal verfügbar!)
7. Speichere als `back-ee052-service-account.json`

### Schritt 2: GitHub Secrets konfigurieren

#### 2.1 GitHub Repository öffnen
1. Gehe zu [GitHub Repository](https://github.com/ViewunitySystem/OnAirMulTiMedia)
2. **Settings** → **Secrets and variables** → **Actions**

#### 2.2 Secret FIREBASE_SA_TEL1NL erstellen
1. **New repository secret**
2. **Name**: `FIREBASE_SA_TEL1NL`
3. **Secret**: Kompletter Inhalt der `tel1nl-service-account.json`
4. **Add secret**

#### 2.3 Secret FIREBASE_SA_BACK erstellen
1. **New repository secret**
2. **Name**: `FIREBASE_SA_BACK`
3. **Secret**: Kompletter Inhalt der `back-ee052-service-account.json`
4. **Add secret**

### Schritt 3: Service Account Berechtigungen prüfen

#### 3.1 Google Cloud Console
1. Öffne [Google Cloud Console](https://console.cloud.google.com)
2. Wähle Projekt **`tel1nl`**
3. **IAM & Admin** → **IAM**
4. Finde den Service Account
5. Rolle **Firebase Hosting Admin** hinzufügen

#### 3.2 Backup Projekt
1. Wähle Projekt **`back-ee052`**
2. **IAM & Admin** → **IAM**
3. Finde den Service Account
4. Rolle **Firebase Hosting Admin** hinzufügen

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

### 1. Workflow testen
1. Commit auf Branch `gh-pages` oder `mainzero`
2. GitHub → **Actions** Tab
3. Überwache Workflow `Auto-Deploy (Pages + Firebase Multi-Project)`

### 2. URLs prüfen
Nach erfolgreichem Deployment:
- ✅ `https://viewunitysystem.github.io/OnAirMulTiMedia/`
- ✅ `https://tel1nl.web.app/`
- ✅ `https://back-ee052.web.app/`

## 🛠️ Troubleshooting

### Problem: "Permission denied"
**Lösung**: Service Account Berechtigungen prüfen
1. Google Cloud Console → IAM & Admin → IAM
2. Service Account finden
3. Rolle **Firebase Hosting Admin** hinzufügen

### Problem: "Invalid credentials"
**Lösung**: JSON-Datei neu erstellen
1. Neuen Service Account erstellen
2. JSON-Datei erneut herunterladen
3. GitHub Secret aktualisieren

### Problem: "Project not found"
**Lösung**: Projekt-ID prüfen
1. JSON-Datei öffnen
2. Projekt-ID überprüfen
3. Firebase Console prüfen

## 📊 Überwachung

### GitHub Actions
- **Actions** → `Auto-Deploy (Pages + Firebase Multi-Project)`
- Logs für jeden Schritt überprüfen
- Fehler analysieren

### Firebase Console
- Deployments überwachen
- Hosting-Statistiken prüfen
- Nutzung überwachen

## 🔄 Automatische Triggers

Das System wird automatisch ausgelöst bei:
- **Push** auf Branch `gh-pages`
- **Push** auf Branch `mainzero`
- **Manueller Trigger** über GitHub Actions

## 📞 Support

Bei Problemen:
1. GitHub Actions Logs prüfen
2. URLs manuell testen
3. Firebase Console überprüfen
4. Maintainer kontaktieren: **Raymond Demitrio Dr. Tel**

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**  
*"Sichere Konfiguration für automatische Deployments"*
