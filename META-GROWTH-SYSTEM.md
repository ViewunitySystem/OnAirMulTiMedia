# 🚀 OAMTM Meta-Wachstumssystem

## Übersicht

Das OAMTM Meta-Wachstumssystem implementiert **selbstverstärkendes Wachstum** durch automatische Modulvermehrung, transparente Change-Logs und intelligente Health-Gates.

## 🎯 Komponenten

### 1. Meta-Wachstumsmodus (`config/meta.json`)
- **Aktivierung**: `enabled: true`
- **Blueprint-System**: Automatische Modulerzeugung aus Templates
- **Safety-Modus**: Dry-Run standardmäßig aktiv
- **Review-Prozess**: Pflicht-Reviewer für Änderungen

### 2. Change-Log (`docs/change-log.html`)
- **Live-Aggregation**: Aus `audit/fixes.jsonl`, `status/targets.json`, `audit/redirect-map.json`
- **GitHub Pages kompatibel**: Automatische Anpassung der Pfade
- **Real-time Updates**: Keine Cache, immer aktuelle Daten

### 3. Evolve-Engine (`scripts/evolve-engine.ts`)
- **Event-getrieben**: Idempotent, ohne Endlosschleifen
- **Blueprint-basiert**: Erstellt Module aus Templates
- **Audit-Trail**: Vollständige Protokollierung aller Aktionen
- **Health-Gates**: Evolve nur bei ≥95% Success-Rate

### 4. Health-Gates (`scripts/health-gates.ts`)
- **Success Rate**: ≥95% erforderlich
- **Response Time**: ≤500ms Durchschnitt
- **Uptime**: ≥99% Verfügbarkeit
- **Automatische Prüfung**: Vor jedem Evolve-Prozess

### 5. Auto-PR (`scripts/auto-pr.ts`)
- **Automatische PR-Erstellung**: Bei erfolgreichem Evolve
- **Strukturierte Commits**: Detaillierte Beschreibung der Änderungen
- **Health-Status**: Integration in PR-Beschreibung
- **Git-Integration**: Branch-Erstellung und Push

## 🔧 Verwendung

### Scripts
```bash
# Meta-Wachstum aktivieren
npm run evolve

# Change-Log generieren
npm run changelog

# Health-Gates prüfen
npm run health-gates

# Auto-PR testen
npm run auto-pr
```

### Konfiguration
```json
{
  "metaGrowth": {
    "enabled": true,
    "safety": {
      "dryRun": true,        // Erst testen, dann produktiv
      "requireTests": true,  // Tests erforderlich
      "requireDocs": true,   // Dokumentation erforderlich
      "branch": "mainzero",  // Ziel-Branch
      "reviewers": ["DD5BE"] // Pflicht-Reviewer
    }
  }
}
```

## 🛡️ Sicherheitsmechanismen

### Dry-Run Modus
- **Standard**: `dryRun: true`
- **Schutz**: Verhindert unkontrollierte Modulvermehrung
- **Test**: Vollständige Simulation ohne Änderungen

### Health-Gates
- **Success Rate**: ≥95% System-Gesundheit erforderlich
- **Response Time**: ≤500ms Durchschnittsantwortzeit
- **Uptime**: ≥99% Verfügbarkeit
- **Blockade**: Evolve wird bei Fehlschlag gestoppt

### Review-Prozess
- **Pflicht-Reviewer**: DD5BE für alle Änderungen
- **Branch-Protection**: `mainzero` Branch geschützt
- **Auto-PR**: Automatische PR-Erstellung für Review

## 📊 Monitoring

### Audit-Trail
- **Datei**: `audit/fixes.jsonl`
- **Format**: JSON Lines (eine Zeile pro Event)
- **Inhalt**: Alle Evolve-Aktionen, Health-Checks, PR-Erstellungen

### Health-Status
- **Datei**: `status/targets.json`
- **Metriken**: Success Rate, Response Time, Uptime
- **Aktualisierung**: Kontinuierlich durch Health-Checks

### Change-Log
- **URL**: `docs/change-log.html`
- **Aggregation**: Alle Audit-Events, Health-Snapshots, Redirect-Regeln
- **Live-View**: Real-time Updates ohne Cache

## 🔄 CI/CD Integration

### Nightly Workflow (`.github/workflows/meta-growth.yml`)
- **Schedule**: Täglich 02:15 CET
- **Ablauf**: Health-Gates → Evolve → Change-Log → Auto-PR
- **Manueller Trigger**: `workflow_dispatch` verfügbar

### Deployment-Pipeline
- **GitHub Pages**: Automatisches Deployment
- **Firebase**: Multi-Project Deployment
- **Health-Checks**: Post-Deployment Validierung

## 🎛️ Governance

### Safety-First
- **Dry-Run Default**: Verhindert unkontrollierte Änderungen
- **Health-Gates**: Blockiert Evolve bei Systemproblemen
- **Review-Prozess**: Menschliche Kontrolle für alle Änderungen

### Transparenz
- **Audit-Trail**: Vollständige Protokollierung
- **Change-Log**: Live-View aller Änderungen
- **Health-Status**: Kontinuierliche Überwachung

### Kontrolle
- **Konfiguration**: `config/meta.json` für alle Einstellungen
- **Blueprint-System**: Kontrollierte Modulerzeugung
- **Branch-Protection**: Geschützte Ziel-Branches

## 🚀 Nächste Schritte

### 1. Dry-Run Test
```bash
npm run evolve  # Testet das System ohne Änderungen
```

### 2. Health-Gates prüfen
```bash
npm run health-gates  # Überprüft System-Gesundheit
```

### 3. Produktiv schalten
```json
{
  "safety": {
    "dryRun": false  // Nur nach erfolgreichem Test
  }
}
```

### 4. Monitoring aktivieren
- Change-Log überwachen: `docs/change-log.html`
- Health-Status prüfen: `status/targets.json`
- Audit-Trail analysieren: `audit/fixes.jsonl`

## 📞 Support

Bei Problemen:
1. **Health-Gates prüfen**: `npm run health-gates`
2. **Audit-Trail analysieren**: `audit/fixes.jsonl`
3. **Change-Log überprüfen**: `docs/change-log.html`
4. **Maintainer kontaktieren**: **Raymond Demitrio Dr. Tel**

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**  
*"Meta-Wachstum für selbstverstärkende Systeme"*
