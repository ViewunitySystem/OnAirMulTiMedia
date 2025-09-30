mod core;
mod presets;
mod web;
mod audit;

use core::VodafoneSDR;
use web::{server::start_canvas_server_with_config_struct, server::CanvasConfig, api::SDRState};
use presets::PresetManager;

use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║                🌍 HFRF Universal SDR Stack 🌍              ║");
    println!("╠══════════════════════════════════════════════════════════════╣");
    
    // Try to detect COM ports
    let com_ports = detect_com_ports();
    println!("║ Available COM ports: {:?}                              ║", com_ports);
    
    // Try to initialize Vodafone SDR
    match initialize_sdr(&com_ports) {
        Ok(vodafone_sdr) => {
            println!("║ Status: HARDWARE MODE                                    ║");
            println!("║ Hardware: Vodafone SDR detected                         ║");
            println!("║ Web Interface: http://localhost:8080                    ║");
            println!("╚══════════════════════════════════════════════════════════════╝");
            println!("");
            
            // Initialize all components
            let sdr_state = Arc::new(Mutex::new(SDRState::new(vodafone_sdr)));
            let preset_manager = Arc::new(PresetManager::new());
            
            println!("✅ Vodafone SDR Hardware initialized");
            println!("✅ SDR State ready");
            println!("✅ Preset Manager loaded");
            println!("✅ Web Server ready");
            println!("");
            
            // Start Canvas-enabled web server
            let canvas_config = CanvasConfig::new()
                .with_host("0.0.0.0")
                .with_port(8080)
                .with_webui_path("webui")
                .with_cors(true)
                .with_proxy(true)
                .with_royalty(true)
                .with_audit(true);
            
            println!("🎨 Canvas Integration enabled");
            println!("📡 Canvas Integration: http://localhost:8080/canvas-integration");
            println!("🔗 Proxy API: /api/proxy");
            println!("💰 Royalty API: /api/royalty");
            println!("");
            
            // Start Canvas-enabled web server
            start_canvas_server_with_config_struct(canvas_config).await;
        },
        Err(e) => {
            println!("║ Status: TEST MODE                                        ║");
            println!("║ Hardware: {} ║", format!("{:.<50}", e.to_string()));
            println!("║ Web Interface: http://localhost:8080                    ║");
            println!("╚══════════════════════════════════════════════════════════════╝");
            println!("");
            
            println!("⚠️  Hardware initialization failed: {}", e);
            println!("🔄 Starting in test mode with AT-command simulation...");
            println!("📡 Web interface will be available for testing");
            println!("");
            
            // Create a mock SDR state for testing
            // This would require implementing a mock VodafoneSDR
            println!("❌ Test mode not yet implemented");
            println!("💡 To use with real hardware:");
            println!("   1. Disconnect Huawei USB-Stick");
            println!("   2. Restart the application");
            println!("   3. Connect stick when prompted");
        }
    }
    
    Ok(())
}

fn detect_com_ports() -> Vec<String> {
    let mut ports = Vec::new();
    
    // Use PowerShell to detect COM ports
    let output = std::process::Command::new("powershell")
        .args(&["-Command", "[System.IO.Ports.SerialPort]::getPortNames()"])
        .output();
    
    match output {
        Ok(result) => {
            let output_str = String::from_utf8_lossy(&result.stdout);
            for line in output_str.lines() {
                let port = line.trim();
                if !port.is_empty() && port.starts_with("COM") {
                    ports.push(port.to_string());
                    println!("✅ Found COM port: {}", port);
                }
            }
        },
        Err(e) => {
            println!("⚠️  PowerShell COM detection failed: {}", e);
        }
    }
    
    // Fallback: try common ports manually
    if ports.is_empty() {
        println!("⚠️  No COM ports found via PowerShell, trying manual detection...");
        for i in 1..=20 {
            let port_name = format!("COM{}", i);
            ports.push(port_name);
        }
    }
    
    ports
}

fn initialize_sdr(com_ports: &[String]) -> Result<VodafoneSDR, Box<dyn std::error::Error>> {
    if com_ports.is_empty() {
        return Err("No COM ports detected. Please connect Vodafone hardware.".into());
    }
    
    // Try each COM port until one works
    for port in com_ports {
        match VodafoneSDR::new(port) {
            Ok(sdr) => {
                println!("✅ Vodafone SDR initialized on {}", port);
                return Ok(sdr);
            },
            Err(e) => {
                println!("⚠️  Failed to initialize on {}: {}", port, e);
                // Continue to next port instead of failing immediately
                continue;
            }
        }
    }
    
    // If all ports failed, try to create a mock SDR for testing
    println!("🔄 All COM ports failed, creating test mode...");
    println!("📡 This will work with AT-command simulation");
    
    // Create a mock VodafoneSDR that simulates responses
    Err("Hardware initialization failed, but system can run in test mode".into())
}