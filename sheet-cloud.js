(()=>{'use strict';

const cfg=window.SCUTUM_CONFIG||{};
const params=new URLSearchParams(location.search);
const id=params.get('character');
const returnParam=params.get('return')||'';
const embed=params.get('embed')==='1';
const CHARACTER_KEY='scutum_character_'+id+'_stage4_v24';
const LIVE_FIELDS=new Set(['currentHp','currentEnergy','currentSanity','conditions','exhaustion']);

window.__DUODECIMA_STORAGE_KEY__=CHARACTER_KEY;
window.__SCUTUM_CHARACTER_ID__=id||'';

if(embed)document.documentElement.classList.add('scutum-embed-root');

if(!id||!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase){
  location.replace('index.html');
  return;
}

const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let currentUser=null;
let currentRole='player';
let canEdit=false;
let baseServerData=null;
let lastServerUpdatedAt=null;
let saveTimer=0;
let saving=false;
let rerunSave=false;
let bootstrapLoaded=false;
let channel=null;
let syncPromise=null;

function esc(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function note(html){
  const el=document.querySelector('.archive-save-note');
  if(el)el.innerHTML=html;
}
function validSheet(raw){
  if(!raw)return null;
  try{
    const data=typeof raw==='string'?JSON.parse(raw):raw;
    return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
  }catch{return null}
}
function clone(v){
  if(v===undefined)return undefined;
  return JSON.parse(JSON.stringify(v));
}
function equal(a,b){
  if(a===b)return true;
  if(a==null||b==null)return a===b;
  if(typeof a!==typeof b)return false;
  if(Array.isArray(a)||Array.isArray(b)){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;
    for(let i=0;i<a.length;i++)if(!equal(a[i],b[i]))return false;
    return true;
  }
  if(typeof a==='object'){
    const ak=Object.keys(a),bk=Object.keys(b);
    if(ak.length!==bk.length)return false;
    for(const k of ak)if(!Object.prototype.hasOwnProperty.call(b,k)||!equal(a[k],b[k]))return false;
    return true;
  }
  return false;
}
function mergeThreeWay(base,local,remote,path=[]){
  if(equal(local,base))return clone(remote);
  if(equal(remote,base))return clone(local);
  if(equal(local,remote))return clone(local);

  const localObj=local&&typeof local==='object'&&!Array.isArray(local);
  const remoteObj=remote&&typeof remote==='object'&&!Array.isArray(remote);
  const baseObj=base&&typeof base==='object'&&!Array.isArray(base);

  if(localObj&&remoteObj&&(baseObj||base==null)){
    const out={};
    const keys=new Set([
      ...Object.keys(base||{}),
      ...Object.keys(local||{}),
      ...Object.keys(remote||{})
    ]);
    for(const key of keys){
      out[key]=mergeThreeWay(
        base?.[key],
        local?.[key],
        remote?.[key],
        [...path,key]
      );
      if(out[key]===undefined)delete out[key];
    }
    return out;
  }

  const root=path[0]||'';
  if(LIVE_FIELDS.has(root)&&!equal(remote,base))return clone(remote);
  return clone(local);
}
function payload(data){
  return {
    name:data.name||'Sem nome',
    level:Number(data.level||1),
    origin_type:data.originType==='mortal'?'mortal':'divine',
    god_id:data.originType==='mortal'?null:(data.godId||null),
    portrait_url:data.history?.portraitUrl||null,
    current_hp:data.currentHp==null?null:Number(data.currentHp),
    current_energy:data.currentEnergy==null?null:Number(data.currentEnergy),
    current_sanity:Number(data.currentSanity??100),
    conditions:Array.isArray(data.conditions)?data.conditions:[],
    exhaustion:Number(data.exhaustion||0),
    sheet_version:Number(data.schemaVersion||24),
    sheet_data:data,
    updated_at:new Date().toISOString()
  };
}
function currentLocal(){
  return validSheet(localStorage.getItem(CHARACTER_KEY)||'');
}
function setLocal(data,{apply=true}={}){
  const raw=JSON.stringify(data||{});
  localStorage.setItem(CHARACTER_KEY,raw);
  if(apply&&typeof window.__DUODECIMA_APPLY_CLOUD_STATE==='function'){
    window.__DUODECIMA_APPLY_CLOUD_STATE(data||{});
  }
}
function rememberServer(row){
  baseServerData=clone(row?.sheet_data||{});
  lastServerUpdatedAt=row?.updated_at||lastServerUpdatedAt;
}
function newerThanCurrent(timestamp){
  if(!timestamp)return false;
  if(!lastServerUpdatedAt)return true;
  const incoming=Date.parse(timestamp),current=Date.parse(lastServerUpdatedAt);
  if(Number.isFinite(incoming)&&Number.isFinite(current))return incoming>current;
  return timestamp!==lastServerUpdatedAt;
}
async function fetchLatest(){
  const {data,error}=await client.from('characters')
    .select('sheet_data,updated_at,owner_id')
    .eq('id',id)
    .single();
  if(error)throw error;
  return data;
}
async function syncAttempt(localData,attempt=0){
  if(!canEdit)return true;
  if(attempt>2)throw new Error('Não foi possível reconciliar a ficha após várias alterações simultâneas.');

  let query=client.from('characters')
    .update(payload(localData))
    .eq('id',id);

  if(lastServerUpdatedAt)query=query.eq('updated_at',lastServerUpdatedAt);

  const {data,error}=await query
    .select('sheet_data,updated_at,owner_id')
    .maybeSingle();

  if(error)throw error;

  if(data){
    rememberServer(data);
    note('<b>Salvo na nuvem</b> · SCUTUM Lab');
    return true;
  }

  const fresh=await fetchLatest();
  const merged=mergeThreeWay(baseServerData||{},localData,fresh.sheet_data||{});
  rememberServer(fresh);
  setLocal(merged,{apply:true});

  if(equal(merged,fresh.sheet_data||{})){
    note('<b>Atualização mais recente aplicada</b> · SCUTUM Lab');
    return true;
  }

  note('<b>Mesclando alterações…</b> · SCUTUM Lab');
  return syncAttempt(merged,attempt+1);
}
async function syncNow(){
  if(!canEdit)return true;
  if(saving){
    rerunSave=true;
    return syncPromise||true;
  }

  const localData=currentLocal();
  if(!localData)return false;
  if(baseServerData&&equal(localData,baseServerData))return true;

  saving=true;
  rerunSave=false;
  note('<b>Salvando…</b> · SCUTUM Lab');

  syncPromise=(async()=>{
    try{
      return await syncAttempt(localData,0);
    }catch(err){
      console.warn('[SCUTUM] sync falhou',err);
      note('<b>Falha ao sincronizar</b> · sua cópia local continua disponível');
      return false;
    }finally{
      saving=false;
      syncPromise=null;
      if(rerunSave){
        rerunSave=false;
        setTimeout(()=>syncNow(),0);
      }
    }
  })();

  return syncPromise;
}
window.__SCUTUM_SYNC_NOW=syncNow;

function scheduleSave(delay=260){
  if(!canEdit)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>syncNow(),delay);
}
function handleRemoteRow(row){
  if(!row?.sheet_data||!newerThanCurrent(row.updated_at))return;

  const remote=validSheet(row.sheet_data)||{};
  const local=currentLocal()||remote;
  const dirty=baseServerData?!equal(local,baseServerData):false;
  const merged=dirty?mergeThreeWay(baseServerData||{},local,remote):remote;

  rememberServer(row);

  if(!equal(local,merged)){
    setLocal(merged,{apply:true});
  }

  if(dirty&&!equal(merged,remote)&&canEdit){
    note('<b>Alterações mescladas</b> · salvando…');
    scheduleSave(180);
  }else{
    note('<b>Atualização da nuvem aplicada</b> · SCUTUM Lab');
  }
}
function startRealtime(){
  if(channel)return;
  channel=client.channel('sheet-character-'+id)
    .on('postgres_changes',{
      event:'UPDATE',
      schema:'public',
      table:'characters',
      filter:'id=eq.'+id
    },payload=>handleRemoteRow(payload.new))
    .subscribe();
}
function startPersistence(){
  window.addEventListener('duodecima:sheet-change',e=>{
    if(e.detail?.key&&e.detail.key!==CHARACTER_KEY)return;
    scheduleSave(220);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')syncNow();
  });
  window.addEventListener('pagehide',()=>{syncNow()});
}

function addBackLink(){
  if(embed)return true;
  const bar=document.querySelector('.archive-toolbar-copy');
  if(!bar||bar.querySelector('.scutum-back-link'))return !!bar;
  const a=document.createElement('a');
  const backTo=returnParam.startsWith('room.html?')?returnParam:'index.html';
  a.href=backTo;
  a.className='ghost small-btn scutum-back-link';
  a.textContent=backTo.startsWith('room.html?')?'← Voltar à sala':'← Arquivo';
  bar.prepend(a);
  return true;
}
function ensureSwitcher(){
  if(embed)return true;
  const bar=document.querySelector('.archive-toolbar-copy');
  if(!bar)return false;
  if(document.querySelector('#scutumCharacterSwitcher'))return true;

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='scutumCharacterSwitcher';
  btn.className='ghost small-btn scutum-character-switcher';
  btn.textContent='Personagens ▾';
  btn.onclick=openSwitcher;
  bar.prepend(btn);

  const dialog=document.createElement('dialog');
  dialog.id='scutumCharacterDialog';
  dialog.className='scutum-character-dialog';
  dialog.innerHTML='<div class="scutum-character-dialog-card"><div class="scutum-dialog-head"><div><small>SCUTUM</small><h2>Personagens</h2></div><button type="button" data-close-switcher>×</button></div><div id="scutumCharacterList" class="scutum-character-list"><p>Carregando…</p></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('[data-close-switcher]').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  return true;
}
async function openSwitcher(){
  ensureSwitcher();
  const dialog=document.querySelector('#scutumCharacterDialog');
  const list=document.querySelector('#scutumCharacterList');
  if(!dialog||!list||!currentUser)return;
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  list.innerHTML='<p class="scutum-switcher-loading">Carregando personagens…</p>';

  const {data,error}=await client.from('characters')
    .select('id,name,level,portrait_url')
    .eq('owner_id',currentUser.id)
    .eq('archived',false)
    .order('updated_at',{ascending:false});

  if(error){
    list.innerHTML='<p class="scutum-switcher-loading">Não foi possível carregar suas personagens.</p>';
    return;
  }

  const chars=data||[];
  list.innerHTML=chars.length?chars.map(c=>{
    const href='sheet.html?character='+encodeURIComponent(c.id)+(returnParam?'&return='+encodeURIComponent(returnParam):'');
    return '<a class="scutum-character-option '+(c.id===id?'active':'')+'" href="'+href+'">'+
      '<span class="scutum-character-thumb">'+(c.portrait_url?'<img src="'+esc(c.portrait_url)+'" alt="">':esc(String(c.name||'?').slice(0,1).toUpperCase()))+'</span>'+
      '<span><b>'+esc(c.name||'Sem nome')+'</b><small>Nv '+Number(c.level||1)+'</small></span>'+
      (c.id===id?'<em>aberta</em>':'')+
    '</a>';
  }).join(''):'<p class="scutum-switcher-loading">Nenhuma personagem disponível.</p>';
}
function applyModeChrome(){
  document.body.classList.toggle('scutum-embedded',embed);
  document.body.classList.toggle('scutum-readonly',!canEdit);

  const bar=document.querySelector('.archive-toolbar-copy');
  if(bar&&!canEdit&&!bar.querySelector('.scutum-readonly-badge')){
    const badge=document.createElement('span');
    badge.className='scutum-readonly-badge';
    badge.textContent='Somente leitura · mestre';
    bar.prepend(badge);
  }
  if(embed){
    document.querySelector('.archive-brandbar')?.classList.add('scutum-embed-hidden');
    document.querySelector('footer')?.classList.add('scutum-embed-hidden');
  }
}
function decorateWhenReady(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    applyModeChrome();
    const ready=addBackLink()&&ensureSwitcher();
    if(ready||attempts>=150)clearInterval(timer);
  },80);
}
function injectBootstrap(){
  if(bootstrapLoaded)return;
  bootstrapLoaded=true;
  const script=document.createElement('script');
  script.src='bootstrap-v511.js?v=v5.21.9-cloud-sync';
  script.onload=()=>{
    decorateWhenReady();
    startPersistence();
    startRealtime();
    window.parent!==window&&window.parent.postMessage({
      type:'scutum-sheet-ready',
      characterId:id,
      readOnly:!canEdit
    },location.origin);
  };
  script.onerror=()=>{
    console.error('[SCUTUM] Falha ao carregar a ficha base.');
    alert('Não foi possível carregar a ficha. Tente novamente.');
  };
  document.body.appendChild(script);
}

(async()=>{
  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError||!session){
    location.replace('index.html');
    return;
  }
  currentUser=session.user;

  const [{data:profile},{data,error}]=await Promise.all([
    client.from('profiles').select('role').eq('id',currentUser.id).maybeSingle(),
    client.from('characters').select('sheet_data,updated_at,owner_id').eq('id',id).single()
  ]);

  if(error||!data?.sheet_data){
    console.error('[SCUTUM] Falha ao abrir personagem',error);
    alert('Não foi possível abrir esta ficha.');
    location.replace('index.html');
    return;
  }

  currentRole=profile?.role||'player';
  canEdit=data.owner_id===currentUser.id||currentRole==='admin';
  rememberServer(data);
  setLocal(data.sheet_data,{apply:false});
  note(canEdit?'<b>Carregada da nuvem</b> · SCUTUM Lab':'<b>Somente leitura</b> · ficha do participante');

  injectBootstrap();
})();

})();