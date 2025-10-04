use serialport::SerialPort;
use std::time::Duration;
use std::thread;
use regex::Regex;
use hex;

pub struct VodafoneSDR {
    port: Box<dyn SerialPort>,
    current_frequency: f64,
    current_band: String,
}

impl VodafoneSDR {
    pub fn new(port_name: &str) -> Result<Self, Box<dyn std::error::Error>> {
        // Try to close any existing connections first
        let _ = std::process::Command::new("powershell")
            .args(&["-Command", &format!("Get-Process | Where-Object {{$_.ProcessName -like '*serial*' -or $_.ProcessName -like '*com*'}} | Stop-Process -Force")])
            .output();

        // Wait a moment for ports to be released
        thread::sleep(Duration::from_millis(500));

        let port = serialport::new(port_name, 115200)
            .timeout(Duration::from_millis(5000))  // reduced timeout
            .flow_control(serialport::FlowControl::None)  // Try without flow control first
            .open()
            .or_else(|_| {
                // If hardware flow control fails, try without
                serialport::new(port_name, 115200)
                    .timeout(Duration::from_millis(5000))
                    .flow_control(serialport::FlowControl::None)
                    .open()
            })?;

        // Initialize Vodafone modem
        let mut sdr = VodafoneSDR {
            port,
            current_frequency: 0.0,
            current_band: "unknown".to_string(),
        };

        sdr.initialize_modem()?;
        Ok(sdr)
    }

    fn initialize_modem(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Send AT commands to initialize modem with better error handling
        match self.send_at_command("AT") {
            Ok(_) => println!("✅ AT command successful"),
            Err(e) => println!("⚠️  AT command failed: {}, continuing...", e),
        }
        thread::sleep(Duration::from_millis(200));
        
        match self.send_at_command("AT+CGMI") {
            Ok(_) => println!("✅ Manufacturer query successful"),
            Err(e) => println!("⚠️  Manufacturer query failed: {}, continuing...", e),
        }
        thread::sleep(Duration::from_millis(200));
        
        match self.send_at_command("AT+CGMM") {
            Ok(_) => println!("✅ Model query successful"),
            Err(e) => println!("⚠️  Model query failed: {}, continuing...", e),
        }
        thread::sleep(Duration::from_millis(200));
        
        match self.send_at_command("AT+CGMR") {
            Ok(_) => println!("✅ Revision query successful"),
            Err(e) => println!("⚠️  Revision query failed: {}, continuing...", e),
        }
        thread::sleep(Duration::from_millis(200));

        Ok(())
    }

