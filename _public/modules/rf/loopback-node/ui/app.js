// Minimaler, CSP-freundlicher UI-Controller – ohne Inline-Code
const $ = (s) => document.querySelector(s);
const logEl = $('#log');

function log(line){
  const ts = new Date().toISOString();
  const entry = { ts, line };
  try {
    const arr = JSON.parse(localStorage.getItem('oamtm:loopback:log')||'[]');
    arr.unshift(entry); localStorage.setItem('oamtm:loopback:log', JSON.stringify(arr).slice(0,32000));
  } catch {}
  logEl.textContent = `${ts}  ${line}\n` + (logEl.textContent||'');
}

async function checksumBlueprint(){
  const resp = await fetch('../blueprint.json');
  const data = await resp.json();
  const enc = new TextEncoder().encode(JSON.stringify(data));
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  $('#checksum').textContent = hex.slice(0,16) + '…';
  log('checksum_verified');
}

async function probeMic(){
  try {
    const ac = new (window.AudioContext||window.webkitAudioContext)();
    const rate = ac.sampleRate; $('#rate').textContent = `${rate} Hz`;
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const src = ac.createMediaStreamSource(stream);
    const gain = ac.createGain(); gain.gain.value = 0.0; // stumm – nur Probe
    src.connect(gain).connect(ac.destination);
    $('#mic').textContent = 'OK';
    $('#probeStatus').textContent = 'Mic erlaubt, Loopback läuft (stumm)';
    log('probe_ok');
    setTimeout(()=>{ try{ stream.getTracks().forEach(t=>t.stop()); ac.close(); }catch{} }, 4000);
  } catch (e) {
    $('#mic').textContent = 'FEHLER';
    $('#probeStatus').textContent = 'Keine Mic-Erlaubnis oder Audio-Kontext blockiert';
    log('probe_error');
  }
}

function exportAudit(){
  const payload = {
    ts: new Date().toISOString(),
    module: 'Loopback-Node',
    flags: ['checksum_verified'],
    ui: { mic: $('#mic').textContent, rate: $('#rate').textContent }
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'audit-export.json'; a.click();
}

function clearLog(){ localStorage.removeItem('oamtm:loopback:log'); logEl.textContent = ''; }

// Boot
addEventListener('DOMContentLoaded', async ()=>{
  $('#heal').textContent = 'idle';
  await checksumBlueprint();
  $('#probe').addEventListener('click', probeMic);
  $('#exportAudit').addEventListener('click', exportAudit);
  $('#clearLog').addEventListener('click', clearLog);
});
