# 📊 GitHub Info Dashboard - Universal Template

**Wiederverwendbares System für alle ViewunitySystem & ViewunitySystemT Repositories**

## 🎯 Features

- ⭐ **Live GitHub-Statistiken**: Stars, Forks, Watcher, Issues
- 📦 **Release-Downloads**: Summe aller Asset-Downloads  
- 💬 **Community-Beiträge**: Nutzer können Infos einreichen
- ✅ **Moderation**: Approve via API mit Admin-Key
- 🔄 **Auto-Refresh**: Statistiken alle 10 Minuten
- 🔒 **XSS-sicher**: textContent-Rendering
- 🎨 **Dark Theme**: Responsive Design

---

## 🚀 Integration in bestehende Repos (3 Optionen)

### **Option A: Standalone HTML (kein Server nötig)**

```html
<!-- Kopiere public/info.html in dein Repo -->
<!-- Passe an Zeile 31 an: -->
<a href="https://github.com/ViewunitySystem/DEIN-REPO" target="_blank">GitHub Repo ↗</a>

<!-- In Script-Teil (Zeile 76) anpassen: -->
<script>
  const GITHUB_REPO = 'ViewunitySystem/DEIN-REPO';
  const GITHUB_TOKEN = null; // Optional für höhere Rate Limits
  
  // Direkter GitHub API Call (ohne eigenen Server)
  async function loadStats(){
    const headers = { 'Accept': 'application/vnd.github+json' };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    
    const repo = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers }).then(r=>r.json());
    const releases = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`, { headers }).then(r=>r.json());
    
    let downloads = 0;
    for (const r of releases){
      for (const a of (r.assets || [])) downloads += a.download_count || 0;
    }
    
    document.getElementById('stars').textContent = repo.stargazers_count;
    document.getElementById('forks').textContent = repo.forks_count;
    document.getElementById('watchers').textContent = repo.subscribers_count;
    document.getElementById('issues').textContent = repo.open_issues_count;
    document.getElementById('releases').textContent = releases.length;
    document.getElementById('downloads').textContent = downloads;
    document.getElementById('latest').textContent = releases[0]?.tag_name || '–';
    document.getElementById('ts').textContent = new Date().toLocaleString();
  }
  
  loadStats();
  setInterval(loadStats, 10 * 60 * 1000); // 10 Minuten
</script>
```

**✅ Vorteile**: Keine Server-Abhängigkeit, funktioniert auf GitHub Pages  
**⚠️ Nachteile**: Keine Community-Beiträge, GitHub Rate Limits (60/h unauthenticated)

---

### **Option B: Backend-Integration (mit Server)**

Kopiere diese Dateien in dein Backend-Projekt:

#### 1. **Database Schema** (SQL)
```sql
CREATE TABLE IF NOT EXISTS github_stats (
  ts INTEGER PRIMARY KEY,
  repo TEXT NOT NULL,
  stars INTEGER,
  forks INTEGER,
  watchers INTEGER,
  open_issues INTEGER,
  release_count INTEGER,
  release_downloads INTEGER,
  latest_release_tag TEXT
);

CREATE TABLE IF NOT EXISTS user_contribs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  content TEXT NOT NULL,
  created_at INTEGER,
  approved INTEGER DEFAULT 0
);
```

#### 2. **Server Endpoints** (Express Example)
```javascript
// GitHub Stats Endpoints
app.get('/api/github/stats', (req, res) => {
  const row = db.prepare('SELECT * FROM github_stats ORDER BY ts DESC LIMIT 1;').get();
  if (!row) return res.status(404).json({ error: 'no stats yet' });
  res.json(row);
});

app.get('/api/github/history', (req, res) => {
  const limit = Number(req.query.limit || 200);
  const rows = db.prepare('SELECT * FROM github_stats ORDER BY ts DESC LIMIT ?;').all(limit);
  res.json(rows);
});

