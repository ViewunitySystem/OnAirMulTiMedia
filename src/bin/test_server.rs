use warp::Filter;
use serde_json::json;

#[tokio::main]
async fn main() {
    println!("🚀 HFRF Universal SDR Test Server starting on http://localhost:8080");
    
    // Simple API routes for testing
    let proxy = warp::path("api")
        .and(warp::path("proxy"))
        .and(warp::query::<std::collections::HashMap<String, String>>())
        .and_then(handle_proxy);
    
    let royalty = warp::path("api")
        .and(warp::path("royalty"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_royalty);
    
    let spectrum = warp::path("api")
        .and(warp::path("spectrum"))
        .and_then(handle_spectrum);
    
    let routes = proxy
        .or(royalty)
        .or(spectrum)
        .with(warp::cors()
            .allow_any_origin()
            .allow_headers(vec!["content-type", "authorization"])
            .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]));
    
    println!("🔗 API Endpoints:");
    println!("   - /api/proxy - Proxy für CORS-freie Requests");
    println!("   - /api/royalty - Royalty-Zählung");
    println!("   - /api/spectrum - Spektrumdaten");
    
    warp::serve(routes)
        .run(([0, 0, 0, 0], 8080))
        .await;
}

async fn handle_proxy(params: std::collections::HashMap<String, String>) -> Result<impl warp::Reply, warp::Rejection> {
    if let Some(url) = params.get("url") {
        println!("🔗 Proxy request for: {}", url);
        Ok(warp::reply::json(&json!({
            "status": "success",
            "url": url,
            "message": "Proxy request received"
        })))
    } else {
        Ok(warp::reply::json(&json!({
            "error": "Missing url parameter"
        })))
    }
}

async fn handle_royalty(body: serde_json::Value) -> Result<impl warp::Reply, warp::Rejection> {
    println!("💰 Royalty event received: {:?}", body);
    Ok(warp::reply::json(&json!({
        "status": "success",
        "message": "Royalty event recorded"
    })))
}

async fn handle_spectrum() -> Result<impl warp::Reply, warp::Rejection> {
    println!("📡 Spectrum request received");
    
    // Generate realistic spectrum data
    let num_points = 1024;
    let spectrum_data: Vec<f64> = (0..num_points)
        .map(|i| {
            let freq_offset = (i as f64 / num_points as f64 - 0.5) * 2.4e6;
            let freq_hz = 100e6 + freq_offset;
            
            let mut power = -100.0; // Noise floor
            
            // CB-Funk (Citizens Band) - 26.965-27.405 MHz
            if (26.965e6..=27.405e6).contains(&freq_hz) {
                power += 35.0 + 12.0 * (freq_offset / 1e6).sin();
            }
            
            // FM Broadcast - 88-108 MHz
            if (88e6..=108e6).contains(&freq_hz) {
                power += 25.0 + 5.0 * (freq_offset / 1e6).cos();
            }
            
            // Add noise
            power += fastrand::f64() * 5.0 - 2.5;
            power.max(-120.0).min(0.0)
        })
        .collect();
    
    Ok(warp::reply::json(&json!({
        "frequency": 100e6,
        "bandwidth": 2.4e6,
        "data": spectrum_data,
        "timestamp": chrono::Utc::now().timestamp_millis()
    })))
}

