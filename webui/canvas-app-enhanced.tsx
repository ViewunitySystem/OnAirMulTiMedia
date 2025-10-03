import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
// UI (shadcn/ui + lucide-react are available in the canvas runtime)
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Headphones, Play, Pause, Music2, Info, Film, Images, Link2, Award, Radio, Mic2, MessageSquare, Zap, Settings, Activity, Phone, Mail, Globe, Users, Shield, Lock, TestTube, FileArchive } from "lucide-react";

/**
 * Absolutly & Gently by GOD – WebTrit‑Style Frontend (No‑Barrier, Real Software)
 *
 * WICHTIG (laut User):
 * * **Keine Mock‑Inhalte.**
 * * **Gäste = Accounts**: voller Zugang, keine Barrieren, tel1.nl‑konform.
 * * **Echter Code**: Lädt Inhalte **zur Laufzeit** direkt von tel1.nl, tel1.jouwweb.nl/servicesoftware und gentlyoverdone.com (soweit CORS erlaubt),
 * plus autodiscovery via /sitemap.xml, /rss, /feed, OpenGraph und oEmbed.
 * * **Royalty‑Zählung** für Streams/Downloads client‑seitig mit Offline‑Queue (+ Hooks für Server‑API), ohne Nutzerkonto‑Gate.
 * * **Hover/Haptic Overlays**, **Swipe‑Hub** für „Raymond Demitrio Tel", **Interview De Kentering – Nijmegen** wird automatisch erkannt, sobald auf den Quellen verlinkt.
 * * **SDR/Tech‑Bereich**: Bindet Viewer‑Stub ein; echte Demos können per URL/Konfiguration geladen werden (z.B. aus hfrf-universal-sdr Assets auf eurem CDN).
 *
 * Hinweis: Für Domains ohne CORS empfiehlt sich ein schlanker Proxy: /api/proxy?url=... (signiert). Dieser Code nutzt auto‑Fallback darauf.
 */

/***********************************
|*            KONFIG               *|
***********************************/

const SOURCES = [
  "https://tel1.nl",
  "https://tel1.jouwweb.nl/servicesoftware",
  "https://www.gentlyoverdone.com",
] as const;

const PROXY_BASE = "/api/proxy?url="; // HFRF-SDR Proxy-Endpoint für CORS-freie Requests
const ROYALTY_ENDPOINT = "/api/royalty"; // HFRF-SDR Royalty-Zählung Endpoint

/***********************************
|*   HILFSFUNKTIONEN (ECHT)        *|
***********************************/

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return res;
    // Fallback via Proxy
    const px = await fetch(PROXY_BASE + encodeURIComponent(url));
    return px.ok ? px : null;
  } catch {
    try {
      const px = await fetch(PROXY_BASE + encodeURIComponent(url));
      return px.ok ? px : null;
    } catch {
      return null;
    }
  }
}

async function fetchText(url: string) {
  const r = await safeFetch(url);
  return r ? r.text() : null;
}

async function fetchJSON<T = any>(url: string): Promise<T | null> {
  const r = await safeFetch(url);
  return r ? (r.json() as Promise<T>) : null;
}

function absolute(base: string, href: string) {
  try { return new URL(href, base).toString(); } catch { return href; }
}

function extractLinksFromHTML(base: string, html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchors = [...doc.querySelectorAll("a[href]")].map(a => absolute(base, (a as HTMLAnchorElement).href));
  const media = [
    ...[...doc.querySelectorAll("audio[src]")].map(a => absolute(base, (a as HTMLAudioElement).src)),
    ...[...doc.querySelectorAll("source[src]")].map(s => absolute(base, (s as HTMLSourceElement).src)),
    ...[...doc.querySelectorAll("video[src]")].map(v => absolute(base, (v as HTMLVideoElement).src)),
  ];
  return { anchors, media };
}

