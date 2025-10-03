# 💾 Backup & Recovery

**Versionierte Datensicherung mit 3-2-1 Strategie**

---

## 🎯 Purpose

Backup & Recovery provides automatic, versioned backups with easy recovery for:

- ⚙️ System configurations
- 📊 Audit logs
- 👤 User settings
- 🔐 License cache
- 📡 Module state
- 📝 QSO logs

**Key Features:**
- 🔄 Automatic scheduled backups (hourly, daily, weekly)
- 📦 Versioned snapshots with retention policy
- 🗜️ Compression (gzip, bz2, xz)
- 🔐 Encryption (AES-256-GCM)
- ☁️ Multiple backends (Local, S3, SFTP, Mega.nz)
- ⚡ Fast incremental backups
- 🔍 Integrity verification (checksums)
- 📊 Audit integration

---

## 🚀 Quick Start

```javascript
const { BackupManager } = require('./main.js');

const backup = new BackupManager({
  schedule: 'daily',
  retention: {
    hourly: 24,
    daily: 30,
    monthly: 12
  },
  backends: [
    { type: 'local', path: './backups' },
    { type: 's3', bucket: 'oamtm-backups', region: 'eu-central-1' }
  ],
  encryption: {
    enabled: true,
    key: process.env.BACKUP_KEY
  }
});

// Manual backup
const snapshot = await backup.create({
  name: 'pre-update',
  tags: ['manual', 'v1.0.0'],
  include: ['config', 'audit', 'users']
});

console.log('Backup created:', snapshot.id);
// Output: backup_20250110_143000_abc123

// List backups
const backups = await backup.list();
console.log('Available backups:', backups.length);

// Restore
await backup.restore({
  snapshot_id: 'backup_20250110_143000_abc123',
  target: './restore',
  verify: true
});
```

---

## 📋 Backup Strategy

### 3-2-1 Rule

✅ **3** copies of data  
✅ **2** different storage media  
✅ **1** off-site copy  

```
Primary Data (Production)
    ↓
Local Backup (SSD)
    ↓
Network Backup (NAS)
    ↓
Cloud Backup (S3 / Mega.nz)
```

### Retention Policy

| Type | Frequency | Retention | Example |
|------|-----------|-----------|---------|
| **Full** | Daily 03:00 UTC | 30 days | 30 full backups |
| **Incremental** | Hourly | 24 hours | 24 incremental backups |
| **Snapshot** | Before releases | 12 months | Tagged versions |
| **Monthly** | 1st of month | 12 months | 12 monthly archives |

```javascript
const retentionPolicy = {
  hourly: {
    keep: 24,         // Keep 24 hourly backups
    type: 'incremental'
  },
  daily: {
    keep: 30,         // Keep 30 daily backups
    type: 'full'
  },
  monthly: {
    keep: 12,         // Keep 12 monthly backups
    type: 'full',
    compress: 'xz'    // Extra compression for long-term
  }
};
```

---

## 🗂️ Backup Content

### What Gets Backed Up

```yaml
Configurations:
  - config/*.toml
  - .env (encrypted)
  - presets/*.json
  
Audit Logs:
  - audit/logs/*.log
  - audit/events/*.json
  - audit/trails/*.md
  
User Data:
  - users/*.json
  - licenses-cache.db
  - settings/*.json
  
Module State:
  - modules/*/state.json
  - modules/*/cache.db
  
QSO Logs:
  - qso-log.adi
  - qso-log.db
  - contacts.json
```

### What Gets Excluded

```yaml
Excluded:
  - node_modules/
  - target/ (Rust build artifacts)
  - *.tmp, *.bak, *.swp
  - *.log (except audit/)
  - data/uploads/ (too large, handle separately)
```

---

## 📦 Snapshot Format

```
backup_20250110_143000_abc123/
├── manifest.json          # Metadata
├── checksums.sha256       # Integrity verification
├── config/
│   ├── bands.toml.gz
│   └── hardware_profiles.toml.gz
├── audit/
│   ├── logs.tar.gz
│   └── events.tar.gz
├── users/
│   └── users.tar.gz.enc  # Encrypted
└── modules/
    ├── global-meeting-clock/
    ├── canvas-swipe/
    ├── rf-validation/
    └── backup-recovery/
```

