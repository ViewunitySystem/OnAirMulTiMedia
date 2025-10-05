// Frontend Configuration für OnAir MultiMedia System
export const API_BASE_URL = 'https://onair-edge.telcotelekom.workers.dev';
export const WS_BASE_URL = 'wss://onair-edge.telcotelekom.workers.dev/ws';

// API Helper Functions
const j = (p) => fetch(`${API_BASE_URL}${p}`).then((r) => r.json());

export async function refreshTiles() {
    const [status, metrics] = await Promise.all([j('/status'), j('/metrics')]);
    console.log('Status:', status, 'Metrics:', metrics);
    return { status, metrics };
}

export function startRoom(room = 'global') {
    const ws = new WebSocket(`${WS_BASE_URL}?room=${encodeURIComponent(room)}`);
    ws.onmessage = (e) => console.log('WS:', e.data);
    ws.onopen = () => ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
    return ws;
}

// WebSocket mit Auto-Reconnect
export function connectWS(url, { onMessage, retryMs = 500, maxRetryMs = 8000 } = {}) {
    let ws, closed = false, backoff = retryMs;
    function open() {
        ws = new WebSocket(url);
        ws.onopen = () => { backoff = retryMs; };
        ws.onmessage = (e) => onMessage?.(e.data);
        ws.onclose = () => {
            if (closed) return;
            setTimeout(open, backoff);
            backoff = Math.min(backoff * 2, maxRetryMs);
        };
        ws.onerror = () => ws.close();
    }
    open();
    return { close: () => { closed = true; ws?.close(); } };
}

// ICE/TURN Configuration
export function getIceServers(turnUser, turnPass) {
    return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        {
            urls: ['turn:turn.<domain>:3478?transport=udp', 'turn:turn.<domain>:3478?transport=tcp'],
            username: turnUser,
            credential: turnPass,
        },
    ];
}

// Runtime Secrets vom Edge holen
export async function fetchRuntimeSecrets() {
    const res = await fetch(`${API_BASE_URL}/status`, { credentials: 'omit' });
    const s = await res.json();
    return { turnUser: s.turnUser || undefined, turnPass: s.turnPass || undefined };
}

// RTC Peer Connection erstellen
export function createPeer(turnUser, turnPass) {
    const pc = new RTCPeerConnection({ iceServers: getIceServers(turnUser, turnPass) });
    pc.addEventListener('icecandidate', (e) => {
        if (e.candidate) console.debug('ICE', e.candidate);
    });
    pc.addEventListener('connectionstatechange', () => {
        console.log('PC state:', pc.connectionState);
    });
    return pc;
}

// RTC mit WebSocket kombinieren
export async function startRTC(room = 'global') {
    const { turnUser, turnPass } = await fetchRuntimeSecrets();
    const pc = new RTCPeerConnection({ iceServers: getIceServers(turnUser, turnPass) });
    const wsCtl = connectWS(`${WS_BASE_URL}?room=${encodeURIComponent(room)}`, {
        onMessage: (msg) => {
            const data = JSON.parse(msg);
            // TODO: Signaling-Nachrichten (offer/answer/candidate) weiterleiten
        },
    });
    return { pc, wsCtl };
}
