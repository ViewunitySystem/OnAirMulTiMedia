/*
  USB Manager – Cross‑Platform (Windows/Linux/macOS)
  -------------------------------------------------
  Ziele:
  - KEIN Mock. Reale Systemabfragen pro OS.
  - Windows OHNE WMIC nutzbar (PowerShell/CIM). Fallback auf WMIC, wenn vorhanden.
  - Linux via /sys/bus/usb/devices (präzise), Fallback auf lsusb.
  - macOS via system_profiler (JSON), Fallback auf ioreg.
  - Einheitliches JSON‑Schema + CLI (list | watch) inkl. Pretty‑Ausgabe.

  Nutzung:
    # Kompilieren (oder tsx/ts-node nutzen)
    npx tsx usb-manager.ts list --pretty
    npx tsx usb-manager.ts watch --interval 2000 --pretty
*/

import { execFile, exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ---------- Types ----------
export type OS = 'win' | 'linux' | 'darwin';
export interface USBDevice {
  os: OS;
  vendorId?: string; // hex lowercase, e.g. "0781"
  productId?: string; // hex lowercase, e.g. "5581"
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  deviceName?: string; // friendly/human name
  bus?: string; // linux bus number or mac location group
  deviceAddress?: string; // linux device address
  locationId?: string; // macOS location id (hex)
  pnpId?: string; // Windows PNPDeviceID
  raw?: any; // raw OS specific payload for debugging
}

// ---------- Helpers ----------
const PLATFORM: OS = process.platform === 'win32' ? 'win' : (process.platform === 'darwin' ? 'darwin' : 'linux');

function which(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (PLATFORM === 'win') {
      exec(`where ${cmd}`, (err) => resolve(!err));
    } else {
      exec(`command -v ${cmd}`, (err) => resolve(!err));
    }
  });
}

function execPS(psCommand: string): Promise<{ ok: boolean; stdout: string; stderr: string }>{
  return new Promise((resolve) => {
    const exe = 'powershell.exe'; // Windows inbox
    execFile(exe, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], { windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: stdout?.toString() || '', stderr: stderr?.toString() || '' });
    });
  });
}

function uniqueKey(d: USBDevice): string {
  return [d.os, d.vendorId, d.productId, d.serialNumber, d.pnpId, d.locationId, d.deviceAddress, d.product, d.deviceName].filter(Boolean).join('|');
}

// Normalize hex id (VID/PID)
function toHex4(x?: string): string | undefined {
  if (!x) return undefined;
  const m = x.match(/[0-9a-fA-F]{4}/);
  return m ? m[0].toLowerCase() : undefined;
}

// ---------- Windows (PowerShell/CIM preferred; WMIC fallback) ----------
async function listWindows(): Promise<USBDevice[]> {
  // Prefer CIM/PowerShell JSON
  const ps = `$ErrorActionPreference='SilentlyContinue'; Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPDeviceID -like 'USB*' } | Select-Object Name,PNPDeviceID,Manufacturer,ConfigManagerErrorCode,Status | ConvertTo-Json -Depth 3`;
  const r = await execPS(ps);
  if (r.ok && r.stdout.trim().length) {
    try {
      const json = JSON.parse(r.stdout);
      const arr = Array.isArray(json) ? json : [json];
      return arr.map((it: any): USBDevice => {
        // PNPDeviceID like: USB\\VID_0781&PID_5581\\1234567890
        const pnp: string = it.PNPDeviceID || '';
        const vid = (pnp.match(/VID_([0-9A-F]{4})/i) || [])[1];
        const pid = (pnp.match(/PID_([0-9A-F]{4})/i) || [])[1];
        const serial = pnp.split('\\').pop();
        return {
          os: 'win',
          vendorId: toHex4(vid),
          productId: toHex4(pid),
          serialNumber: serial && /[A-Za-z0-9]/.test(serial) ? serial : undefined,
          manufacturer: it.Manufacturer || undefined,
          product: it.Name || undefined,
          deviceName: it.Name || undefined,
          pnpId: pnp || undefined,
          raw: it,
        };
      });
    } catch(_) { /* continue to wmic */ }
  }

  // Fallback: WMIC (deprecated, optional)
  const hasWmic = await which('wmic');
  if (hasWmic) {
    return new Promise((resolve) => {
      execFile('wmic', ['path','Win32_PnPEntity','where','PNPDeviceID like "USB%"','get','Name,PNPDeviceID,Manufacturer,ConfigManagerErrorCode','/format:csv'], { windowsHide: true }, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const lines = stdout.toString().split(/\r?\n/).filter(Boolean);
        const devices: USBDevice[] = [];
        for (const ln of lines) {
          // CSV may look like: Node,ConfigManagerErrorCode,Manufacturer,Name,PNPDeviceID
          const parts = ln.split(',');
          if (parts.length < 5 || ln.startsWith('Node')) continue;
          const name = parts[3]?.trim();
          const pnp = parts[4]?.trim();
          const vid = (pnp.match(/VID_([0-9A-F]{4})/i) || [])[1];
          const pid = (pnp.match(/PID_([0-9A-F]{4})/i) || [])[1];
          const serial = pnp.split('\\').pop();
          devices.push({
            os: 'win',
            vendorId: toHex4(vid),
            productId: toHex4(pid),
            serialNumber: serial && /[A-Za-z0-9]/.test(serial) ? serial : undefined,
            product: name || undefined,
            deviceName: name || undefined,
            pnpId: pnp || undefined,
            raw: ln,
          });
        }
        resolve(devices);
      });
    });
  }
  return [];
}

