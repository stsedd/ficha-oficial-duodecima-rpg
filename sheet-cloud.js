(()=>{'use strict';

const cfg=window.SCUTUM_CONFIG||{};
const params=new URLSearchParams(location.search);
const id=params.get('character');
const returnParam=params.get('return')||'';
const KEY='duodecima_universal_stage4_v24';

if(!id||!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase){
  location.replace('index.html');
  return;
}

const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const originalSet=Storage.prototype.setItem;
let loading=true,timer=0,last='',booted=false,cloudChannel=null,lastSignature='';
let currentUser=null,enhanceTimer=0;

function roomContextId(){
  if(!returnParam)return null;
  try{
    const u=new URL(returnParam,location.origin);
    if(!/\/room\.html$/i.test(u.pathname))return null;
    return u.searchParams.get('id');
  }catch{return null}
}
const activeRoomId=roomContextId();

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
    last=v;
    clearTimeout(timer);
    timer=setTimeout(()=>pushCloud(v),650);
  }
};

function parseSigned(text){
  const m=String(text||'').replace(/−/g,'-').match(/[+-]?\d+/);
  return m?Number(m[0]):0;
}
function scutumToast(message){
  const t=document.querySelector('#toast');
  if(!t)return;
  t.textContent=message;
  t.classList.remove('hidden');
  clearTimeout(scutumToast.t);
  scutumToast.t=setTimeout(()=>t.classList.add('hidden'),2600);
}
function htmlEsc(v){
  return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

/* ---------- character switcher ---------- */

function ensureSwitcherShell(){
  if(document.querySelector('#scutumCharacterSwitcher'))return;
  const bar=document.querySelector('.archive-toolbar-copy');
  if(!bar)return;

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='scutumCharacterSwitcher';
  btn.className='ghost small-btn scutum-character-switcher';
  btn.textContent='Personagens ▾';
  btn.onclick=()=>openCharacterSwitcher();
  bar.prepend(btn);

  const dialog=document.createElement('dialog');
  dialog.id='scutumCharacterDialog';
  dialog.className='scutum-character-dialog';
  dialog.innerHTML='<div class="scutum-character-dialog-card"><div class="scutum-dialog-head"><div><small>SCUTUM</small><h2>Personagens</h2></div><button type="button" data-close-switcher>×</button></div><div id="scutumCharacterList" class="scutum-character-list"><p>Carregando…</p></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('[data-close-switcher]').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
async function loadSwitcherCharacters(){
  if(!currentUser)return [];
  if(activeRoomId){
    const {data,error}=await client.rpc('get_room_table_participants',{p_room_id:activeRoomId});
    if(!error&&data?.length){
      return data.map(x=>({
        id:x.character_id,
        name:x.character_name,
        level:x.level,
        portrait_url:x.portrait_url,
        context:'Mesa'
      }));
    }
  }
  const {data}=await client.from('characters')
    .select('id,name,level,portrait_url')
    .eq('owner_id',currentUser.id)
    .eq('archived',false)
    .order('updated_at',{ascending:false});
  return data||[];
}
async function openCharacterSwitcher(){
  ensureSwitcherShell();
  const dialog=document.querySelector('#scutumCharacterDialog');
  const list=document.querySelector('#scutumCharacterList');
  if(!dialog||!list)return;
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  list.innerHTML='<p class="scutum-switcher-loading">Carregando personagens…</p>';

  const chars=await loadSwitcherCharacters();
  list.innerHTML=chars.length?chars.map(c=>{
    const href='sheet.html?character='+encodeURIComponent(c.id)+(returnParam?'&return='+encodeURIComponent(returnParam):'');
    return '<a class="scutum-character-option '+(c.id===id?'active':'')+'" href="'+href+'">'+
      '<span class="scutum-character-thumb">'+(c.portrait_url?'<img src="'+htmlEsc(c.portrait_url)+'" alt="">':htmlEsc(String(c.name||'?').slice(0,1).toUpperCase()))+'</span>'+
      '<span><b>'+htmlEsc(c.name||'Sem nome')+'</b><small>Nv '+Number(c.level||1)+(c.context?' · '+htmlEsc(c.context):'')+'</small></span>'+
      (c.id===id?'<em>aberta</em>':'')+
    '</a>';
  }).join(''):'<p class="scutum-switcher-loading">Nenhuma outra personagem disponível.</p>';
}

/* ---------- roll helper inside the sheet ---------- */

function ensureRollDialog(){
  if(document.querySelector('#scutumRollDialog'))return;
  const dialog=document.createElement('dialog');
  dialog.id='scutumRollDialog';
  dialog.className='scutum-roll-dialog';
  dialog.innerHTML='<form method="dialog" class="scutum-roll-card" id="scutumRollForm">'+
    '<div class="scutum-dialog-head"><div><small>ROLAGEM DA FICHA</small><h2 id="scutumRollTitle">Rolagem</h2></div><button type="button" data-close-roll>×</button></div>'+
    '<div class="scutum-roll-base"><span>Base</span><strong id="scutumRollBase">1d20</strong></div>'+
    '<label><span>Bônus extra</span><input id="scutumRollExtra" type="number" inputmode="numeric" value="0"></label>'+
    '<div class="scutum-roll-presets"><button type="button" data-extra-preset="2">+2</button><button type="button" data-extra-preset="3">+3</button><button type="button" data-extra-preset="5">+5</button><button type="button" data-extra-preset="-2">−2</button><button type="button" data-extra-preset="-3">−3</button></div>'+
    '<label><span>Origem / observação</span><input id="scutumRollNote" maxlength="120" placeholder="ex.: Prole +3 · alvo Caído"></label>'+
    '<div class="scutum-roll-actions"><button type="button" data-close-roll>Cancelar</button><button type="submit" class="primary">Rolar no chat</button></div>'+
  '</form>';
  document.body.appendChild(dialog);
  dialog.querySelectorAll('[data-close-roll]').forEach(b=>b.onclick=()=>dialog.close());
  dialog.querySelectorAll('[data-extra-preset]').forEach(b=>b.onclick=()=>{
    const input=dialog.querySelector('#scutumRollExtra');
    input.value=String((Number(input.value)||0)+Number(b.dataset.extraPreset||0));
  });
  dialog.querySelector('#scutumRollForm').onsubmit=e=>{
    e.preventDefault();
    submitSheetRoll();
  };
}
let pendingRoll=null;
function normalizeExpression(text){
  return String(text||'1d20').replace(/−/g,'-').replace(/s+/g,'').toLowerCase();
}
function expressionWithModifier(base='1d20',modifier=0){
  const mod=Number(modifier)||0;
  return normalizeExpression(base)+(mod===0?'':mod>0?'+'+mod:String(mod));
}
function openRollDialog(label,expression='1d20'){
  if(!activeRoomId){
    scutumToast('Entre em uma sala de missão para enviar a rolagem ao chat.');
    return;
  }
  ensureRollDialog();
  pendingRoll={label,expression:normalizeExpression(expression)};
  const dialog=document.querySelector('#scutumRollDialog');
  dialog.querySelector('#scutumRollTitle').textContent=label;
  dialog.querySelector('#scutumRollBase').textContent=pendingRoll.expression.replace(/-/g,'−');
  dialog.querySelector('#scutumRollExtra').value='0';
  dialog.querySelector('#scutumRollNote').value='';
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  setTimeout(()=>dialog.querySelector('#scutumRollExtra').focus(),0);
}
async function submitSheetRoll(){
  if(!pendingRoll||!activeRoomId)return;
  const dialog=document.querySelector('#scutumRollDialog');
  const extra=Math.trunc(Number(dialog.querySelector('#scutumRollExtra').value)||0);
  const note=dialog.querySelector('#scutumRollNote').value.trim();
  const expr=pendingRoll.expression;
  const submit=dialog.querySelector('button[type="submit"]');
  submit.disabled=true;
  submit.textContent='Rolando…';

  const {data,error}=await client.rpc('roll_room_dice_with_modifiers',{
    p_room_id:activeRoomId,
    p_character_id:id,
    p_label:pendingRoll.label,
    p_expression:expr,
    p_extra_modifier:extra,
    p_note:note,
    p_visibility:'public'
  });

  submit.disabled=false;
  submit.textContent='Rolar no chat';
  if(error){
    console.warn('[SCUTUM] roll',error);
    return scutumToast('Não foi possível enviar a rolagem.');
  }
  dialog.close();
  const result=Array.isArray(data)?data[0]:data;
  scutumToast(pendingRoll.label+': '+(result?.total??'rolado')+' · enviado ao chat');
  pendingRoll=null;
}
function combatQuickValue(label){
  const rows=[...document.querySelectorAll('.combat-quick-values > div')];
  const row=rows.find(el=>el.querySelector('span')?.textContent?.trim()===label);
  return row?.querySelector('b')?.textContent?.trim()||'';
}
function bindSheetRollTriggers(){
  if(!activeRoomId)return;

  document.querySelectorAll('.skill-ledger-row').forEach(row=>{
    if(row.querySelector('.scutum-skill-roll'))return;
    const name=row.dataset.skillName||row.querySelector('.skill-ledger-name b')?.textContent?.trim();
    const mod=parseSigned(row.querySelector('.skill-roll-value')?.textContent);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='scutum-skill-roll';
    btn.textContent='Rolar';
    btn.title='Rolar '+name+' no chat da mesa';
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();openRollDialog('Perícia · '+name,expressionWithModifier('1d20',mod))};
    row.querySelector('.skill-row-main')?.appendChild(btn);
  });
}

function bindWeaponRollTriggers(){
  if(!activeRoomId)return;
  document.querySelectorAll('.weapon-card').forEach(card=>{
    const results=card.querySelector('.weapon-results');
    if(!results||results.querySelector('.scutum-weapon-rolls'))return;
    const name=card.querySelector('.weapon-name')?.value?.trim()||'Arma';
    const pills=[...results.querySelectorAll('.pill')].map(x=>x.textContent.trim());
    const attackText=pills.find(x=>/^Ataque\s/i.test(x))||'Ataque +0';
    const damageText=pills.find(x=>/^Dano\s/i.test(x))||'Dano 1d4';
    const attackMod=parseSigned(attackText.replace(/^Ataque\s*/i,''));
    const damageExpr=normalizeExpression(damageText.replace(/^Dano\s*/i,''));

    const wrap=document.createElement('span');
    wrap.className='scutum-weapon-rolls';
    const attack=document.createElement('button');
    attack.type='button';attack.className='scutum-weapon-roll';
    attack.textContent='Rolar ataque';
    attack.onclick=e=>{e.preventDefault();e.stopPropagation();openRollDialog('Ataque · '+name,expressionWithModifier('1d20',attackMod))};
    const damage=document.createElement('button');
    damage.type='button';damage.className='scutum-weapon-roll';
    damage.textContent='Rolar dano';
    damage.onclick=e=>{e.preventDefault();e.stopPropagation();openRollDialog('Dano · '+name,damageExpr)};
    wrap.append(attack,damage);
    results.appendChild(wrap);
  });
}
let captureBound=false;
function bindCombatCapture(){
  if(captureBound||!activeRoomId)return;
  captureBound=true;
  document.addEventListener('click',e=>{
    const defense=e.target.closest?.('#rollDefense');
    const initiative=e.target.closest?.('#rollInitiative');
    if(!defense&&!initiative)return;

    const text=combatQuickValue(defense?'Defesa':'Iniciativa');
    if(!/1d20/i.test(text))return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openRollDialog(defense?'Defesa':'Iniciativa',normalizeExpression(text));
  },true);
}

/* ---------- ability pings ---------- */

function abilitySharePayload(card){
  const title=card.querySelector('.ability-title-row b')?.textContent?.trim()||'Habilidade';
  const subtitle=card.querySelector('.ability-meta')?.textContent?.replace(/\s+/g,' ').trim()||'';
  const current=[...card.querySelectorAll('.ability-tier.current .ability-tier-copy')]
    .map(x=>x.innerText.trim()).filter(Boolean).join('\n\n');
  const structured=[...card.querySelectorAll('.ability-core-block,.ability-structured-block,.ability-summary')]
    .map(x=>x.innerText.trim()).filter(Boolean).join('\n\n');

  let body=[structured,current].filter(Boolean).join('\n\n').trim();
  if(!body){
    const clone=card.cloneNode(true);
    clone.querySelectorAll('button,input,select,textarea,.ability-visual-config,.stake-compact,.ability-usage,.ability-choice-zone').forEach(x=>x.remove());
    body=clone.innerText.replace(/\n{3,}/g,'\n\n').trim();
  }
  return {title,subtitle,body:body.slice(0,7000)};
}
async function shareAbility(card,button){
  if(!activeRoomId)return scutumToast('Abra a ficha a partir de uma sala para compartilhar no chat.');
  const payload=abilitySharePayload(card);
  const old=button.textContent;
  button.disabled=true;
  button.textContent='Enviando…';
  const {error}=await client.rpc('share_room_ability',{
    p_room_id:activeRoomId,
    p_character_id:id,
    p_title:payload.title,
    p_subtitle:payload.subtitle,
    p_body:payload.body
  });
  button.disabled=false;
  button.textContent=old;
  if(error){
    console.warn('[SCUTUM] share ability',error);
    return scutumToast('Não foi possível compartilhar a habilidade.');
  }
  scutumToast(payload.title+' enviada ao chat.');
}
function bindAbilityShare(){
  if(!activeRoomId)return;
  document.querySelectorAll('.ability-card').forEach(card=>{
    if(card.querySelector('.scutum-share-ability'))return;
    const head=card.querySelector('.ability-head');
    if(!head)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='scutum-share-ability';
    btn.textContent='↗ Mostrar no chat';
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();shareAbility(card,btn)};
    head.appendChild(btn);
  });
}

