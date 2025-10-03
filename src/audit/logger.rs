use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::fs::OpenOptions;
use std::io::Write;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEntry {
    pub timestamp: DateTime<Utc>,
    pub operation: String,
    pub frequency: f64,
    pub modulation: String,
    pub iq_hash: Option<String>,
    pub preset_name: Option<String>,
    pub success: bool,
    pub error_message: Option<String>,
}

pub struct AuditLogger {
    log_file: String,
}

impl AuditLogger {
    pub fn new() -> Self {
        Self {
            log_file: "audit_log.jsonl".to_string(),
        }
    }

    pub fn log_transmission(&self, entry: AuditEntry) -> Result<(), Box<dyn std::error::Error>> {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.log_file)?;

        let json_line = serde_json::to_string(&entry)?;
        writeln!(file, "{}", json_line)?;
        file.flush()?; // Flush nach jedem Log-Write
        
        Ok(())
    }

    pub fn hash_iq_data(&self, iq_data: &[f32]) -> String {
        let mut hasher = Sha256::new();
        for &sample in iq_data {
            hasher.update(&sample.to_le_bytes());
        }
        format!("{:x}", hasher.finalize())
    }

    pub fn log_tx(&self, frequency: f64, modulation: &str, iq_data: &[f32], preset_name: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
        let iq_hash = Some(self.hash_iq_data(iq_data));
        
        let entry = AuditEntry {
            timestamp: Utc::now(),
            operation: "TX".to_string(),
            frequency,
            modulation: modulation.to_string(),
            iq_hash,
            preset_name: preset_name.map(|s| s.to_string()),
            success: true,
            error_message: None,
        };

        self.log_transmission(entry)
    }

    pub fn log_rx(&self, frequency: f64, modulation: &str, iq_data: &[f32]) -> Result<(), Box<dyn std::error::Error>> {
        let iq_hash = Some(self.hash_iq_data(iq_data));
        
        let entry = AuditEntry {
            timestamp: Utc::now(),
            operation: "RX".to_string(),
            frequency,
            modulation: modulation.to_string(),
            iq_hash,
            preset_name: None,
            success: true,
            error_message: None,
        };

        self.log_transmission(entry)
    }

    pub fn log_error(&self, operation: &str, error: &str) -> Result<(), Box<dyn std::error::Error>> {
        let entry = AuditEntry {
            timestamp: Utc::now(),
            operation: operation.to_string(),
            frequency: 0.0,
            modulation: "".to_string(),
            iq_hash: None,
            preset_name: None,
            success: false,
            error_message: Some(error.to_string()),
        };

        self.log_transmission(entry)
    }
}


