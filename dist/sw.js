const CACHE='luyentuvung-hsk1to6-ee75bd01f9ea';
const CORE=["./index.html", "./pwa.js", "./manifest.webmanifest", "./icons/app-192-ink-clear-v7.png", "./icons/app-512-ink-clear-v7.png", "./icons/maskable-512-ink-clear-v7.png", "./icons/apple-touch-icon-ink-clear-v7.png", "./icons/favicon-32-ink-clear-v7.png", "./fonts/BeVietnamPro-Regular-7352e03b27.woff2", "./fonts/BeVietnamPro-SemiBold-8225675521.woff2", "./fonts/BeVietnamPro-Bold-93fdbbc7ec.woff2", "./fonts/UKai-ui-0cbf3c36e5.woff2", "./fonts/UKai-course-e984d8c61c.woff2", "./fonts/WenKai-Regular-ui-cc47a90dd5.woff2", "./fonts/WenKai-Regular-course-eec97761b0.woff2", "./fonts/WenKai-Medium-ui-a20fe7024e.woff2", "./fonts/WenKai-Medium-course-7e8bf36f47.woff2", "./fonts/ARPHICPL.TXT", "./fonts/UKAI-MODIFICATIONS.txt", "./assets/cloud-ed2c10aa1a60.js", "./assets/motion-b6675bb4bbec.js", "./assets/firebase-client.bundle.js.LEGAL.txt", "./assets/FIREBASE-SDK-LICENSE.txt", "./assets/ink-91780b1281a8e491.webp", "./icons/mark-ink-clear-v7.svg", "./icons/favicon-ink-clear-v7.ico", "./icons/favicon-48-ink-clear-v7.png", "./favicon.ico"];
const LESSON_CACHE='hsk-studio-lesson-packs-v1';
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
      const shell=await cache.match(new URL('./index.html',self.registration.scope));
      return shell||fetch(req);
    })());return;
  }
  const relative=url.href.slice(self.registration.scope.length);
  const lessonAsset=url.href.startsWith(self.registration.scope)&&
    /^(?:assets\/(?:examples|strokes)-[a-f0-9]+\.json|fonts\/[^/]+-extended-[a-f0-9]+\.woff2)$/.test(relative);
  let saved=Promise.resolve();
  const response=(async()=>{
    const cache=await caches.open(lessonAsset?LESSON_CACHE:CACHE);
    const cached=await cache.match(req);
    if(cached)return cached;
    const response=await fetch(req);
    if(lessonAsset&&response.ok)saved=cache.put(req,response.clone()).catch(()=>{});
    return response;
  })();
  event.respondWith(response);
  if(lessonAsset)event.waitUntil(response.then(()=>saved,()=>{}));
});
