/* Inline, wrapping choices. Native selects remain as the model for existing filters. */
(()=>{
 const names={levelquick:'Cấp độ HSK',statusfilter:'Trạng thái',reviewmode:'Bộ thẻ ôn tập',testlevel:'Cấp độ kiểm tra',suppgroup:'Nhóm nội dung',suppstatus:'Trạng thái',appearance:'Giao diện', 'daily-goal':'Mục tiêu mỗi ngày'};
 let pending=false;
 function refresh(){
  pending=false;
  document.querySelectorAll('select').forEach(select=>{
   let field=select.closest('.choice-field');
   if(!field){
    field=document.createElement('div');field.className='choice-field';field.dataset.control=select.id;
    select.before(field);field.append(select);select.hidden=true;select.tabIndex=-1;
    const title=document.createElement('span');title.className='choice-label';title.id=select.id+'-label';title.textContent=names[select.id]||select.labels?.[0]?.textContent||'Chọn';
    const group=document.createElement('div');group.className='choice-buttons';group.setAttribute('role','group');group.setAttribute('aria-labelledby',title.id);field.append(title,group);
    for(const label of select.labels||[])label.classList.add('sr');
   }
   const group=field.querySelector('.choice-buttons');
   const signature=JSON.stringify([...select.options].map(o=>[o.value,o.text,o.disabled]));
   if(group.dataset.options!==signature){
    group.replaceChildren();group.dataset.options=signature;
    for(const option of select.options){
     const button=document.createElement('button');button.type='button';button.textContent=option.text;button.dataset.value=option.value;
     button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));refresh()};
     group.append(button);
    }
   }
   [...group.children].forEach((button,i)=>{
    const active=select.value===button.dataset.value, disabled=select.disabled||select.options[i].disabled;
    if(button.getAttribute('aria-pressed')!==String(active))button.setAttribute('aria-pressed',String(active));
    if(button.disabled!==disabled)button.disabled=disabled;
   });
  });
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(refresh)}}
 new MutationObserver(changes=>{if(changes.some(c=>!c.target.closest?.('.choice-buttons')))schedule()}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('change',schedule);document.addEventListener('click',schedule);document.addEventListener('hsk:view',schedule);
 refresh();
})();
