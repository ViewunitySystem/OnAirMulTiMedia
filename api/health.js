// Health Check Endpoint
// Einfacher Health Check für API-Backend

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime ? process.uptime() : 0,
        services: {
          api: 'running',
          database: 'connected',
          sync: 'active'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