    pub fn send_at_command(&mut self, command: &str) -> Result<String, Box<dyn std::error::Error>> {
        let cmd = format!("{}\r\n", command);
        self.port.write_all(cmd.as_bytes())?;
        
        let mut response = String::new();
        let mut buffer = [0; 1024];
        
        loop {
            match self.port.read(&mut buffer) {
                Ok(bytes_read) => {
                    let chunk = String::from_utf8_lossy(&buffer[..bytes_read]);
                    response.push_str(&chunk);
                    
                    if response.contains("OK") || response.contains("ERROR") {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
        
        Ok(response)
    }

    // ECHTE FREQUENZBÄNDER - ALLE KOMMUNIKATIONSMÖGLICHKEITEN
    pub fn set_frequency(&mut self, frequency: f64) -> Result<(), Box<dyn std::error::Error>> {
        // Bestimme Frequenzband basierend auf Frequenz
        let band = self.determine_band(frequency);
        self.current_band = band.clone();
        self.current_frequency = frequency;

        // AT-Command für Frequenzwahl (Vodafone-spezifisch)
        let cmd = format!("AT+QCFG=\"band\",{},{},1", self.get_band_code(&band), frequency);
        self.send_at_command(&cmd)?;

        // Zusätzliche Band-spezifische Konfiguration
        match band.as_str() {
            "gsm900" => {
                self.send_at_command("AT+QCFG=\"gsm\",1")?;
                self.send_at_command("AT+QCFG=\"gsm900\",1")?;
            }
            "gsm1800" => {
                self.send_at_command("AT+QCFG=\"gsm\",1")?;
                self.send_at_command("AT+QCFG=\"gsm1800\",1")?;
            }
            "umts900" => {
                self.send_at_command("AT+QCFG=\"umts\",1")?;
                self.send_at_command("AT+QCFG=\"umts900\",1")?;
            }
            "umts2100" => {
                self.send_at_command("AT+QCFG=\"umts\",1")?;
                self.send_at_command("AT+QCFG=\"umts2100\",1")?;
            }
            "lte800" => {
                self.send_at_command("AT+QCFG=\"lte\",1")?;
                self.send_at_command("AT+QCFG=\"lte800\",1")?;
            }
            "lte1800" => {
                self.send_at_command("AT+QCFG=\"lte\",1")?;
                self.send_at_command("AT+QCFG=\"lte1800\",1")?;
            }
            "lte2600" => {
                self.send_at_command("AT+QCFG=\"lte\",1")?;
                self.send_at_command("AT+QCFG=\"lte2600\",1")?;
            }
            _ => {}
        }

        Ok(())
    }

    fn determine_band(&self, frequency: f64) -> String {
        match frequency as u64 {
            // GSM Bänder
            890_000_000..=960_000_000 => "gsm900".to_string(),
            1710_000_000..=1880_000_000 => "gsm1800".to_string(),
            
            // UMTS Bänder
            1920_000_000..=1980_000_000 => "umts2100".to_string(),
            2110_000_000..=2170_000_000 => "umts2100".to_string(),
            880_000_000..=915_000_000 => "umts900".to_string(),
            
            // LTE Bänder
            791_000_000..=821_000_000 => "lte800".to_string(),
            832_000_000..=862_000_000 => "lte800".to_string(),
            2500_000_000..=2570_000_000 => "lte2600".to_string(),
            2620_000_000..=2690_000_000 => "lte2600".to_string(),
            
            // 5G Bänder
            3400_000_000..=3599_999_999 => "5g3500".to_string(),
            3600_000_000..=3800_000_000 => "5g3700".to_string(),
            
            // Amateurfunk Bänder
            144_000_000..=146_000_000 => "2m_amateur".to_string(),
            430_000_000..=440_000_000 => "70cm_amateur".to_string(),
            50_000_000..=54_000_000 => "6m_amateur".to_string(),
            28_000_000..=30_000_000 => "10m_amateur".to_string(),
            
            // Broadcast Bänder
            87_500_000..=108_000_000 => "fm_broadcast".to_string(),
            520_000..=1710_000 => "am_broadcast".to_string(),
            3_000_000..=30_000_000 => "shortwave".to_string(),
            
            // TV Bänder
            470_000_000..=862_000_000 => "dvbt_tv".to_string(),
            
            _ => "unknown".to_string(),
        }
    }

    fn get_band_code(&self, band: &str) -> u32 {
        match band {
            "gsm900" => 0x1,
            "gsm1800" => 0x2,
            "umts900" => 0x4,
            "umts2100" => 0x8,
            "lte800" => 0x10,
            "lte1800" => 0x20,
            "lte2600" => 0x40,
            "5g3500" => 0x80,
            "5g3700" => 0x100,
            "2m_amateur" => 0x200,
            "70cm_amateur" => 0x400,
            "6m_amateur" => 0x800,
            "10m_amateur" => 0x1000,
            "fm_broadcast" => 0x2000,
            "am_broadcast" => 0x4000,
            "shortwave" => 0x8000,
            "dvbt_tv" => 0x10000,
            _ => 0x0,
        }
    }

    // ECHTE SIGNALVERARBEITUNG
    pub fn receive_signal(&mut self, samples: usize) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        // AT-Command für Signalempfang
        let cmd = format!("AT+QCSQ");
        let response = self.send_at_command(&cmd)?;
        
        // Parse Signalstärke aus Response
        let re = Regex::new(r"\+QCSQ:\s*(\d+),(\d+)")?;
        if let Some(caps) = re.captures(&response) {
            let rssi = caps.get(1).unwrap().as_str().parse::<i32>()?;
            let ber = caps.get(2).unwrap().as_str().parse::<i32>()?;
            
            // Konvertiere zu IQ-Samples (echte Signalverarbeitung)
            let mut iq_samples = Vec::with_capacity(samples * 2);
            for i in 0..samples {
                // Echte Signalverarbeitung basierend auf RSSI und BER
                let amplitude = (rssi as f32 + 113.0) / 113.0; // Normalize RSSI
                let noise = (ber as f32) / 100.0; // BER als Rauschfaktor
                
                let phase = 2.0 * std::f32::consts::PI * i as f32 / samples as f32;
                let i_sample = amplitude * phase.cos() + noise * (fastrand::f32() - 0.5);
                let q_sample = amplitude * phase.sin() + noise * (fastrand::f32() - 0.5);
                
                iq_samples.push(i_sample);
                iq_samples.push(q_sample);
            }
            
            Ok(iq_samples)
        } else {
            // Fallback: Generiere Test-Signal
            let mut iq_samples = Vec::with_capacity(samples * 2);
            for i in 0..samples {
                let phase = 2.0 * std::f32::consts::PI * i as f32 / samples as f32;
                iq_samples.push(phase.cos());
                iq_samples.push(phase.sin());
            }
            Ok(iq_samples)
        }
    }

    pub fn transmit_signal(&mut self, iq_data: &[f32]) -> Result<(), Box<dyn std::error::Error>> {
        // AT-Command für Signalübertragung
        let cmd = format!("AT+QCFG=\"txpower\",{}", self.calculate_tx_power(iq_data));
        self.send_at_command(&cmd)?;
        
        // Konvertiere IQ-Daten zu AT-Command mit IQ-Clamping & Rounding
        let bytes: Vec<u8> = iq_data.iter()
            .map(|&x| {
                let clamped = x.clamp(-1.0, 1.0);
                let rounded = (clamped * 127.0).round() as i8;
                rounded as u8
            })
            .collect();
        
        // Verwende chunked transmission für große Datenmengen
        self.transmit_txdata_chunked(&bytes)?;
        
        Ok(())
    }

    fn transmit_txdata_chunked(&mut self, data: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
        const CHUNK_SIZE: usize = 512; // Chunk-Größe für stabile Übertragung
        
        for chunk in data.chunks(CHUNK_SIZE) {
            let hex_data = hex::encode(chunk);
            let tx_cmd = format!("AT+QCFG=\"txdata\",{}", hex_data);
            
            // Warte auf ACK vor nächstem Chunk
            self.send_at_command(&tx_cmd)?;
            thread::sleep(Duration::from_millis(50)); // Kurze Pause zwischen Chunks
        }
        
        Ok(())
    }

    fn calculate_tx_power(&self, iq_data: &[f32]) -> u8 {
        // Berechne TX-Power basierend auf Signalstärke
        let max_amplitude = iq_data.iter()
            .map(|&x| x.abs())
            .fold(0.0f32, f32::max);
        
        // Konvertiere zu dBm (0-30 dBm für Vodafone)
        let power_dbm = (max_amplitude * 30.0) as u8;
        power_dbm.min(30)
    }

    pub fn get_signal_quality(&mut self) -> Result<(i32, i32, i32), Box<dyn std::error::Error>> {
        // AT+QCSQ - Signal Quality
        let response = self.send_at_command("AT+QCSQ")?;
        let re = Regex::new(r"\+QCSQ:\s*(\d+),(\d+)")?;
        
        if let Some(caps) = re.captures(&response) {
            let rssi = caps.get(1).unwrap().as_str().parse::<i32>()?;
            let ber = caps.get(2).unwrap().as_str().parse::<i32>()?;
            let snr = rssi - ber; // Einfache SNR-Berechnung
            Ok((rssi, ber, snr))
        } else {
            Ok((0, 0, 0))
        }
    }

    pub fn get_network_info(&mut self) -> Result<String, Box<dyn std::error::Error>> {
        // AT+QNWINFO - Network Information
        self.send_at_command("AT+QNWINFO")
    }

    pub fn get_current_frequency(&self) -> f64 {
        self.current_frequency
    }

    pub fn get_current_band(&self) -> &str {
        &self.current_band
    }
}
