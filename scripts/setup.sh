#!/bin/bash
echo "Setting up HFRF Universal SDR Stack..."

# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake libsoapysdr-dev

# Build Rust project
cargo build --release

# Create preset directory
mkdir -p presets

echo "Setup complete! Run with: cargo run --release"


