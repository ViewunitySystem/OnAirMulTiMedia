use crate::web::api::{create_api_routes, SDRState};
use crate::core::VodafoneSDR;
use crate::presets::PresetManager;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::Filter;

pub async fn start_canvas_server() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize HFRF-SDR components
    let sdr_controller = VodafoneSDR::new("COM1")?;
    let preset_manager = Arc::new(PresetManager::new());
    let sdr_state = Arc::new(Mutex::new(SDRState::new(sdr_controller)));
    
    // Create API routes
    let api_routes = create_api_routes(sdr_state.clone(), preset_manager.clone());
    
    // Serve static files (Canvas integration)
    let static_files = warp::path("canvas")
        .and(warp::fs::dir("webui/"));
    
    // Serve Canvas integration HTML
    let canvas_html = warp::path("canvas-integration")
        .and(warp::fs::file("webui/canvas-integration.html"));
    
    // Serve Canvas app TypeScript
    let canvas_app = warp::path("canvas-app")
        .and(warp::fs::file("webui/canvas-app.tsx"));
    
    // Serve main dashboard
    let dashboard = warp::path::end()
        .and(warp::fs::file("webui/index.html"));

    // Combine all routes
    let routes = api_routes
        .or(static_files)
        .or(canvas_html)
        .or(canvas_app)
        .or(dashboard);
    
    let cors_routes = routes.with(warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type", "authorization"])
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]));
    
    // Start server
    println!("🚀 HFRF Universal SDR Canvas Server starting on http://localhost:8080");
    println!("📡 Canvas Integration: http://localhost:8080/canvas-integration");
    println!("🎨 Canvas App: http://localhost:8080/canvas-app");
    println!("📊 Dashboard: http://localhost:8080/");
    println!("🔗 API Endpoints:");
    println!("   - /api/proxy - Proxy für CORS-freie Requests");
    println!("   - /api/royalty - Royalty-Zählung");
    println!("   - /api/spectrum - Spektrumdaten");
    println!("   - /api/presets - SDR Presets");
    println!("   - /api/hardware/status - Hardware Status");
    println!("   - /api/transmit - TX-Steuerung");
    println!("   - /api/frequency - Frequenz-Steuerung");
    println!("   - /api/community/* - Community Integration");
    println!("   - /api/audit - Audit-Logging");
    
    warp::serve(cors_routes)
        .run(([0, 0, 0, 0], 8080))
        .await;
    
    Ok(())
}

pub async fn start_canvas_server_with_config(
    host: String,
    port: u16,
    webui_path: String,
) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize HFRF-SDR components
    let sdr_controller = VodafoneSDR::new("COM1")?;
    let preset_manager = Arc::new(PresetManager::new());
    let sdr_state = Arc::new(Mutex::new(SDRState::new(sdr_controller)));
    
    // Create API routes
    let api_routes = create_api_routes(sdr_state.clone(), preset_manager.clone());
    
    // Serve static files from configured path
    let static_files = warp::path("canvas")
        .and(warp::fs::dir(&webui_path));
    
    // Serve Canvas integration HTML
    let canvas_html_path = format!("{}/canvas-integration.html", webui_path);
    let canvas_html = warp::path("canvas-integration")
        .and(warp::fs::file(canvas_html_path));
    
    // Serve Canvas app TypeScript
    let canvas_app_path = format!("{}/canvas-app.tsx", webui_path);
    let canvas_app = warp::path("canvas-app")
        .and(warp::fs::file(canvas_app_path));
    
    // Serve main dashboard
    let dashboard_path = format!("{}/index.html", webui_path);
    let dashboard = warp::path::end()
        .and(warp::fs::file(dashboard_path));
    
    // Combine all routes
    let routes = api_routes
        .or(static_files)
        .or(canvas_html)
        .or(canvas_app)
        .or(dashboard);
    
    let cors_routes = routes.with(warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type", "authorization"])
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]));
    
    // Parse host address
    let host_addr: std::net::IpAddr = host.parse()
        .map_err(|e| format!("Invalid host address: {}", e))?;
    
    // Start server
    println!("🚀 HFRF Universal SDR Canvas Server starting on http://{}:{}", host, port);
    println!("📡 Canvas Integration: http://{}:{}/canvas-integration", host, port);
    println!("🎨 Canvas App: http://{}:{}/canvas-app", host, port);
    println!("📊 Dashboard: http://{}:{}/", host, port);
    println!("🔗 API Endpoints:");
    println!("   - /api/proxy - Proxy für CORS-freie Requests");
    println!("   - /api/royalty - Royalty-Zählung");
    println!("   - /api/spectrum - Spektrumdaten");
    println!("   - /api/presets - SDR Presets");
    println!("   - /api/hardware/status - Hardware Status");
    println!("   - /api/transmit - TX-Steuerung");
    println!("   - /api/frequency - Frequenz-Steuerung");
    println!("   - /api/community/* - Community Integration");
    println!("   - /api/audit - Audit-Logging");
    
    warp::serve(cors_routes)
        .run((host_addr, port))
        .await;
    
    Ok(())
}

