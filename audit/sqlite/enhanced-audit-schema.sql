-- Enhanced Audit Database Schema
-- HFRF Integration für OnAirMulTiMedia
-- © 2025 Raymond Demitrio Dr. Tel (DD5BE)

-- Verschlüsselte SQLite-Datenbank
PRAGMA key = 'oamtm-2025-security-key';
PRAGMA cipher_page_size = 4096;
PRAGMA kdf_iter = 64000;

-- Enhanced Audit Events Table
CREATE TABLE IF NOT EXISTS enhanced_audit_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    level TEXT NOT NULL,
    payload TEXT,
    module TEXT,
    room_id TEXT,
    signature TEXT, -- Ed25519 Signatur
    checksum TEXT,  -- SHA-256 Hash
    key_id TEXT,    -- oamtm-2025
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HFRF Original Events (Migration)
CREATE TABLE IF NOT EXISTS hfrf_audit_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    level TEXT NOT NULL,
    payload TEXT,
    module TEXT,
    room_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SDR Events (Rust Backend Integration)
CREATE TABLE IF NOT EXISTS sdr_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    device_type TEXT NOT NULL,
    frequency_mhz REAL NOT NULL,
    bandwidth_khz REAL NOT NULL,
    power_dbm REAL NOT NULL,
    modulation TEXT NOT NULL,
    signal_quality REAL NOT NULL,
    regulatory_verdict TEXT NOT NULL,
    license_checked BOOLEAN NOT NULL,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- USB Device Events (Huawei Integration)
CREATE TABLE IF NOT EXISTS usb_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    device_type TEXT NOT NULL,
    device_id TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    serial_number TEXT,
    driver_version TEXT,
    connection_status TEXT NOT NULL,
    configuration_data TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- NEMO Pathfinder Events
CREATE TABLE IF NOT EXISTS nemo_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    waypoint_from TEXT,
    waypoint_to TEXT,
    heading_deg REAL NOT NULL,
    eta_iso TEXT NOT NULL,
    status TEXT NOT NULL,
    advisory TEXT,
    comm_status TEXT NOT NULL,
    signal_quality REAL NOT NULL,
    license TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- RF Validation Events
CREATE TABLE IF NOT EXISTS rf_validation_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    frequency_mhz REAL NOT NULL,
    bandwidth_khz REAL NOT NULL,
    power_dbm REAL NOT NULL,
    country TEXT NOT NULL,
    license TEXT NOT NULL,
    modulation TEXT NOT NULL,
    verdict TEXT NOT NULL,
    rationale TEXT NOT NULL,
    band TEXT,
    regulatory_ref TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- Canvas Swipe Events
CREATE TABLE IF NOT EXISTS canvas_swipe_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    gesture_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    start_x INTEGER NOT NULL,
    start_y INTEGER NOT NULL,
    end_x INTEGER NOT NULL,
    end_y INTEGER NOT NULL,
    velocity REAL NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    processed BOOLEAN NOT NULL,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- Global Meeting Clock Events
CREATE TABLE IF NOT EXISTS meeting_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    meeting_title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    timezone TEXT NOT NULL,
    participants TEXT NOT NULL, -- JSON Array
    meeting_id TEXT NOT NULL,
    qr_code_url TEXT,
    join_url TEXT,
    local_time TEXT NOT NULL,
    license TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    module TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT NOT NULL,
    context TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- Security Events
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    source_ip TEXT,
    user_agent TEXT,
    action_taken TEXT,
    details TEXT,
    audit_id TEXT,
    FOREIGN KEY (audit_id) REFERENCES enhanced_audit_events(id)
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON enhanced_audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_type ON enhanced_audit_events(type);
CREATE INDEX IF NOT EXISTS idx_audit_module ON enhanced_audit_events(module);
CREATE INDEX IF NOT EXISTS idx_audit_level ON enhanced_audit_events(level);

CREATE INDEX IF NOT EXISTS idx_sdr_frequency ON sdr_events(frequency_mhz);
CREATE INDEX IF NOT EXISTS idx_sdr_timestamp ON sdr_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_usb_device ON usb_events(device_type);
CREATE INDEX IF NOT EXISTS idx_usb_timestamp ON usb_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_nemo_status ON nemo_events(status);
CREATE INDEX IF NOT EXISTS idx_nemo_timestamp ON nemo_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_rf_frequency ON rf_validation_events(frequency_mhz);
CREATE INDEX IF NOT EXISTS idx_rf_verdict ON rf_validation_events(verdict);

