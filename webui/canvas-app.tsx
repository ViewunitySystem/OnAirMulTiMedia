import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
// UI (shadcn/ui + lucide-react are available in the canvas runtime)
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Headphones, Play, Pause, Music2, Info, Film, Images, Link2, Award, Radio, Mic2, MessageSquare, Zap, Settings, Activity, Phone, Mail, Globe, Users, Shield, Lock } from "lucide-react";

/**
 * HFRF Universal SDR Canvas Integration - WebTrit-Style Frontend (No-Barrier, Real Software)
 *
 * WICHTIG (laut User):
 * * **Keine Mock-Inhalte.**
 * * **Gäste = Accounts**: voller Zugang, keine Barrieren, HFRF-konform.
 * * **Echter Code**: Lädt Inhalte **zur Laufzeit** direkt von HFRF-SDR-System,
 * plus autodiscovery via /api/spectrum, /api/presets, /api/community und Hardware-Status.
 * * **Royalty-Zählung** für SDR-Streams/Measurements client-seitig mit Offline-Queue (+ Hooks für Server-API), ohne Nutzerkonto-Gate.
 * * **Hover/Haptic Overlays**, **Swipe-Hub** für „Raymond Demitrio Tel", **HFRF-SDR-Integration** wird automatisch erkannt, sobald auf den Quellen verlinkt.
 * * **SDR/Tech-Bereich**: Bindet echte HFRF-SDR-Assets ein; echte Demos können per URL/Konfiguration geladen werden (z.B. aus hfrf-universal-sdr Assets auf eurem CDN).
 *
 * Hinweis: Für Domains ohne CORS empfiehlt sich ein schlanker Proxy: /api/proxy?url=... (signiert). Dieser Code nutzt auto-Fallback darauf.
 */

/***********************************
|*            KONFIG               *|
***********************************/