// ---------- Linux (/sys preferred; lsusb fallback) ----------
async function listLinux(): Promise<USBDevice[]> {
  const sys = '/sys/bus/usb/devices';
  const result: USBDevice[] = [];
  try {
    const entries = fs.readdirSync(sys);
    for (const ent of entries) {
      // device dirs are like '1-1', '2-1.3', skip 'usb1', 'usb2'
      if (!/^[0-9]+-/.test(ent)) continue;
      const d = path.join(sys, ent);
      const tryRead = (f: string) => {
        try { return fs.readFileSync(path.join(d, f), 'utf8').trim(); } catch { return undefined; }
      };
      const vendorId = toHex4(tryRead('idVendor'));
      const productId = toHex4(tryRead('idProduct'));
      const manufacturer = tryRead('manufacturer');
      const product = tryRead('product');
      const serialNumber = tryRead('serial');
      const devnum = tryRead('devnum');
      const busnum = tryRead('busnum');
      if (vendorId || productId || manufacturer || product) {
        result.push({
          os: 'linux',
          vendorId, productId, manufacturer, product, serialNumber,
          deviceAddress: devnum, bus: busnum, raw: { ent }
        });
      }
    }
    if (result.length) return result;
  } catch { /* fall back */ }

  // Fallback: lsusb
  const hasLsusb = await which('lsusb');
  if (hasLsusb) {
    return new Promise((resolve) => {
      execFile('lsusb', [], (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const devices: USBDevice[] = [];
        for (const ln of stdout.toString().split(/\n/)) {
          // Example: Bus 002 Device 003: ID 0781:5581 SanDisk Corp. Ultra
          const m = ln.match(/Bus\s+(\d+)\s+Device\s+(\d+):\s+ID\s+([0-9A-Fa-f]{4}):([0-9A-Fa-f]{4})\s+(.*)/);
          if (!m) continue;
          const [_, bus, dev, vid, pid, rest] = m;
          devices.push({ os: 'linux', vendorId: toHex4(vid), productId: toHex4(pid), deviceAddress: dev, bus, deviceName: rest?.trim(), product: rest?.trim(), raw: ln });
        }
        resolve(devices);
      });
    });
  }
  return result;
}

