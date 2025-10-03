use super::manager::{TransmissionPreset, AuditSettings};

pub fn get_amateur_radio_presets() -> Vec<TransmissionPreset> {
    vec![
        // 2m Band (144-146 MHz)
        TransmissionPreset {
            name: "2m SSB Voice".to_string(),
            frequency: 144.3e6,
            modulation: "ssb".to_string(),
            bandwidth: 2.7e3,
            gain: 40.0,
            sample_rate: 2.4e6,
            dsp_chain: vec!["audio_compressor".to_string(), "ssb_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },
        
        // 70cm Band (430-440 MHz)
        TransmissionPreset {
            name: "70cm FM Voice".to_string(),
            frequency: 433.5e6,
            modulation: "fm".to_string(),
            bandwidth: 12.5e3,
            gain: 35.0,
            sample_rate: 2.4e6,
            dsp_chain: vec!["audio_compressor".to_string(), "fm_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },

        // 6m Band (50-54 MHz)
        TransmissionPreset {
            name: "6m SSB Voice".to_string(),
            frequency: 50.1e6,
            modulation: "ssb".to_string(),
            bandwidth: 2.7e3,
            gain: 45.0,
            sample_rate: 2.4e6,
            dsp_chain: vec!["audio_compressor".to_string(), "ssb_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },

        // 10m Band (28-30 MHz)
        TransmissionPreset {
            name: "10m SSB Voice".to_string(),
            frequency: 28.3e6,
            modulation: "ssb".to_string(),
            bandwidth: 2.7e3,
            gain: 50.0,
            sample_rate: 2.4e6,
            dsp_chain: vec!["audio_compressor".to_string(), "ssb_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },
    ]
}