**manifest.json**:
```json
{
  "id": "backup_20250110_143000_abc123",
  "created_at": "2025-01-10T14:30:00.000Z",
  "unix_ts": 1736519400000,
  "type": "full",
  "size_bytes": 52428800,
  "size_human": "50 MB",
  "compressed": true,
  "encrypted": true,
  "tags": ["manual", "pre-update"],
  "includes": ["config", "audit", "users", "modules"],
  "checksums": {
    "algorithm": "sha256",
    "manifest_hash": "a1b2c3d4...",
    "files": {
      "config/bands.toml.gz": "e5f6g7h8...",
      "audit/logs.tar.gz": "i9j0k1l2..."
    }
  },
  "retention": {
    "expires_at": "2025-02-09T14:30:00.000Z",
    "keep_until": "permanent"
  },
  "backends": [
    {"type": "local", "path": "./backups", "status": "ok"},
    {"type": "s3", "bucket": "oamtm-backups", "status": "ok"}
  ]
}
```

---

## 🔧 Implementation

### Create Backup

```javascript
class BackupManager {
  async create(options = {}) {
    const id = this.generateBackupId();
    const tempDir = `/tmp/backup_${id}`;
    
    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // 2. Copy files
    const includes = options.include || ['config', 'audit', 'users', 'modules'];
    for (const category of includes) {
      await this.copyCategory(category, tempDir);
    }
    
    // 3. Compress
    if (this.config.compression) {
      await this.compress(tempDir, this.config.compression);
    }
    
    // 4. Encrypt
    if (this.config.encryption?.enabled) {
      await this.encrypt(tempDir, this.config.encryption.key);
    }
    
    // 5. Generate checksums
    const checksums = await this.generateChecksums(tempDir);
    
    // 6. Create manifest
    const manifest = {
      id,
      created_at: new Date().toISOString(),
      unix_ts: Date.now(),
      type: options.type || 'full',
      size_bytes: await this.getDirectorySize(tempDir),
      compressed: !!this.config.compression,
      encrypted: !!this.config.encryption?.enabled,
      tags: options.tags || [],
      includes,
      checksums
    };
    
    await fs.writeFile(`${tempDir}/manifest.json`, JSON.stringify(manifest, null, 2));
    
    // 7. Upload to backends
    for (const backend of this.config.backends) {
      await this.uploadToBackend(tempDir, backend);
      manifest.backends.push({ ...backend, status: 'ok' });
    }
    
    // 8. Audit log
    await this.auditLogger.log({
      category: 'MODULE',
      type: 'backup_created',
      payload: { backup_id: id, size: manifest.size_bytes, backends: manifest.backends.length }
    });
    
    // 9. Cleanup
    await fs.rm(tempDir, { recursive: true });
    
    return manifest;
  }
  
  generateBackupId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
    const random = nanoid(6);
    return `backup_${date}_${time}_${random}`;
  }
}
```

### Restore Backup

```javascript
async restore(options) {
  const { snapshot_id, target = './restore', verify = true } = options;
  
  // 1. Download from backend
  const tempDir = `/tmp/restore_${nanoid()}`;
  await this.downloadFromBackend(snapshot_id, tempDir);
  
  // 2. Verify checksums
  if (verify) {
    const manifest = JSON.parse(await fs.readFile(`${tempDir}/manifest.json`, 'utf8'));
    const valid = await this.verifyChecksums(tempDir, manifest.checksums);
    
    if (!valid) {
      throw new Error('Checksum verification failed! Backup may be corrupt.');
    }
  }
  
  // 3. Decrypt
  if (this.config.encryption?.enabled) {
    await this.decrypt(tempDir, this.config.encryption.key);
  }
  
  // 4. Decompress
  if (this.config.compression) {
    await this.decompress(tempDir, this.config.compression);
  }
  
  // 5. Restore files
  await fs.cp(tempDir, target, { recursive: true });
  
  // 6. Audit log
  await this.auditLogger.log({
    category: 'MODULE',
    type: 'backup_restored',
    payload: { backup_id: snapshot_id, target }
  });
  
  // 7. Cleanup
  await fs.rm(tempDir, { recursive: true });
  
  return { success: true, restored_to: target };
}
```

