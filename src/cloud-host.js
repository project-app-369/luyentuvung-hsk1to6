// Adapter keeps the existing course data and local progress format compatible.
window.HSKCloudHost={
 key:KEY,
 blank:()=>({schemaVersion:1,courseId:KEY,words:{},support:{},activity:{},goal:10,attempts:[],last:WORDS[0].id}),
 get:()=>JSON.parse(JSON.stringify(state)),
 validate,
 known:(kind,key)=>kind==='word'?byId.has(key):kind==='support'?SUPPLEMENT_IDS.has(key):kind==='prefs'?key==='settings':kind==='activity'?/^\d{4}-\d{2}-\d{2}$/.test(key):kind==='attempt'?/^[a-zA-Z0-9_-]{1,140}$/.test(key):false,
 canSwitch:()=>!exam||exam.done,
 closeNavigation:()=>INK.setNav(false),
 apply(next,{reset=false}={}){
  const clean=validate(next);
  if(reset){state=clean;exam=null;level=0;for(const id of ['dashboardview','sourceview','supplementview','reviewcontent','testcontent'])document.getElementById(id)?.replaceChildren();current=byId.get(state.last)||WORDS[0];renderLevels();filter();}
  else{
   for(const kind of ['words','support']){for(const [id,value]of Object.entries(clean[kind])){state[kind][id]||={};Object.assign(state[kind][id],value);}}
   for(const key of ['activity','goal','attempts','last'])state[key]=clean[key];
  }
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch{warning('Không thể lưu tiến độ trên thiết bị. Hãy xuất bản sao lưu.')}
  stats();renderList();
  if(view==='dashboard')INK.refresh();
  if(view==='study'&&current){const r=state.words[current.id]||{};const learned=$('#learned'),fav=$('#fav');if(learned){learned.textContent=r.learned?'✓ Đã nhớ':'Đánh dấu đã nhớ';learned.setAttribute('aria-pressed',String(!!r.learned))}if(fav){fav.textContent=r.favorite?'★ Đã đánh dấu':'☆ Đánh dấu';fav.setAttribute('aria-pressed',String(!!r.favorite))}if($('#notes')&&document.activeElement!==$('#notes'))$('#notes').value=r.notes||'';}
  if(['measure','connect','radicals','phrases'].includes(view))SUP.refreshProgress();
  if(reset)showView(view);
 },
 toast,
 icon:name=>INK.icon(name),
};