/* ---------- enhancement loop ---------- */

function enhanceSheet(){
  ensureSwitcherShell();
  bindSheetRollTriggers();
  bindWeaponRollTriggers();
  bindAbilityShare();
  bindCombatCapture();
}
function scheduleEnhance(){
  clearTimeout(enhanceTimer);
  enhanceTimer=setTimeout(enhanceSheet,80);
}
function startEnhancer(){
  enhanceSheet();
  const observer=new MutationObserver(scheduleEnhance);
  observer.observe(document.querySelector('#sheetView')||document.body,{childList:true,subtree:true});
}

/* ---------- bootstrap ---------- */

function injectBootstrap(){
  if(booted)return;
  booted=true;
  const script=document.createElement('script');
  script.src='bootstrap-v511.js?v=v5.21.1-ability-deck-polish-lab';
  script.onload=()=>{
    const waitForToolbar=setInterval(()=>{
      const bar=document.querySelector('.archive-toolbar-copy');
      if(!bar)return;
      clearInterval(waitForToolbar);

      if(!bar.querySelector('.scutum-back-link')){
        const a=document.createElement('a');
        const backTo=returnParam.startsWith('room.html?')?returnParam:'index.html';
        a.href=backTo;
        a.className='ghost small-btn scutum-back-link';
        a.textContent=backTo.startsWith('room.html?')?'← Voltar à sala':'← Arquivo';
        bar.prepend(a);
      }
      const note=document.querySelector('.archive-save-note');
      if(note)note.innerHTML='<b>Salvo na nuvem</b> · SCUTUM Lab';
      ensureSwitcherShell();
      startEnhancer();
    },80);
  };
  script.onerror=()=>alert('Não foi possível carregar a ficha. Tente novamente.');
  document.body.appendChild(script);
}

(async()=>{
  const {data:{session}}=await client.auth.getSession();
  if(!session){location.replace('index.html');return}
  currentUser=session.user;

  const {data,error}=await client.from('characters').select('sheet_data').eq('id',id).single();
  if(error||!data){
    alert('Não foi possível abrir esta ficha.');
    location.replace('index.html');
    return;
  }

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