pub fn create_canvas_config() -> CanvasConfig {
    CanvasConfig {
        host: "0.0.0.0".to_string(),
        port: 8080,
        webui_path: "webui".to_string(),
        cors_enabled: true,
        proxy_enabled: true,
        royalty_enabled: true,
        audit_enabled: true,
    }
}

#[derive(Debug, Clone)]
pub struct CanvasConfig {
    pub host: String,
    pub port: u16,
    pub webui_path: String,
    pub cors_enabled: bool,
    pub proxy_enabled: bool,
    pub royalty_enabled: bool,
    pub audit_enabled: bool,
}

impl CanvasConfig {
    pub fn new() -> Self {
        Self {
            host: "0.0.0.0".to_string(),
            port: 8080,
            webui_path: "webui".to_string(),
            cors_enabled: true,
            proxy_enabled: true,
            royalty_enabled: true,
            audit_enabled: true,
        }
    }
    
    pub fn with_host(mut self, host: &str) -> Self {
        self.host = host.to_string();
        self
    }
    
    pub fn with_port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }
    
    pub fn with_webui_path(mut self, path: &str) -> Self {
        self.webui_path = path.to_string();
        self
    }
    
    pub fn with_cors(mut self, enabled: bool) -> Self {
        self.cors_enabled = enabled;
        self
    }
    
    pub fn with_proxy(mut self, enabled: bool) -> Self {
        self.proxy_enabled = enabled;
        self
    }
    
    pub fn with_royalty(mut self, enabled: bool) -> Self {
        self.royalty_enabled = enabled;
        self
    }
    
    pub fn with_audit(mut self, enabled: bool) -> Self {
        self.audit_enabled = enabled;
        self
    }
}

pub async fn start_canvas_server_with_config_struct(
    config: CanvasConfig,
) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize HFRF-SDR components
    let sdr_controller = VodafoneSDR::new("COM1")?;
    let preset_manager = Arc::new(PresetManager::new());
    let sdr_state = Arc::new(Mutex::new(SDRState::new(sdr_controller)));
    
    // Create API routes
    let api_routes = create_api_routes(sdr_state.clone(), preset_manager.clone());
    
    // Serve static files from configured path
    let static_files = warp::path("canvas")
        .and(warp::fs::dir(&config.webui_path));
    
    // Serve Canvas integration HTML
    let canvas_html = warp::path("canvas-integration")
        .and(warp::fs::file(&format!("{}/canvas-integration.html", config.webui_path)));
    
    // Serve Canvas app TypeScript
    let canvas_app = warp::path("canvas-app")
        .and(warp::fs::file(&format!("{}/canvas-app.tsx", config.webui_path)));
    
    // Serve main dashboard
    let dashboard = warp::path::end()
        .and(warp::fs::file(&format!("{}/index.html", config.webui_path)));
    
    // Combine all routes
    let mut routes = api_routes
        .or(static_files)
        .or(canvas_html)
        .or(canvas_app)
        .or(dashboard);
    
    // Add CORS if enabled
    let final_routes = routes.with(warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type", "authorization"])
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]));
    
    // Parse host address
    let host_addr: std::net::IpAddr = config.host.parse()
        .map_err(|e| format!("Invalid host address: {}", e))?;
    
    // Start server
    println!("🚀 HFRF Universal SDR Canvas Server starting on http://{}:{}", config.host, config.port);
    println!("📡 Canvas Integration: http://{}:{}/canvas-integration", config.host, config.port);
    println!("🎨 Canvas App: http://{}:{}/canvas-app", config.host, config.port);
    println!("📊 Dashboard: http://{}:{}/", config.host, config.port);
    println!("🔗 API Endpoints:");
    println!("   - /api/proxy - Proxy für CORS-freie Requests");
    println!("   - /api/royalty - Royalty-Zählung");
    println!("   - /api/spectrum - Spektrumdaten");
    println!("   - /api/presets - SDR Presets");
    println!("   - /api/hardware/status - Hardware Status");
    println!("   - /api/transmit - TX-Steuerung");
    println!("   - /api/frequency - Frequenz-Steuerung");
    println!("   - /api/community/* - Community Integration");
    println!("   - /api/audit - Audit-Logging");
    println!("⚙️ Configuration:");
    println!("   - Host: {}", config.host);
    println!("   - Port: {}", config.port);
    println!("   - WebUI Path: {}", config.webui_path);
    println!("   - CORS Enabled: {}", config.cors_enabled);
    println!("   - Proxy Enabled: {}", config.proxy_enabled);
    println!("   - Royalty Enabled: {}", config.royalty_enabled);
    println!("   - Audit Enabled: {}", config.audit_enabled);
    
    warp::serve(final_routes)
        .run((host_addr, config.port))
        .await;
    
    Ok(())
}