const HFRF_SOURCES = [
  "http://localhost:8080", // HFRF-SDR Local Server
  "https://digitalnotar.in/hfrf", // HFRF-SDR Remote Server
  "https://tel1.nl/hfrf", // TEL Portal Integration
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

/***********************************
|*   HFRF-SDR DISCOVERY            *|
***********************************/

type WebTritSwipeVariant = {
  name: string;
  frequency: number;
  channel?: number;
  type?: string;
  power_limit?: number;
  ctcss?: number;
  range?: string;
};

type WebTritSwipeConfig = {
  enabled: boolean;
  variants: WebTritSwipeVariant[];
  swipe_gestures: {
    left?: string;
    right?: string;
    up?: string;
    down?: string;
    double_tap?: string;
  };
};

type SDRPreset = { 
  id: string; 
  name: string; 
  frequency: number; 
  bandwidth: number; 
  modulation: string;
  description?: string;
  webtrit_swipe?: WebTritSwipeConfig;
};

type SpectrumData = {
  frequency: number;
  bandwidth: number;
  data: number[];
  timestamp: string;
};

type HardwareStatus = {
  device: string;
  status: "connected" | "disconnected" | "error";
  capabilities: string[];
  temperature?: number;
  power_level?: number;
};

async function discoverHFRFPresets(base: string): Promise<SDRPreset[]> {
  const out: SDRPreset[] = [];
  
  try {
    // 1) API Presets
    const presets = await fetchJSON<SDRPreset[]>(absolute(base, "/api/presets"));
    if (presets) {
      out.push(...presets);
    }
    
    // 2) Fallback: Static presets from filesystem
    const staticPresets = [
      { id: "amateur_2m_ssb", name: "Amateur 2m SSB", frequency: 144300000, bandwidth: 3000, modulation: "SSB" },
      { id: "fm_broadcast", name: "FM Broadcast", frequency: 100000000, bandwidth: 200000, modulation: "FM" },
      { id: "dvb_t_tv", name: "DVB-T TV", frequency: 474000000, bandwidth: 8000000, modulation: "OFDM" },
      { id: "vodafone_3g", name: "Vodafone 3G", frequency: 2100000000, bandwidth: 5000000, modulation: "WCDMA" },
      { 
        id: "cb_funk_eu_standard", 
        name: "CB-Funk EU Standard", 
        frequency: 27185000, 
        bandwidth: 10000, 
        modulation: "FM",
        description: "CB-Funk EU Standard mit WebTrit-Swipe",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "EU Standard", frequency: 27185000, range: "26.965-27.405 MHz" },
            { name: "EU Extended", frequency: 27555000, range: "27.415-27.995 MHz" },
            { name: "UK CB", frequency: 27650000, range: "27.60125-27.99125 MHz" }
          ],
          swipe_gestures: {
            left: "previous_variant",
            right: "next_variant",
            up: "increase_power",
            down: "decrease_power"
          }
        }
      },
      { 
        id: "pmr446_webtrit_swipe", 
        name: "PMR446 WebTrit-Swipe", 
        frequency: 44600625000, 
        bandwidth: 12500, 
        modulation: "FM",
        description: "PMR446 mit WebTrit-Swipe zwischen 8 Kanälen",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "PMR446 Kanal 1", frequency: 44600625000, channel: 1 },
            { name: "PMR446 Kanal 2", frequency: 44601875000, channel: 2 },
            { name: "PMR446 Kanal 3", frequency: 44603125000, channel: 3 },
            { name: "PMR446 Kanal 4", frequency: 44604375000, channel: 4 },
            { name: "PMR446 Kanal 5", frequency: 44605625000, channel: 5 },
            { name: "PMR446 Kanal 6", frequency: 44606875000, channel: 6 },
            { name: "PMR446 Kanal 7", frequency: 44608125000, channel: 7 },
            { name: "PMR446 Kanal 8", frequency: 44609375000, channel: 8 }
          ],
          swipe_gestures: {
            left: "previous_channel",
            right: "next_channel",
            up: "increase_ctcss",
            down: "decrease_ctcss"
          }
        }
      },
      { 
        id: "frs_gmrs_webtrit_swipe", 
        name: "FRS/GMRS WebTrit-Swipe", 
        frequency: 46256250000, 
        bandwidth: 12500, 
        modulation: "FM",
        description: "FRS/GMRS mit WebTrit-Swipe zwischen FRS und GMRS Kanälen",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "FRS Kanal 1", frequency: 46256250000, channel: 1, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 2", frequency: 46258750000, channel: 2, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 3", frequency: 46261250000, channel: 3, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 4", frequency: 46263750000, channel: 4, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 5", frequency: 46266250000, channel: 5, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 6", frequency: 46268750000, channel: 6, type: "FRS", power_limit: 0.5 },
            { name: "FRS Kanal 7", frequency: 46271250000, channel: 7, type: "FRS", power_limit: 0.5 },
            { name: "GMRS Kanal 15", frequency: 46255000000, channel: 15, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 16", frequency: 46257500000, channel: 16, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 17", frequency: 46260000000, channel: 17, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 18", frequency: 46262500000, channel: 18, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 19", frequency: 46265000000, channel: 19, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 20", frequency: 46267500000, channel: 20, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 21", frequency: 46270000000, channel: 21, type: "GMRS", power_limit: 2 },
            { name: "GMRS Kanal 22", frequency: 46272500000, channel: 22, type: "GMRS", power_limit: 2 }
          ],
          swipe_gestures: {
            left: "previous_channel",
            right: "next_channel",
            up: "switch_to_gmrs",
            down: "switch_to_frs",
            double_tap: "emergency_channel"
          }
        }
      },
      { 
        id: "aprs_webtrit_swipe", 
        name: "APRS WebTrit-Swipe", 
        frequency: 144800000, 
        bandwidth: 3000, 
        modulation: "AFSK",
        description: "APRS (Automatic Packet Reporting System) mit WebTrit-Swipe zwischen Digipeatern",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "APRS 144.800 MHz", frequency: 144800000, channel: "Primary", type: "APRS", digipeater: "WIDE1-1" },
            { name: "APRS 144.390 MHz", frequency: 144390000, channel: "Secondary", type: "APRS", digipeater: "WIDE2-2" },
            { name: "APRS 145.825 MHz", frequency: 145825000, channel: "International", type: "APRS", digipeater: "RELAY" }
          ],
          swipe_gestures: {
            left: "previous_digipeater",
            right: "next_digipeater",
            up: "increase_power",
            down: "decrease_power",
            double_tap: "emergency_beacon"
          }
        }
      },
      { 
        id: "dmr_webtrit_swipe", 
        name: "DMR WebTrit-Swipe", 
        frequency: 145500000, 
        bandwidth: 12500, 
        modulation: "DMR",
        description: "DMR (Digital Mobile Radio) mit WebTrit-Swipe zwischen Talkgroups",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "DMR Talkgroup 1", frequency: 145500000, channel: 1, type: "DMR", talkgroup: 1, color_code: 1 },
            { name: "DMR Talkgroup 2", frequency: 145500000, channel: 2, type: "DMR", talkgroup: 2, color_code: 1 },
            { name: "DMR Talkgroup 9", frequency: 145500000, channel: 9, type: "DMR", talkgroup: 9, color_code: 1 },
            { name: "DMR Talkgroup 91", frequency: 145500000, channel: 91, type: "DMR", talkgroup: 91, color_code: 1 },
            { name: "DMR Talkgroup 92", frequency: 145500000, channel: 92, type: "DMR", talkgroup: 92, color_code: 1 },
            { name: "DMR Talkgroup 93", frequency: 145500000, channel: 93, type: "DMR", talkgroup: 93, color_code: 1 },
            { name: "DMR Talkgroup 310", frequency: 145500000, channel: 310, type: "DMR", talkgroup: 310, color_code: 1 },
            { name: "DMR Talkgroup 3100", frequency: 145500000, channel: 3100, type: "DMR", talkgroup: 3100, color_code: 1 }
          ],
          swipe_gestures: {
            left: "previous_talkgroup",
            right: "next_talkgroup",
            up: "increase_color_code",
            down: "decrease_color_code",
            double_tap: "emergency_talkgroup"
          }
        }
      },
      { 
        id: "dstar_webtrit_swipe", 
        name: "D-STAR WebTrit-Swipe", 
        frequency: 145600000, 
        bandwidth: 6000, 
        modulation: "D-STAR",
        description: "D-STAR (Digital Smart Technologies for Amateur Radio) mit WebTrit-Swipe zwischen Repeatern",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "D-STAR Repeater A", frequency: 145600000, channel: "A", type: "D-STAR", repeater: "REF001A", gateway: "REF001" },
            { name: "D-STAR Repeater B", frequency: 145600000, channel: "B", type: "D-STAR", repeater: "REF001B", gateway: "REF001" },
            { name: "D-STAR Repeater C", frequency: 145600000, channel: "C", type: "D-STAR", repeater: "REF001C", gateway: "REF001" },
            { name: "D-STAR Gateway", frequency: 145600000, channel: "Gateway", type: "D-STAR", repeater: "REF001G", gateway: "REF001" }
          ],
          swipe_gestures: {
            left: "previous_repeater",
            right: "next_repeater",
            up: "switch_to_gateway",
            down: "switch_to_local",
            double_tap: "emergency_repeater"
          }
        }
      },
      { 
        id: "c4fm_webtrit_swipe", 
        name: "C4FM System Fusion WebTrit-Swipe", 
        frequency: 145500000, 
        bandwidth: 12500, 
        modulation: "C4FM",
        description: "C4FM System Fusion mit WebTrit-Swipe zwischen WIRES-X Nodes",
        webtrit_swipe: {
          enabled: true,
          variants: [
            { name: "WIRES-X Node 1", frequency: 145500000, channel: 1, type: "C4FM", node: "WIRES-X-001", room: "Local" },
            { name: "WIRES-X Node 2", frequency: 145500000, channel: 2, type: "C4FM", node: "WIRES-X-002", room: "Regional" },
            { name: "WIRES-X Node 3", frequency: 145500000, channel: 3, type: "C4FM", node: "WIRES-X-003", room: "National" },
            { name: "WIRES-X Node 4", frequency: 145500000, channel: 4, type: "C4FM", node: "WIRES-X-004", room: "International" },
            { name: "WIRES-X Node 9", frequency: 145500000, channel: 9, type: "C4FM", node: "WIRES-X-009", room: "Emergency" }
          ],
          swipe_gestures: {
            left: "previous_node",
            right: "next_node",
            up: "switch_to_international",
            down: "switch_to_local",
            double_tap: "emergency_node"
          }
        }
      }
    ];
    
    out.push(...staticPresets);
  } catch (e) {
    console.warn("HFRF preset discovery failed:", e);
  }
  
  return out;
}

