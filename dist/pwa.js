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
