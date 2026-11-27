(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function enter(view){if(reduced.matches)return;const root=document.getElementById(view+'view')||document.getElementById('supplementview');if(!root||root.classList.contains('hidden'))return;
  const cards=[...root.querySelectorAll('.dashboard-card,.library-card,.tone-card')].slice(0,5);
  const targets=cards.length?cards:[root];
  for(const element of targets){
   element.animate([{opacity:.84,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:160,easing:'ease-out'});
  }
 }
 document.addEventListener('hsk:view',event=>enter(event.detail.view));
 document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||reduced.matches)return;if(['learned','remember','suppremember','suppflashremember'].includes(button.id))requestAnimationFrame(()=>{const active=document.getElementById(button.id)||button;if(active.isConnected)active.animate([{boxShadow:'0 0 0 0 #52745b30'},{boxShadow:'0 0 0 9px #52745b00'}],{duration:380,easing:'ease-out'})});});
})();
