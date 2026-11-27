const STROKES=(()=>{
 const basics=[
  ['Nét ngang','横','héng','M18 49H80','Từ trái sang phải, giữ đường bút gần ngang.','一'],
  ['Nét sổ','竖','shù','M48 17V82','Từ trên xuống dưới, giữ đường bút thẳng.','十'],
  ['Nét chấm','点','diǎn','M37 29Q48 35 60 53','Chạm nhẹ, đi ngắn xuống phải rồi nhấc bút.','主'],
  ['Nét phẩy','撇','piě','M67 19Q55 59 23 78','Từ trên phải kéo xuống trái, nhẹ dần ở cuối nét.','人'],
  ['Nét mác','捺','nà','M29 22Q47 60 77 75','Từ trên trái kéo xuống phải, nhấn gần cuối rồi nhấc nhẹ.','八'],
  ['Nét hất','提','tí','M23 65L73 30','Từ dưới trái hất lên phải, nhẹ dần về đầu nhọn.','北'],
  ['Nét móc','钩','gōu','M60 18V77Q52 77 40 65','Ví dụ sổ móc: kéo thẳng xuống rồi móc lên trái liền bút.','小'],
  ['Nét gập','折','zhé','M21 30H72L65 77','Ví dụ ngang gập: đi ngang sang phải rồi đổi hướng xuống, không nhấc bút.','口']
 ];
 const rules=[
  ['Ngang trước, sổ sau','Viết ngang, rồi viết sổ cắt qua nét ngang.','十'],
  ['Phẩy trước, mác sau','Phẩy xuống trái, rồi mác xuống phải.','人'],
  ['Trên trước, dưới sau','Viết nét ngang trên trước, rồi nét ngang dưới.','二'],
  ['Trái trước, phải sau','Viết bộ 亻 bên trái, rồi viết chữ 木 bên phải.','休'],
  ['Ngoài trước, trong sau','Viết phần khung ngoài 冂 trước, rồi viết các nét bên trong.','同'],
  ['Vào nhà trước, đóng cửa sau','Viết phần khung mở và chữ 玉 bên trong, rồi viết nét ngang đáy để khép khung.','国'],
  ['Giữa trước, hai bên sau','Viết sổ móc giữa, rồi chấm trái và chấm phải.','小']
 ];
 let writer=null;
 function stop(){
  if(!writer)return;
  writer.cancelQuiz();
  writer.pauseAnimation();
  writer=null;
 }
 function diagram(path,index){
  return `<svg class="stroke-diagram" viewBox="0 0 96 96" aria-hidden="true">
   <path class="stroke-gridline" d="M48 0v96M0 48h96"/>
   <defs><marker id="stroke-arrow-${index}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z" fill="var(--red)"/></marker></defs>
   <path class="stroke-guide" d="${path}" marker-end="url(#stroke-arrow-${index})"/>
  </svg>`;
 }
 function select(character,focus=false){
  stop();
  const canvas=$('#basic-stroke-writer'), status=$('#basic-stroke-status');
  canvas.replaceChildren();
  const title=$('#basic-stroke-character');title.textContent=character;
  status.textContent='Chọn xem thứ tự nét hoặc tự viết theo mẫu.';
  writer=HanziWriter.create(canvas,character,{
   width:200,height:200,padding:16,showOutline:true,
   strokeColor:getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
   outlineColor:getComputedStyle(document.documentElement).getPropertyValue('--line').trim(),
   charDataLoader:(char,done,fail)=>STROKE_SAMPLES[char]?done(STROKE_SAMPLES[char]):loadStrokeData(char,done,fail)
  });
  if(focus){$('#basic-stroke-heading').focus({preventScroll:true});$('#basic-stroke-practice').scrollIntoView({block:'start'})}
 }
 function render(){
  const root=$('#strokesview');
  root.innerHTML=`<p class="library-intro">Chấm đỏ đánh dấu điểm đặt bút. Mũi tên chỉ hướng kết thúc nét.</p>
   <div class="stroke-cards">${basics.map(([name,cn,py,path,note,character],i)=>{
    const [x,y]=path.slice(1).match(/^\d+ \d+/)[0].split(' ');
    return `<article class="stroke-card">${diagram(path,i).replace('</svg>',`<circle cx="${x}" cy="${y}" r="3.6" fill="var(--red)"/></svg>`)}
     <h2>${name}</h2><p><span class="hanzi" lang="zh-CN">${cn}</span> <span class="py">${py}</span></p><p>${note}</p>
     <button type="button" data-stroke-sample="${character}">Xem trong <span lang="zh-CN">${character}</span></button></article>`;
   }).join('')}</div>
   <section class="stroke-rules"><h2>Quy tắc thứ tự nét</h2><p class="tiny muted">Các quy tắc này giúp ghi nhớ. Khi gặp chữ có ngoại lệ, hãy xem thứ tự nét của chính chữ đó.</p>
    ${rules.map(([name,note,character])=>`<details><summary>${name}</summary><p>${note}</p><button type="button" data-stroke-sample="${character}">Xem chữ <span lang="zh-CN">${character}</span></button></details>`).join('')}
   </section>
   <section id="basic-stroke-practice" class="stroke-practice"><h2 id="basic-stroke-heading" tabindex="-1">Xem nét và luyện viết <span id="basic-stroke-character" lang="zh-CN"></span></h2>
    <div class="writebox"><div id="basic-stroke-writer" class="writer"></div><div class="writecontrols">
    <button type="button" class="primary" id="basic-stroke-play">Xem thứ tự nét</button>
    <button type="button" id="basic-stroke-quiz">Luyện viết</button>
    <p id="basic-stroke-status" class="tiny muted" role="status"></p></div></div></section>`;
  root.querySelectorAll('[data-stroke-sample]').forEach(button=>{button.onclick=()=>select(button.dataset.strokeSample,true)});
  $('#basic-stroke-play').onclick=()=>{writer.cancelQuiz();writer.animateCharacter();};
  $('#basic-stroke-quiz').onclick=()=>{
   const status=$('#basic-stroke-status');
   status.textContent='Đặt bút theo nét mẫu và viết lần lượt.';
   writer.quiz({
    onMistake:()=>{status.textContent='Thử lại nét này theo đường gợi ý.'},
    onComplete:()=>{status.textContent='Bạn đã viết xong chữ này.'}
   });
  };
  select('一');
 }
 return {render,stop,getWriter:()=>writer};
})();
