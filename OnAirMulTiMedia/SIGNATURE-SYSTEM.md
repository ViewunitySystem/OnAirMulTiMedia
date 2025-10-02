# 🔐 Ed25519 Signatur-System - OAMTM

**Version:** 1.0.0  
**Operator:** Raymond Demitrio Dr. Tel (DD5BE)  
**Key ID:** oamtm-2025  
**Algorithm:** Ed25519 (EdDSA)  
**Hash:** SHA-256

---

## 🎯 Zweck

Digitale Signaturen für Audit-Trail-Exporte garantieren:
- ✅ **Authentizität** - Export stammt vom OAMTM Server
- ✅ **Integrität** - Daten wurden nicht manipuliert
- ✅ **Non-Repudiation** - Signatur kann nicht abgestritten werden
- ✅ **Prüfbarkeit** - Jeder kann die Signatur verifizieren

---

## 🔑 Schlüsselmanagement

### Automatische Generierung
```javascript
// Server generiert beim Start automatisch:
- Public Key:  keys/oamtm-public.pem  (✅ committbar)
- Private Key: keys/oamtm-private.pem (🔒 NIEMALS committen!)

// Falls Schlüssel existieren → laden
// Falls nicht → neue generieren und speichern
```

### Public Key abrufen
```bash
# PEM Format
GET /api/keys/public
GET /api/keys/public?format=pem

# JSON Format
GET /api/keys/public?format=json

Response:
{
  "key_id": "oamtm-2025",
  "algorithm": "Ed25519",
  "public_key": "-----BEGIN PUBLIC KEY-----\n...",
  "created": "2025-10-01T...",
  "usage": "Audit Trail Signature Verification"
}
```

---

## ✍️ Audit-Export mit Signatur

### JSON Export (signiert)
```bash
GET /api/audit/export?format=json&signed=1

Response:
{
  "events": [...],
  "exported_at": "2025-10-01T09:00:00Z",
  "total_events": 42,
  "format": "json",
  "signature": {
    "signature": "base64EncodedEd25519Signature...",
    "checksum": "sha256HashInHex...",
    "key_id": "oamtm-2025",
    "algorithm": "Ed25519",
    "hash_algorithm": "SHA-256",
    "signed_at": "2025-10-01T09:00:00Z",
    "verify_key_url": "/api/keys/public"
  }
}
```

### Markdown Export (signiert)
```bash
GET /api/audit/export?format=md&signed=1&title=NEMO%20Trail

Response: Markdown mit Front Matter
---
title: NEMO Trail
exported_at: 2025-10-01T09:00:00Z
total_events: 42
signature: base64EncodedEd25519Signature...
checksum: sha256HashInHex...
key_id: oamtm-2025
algorithm: Ed25519
verify_key_url: /api/keys/public
---

# NEMO Trail
**Signature:** ✅ Signed with Ed25519
**Verify:** [Get Public Key](/api/keys/public)

| Time (UTC) | Level | Type | Payload |
|---|---|---|---|
...
```

### PDF Export (signiert)
```bash
GET /api/audit/export?format=pdf&signed=1&title=NEMO%20Trail

Response: HTML mit Signatur-Fußzeile + QR-Code
- Event-Liste
- Signatur-Box mit:
  ✅ Base64 Signature
  ✅ SHA-256 Checksum
  ✅ Key ID
  ✅ Timestamp
  ✅ QR-Code zur Verifikation
  ✅ Print Button
```

---

## ✅ Signatur-Verifikation

### Schritt 1: Public Key holen
```bash
curl https://viewunitysystem.github.io/OnAirMulTiMedia/api/keys/public > oamtm-public.pem
```

### Schritt 2: Export mit Signatur holen
```bash
curl "https://viewunitysystem.github.io/OnAirMulTiMedia/api/audit/export?format=json&signed=1" > export.json
```

### Schritt 3: Signatur prüfen (Node.js)
```javascript
const crypto = require('crypto');
const fs = require('fs');

// Load export
const exportData = JSON.parse(fs.readFileSync('export.json', 'utf8'));
const { events, exported_at, total_events, signature } = exportData;

// Load public key
const publicKey = fs.readFileSync('oamtm-public.pem', 'utf8');

// Reconstruct signed data
const dataToVerify = {
  events,
  exported_at,
  total_events,
  key_id: signature.key_id
};

// Verify signature
const verify = crypto.createVerify('SHA256');
verify.update(JSON.stringify(dataToVerify));
verify.end();

const isValid = verify.verify(publicKey, signature.signature, 'base64');

console.log('Signature valid:', isValid); // true ✅
```

### Schritt 4: Checksum prüfen
```javascript
const hash = crypto.createHash('sha256');
hash.update(JSON.stringify(dataToVerify));
const calculatedChecksum = hash.digest('hex');

console.log('Checksum match:', calculatedChecksum === signature.checksum); // true ✅
```

---

