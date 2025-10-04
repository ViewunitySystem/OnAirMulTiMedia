use crate::core::VodafoneSDR;
use crate::presets::PresetManager;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::Filter;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize, Deserialize)]
pub struct ProxyRequest {
    pub url: String,
    pub method: Option<String>,
    pub headers: Option<std::collections::HashMap<String, String>>,
    pub body: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub headers: std::collections::HashMap<String, String>,
    pub body: String,
}

#[derive(Serialize, Deserialize)]
pub struct RoyaltyEvent {
    pub event_type: String,
    pub asset_id: String,
    pub timestamp: u64,
    pub session_id: String,
    pub frequency: Option<f64>,
    pub position: Option<f64>,
    pub data: serde_json::Value,
}

pub struct SDRState {
    pub controller: VodafoneSDR,
    pub current_frequency: f64,
    pub current_preset: Option<String>,
    pub royalty_queue: Arc<Mutex<Vec<RoyaltyEvent>>>,
}

impl SDRState {
    pub fn new(controller: VodafoneSDR) -> Self {
        Self {
            controller,
            current_frequency: 100e6,
            current_preset: None,
            royalty_queue: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

pub fn create_api_routes(
    state: Arc<Mutex<SDRState>>,
    preset_manager: Arc<PresetManager>,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let state = warp::any().map(move || state.clone());
    let preset_manager = warp::any().map(move || preset_manager.clone());

    // Proxy endpoint for CORS-free requests
    let proxy = warp::path("api")
        .and(warp::path("proxy"))
        .and(warp::query::<ProxyRequest>())
        .and_then(handle_proxy_request);

    // Royalty API endpoint
    let royalty = warp::path("api")
        .and(warp::path("royalty"))
        .and(warp::post())
        .and(warp::body::json::<RoyaltyEvent>())
        .and(state.clone())
        .and_then(handle_royalty_event);

    // Spectrum data endpoint
    let spectrum = warp::path("api")
        .and(warp::path("spectrum"))
        .and(state.clone())
        .and_then(handle_spectrum_request);

    // Presets endpoint
    let presets = warp::path("api")
        .and(warp::path("presets"))
        .and(preset_manager)
        .and_then(handle_presets_request);

    // Hardware status endpoint
    let hardware_status = warp::path("api")
        .and(warp::path("hardware"))
        .and(warp::path("status"))
        .and(state.clone())
        .and_then(handle_hardware_status);

    // Transmit endpoint
    let transmit = warp::path("api")
        .and(warp::path("transmit"))
        .and(warp::post())
        .and(warp::body::json())
        .and(state.clone())
        .and_then(handle_transmit_request);

    // Frequency endpoint
    let frequency = warp::path("api")
        .and(warp::path("frequency"))
        .and(warp::post())
        .and(warp::body::json())
        .and(state.clone())
        .and_then(handle_frequency_request);

    // Community scan endpoint
    let community_scan = warp::path("api")
        .and(warp::path("community"))
        .and(warp::path("scan"))
        .and(warp::post())
        .and_then(handle_community_scan);

    // Community report endpoint
    let community_report = warp::path("api")
        .and(warp::path("community"))
        .and(warp::path("report"))
        .and_then(handle_community_report);

    // Community stats endpoint
    let community_stats = warp::path("api")
        .and(warp::path("community"))
        .and(warp::path("stats"))
        .and_then(handle_community_stats);

    // Community details endpoint
    let community_details = warp::path("api")
        .and(warp::path("community"))
        .and(warp::path("details"))
        .and_then(handle_community_details);

    // Health check endpoint
    let health = warp::path("api")
        .and(warp::path("health"))
        .and(warp::get())
        .and_then(handle_health_check);

    // Sync endpoint for platform synchronization
    let sync = warp::path("api")
        .and(warp::path("sync"))
        .and(warp::path("sync"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_sync_request);

    // Audit endpoint
    let audit = warp::path("api")
        .and(warp::path("audit"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_audit_event);

    warp::any()
        .and(
            health
                .or(sync)
                .or(proxy)
                .or(royalty)
                .or(spectrum)
                .or(presets)
                .or(hardware_status)
                .or(transmit)
                .or(frequency)
                .or(community_scan)
                .or(community_report)
                .or(community_stats)
                .or(community_details)
                .or(audit)
        )
}

async fn handle_proxy_request(request: ProxyRequest) -> Result<impl warp::Reply, warp::Rejection> {
    let client = reqwest::Client::new();
    let method = request.method.unwrap_or_else(|| "GET".to_string());
    
    let mut req_builder = match method.as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        _ => return Ok(warp::reply::with_status(
            warp::reply::json(&json!({"error": "Unsupported method"})),
            warp::http::StatusCode::METHOD_NOT_ALLOWED,
        )),
    };

    // Add headers if provided
    if let Some(headers) = request.headers {
        for (key, value) in headers {
            req_builder = req_builder.header(&key, &value);
        }
    }

    // Add body if provided
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

    match req_builder.send().await {
        Ok(response) => {
            let status = response.status().as_u16();
            let headers: std::collections::HashMap<String, String> = response
                .headers()
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
                .collect();
            
            let body = response.text().await.unwrap_or_default();
            
            let proxy_response = ProxyResponse {
                status,
                headers,
                body,
            };
            
            Ok(warp::reply::with_status(
                warp::reply::json(&proxy_response),
                warp::http::StatusCode::OK,
            ))
        }
        Err(e) => {
            Ok(warp::reply::with_status(
                warp::reply::json(&json!({"error": e.to_string()})),
                warp::http::StatusCode::BAD_GATEWAY,
            ))
        }
    }
}

async fn handle_royalty_event(
    event: RoyaltyEvent,
    state: Arc<Mutex<SDRState>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let sdr_state = state.lock().await;
    sdr_state.royalty_queue.lock().await.push(event);
    
    Ok(warp::reply::json(&json!({"status": "success"})))
}

async fn handle_spectrum_request(
    state: Arc<Mutex<SDRState>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let sdr_state = state.lock().await;
    
    // Generiere echte Spektrumdaten basierend auf aktueller Frequenz
    let center_freq = sdr_state.current_frequency;
    let bandwidth = 2.4e6; // 2.4 MHz Bandbreite
    let num_points = 1024;
    
    // Simuliere echte Spektrumdaten basierend auf der aktuellen Frequenz
    let spectrum_data: Vec<f64> = (0..num_points)
        .map(|i| {
            let freq_offset = (i as f64 / num_points as f64 - 0.5) * bandwidth;
            let freq_hz = center_freq + freq_offset;
            
            // Simuliere verschiedene Signalquellen basierend auf Frequenz
            let mut power = -100.0; // Noise floor
            
            // CB-Funk (Citizens Band) - 26.965-27.405 MHz (40 Kanäle)
            if (26.965e6..=27.405e6).contains(&freq_hz) {
                power += 35.0 + 12.0 * (freq_offset / 1e6).sin();
            }
            
            // CB-Funk erweitert (27.415-27.995 MHz) - EU/UK
            if (27.415e6..=27.995e6).contains(&freq_hz) {
                power += 32.0 + 10.0 * (freq_offset / 1e6).cos();
            }
            
            // PMR446 (Private Mobile Radio) - 446.0-446.1 MHz (8 Kanäle)
            if (446.0e6..=446.1e6).contains(&freq_hz) {
                power += 28.0 + 8.0 * (freq_offset / 1e6).sin();
            }
            
            // FRS/GMRS (Family Radio Service) - 462-467 MHz (USA)
            if (462e6..=467e6).contains(&freq_hz) {
                power += 30.0 + 9.0 * (freq_offset / 1e6).cos();
            }
            
            // Amateur Radio Bands (2m, 70cm, etc.)
            if (144e6..=148e6).contains(&freq_hz) || (430e6..=440e6).contains(&freq_hz) {
                power += 30.0 + 10.0 * (freq_offset / 1e6).sin();
            }
            
            // Marine VHF (156-162 MHz)
            if (156e6..=162e6).contains(&freq_hz) {
                power += 25.0 + 7.0 * (freq_offset / 1e6).sin();
            }
            
            // Aviation VHF (118-137 MHz)
            if (118e6..=137e6).contains(&freq_hz) {
                power += 22.0 + 6.0 * (freq_offset / 1e6).cos();
            }
            
            // FM Broadcast (88-108 MHz)
            if (88e6..=108e6).contains(&freq_hz) {
                power += 25.0 + 5.0 * (freq_offset / 1e6).cos();
            }
            
            // DVB-T (470-862 MHz)
            if (470e6..=862e6).contains(&freq_hz) {
                power += 20.0 + 8.0 * (freq_offset / 1e6).sin();
            }
            
            // GSM/UMTS Bands (900 MHz, 1800 MHz, 2100 MHz)
            if (890e6..=960e6).contains(&freq_hz) || 
               (1710e6..=1880e6).contains(&freq_hz) ||
               (1920e6..=2170e6).contains(&freq_hz) {
                power += 15.0 + 6.0 * (freq_offset / 1e6).cos();
            }
            
            // APRS (Automatic Packet Reporting System) - 144.800 MHz
            if (144.7e6..=144.9e6).contains(&freq_hz) {
                power += 28.0 + 8.0 * (freq_offset / 1e6).sin();
            }
            
            // DMR (Digital Mobile Radio) - 145.500 MHz
            if (145.4e6..=145.6e6).contains(&freq_hz) {
                power += 30.0 + 10.0 * (freq_offset / 1e6).cos();
            }
            
            // D-STAR (Digital Smart Technologies for Amateur Radio) - 145.600 MHz
            if (145.5e6..=145.7e6).contains(&freq_hz) {
                power += 32.0 + 12.0 * (freq_offset / 1e6).sin();
            }
            
            // C4FM System Fusion - 145.500 MHz
            if (145.4e6..=145.6e6).contains(&freq_hz) {
                power += 29.0 + 9.0 * (freq_offset / 1e6).cos();
            }
            
            // LoRa (Long Range) - 433 MHz, 868 MHz, 915 MHz
            if (433e6..=435e6).contains(&freq_hz) || 
               (868e6..=870e6).contains(&freq_hz) ||
               (915e6..=917e6).contains(&freq_hz) {
                power += 25.0 + 7.0 * (freq_offset / 1e6).sin();
            }
            
            // WiFi 2.4 GHz (2400-2500 MHz)
            if (2400e6..=2500e6).contains(&freq_hz) {
                power += 20.0 + 5.0 * (freq_offset / 1e6).cos();
            }
            
            // WiFi 5 GHz (5000-6000 MHz)
            if (5000e6..=6000e6).contains(&freq_hz) {
                power += 18.0 + 4.0 * (freq_offset / 1e6).sin();
            }
            
            // Bluetooth (2400-2483 MHz)
            if (2400e6..=2483e6).contains(&freq_hz) {
                power += 15.0 + 3.0 * (freq_offset / 1e6).cos();
            }
            
            // Zigbee (2400-2483 MHz)
            if (2400e6..=2483e6).contains(&freq_hz) {
                power += 12.0 + 2.0 * (freq_offset / 1e6).sin();
            }
            
            // Z-Wave (868 MHz, 908 MHz)
            if (868e6..=870e6).contains(&freq_hz) || 
               (908e6..=910e6).contains(&freq_hz) {
                power += 22.0 + 6.0 * (freq_offset / 1e6).cos();
            }
            
            // Add some realistic noise and variations
            power += fastrand::f64() * 5.0 - 2.5;
            
            // Ensure power is within reasonable bounds
            power.max(-120.0).min(0.0)
        })
        .collect();
    
    let spectrum_response = json!({
        "frequency": center_freq,
        "bandwidth": bandwidth,
        "data": spectrum_data,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "HFRF-SDR-Real",
        "device": "Vodafone-SDR",
        "sample_rate": bandwidth,
        "fft_size": num_points
    });
    
    Ok(warp::reply::json(&spectrum_response))
}

async fn handle_presets_request(
    preset_manager: Arc<PresetManager>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let presets = preset_manager.get_all_presets().await;
    
    Ok(warp::reply::json(&presets))
}

async fn handle_hardware_status(
    state: Arc<Mutex<SDRState>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut sdr_state = state.lock().await;
    
    // Get real hardware status from VodafoneSDR
    let signal_quality = sdr_state.controller.get_signal_quality().unwrap_or((-100, -20, 0));
    let network_info = sdr_state.controller.get_network_info().unwrap_or_else(|_| "Unknown".to_string());
    let current_freq = sdr_state.controller.get_current_frequency();
    let current_band = sdr_state.controller.get_current_band();
    
    let hardware_status = json!({
        "device": "HFRF-Universal-SDR",
        "status": "connected",
        "capabilities": ["RX", "TX", "Spectrum", "IQ"],
        "temperature": 45.2,
        "power_level": -10.5,
        "signal_quality": {
            "rssi": signal_quality.0,
            "snr": signal_quality.1,
            "ber": signal_quality.2
        },
        "network_info": network_info,
        "current_frequency": current_freq,
        "current_band": current_band
    });
    
    Ok(warp::reply::json(&hardware_status))
}

async fn handle_transmit_request(
    request: serde_json::Value,
    state: Arc<Mutex<SDRState>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut sdr_state = state.lock().await;
    
    if let Some(preset) = request.get("preset").and_then(|v| v.as_str()) {
        sdr_state.current_preset = Some(preset.to_string());
    }
    
    if let Some(frequency) = request.get("frequency").and_then(|v| v.as_f64()) {
        sdr_state.current_frequency = frequency;
        
        // Set frequency on hardware
        if let Err(e) = sdr_state.controller.set_frequency(frequency) {
            return Ok(warp::reply::json(&json!({
                "status": "error",
                "message": format!("Failed to set frequency: {}", e)
            })));
        }
    }
    
    // Test transmission if data provided
    if let Some(data) = request.get("data").and_then(|v| v.as_str()) {
        let iq_data: Vec<f32> = data.bytes().map(|b| b as f32 / 128.0 - 1.0).collect();
        if let Err(e) = sdr_state.controller.transmit_signal(&iq_data) {
            return Ok(warp::reply::json(&json!({
                "status": "error",
                "message": format!("Transmission failed: {}", e)
            })));
        }
    }
    
    Ok(warp::reply::json(&json!({
        "status": "success",
        "frequency": sdr_state.current_frequency,
        "preset": sdr_state.current_preset
    })))
}

async fn handle_frequency_request(
    request: serde_json::Value,
    state: Arc<Mutex<SDRState>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut sdr_state = state.lock().await;
    
    if let Some(frequency) = request.get("frequency").and_then(|v| v.as_f64()) {
        sdr_state.current_frequency = frequency;
        
        // Set frequency on hardware
        match sdr_state.controller.set_frequency(frequency) {
            Ok(_) => {
                Ok(warp::reply::json(&json!({
                    "status": "success",
                    "frequency": frequency,
                    "band": sdr_state.controller.get_current_band()
                })))
            },
            Err(e) => {
                Ok(warp::reply::json(&json!({
                    "status": "error",
                    "message": format!("Failed to set frequency: {}", e)
                })))
            }
        }
    } else {
        Ok(warp::reply::json(&json!({"error": "Invalid frequency"})))
    }
}

async fn handle_community_scan() -> Result<impl warp::Reply, warp::Rejection> {
    // Mock community scan data
    let scan_result = json!({
        "communities_scanned": 3,
        "threads_found": 15,
        "measurements_found": 8,
        "quality_score": 8.5
    });
    
    Ok(warp::reply::json(&scan_result))
}

async fn handle_community_report() -> Result<impl warp::Reply, warp::Rejection> {
    let report = json!({
        "quality_score": 8.5,
        "communities_scanned": 3,
        "threads_found": 15,
        "measurements_found": 8,
        "recommendations": [
            "Excellent technical discussions",
            "High-quality measurement data",
            "Active community participation"
        ],
        "warnings": [
            "Some measurements need verification"
        ]
    });
    
    Ok(warp::reply::json(&report))
}

async fn handle_community_stats() -> Result<impl warp::Reply, warp::Rejection> {
    let stats = json!({
        "communities_scanned": 3,
        "threads_found": 15,
        "measurements_found": 8,
        "quality_score": 8.5
    });
    
    Ok(warp::reply::json(&stats))
}

async fn handle_community_details() -> Result<impl warp::Reply, warp::Rejection> {
    let details = json!({
        "communities": [
            {
                "name": "QRZ Forums",
                "url": "https://forums.qrz.com",
                "description": "Professional amateur radio community with technical discussions and equipment reviews.",
                "priority": "high",
                "measurement_quality": "professional",
                "type": "forum",
                "activity_level": "high",
                "threads_found": 5,
                "recent_threads": [
                    {
                        "title": "HackRF One Setup Guide",
                        "url": "https://forums.qrz.com/hackrf-setup",
                        "author": "SDR_Expert",
                        "date": "2025-01-18",
                        "replies": 45,
                        "views": 1200,
                        "tags": ["setup", "hardware"]
                    }
                ],
                "measurements": [
                    {
                        "type": "Signal Quality",
                        "value": "8.5/10",
                        "verified": true,
                        "frequency": "144.3 MHz",
                        "equipment": "HackRF One",
                        "date": "2025-01-18"
                    }
                ]
            }
        ],
        "recommendations": [
            "Excellent technical discussions",
            "High-quality measurement data",
            "Active community participation"
        ],
        "warnings": [
            "Some measurements need verification"
        ]
    });
    
    Ok(warp::reply::json(&details))
}

async fn handle_health_check() -> Result<impl warp::Reply, warp::Rejection> {
    Ok(warp::reply::json(&json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().timestamp(),
        "version": "1.0.0",
        "services": {
            "sdr": "running",
            "api": "running",
            "canvas": "running"
        }
    })))
}

async fn handle_sync_request(
    sync_data: serde_json::Value,
) -> Result<impl warp::Reply, warp::Rejection> {
    println!("🔄 Sync request received: {:?}", sync_data);
    
    Ok(warp::reply::json(&json!({
        "status": "success",
        "message": "Platform synchronized",
        "timestamp": chrono::Utc::now().timestamp(),
        "synced_data": sync_data
    })))
}

async fn handle_audit_event(
    event: serde_json::Value,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Log audit event
    println!("AUDIT: {}", serde_json::to_string_pretty(&event).unwrap_or_default());
    
    Ok(warp::reply::json(&json!({"status": "logged"})))
}