// ---------- macOS (system_profiler preferred; ioreg fallback) ----------
async function listDarwin(): Promise<USBDevice[]> {
  // Prefer JSON from system_profiler
  const hasSP = await which('system_profiler');
  if (hasSP) {
    try {
      const json = await new Promise<any>((resolve) => {
        execFile('system_profiler', ['SPUSBDataType', '-json'], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
          if (err || !stdout) return resolve(null);
          try { resolve(JSON.parse(stdout.toString())); } catch { resolve(null); }
        });
      });
      const list: USBDevice[] = [];
      function walk(node: any) {
        if (!node) return;
        const items = node._items || node.items || [];
        for (const it of items) {
          const vid = toHex4((it.vendor_id || '').toString());
          const pid = toHex4((it.product_id || '').toString());
          const dev: USBDevice = {
            os: 'darwin',
            vendorId: vid,
            productId: pid,
            manufacturer: it.manufacturer || undefined,
            product: it._name || it.product_name || undefined,
            serialNumber: it.serial_num || undefined,
            locationId: (it.location_id || '').toString(),
            deviceName: it._name || undefined,
            raw: it,
          };
          if (dev.vendorId || dev.product || dev.deviceName) list.push(dev);
          if (it._items) walk(it);
        }
      }
      if (json && json.SPUSBDataType) {
        for (const section of json.SPUSBDataType) walk(section);
      }
      if (list.length) return list;
    } catch { /* fallback */ }
  }

  // Fallback: ioreg
  const hasIoreg = await which('ioreg');
  if (hasIoreg) {
    return new Promise((resolve) => {
      execFile('ioreg', ['-p','IOUSB','-l','-w','0'], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const out = stdout.toString();
        const blocks = out.split(/\n\+/).map(s=>s.trim());
        const devices: USBDevice[] = [];
        for (const b of blocks) {
          const name = (b.match(/"USB Product Name" = "([^"]+)"/) || b.match(/"IORegistryEntryName" = "([^"]+)"/) || [])[1];
          const manu = (b.match(/"USB Vendor Name" = "([^"]+)"/) || [])[1];
          const pid = (b.match(/"idProduct" = (\d+)/) || [])[1];
          const vid = (b.match(/"idVendor" = (\d+)/) || [])[1];
          const serial = (b.match(/"USB Serial Number" = "([^"]+)"/) || [])[1];
          if (name || pid || vid) {
            devices.push({ os: 'darwin', product: name, deviceName: name, manufacturer: manu, productId: pid ? Number(pid).toString(16).padStart(4,'0') : undefined, vendorId: vid ? Number(vid).toString(16).padStart(4,'0') : undefined, serialNumber: serial, raw: b });
          }
        }
        resolve(devices);
      });
    });
  }
  return [];
}

// ---------- Top-level list() ----------
export async function listUSB(): Promise<USBDevice[]> {
  if (PLATFORM === 'win') return await listWindows();
  if (PLATFORM === 'darwin') return await listDarwin();
  return await listLinux();
}

// ---------- Watch (polling diff) ----------
export async function watchUSB(intervalMs = 2000, onChange?: (added: USBDevice[], removed: USBDevice[]) => void) {
  let last: Map<string, USBDevice> = new Map();
  async function tick(){
    try {
      const now = new Map<string, USBDevice>();
      const list = await listUSB();
      for (const d of list) now.set(uniqueKey(d), d);
      const added: USBDevice[] = [];
      const removed: USBDevice[] = [];
      for (const [k, dv] of now) if (!last.has(k)) added.push(dv);
      for (const [k, dv] of last) if (!now.has(k)) removed.push(dv);
      if ((added.length || removed.length) && onChange) onChange(added, removed);
      last = now;
    } catch (e) {
      console.error('[usb-manager] watch tick error:', (e as Error).message);
    }
  }
  await tick();
  const t = setInterval(tick, intervalMs);
  return () => clearInterval(t);
}

// ---------- CLI ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const args = process.argv.slice(2);
    const pretty = args.includes('--pretty');
    const intervalIdx = args.indexOf('--interval');
    const interval = intervalIdx >= 0 ? parseInt(args[intervalIdx+1] || '2000', 10) : 2000;

    const cmd = args[0] || 'list';
    if (cmd === 'list') {
      const devs = await listUSB();
      if (pretty) {
        printTable(devs);
      } else {
        console.log(JSON.stringify(devs, null, 2));
      }
      process.exit(0);
    }
    if (cmd === 'watch') {
      console.log(`[usb-manager] watching (${interval}ms)…`);
      let first = true;
      await watchUSB(interval, (added, removed) => {
        if (pretty) {
          if (!first) console.log('—');
          if (added.length) { console.log('Added:'); printTable(added); }
          if (removed.length) { console.log('Removed:'); printTable(removed); }
        } else {
          console.log(JSON.stringify({ added, removed }, null, 2));
        }
        first = false;
      });
    }
  })();
}

function printTable(devs: USBDevice[]) {
  const cols = ['os','vendorId','productId','manufacturer','product','serialNumber','bus','deviceAddress','locationId','pnpId'];
  const rows = devs.map(d=>cols.map(c=>((d as any)[c]||'').toString())) as string[][];
  const widths = cols.map((c,i)=>Math.max(c.length, ...rows.map(r=>r[i]?.length||0)));
  const fmt = (arr:string[])=>arr.map((v,i)=>v.padEnd(widths[i])).join('  ');
  console.log(fmt(cols));
  console.log(widths.map(w=>'—'.repeat(w)).join('  '));
  for (const r of rows) console.log(fmt(r));
}
