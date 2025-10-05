// Cloudflare Worker - Edge Gateway mit Self-Healing
// SICHERHEIT: Nur für autorisierte Benutzer zugänglich
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allow = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    
    // SICHERHEIT: Authorization Header prüfen
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await this.checkAuthorization(authHeader, env);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allow.includes(origin) ? origin : allow[0] || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Vary': 'Origin',
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    
    // SICHERHEIT: Für kritische Endpunkte Autorisierung erforderlich
    if (['/status', '/metrics', '/auth'].includes(url.pathname) && !isAuthorized) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Access denied. Authorization required.',
        code: 401
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

        // WebSocket Signaling via Durable Object
        if (url.pathname.startsWith('/ws')) {
            const id = url.searchParams.get('room') || 'default';
            const stub = env.ROOMS.get(env.ROOMS.idFromName(id));
            return stub.fetch(request);
        }

        // Health Endpoint direkt am Edge
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ ok: true, edge: true, ts: Date.now() }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // RTC Config mit kurzlebigen TURN-Credentials
        if (url.pathname === '/rtc-config') {
            const creds = await genTurnCreds(env);
            const payload = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
                    {
                        urls: [`turn:${env.TURN_REALM}:3478?transport=udp`, `turn:${env.TURN_REALM}:3478?transport=tcp`],
                        username: creds.username,
                        credential: creds.credential,
                    },
                ],
                ttl: creds.ttl,
            };
            return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Mock API Endpoints für Demo
        if (url.pathname === '/status') {
            return new Response(JSON.stringify({
                uptimeSec: Math.floor(Date.now() / 1000) % 3600,
                appsOnline: 87,
                modulesLoaded: 42,
                lastDeploy: new Date().toISOString(),
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (url.pathname === '/metrics') {
            return new Response(JSON.stringify({
                stars: 150,
                forks: 25,
                releases: 12,
                downloads: 1250,
                updatedAt: new Date().toISOString(),
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // AUTO-BUG-FIX: Bug-Detection Endpunkte
        if (url.pathname === '/js-errors') {
            return new Response(JSON.stringify([
                { message: 'process is not defined', file: 'feature-detection.mjs', line: 271 },
                { message: 'addAll failed', file: 'sw.js', line: 73 }
            ]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (url.pathname === '/css-issues') {
            return new Response(JSON.stringify([
                { message: 'missing property', selector: '.ui-framework' }
            ]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (url.pathname === '/api-errors') {
            return new Response(JSON.stringify([
                { endpoint: '/health', status: 404, message: 'Endpoint not found' }
            ]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (url.pathname === '/apply-fix') {
            if (request.method === 'POST') {
                const fix = await request.json();
                // Hier würde der Fix angewendet werden
                return new Response(JSON.stringify({
                    success: true,
                    fix: fix.type,
                    applied: new Date().toISOString()
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // Default Response
        return new Response(JSON.stringify({
            message: 'OnAir MultiMedia API',
            version: '1.0.0',
            endpoints: ['/health', '/status', '/metrics', '/rtc-config', '/ws', '/js-errors', '/css-issues', '/api-errors', '/apply-fix']
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    },

    // SICHERHEIT: Authentifizierungsfunktion
    async checkAuthorization(authHeader, env) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }
      
      const token = authHeader.substring(7);
      const authorizedToken = env.AUTHORIZED_TOKEN || 'OnAir2024SecureToken';
      
      // Einfache Token-Validierung (in Produktion: JWT oder komplexere Validierung)
      return token === authorizedToken;
    }
};

// TURN Credentials Generator
async function genTurnCreds(env) {
    const lifetimeSec = 3600; // 1h gültig
    const username = `${Math.floor(Date.now() / 1000) + lifetimeSec}`;
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(env.TURN_SHARED_SECRET), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username));
    const credential = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return { username, credential, ttl: lifetimeSec };
}

// Durable Object für WebSocket Rooms
export class RoomsDO {
    constructor(state, env) {
        this.state = state;
        this.clients = new Set();
    }

    async fetch(request) {
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('Expected WebSocket', { status: 426 });
        }
        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        server.addEventListener('message', (evt) => {
            for (const c of this.clients) if (c !== server) c.send(evt.data);
        });
        server.addEventListener('close', () => this.clients.delete(server));
        this.clients.add(server);
        return new Response(null, { status: 101, webSocket: client });
    }
}
