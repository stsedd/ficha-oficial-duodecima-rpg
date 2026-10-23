(()=>{'use strict';

const cfg=window.SCUTUM_CONFIG||{};
const params=new URLSearchParams(location.search);
const id=params.get('character');
const returnParam=params.get('return')||'';
const CHARACTER_KEY='scutum_character_'+id+'_stage4_v24';

window.__DUODECIMA_STORAGE_KEY__=CHARACTER_KEY;
window.__SCUTUM_CHARACTER_ID__=id||'';

if(!id||!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase){
  location.replace('index.html');
  return;
}

const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let currentUser=null;
let lastLocal='';
let saveTimer=0;
let saving=false;
let rerunSave=false;
let bootstrapLoaded=false;

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
    const data=JSON.parse(raw);
    return data&&typeof data==='object'?data:null;
  }catch{return null}
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

async function saveNow(){
  if(saving){rerunSave=true;return}
  const raw=localStorage.getItem(CHARACTER_KEY)||'';
  if(!raw||raw===lastLocal)return;
  const data=validSheet(raw);
  if(!data)return;

  saving=true;
  rerunSave=false;
  note('<b>Salvando…</b> · SCUTUM Lab');
  try{
    const {error}=await client.from('characters').update(payload(data)).eq('id',id);
    if(error)throw error;
    lastLocal=raw;
    note('<b>Salvo na nuvem</b> · SCUTUM Lab');
  }catch(err){
    console.error('[SCUTUM] Falha ao salvar ficha',err);
    note('<b>Falha ao sincronizar</b> · a cópia local continua disponível');
  }finally{
    saving=false;
    if(rerunSave)setTimeout(saveNow,0);
  }
}
function scheduleSave(){
  const raw=localStorage.getItem(CHARACTER_KEY)||'';
  if(!raw||raw===lastLocal)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveNow,700);
}
function startPersistence(){
  setInterval(scheduleSave,900);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')saveNow();
  });
  window.addEventListener('pagehide',()=>{saveNow()});
}

function addBackLink(){
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

function decorateWhenReady(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const ready=addBackLink()&&ensureSwitcher();
    if(ready||attempts>=150)clearInterval(timer);
  },80);
}

function injectBootstrap(){
  if(bootstrapLoaded)return;
  bootstrapLoaded=true;
  const script=document.createElement('script');
  script.src='bootstrap-v511.js?v=v5.21.6-cloud-stable';
  script.onload=()=>{
    decorateWhenReady();
    startPersistence();
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

  const {data,error}=await client.from('characters')
    .select('sheet_data,updated_at')
    .eq('id',id)
    .single();

  if(error||!data?.sheet_data){
    console.error('[SCUTUM] Falha ao abrir personagem',error);
    alert('Não foi possível abrir esta ficha.');
    location.replace('index.html');
    return;
  }

  const raw=JSON.stringify(data.sheet_data);
  localStorage.setItem(CHARACTER_KEY,raw);
  lastLocal=raw;
  note('<b>Carregada da nuvem</b> · SCUTUM Lab');

  injectBootstrap();
})();

})();