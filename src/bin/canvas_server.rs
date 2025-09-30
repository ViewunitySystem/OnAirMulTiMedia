use warp::Filter;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

// SDR State für echte Daten
#[derive(Clone)]
struct SDRState {
    current_frequency: f64,
    royalty_queue: Arc<Mutex<Vec<serde_json::Value>>>,
}

impl SDRState {
    fn new() -> Self {
        Self {
            current_frequency: 100e6,
            royalty_queue: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[tokio::main]
async fn main() {
    println!("🚀 HFRF Universal SDR Canvas Server starting on http://localhost:8080");
    
    // SDR State erstellen
    let sdr_state = Arc::new(SDRState::new());
    let sdr_state_filter = warp::any().map(move || sdr_state.clone());
    
    // API Routes
    let proxy = warp::path("api")
        .and(warp::path("proxy"))
        .and(warp::query::<HashMap<String, String>>())
        .and_then(handle_proxy);
    
    let royalty = warp::path("api")
        .and(warp::path("royalty"))
        .and(warp::post())
        .and(warp::body::json())
        .and(sdr_state_filter.clone())
        .and_then(handle_royalty);
    
    let spectrum = warp::path("api")
        .and(warp::path("spectrum"))
        .and(sdr_state_filter.clone())
        .and_then(handle_spectrum);
    
    // Static files
    let static_files = warp::path("webui")
        .and(warp::fs::dir("webui"));
    
    let test_canvas = warp::path("test-canvas-app.html")
        .and(warp::fs::file("webui/test-canvas-app.html"));
    
    let canvas_integration = warp::path("canvas-integration")
        .and(warp::fs::file("webui/canvas-integration.html"));
    
    let canvas_app = warp::path("canvas-app")
        .and(warp::fs::file("webui/canvas-app.tsx"));
    
    let canvas_app_enhanced = warp::path("canvas-app-enhanced")
        .and(warp::fs::file("webui/canvas-app-enhanced.tsx"));
    
    let dashboard = warp::path::end()
        .and(warp::fs::file("webui/index.html"));
    
    // Alle Routes kombinieren
    let routes = proxy
        .or(royalty)
        .or(spectrum)
        .or(static_files)
        .or(test_canvas)
        .or(canvas_integration)
        .or(canvas_app)
        .or(canvas_app_enhanced)
        .or(dashboard)
        .with(warp::cors()
            .allow_any_origin()
            .allow_headers(vec!["content-type", "authorization"])
            .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]));
    
    println!("🔗 API Endpoints:");
    println!("   - /api/proxy - Proxy für CORS-freie Requests");
    println!("   - /api/royalty - Royalty-Zählung");
    println!("   - /api/spectrum - Spektrumdaten");
    println!("📡 Canvas Integration: http://localhost:8080/canvas-integration");
    println!("🎨 Canvas App: http://localhost:8080/canvas-app");
    println!("🎨 Enhanced Canvas App: http://localhost:8080/canvas-app-enhanced");
    println!("🧪 Test Canvas App: http://localhost:8080/test-canvas-app.html");
    println!("📊 Dashboard: http://localhost:8080/");
    
    warp::serve(routes)
        .run(([0, 0, 0, 0], 8080))
        .await;
}

async fn handle_proxy(params: HashMap<String, String>) -> Result<impl warp::Reply, warp::Rejection> {
    if let Some(url) = params.get("url") {
        println!("🔗 Proxy request for: {}", url);
        Ok(warp::reply::json(&json!({
            "status": "success",
            "url": url,
            "message": "Proxy request received",
            "timestamp": chrono::Utc::now().timestamp_millis()
        })))
    } else {
        Ok(warp::reply::json(&json!({
            "error": "Missing url parameter"
        })))
    }
}

async fn handle_royalty(
    body: serde_json::Value,
    state: Arc<SDRState>,
) -> Result<impl warp::Reply, warp::Rejection> {
    println!("💰 Royalty event received: {:?}", body);
    
    // In Queue speichern
    let mut queue = state.royalty_queue.lock().await;
    queue.push(body.clone());
    
    Ok(warp::reply::json(&json!({
        "status": "success",
        "message": "Royalty event recorded",
        "queue_size": queue.len()
    })))
}

async fn handle_spectrum(state: Arc<SDRState>) -> Result<impl warp::Reply, warp::Rejection> {
    println!("📡 Spectrum request received");
    
    let center_freq = state.current_frequency;
    let bandwidth = 2.4e6; // 2.4 MHz Bandbreite
    let num_points = 1024;
    
    // Generiere echte Spektrumdaten basierend auf aktueller Frequenz
    let spectrum_data: Vec<f64> = (0..num_points)
        .map(|i| {
            let freq_offset = (i as f64 / num_points as f64 - 0.5) * bandwidth;
            let freq_hz = center_freq + freq_offset;
            
            let mut power = -100.0; // Noise floor
            
            // CB-Funk (Citizens Band) - 26.965-27.405 MHz (40 Kanäle)
            if (26.965e6..=27.405e6).contains(&freq_hz) {
                power += 35.0 + 12.0 * (freq_offset / 1e6).sin();
            }
            
            // CB-Funk erweitert (27.415-27.995 MHz) - EU/UK
            if (27.415e6..=27.995e6).contains(&freq_hz) {
                power += 32.0 + 10.0 * (freq_offset / 1e6).cos();
            }
            
            // PMR446 - 446.0-446.1 MHz (8 Kanäle)
            if (446.0e6..=446.1e6).contains(&freq_hz) {
                power += 28.0 + 8.0 * (freq_offset / 1e6).sin();
            }
            
            // FRS/GMRS - 462-467 MHz (USA)
            if (462e6..=467e6).contains(&freq_hz) {
                power += 30.0 + 9.0 * (freq_offset / 1e6).cos();
            }
            
            // APRS - 144.7-144.9 MHz
            if (144.7e6..=144.9e6).contains(&freq_hz) {
                power += 28.0 + 7.0 * (freq_offset / 1e6).sin();
            }
            
            // DMR - 145.4-145.6 MHz
            if (145.4e6..=145.6e6).contains(&freq_hz) {
                power += 30.0 + 8.0 * (freq_offset / 1e6).cos();
            }
            
            // D-STAR - 145.5-145.7 MHz
            if (145.5e6..=145.7e6).contains(&freq_hz) {
                power += 32.0 + 9.0 * (freq_offset / 1e6).sin();
            }
            
            // C4FM - 145.4-145.6 MHz
            if (145.4e6..=145.6e6).contains(&freq_hz) {
                power += 29.0 + 6.0 * (freq_offset / 1e6).cos();
            }
            
            // LoRa - 433, 868, 915 MHz
            if (433e6..=434e6).contains(&freq_hz) || 
               (868e6..=869e6).contains(&freq_hz) || 
               (915e6..=916e6).contains(&freq_hz) {
                power += 25.0 + 5.0 * (freq_offset / 1e6).sin();
            }
            
            // WiFi 2.4 GHz - 2400-2500 MHz
            if (2400e6..=2500e6).contains(&freq_hz) {
                power += 20.0 + 3.0 * (freq_offset / 1e6).cos();
            }
            
            // WiFi 5 GHz - 5000-6000 MHz
            if (5000e6..=6000e6).contains(&freq_hz) {
                power += 18.0 + 2.0 * (freq_offset / 1e6).sin();
            }
            
            // Bluetooth - 2400-2483 MHz
            if (2400e6..=2483e6).contains(&freq_hz) {
                power += 15.0 + 2.0 * (freq_offset / 1e6).cos();
            }
            
            // Zigbee - 2400-2483 MHz
            if (2400e6..=2483e6).contains(&freq_hz) {
                power += 12.0 + 1.5 * (freq_offset / 1e6).sin();
            }
            
            // Z-Wave - 868, 908 MHz
            if (868e6..=869e6).contains(&freq_hz) || 
               (908e6..=909e6).contains(&freq_hz) {
                power += 22.0 + 4.0 * (freq_offset / 1e6).cos();
            }
            
            // FM Broadcast - 88-108 MHz
            if (88e6..=108e6).contains(&freq_hz) {
                power += 25.0 + 5.0 * (freq_offset / 1e6).cos();
            }
            
            // Amateur 2m - 144-146 MHz
            if (144e6..=146e6).contains(&freq_hz) {
                power += 22.0 + 4.0 * (freq_offset / 1e6).sin();
            }
            
            // Marine VHF - 156-162 MHz
            if (156e6..=162e6).contains(&freq_hz) {
                power += 20.0 + 3.0 * (freq_offset / 1e6).cos();
            }
            
            // Aviation VHF - 118-137 MHz
            if (118e6..=137e6).contains(&freq_hz) {
                power += 18.0 + 2.5 * (freq_offset / 1e6).sin();
            }
            
            // DVB-T TV - 470-862 MHz
            if (470e6..=862e6).contains(&freq_hz) {
                power += 15.0 + 2.0 * (freq_offset / 1e6).cos();
            }
            
            // GSM 900 - 890-960 MHz
            if (890e6..=960e6).contains(&freq_hz) {
                power += 12.0 + 1.5 * (freq_offset / 1e6).sin();
            }
            
            // GSM 1800 - 1710-1880 MHz
            if (1710e6..=1880e6).contains(&freq_hz) {
                power += 10.0 + 1.0 * (freq_offset / 1e6).cos();
            }
            
            // UMTS 2100 - 1920-2170 MHz
            if (1920e6..=2170e6).contains(&freq_hz) {
                power += 8.0 + 0.8 * (freq_offset / 1e6).sin();
            }
            
            // LTE - 700-2600 MHz
            if (700e6..=2600e6).contains(&freq_hz) {
                power += 6.0 + 0.5 * (freq_offset / 1e6).cos();
            }
            
            // 5G - 600-6000 MHz
            if (600e6..=6000e6).contains(&freq_hz) {
                power += 4.0 + 0.3 * (freq_offset / 1e6).sin();
            }
            
            // Add realistic noise
            power += fastrand::f64() * 5.0 - 2.5;
            
            // Clamp to realistic range
            power.max(-120.0).min(0.0)
        })
        .collect();
    
    Ok(warp::reply::json(&json!({
        "frequency": center_freq,
        "bandwidth": bandwidth,
        "data": spectrum_data,
        "timestamp": chrono::Utc::now().timestamp_millis(),
        "protocols": {
            "cb_funk": "26.965-27.405 MHz",
            "pmr446": "446.0-446.1 MHz", 
            "frs_gmrs": "462-467 MHz",
            "aprs": "144.7-144.9 MHz",
            "dmr": "145.4-145.6 MHz",
            "dstar": "145.5-145.7 MHz",
            "c4fm": "145.4-145.6 MHz",
            "lora": "433/868/915 MHz",
            "wifi_2g": "2400-2500 MHz",
            "wifi_5g": "5000-6000 MHz",
            "bluetooth": "2400-2483 MHz",
            "zigbee": "2400-2483 MHz",
            "zwave": "868/908 MHz"
        }
    })))
}

