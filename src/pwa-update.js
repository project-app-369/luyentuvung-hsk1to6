// Check on each launch and when returning to the app, without caching sw.js.
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
const offlinePacks=__OFFLINE_PACKS__;
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
