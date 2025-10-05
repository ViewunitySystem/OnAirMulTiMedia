#!/bin/bash
# auto-doc-update.sh - Automatische Dokumentations-Updates
# Läuft alle 5 Minuten

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S MEZ')
DOC_FILE="GIT-EMERGENCY-RECOVERY-$(date '+%Y-%m-%d').md"

echo "🔄 AUTOMATISCHES UPDATE: $TIMESTAMP"

# Git Status erfassen
GIT_STATUS=$(git status --porcelain | wc -l)
GIT_BRANCH=$(git branch --show-current)
GIT_COMMIT=$(git log --oneline -1)
GIT_REMOTE=$(git remote -v | head -1)

# Dokumentation aktualisieren
cat > "$DOC_FILE" << EOF
# 🚨 GIT-EMERGENCY-RECOVERY - AUTOMATISCH AKTUALISIERT

**Letztes Update:** $TIMESTAMP  
**Status:** AKTIV - Live-Monitoring  
**Repository:** https://github.com/ViewunitySystem/OnAirMulTiMedia.git  

---

## 📊 **AKTUELLER GIT-STATUS**

**Branch:** $GIT_BRANCH  
**Letzter Commit:** $GIT_COMMIT  
**Geänderte Dateien:** $GIT_STATUS  
**Remote:** $GIT_REMOTE  

---

## 🚨 **EMERGENCY COMMANDS**

\`\`\`bash
# Sofortige Wiederherstellung
git reset --hard HEAD
git clean -fd

# Status prüfen
git status
git log --oneline -5

# Backup erstellen
git branch emergency-backup-\$(date +%Y%m%d-%H%M%S)
\`\`\`

---

## 🔄 **AUTOMATISCHE UPDATES**

**Update-Frequenz:** Alle 5 Minuten  
**Monitoring:** Aktiv  
**Backup:** Automatisch  

---

**⚠️ WICHTIG:** Diese Datei wird automatisch aktualisiert!  
**🔄 NÄCHSTES UPDATE:** $(date -d '+5 minutes' '+%Y-%m-%d %H:%M:%S MEZ')
EOF

echo "✅ Dokumentation aktualisiert: $DOC_FILE"