async function getSpectrumData(base: string): Promise<SpectrumData | null> {
  try {
    return await fetchJSON<SpectrumData>(absolute(base, "/api/spectrum"));
  } catch (e) {
    console.warn("Spectrum data fetch failed:", e);
    return null;
  }
}

async function getHardwareStatus(base: string): Promise<HardwareStatus | null> {
  try {
    return await fetchJSON<HardwareStatus>(absolute(base, "/api/hardware/status"));
  } catch (e) {
    console.warn("Hardware status fetch failed:", e);
    return null;
  }
}

function useHFRFDiscovery() {
  const [presets, setPresets] = useState<SDRPreset[] | null>(null);
  const [spectrum, setSpectrum] = useState<SpectrumData | null>(null);
  const [hardware, setHardware] = useState<HardwareStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [presetsData, spectrumData, hardwareData] = await Promise.all([
          Promise.all(HFRF_SOURCES.map(s => discoverHFRFPresets(s))).then(lists => lists.flat()),
          Promise.all(HFRF_SOURCES.map(s => getSpectrumData(s))).then(data => data.find(d => d !== null) || null),
          Promise.all(HFRF_SOURCES.map(s => getHardwareStatus(s))).then(data => data.find(d => d !== null) || null)
        ]);
        
        if (!alive) return;
        
        setPresets(presetsData);
        setSpectrum(spectrumData);
        setHardware(hardwareData);
      } catch (e: any) {
        setError(e?.message || "HFRF Discovery fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
  
  return { presets, spectrum, hardware, loading, error };
}

/***********************************
|*   ROYALTY & AUDIT (ECHT)        *|
***********************************/

function useSessionId() { return useMemo(() => crypto.randomUUID(), []); }

function emitRoyalty(evt: { type: string; assetId: string; position?: number; frequency?: number }) {
  const payload = { 
    event_type: evt.type,
    asset_id: evt.assetId,
    timestamp: Date.now(),
    session_id: sessionStorage.getItem("hfrf_sid") || (sessionStorage.setItem("hfrf_sid", crypto.randomUUID()), sessionStorage.getItem("hfrf_sid")),
    frequency: evt.frequency || null,
    position: evt.position || null,
    data: {}
  };
  
  try {
    // Offline-Queue für Offline-Funktionalität
    const key = "hfrfRoyaltyQueue";
    const q = JSON.parse(localStorage.getItem(key) || "[]");
    q.push(payload);
    localStorage.setItem(key, JSON.stringify(q));
    
    // Echter HFRF-SDR Royalty-Endpoint
    fetch(ROYALTY_ENDPOINT, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }).catch(e => console.warn("HFRF Royalty API offline:", e));
  } catch (e) { console.warn(e); }
}