app.post('/api/github/refresh', async (req, res) => {
  const key = req.headers['x-admin-key'] || '';
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const payload = await refreshGitHubStats();
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Community Contributions
app.get('/api/contribs', (req, res) => {
  const limit = Number(req.query.limit || 100);
  const rows = db.prepare('SELECT * FROM user_contribs WHERE approved = 1 ORDER BY created_at DESC LIMIT ?;').all(limit);
  res.json(rows);
});

app.post('/api/contribs', (req, res) => {
  const { user_id = 'anon', content } = req.body || {};
  if (!content || content.length < 5) return res.status(400).json({ error: 'content too short' });
  if (content.length > 2000) return res.status(400).json({ error: 'content too long' });
  const id = nanoid();
  db.prepare('INSERT INTO user_contribs (id, user_id, content, created_at, approved) VALUES (?, ?, ?, ?, 0);')
    .run(id, String(user_id).slice(0, 64), content, Date.now());
  res.json({ id, queued: true });
});

app.post('/api/contribs/:id/approve', (req, res) => {
  const key = req.headers['x-admin-key'] || '';
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
  db.prepare('UPDATE user_contribs SET approved = 1 WHERE id = ?;').run(req.params.id);
  res.json({ ok: true });
});
```

#### 3. **Auto-Refresh Scheduler**
```javascript
async function refreshGitHubStats() {
  const GITHUB_REPO = process.env.GITHUB_REPO || 'ViewunitySystem/YourRepo';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;
  
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  
  const repo = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers }).then(r => r.json());
  const releases = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`, { headers }).then(r => r.json());
  
  let downloads = 0;
  let latestTag = null;
  for (const r of releases) {
    latestTag = latestTag || r.tag_name;
    for (const a of (r.assets || [])) downloads += a.download_count || 0;
  }
  
  const ts = Date.now();
  db.prepare(`INSERT OR REPLACE INTO github_stats (ts, repo, stars, forks, watchers, open_issues, release_count, release_downloads, latest_release_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`)
    .run(ts, GITHUB_REPO, repo.stargazers_count || 0, repo.forks_count || 0, repo.subscribers_count || 0, repo.open_issues_count || 0, releases.length || 0, downloads, latestTag || null);
  
  return { ts, repo: GITHUB_REPO, stars: repo.stargazers_count, downloads };
}

// Schedule refresh every 10 minutes
setInterval(() => { refreshGitHubStats().catch(() => {}); }, 10 * 60 * 1000);
refreshGitHubStats().catch(() => {});
```

#### 4. **Frontend (info.html)**
Kopiere `public/info.html` und passe die API-URLs an:
```javascript
// In info.html Script-Bereich anpassen:
async function loadStats(){
  const r = await fetch('/api/github/stats'); // Deine API-URL
  if (!r.ok) return;
  const s = await r.json();
  // ... Rest bleibt gleich
}
```

**✅ Vorteile**: Volle Features, Community-Beiträge, keine Rate-Limits  
**⚠️ Nachteile**: Backend erforderlich

---

### **Option C: GitHub Pages mit GitHub Actions**

Erstelle `.github/workflows/update-stats.yml`:

```yaml
name: Update GitHub Stats

on:
  schedule:
    - cron: '*/10 * * * *'  # Alle 10 Minuten
  workflow_dispatch:  # Manuelle Ausführung

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Fetch GitHub Stats
        run: |
          REPO="${{ github.repository }}"
          TOKEN="${{ secrets.GITHUB_TOKEN }}"
          
          # Repo Stats
          curl -H "Authorization: Bearer $TOKEN" \
               -H "Accept: application/vnd.github+json" \
               https://api.github.com/repos/$REPO > stats.json
          
          # Releases
          curl -H "Authorization: Bearer $TOKEN" \
               -H "Accept: application/vnd.github+json" \
               https://api.github.com/repos/$REPO/releases?per_page=100 > releases.json
          
          # Generate HTML
          node generate-stats.js
      
      - name: Commit Stats
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add stats.json releases.json info.html
          git diff --quiet && git diff --staged --quiet || git commit -m "Update GitHub stats $(date)"
          git push
```

**✅ Vorteile**: Automatisch, keine eigene Infrastruktur  
**⚠️ Nachteile**: Nur auf GitHub Pages, keine Community-Beiträge

---

## 🛠️ Quick-Setup für alle Repos

### **Schritt 1: Template-Dateien kopieren**
```bash
# Für jedes Repo:
cd /path/to/your/repo

# Kopiere info.html
cp /path/to/hackathon-bridge/public/info.html ./docs/info.html

# Oder für GitHub Pages:
cp /path/to/hackathon-bridge/public/info.html ./info.html
```

### **Schritt 2: Repo-Namen anpassen**
```bash
# In info.html (Zeile 31 & Script):
sed -i 's/ViewunitySystem\/OnAirMulTiMedia/ViewunitySystem\/DEIN-REPO/g' info.html
```

### **Schritt 3: Optional - Backend-Integration**
Wenn dein Repo ein Backend hat:
```bash
# Kopiere Server-Code
cp /path/to/hackathon-bridge/server.js ./server/github-stats.js

# Installiere Dependencies
npm install better-sqlite3 nanoid undici
```

### **Schritt 4: GitHub Pages aktivieren**
- Gehe zu Repo Settings → Pages
- Source: `main` branch, `/docs` oder `/` folder
- Fertig! → `https://viewunitysystem.github.io/DEIN-REPO/info.html`

---

## 📋 Batch-Setup für alle Repos

### **PowerShell Script** (Windows)
```powershell
# Liste aller Repos
$repos = @(
    "OnAirMulTiMedia",
    "repo2",
    "repo3"
    # ... weitere Repos
)

$template = "D:\Productions\HFRF\hfrf-universal-sdr\hackathon-bridge\public\info.html"

foreach ($repo in $repos) {
    Write-Host "Setting up $repo..."
    
    # Clone Repo (falls nicht vorhanden)
    if (-not (Test-Path "D:\Repos\$repo")) {
        git clone "https://github.com/ViewunitySystem/$repo.git" "D:\Repos\$repo"
    }
    
    # Kopiere Template
    Copy-Item $template "D:\Repos\$repo\info.html"
    
    # Ersetze Repo-Namen
    (Get-Content "D:\Repos\$repo\info.html") -replace 'ViewunitySystem/OnAirMulTiMedia', "ViewunitySystem/$repo" | Set-Content "D:\Repos\$repo\info.html"
    
    # Commit & Push
    cd "D:\Repos\$repo"
    git add info.html
    git commit -m "Add GitHub Info Dashboard"
    git push origin main
}
```

### **Bash Script** (Linux/Mac)
```bash
#!/bin/bash

REPOS=(
    "OnAirMulTiMedia"
    "repo2"
    "repo3"
)

TEMPLATE="/path/to/hackathon-bridge/public/info.html"

for repo in "${REPOS[@]}"; do
    echo "Setting up $repo..."
    
    # Clone if needed
    [ ! -d "$HOME/repos/$repo" ] && git clone "https://github.com/ViewunitySystem/$repo.git" "$HOME/repos/$repo"
    
    # Copy template
    cp "$TEMPLATE" "$HOME/repos/$repo/info.html"
    
    # Replace repo name
    sed -i "s/ViewunitySystem\/OnAirMulTiMedia/ViewunitySystem\/$repo/g" "$HOME/repos/$repo/info.html"
    
    # Commit & Push
    cd "$HOME/repos/$repo"
    git add info.html
    git commit -m "Add GitHub Info Dashboard"
    git push origin main
done
```

---

## 🔐 Umgebungsvariablen (für Backend-Option)

Erstelle `.env` in jedem Repo:
```env
# GitHub Configuration
GITHUB_REPO=ViewunitySystem/DeinRepo
GITHUB_TOKEN=ghp_deinTokenHier  # Optional für höhere Rate Limits

# Admin Configuration
ADMIN_KEY=deinSicheresPasswort123  # Für Moderation

# Server Configuration
PORT=8080
NODE_ENV=production
```

---

## 📊 Moderation von Community-Beiträgen

### **Alle pending Beiträge anzeigen**
```sql
SELECT * FROM user_contribs WHERE approved = 0 ORDER BY created_at DESC;
```

### **Beitrag freigeben**
```bash
curl -X POST https://yourdomain.com/api/contribs/BEITRAG-ID/approve \
  -H "X-ADMIN-KEY: deinAdminKey"
```

### **Beitrag ablehnen (löschen)**
```sql
DELETE FROM user_contribs WHERE id = 'BEITRAG-ID';
```

---

## 🎨 Anpassungen

### **Corporate Colors**
```css
/* In info.html <style> Bereich: */
:root {
  --primary: #your-brand-color;
  --background: #0b1020;
  --card: #111827;
}
```

### **Spenden-Link ändern**
```html
<!-- Zeile 68 in info.html: -->
<a href="https://your-donation-link.com" target="_blank">Deine Spendenseite ↗</a>
```

### **Zusätzliche Stats**
```javascript
// In loadStats() Funktion:
document.getElementById('custom-stat').textContent = repo.your_custom_metric;
```

---

## 📞 Support

- **Issues**: https://github.com/ViewunitySystem/OnAirMulTiMedia/issues
- **Email**: gentlyoverdone@outlook.com
- **Template Updates**: Automatisch via `git pull` in hackathon-bridge

---

**© 2025 Raymond Demitrio Dr. Tel**  
*Universal GitHub Info Dashboard Template für alle ViewunitySystem Repositories*