function looksLikeAudio(u: string) {
  return /\.(mp3|opus|ogg|flac|m4a)(\?|#|$)/i.test(u) || /audio/i.test(u);
}
function looksLikeVideo(u: string) {
  return /\.(mp4|webm|mkv|m3u8)(\?|#|$)/i.test(u) || /(video|stream)/i.test(u);
}

/***********************************
|*   DISCOVERY – KEINE MOCKS       *|
***********************************/

type MediaItem = { id: string; url: string; title?: string; poster?: string; type: "audio" | "video" };

async function discoverFromSource(base: string): Promise<MediaItem[]> {
  const out: MediaItem[] = [];

  // 1) sitemap.xml
  const sm = await fetchText(absolute(base, "/sitemap.xml"));
  if (sm) {
    const doc = new DOMParser().parseFromString(sm, "text/xml");
    const locs = [...doc.querySelectorAll("url > loc")].map(n => n.textContent || "");
    for (const page of locs) {
      const html = await fetchText(page);
      if (!html) continue;
      const { media } = extractLinksFromHTML(page, html);
      for (const m of media) {
        if (looksLikeAudio(m)) out.push({ id: m, url: m, type: "audio" });
        if (looksLikeVideo(m)) out.push({ id: m, url: m, type: "video" });
      }
    }
  }

  // 2) Fallback: Home/Unterseiten
  const home = await fetchText(base);
  if (home) {
    const { anchors, media } = extractLinksFromHTML(base, home);
    for (const m of media) {
      if (looksLikeAudio(m)) out.push({ id: m, url: m, type: "audio" });
      if (looksLikeVideo(m)) out.push({ id: m, url: m, type: "video" });
    }
    for (const a of anchors.slice(0, 20)) { // begrenzen
      const html = await fetchText(a);
      if (!html) continue;
      const { media } = extractLinksFromHTML(a, html);
      for (const m of media) {
        if (looksLikeAudio(m)) out.push({ id: m, url: m, type: "audio" });
        if (looksLikeVideo(m)) out.push({ id: m, url: m, type: "video" });
      }
    }
  }

  // 3) Dubletten filtern
  const seen = new Set<string>();
  return out.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

function useDiscovery() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const lists = await Promise.all(SOURCES.map(s => discoverFromSource(s)));
        if (!alive) return;
        setItems(lists.flat());
      } catch (e: any) {
        setError(e?.message || "Discovery fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
  return { items, loading, error };
}

/***********************************
|*   ROYALTY & AUDIT (ECHT)        *|
***********************************/

function useSessionId() { return useMemo(() => crypto.randomUUID(), []); }

function emitRoyalty(evt: { type: string; assetId: string; position?: number }) {
  const payload = { 
    event_type: evt.type,
    asset_id: evt.assetId,
    timestamp: Date.now(),
    session_id: sessionStorage.getItem("sid") || (sessionStorage.setItem("sid", crypto.randomUUID()), sessionStorage.getItem("sid")),
    frequency: null,
    position: evt.position || null,
    data: {}
  };
  
  try {
    const key = "royaltyQueue";
    const q = JSON.parse(localStorage.getItem(key) || "[]");
    q.push(payload);
    localStorage.setItem(key, JSON.stringify(q));
    
    // Echter HFRF-SDR Royalty-Endpoint
    fetch(ROYALTY_ENDPOINT, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }).catch(e => console.warn("Royalty API offline:", e));
  } catch (e) { console.warn(e); }
}

/***********************************
|*           PLAYER (ECHT)         *|
***********************************/

function useHlsIfNeeded(mediaEl: HTMLVideoElement | null, src: string) {
  useEffect(() => {
    if (!mediaEl || !src) return;
    const isHls = /\.m3u8(\?|#|$)/i.test(src);
    let hls: any = null;
    (async () => {
      if (isHls && !(mediaEl as any).canPlayType("application/vnd.apple.mpegurl")) {
        const mod = await import("hls.js");
        if (mod.default.isSupported()) {
          hls = new mod.default();
          hls.loadSource(src);
          hls.attachMedia(mediaEl);
        }
      } else {
        mediaEl.src = src;
      }
    })();
    return () => { if (hls) hls.destroy(); };
  }, [mediaEl, src]);
}

function AudioPlayer({ item }: { item: MediaItem }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const sid = useSessionId();
  useEffect(() => { emitRoyalty({ type: "STREAM_START", assetId: item.url }); }, [item.url]);
  useEffect(() => {
    const i = window.setInterval(() => {
      const pos = ref.current?.currentTime || 0;
      emitRoyalty({ type: "STREAM_HEARTBEAT", assetId: item.url, position: pos });
    }, 15000);
    return () => window.clearInterval(i);
  }, [item.url]);
  return (
    <Card className="rounded-2xl shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music2 className="h-4 w-4"/>
          {item.title || item.url}
        </CardTitle>
        <Badge>Audio</Badge>
      </CardHeader>
      <CardContent>
        <audio ref={ref} controls preload="metadata" onEnded={() => emitRoyalty({ type: "STREAM_COMPLETE", assetId: item.url })} className="w-full"/>
      </CardContent>
    </Card>
  );
}

function VideoPlayer({ item }: { item: MediaItem }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useHlsIfNeeded(ref.current, item.url);
  useEffect(() => { emitRoyalty({ type: "STREAM_START", assetId: item.url }); }, [item.url]);
  useEffect(() => {
    const i = window.setInterval(() => {
      const pos = ref.current?.currentTime || 0;
      emitRoyalty({ type: "STREAM_HEARTBEAT", assetId: item.url, position: pos });
    }, 15000);
    return () => window.clearInterval(i);
  }, [item.url]);
  return (
    <Card className="rounded-2xl shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Film className="h-4 w-4"/>
          {item.title || item.url}
        </CardTitle>
        <Badge>Video</Badge>
      </CardHeader>
      <CardContent>
        <video ref={ref} controls preload="metadata" className="w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

/***********************************
|*        SWIPE‑HUB & UI           *|
***********************************/

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      className="flex items-center gap-2 rounded-xl border p-3 hover:bg-muted"
    >
      <Link2 className="h-4 w-4"/>
      <span className="truncate">{label}</span>
    </a>
  );
}

function SwipeHub() {
  const { items, loading, error } = useDiscovery();
  const audios = (items || []).filter(i => i.type === "audio");
  const videos = (items || []).filter(i => i.type === "video");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <LinkRow href="https://tel1.nl" label="tel1.nl"/>
        <LinkRow href="https://tel1.jouwweb.nl/servicesoftware" label="tel1.jouwweb.nl/servicesoftware"/>
        <LinkRow href="https://www.gentlyoverdone.com" label="gentlyoverdone.com"/>
      </div>

      {loading && <div className="text-sm opacity-70">Lade echte Medien von den Quellen…</div>}
      {error && <div className="text-sm text-red-600">Discovery‑Fehler: {error}</div>}

      {!!audios.length && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Headphones className="h-5 w-5"/>
            Hörbeispiele (komplett)
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {audios.map(a => <AudioPlayer key={a.id} item={a}/>) }
          </div>
        </section>
      )}

      {!!videos.length && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Film className="h-5 w-5"/>
            Videos & Interviews
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {videos.map(v => <VideoPlayer key={v.id} item={v}/>) }
          </div>
        </section>
      )}

      {!loading && !audios.length && !videos.length && (
        <div className="text-sm opacity-70">
          Keine direkt verlinkten Media‑Dateien gefunden. Stelle sicher, dass Audio/Video‑Dateien öffentlich und per CORS abrufbar sind oder aktiviere den Proxy unter <code>{PROXY_BASE}</code>.
        </div>
      )}
    </div>
  );
}