## 🔒 Sicherheit

### Private Key Schutz
```bash
# .gitignore enthält:
keys/oamtm-private.pem

# Niemals:
❌ Private Key ins Repository committen
❌ Private Key per Email senden
❌ Private Key in Logs schreiben
❌ Private Key in Umgebungsvariablen

# Immer:
✅ Private Key lokal speichern (keys/)
✅ Sichere Dateiberechtigungen (chmod 600)
✅ Backup an sicheren Ort
✅ Rotation bei Kompromittierung
```

### Public Key Distribution
```bash
# Public Key ist öffentlich verfügbar:
✅ /api/keys/public Endpoint
✅ Kann ins Repository committed werden
✅ Kann öffentlich verteilt werden
✅ Wird für Verifikation benötigt
```

---

## 📊 Use Cases

### 1. Regulatorische Nachweise
```bash
# Behörde fordert Audit-Trail an
GET /api/audit/export?format=pdf&signed=1&type=DIRECTION_CHANGE&title=BNetzA%20Nachweis

# Behörde erhält:
✅ Vollständiger Audit-Trail
✅ Digital signiert
✅ QR-Code zur Verifikation
✅ Prüfbar mit Public Key
```

### 2. Rechtliche Dokumentation
```bash
# Notarielle Beglaubigung
GET /api/audit/export?format=json&signed=1&limit=1000

# Notar kann prüfen:
✅ Signatur mit Public Key
✅ SHA-256 Checksum
✅ Timestamp
✅ Unveränderlichkeit
```

### 3. Community Transparenz
```bash
# Öffentlicher Audit-Trail
GET /api/audit/export?format=md&signed=1&type=GITHUB_UPDATE

# Community erhält:
✅ Nachweisbaren Trail
✅ Verifizierbare Signatur
✅ Public Key zum Prüfen
```

---

## 🧪 Testing

### Lokal testen
```bash
# Server starten
npm start

# Public Key abrufen
curl http://localhost:8080/api/keys/public

# Signierten Export testen
curl "http://localhost:8080/api/audit/export?format=json&signed=1"

# Verifikation testen
node verify-signature.js
```

### Online testen (GitHub Pages)
```bash
# Public Key (wird mit Server deployed)
https://viewunitysystem.github.io/OnAirMulTiMedia/api/keys/public

# Signierter Export (server muss laufen)
http://localhost:8080/api/audit/export?format=json&signed=1
```

---

## 📚 Technische Details

### Ed25519
- **Typ:** EdDSA (Edwards-curve Digital Signature Algorithm)
- **Curve:** Curve25519
- **Key Size:** 256 bits
- **Signature Size:** 512 bits
- **Performance:** Sehr schnell (schneller als RSA)
- **Security:** Hoch (resistent gegen Side-Channel-Attacks)

### SHA-256
- **Typ:** Cryptographic Hash Function
- **Output:** 256 bits (32 bytes)
- **Hex String:** 64 characters
- **Purpose:** Data integrity verification

---

## 🔄 Schlüssel-Rotation

### Wann rotieren?
- ✅ Einmal jährlich (best practice)
- ✅ Bei Kompromittierung
- ✅ Bei Server-Wechsel
- ✅ Bei Policy-Änderung

### Wie rotieren?
```bash
# 1. Alte Keys sichern
mv keys/oamtm-public.pem keys/oamtm-public-2024.pem.old
mv keys/oamtm-private.pem keys/oamtm-private-2024.pem.old

# 2. Neue Keys generieren
rm keys/*.pem
npm start  # Server generiert automatisch neue

# 3. Public Key deployen
git add keys/oamtm-public.pem
git commit -m "rotate: New Ed25519 keys for 2025"
git push

# 4. Alte Signaturen bleiben mit altem Public Key verifizierbar
```

---

## ⚖️ Rechtliche Hinweise

### OAMTM Signatur-Policy
- **Gültigkeit:** Signaturen sind dauerhaft gültig solange Public Key verfügbar
- **Verantwortung:** Operator (DD5BE) ist verantwortlich für Private Key Schutz
- **Haftung:** Keine Haftung bei Key-Kompromittierung
- **Transparenz:** Public Key ist öffentlich verfügbar

### Regulatorische Compliance
- ✅ **BNetzA:** Signaturen unterstützen Nachweispflicht
- ✅ **RDI:** Audit-Trail mit Signatur erfüllt Transparenz-Anforderungen
- ✅ **GDPR:** Kein PII in Signaturen

---

## 📞 Support

**Bei Fragen zur Signatur-Verifikation:**
- Operator: Raymond Demitrio Dr. Tel (DD5BE)
- Public Key: `/api/keys/public`
- Dokumentation: Dieses Dokument

---

**🔐 Ed25519 - 110% Security for OAMTM**  
**mainzero - Ursprung auditierter Wahrheit**  
**DD5BE - Raymond Demitrio Dr. Tel**

