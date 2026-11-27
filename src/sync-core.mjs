const copy=x=>JSON.parse(JSON.stringify(x));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export const same=(a,b)=>stable(a)===stable(b);
const fields={word:['learned','favorite','notes','stage','due','write'],support:['learned','favorite','notes'],prefs:['goal','last'],activity:['ids'],attempt:['entry']};
const defaults={learned:false,favorite:false,notes:'',stage:0,due:0,write:false,goal:10,last:'',ids:[],entry:null};
export const recordId=r=>({word:'w:',support:'s:',prefs:'p:',activity:'a:',attempt:'t:'}[r.kind])+r.key;
export function flatten(s){
 const out={};const put=(id,kind,key,value)=>out[id]={kind,key,value:copy(value)};
 for(const [id,value]of Object.entries(s.words||{}))put('w:'+id,'word',id,value);
 for(const [id,value]of Object.entries(s.support||{}))put('s:'+id,'support',id,value);
 put('p:settings','prefs','settings',{goal:s.goal||10,last:s.last||''});
 for(const [day,ids]of Object.entries(s.activity||{}))put('a:'+day,'activity',day,{ids:[...new Set(ids)].sort()});
 for(const a of s.attempts||[])put('t:'+a.id,'attempt',a.id,{entry:a});return out;
}
export function validRecord(r,known=()=>true){
 if(!r||!fields[r.kind]||typeof r.key!=='string'||r.key.length>150||!known(r.kind,r.key)||!r.fields||typeof r.fields!=='object')return null;
 const clean={kind:r.kind,key:r.key,fields:{}};
 for(const [name,f]of Object.entries(r.fields)){
  if(!fields[r.kind].includes(name)||!f||!Number.isSafeInteger(f.ts)||f.ts<0||typeof f.device!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(f.device))continue;
  const v=f.value;
  if(['learned','favorite','write'].includes(name)&&typeof v!=='boolean')continue;
  if(name==='notes'&&(typeof v!=='string'||v.length>10000))continue;
  if(name==='stage'&&(!Number.isInteger(v)||v<0||v>5))continue;
  if(name==='due'&&(!Number.isFinite(v)||v<0))continue;
  if(name==='goal'&&![5,10,20].includes(v))continue;
  if(name==='last'&&(typeof v!=='string'||v.length>100))continue;
  if(name==='ids'&&(!Array.isArray(v)||v.length>10000||v.some(x=>typeof x!=='string'||x.length>100)))continue;
  if(name==='entry'&&v!==null&&(!v||typeof v!=='object'||v.id!==r.key||!Number.isInteger(v.level)||v.level<0||v.level>6||!Number.isFinite(v.score)||v.score<0||v.score>100||typeof v.at!=='string'||!Array.isArray(v.answers)||v.answers.length>100))continue;
  clean.fields[name]=copy(f);
 }
 return clean;
}
const newer=(a,b)=>!b||a.ts>b.ts||(a.ts===b.ts&&a.device>b.device);
export function mergeRecord(a,b){
 if(!a)return copy(b);if(!b)return copy(a);if(a.kind!==b.kind||a.key!==b.key)throw Error('Record identity mismatch');
 const out=copy(a);
 for(const [name,incoming]of Object.entries(b.fields)){
  const local=out.fields[name];
  if(a.kind==='activity'&&name==='ids'&&local){const stamp=newer(incoming,local)?incoming:local;out.fields.ids={...stamp,value:[...new Set([...local.value,...incoming.value])].sort()};}
  else if(newer(incoming,local))out.fields[name]=copy(incoming);
 }
 return out;
}
export function materialize(records,base){
 const s=copy(base),attempts=new Map((s.attempts||[]).map(a=>[a.id,a]));s.words||={};s.support||={};s.activity||={};
 for(const r of Object.values(records)){
  const values=Object.fromEntries(Object.entries(r.fields).map(([k,f])=>[k,copy(f.value)]));
  if(r.kind==='word')s.words[r.key]={...(s.words[r.key]||{}),...values};
  if(r.kind==='support')s.support[r.key]={...(s.support[r.key]||{}),...values};
  if(r.kind==='prefs')Object.assign(s,values);
  if(r.kind==='activity'&&values.ids)s.activity[r.key]=values.ids;
  if(r.kind==='attempt'&&'entry'in values){if(values.entry)attempts.set(r.key,values.entry);else attempts.delete(r.key);}
 }
 s.attempts=[...attempts.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-2000);return s;
}
export class Journal{
 constructor(state,device,saved={},known=()=>true){this.device=device;this.known=known;this.records={};this.pending=new Set();this.clock=Date.now();this.base=flatten(state);
  for(const [id,raw]of Object.entries(saved.records||{})){const r=validRecord(raw,known);if(r&&id===recordId(r)){this.records[id]=r;this.clock=Math.max(this.clock,...Object.values(r.fields).map(f=>f.ts));}}
  for(const id of saved.pending||[])if(this.records[id])this.pending.add(id);
  for(const [id,r]of Object.entries(this.base)){if(!known(r.kind,r.key))continue;let entry=this.records[id]||{kind:r.kind,key:r.key,fields:{}};
   for(const [name,value]of Object.entries(r.value))if(fields[r.kind].includes(name)&&!entry.fields[name]&&!same(value,defaults[name])){entry.fields[name]={value:copy(value),ts:0,device};this.pending.add(id);}
   if(Object.keys(entry.fields).length)this.records[id]=entry;
  }
 }
 capture(state){const next=flatten(state);let changed=false;
  for(const id of new Set([...Object.keys(this.base),...Object.keys(next)])){
   const now=next[id],before=this.base[id],identity=now||before;if(!this.known(identity.kind,identity.key))continue;
   const r=this.records[id]||{kind:identity.kind,key:identity.key,fields:{}};
   for(const name of fields[identity.kind]){
    const value=now?.value[name]??defaults[name],old=before?.value[name]??defaults[name];
    if(same(value,old))continue;this.clock=Math.max(Date.now(),this.clock+1);r.fields[name]={value:copy(value),ts:this.clock,device:this.device};this.pending.add(id);changed=true;
   }
   if(Object.keys(r.fields).length)this.records[id]=r;
  }
  this.base=next;return changed;
 }
 merge(id,raw){const r=validRecord(raw,this.known);if(!r||id!==recordId(r))return false;this.clock=Math.max(this.clock,...Object.values(r.fields).map(f=>f.ts));const before=this.records[id];this.records[id]=mergeRecord(before,r);return !same(before,this.records[id]);}
 import(other){for(const [id,r]of Object.entries(other.records)){if(this.merge(id,r))this.pending.add(id);}}
 applied(state){this.base=flatten(state);}
 ack(id,sent){if(same(this.records[id],sent))this.pending.delete(id);}
 serialize(){return {records:this.records,pending:[...this.pending]};}
}
