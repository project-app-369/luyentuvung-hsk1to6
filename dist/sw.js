const CACHE='luyentuvung-hsk1to6-eff01a85d2d4';
const CORE=["./", "./index.html", "./pwa.js", "./manifest.webmanifest", "./icons/app-192-bvpro-v6.png", "./icons/app-512-bvpro-v6.png", "./icons/maskable-512-bvpro-v6.png", "./icons/apple-touch-icon-bvpro-v6.png", "./icons/favicon-32-bvpro-v6.png", "./attribution.json", "./social-preview-bvpro-v6.png", "./fonts/BeVietnamPro-Regular-7352e03b27.woff2", "./fonts/BeVietnamPro-SemiBold-8225675521.woff2", "./fonts/BeVietnamPro-Bold-93fdbbc7ec.woff2", "./fonts/UKai-ui-0cbf3c36e5.woff2", "./fonts/UKai-course-e984d8c61c.woff2", "./fonts/UKai-extended-7a4d1601be.woff2", "./fonts/WenKai-Regular-ui-cc47a90dd5.woff2", "./fonts/WenKai-Regular-course-eec97761b0.woff2", "./fonts/WenKai-Regular-extended-0bc500393d.woff2", "./fonts/WenKai-Medium-ui-a20fe7024e.woff2", "./fonts/WenKai-Medium-course-7e8bf36f47.woff2", "./fonts/WenKai-Medium-extended-cd7ca6e14f.woff2", "./fonts/ARPHICPL.TXT", "./fonts/UKAI-MODIFICATIONS.txt", "./assets/cloud-ed2c10aa1a60.js", "./assets/motion-c329fea8daf2.js", "./assets/firebase-client.bundle.js.LEGAL.txt", "./assets/FIREBASE-SDK-LICENSE.txt", "./icons/mark-bvpro-v6.svg", "./icons/favicon-bvpro-v6.ico", "./icons/favicon-48-bvpro-v6.png", "./favicon.ico"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const replacing=keys.some(key=>key.startsWith('luyentuvung-hsk1to6-')&&key!==CACHE);
    await Promise.all(keys.filter(key=>key.startsWith('luyentuvung-hsk1to6-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
    // Navigate once after an upgrade, including legacy clients whose cached
    // pwa.js did not yet contain an update listener. localStorage is retained.
    if(replacing)for(const client of await self.clients.matchAll({type:'window'})){
      // Do not await navigation inside activation: its fetch must wait for
      // this activation event to finish, otherwise the upgrade deadlocks.
      if(client.url.startsWith(self.registration.scope))client.navigate(client.url).catch(()=>{});
    }
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(req,{cache:'no-store'});
        if(response.ok){await cache.put(new URL('./index.html',self.registration.scope),response.clone());return response;}
      }catch{}
      return await cache.match(new URL('./index.html',self.registration.scope))||await cache.match(new URL('./',self.registration.scope))||Response.error();
    })());return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
