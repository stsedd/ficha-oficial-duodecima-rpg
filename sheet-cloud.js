(()=>{'use strict';
const cfg=window.SCUTUM_CONFIG||{},params=new URLSearchParams(location.search),id=params.get('character'),returnParam=params.get('return')||'',KEY='duodecima_universal_stage4_v24';
if(!id||!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase){location.replace('index.html');return}
const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const originalSet=Storage.prototype.setItem;
let loading=true,timer=0,last='',booted=false,cloudChannel=null,lastSignature='';

function parsePair(selector){
  const text=document.querySelector(selector)?.textContent?.replace(/\s+/g,' ').trim()||'';
  const match=text.match(/(-?\d+)\s*\/\s*(-?\d+)/);
  return match?{current:Number(match[1]),max:Number(match[2])}:null;
}
function canonical(v){
  if(Array.isArray(v))return v.map(canonical);
  if(v&&typeof v==='object'){
    const out={};
    Object.keys(v).sort().forEach(k=>{out[k]=canonical(v[k])});
    return out;
  }
  return v;
}
function syncSignature(d={}){return JSON.stringify(canonical(d))}
function cloudPayload(d){
  const hp=parsePair('.core-hp .core-stat-value')||parsePair('.rail-vitals .vital-hp');
  const en=parsePair('.core-en .core-stat-value')||parsePair('.rail-vitals .vital-en');
  return {
    name:d.name||'Sem nome',
    level:Number(d.level||1),
    origin_type:d.originType==='mortal'?'mortal':'divine',
    god_id:d.originType==='mortal'?null:(d.godId||null),
    portrait_url:d.history?.portraitUrl||null,
    current_hp:d.currentHp==null?null:Number(d.currentHp),
    max_hp:hp?.max??null,
    current_energy:d.currentEnergy==null?null:Number(d.currentEnergy),
    max_energy:en?.max??null,
    current_sanity:Number(d.currentSanity??100),
    conditions:Array.isArray(d.conditions)?d.conditions:[],
    exhaustion:Number(d.exhaustion||0),
    sheet_version:Number(d.schemaVersion||24),
    sheet_data:d,
    updated_at:new Date().toISOString()
  };
}
async function pushCloud(raw){
  try{
    const d=JSON.parse(raw);
    lastSignature=syncSignature(d);
    // Give the sheet a moment to repaint so the quick summary can capture max HP/EN too.
    await new Promise(r=>setTimeout(r,160));
    const {error}=await client.from('characters').update(cloudPayload(d)).eq('id',id);
    if(error)throw error;
    const note=document.querySelector('.archive-save-note');
    if(note)note.innerHTML='<b>Salvo na nuvem</b> · SCUTUM Lab';
  }catch(e){
    console.warn('[SCUTUM] sync falhou',e);
    const note=document.querySelector('.archive-save-note');
    if(note)note.innerHTML='<b>Falha ao sincronizar</b> · sua cópia local continua salva';
  }
}
Storage.prototype.setItem=function(k,v){
  originalSet.call(this,k,v);
  if(this===localStorage&&k===KEY&&!loading&&v!==last){
    last=v;clearTimeout(timer);timer=setTimeout(()=>pushCloud(v),650);
  }
};

function injectBootstrap(){
  if(booted)return;booted=true;
  const script=document.createElement('script');
  script.src='bootstrap-v511.js?v=v5.21.1-ability-deck-polish-lab';
  script.onload=()=>{
    const waitForToolbar=setInterval(()=>{
      const bar=document.querySelector('.archive-toolbar-copy');
      if(!bar)return;
      clearInterval(waitForToolbar);
      if(!bar.querySelector('.scutum-back-link')){
        const a=document.createElement('a');
        const backTo=returnParam.startsWith('room.html?')?returnParam:'index.html';a.href=backTo;a.className='ghost small-btn scutum-back-link';a.textContent=backTo.startsWith('room.html?')?'← Voltar à sala':'← Meus personagens';bar.prepend(a);
      }
      const note=document.querySelector('.archive-save-note');
      if(note)note.innerHTML='<b>Salvo na nuvem</b> · SCUTUM Lab';
    },80);
  };
  script.onerror=()=>alert('Não foi possível carregar a ficha. Tente novamente.');
  document.body.appendChild(script);
}
(async()=>{
  const {data:{session}}=await client.auth.getSession();
  if(!session){location.replace('index.html');return}
  const {data,error}=await client.from('characters').select('sheet_data').eq('id',id).single();
  if(error||!data){alert('Não foi possível abrir esta ficha.');location.replace('index.html');return}
  last=JSON.stringify(data.sheet_data||{});
  lastSignature=syncSignature(data.sheet_data||{});
  originalSet.call(localStorage,KEY,last);
  loading=false;
  cloudChannel=client.channel('sheet-cloud-'+id)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'characters',filter:'id=eq.'+id},payload=>{
      const next=payload.new?.sheet_data||{};
      const signature=syncSignature(next);
      if(signature===lastSignature)return;
      lastSignature=signature;
      last=JSON.stringify(next);
      originalSet.call(localStorage,KEY,last);
      const note=document.querySelector('.archive-save-note');
      if(note)note.innerHTML='<b>Atualização da mesa recebida</b> · recarregando ficha…';
      setTimeout(()=>location.reload(),350);
    })
    .subscribe();
  injectBootstrap();
})();
})();