---

## 🔐 Encryption

**Algorithm**: AES-256-GCM (Galois/Counter Mode)

```javascript
const crypto = require('crypto');

function encrypt(inputFile, outputFile, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);
  
  // Write IV first
  output.write(iv);
  
  input.pipe(cipher).pipe(output);
  
  return new Promise((resolve, reject) => {
    output.on('finish', () => {
      // Append auth tag
      const authTag = cipher.getAuthTag();
      output.write(authTag);
      resolve();
    });
    output.on('error', reject);
  });
}

function decrypt(inputFile, outputFile, key) {
  const input = fs.readFileSync(inputFile);
  
  // Extract IV (first 16 bytes)
  const iv = input.slice(0, 16);
  
  // Extract auth tag (last 16 bytes)
  const authTag = input.slice(-16);
  
  // Extract ciphertext (middle)
  const ciphertext = input.slice(16, -16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  
  fs.writeFileSync(outputFile, plaintext);
}
```

---

## ☁️ Storage Backends

### Local Filesystem

```javascript
class LocalBackend {
  constructor(config) {
    this.path = config.path;
  }
  
  async upload(source, backupId) {
    const dest = `${this.path}/${backupId}`;
    await fs.cp(source, dest, { recursive: true });
  }
  
  async download(backupId, dest) {
    const source = `${this.path}/${backupId}`;
    await fs.cp(source, dest, { recursive: true });
  }
}
```

### AWS S3

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class S3Backend {
  constructor(config) {
    this.client = new S3Client({ region: config.region });
    this.bucket = config.bucket;
  }
  
  async upload(source, backupId) {
    const files = await this.listFiles(source);
    
    for (const file of files) {
      const key = `${backupId}/${file}`;
      const body = await fs.readFile(`${source}/${file}`);
      
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body
      }));
    }
  }
}
```

### Mega.nz

```javascript
const { Storage } = require('megajs');

class MegaBackend {
  constructor(config) {
    this.storage = new Storage({
      email: config.email,
      password: config.password
    });
  }
  
  async upload(source, backupId) {
    await this.storage.ready;
    
    const folder = await this.storage.mkdir(backupId);
    const files = await this.listFiles(source);
    
    for (const file of files) {
      const data = await fs.readFile(`${source}/${file}`);
      await folder.upload(file, data);
    }
  }
}
```

---

## 📊 Audit Integration

```json
{
  "category": "MODULE",
  "type": "backup_created",
  "payload": {
    "backup_id": "backup_20250110_143000_abc123",
    "type": "full",
    "size_bytes": 52428800,
    "compressed": true,
    "encrypted": true,
    "backends": ["local", "s3"],
    "duration_ms": 3456
  }
}
```

---

## 🧪 Testing

```javascript
describe('BackupManager', () => {
  it('should create and restore backup', async () => {
    const backup = new BackupManager({ backends: [{ type: 'local', path: './test-backups' }] });
    
    // Create
    const snapshot = await backup.create({ include: ['config'] });
    expect(snapshot.id).toMatch(/^backup_/);
    
    // Restore
    const result = await backup.restore({ snapshot_id: snapshot.id, target: './test-restore' });
    expect(result.success).toBe(true);
    
    // Verify
    const original = await fs.readFile('config/bands.toml', 'utf8');
    const restored = await fs.readFile('test-restore/config/bands.toml', 'utf8');
    expect(restored).toEqual(original);
  });
});
```

---

## 📞 Support

- **GitHub Issues**: https://github.com/ViewunitySystem/OnAirMulTiMedia/issues
- **Email**: gentlyoverdone@outlook.com
- **Maintainer**: Raymond Demitrio Dr. Tel (DD5BE)

---

© 2025 ViewunitySystem / TEL Portal  
Backup & Recovery - Versionierte Datensicherung mit 3-2-1 Strategie

