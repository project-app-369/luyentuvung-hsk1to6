(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function enter(view){if(reduced.matches)return;const root=document.getElementById(view+'view')||document.getElementById('supplementview');if(!root||root.classList.contains('hidden'))return;
  const cards=[...root.querySelectorAll('.dashboard-card,.library-card,.tone-card,.tip-rule,.method-grid article')].slice(0,12);
  if(cards.length)cards.forEach((el,i)=>el.animate([{opacity:.45,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:Math.min(i*22,150),easing:'cubic-bezier(.2,.7,.2,1)'}));
  else root.animate([{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
 }
 document.addEventListener('hsk:view',event=>enter(event.detail.view));
 document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||reduced.matches)return;if(['learned','remember','suppremember','suppflashremember'].includes(button.id))requestAnimationFrame(()=>{const active=document.getElementById(button.id)||button;if(active.isConnected)active.animate([{boxShadow:'0 0 0 0 #52745b30'},{boxShadow:'0 0 0 9px #52745b00'}],{duration:380,easing:'ease-out'})});});
 if(document.body.dataset.view)enter(document.body.dataset.view);
})();