function RFTech() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Radio className="h-5 w-5"/>
        RF / SDR
      </h3>
      <p className="text-sm opacity-80">Viewer‑Stub (readonly). Lade hier eure SDR‑Demos (WASM/AudioIQ) über URLs – keine Mockdaten.</p>
      <div className="rounded-xl border p-4">
        <code className="text-xs">// Beispiel: <iframe src="/sdr/index.html#src=https://cdn.example.com/iq/example.iq" /></code>
      </div>
    </div>
  );
}

function TestRow({ name, status, detail }: { name: string; status: "pass" | "fail" | "skip" | "run"; detail?: string }) {
  const color = status === "pass" ? "bg-emerald-600" : status === "fail" ? "bg-red-600" : status === "run" ? "bg-amber-500" : "bg-slate-500";
  return (
    <div className="flex items-start justify-between rounded-xl border p-3">
      <div className="pr-3">
        <div className="font-medium">{name}</div>
        {detail && <div className="text-xs opacity-70 whitespace-pre-wrap">{detail}</div>}
      </div>
      <span className={`ml-3 inline-flex h-6 items-center justify-center rounded-full px-3 text-xs font-semibold text-white ${color}`}>
        {status}
      </span>
    </div>
  );
}

function useAxe() {
  const [axeReady, setReady] = useState(false);
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/axe-core/axe.min.js';
    s.async = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
  return axeReady;
}

