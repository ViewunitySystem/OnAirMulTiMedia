const API = 'https://oamtm-api.example.workers.dev'; // Cloudflare Worker Endpoint
const $ = s => document.querySelector(s);

$('#aiDraft').addEventListener('click', async () => {
  const title = $('#title').value.trim();
  const desc  = $('#desc').value.trim();
  const target= $('#target').value;
  
  if (!title || !desc) {
    setStatus('Bitte Titel und Beschreibung ausfüllen', 'error');
    return;
  }
  
  setStatus('AI generiert Vorschlag …');
  
  try {
    const r = await fetch(API+'/ai/draft', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title,desc,target})
    });
    const j = await r.json();
    $('#code').value = j.code || '// kein Vorschlag verfügbar';
    setStatus('Vorschlag erstellt. Prüfe/ändere den Code und nutze Vorschau.', 'success');
  } catch (error) {
    setStatus('Fehler beim AI-Vorschlag: ' + error.message, 'error');
  }
});

$('#preview').addEventListener('click', () => {
  const code = $('#code').value.trim();
  if (!code) {
    setStatus('Bitte Code eingeben für Vorschau', 'error');
    return;
  }
  
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Preview</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #f0f0f0; }
    .preview-container { background: white; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="preview-container">
    <h3>Live Preview</h3>
    <div id="preview-content"></div>
  </div>
  <script>
    try {
      ${escapeJs(code)}
    } catch (error) {
      document.getElementById('preview-content').innerHTML = 
        '<p style="color: red;">Fehler: ' + error.message + '</p>';
    }
  </script>
</body>
</html>`;
  
  const blob = new Blob([html], {type:'text/html'});
  $('#sandbox').src = URL.createObjectURL(blob);
  setStatus('Vorschau aktualisiert', 'success');
});

$('#submit').addEventListener('click', async () => {
  const payload = {
    title: $('#title').value.trim(),
    description: $('#desc').value.trim(),
    target: $('#target').value,
    code: $('#code').value.trim()
  };
  
  if (!payload.title || !payload.description || !payload.code) {
    setStatus('Bitte alle Felder ausfüllen', 'error');
    return;
  }
  
  setStatus('Sende zur Prüfung …');
  
  try {
    const r = await fetch(API+'/submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const j = await r.json();
    
    if (j.ok) {
      setStatus(`✅ Eingereicht: PR #${j.pr} - ${j.url}`, 'success');
      // Reset form
      $('#title').value = '';
      $('#desc').value = '';
      $('#code').value = '';
    } else {
      setStatus(`❌ Fehler: ${j.error}`, 'error');
    }
  } catch (error) {
    setStatus('Fehler beim Einreichen: ' + error.message, 'error');
  }
});

function escapeJs(s) {
  return s.replace(/<\/(script)/gi,'<\\/$1')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setStatus(text, type = '') {
  const status = $('#status');
  status.textContent = text;
  status.className = 'muted';
  if (type === 'success') status.className += ' success';
  if (type === 'error') status.className += ' error';
}
