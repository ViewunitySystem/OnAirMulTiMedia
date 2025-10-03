#!/bin/bash
# TEL Portal System - Universal Console Monitor (UCM) Startup Script
# Bash Version für Linux/macOS

echo "🖥️ TEL Portal System - Universal Console Monitor (UCM)"
echo "================================================="

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden! Bitte installieren Sie Node.js"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js gefunden: $NODE_VERSION"

# Prüfe ob UCM Config existiert
CONFIG_PATH="scripts/ucm-config.json"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ UCM Config nicht gefunden: $CONFIG_PATH"
    exit 1
fi

# Erstelle Audit-Verzeichnis
AUDIT_DIR="audit/console"
mkdir -p "$AUDIT_DIR"
echo "✅ Audit-Verzeichnis erstellt: $AUDIT_DIR"

# Starte UCM Collector
echo "🚀 Starte UCM Collector..."
echo "📊 Endpoints:"
echo "   - Local: http://localhost:3737/log"
echo "   - OnAirMulTiMedia: http://localhost:3737/OnAirMulTiMedia/log"
echo "   - Health: http://localhost:3737/health"
echo "   - Viewer: ./OnAirMulTiMedia/console-viewer.html"
echo ""
echo "💡 Tipp: Öffnen Sie console-viewer.html in Ihrem Browser für Live-Monitoring"
echo "🛑 Drücken Sie Ctrl+C zum Beenden"
echo ""

# Starte UCM mit Node.js
node scripts/ucm-run.mjs
