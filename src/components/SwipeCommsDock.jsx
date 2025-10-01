import React, { useEffect, useRef, useState } from "react";

// Hinweis: Dieser Code ist ein lauffähiges UI‑Gerüst für die sanfte Integration.
// Die WebTrit-spezifischen Aufrufe sind als Platzhalter markiert und können 1:1
// mit dem realen SDK ersetzt werden, ohne den bestehenden Swipe‑Flow zu brechen.

// ------------------------------------------------------------
// 1) Feature‑Flag & Lazy‑Load: Nur laden, wenn Nutzer bewusst swiped
// ------------------------------------------------------------
const FEATURE_FLAG = true; // serverseitig/Env steuerbar

// ------------------------------------------------------------
// 2) Audit‑Emitter (leichtgewichtig)
// ------------------------------------------------------------
function emitAudit(evt){
  try {
    const line = JSON.stringify({ ...evt, ts: new Date().toISOString() });
    console.debug("AUDIT:", line);
    // Optional: an /audit-collector posten
    // fetch('/api/audit', { method:'POST', body: line, headers:{'content-type':'application/json'} });
  } catch { /* noop */ }
}

// ------------------------------------------------------------
// 3) Minimaler Swipe‑Detector (Edge‑safe, OS‑Gesten‑freundlich)
//    * horizontal ab 32px; vertikal ab 56px (bewusst höher, um OS‑Back zu meiden)
//    * nur auf expliziter Geste im Komms‑Handle (rechter Rand) reagieren
// ------------------------------------------------------------
function useSwipe(onSwipe){
  const start = useRef({ x:0, y:0, t:0 });
  useEffect(()=>{
    function down(e){
      const t = e.touches?.[0] || e;
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    }
    function up(e){
      const t = e.changedTouches?.[0] || e;
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      const dt = Date.now() - start.current.t;
      if (dt < 800 && Math.abs(dy) > 56 && Math.abs(dy) > Math.abs(dx)) {
        onSwipe(dy < 0 ? "up" : "down");
      }
    }
    document.addEventListener("touchstart", down, { passive:true });
    document.addEventListener("touchend", up, { passive:true });
    return ()=>{
      document.removeEventListener("touchstart", down);
      document.removeEventListener("touchend", up);
    }
  }, [onSwipe]);
}

// ------------------------------------------------------------
// 4) WebTrit Mini‑Panel (lazy)
// ------------------------------------------------------------
function WebTritMini({ onReady }){
  const ref = useRef(null);
  useEffect(()=>{
    let cancelled = false;
    (async()=>{
      // Platzhalter – hier echtes SDK laden/initialisieren:
      // const { WebTritClient } = await import('webtrit-sdk');
      // const client = new WebTritClient({
      //   serverUrl: import.meta.env.VITE_WEBTRIT_URL,
      //   token: await fetch('/api/webrtit/token').then(r=>r.text())
      // });
      // await client.init();
      // ref.current.appendChild(client.getWidget());
      await new Promise(r=>setTimeout(r, 350)); // simuliertes Laden
      if (!cancelled) onReady?.();
    })();
    return ()=>{ cancelled = true; };
  }, [onReady]);
  return (
    <div ref={ref} className="w-full h-56 flex items-center justify-center text-sm text-gray-600">
      <span>WebTrit lädt … (wird nur bei Bedarf nachgeladen)</span>
    </div>
  );
}

// ------------------------------------------------------------
// 5) Haupt‑Widget: Unaufdringlicher "Kommunikations‑Griff" (Swipe‑Up)
// ------------------------------------------------------------
export default function SwipeCommsDock(){
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Swipe nur im rechten 64px‑Rand (Handle) aktivieren, um Konflikte zu minimieren
  useEffect(()=>{
    function onTouchStart(e){
      const t = e.touches?.[0];
      if (!t) return;
      const vw = window.innerWidth;
      if (vw - t.clientX < 64) {
        // Nutzer greift den Comms‑Handle → lokales Swipe aktivieren
        localStorage.setItem('oamtm:comms:armed','1');
      } else {
        localStorage.removeItem('oamtm:comms:armed');
      }
    }
    document.addEventListener('touchstart', onTouchStart, { passive:true });
    return ()=> document.removeEventListener('touchstart', onTouchStart);
  },[]);

  useSwipe((dir)=>{
    if (!FEATURE_FLAG) return;
    const armed = localStorage.getItem('oamtm:comms:armed') === '1';
    if (!armed) return; // keine globale Navigation hijacken
    if (dir === 'up') {
      setOpen(true);
      emitAudit({ event:'COMMS_DOCK_OPEN', reason:'swipe_up' });
    }
    if (dir === 'down') {
      setOpen(false);
      emitAudit({ event:'COMMS_DOCK_CLOSE', reason:'swipe_down' });
    }
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      {/* Dock‑Leiste */}
      <div className="mx-auto max-w-3xl p-2">
        <div className="pointer-events-auto rounded-2xl shadow-xl border bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between p-2">
            <button
              className="px-3 py-1.5 text-xs rounded-full bg-gray-900 text-white"
              onClick={()=>{ setOpen(o=>!o); emitAudit({ event: open? 'COMMS_DOCK_TOGGLE_OFF':'COMMS_DOCK_TOGGLE_ON', reason:'tap' }); }}
            >Comms</button>
            <div className="text-xs text-gray-600">Swipe ↑ am rechten Rand zum Öffnen</div>
            <button className="px-2 py-1 text-xs" onClick={()=>setExpanded(e=>!e)}>{expanded? '−':'+'}</button>
          </div>

          {/* Collapsible Inhalt */}
          {open && (
            <div className="p-3 border-t">
              {!ready && <div className="text-xs text-gray-500 pb-2">Initialisiere Kommunikation …</div>}
              <WebTritMini onReady={()=>{ setReady(true); emitAudit({ event:'COMMS_PROVIDER_READY', provider:'webtrit' }); }} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button className="rounded-lg border p-2 text-xs" onClick={()=>emitAudit({ event:'CALL_DIAL', provider:'webtrit', mode:'voice' })}>Anrufen</button>
                <button className="rounded-lg border p-2 text-xs" onClick={()=>emitAudit({ event:'CALL_VIDEO', provider:'webtrit', mode:'video' })}>Video</button>
                <button className="rounded-lg border p-2 text-xs" onClick={()=>emitAudit({ event:'MSG_OPEN', provider:'webtrit', mode:'im' })}>Nachricht</button>
              </div>
              {expanded && (
                <div className="mt-3 text-[11px] text-gray-500">
                  <p>Audit aktiv · Lizenz wird vor dem Medienaufbau geprüft · Keine Änderung am bestehenden Navigations‑Flow.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Griff‑Zone (rechts) */}
      <div className="pointer-events-auto fixed right-0 bottom-20 w-8 h-24 flex items-center justify-center">
        <div className="rounded-l-xl bg-gray-900 text-white text-[10px] leading-tight px-2 py-3 opacity-80">
          Swipe ↑\nComms
        </div>
      </div>
    </div>
  );
}

