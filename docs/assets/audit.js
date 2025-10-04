const $ = (s,root=document)=>root.querySelector(s);
const $$= (s,root=document)=>Array.from(root.querySelectorAll(s));

async function loadAudit(){
  try {
    const r = await fetch('./audit-run.json', { cache:'no-store' });
    if (!r.ok) throw new Error('no json');
    return await r.json();
  } catch {
    return null; // Fallback
  }
}

function fillTiles(run){
  $('#ciTrigger').textContent = run?.ci?.trigger || 'Auto Module Detector';
  $('#ciDetails').textContent = run?.ci?.details || 'Kontinuierliches File-Watching aktiv';
  $('#hil').textContent = run?.hil?.status || 'Aktiv';
  $('#hilDetails').textContent = (run?.hil?.components||[]).join(', ') || 'Real-time Module Detection';
  const mods = run?.modules || [];
  $('#modCount').textContent = `${mods.length} Module`;
  const ok = mods.filter(m=>m.status==='aktiv' || m.status==='Aktiv').length;
  $('#modSummary').textContent = `${ok}/${mods.length} aktiv`;
  $('#ts').textContent = run?.timestamp || run?.ts || new Date().toISOString();
  $('#commit').textContent = run?.commit ? `Commit ${run.commit}` : 'Auto-detected';
}

function row(mod){
  const tpl = document.getElementById('tplRow');
  const tr = tpl.content.firstElementChild.cloneNode(true);
  $('.col-name', tr).textContent   = mod.name;
  $('.col-status', tr).textContent = mod.status || 'aktiv';
  $('.col-audit', tr).textContent  = mod.auditierbar ? 'Ja' : 'Nein';
  $('.col-cert', tr).textContent   = mod.zertifiziert ? 'Ja' : 'Nein';
  return tr;
}

function fillModules(run){
  const body = $('#modTable tbody');
  body.innerHTML = '';
  (run?.modules||[]).forEach(m=> body.appendChild(row(m)) );
}

function fillChecks(listEl, list){
  listEl.innerHTML = '';
  list.forEach(x=>{
    const li = document.createElement('li');
    li.textContent = x.text;
    li.className = x.ok ? 'ok' : 'fail';
    listEl.appendChild(li);
  });
}

function downloadJson(obj, name='audit-manifest.json'){
  const blob = new Blob([JSON.stringify(obj,null,2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

async function main(){
  const run = await loadAudit();
  const fallback = {
    timestamp: new Date().toISOString(),
    ci: { trigger: 'Auto Module Detector', details: 'File-Watching aktiv' },
    hil: { status: 'Aktiv', components: ['Real-time Detection','Auto Scanner','File Watcher'] },
    modules: [
      { name:'Main Portal', status:'aktiv', auditierbar:true, zertifiziert:true },
      { name:'Info Dashboard', status:'aktiv', auditierbar:true, zertifiziert:true },
      { name:'Test Client', status:'aktiv', auditierbar:true, zertifiziert:true },
      { name:'Audit Overlay', status:'aktiv', auditierbar:true, zertifiziert:true },
      { name:'Blueprints', status:'aktiv', auditierbar:true, zertifiziert:true }
    ],
    regulatory: {
      de: ['Frequenzbereiche dokumentiert','CE/RED‑Konformität sichtbar','Audit‑Trail vorhanden','Neuro‑Interface experimentell'],
      nl: ['RDI‑NL kompatibel','Auditierbare Kommunikation dokumentiert','Zertifizierungsengine erreichbar']
    },
    harmony: ['Synchronisation aller Layer','UI↔Backend↔Audit↔Security harmonisiert','Selbstreflexion aktiv']
  };

  const data = run || fallback;
  if (!run) {
    document.getElementById('fallback').hidden = false;
    console.log('⚠️ Using fallback data - audit-run.json not found');
  } else {
    console.log(`✅ Loaded audit data with ${data.modules?.length || 0} modules`);
  }

  fillTiles(data);
  fillModules(data);

  fillChecks(document.getElementById('regList'), [
    { text:'🇩🇪 Frequenzbereiche dokumentiert',              ok: data.regulatory?.de?.includes('Frequenzbereiche dokumentiert') },
    { text:'🇩🇪 CE/RED‑Konformität sichtbar',               ok: data.regulatory?.de?.includes('CE/RED‑Konformität sichtbar') },
    { text:'🇩🇪 Audit‑Trail vorhanden',                     ok: data.regulatory?.de?.includes('Audit‑Trail vorhanden') },
    { text:'🇩🇪 Neuro‑Interface experimentell',             ok: data.regulatory?.de?.includes('Neuro‑Interface experimentell') },
    { text:'🇳🇱 RDI‑NL kompatibel',                         ok: data.regulatory?.nl?.includes('RDI‑NL kompatibel') },
    { text:'🇳🇱 Auditierbare Kommunikation dokumentiert',   ok: data.regulatory?.nl?.includes('Auditierbare Kommunikation dokumentiert') },
    { text:'🇳🇱 Zertifizierungsengine erreichbar',          ok: data.regulatory?.nl?.includes('Zertifizierungsengine erreichbar') }
  ]);

  fillChecks(document.getElementById('harmList'), [
    { text:'Synchronisation aller Layer',         ok: data.harmony?.includes('Synchronisation aller Layer') },
    { text:'UI↔Backend↔Audit↔Security harmonisch',ok: data.harmony?.includes('UI↔Backend↔Audit↔Security harmonisiert') },
    { text:'Selbstreflexion aktiv',               ok: data.harmony?.includes('Selbstreflexion aktiv') }
  ]);

  document.getElementById('btnJson').addEventListener('click', ()=>downloadJson(data));
  document.getElementById('btnPdf').addEventListener('click', ()=>window.print());

  document.getElementById('app').hidden = false;
}

addEventListener('DOMContentLoaded', main);
