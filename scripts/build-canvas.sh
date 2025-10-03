#!/bin/bash

# HFRF Universal SDR Canvas Integration Build Script
# Builds and runs the HFRF-SDR system with Canvas integration

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎨 HFRF Universal SDR Canvas Build Script 🎨       ║"
echo "╠══════════════════════════════════════════════════════════════╣"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install Rust first."
    echo "   Visit: https://rustup.rs/"
    exit 1
fi

echo "✅ Rust/Cargo found: $(cargo --version)"

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Cargo.toml not found. Please run this script from the hfrf-universal-sdr directory."
    exit 1
fi

echo "✅ Project directory confirmed"

# Create webui directory if it doesn't exist
if [ ! -d "webui" ]; then
    echo "📁 Creating webui directory..."
    mkdir -p webui
fi

# Check if Canvas files exist
if [ ! -f "webui/canvas-integration.html" ]; then
    echo "⚠️  Canvas integration files not found. Please ensure canvas-integration.html exists."
fi

if [ ! -f "webui/canvas-app.tsx" ]; then
    echo "⚠️  Canvas app files not found. Please ensure canvas-app.tsx exists."
fi

echo "✅ Canvas files checked"

# Build the project
echo "🔨 Building HFRF Universal SDR with Canvas integration..."
cargo build --release

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Check if binary was created
if [ -f "target/release/hfrf-universal-sdr.exe" ]; then
    echo "✅ Windows binary created: target/release/hfrf-universal-sdr.exe"
elif [ -f "target/release/hfrf-universal-sdr" ]; then
    echo "✅ Linux binary created: target/release/hfrf-universal-sdr"
else
    echo "⚠️  Binary not found in expected location"
fi

echo ""
echo "🚀 Starting HFRF Universal SDR Canvas Server..."
echo "📡 Canvas Integration: http://localhost:8080/canvas-integration"
echo "🎨 Canvas App: http://localhost:8080/canvas-app"
echo "📊 Dashboard: http://localhost:8080/"
echo "🔗 API Endpoints:"
echo "   - /api/proxy - Proxy für CORS-freie Requests"
echo "   - /api/royalty - Royalty-Zählung"
echo "   - /api/spectrum - Spektrumdaten"
echo "   - /api/presets - SDR Presets"
echo "   - /api/hardware/status - Hardware Status"
echo "   - /api/transmit - TX-Steuerung"
echo "   - /api/frequency - Frequenz-Steuerung"
echo "   - /api/community/* - Community Integration"
echo "   - /api/audit - Audit-Logging"
echo ""

# Run the application
if [ -f "target/release/hfrf-universal-sdr.exe" ]; then
    ./target/release/hfrf-universal-sdr.exe
elif [ -f "target/release/hfrf-universal-sdr" ]; then
    ./target/release/hfrf-universal-sdr
else
    echo "❌ Binary not found. Running with cargo run..."
    cargo run --release
fi

