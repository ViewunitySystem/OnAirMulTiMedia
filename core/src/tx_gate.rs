pub fn may_transmit(jurisdiction: &str, band_hz: u64, power_dbm: i32, licensed: bool) -> Result<(), String> {
    if !licensed {
        return Err("License required for any TX in your jurisdiction".into());
    }
    if power_dbm > 10 {
        return Err("TX power exceeds configured hard limit".into());
    }
    let _ = (jurisdiction, band_hz); // TODO: Bandplan prüfen
    Ok(())
}
