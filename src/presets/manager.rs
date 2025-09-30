//! Preset Manager - Manages SDR presets for different frequency bands and modes
//! 
//! Provides preset management for amateur radio, broadcast, and cellular bands

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Preset information structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preset {
    pub name: String,
    pub frequency: f64,
    pub mode: String,
    pub bandwidth: f64,
    pub gain: f64,
    pub description: String,
    pub category: PresetCategory,
}

/// Transmission preset structure (legacy compatibility)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransmissionPreset {
    pub name: String,
    pub frequency: f64,
    pub modulation: String,
    pub bandwidth: f64,
    pub gain: f64,
    pub sample_rate: f64,
    pub dsp_chain: Vec<String>,
    pub audit_settings: AuditSettings,
}

/// Audit settings structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditSettings {
    pub log_tx: bool,
    pub log_rx: bool,
    pub hash_iq: bool,
    pub generate_report: bool,
}

/// Preset categories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PresetCategory {
    AmateurRadio,
    Broadcast,
    Cellular,
    Satellite,
    Emergency,
}

/// Preset Manager - Central management for all SDR presets
#[derive(Debug)]
pub struct PresetManager {
    presets: Arc<Mutex<HashMap<String, Preset>>>,
}

impl PresetManager {
    /// Create new preset manager with default presets
    pub fn new() -> Self {
        let manager = Self {
            presets: Arc::new(Mutex::new(HashMap::new())),
        };
        
        // Load default presets
        manager.load_default_presets();
        manager
    }
    
    /// Load default presets for all supported bands
    fn load_default_presets(&self) {
        let mut presets = HashMap::new();
        
        // Amateur Radio Presets
        presets.insert("2m_ssb".to_string(), Preset {
            name: "2m SSB".to_string(),
            frequency: 144.3e6,
            mode: "SSB".to_string(),
            bandwidth: 2.7e3,
            gain: 20.0,
            description: "2m band SSB voice communication".to_string(),
            category: PresetCategory::AmateurRadio,
        });
        
        presets.insert("70cm_fm".to_string(), Preset {
            name: "70cm FM".to_string(),
            frequency: 433.5e6,
            mode: "FM".to_string(),
            bandwidth: 12.5e3,
            gain: 20.0,
            description: "70cm band FM voice communication".to_string(),
            category: PresetCategory::AmateurRadio,
        });
        
        presets.insert("6m_ssb".to_string(), Preset {
            name: "6m SSB".to_string(),
            frequency: 50.1e6,
            mode: "SSB".to_string(),
            bandwidth: 2.7e3,
            gain: 20.0,
            description: "6m band SSB voice communication".to_string(),
            category: PresetCategory::AmateurRadio,
        });
        
        presets.insert("10m_ssb".to_string(), Preset {
            name: "10m SSB".to_string(),
            frequency: 28.3e6,
            mode: "SSB".to_string(),
            bandwidth: 2.7e3,
            gain: 20.0,
            description: "10m band SSB voice communication".to_string(),
            category: PresetCategory::AmateurRadio,
        });
        
        // Broadcast Presets
        presets.insert("fm_broadcast".to_string(), Preset {
            name: "FM Broadcast".to_string(),
            frequency: 101.4e6,
            mode: "FM".to_string(),
            bandwidth: 200e3,
            gain: 30.0,
            description: "FM stereo broadcast reception".to_string(),
            category: PresetCategory::Broadcast,
        });
        
        presets.insert("am_broadcast".to_string(), Preset {
            name: "AM Broadcast".to_string(),
            frequency: 1000e3,
            mode: "AM".to_string(),
            bandwidth: 9e3,
            gain: 30.0,
            description: "AM broadcast reception".to_string(),
            category: PresetCategory::Broadcast,
        });
        
        presets.insert("shortwave_ssb".to_string(), Preset {
            name: "Shortwave SSB".to_string(),
            frequency: 7.1e6,
            mode: "SSB".to_string(),
            bandwidth: 2.7e3,
            gain: 25.0,
            description: "Shortwave SSB communication".to_string(),
            category: PresetCategory::Broadcast,
        });
        
        // Cellular Presets
        presets.insert("vodafone_3g".to_string(), Preset {
            name: "Vodafone 3G".to_string(),
            frequency: 900e6,
            mode: "QPSK".to_string(),
            bandwidth: 5e6,
            gain: 15.0,
            description: "Vodafone 3G cellular network".to_string(),
            category: PresetCategory::Cellular,
        });
        
        presets.insert("gsm_900".to_string(), Preset {
            name: "GSM 900".to_string(),
            frequency: 925e6,
            mode: "GMSK".to_string(),
            bandwidth: 200e3,
            gain: 15.0,
            description: "GSM 900 MHz cellular network".to_string(),
            category: PresetCategory::Cellular,
        });
        
        presets.insert("lte_1800".to_string(), Preset {
            name: "LTE 1800".to_string(),
            frequency: 1800e6,
            mode: "OFDM".to_string(),
            bandwidth: 20e6,
            gain: 15.0,
            description: "LTE 1800 MHz cellular network".to_string(),
            category: PresetCategory::Cellular,
        });
        
        // Satellite Presets
        presets.insert("dvb_t".to_string(), Preset {
            name: "DVB-T".to_string(),
            frequency: 474e6,
            mode: "OFDM".to_string(),
            bandwidth: 8e6,
            gain: 25.0,
            description: "DVB-T television reception".to_string(),
            category: PresetCategory::Satellite,
        });
        
        // Emergency Presets
        presets.insert("emergency_20m".to_string(), Preset {
            name: "Emergency 20m".to_string(),
            frequency: 14.3e6,
            mode: "SSB".to_string(),
            bandwidth: 2.7e3,
            gain: 20.0,
            description: "Emergency communication 20m band".to_string(),
            category: PresetCategory::Emergency,
        });
        
        presets.insert("emergency_2m".to_string(), Preset {
            name: "Emergency 2m".to_string(),
            frequency: 145.5e6,
            mode: "FM".to_string(),
            bandwidth: 12.5e3,
            gain: 20.0,
            description: "Emergency communication 2m band".to_string(),
            category: PresetCategory::Emergency,
        });
        
        // Store presets
        let presets_arc = self.presets.clone();
        tokio::spawn(async move {
            let mut presets_guard = presets_arc.lock().await;
            *presets_guard = presets;
        });
    }
    