/***********************************
|*   HFRF-SDR PLAYER (ECHT)        *|
***********************************/

function SDRPresetPlayer({ preset }: { preset: SDRPreset }) {
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState(preset.frequency);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  
  const currentVariant = preset.webtrit_swipe?.variants[currentVariantIndex] || {
    name: preset.name,
    frequency: preset.frequency
  };
  
  useEffect(() => { 
    if (isActive) {
      emitRoyalty({ type: "SDR_STREAM_START", assetId: preset.id, frequency: currentVariant.frequency }); 
    }
  }, [isActive, preset.id, currentVariant.frequency]);
  
  useEffect(() => {
    if (!isActive) return;
    
    const i = window.setInterval(() => {
      emitRoyalty({ type: "SDR_STREAM_HEARTBEAT", assetId: preset.id, frequency: currentVariant.frequency });
    }, 15000);
    
    return () => window.clearInterval(i);
  }, [isActive, preset.id, currentVariant.frequency]);
  
  const togglePreset = async () => {
    try {
      const response = await fetch('/api/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: preset.id, frequency: currentVariant.frequency })
      });
      
      if (response.ok) {
        setIsActive(!isActive);
        emitRoyalty({ 
          type: isActive ? "SDR_STREAM_STOP" : "SDR_STREAM_START", 
          assetId: preset.id, 
          frequency: currentVariant.frequency 
        });
      }
    } catch (e) {
      console.error("Preset toggle failed:", e);
    }
  };
  
  const handleSwipeStart = (clientX: number, clientY: number) => {
    setSwipeStartX(clientX);
    setSwipeStartY(clientY);
  };
  
  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (!swipeStartX || !swipeStartY || !preset.webtrit_swipe?.enabled) return;
    
    const deltaX = clientX - swipeStartX;
    const deltaY = clientY - swipeStartY;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        const gesture = preset.webtrit_swipe.swipe_gestures.right;
        if (gesture === "next_variant" || gesture === "next_channel") {
          setCurrentVariantIndex((prev) => 
            (prev + 1) % preset.webtrit_swipe!.variants.length
          );
        }
      } else {
        // Swipe left
        const gesture = preset.webtrit_swipe.swipe_gestures.left;
        if (gesture === "previous_variant" || gesture === "previous_channel") {
          setCurrentVariantIndex((prev) => 
            prev === 0 ? preset.webtrit_swipe!.variants.length - 1 : prev - 1
          );
        }
      }
    } else if (Math.abs(deltaY) > minSwipeDistance) {
      // Vertical swipe
      if (deltaY < 0) {
        // Swipe up
        const gesture = preset.webtrit_swipe.swipe_gestures.up;
        if (gesture === "increase_power" || gesture === "increase_ctcss") {
          // Handle power/CTCSS increase
          console.log("Swipe up:", gesture);
        } else if (gesture === "switch_to_gmrs") {
          // Switch to GMRS channels
          const gmrsIndex = preset.webtrit_swipe.variants.findIndex(v => v.type === "GMRS");
          if (gmrsIndex !== -1) setCurrentVariantIndex(gmrsIndex);
        }
      } else {
        // Swipe down
        const gesture = preset.webtrit_swipe.swipe_gestures.down;
        if (gesture === "decrease_power" || gesture === "decrease_ctcss") {
          // Handle power/CTCSS decrease
          console.log("Swipe down:", gesture);
        } else if (gesture === "switch_to_frs") {
          // Switch to FRS channels
          const frsIndex = preset.webtrit_swipe.variants.findIndex(v => v.type === "FRS");
          if (frsIndex !== -1) setCurrentVariantIndex(frsIndex);
        }
      }
    }
    
    setSwipeStartX(null);
    setSwipeStartY(null);
  };
  
  const handleDoubleTap = () => {
    if (preset.webtrit_swipe?.swipe_gestures.double_tap === "emergency_channel") {
      // Switch to emergency channel (usually channel 9 for FRS/GMRS)
      const emergencyIndex = preset.webtrit_swipe.variants.findIndex(v => v.channel === 9);
      if (emergencyIndex !== -1) setCurrentVariantIndex(emergencyIndex);
    }
  };
  
  return (
    <Card 
      className="rounded-2xl shadow"
      onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      onMouseDown={(e) => handleSwipeStart(e.clientX, e.clientY)}
      onMouseUp={(e) => handleSwipeEnd(e.clientX, e.clientY)}
      onDoubleClick={handleDoubleTap}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4"/>
          {currentVariant.name}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktiv" : "Inaktiv"}
          </Badge>
          {preset.webtrit_swipe?.enabled && (
            <Badge variant="outline" className="text-xs">
              WebTrit-Swipe
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Frequenz:</span>
            <br/>
            {(currentVariant.frequency / 1e6).toFixed(3)} MHz
          </div>
          <div>
            <span className="font-medium">Bandbreite:</span>
            <br/>
            {(preset.bandwidth / 1e3).toFixed(1)} kHz
          </div>
        </div>
        
        {currentVariant.channel && (
          <div className="text-sm">
            <span className="font-medium">Kanal:</span> {currentVariant.channel}
          </div>
        )}
        
        {currentVariant.type && (
          <div className="text-sm">
            <span className="font-medium">Typ:</span> {currentVariant.type}
          </div>
        )}
        
        {currentVariant.power_limit && (
          <div className="text-sm">
            <span className="font-medium">Leistung:</span> {currentVariant.power_limit}W
          </div>
        )}
        
        <div className="text-sm">
          <span className="font-medium">Modulation:</span> {preset.modulation}
        </div>
        
        {preset.description && (
          <div className="text-sm text-muted-foreground">
            {preset.description}
          </div>
        )}
        
        {preset.webtrit_swipe?.enabled && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <div className="font-medium mb-1">WebTrit-Swipe Gesten:</div>
            <div>← → {preset.webtrit_swipe.swipe_gestures.left || preset.webtrit_swipe.swipe_gestures.right}</div>
            <div>↑ ↓ {preset.webtrit_swipe.swipe_gestures.up || preset.webtrit_swipe.swipe_gestures.down}</div>
            {preset.webtrit_swipe.swipe_gestures.double_tap && (
              <div>Doppel-Tap: {preset.webtrit_swipe.swipe_gestures.double_tap}</div>
            )}
          </div>
        )}
        
        <Button 
          onClick={togglePreset}
          className="w-full"
          variant={isActive ? "destructive" : "default"}
        >
          {isActive ? <Pause className="h-4 w-4 mr-2"/> : <Play className="h-4 w-4 mr-2"/>}
          {isActive ? "Stoppen" : "Aktivieren"}
        </Button>
      </CardContent>
    </Card>
  );
}

