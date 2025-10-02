import * as fs from 'node:fs';

const SW = `self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim());});
self.addEventListener('fetch',event=>{
  const req = event.request;
  const isNav = req.mode === 'navigate';
  event.respondWith((async()=>{
    try{
      const res = await fetch(req);
      if(isNav && res.status===404){
        return caches.match('/offline.html') || fetch('/offline.html');
      }
      return res;
    }catch(err){
      if(isNav){
        return caches.match('/offline.html') || new Response('<h1>Offline</h1>',{headers:{'Content-Type':'text/html'}});
      }
      throw err;
    }
  })());
});`;

export default {
  enabled: (cfg:any)=>cfg.rules.serviceWorkerFallback?.enabled,
  run: async (cfg:any)=>{
    const offline = cfg.rules.serviceWorkerFallback.offlinePath || 'public/offline.html';
    if (!fs.existsSync('public')) fs.mkdirSync('public');
    if (!fs.existsSync(offline)) fs.writeFileSync(offline, '<!doctype html><meta charset="utf-8"><title>Offline</title><h1>Offline / 404</h1><p>Bitte später erneut versuchen.</p>');
    fs.writeFileSync('public/sw.js', SW);

    // Registrieren im index.html, falls noch nicht vorhanden
    if (fs.existsSync('index.html')){
      let txt = fs.readFileSync('index.html','utf8');
      if (!/navigator\.serviceWorker/.test(txt)){
        txt = txt.replace('</body>', '<script>window.addEventListener("load",()=>{"serviceWorker" in navigator && navigator.serviceWorker.register("/public/sw.js");});</script></body>');
        fs.writeFileSync('index.html', txt);
      }
    }
    return { changed: true };
  }
}