    /// Get all presets
    pub async fn get_all_presets(&self) -> Vec<Preset> {
        let presets_guard = self.presets.lock().await;
        presets_guard.values().cloned().collect()
    }
    
    /// Get preset by name
    pub async fn get_preset(&self, name: &str) -> Option<Preset> {
        let presets_guard = self.presets.lock().await;
        presets_guard.get(name).cloned()
    }
    
    /// Get presets by category
    pub async fn get_presets_by_category(&self, category: PresetCategory) -> Vec<Preset> {
        let presets_guard = self.presets.lock().await;
        presets_guard
            .values()
            .filter(|p| std::mem::discriminant(&p.category) == std::mem::discriminant(&category))
            .cloned()
            .collect()
    }
    
    /// Add new preset
    pub async fn add_preset(&self, preset: Preset) {
        let mut presets_guard = self.presets.lock().await;
        presets_guard.insert(preset.name.clone(), preset);
    }
    
    /// Remove preset
    pub async fn remove_preset(&self, name: &str) -> bool {
        let mut presets_guard = self.presets.lock().await;
        presets_guard.remove(name).is_some()
    }
    
    /// Get preset count
    pub async fn get_preset_count(&self) -> usize {
        let presets_guard = self.presets.lock().await;
        presets_guard.len()
    }
    
    /// List all presets (legacy compatibility)
    pub async fn list_presets(&self) -> Vec<Preset> {
        self.get_all_presets().await
    }
    
    /// Get preset statistics
    pub async fn get_statistics(&self) -> PresetStatistics {
        let presets_guard = self.presets.lock().await;
        let mut stats = PresetStatistics::default();
        
        for preset in presets_guard.values() {
            match preset.category {
                PresetCategory::AmateurRadio => stats.amateur_radio_count += 1,
                PresetCategory::Broadcast => stats.broadcast_count += 1,
                PresetCategory::Cellular => stats.cellular_count += 1,
                PresetCategory::Satellite => stats.satellite_count += 1,
                PresetCategory::Emergency => stats.emergency_count += 1,
            }
        }
        
        stats
    }
}

/// Preset statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PresetStatistics {
    pub amateur_radio_count: usize,
    pub broadcast_count: usize,
    pub cellular_count: usize,
    pub satellite_count: usize,
    pub emergency_count: usize,
}

impl Default for PresetManager {
    fn default() -> Self {
        Self::new()
    }
}
