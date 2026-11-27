import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,onAuthStateChanged,signOut,browserLocalPersistence,setPersistence} from 'firebase/auth';
import {getFirestore,collection,doc,onSnapshot,runTransaction,serverTimestamp} from 'firebase/firestore';
import config from './firebase-config.json';
import {Journal,mergeRecord,materialize,validRecord,same} from './sync-core.mjs';
const H=window.HSKCloudHost,K=H.key,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{H.toast('Không thể lưu bản đồng bộ trên thiết bị. Hãy sao lưu tiến độ.')}};
let device=read(K+'-device',null);if(typeof device!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(device)){device=crypto.randomUUID();write(K+'-device',device)}
let owner=read(K+'-owner','guest'),user=null,stop=null,ready=false,working=false,session=0,debounce,status='guest',detail='',bringGuest=true,busy=false;
const accountKey=uid=>K+'-account-'+uid,journalKey=uid=>K+'-journal-'+uid;
const loadAccount=uid=>{try{return H.validate(read(accountKey(uid),H.blank()))}catch{return H.blank()}};
let journal=new Journal(H.get(),device,read(journalKey(owner),{}),H.known);
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
function persist(){write(journalKey(owner),journal.serialize());write(accountKey(owner),H.get());write(K+'-owner',owner)}
function label(){return {guest:'Học trên thiết bị',connecting:'Đang kết nối',syncing:'Đang đồng bộ',synced:'Đã đồng bộ',offline:'Đã lưu trên thiết bị · chờ mạng',error:'Đã lưu trên thiết bị · chưa đồng bộ'}[status]||'Tài khoản'}
function setStatus(next,message=''){status=next;detail=message;paint()}
function paint(){
 const button=document.getElementById('account-toggle');if(button){button.dataset.sync=status;button.setAttribute('aria-label',user?'Tài khoản · '+label():'Đăng nhập để đồng bộ');button.title=user?label():'Đăng nhập để đồng bộ';}
 const panel=document.getElementById('account-panel');if(panel){panel.innerHTML=`<div class="account-summary"><span class="account-emblem">${H.icon('profile')}</span><div><h3>${user?'Tiến độ luôn bên bạn':'Học tiếp trên mọi thiết bị'}</h3><p>${user?esc(user.displayName||user.email||'Tài khoản của bạn'):'Đăng nhập để đồng bộ từ đã nhớ, ghi chú và lịch ôn.'}</p><p class="sync-status" data-sync="${status}" aria-live="polite">${esc(label())}</p></div></div><div class="actions"><button class="${user?'':'primary'}" id="account-panel-main">${user?'Quản lý tài khoản':'Đăng nhập'}</button>${user?'<button id="account-panel-sync">Đồng bộ ngay</button>':''}</div>`;panel.querySelector('#account-panel-main').onclick=openAccount;panel.querySelector('#account-panel-sync')?.addEventListener('click',retry);}
 const stateLine=document.getElementById('dialog-sync-status');if(stateLine)stateLine.textContent=label();
}
function userError(error){const code=String(error?.code||'');const messages={
 'auth/invalid-email':'Địa chỉ email chưa hợp lệ.','auth/missing-password':'Nhập mật khẩu của bạn.','auth/weak-password':'Dùng mật khẩu có ít nhất 6 ký tự.','auth/email-already-in-use':'Email này đã có tài khoản. Hãy đăng nhập hoặc đặt lại mật khẩu.','auth/invalid-credential':'Email hoặc mật khẩu chưa đúng.','auth/wrong-password':'Email hoặc mật khẩu chưa đúng.','auth/user-not-found':'Email hoặc mật khẩu chưa đúng.','auth/popup-closed-by-user':'Cửa sổ đăng nhập đã đóng. Bạn có thể thử lại.','auth/cancelled-popup-request':'Một lượt đăng nhập khác đang mở.','auth/popup-blocked':'Trình duyệt đã chặn cửa sổ Google. Hãy cho phép cửa sổ bật lên rồi thử lại.','auth/network-request-failed':'Chưa có kết nối mạng. Tiến độ trên thiết bị vẫn được giữ.','auth/too-many-requests':'Có quá nhiều lượt thử. Hãy chờ một chút rồi thử lại.','auth/account-exists-with-different-credential':'Email này dùng cách đăng nhập khác. Hãy dùng phương thức đã đăng ký.','auth/operation-not-allowed':'Phương thức đăng nhập này chưa được bật. Tiến độ vẫn lưu trên thiết bị.','auth/unauthorized-domain':'Địa chỉ web này chưa được cho phép đăng nhập.'};
 return messages[code]||'Dịch vụ chưa sẵn sàng. Tiến độ vẫn được lưu trên thiết bị; bạn có thể thử lại sau.';
}
function recordError(error){console.warn('HSK sync:',error?.code||'unavailable');setStatus(navigator.onLine?'error':'offline',userError(error))}
function rememberChanges(){journal.capture(H.get());persist();if(user){setStatus(navigator.onLine?'syncing':'offline');clearTimeout(debounce);debounce=setTimeout(flush,750)}}
addEventListener('course-event',event=>{if(event.detail?.type==='progress.updated')rememberChanges()});
function applyJournal(reset=false){const next=H.validate(materialize(journal.records,H.get()));H.apply(next,{reset});journal.applied(H.get());persist()}
function connect(){
 if(stop)stop();ready=false;if(!user)return;const uid=user.uid,token=session;
 setStatus(navigator.onLine?'connecting':'offline');
 stop=onSnapshot(collection(db,'users',uid,'courses',K,'items'),{includeMetadataChanges:true},snapshot=>{
  if(token!==session||auth.currentUser?.uid!==uid)return;let changed=false;
  for(const change of snapshot.docChanges())if(change.type!=='removed')changed=journal.merge(change.doc.id,change.doc.data())||changed;
  if(changed)applyJournal();
  if(!snapshot.metadata.fromCache){ready=true;if(journal.pending.size)flush();else setStatus('synced')}
 },error=>{if(token===session){ready=false;recordError(error)}});
}
async function flush(){
 if(working||!user||!ready)return;if(!navigator.onLine){setStatus('offline');return}working=true;const uid=user.uid,token=session;setStatus('syncing');
 try{
  for(const id of [...journal.pending]){
   if(token!==session||auth.currentUser?.uid!==uid)break;const local=JSON.parse(JSON.stringify(journal.records[id]));
   const committed=await runTransaction(db,async transaction=>{
    const ref=doc(db,'users',uid,'courses',K,'items',id),snapshot=await transaction.get(ref);
    const remote=snapshot.exists()?validRecord(snapshot.data(),H.known):null;const merged=mergeRecord(remote,local);
    if(!remote||!same(remote,merged))transaction.set(ref,{...merged,updatedAt:serverTimestamp()});return merged;
   });
   if(token!==session)break;journal.merge(id,committed);journal.ack(id,committed);persist();
  }
  if(token===session){applyJournal();setStatus(journal.pending.size?'syncing':'synced')}
 }catch(error){if(token===session)recordError(error)}finally{if(token===session){working=false;if(journal.pending.size&&status!=='error'&&navigator.onLine)setTimeout(flush,1000)}}
}
function retry(){if(!user){openAccount();return}if(!navigator.onLine){setStatus('offline');return}if(!ready)connect();else flush()}
addEventListener('online',retry);addEventListener('offline',()=>{if(user)setStatus('offline')});
async function accountChanged(next){
 const previousOwner=owner,previousJournal=journal;persist();session++;if(stop){stop();stop=null}user=next;ready=false;working=false;
 const uid=next?.uid||'guest';
 if(uid!==owner){owner=uid;const saved=loadAccount(uid);journal=new Journal(saved,device,read(journalKey(uid),{}),H.known);H.apply(saved,{reset:true});if(next&&previousOwner==='guest'&&bringGuest){journal.import(previousJournal);applyJournal(true)}}
 journal.applied(H.get());persist();
 if(next){connect();document.getElementById('account-dialog')?.close();if(previousOwner!==uid)H.toast('Đã đăng nhập. Tiến độ trên thiết bị vẫn được giữ.')}else setStatus('guest');paint();
}
setPersistence(auth,browserLocalPersistence).catch(()=>{}).finally(()=>onAuthStateChanged(auth,accountChanged,recordError));
function closeDialog(){document.getElementById('account-dialog')?.close()}
function openAccount(){
 if(!H.canSwitch()){H.toast('Hãy hoàn tất bài kiểm tra trước khi đổi tài khoản.');return}
 if(innerWidth<1000)H.closeNavigation();
 let dialog=document.getElementById('account-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='account-dialog';dialog.className='account-dialog';document.body.append(dialog);dialog.addEventListener('close',()=>{const password=dialog.querySelector('#login-password');if(password)password.value='';document.getElementById('account-toggle')?.focus()})}
 dialog.innerHTML=`<div class="dialog-heading"><h2 id="account-dialog-title">${user?'Tài khoản học tập':'Mang tiến độ theo bạn'}</h2><button class="iconbtn" id="account-close" aria-label="Đóng">${H.icon('close')}</button></div>${user?`<div class="profile-card"><span class="account-emblem">${H.icon('profile')}</span><div><strong>${esc(user.displayName||'Tài khoản của bạn')}</strong><p>${esc(user.email||'')}</p></div></div><p id="dialog-sync-status" class="sync-status">${esc(label())}</p><p class="account-help">Từ đã nhớ, dấu sao, ghi chú, lịch ôn và kết quả kiểm tra được đồng bộ riêng trong tài khoản này.</p><div class="account-actions"><button class="primary" id="dialog-sync">Đồng bộ ngay</button><button id="account-logout">Đăng xuất</button></div>`:`<p class="account-help">Đăng nhập để tiếp tục học trên điện thoại hoặc máy tính. Bạn vẫn có thể học mà không đăng nhập.</p><button id="google-login" class="google-login"><strong aria-hidden="true">G</strong> Tiếp tục với Google</button><div class="account-divider"><span>hoặc dùng email</span></div><div class="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-auth-mode="signin">Đăng nhập</button><button type="button" role="tab" aria-selected="false" data-auth-mode="signup">Tạo tài khoản</button></div><form id="email-auth"><label for="login-email">Email</label><input id="login-email" type="email" autocomplete="email" required placeholder="ban@example.com"><label for="login-password">Mật khẩu</label><div class="password-field"><input id="login-password" type="password" autocomplete="current-password" minlength="6" required><button type="button" id="password-toggle" aria-label="Hiện mật khẩu">${H.icon('eye')}</button></div><label class="merge-option"><input id="bring-progress" type="checkbox" checked> Mang tiến độ đang học vào tài khoản</label><button class="primary" id="email-submit" type="submit">Đăng nhập</button><button type="button" id="reset-password" class="text-button">Quên mật khẩu?</button></form>`}<p id="account-error" class="account-error" role="alert" aria-live="polite"></p>`;
 dialog.setAttribute('aria-labelledby','account-dialog-title');dialog.querySelector('#account-close').onclick=closeDialog;
 if(user){dialog.querySelector('#dialog-sync').onclick=retry;dialog.querySelector('#account-logout').onclick=async()=>{if(busy)return;busy=true;try{persist();await signOut(auth)}catch(e){dialog.querySelector('#account-error').textContent=userError(e)}finally{busy=false;dialog.close()}}}
 else{
  let mode='signin';const message=t=>dialog.querySelector('#account-error').textContent=t;
  const run=async fn=>{if(busy)return;if(!navigator.onLine){message('Đăng nhập cần kết nối mạng. Bạn vẫn có thể tiếp tục học trên thiết bị.');return}busy=true;message('');dialog.querySelectorAll('button').forEach(b=>{if(b.id!=='account-close')b.disabled=true});bringGuest=dialog.querySelector('#bring-progress').checked;try{await fn()}catch(e){message(userError(e))}finally{busy=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false)}};
  dialog.querySelector('#google-login').onclick=()=>run(()=>signInWithPopup(auth,new GoogleAuthProvider()));
  dialog.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.authMode;dialog.querySelectorAll('[data-auth-mode]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));dialog.querySelector('#email-submit').textContent=mode==='signup'?'Tạo tài khoản':'Đăng nhập';dialog.querySelector('#login-password').autocomplete=mode==='signup'?'new-password':'current-password';message('')});
  dialog.querySelector('.auth-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tabs=[...dialog.querySelectorAll('[data-auth-mode]')],next=tabs.find(b=>b.getAttribute('aria-selected')!=='true');next.click();next.focus()};
  dialog.querySelector('#email-auth').onsubmit=e=>{e.preventDefault();const email=dialog.querySelector('#login-email').value.trim(),password=dialog.querySelector('#login-password').value;run(()=>mode==='signup'?createUserWithEmailAndPassword(auth,email,password):signInWithEmailAndPassword(auth,email,password))};
  dialog.querySelector('#password-toggle').onclick=()=>{const input=dialog.querySelector('#login-password'),hidden=input.type==='password';input.type=hidden?'text':'password';dialog.querySelector('#password-toggle').setAttribute('aria-label',hidden?'Ẩn mật khẩu':'Hiện mật khẩu')};
  dialog.querySelector('#reset-password').onclick=()=>{const input=dialog.querySelector('#login-email');if(!input.reportValidity()||!input.value){input.focus();return}run(async()=>{await sendPasswordResetEmail(auth,input.value.trim());message('Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.')})};
 }
 if(!dialog.open)dialog.showModal();
}
window.HSKCloud={open:openAccount,retry,getStatus:()=>({status,pending:journal.pending.size,signedIn:!!user}),mount:paint};
const accountButton=document.getElementById('account-toggle');if(accountButton)accountButton.onclick=openAccount;
document.addEventListener('hsk:view',paint);paint();
