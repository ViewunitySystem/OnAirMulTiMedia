#!/bin/bash
echo "Building HFRF Universal SDR Stack..."

# Clean previous build
cargo clean

# Build in release mode
cargo build --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Starting HFRF Universal SDR..."
    cargo run --release
else
    echo "❌ Build failed!"
    exit 1
fi