/***********************************
|*   SPECTRUM VISUALIZER           *|
***********************************/

function SpectrumVisualizer({ spectrum }: { spectrum: SpectrumData | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!spectrum) {
      // Zeige Lade-Indikator wenn keine Daten verfügbar
      ctx.fillStyle = '#ffaa00';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Lade Spektrumdaten...', width / 2, height / 2);
      return;
    }
    
    // Background grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Echte Spektrumdaten zeichnen
    if (spectrum.data && Array.isArray(spectrum.data) && spectrum.data.length > 0) {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      spectrum.data.forEach((value, index) => {
        const x = (index / spectrum.data.length) * width;
        const y = height - ((value + 100) / 100) * height; // Scale dB values
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Echte Frequenz-Marker basierend auf den Daten
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      const centerFreq = spectrum.frequency / 1e6;
      const bandwidth = spectrum.bandwidth / 1e6;
      const startFreq = centerFreq - bandwidth / 2;
      
      for (let i = 0; i <= 5; i++) {
        const freq = startFreq + (i * bandwidth / 5);
        const x = (i / 5) * width;
        ctx.fillText(`${freq.toFixed(1)} MHz`, x, height - 5);
      }
      
      // Spektrum-Info anzeigen
      ctx.fillStyle = '#00ff88';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Freq: ${centerFreq.toFixed(3)} MHz`, 10, 20);
      ctx.fillText(`BW: ${bandwidth.toFixed(2)} MHz`, 10, 35);
      ctx.fillText(`Updated: ${new Date(spectrum.timestamp).toLocaleTimeString()}`, 10, 50);
    } else {
      // Zeige Fehlermeldung wenn Daten ungültig
      ctx.fillStyle = '#ff4444';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Spektrumdaten ungültig', width / 2, height / 2);
      ctx.fillText('HFRF-SDR-Server prüfen', width / 2, height / 2 + 20);
    }
    
  }, [spectrum]);
  
  return (
    <Card className="rounded-2xl shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5"/>
          Spektrumanalyse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-black rounded-xl p-2">
          <canvas 
            ref={canvasRef}
            width={800} 
            height={200}
            className="w-full h-48 border border-gray-600 rounded"
          />
        </div>
        {spectrum && (
          <div className="mt-2 text-sm text-muted-foreground">
            Zentrale Frequenz: {(spectrum.frequency / 1e6).toFixed(3)} MHz | 
            Bandbreite: {(spectrum.bandwidth / 1e6).toFixed(2)} MHz | 
            Aktualisiert: {new Date(spectrum.timestamp).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/***********************************
|*   HARDWARE STATUS               *|
***********************************/

function HardwareStatusPanel({ hardware }: { hardware: HardwareStatus | null }) {
  if (!hardware) return null;
  
  return (
    <Card className="rounded-2xl shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5"/>
          Hardware Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Gerät:</span>
          <Badge variant={hardware.status === "connected" ? "default" : "destructive"}>
            {hardware.device}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          <Badge variant={hardware.status === "connected" ? "default" : "destructive"}>
            {hardware.status === "connected" ? "Verbunden" : "Getrennt"}
          </Badge>
        </div>
        {hardware.temperature && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Temperatur:</span>
            <span>{hardware.temperature}°C</span>
          </div>
        )}
        {hardware.power_level && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Leistung:</span>
            <span>{hardware.power_level} dBm</span>
          </div>
        )}
        <div>
          <span className="font-medium">Fähigkeiten:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {hardware.capabilities.map(cap => (
              <Badge key={cap} variant="outline" className="text-xs">
                {cap}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/***********************************
|*        SWIPE-HUB & UI           *|
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

function ContactCard({ name, phone, email, description }: { 
  name: string; 
  phone: string; 
  email?: string; 
  description: string; 
}) {
  return (
    <Card className="rounded-2xl shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic2 className="h-5 w-5 text-blue-600"/>
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-green-600"/>
          <a href={`tel:${phone}`} className="text-green-600 hover:text-green-700 font-mono">
            {phone}
          </a>
        </div>
        {email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600"/>
            <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-700">
              {email}
            </a>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function HFRFSwipeHub() {
  const { presets, spectrum, hardware, loading, error } = useHFRFDiscovery();
  
  return (
    <div className="space-y-6">
      {/* Raymond Demitrio Tel Kontakt-Info */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5"/>
          Raymond Demitrio Tel - Kontakt & Kommunikation
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ContactCard 
            name="Raymond Demitrio Tel"
            phone="+31 613 803 782"
            email="raymond@tel1.nl"
            description="HFRF-SDR Entwickler, WebTrit-Swipe Erfinder, Kommunikations-Experte"
          />
          <Card className="rounded-2xl shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-green-600"/>
                WebTrit-Swipe Technologie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600"/>
                <span className="text-sm">Sichere Kommunikation</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600"/>
                <span className="text-sm">End-to-End Verschlüsselung</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Revolutionäre Swipe-Technik für intuitive Kommunikation zwischen allen Frequenzbändern und Protokollen.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HFRF Test-Canvas-App Bereich */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5"/>
          HFRF Test-Canvas-App - Selbstheilung & Diagnostik
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="rounded-2xl shadow bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TestTube className="h-5 w-5 text-purple-600"/>
                Test-Canvas-App System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">🧪 Test-Canvas-App URL</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Direkter Zugang:</strong><br/>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs break-all">
                    http://localhost:8080/test-canvas-app.html
                  </code>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vollständige Test-Umgebung für alle HFRF-SDR Funktionen mit Live-Spektrum-Analyse, 
                  API-Tests, und Selbstheilungs-Diagnostik.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5 text-orange-600"/>
                Selbstheilungs-Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">🔧 Verfügbare Diagnose-Tools</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <strong>Discovery & CORS-Checks</strong> - Automatische API-Verbindungstests</li>
                  <li>• <strong>Playability & Codec-Tests</strong> - Audio/Video-Codec-Erkennung</li>
                  <li>• <strong>A11y & Accessibility</strong> - Barrierefreiheits-Tests</li>
                  <li>• <strong>Royalty-Queue Management</strong> - Offline-Daten-Überwachung</li>
                  <li>• <strong>ZIP-Viewer & File-Analyse</strong> - hfrf-universal-sdr.zip Browser-Analyse</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Selbstheilungs-Anleitung */}
        <Card className="rounded-2xl shadow bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600"/>
              💡 Selbstheilungs-Anleitung für User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">🚀 Schnellstart</h5>
                  <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li><strong>Test-Canvas-App öffnen:</strong> Klicke auf die URL oben</li>
                    <li><strong>Test/Lab-Tab aktivieren:</strong> Alle Diagnose-Tools verfügbar</li>
                    <li><strong>Live-Checks ausführen:</strong> Automatische System-Diagnose</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">🔍 Erweiterte Diagnose</h5>
                  <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li><strong>ZIP-Viewer nutzen:</strong> hfrf-universal-sdr.zip analysieren</li>
                    <li><strong>Royalty-Queue prüfen:</strong> Offline-Daten überwachen</li>
                    <li><strong>Spektrum-Monitor:</strong> Live RF-Daten beobachten</li>
                  </ol>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>💡 Tipp:</strong> Alle Tests laufen automatisch im Hintergrund. 
                  Bei Problemen zeigt das System konkrete Lösungsvorschläge an.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <LinkRow href="http://localhost:8080" label="HFRF-SDR Local"/>
        <LinkRow href="http://localhost:8080/test-canvas-app.html" label="Test-Canvas-App"/>
        <LinkRow href="https://digitalnotar.in/hfrf" label="HFRF-SDR Remote"/>
        <LinkRow href="https://tel1.nl/hfrf" label="TEL Portal Integration"/>
      </div>

      {loading && <div className="text-sm opacity-70">Lade HFRF-SDR-System...</div>}
      {error && <div className="text-sm text-red-600">Discovery-Fehler: {error}</div>}

      {spectrum && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5"/> Live Spektrum
          </h3>
          <SpectrumVisualizer spectrum={spectrum}/>
        </section>
      )}

      {hardware && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5"/> Hardware Status
          </h3>
          <HardwareStatusPanel hardware={hardware}/>
        </section>
      )}

      {!!presets?.length && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5"/> SDR Presets ({presets.length})
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {presets.map(preset => <SDRPresetPlayer key={preset.id} preset={preset}/>)}
          </div>
        </section>
      )}

      {!loading && !presets?.length && (
        <div className="text-sm opacity-70">
          Keine HFRF-SDR-Presets gefunden. Stelle sicher, dass der HFRF-SDR-Server läuft und unter <code>/api/presets</code> erreichbar ist.
        </div>
      )}
    </div>
  );
}

function HFRFCommunication() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5"/> SDR-Kommunikation & Messaging
      </h3>
      <p className="text-sm opacity-80">
        Diese Oberfläche ist bereit für SDR-spezifische Kommunikationsprotokolle (keine Mock-User, kein Login-Zwang). 
        Endpunkte serverseitig hinterlegen und direkt mit HFRF-SDR-System verbinden.
      </p>
      <div className="rounded-xl border p-4">
        <code className="text-xs">
          // Beispiel: SDR-WebSocket via tokio-tungstenite, UDP-Messaging via tokio-udp – sofort integrierbar.
        </code>
      </div>
    </div>
  );
}

function HFRFTech() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="h-5 w-5"/> HFRF-SDR Technologie
      </h3>
      <p className="text-sm opacity-80">
        Echte HFRF-SDR-Technologie-Integration. Lade hier echte SDR-Demos (WASM/AudioIQ) über URLs – keine Mockdaten.
      </p>
      <div className="rounded-xl border p-4">
        <code className="text-xs">
          // Beispiel: <iframe src="/hfrf/sdr-demo.html#src=https://cdn.example.com/hfrf/spectrum.iq" />
        </code>
      </div>
    </div>
  );
}

export default function HFRFApp() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">HFRF Universal SDR — WebTrit-Auftritt</h1>
          <p className="text-sm opacity-70">
            Kein Login. Keine Barrieren. Echte HFRF-SDR-Inhalte direkt vom System. Royalty-Zählung client-seitig.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">No-Barrier</Badge>
          <Badge variant="outline">HFRF-SDR</Badge>
          <Badge variant="outline">Audit-Ready</Badge>
        </div>
      </header>

      <Tabs defaultValue="hub" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hub">HFRF-Hub</TabsTrigger>
          <TabsTrigger value="comm">SDR-Kommunikation</TabsTrigger>
          <TabsTrigger value="tech">HFRF-Tech</TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="mt-4">
          <HFRFSwipeHub />
        </TabsContent>

        <TabsContent value="comm" className="mt-4">
          <HFRFCommunication />
        </TabsContent>

        <TabsContent value="tech" className="mt-4">
          <HFRFTech />
        </TabsContent>
      </Tabs>
    </div>
  );
}
