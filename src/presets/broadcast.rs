use super::manager::{TransmissionPreset, AuditSettings};

pub fn get_broadcast_presets() -> Vec<TransmissionPreset> {
    vec![
        // FM Broadcast Band (87.5-108 MHz)
        TransmissionPreset {
            name: "FM Stereo Broadcast".to_string(),
            frequency: 101.4e6,
            modulation: "fm".to_string(),
            bandwidth: 200e3,
            gain: 35.0,
            sample_rate: 2.4e6,
            dsp_chain: vec!["stereo_encoder".to_string(), "rds_encoder".to_string(), "fm_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },

        // DVB-T TV (470-862 MHz)
        TransmissionPreset {
            name: "DVB-T Television".to_string(),
            frequency: 474e6,
            modulation: "ofdm".to_string(),
            bandwidth: 8e6,
            gain: 45.0,
            sample_rate: 10e6,
            dsp_chain: vec!["mpeg_encoder".to_string(), "ofdm_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },

        // AM Broadcast Band (520-1710 kHz)
        TransmissionPreset {
            name: "AM Broadcast".to_string(),
            frequency: 1000e3,
            modulation: "am".to_string(),
            bandwidth: 10e3,
            gain: 40.0,
            sample_rate: 1e6,
            dsp_chain: vec!["audio_compressor".to_string(), "am_modulator".to_string()],
            audit_settings: AuditSettings {
                log_tx: true,
                log_rx: true,
                hash_iq: true,
                generate_report: true,
            },
        },

        // Shortwave (3-30 MHz)
        TransmissionPreset {
            name: "Shortwave SSB".to_string(),
            frequency: 7.1e6,
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