CREATE INDEX IF NOT EXISTS idx_swipe_direction ON canvas_swipe_events(direction);
CREATE INDEX IF NOT EXISTS idx_swipe_timestamp ON canvas_swipe_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_meeting_timestamp ON meeting_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_meeting_id ON meeting_events(meeting_id);

CREATE INDEX IF NOT EXISTS idx_performance_module ON performance_metrics(module);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_security_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);

-- Views für häufige Abfragen
CREATE VIEW IF NOT EXISTS recent_audit_events AS
SELECT 
    id,
    timestamp,
    type,
    level,
    module,
    room_id,
    signature,
    checksum,
    key_id
FROM enhanced_audit_events
ORDER BY timestamp DESC
LIMIT 1000;

CREATE VIEW IF NOT EXISTS sdr_summary AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_events,
    AVG(frequency_mhz) as avg_frequency,
    AVG(signal_quality) as avg_signal_quality,
    COUNT(CASE WHEN regulatory_verdict = 'allow' THEN 1 END) as allowed_transmissions,
    COUNT(CASE WHEN regulatory_verdict = 'deny' THEN 1 END) as denied_transmissions
FROM sdr_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

CREATE VIEW IF NOT EXISTS rf_compliance_summary AS
SELECT 
    country,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN verdict = 'allow' THEN 1 END) as allowed,
    COUNT(CASE WHEN verdict = 'warn' THEN 1 END) as warnings,
    COUNT(CASE WHEN verdict = 'deny' THEN 1 END) as denied,
    ROUND(COUNT(CASE WHEN verdict = 'allow' THEN 1 END) * 100.0 / COUNT(*), 2) as compliance_percentage
FROM rf_validation_events
GROUP BY country
ORDER BY compliance_percentage DESC;

CREATE VIEW IF NOT EXISTS nemo_navigation_summary AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_navigations,
    COUNT(CASE WHEN status = 'on_course' THEN 1 END) as on_course,
    COUNT(CASE WHEN status = 'drift' THEN 1 END) as drift_events,
    COUNT(CASE WHEN status = 'arrived' THEN 1 END) as goals_reached,
    AVG(signal_quality) as avg_signal_quality
FROM nemo_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Trigger für automatische Audit-ID-Generierung
CREATE TRIGGER IF NOT EXISTS tr_sdr_audit_id
AFTER INSERT ON sdr_events
BEGIN
    UPDATE sdr_events 
    SET audit_id = 'sdr_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_usb_audit_id
AFTER INSERT ON usb_events
BEGIN
    UPDATE usb_events 
    SET audit_id = 'usb_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_nemo_audit_id
AFTER INSERT ON nemo_events
BEGIN
    UPDATE nemo_events 
    SET audit_id = 'nemo_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_rf_audit_id
AFTER INSERT ON rf_validation_events
BEGIN
    UPDATE rf_validation_events 
    SET audit_id = 'rf_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_swipe_audit_id
AFTER INSERT ON canvas_swipe_events
BEGIN
    UPDATE canvas_swipe_events 
    SET audit_id = 'swipe_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_meeting_audit_id
AFTER INSERT ON meeting_events
BEGIN
    UPDATE meeting_events 
    SET audit_id = 'meeting_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_performance_audit_id
AFTER INSERT ON performance_metrics
BEGIN
    UPDATE performance_metrics 
    SET audit_id = 'perf_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS tr_security_audit_id
AFTER INSERT ON security_events
BEGIN
    UPDATE security_events 
    SET audit_id = 'sec_' || NEW.id 
    WHERE id = NEW.id AND audit_id IS NULL;
END;

-- Migration Script für HFRF Daten
INSERT OR IGNORE INTO enhanced_audit_events (
    id, timestamp, type, level, payload, module, room_id
)
SELECT 
    id, timestamp, type, level, payload, module, room_id
FROM hfrf_audit_events;

-- Cleanup alte Daten (behält nur letzten Monat)
DELETE FROM enhanced_audit_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM sdr_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM usb_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM nemo_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM rf_validation_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM canvas_swipe_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM meeting_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM performance_metrics 
WHERE datetime(timestamp) < datetime('now', '-1 month');

DELETE FROM security_events 
WHERE datetime(timestamp) < datetime('now', '-1 month');

-- VACUUM für Optimierung
VACUUM;

-- Analyze für Query-Optimierung
ANALYZE;

PRAGMA integrity_check;

