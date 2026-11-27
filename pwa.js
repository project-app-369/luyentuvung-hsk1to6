let installPrompt;const installButton=document.getElementById('install-app');addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true});if(matchMedia('(display-mode: standalone)').matches)installButton.hidden=true;installButton.onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null}else{const d=document.createElement('dialog');d.innerHTML='<h2>Cài ứng dụng</h2><p>Chrome / Edge: mở menu trình duyệt, chọn Cài đặt ứng dụng. Trên iPhone / iPad: mở bằng Safari, chọn Chia sẻ rồi Thêm vào Màn hình chính.</p><button>Đã hiểu</button>';d.style.cssText='max-width:340px;padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--paper);color:var(--ink)';d.querySelector('button').onclick=()=>d.remove();document.body.append(d);d.showModal()}};// Check on each launch and when returning to the app, without caching sw.js.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let reloadStarted=false;
  const reloadForUpdate=()=>{
    if(reloadStarted)return;
    reloadStarted=true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='HSK_UPDATE_READY')reloadForUpdate();
  });
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
    reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')reg.update().catch(()=>{});
    });
  }).catch(()=>console.warn('Chưa thể cập nhật chế độ ngoại tuyến.'));
}

// Keep the full course download separate from launch and resume it from cache.
const offlinePacks=["assets/strokes-09b401bc3962bb35.json", "assets/strokes-2de8d760ddad2ddf.json", "assets/strokes-e86228291b303f70.json", "assets/strokes-2177b44738e6e294.json", "assets/strokes-5c12372fbbb565ae.json", "assets/strokes-e2d763d2eff1339b.json", "assets/strokes-cf29625e3ca7bc10.json", "assets/strokes-78474e8f60b8cf65.json", "assets/strokes-83816c6d02ca4756.json", "assets/strokes-2bc77909e1225a03.json", "assets/strokes-838df518eb359754.json", "assets/strokes-a5f57653b33e5d81.json", "assets/strokes-0b294d0a1cc1ec99.json", "assets/strokes-3a2c27c10dcf5516.json", "assets/strokes-88fc6846d70cb548.json", "assets/strokes-86d27d9e3871a529.json", "assets/strokes-af65a4cf433d32c4.json", "assets/strokes-2b347e5ace08074b.json", "assets/strokes-e624a82e2793db10.json", "assets/strokes-ff3644c6d7a38da9.json", "assets/strokes-9b92367da3fc6cd9.json", "assets/strokes-f56bfb2763731c27.json", "assets/strokes-59b6998343227a95.json", "assets/strokes-9d398916f9645a58.json", "assets/strokes-82e32477fac1a5d9.json", "assets/strokes-1344034f2c062ffe.json", "assets/strokes-9461492c7a85d243.json", "assets/strokes-c237f2be2f9c9d88.json", "assets/strokes-7a50a442bfb8aa66.json", "assets/examples-a898402f34ad248b.json", "assets/examples-3f925ce5eed27fe4.json", "assets/examples-9bfab29f7759fd0d.json", "assets/examples-ffdfcc0b098fe15f.json", "assets/examples-92db835eb745c29f.json", "assets/examples-63d676c29b0eb034.json", "assets/examples-faca41cf9a382fca.json", "assets/examples-b43b64a7d97e7802.json", "assets/examples-11aea048537ad82f.json", "assets/examples-5fc137da8477d177.json", "assets/examples-55389c5aeac9ae40.json", "assets/examples-9ff639cfaab9be56.json", "assets/examples-3fad1a7a9f2edf81.json", "assets/examples-c246487abef2ac7b.json", "assets/examples-1816e712a541f0a2.json", "assets/examples-2d3227a0b3095efd.json", "assets/examples-f231a6df9da7459c.json", "assets/examples-8a69f4819e85d3e4.json", "assets/examples-7d5e444590e4ba60.json", "assets/examples-70a84911faf2144d.json", "assets/examples-8b308f3e0fbd6741.json", "assets/examples-ca66ebf2b9f10100.json", "assets/examples-f9d10db2617653fa.json", "assets/examples-f04b2dc1a1521880.json", "assets/examples-ae653ab006e0cdd0.json", "assets/examples-eceb3202006b0272.json", "assets/examples-0616d310940806cc.json", "assets/examples-2ef4cbf1fca13a75.json", "assets/examples-f9fe6910e0529b24.json", "assets/examples-bf851bfdc73103b2.json", "assets/examples-1f984083fd3d2ee4.json", "assets/examples-189885cfeec8626e.json", "assets/examples-eed6158f1617a8b8.json", "assets/examples-3a88d8d63913b7c4.json", "assets/examples-1573a7192695f105.json", "assets/examples-9a0131e8af015f8d.json", "assets/examples-05b0a3e017ddff84.json", "assets/examples-3658db74af9d2cb0.json", "assets/examples-9d092e986d3ffcf4.json", "assets/examples-2c21ddde252079fc.json", "fonts/UKai-extended-7a4d1601be.woff2", "fonts/WenKai-Regular-extended-0bc500393d.woff2", "fonts/WenKai-Medium-extended-cd7ca6e14f.woff2"];
let offlineDownload=null,offlineStatus='';
function paintOfflineDownload(){
  const button=document.getElementById('offline-download');
  const status=document.getElementById('offline-status');
  if(button)button.disabled=!!offlineDownload;
  if(status)status.textContent=offlineStatus;
}
document.addEventListener('hsk:view',paintOfflineDownload);
document.addEventListener('click',event=>{
  if(!event.target.closest('#offline-download')||offlineDownload)return;
  if(!navigator.serviceWorker?.controller||!window.caches){
    offlineStatus='Chế độ ngoại tuyến đang chuẩn bị. Hãy thử lại sau khi app đã tải xong.';
    paintOfflineDownload();
    return;
  }
  offlineStatus='Đang tải bộ học…';
  offlineDownload=(async()=>{
    const cache=await caches.open('hsk-studio-lesson-packs-v1');
    for(let i=0;i<offlinePacks.length;i+=3){
      await Promise.all(offlinePacks.slice(i,i+3).map(async path=>{
        if(!await cache.match(path))await cache.add(path);
      }));
      offlineStatus=`Đã lưu ${Math.min(i+3,offlinePacks.length)}/${offlinePacks.length} gói.`;
      paintOfflineDownload();
    }
    offlineStatus='Đã lưu trọn bộ để học ngoại tuyến trên thiết bị này.';
  })().catch(()=>{
    offlineStatus='Tải chưa xong. Kiểm tra kết nối và dung lượng, rồi bấm Tải trọn bộ để tiếp tục.';
  }).finally(()=>{
    offlineDownload=null;
    paintOfflineDownload();
  });
  paintOfflineDownload();
});
