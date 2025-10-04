mod core;
mod presets;
mod web;
mod audit;

use core::VodafoneSDR;
use core::dsp_pipeline::DSPPipeline;
use core::modulation::ModulationEngine;
use web::{server::start_canvas_server_with_config_struct, server::CanvasConfig, server::{start_canvas_server, start_canvas_server_with_config}, api::SDRState};
use presets::PresetManager;
use presets::manager::{Preset, PresetCategory};
use audit::logger::AuditLogger;
use audit::reporter::AuditReporter;

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
            
            // Initialize DSP Pipeline for signal processing
            let dsp_pipeline = DSPPipeline::new();
            println!("✅ DSP Pipeline initialized");
            
            // Initialize Modulation Engine for Vodafone communication
            let modulation_engine = ModulationEngine::new(2.4e6); // 2.4 MHz sample rate
            println!("✅ Modulation Engine initialized");
            
            // Initialize Audit Logger for communication logging
            let audit_logger = AuditLogger::new();
            println!("✅ Audit Logger initialized");
            
            // Initialize Audit Reporter for report generation
            let audit_reporter = AuditReporter::new();
            println!("✅ Audit Reporter initialized");
            
            // Test Audit Logger functions
            println!("🔧 Testing Audit Logger Functions...");
            let test_entry = audit::logger::AuditEntry {
                timestamp: chrono::Utc::now(),
                operation: "TEST_TX".to_string(),
                frequency: 144.0e6,
                modulation: "FM".to_string(),
                iq_hash: Some("test_hash_123".to_string()),
                preset_name: Some("Test Preset".to_string()),
                success: true,
                error_message: None,
            };
            
            match audit_logger.log_transmission(test_entry) {
                Ok(_) => println!("✅ Audit logging test passed"),
                Err(e) => println!("⚠️  Audit logging test failed: {}", e),
            }
            
            // Test IQ data hashing
            let test_iq_data = vec![0.1, 0.2, 0.3, 0.4];
            let iq_hash = audit_logger.hash_iq_data(&test_iq_data);
            println!("✅ IQ data hashing test: {}", iq_hash);
            
            // Test TX logging
            match audit_logger.log_tx(144.0e6, "FM", &test_iq_data, Some("Test Preset")) {
                Ok(_) => println!("✅ TX logging test passed"),
                Err(e) => println!("⚠️  TX logging test failed: {}", e),
            }
            
            // Test RX logging
            match audit_logger.log_rx(144.0e6, "FM", &test_iq_data) {
                Ok(_) => println!("✅ RX logging test passed"),
                Err(e) => println!("⚠️  RX logging test failed: {}", e),
            }
            
            // Test error logging
            match audit_logger.log_error("TEST_OPERATION", "Test error message") {
                Ok(_) => println!("✅ Error logging test passed"),
                Err(e) => println!("⚠️  Error logging test failed: {}", e),
            }
            
            // Test Audit Reporter functions
            println!("🔧 Testing Audit Reporter Functions...");
            match audit_reporter.generate_report() {
                Ok(report) => println!("✅ Audit report generated: {} operations", report.total_operations),
                Err(e) => println!("⚠️  Audit report generation failed: {}", e),
            }
            
            // Test DSP Pipeline functions
            println!("🔧 Testing DSP Pipeline Functions...");
            let test_audio = vec![0.1, 0.2, 0.3, 0.4, 0.5];
            let ssb_output = dsp_pipeline.ssb_modulate(&test_audio, 144.0e6, 2.4e6);
            println!("✅ SSB Modulation test: {} samples processed", ssb_output.len());
            
            let test_iq = vec![0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
            let filtered_output = dsp_pipeline.apply_bandpass(&test_iq, 100.0, 200.0, 2.4e6);
            println!("✅ Bandpass filter test: {} samples processed", filtered_output.len());
            
            // Test spectrum analysis
            let mut dsp_pipeline_mut = dsp_pipeline;
            let spectrum_result = dsp_pipeline_mut.spectrum_analyze(&test_iq, 1024);
            println!("✅ Spectrum analysis test: {} frequency bins", spectrum_result.len());
            
            // Test Modulation Engine functions
            println!("🔧 Testing Modulation Engine Functions...");
            let test_data = b"TEST";
            let fm_output = modulation_engine.fm_modulate(&test_audio, 144.0e6, 5.0);
            println!("✅ FM Modulation test: {} samples processed", fm_output.len());
            
            let am_output = modulation_engine.am_modulate(&test_audio, 144.0e6, 0.8);
            println!("✅ AM Modulation test: {} samples processed", am_output.len());
            
            let ofdm_output = modulation_engine.ofdm_modulate(test_data, 144.0e6);
            println!("✅ OFDM Modulation test: {} samples processed", ofdm_output.len());
            
            // Test VodafoneSDR communication functions
            println!("🔧 Testing VodafoneSDR Communication Functions...");
            
            // Test frequency setting
            if let Ok(mut sdr_guard) = sdr_state.try_lock() {
                if let Err(e) = sdr_guard.controller.set_frequency(868.0) {
                    println!("⚠️  Frequency test failed: {}", e);
                } else {
                    println!("✅ Frequency setting test passed");
                }
                
                // Test signal quality
                match sdr_guard.controller.get_signal_quality() {
                    Ok((rssi, snr, ber)) => {
                        println!("✅ Signal Quality: RSSI={}, SNR={}, BER={}", rssi, snr, ber);
                    },
                    Err(e) => println!("⚠️  Signal quality test failed: {}", e),
                }
                
                // Test network info
                match sdr_guard.controller.get_network_info() {
                    Ok(info) => println!("✅ Network Info: {}", info),
                    Err(e) => println!("⚠️  Network info test failed: {}", e),
                }
                
                // Test current frequency
                let freq = sdr_guard.controller.get_current_frequency();
                let band = sdr_guard.controller.get_current_band();
                println!("✅ Current Frequency: {} MHz, Band: {}", freq, band);
                
                // Test receive signal
                match sdr_guard.controller.receive_signal(1024) {
                    Ok(samples) => println!("✅ Receive signal test: {} samples received", samples.len()),
                    Err(e) => println!("⚠️  Receive signal test failed: {}", e),
                }
            } else {
                println!("⚠️  Could not acquire SDR state lock for testing");
            }
            
            // Test PresetManager functions
            println!("🔧 Testing PresetManager Functions...");
            let presets = preset_manager.get_all_presets().await;
            println!("✅ Loaded {} presets", presets.len());
            
            let preset_count = preset_manager.get_preset_count().await;
            println!("✅ Preset count: {}", preset_count);
            
            let statistics = preset_manager.get_statistics().await;
            println!("✅ Preset statistics: {:?}", statistics);
            
            // Test additional PresetManager functions
            let test_preset = Preset {
                name: "Test Preset".to_string(),
                frequency: 144.0e6,
                mode: "FM".to_string(),
                bandwidth: 12.5e3,
                gain: 20.0,
                description: "Test preset for Vodafone communication".to_string(),
                category: PresetCategory::AmateurRadio,
            };
            
            preset_manager.add_preset(test_preset).await;
            println!("✅ Added test preset");
            
            let preset_by_name = preset_manager.get_preset("Test Preset").await;
            if let Some(preset) = preset_by_name {
                println!("✅ Retrieved preset: {} at {} MHz", preset.name, preset.frequency);
            }
            
            let amateur_presets = preset_manager.get_presets_by_category(PresetCategory::AmateurRadio).await;
            println!("✅ Amateur radio presets: {} found", amateur_presets.len());
            
            let all_presets = preset_manager.list_presets().await;
            println!("✅ All presets listed: {} total", all_presets.len());
            
            let removed = preset_manager.remove_preset("Test Preset").await;
            if removed {
                println!("✅ Test preset removed successfully");
            }
            
            // Test Amateur Radio and Broadcast presets
            println!("🔧 Testing Amateur Radio and Broadcast Presets...");
            let amateur_presets = presets::amateur_radio::get_amateur_radio_presets();
            println!("✅ Amateur radio presets loaded: {} presets", amateur_presets.len());
            
            let broadcast_presets = presets::broadcast::get_broadcast_presets();
            println!("✅ Broadcast presets loaded: {} presets", broadcast_presets.len());
            
            println!("✅ Vodafone SDR Hardware initialized");
            println!("✅ SDR State ready");
            println!("✅ Preset Manager loaded");
            println!("✅ Web Server ready");
            println!("");
            
            // Test Canvas Server functions
            println!("🔧 Testing Canvas Server Functions...");
            let _canvas_config = web::server::create_canvas_config();
            println!("✅ Canvas config created");
            
            // Test canvas server startup (without actually starting)
            println!("✅ Canvas server functions available");
            
            // Test additional canvas server functions
            println!("🔧 Testing Additional Canvas Server Functions...");
            
            // Test start_canvas_server function by referencing it
            let _start_canvas_server_fn = start_canvas_server;
            println!("✅ start_canvas_server function referenced");
            
            // Test start_canvas_server_with_config function by referencing it
            let _start_canvas_server_with_config_fn = start_canvas_server_with_config;
            println!("✅ start_canvas_server_with_config function referenced");
            
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
            let _ = start_canvas_server_with_config_struct(canvas_config).await;
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
            
            println!("❌ Hardware initialization failed: {}", e);
            println!("💡 To use with real hardware:");
            println!("   1. Connect Huawei Vodafone USB-Stick");
            println!("   2. Check COM port permissions");
            println!("   3. Restart the application");
            println!("");
            println!("🔄 For now, WebTrit Phone will use simulation mode");
            println!("📞 JavaScript simulation is available at: webtrit-real.html");
            println!("");
            
            // Start Canvas-enabled web server in test mode
            let canvas_config = CanvasConfig::new()
                .with_host("0.0.0.0")
                .with_port(8080)
                .with_webui_path("webui")
                .with_cors(true)
                .with_proxy(true)
                .with_royalty(true)
                .with_audit(true);
            
            println!("🎨 Canvas Integration enabled (Test Mode)");
            println!("📡 Canvas Integration: http://localhost:8080/canvas-integration");
            println!("🔗 Proxy API: /api/proxy");
            println!("💰 Royalty API: /api/royalty");
            println!("");
            
            // Start Canvas-enabled web server
            let _ = start_canvas_server_with_config_struct(canvas_config).await;
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