self.addEventListener('install',e=>{self.skipWaiting();});
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
});