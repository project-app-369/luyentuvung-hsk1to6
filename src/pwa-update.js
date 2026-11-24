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
