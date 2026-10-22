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
let loading=true,timer=0,last='',booted=false,cloudChannel=null,lastSignature='',lastServerUpdatedAt=null;
let currentUser=null,enhanceTimer=0,roomChatChannel=null,roomChatOpen=false;

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
async function applyServerSheet(next,updatedAt,{toastMessage=false}={}){
  const signature=syncSignature(next||{});
  lastSignature=signature;
  last=JSON.stringify(next||{});
  if(updatedAt)lastServerUpdatedAt=updatedAt;
  originalSet.call(localStorage,KEY,last);
  const applied=typeof window.__DUODECIMA_APPLY_CLOUD_STATE==='function'
    ?window.__DUODECIMA_APPLY_CLOUD_STATE(next||{})
    :false;
  const note=document.querySelector('.archive-save-note');
  if(note)note.innerHTML=applied
    ?'<b>Atualização da nuvem aplicada</b> · SCUTUM Lab'
    :'<b>Atualização da nuvem recebida</b> · reabra a ficha para aplicar';
  if(toastMessage)scutumToast(applied?'Atualização mais recente aplicada à ficha.':'A ficha mudou na nuvem.');
}
async function pushCloud(raw){
  try{
    const d=JSON.parse(raw);
    const localSignature=syncSignature(d);
    const expectedServerUpdatedAt=lastServerUpdatedAt;
    lastSignature=localSignature;
    await new Promise(r=>setTimeout(r,120));

    let query=client.from('characters')
      .update(cloudPayload(d))
      .eq('id',id);
    if(expectedServerUpdatedAt)query=query.eq('updated_at',expectedServerUpdatedAt);

    const {data,error}=await query
      .select('sheet_data,updated_at')
      .maybeSingle();
    if(error)throw error;

    if(!data){
      const {data:fresh,error:freshError}=await client.from('characters')
        .select('sheet_data,updated_at').eq('id',id).single();
      if(freshError)throw freshError;
      await applyServerSheet(fresh.sheet_data||{},fresh.updated_at,{toastMessage:true});
      return;
    }

    lastServerUpdatedAt=data.updated_at||lastServerUpdatedAt;
    lastSignature=syncSignature(data.sheet_data||d);
    last=JSON.stringify(data.sheet_data||d);
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
    const {data:master}=await client.rpc('is_room_master',{p_room_id:activeRoomId});
    if(master){
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
  return String(text||'1d20').replace(/−/g,'-').replace(/\s+/g,'').toLowerCase();
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
  loadSheetRoomChat(true);
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

function bindAttributeRollTriggers(){
  if(!activeRoomId)return;
  document.querySelectorAll('.attr').forEach(card=>{
    if(card.querySelector('.scutum-attr-roll'))return;
    const name=card.querySelector('.attr-name')?.textContent?.replace(/\s+/g,' ').trim();
    if(!name)return;
    const total=Number(card.querySelector('.attr-total')?.textContent?.trim());
    if(!Number.isFinite(total))return;
    const breakText=card.querySelector('.attr-break')?.textContent||'';
    const effective=breakText.match(/efetivo\s+(-?\d+)/i);
    const mod=effective?Number(effective[1]):total;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='scutum-attr-roll';
    btn.textContent='Rolar';
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();openRollDialog('Atributo · '+name,expressionWithModifier('1d20',mod))};
    card.appendChild(btn);
  });
}

function bindCombatQuickRolls(){
  if(!activeRoomId)return;
  document.querySelectorAll('.combat-quick-values > div').forEach(row=>{
    if(row.querySelector('.scutum-quick-roll'))return;
    const label=row.querySelector('span')?.textContent?.trim();
    const value=row.querySelector('b')?.textContent?.trim()||'';
    if(!label||!/^1d20/i.test(normalizeExpression(value)))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='scutum-quick-roll';
    btn.textContent='Rolar';
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();openRollDialog(label,normalizeExpression(value))};
    row.appendChild(btn);
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

/* ---------- room chat inside the sheet ---------- */

function ensureRoomChatShell(){
  if(!activeRoomId||document.querySelector('#scutumSheetChatButton'))return;
  const bar=document.querySelector('.archive-toolbar-copy');
  if(!bar)return;

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='scutumSheetChatButton';
  btn.className='primary small-btn scutum-sheet-chat-button';
  btn.innerHTML='Chat da mesa <span id="scutumSheetChatBadge">●</span>';
  btn.onclick=()=>openSheetRoomChat();
  bar.appendChild(btn);

  const dialog=document.createElement('dialog');
  dialog.id='scutumSheetChatDialog';
  dialog.className='scutum-sheet-chat-dialog';
  dialog.innerHTML='<div class="scutum-sheet-chat-card">'+
    '<div class="scutum-dialog-head"><div><small>SALA DE MISSÃO</small><h2>Chat da mesa</h2></div><div class="scutum-chat-head-actions"><a href="'+htmlEsc(returnParam)+'">Abrir mesa</a><button type="button" data-close-sheet-chat>×</button></div></div>'+
    '<div id="scutumSheetChatFeed" class="scutum-sheet-chat-feed"><p>Carregando…</p></div>'+
  '</div>';
  document.body.appendChild(dialog);
  dialog.querySelector('[data-close-sheet-chat]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{roomChatOpen=false});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
function sheetChatRollHtml(r){
  const dice=Array.isArray(r.dice)?r.dice:[];
  const breakdown=r.breakdown||{};
  const extra=Number(breakdown.extra_modifier||0);
  const critical=!r.is_manual&&/^1d20/i.test(r.expression||'')&&Number(r.natural_roll)===20;
  const fumble=!r.is_manual&&/^1d20/i.test(r.expression||'')&&Number(r.natural_roll)===1;
  return '<article class="scutum-sheet-chat-entry roll '+(critical?'critical ':fumble?'fumble ':'')+'">'+
    '<header><b>'+htmlEsc(r.author_name)+'</b><time>'+new Date(r.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</time></header>'+
    '<span class="scutum-chat-label">'+htmlEsc(r.label)+'</span>'+
    '<div class="scutum-chat-result"><strong>'+Number(r.total)+'</strong><span>'+(r.is_manual?'manual':htmlEsc(r.expression||''))+(extra?(' · '+(extra>0?'+':'')+extra+' extra'):'')+'</span></div>'+
    (dice.length?'<small>['+dice.map(htmlEsc).join(', ')+']</small>':'')+
    (r.note?'<p>'+htmlEsc(r.note)+'</p>':'')+
    (r.visibility==='master'?'<em>somente mestre</em>':'')+
  '</article>';
}
function sheetChatMessageHtml(m){
  return '<article class="scutum-sheet-chat-entry ability">'+
    '<header><b>'+htmlEsc(m.author_name)+'</b><time>'+new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</time></header>'+
    '<span class="scutum-chat-label">HABILIDADE COMPARTILHADA</span>'+
    '<h3>'+htmlEsc(m.title)+'</h3>'+
    (m.subtitle?'<small>'+htmlEsc(m.subtitle)+'</small>':'')+
    (m.body?'<p>'+htmlEsc(m.body).replace(/\n/g,'<br>')+'</p>':'')+
  '</article>';
}
async function loadSheetRoomChat(scroll=true){
  if(!activeRoomId)return;
  const feed=document.querySelector('#scutumSheetChatFeed');
  const badge=document.querySelector('#scutumSheetChatBadge');
  const [rollRes,messageRes]=await Promise.all([
    client.from('room_rolls')
      .select('id,author_name,label,expression,dice,modifier,total,natural_roll,is_manual,visibility,breakdown,note,created_at')
      .eq('room_id',activeRoomId).order('created_at',{ascending:false}).limit(50),
    client.from('room_messages')
      .select('id,message_type,author_name,title,subtitle,body,visibility,created_at')
      .eq('room_id',activeRoomId).order('created_at',{ascending:false}).limit(50)
  ]);
  if(rollRes.error||messageRes.error)return;
  const rows=[
    ...(rollRes.data||[]).map(x=>({...x,_type:'roll'})),
    ...(messageRes.data||[]).map(x=>({...x,_type:'message'}))
  ].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(-60);

  if(badge)badge.textContent=rows.length?String(Math.min(rows.length,99)):'0';
  if(feed){
    feed.innerHTML=rows.length
      ?rows.map(x=>x._type==='roll'?sheetChatRollHtml(x):sheetChatMessageHtml(x)).join('')
      :'<div class="scutum-sheet-chat-empty">Nenhuma rolagem ou habilidade compartilhada ainda.</div>';
    if(scroll)requestAnimationFrame(()=>{feed.scrollTop=feed.scrollHeight});
  }
}
function openSheetRoomChat(){
  ensureRoomChatShell();
  const dialog=document.querySelector('#scutumSheetChatDialog');
  if(!dialog)return;
  roomChatOpen=true;
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  loadSheetRoomChat(true);
}
function startRoomChatRealtime(){
  if(!activeRoomId||roomChatChannel)return;
  roomChatChannel=client.channel('sheet-room-chat-'+activeRoomId+'-'+id)
    .on('postgres_changes',{event:'*',schema:'public',table:'room_rolls',filter:'room_id=eq.'+activeRoomId},()=>loadSheetRoomChat(roomChatOpen))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_messages',filter:'room_id=eq.'+activeRoomId},()=>loadSheetRoomChat(roomChatOpen))
    .subscribe();
  loadSheetRoomChat(false);
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
  loadSheetRoomChat(true);
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
  ensureRoomChatShell();
  bindSheetRollTriggers();
  bindAttributeRollTriggers();
  bindCombatQuickRolls();
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
  script.src='bootstrap-v511.js?v=v5.21.2-scutum-sync';
  script.onload=()=>{
    let toolbarAttempts=0;
    const waitForToolbar=setInterval(()=>{
      toolbarAttempts++;
      const bar=document.querySelector('.archive-toolbar-copy');
      if(!bar){
        if(toolbarAttempts>=150){
          clearInterval(waitForToolbar);
          console.warn('[SCUTUM] barra da ficha não ficou disponível.');
        }
        return;
      }
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
      ensureRoomChatShell();
      startRoomChatRealtime();
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

  const {data,error}=await client.from('characters').select('sheet_data,updated_at').eq('id',id).single();
  if(error||!data){
    alert('Não foi possível abrir esta ficha.');
    location.replace('index.html');
    return;
  }

  last=JSON.stringify(data.sheet_data||{});
  lastSignature=syncSignature(data.sheet_data||{});
  lastServerUpdatedAt=data.updated_at||null;
  originalSet.call(localStorage,KEY,last);
  loading=false;

  cloudChannel=client.channel('sheet-cloud-'+id)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'characters',filter:'id=eq.'+id},payload=>{
      const next=payload.new?.sheet_data||{};
      const updatedAt=payload.new?.updated_at||null;
      const signature=syncSignature(next);
      if(updatedAt)lastServerUpdatedAt=updatedAt;
      if(signature===lastSignature)return;
      applyServerSheet(next,updatedAt,{toastMessage:true});
    })
    .subscribe();

  injectBootstrap();
})();

})();