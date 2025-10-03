use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditReport {
    pub generated_at: DateTime<Utc>,
    pub total_operations: usize,
    pub successful_operations: usize,
    pub failed_operations: usize,
    pub frequency_usage: HashMap<String, usize>,
    pub modulation_usage: HashMap<String, usize>,
    pub preset_usage: HashMap<String, usize>,
    pub time_range: (DateTime<Utc>, DateTime<Utc>),
}

pub struct AuditReporter {
    log_file: String,
}

impl AuditReporter {
    pub fn new() -> Self {
        Self {
            log_file: "audit_log.jsonl".to_string(),
        }
    }

    pub fn generate_report(&self) -> Result<AuditReport, Box<dyn std::error::Error>> {
        let log_content = fs::read_to_string(&self.log_file)?;
        let mut entries: Vec<crate::audit::logger::AuditEntry> = Vec::new();
        
        for line in log_content.lines() {
            if let Ok(entry) = serde_json::from_str::<crate::audit::logger::AuditEntry>(line) {
                entries.push(entry);
            }
        }

        let total_operations = entries.len();
        let successful_operations = entries.iter().filter(|e| e.success).count();
        let failed_operations = total_operations - successful_operations;

        let mut frequency_usage: HashMap<String, usize> = HashMap::new();
        let mut modulation_usage: HashMap<String, usize> = HashMap::new();
        let mut preset_usage: HashMap<String, usize> = HashMap::new();

        for entry in &entries {
            let freq_key = format!("{:.1} MHz", entry.frequency / 1e6);
            *frequency_usage.entry(freq_key).or_insert(0) += 1;
            
            *modulation_usage.entry(entry.modulation.clone()).or_insert(0) += 1;
            
            if let Some(ref preset) = entry.preset_name {
                *preset_usage.entry(preset.clone()).or_insert(0) += 1;
            }
        }

        let time_range = if entries.is_empty() {
            (Utc::now(), Utc::now())
        } else {
            let mut timestamps: Vec<DateTime<Utc>> = entries.iter().map(|e| e.timestamp).collect();
            timestamps.sort();
            (timestamps[0], timestamps[timestamps.len() - 1])
        };

        let report = AuditReport {
            generated_at: Utc::now(),
            total_operations,
            successful_operations,
            failed_operations,
            frequency_usage,
            modulation_usage,
            preset_usage,
            time_range,
        };

        // Save report to file
        let report_json = serde_json::to_string_pretty(&report)?;
        fs::write("audit_report.json", report_json)?;

        Ok(report)
    }
}


