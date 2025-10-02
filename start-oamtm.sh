#!/bin/bash

# =============================================
#  OnAirMulTiMedia – Startbatch (Linux/macOS)
#  Datei: start-oamtm.sh
#  Ort : Repo-Root (OnAirMulTiMedia/)
#  Zweck: Komplett-Start der Hauptanwendung (Dev)
# =============================================

set -e

# ---- Basiseinstellungen ---------------------
NODE_MIN_VER=18
WEBUI_DIR=webui
DOCS_DIR=docs
PORT=5173
FIREBASE_TARGET=dev

# ---- Überschreiben per .env.local (optional) ----
if [ -f .env.local ]; then
    source .env.local
fi

# ---- Standort prüfen ------------------------
if [ ! -f package.json ]; then
    echo "[FEHLER] Bitte im Repo-Root ausführen (package.json fehlt)."
    exit 1
fi

# ---- Node.js prüfen ------------------------
if ! command -v node &> /dev/null; then
    echo "[FEHLER] Node.js nicht gefunden. Bitte Node >= $NODE_MIN_VER installieren."
    exit 1
fi

NODE_VER=$(node -v | sed 's/v//')
NODE_MAJ=$(echo $NODE_VER | cut -d. -f1)

if [ "$NODE_MAJ" -lt "$NODE_MIN_VER" ]; then
    echo "[FEHLER] Node-Version zu niedrig: v$NODE_VER (>= v$NODE_MIN_VER erforderlich)"
    exit 1
fi

echo "[OK] Node.js v$NODE_VER"

# ---- Paketmanager ermitteln -----------------
PM=npm
if command -v pnpm &> /dev/null; then
    PM=pnpm
elif command -v yarn &> /dev/null; then
    PM=yarn
fi

echo "[INFO] Paketmanager: $PM"

# ---- Abhängigkeiten installieren -----------
case $PM in
    "npm")
        npm ci
        ;;
    "pnpm")
        pnpm install --frozen-lockfile
        ;;
    "yarn")
        yarn install --frozen-lockfile
        ;;
esac

# ---- TypeScript/ts-node vorbereiten (Self-Heal) -----
if ! $PM exec -c "ts-node -v" &> /dev/null; then
    echo "[INFO] ts-node fehlt, wird temporär installiert..."
    case $PM in
        "npm")
            npm i -D ts-node typescript @types/node || true
            ;;
        "pnpm")
            pnpm add -D ts-node typescript @types/node || true
            ;;
        "yarn")
            yarn add -D ts-node typescript @types/node || true
            ;;
    esac
fi

# ---- Self-Healing (optional, falls vorhanden) ------
if [ -f scripts/selfheal.ts ]; then
    echo "[RUN] Self-Healing ausführen..."
    node --loader ts-node/esm scripts/selfheal.ts || echo "[WARN] Self-Healing meldete Fehler (weiter mit Start)"
else
    echo "[HINWEIS] Kein scripts/selfheal.ts gefunden – überspringe Self-Healing."
fi

# ---- Rust-Backend (optional) ----------------
if [ -f Cargo.toml ]; then
    echo "[RUN] Starte optionales Rust-Backend (Release, wenn vorhanden)..."
    if command -v cargo &> /dev/null; then
        cargo run --release &
    else
        echo "[WARN] Cargo nicht gefunden – überspringe Rust-Backend."
    fi
else
    echo "[HINWEIS] Kein Cargo.toml – überspringe Rust-Backend."
fi

# ---- Firebase Emulator/Deploy (optional) -----
if [ -f firebase.json ]; then
    if [ "$FIREBASE_TARGET" = "emulator" ]; then
        echo "[RUN] Starte Firebase Emulator Suite..."
        npx firebase emulators:start &
    else
        echo "[HINWEIS] Firebase-Konfiguration erkannt. Dev-Target: $FIREBASE_TARGET (kein Auto-Deploy im Dev-Start)"
    fi
fi

# ---- WebUI Development-Server ---------------
if [ -d "$WEBUI_DIR" ] && [ -f "$WEBUI_DIR/package.json" ]; then
    echo "[RUN] Starte WebUI Dev-Server (Vite)..."
    cd "$WEBUI_DIR"
    case $PM in
        "npm")
            npm run dev -- --port $PORT &
            ;;
        "pnpm")
            pnpm dev --port $PORT &
            ;;
        "yarn")
            yarn dev --port $PORT &
            ;;
    esac
    cd ..
else
    echo "[WARN] $WEBUI_DIR nicht gefunden – versuche Root-Start."
    if [ -f package.json ]; then
        echo "[RUN] Starte Dev-Server im Root..."
        case $PM in
            "npm")
                npm run dev -- --port $PORT &
                ;;
            "pnpm")
                pnpm dev --port $PORT &
                ;;
            "yarn")
                yarn dev --port $PORT &
                ;;
        esac
    else
        echo "[FEHLER] Kein Startskript gefunden. Bitte prüfe package.json Scripts."
        exit 1
    fi
fi

# ---- Browser öffnen ------------------------
URL="http://localhost:$PORT"
if command -v xdg-open &> /dev/null; then
    xdg-open "$URL" &
elif command -v open &> /dev/null; then
    open "$URL" &
fi

echo ""
echo "[OK] OAMTM-Entwicklungsumgebung gestartet."
echo "- WebUI : $URL"
echo "- Rust  : (Hintergrund-Prozess, falls vorhanden)"
echo "- Firebase: (Hintergrund-Prozess, falls Emulator)"

# Warten auf Benutzer-Eingabe
echo ""
echo "Drücke Ctrl+C zum Beenden aller Prozesse..."
wait