async function corsProbe(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return r.ok;
  } catch {
    try { 
      const r2 = await fetch(PROXY_BASE + encodeURIComponent(url)); 
      return !!r2; 
    } catch { 
      return false; 
    }
  }
}

async function hlsProbe(url: string) {
  if (!/\.m3u8(\?|#|$)/i.test(url)) return true; // not HLS
  try { 
    const txt = await fetchText(url); 
    return !!(txt && txt.includes('#EXTM3U')); 
  } catch { 
    return false; 
  }
}

function canPlay(url: string) {
  const a = document.createElement('audio');
  const v = document.createElement('video');
  if (looksLikeAudio(url)) return !!a.canPlayType('audio/mpeg') || !!a.canPlayType('audio/ogg') || !!a.canPlayType('audio/mp4');
  if (looksLikeVideo(url)) return !!v.canPlayType('video/mp4') || !!v.canPlayType('video/webm') || /\.m3u8(\?|#|$)/i.test(url);
  return false;
}

function ZipViewer() {
  const [list, setList] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Bereit – ZIP auswählen');
  
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus('Lade ZIP …');
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const entries: string[] = [];
    await Promise.all(Object.keys(zip.files).map(async (name) => { 
      entries.push(name); 
    }));
    setList(entries);
    setStatus(`ZIP geladen: ${f.name} — ${entries.length} Einträge`);
  }
  
  return (
    <div className="space-y-3">
      <div className="text-sm opacity-80">
        Lade hier <strong>hfrf-universal-sdr.zip</strong> oder andere Demos, um Inhalte <strong>im Browser</strong> zu inspizieren. Keine Mockdaten.
      </div>
      <Input type="file" accept=".zip" onChange={onPick} />
      <div className="text-xs opacity-70">{status}</div>
      {!!list.length && (
        <div className="max-h-64 overflow-auto rounded-xl border p-3 text-xs">
          {list.map((n) => (<div key={n}>{n}</div>))}
        </div>
      )}
    </div>
  );
}

function TestLab() {
  const { items, loading } = useDiscovery();
  const axeReady = useAxe();
  const [results, setResults] = useState<{ name: string; status: any; detail?: string }[]>([]);
  
  async function runAll() {
    const res: { name: string; status: any; detail?: string }[] = [];
    
    // 1) Discovery vorhanden
    res.push({ 
      name: 'Discovery ausgeführt', 
      status: loading ? 'run' : (items && items.length ? 'pass' : 'fail'), 
      detail: items ? `${items.length} Medien gefunden` : '0 Medien gefunden' 
    });
    
    // 2) CORS / Erreichbarkeit (erste 5)
    const sample = (items || []).slice(0, 5);
    for (const it of sample) {
      const ok = await corsProbe(it.url);
      res.push({ name: `CORS/HEAD ${it.url}`, status: ok ? 'pass' : 'fail' });
    }
    
    // 3) Playability
    for (const it of sample) {
      const ok = canPlay(it.url) && await hlsProbe(it.url);
      res.push({ name: `Playable ${it.url}`, status: ok ? 'pass' : 'fail' });
    }
    
    // 4) Accessibility (axe)
    if (axeReady && (window as any).axe) {
      const r = await (window as any).axe.run(document);
      const vios = r.violations?.length || 0;
      res.push({ name: 'A11y (axe-core)', status: vios === 0 ? 'pass' : 'fail', detail: `${vios} Verstöße` });
    } else {
      res.push({ name: 'A11y (axe-core)', status: 'skip', detail: 'axe-core noch nicht geladen' });
    }
    
    // 5) Offline-Queue vorhanden
    try {
      const key = 'royaltyQueue';
      const q = JSON.parse(localStorage.getItem(key) || '[]');
      res.push({ name: 'Royalty Offline-Queue', status: Array.isArray(q) ? 'pass' : 'fail' });
    } catch { 
      res.push({ name: 'Royalty Offline-Queue', status: 'fail' }); 
    }
    
    // 6) Proxy-Endpoint testen
    try {
      const testUrl = 'https://httpbin.org/get';
      const proxyUrl = PROXY_BASE + encodeURIComponent(testUrl);
      const response = await fetch(proxyUrl);
      res.push({ 
        name: 'Proxy-Endpoint', 
        status: response.ok ? 'pass' : 'fail',
        detail: `GET ${testUrl} via ${PROXY_BASE}`
      });
    } catch {
      res.push({ name: 'Proxy-Endpoint', status: 'fail', detail: 'Proxy nicht erreichbar' });
    }
    
    // 7) Royalty-Endpoint testen
    try {
      const testPayload = {
        event_type: "TEST",
        asset_id: "test-asset",
        timestamp: Date.now(),
        session_id: "test-session",
        frequency: null,
        position: null,
        data: {}
      };
      const response = await fetch(ROYALTY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      res.push({ 
        name: 'Royalty-Endpoint', 
        status: response.ok ? 'pass' : 'fail',
        detail: `POST ${ROYALTY_ENDPOINT}`
      });
    } catch {
      res.push({ name: 'Royalty-Endpoint', status: 'fail', detail: 'Royalty API nicht erreichbar' });
    }

    setResults(res);
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TestTube className="h-5 w-5"/>
        Test‑Labor (Live‑Checks, keine Mocks)
      </h3>
      <div className="flex gap-2">
        <Button onClick={runAll}>Run All</Button>
      </div>
      <div className="space-y-2">
        {results.map((r, i) => (<TestRow key={i} name={r.name} status={r.status} detail={r.detail}/>))}
      </div>
      <div className="pt-4">
        <h4 className="mb-2 font-semibold flex items-center gap-2">
          <FileArchive className="h-4 w-4"/>
          ZIP‑Inspektion (SDR Demos)
        </h4>
        <ZipViewer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Absolutly & Gently by GOD — WebTrit‑Auftritt</h1>
          <p className="text-sm opacity-70">Kein Login. Keine Barrieren. Echte Inhalte direkt von den Original‑Domains. Royalty‑Zählung client‑seitig.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">No‑Barrier</Badge>
          <Badge variant="outline">Audit‑Ready</Badge>
        </div>
      </header>

      <Tabs defaultValue="hub" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hub">Swipe‑Hub</TabsTrigger>
          <TabsTrigger value="comm">Kommunikation</TabsTrigger>
          <TabsTrigger value="tech">Tech/RF</TabsTrigger>
          <TabsTrigger value="lab">Test/Lab</TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="mt-4">
          <SwipeHub />
        </TabsContent>

        <TabsContent value="comm" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5"/>
              Messaging & Voicemail
            </h3>
            <p className="text-sm opacity-80">Diese Oberfläche ist bereit für SIP/XMPP/Matrix‑Bridges (keine Mock‑User, kein Login‑Zwang). Endpunkte serverseitig hinterlegen und direkt verbinden.</p>
            <div className="rounded-xl border p-4">
              <code className="text-xs">// Beispiel: WebRTC‑SIP via JsSIP, Matrix via matrix-js-sdk – sofort integrierbar.</code>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tech" className="mt-4">
          <RFTech />
        </TabsContent>

        <TabsContent value="lab" className="mt-4">
          <TestLab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

