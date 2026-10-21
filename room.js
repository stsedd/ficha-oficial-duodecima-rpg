(()=>{'use strict';

const cfg=window.SCUTUM_CONFIG||{};
const roomId=new URLSearchParams(location.search).get('id');
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{
  const t=$('#toast');
  if(!t)return;
  t.textContent=m;
  t.classList.remove('hidden');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>t.classList.add('hidden'),2800);
};

if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase||!roomId){
  location.replace('index.html');
  return;
}

const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);

let me=null;
let room=null;
let isMaster=false;
let channel=null;
let onlineIds=new Set();
let participants=[];
let combat=null;
let initiative=[];
let trackers=[];
let events=[];
let effects=[];
let briefing=null;
let rolls=[];
let messages=[];
let refreshTimer=0;
let durationTimer=0;

function pct(current,max){
  if(current==null||max==null||!Number.isFinite(Number(max))||Number(max)<=0)return 0;
  return Math.max(0,Math.min(100,(Number(current)/Number(max))*100));
}
function liveMaster(){return isMaster&&room?.status==='active'}
function roomLive(){return room?.status==='active'}
function schedule(fn,delay=90){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(fn,delay);
}
function updateDuration(){
  if(!room?.created_at)return;
  const start=new Date(room.created_at).getTime();
  const end=room.status==='ended'&&room.ended_at?new Date(room.ended_at).getTime():Date.now();
  const mins=Math.max(0,Math.floor((end-start)/60000));
  const h=Math.floor(mins/60),m=mins%60;
  $('#roomDuration').textContent=h?h+'h '+m+'min':m+' min';
}
function ownParticipant(){return participants.find(p=>p.user_id===me?.id)||null}
function currentRollCharacterId(){return isMaster?null:(ownParticipant()?.character_id||null)}

async function logEvent(message,eventType='note',payload={}){
  if(!me)return;
  const {error}=await client.from('room_events').insert({
    room_id:roomId,actor_id:me.id,event_type:eventType,message,payload
  });
  if(error)console.warn('[SCUTUM] event log',error);
}

/* ---------- PARTICIPANTS ---------- */

function adjustButtons(characterId,resource,current){
  if(!liveMaster()||current==null)return '';
  return '<span class="resource-actions">'+
    '<button data-adjust="'+characterId+'" data-resource="'+resource+'" data-delta="-1" title="Diminuir 1">−</button>'+
    '<button data-adjust="'+characterId+'" data-resource="'+resource+'" data-delta="1" title="Aumentar 1">+</button>'+
    '<button data-custom-adjust="'+characterId+'" data-resource="'+resource+'" title="Ajuste personalizado">•••</button>'+
  '</span>';
}
function resource(label,current,max,characterId,key){
  const visible=current!=null;
  const hasMax=max!=null&&Number.isFinite(Number(max))&&Number(max)>0;
  const value=visible?(hasMax?esc(current)+'/'+esc(max):esc(current)):'—';
  return '<div class="resource-row">'+
    '<span>'+label+'</span>'+
    '<div class="bar"><i style="width:'+(visible&&hasMax?pct(current,max):0)+'%"></i></div>'+
    '<b>'+value+'</b>'+
    adjustButtons(characterId,key,current)+
  '</div>';
}
function publicResource(label,percent){
  const visible=percent!=null&&Number.isFinite(Number(percent));
  return '<div class="resource-row public-resource">'+
    '<span>'+label+'</span>'+
    '<div class="bar"><i style="width:'+(visible?Math.max(0,Math.min(100,Number(percent))):0)+'%"></i></div>'+
    '<b aria-label="valor oculto">'+(visible?'':'—')+'</b>'+
  '</div>';
}
function participantCard(p){
  const self=p.user_id===me.id;
  const canSee=isMaster||self;
  const origin=p.origin_type==='mortal'?'Mortal da Névoa':(p.god_id||'—');
  const portrait=p.portrait_url||'';
  const online=onlineIds.has(p.user_id);
  const ready=!!p.ready;
  const cond=canSee?(p.conditions||[]):[];
  const exhaustion=canSee?p.exhaustion:null;

  let conditionHtml='';
  if(canSee){
    const chips=cond.length?cond.map(x=>{
      const timed=effects.find(e=>e.character_id===p.character_id&&e.label===x);
      return '<span>'+esc(x)+
        (timed?'<small class="effect-duration">'+Number(timed.remaining_rounds)+'r</small>':'')+
        (liveMaster()?'<button data-remove-condition="'+p.character_id+'" data-condition="'+esc(x)+'" aria-label="Remover condição">×</button>':'')+
      '</span>';
    }).join(''):'<span class="quiet">Sem condições</span>';

    conditionHtml='<div class="conditions">'+chips+
      (exhaustion?'<span>Exaustão '+Number(exhaustion)+'</span>':'')+
      (liveMaster()?'<button class="condition-add" data-add-condition="'+p.character_id+'">+ condição</button>':'')+
    '</div>';
  }

  let masterExtra='';
  if(liveMaster()){
    masterExtra='<div class="exhaustion-control"><span>Exaustão</span>'+
      '<button data-adjust="'+p.character_id+'" data-resource="exhaustion" data-delta="-1">−</button>'+
      '<b>'+Number(exhaustion||0)+'</b>'+
      '<button data-adjust="'+p.character_id+'" data-resource="exhaustion" data-delta="1">+</button>'+
    '</div>';
  }

  const actions=[];
  if(self){
    actions.push('<button class="primary" data-open-sheet="'+p.character_id+'">Abrir minha ficha</button>');
    if(roomLive())actions.push('<button data-ready="'+p.user_id+'" class="'+(ready?'ready-on':'')+'">'+(ready?'✓ Pronto':'Marcar pronto')+'</button>');
  }
  if(liveMaster()&&!self){
    actions.push('<button data-open-sheet="'+p.character_id+'">Ver ficha</button>');
    actions.push('<button class="danger" data-remove-member="'+p.user_id+'" data-remove-name="'+esc(p.character_name)+'">Remover</button>');
  }

  return '<article class="participant-card">'+
    '<div class="participant-art">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'<span class="portrait-fallback">'+esc((p.character_name||'?').slice(0,1).toUpperCase())+'</span>')+'</div>'+
    '<div class="participant-copy">'+
      '<div class="participant-title"><div><h3>'+esc(p.character_name)+'</h3><p>'+esc(origin)+' · Nv '+Number(p.level||1)+(self?' · você':'')+'</p></div>'+
      '<span class="presence-wrap"><span class="presence '+(online?'online':'offline')+'"><i></i>'+(online?'online':'offline')+'</span>'+(ready?'<span class="ready-badge">pronto</span>':'')+'</span></div>'+
      (canSee?'<div class="resource-stack">'+
        resource('HP',p.current_hp,p.max_hp,p.character_id,'hp')+
        resource('EN',p.current_energy,p.max_energy,p.character_id,'energy')+
        resource('SAN',p.current_sanity,100,p.character_id,'sanity')+
      '</div>'+conditionHtml+masterExtra:'<div class="resource-stack public-vitals">'+
        publicResource('HP',p.hp_percent)+
        publicResource('EN',p.energy_percent)+
        publicResource('SAN',p.sanity_percent)+
      '</div><div class="privacy-note">Os valores exatos ficam ocultos; a mesa vê apenas as barras.</div>')+
      (actions.length?'<div class="participant-actions">'+actions.join('')+'</div>':'')+
    '</div>'+
  '</article>';
}
function bindParticipantActions(){
  $$('[data-open-sheet]').forEach(b=>b.onclick=()=>{
    location.href='sheet.html?character='+encodeURIComponent(b.dataset.openSheet)+'&return='+encodeURIComponent('room.html?id='+roomId);
  });
  $$('[data-ready]').forEach(b=>b.onclick=async()=>{
    const p=participants.find(x=>x.user_id===b.dataset.ready);
    if(!p)return;
    const next=!p.ready;
    const {error}=await client.from('room_members').update({ready:next}).eq('room_id',roomId).eq('user_id',me.id);
    if(error)return toast('Não foi possível atualizar seu status.');
    await logEvent((p.character_name||'Personagem')+(next?' está pronto(a).':' não está mais pronto(a).'),'ready',{ready:next});
    loadParticipants();
  });
  $$('[data-remove-member]').forEach(b=>b.onclick=async()=>{
    const name=b.dataset.removeName||'esta personagem';
    if(!confirm('Remover '+name+' desta sala?'))return;
    b.disabled=true;
    await logEvent(name+' foi removido(a) da sala.','member_removed',{user_id:b.dataset.removeMember});
    const {error}=await client.from('room_members').delete().eq('room_id',roomId).eq('user_id',b.dataset.removeMember);
    if(error){toast('Não foi possível remover: '+error.message);b.disabled=false}
  });
  $$('[data-adjust]').forEach(b=>b.onclick=()=>adjustCharacter(b.dataset.adjust,b.dataset.resource,Number(b.dataset.delta)));
  $$('[data-custom-adjust]').forEach(b=>b.onclick=()=>{
    const raw=prompt('Quanto deseja alterar? Use número negativo para diminuir.','-5');
    if(raw==null)return;
    const delta=Number(raw);
    if(!Number.isFinite(delta)||delta===0)return toast('Digite um número diferente de zero.');
    adjustCharacter(b.dataset.customAdjust,b.dataset.resource,Math.trunc(delta));
  });
  $$('[data-add-condition]').forEach(b=>b.onclick=async()=>{
    const condition=(prompt('Nome da condição:','')||'').trim();
    if(!condition)return;
    const durationRaw=prompt('Duração em rodadas? Deixe vazio para condição permanente.','');
    if(durationRaw===null)return;
    const rounds=durationRaw.trim()===''?0:Math.max(1,Math.trunc(Number(durationRaw)||1));
    await toggleCondition(b.dataset.addCondition,condition,true,rounds);
  });
  $$('[data-remove-condition]').forEach(b=>b.onclick=()=>toggleCondition(b.dataset.removeCondition,b.dataset.condition,false));
}
async function adjustCharacter(characterId,res,delta){
  if(!liveMaster())return;
  const p=participants.find(x=>x.character_id===characterId);
  const label={hp:'HP',energy:'Energia',sanity:'Sanidade',exhaustion:'Exaustão'}[res]||res;
  const {data,error}=await client.rpc('master_adjust_character_resource',{
    p_room_id:roomId,p_character_id:characterId,p_resource:res,p_delta:delta
  });
  if(error)return toast('Não foi possível ajustar '+label+'.');
  const row=data?.[0];
  if(row)await logEvent((p?.character_name||'Personagem')+': '+label+' '+row.old_value+' → '+row.new_value+'.','resource',{
    character_id:characterId,resource:res,old_value:row.old_value,new_value:row.new_value
  });
  toast(label+' atualizado.');
  loadParticipants();
}
async function toggleCondition(characterId,condition,enabled,rounds=0){
  if(!liveMaster())return;
  const p=participants.find(x=>x.character_id===characterId);
  const {error}=await client.rpc('master_toggle_character_condition',{
    p_room_id:roomId,p_character_id:characterId,p_condition:condition,p_enabled:enabled
  });
  if(error)return toast('Não foi possível alterar a condição.');

  if(enabled&&rounds>0){
    await client.from('room_effects').upsert({
      room_id:roomId,character_id:characterId,label:condition,remaining_rounds:rounds
    },{onConflict:'room_id,character_id,label'});
  }else{
    await client.from('room_effects').delete().eq('room_id',roomId).eq('character_id',characterId).eq('label',condition);
  }

  await logEvent(
    (p?.character_name||'Personagem')+(enabled?' recebeu ':' perdeu a condição ')+condition+
    (enabled&&rounds>0?' por '+rounds+' rodada(s)':'')+'.',
    'condition',{character_id:characterId,condition,enabled,rounds}
  );
  loadParticipants();
}

/* ---------- ROOM ---------- */

async function hasMembership(){
  const {data}=await client.from('room_members').select('room_id').eq('room_id',roomId).eq('user_id',me.id).maybeSingle();
  return !!data;
}
async function loadRoom(){
  const {data,error}=await client.from('rooms').select('*').eq('id',roomId).single();
  if(error||!data){
    alert('Você não tem mais acesso a esta sala ou ela não existe.');
    location.replace('index.html');
    return false;
  }
  room=data;
  $('#roomName').textContent=room.name;
  $('#roomCode').textContent=room.code;
  $('#roomStatus').textContent=room.status==='active'?'Ativa':'Encerrada';
  document.body.classList.toggle('ended',room.status!=='active');
  $('#endRoom').classList.toggle('hidden',!liveMaster());
  $('#reopenRoom').classList.toggle('hidden',!isMaster||room.status==='active');
  $$('.master-only').forEach(x=>x.classList.toggle('hidden',!liveMaster()));
  $('#leaveRoom').classList.toggle('hidden',isMaster&&!await hasMembership());
  $('#rollForm').classList.toggle('disabled',!roomLive());
  updateDuration();
  return true;
}
async function loadParticipants(){
  const {data,error}=await client.rpc('get_room_table_participants',{p_room_id:roomId});
  if(error){toast('Não foi possível atualizar a mesa.');return}

  const [{data:memberStates},{data:roomEffects}]=await Promise.all([
    client.from('room_members').select('user_id,ready').eq('room_id',roomId),
    client.from('room_effects').select('id,character_id,label,remaining_rounds').eq('room_id',roomId)
  ]);

  effects=roomEffects||[];
  const readyMap=new Map((memberStates||[]).map(x=>[x.user_id,!!x.ready]));
  participants=(data||[]).map(x=>({...x,ready:readyMap.get(x.user_id)||false}));

  $('#participantCount').textContent=participants.length;
  $('#participantGrid').innerHTML=participants.length
    ?participants.map(participantCard).join('')
    :'<div class="empty">Ainda não há personagens nesta sala. Compartilhe o convite com os jogadores.</div>';
  bindParticipantActions();
}

/* ---------- COMBAT ---------- */

function initiativeRow(x,index){
  const active=combat?.active&&index===Math.min(Number(combat.turn_index||0),Math.max(0,initiative.length-1));
  const npcHp=x.kind==='npc'&&x.current_hp!=null
    ?'<span class="npc-hp">HP '+esc(x.current_hp)+(x.max_hp!=null?'/'+esc(x.max_hp):'')+'</span>'
    :'';

  const controls=liveMaster()
    ?'<div class="init-controls">'+
      '<button data-set-turn="'+index+'" title="Definir turno atual">▶</button>'+
      '<label>INI <input data-init-value="'+x.id+'" type="number" value="'+Number(x.initiative||0)+'"></label>'+
      (x.kind==='npc'&&x.current_hp!=null
        ?'<button data-npc-hp="'+x.id+'" data-npc-delta="-1">−HP</button><button data-npc-hp="'+x.id+'" data-npc-delta="1">+HP</button><button data-npc-custom="'+x.id+'">HP…</button>'
        :'')+
      '<button class="danger ghost-danger" data-init-remove="'+x.id+'" aria-label="Remover da iniciativa">×</button>'+
    '</div>'
    :'<b class="init-score">'+Number(x.initiative||0)+'</b>';

  return '<div class="initiative-row '+(active?'active':'')+'">'+
    '<span class="turn-number">'+(index+1)+'</span>'+
    '<div class="initiative-name"><b>'+esc(x.label)+'</b><small>'+(x.kind==='npc'?'NPC':'Personagem')+'</small>'+npcHp+'</div>'+
    controls+
  '</div>';
}
async function loadCombat(){
  const [{data:state},{data,error}]=await Promise.all([
    client.from('room_combat').select('*').eq('room_id',roomId).maybeSingle(),
    client.from('room_initiative').select('*').eq('room_id',roomId).order('initiative',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:true})
  ]);
  if(error)return;
  combat=state||{room_id:roomId,active:false,round:1,turn_index:0};
  initiative=data||[];

  if(combat.active&&initiative.length){
    const idx=Math.min(Number(combat.turn_index||0),initiative.length-1);
    const current=initiative[idx];
    $('#combatStatus').innerHTML='<div><span>RODADA</span><b>'+Number(combat.round||1)+'</b></div><div><span>TURNO</span><strong>'+esc(current.label)+'</strong></div>';
  }else{
    $('#combatStatus').innerHTML='<span>'+(initiative.length?'Combate pausado. A ordem está preservada.':'Nenhum combate ativo.')+'</span>';
  }

  $('#initiativeList').innerHTML=initiative.length
    ?initiative.map(initiativeRow).join('')
    :'<div class="mini-empty">A iniciativa ainda está vazia.</div>';
  $('#startCombat').textContent=combat.active?'Reiniciar':'Iniciar';
  bindCombatActions();
}
function bindCombatActions(){
  $$('[data-set-turn]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const index=Number(b.dataset.setTurn)||0;
    const target=initiative[index];
    if(!target)return;
    await client.from('room_combat').upsert({
      room_id:roomId,active:true,round:Number(combat?.round||1),turn_index:index
    });
    await logEvent('Turno definido para '+target.label+'.','turn',{
      round:Number(combat?.round||1),turn_index:index,label:target.label
    });
    loadCombat();
  });

  $$('[data-init-value]').forEach(i=>i.onchange=async()=>{
    if(!liveMaster())return;
    await client.from('room_initiative').update({initiative:Number(i.value)||0}).eq('id',i.dataset.initValue);
    loadCombat();
  });

  $$('[data-init-remove]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    await client.from('room_initiative').delete().eq('id',b.dataset.initRemove);
    await logEvent('Um participante foi removido da iniciativa.','combat');
    loadCombat();
  });

  $$('[data-npc-custom]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const row=initiative.find(x=>x.id===b.dataset.npcCustom);
    if(!row)return;
    const raw=prompt('Novo HP de '+row.label+':',String(row.current_hp??0));
    if(raw==null)return;
    const max=row.max_hp==null?2147483647:Number(row.max_hp);
    const next=Math.max(0,Math.min(max,Math.trunc(Number(raw)||0)));
    await client.from('room_initiative').update({current_hp:next}).eq('id',row.id);
    await logEvent(row.label+': HP '+row.current_hp+' → '+next+'.','npc_resource',{initiative_id:row.id});
    loadCombat();
  });

  $$('[data-npc-hp]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const row=initiative.find(x=>x.id===b.dataset.npcHp);
    if(!row)return;
    const delta=Number(b.dataset.npcDelta);
    const max=row.max_hp==null?2147483647:Number(row.max_hp);
    const next=Math.max(0,Math.min(max,Number(row.current_hp||0)+delta));
    await client.from('room_initiative').update({current_hp:next}).eq('id',row.id);
    await logEvent(row.label+': HP '+row.current_hp+' → '+next+'.','npc_resource',{initiative_id:row.id});
    loadCombat();
  });
}
async function startCombat(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const existing=new Set(initiative.filter(x=>x.character_id).map(x=>x.character_id));
  const missing=participants
    .filter(p=>!existing.has(p.character_id))
    .map((p,i)=>({room_id:roomId,kind:'player',character_id:p.character_id,label:p.character_name,initiative:0,sort_order:i}));

  if(missing.length){
    const {error}=await client.from('room_initiative').insert(missing);
    if(error)return toast('Não foi possível montar a iniciativa.');
  }
  const {error}=await client.from('room_combat').upsert({room_id:roomId,active:true,round:1,turn_index:0});
  if(error)return toast('Não foi possível iniciar o combate.');
  await logEvent('Combate iniciado.','combat');
  loadCombat();
}
async function nextTurn(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!combat?.active||!initiative.length)return toast('Inicie o combate primeiro.');

  let next=Number(combat.turn_index||0)+1;
  let round=Number(combat.round||1);
  let advancedRound=false;

  if(next>=initiative.length){
    next=0;
    round++;
    advancedRound=true;
  }

  if(advancedRound){
    const {data:ticked,error:tickError}=await client.rpc('master_tick_room_effects',{p_room_id:roomId});
    if(!tickError){
      for(const effect of ticked||[]){
        if(effect.expired){
          const owner=participants.find(p=>p.character_id===effect.character_id);
          await logEvent((owner?.character_name||'Personagem')+': a condição '+effect.label+' expirou.','condition',{
            character_id:effect.character_id,condition:effect.label,expired:true
          });
        }
      }
    }
  }

  await client.from('room_combat').update({turn_index:next,round}).eq('room_id',roomId);
  const target=initiative[next];
  await logEvent('Rodada '+round+': turno de '+target.label+'.','turn',{round,turn_index:next,label:target.label});
  await Promise.all([loadCombat(),loadParticipants()]);
}
async function prevTurn(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!combat?.active||!initiative.length)return toast('Inicie o combate primeiro.');
  let prev=Number(combat.turn_index||0)-1;
  let round=Number(combat.round||1);
  if(prev<0){prev=initiative.length-1;round=Math.max(1,round-1)}
  await client.from('room_combat').update({turn_index:prev,round}).eq('room_id',roomId);
  const target=initiative[prev];
  await logEvent('Turno voltou para '+target.label+'.','turn',{round,turn_index:prev,label:target.label});
  loadCombat();
}
async function endCombat(){
  if(!liveMaster()||!combat)return;
  await client.from('room_combat').upsert({
    room_id:roomId,active:false,round:Number(combat.round||1),turn_index:Number(combat.turn_index||0)
  });
  await logEvent('Combate encerrado.','combat');
  loadCombat();
}
async function clearCombat(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!confirm('Limpar toda a iniciativa? Isso não remove ninguém da sala.'))return;
  await client.from('room_combat').upsert({room_id:roomId,active:false,round:1,turn_index:0});
  const {error}=await client.from('room_initiative').delete().eq('room_id',roomId);
  if(error)return toast('Não foi possível limpar a iniciativa.');
  await logEvent('A iniciativa foi limpa.','combat');
  loadCombat();
}
async function addNpc(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const name=(prompt('Nome do NPC ou criatura:','')||'').trim();
  if(!name)return;
  const ini=Math.trunc(Number(prompt('Iniciativa:','0'))||0);
  const hpRaw=prompt('HP máximo (opcional):','');
  const hp=hpRaw==null||hpRaw.trim()===''?null:Math.max(0,Math.trunc(Number(hpRaw)||0));
  const {error}=await client.from('room_initiative').insert({
    room_id:roomId,kind:'npc',label:name,initiative:ini,current_hp:hp,max_hp:hp
  });
  if(error)return toast('Não foi possível adicionar o NPC.');
  await logEvent(name+' foi adicionado(a) à iniciativa.','combat',{kind:'npc'});
  loadCombat();
}

/* ---------- TRACKERS ---------- */

function trackerCard(t){
  return '<div class="tracker-card">'+
    '<div class="tracker-copy"><b>'+esc(t.label)+'</b><span>'+Number(t.current_value)+' / '+Number(t.max_value)+'</span></div>'+
    '<div class="tracker-bar"><i style="width:'+pct(t.current_value,t.max_value)+'%"></i></div>'+
    (liveMaster()?'<div class="tracker-actions"><button data-tracker="'+t.id+'" data-tracker-delta="-1">−</button><button data-tracker="'+t.id+'" data-tracker-delta="1">+</button><button class="danger ghost-danger" data-tracker-delete="'+t.id+'">×</button></div>':'')+
  '</div>';
}
async function loadTrackers(){
  const {data,error}=await client.from('room_trackers').select('*').eq('room_id',roomId).order('sort_order').order('created_at');
  if(error)return;
  trackers=data||[];
  $('#trackerList').innerHTML=trackers.length
    ?trackers.map(trackerCard).join('')
    :'<div class="mini-empty">Nenhum objetivo ou contador ativo.</div>';

  $$('[data-tracker]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const t=trackers.find(x=>x.id===b.dataset.tracker);
    if(!t)return;
    const next=Math.max(0,Math.min(Number(t.max_value),Number(t.current_value)+Number(b.dataset.trackerDelta)));
    await client.from('room_trackers').update({current_value:next}).eq('id',t.id);
    await logEvent(t.label+': '+t.current_value+' → '+next+'.','tracker',{tracker_id:t.id});
    loadTrackers();
  });
  $$('[data-tracker-delete]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const t=trackers.find(x=>x.id===b.dataset.trackerDelete);
    if(!t||!confirm('Excluir o contador "'+t.label+'"?'))return;
    await client.from('room_trackers').delete().eq('id',t.id);
    loadTrackers();
  });
}
async function addTracker(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const label=(prompt('Nome do objetivo ou contador:','Objetivo')||'').trim();
  if(!label)return;
  const max=Math.max(1,Math.trunc(Number(prompt('Valor máximo:','4'))||1));
  const current=Math.max(0,Math.min(max,Math.trunc(Number(prompt('Valor atual:','0'))||0)));
  const {error}=await client.from('room_trackers').insert({
    room_id:roomId,label,current_value:current,max_value:max
  });
  if(error)return toast('Não foi possível criar o contador.');
  await logEvent('Contador criado: '+label+'.','tracker');
  loadTrackers();
}

/* ---------- BRIEFING / NOTES ---------- */

async function loadBriefing(){
  const {data,error}=await client.from('room_briefing').select('title,body,updated_at').eq('room_id',roomId).maybeSingle();
  if(error)return;
  briefing=data||{title:'',body:''};
  const has=!!((briefing.title||'').trim()||(briefing.body||'').trim());
  $('#roomBriefing').classList.toggle('hidden',!has&&!isMaster);
  $('#briefingTitle').textContent=(briefing.title||'').trim()||'Sem comunicado';
  $('#briefingBody').textContent=(briefing.body||'').trim()||'O mestre ainda não publicou um aviso para a mesa.';
}
async function editBriefing(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const title=prompt('Título da cena/comunicado:',briefing?.title||'Cena atual');
  if(title==null)return;
  const body=prompt('Texto que todos na sala verão:',briefing?.body||'');
  if(body==null)return;
  const {error}=await client.from('room_briefing').upsert({
    room_id:roomId,title:title.trim(),body:body.trim()
  });
  if(error)return toast('Não foi possível publicar o comunicado.');
  await logEvent('Comunicado da mesa atualizado: '+(title.trim()||'sem título')+'.','briefing');
  loadBriefing();
}
async function loadNotes(){
  if(!isMaster)return;
  const {data}=await client.from('room_master_notes').select('notes').eq('room_id',roomId).maybeSingle();
  $('#masterNotes').value=data?.notes||'';
}
async function saveNotes(){
  if(!isMaster)return;
  const btn=$('#saveNotes');
  btn.disabled=true;
  $('#notesState').textContent='Salvando…';
  const {error}=await client.from('room_master_notes').upsert({
    room_id:roomId,notes:$('#masterNotes').value
  });
  btn.disabled=false;
  $('#notesState').textContent=error?'Falha ao salvar.':'Salvo agora · somente você vê isto.';
  if(!error)setTimeout(()=>$('#notesState').textContent='Somente você vê isto.',2200);
}

/* ---------- SESSION HISTORY ---------- */

function eventIcon(type){
  return ({
    combat:'⚔',turn:'➜',resource:'◈',condition:'◆',tracker:'◎',undo:'↶',
    ready:'✓',briefing:'✦',member_removed:'×',member_join:'+',member_leave:'−',
    npc_resource:'◇',room:'·'
  })[type]||'·';
}
async function loadEvents(){
  const {data,error}=await client.from('room_events')
    .select('id,event_type,message,payload,created_at')
    .eq('room_id',roomId).order('created_at',{ascending:false}).limit(40);
  if(error)return;
  events=data||[];

  $('#eventList').innerHTML=events.length?events.map(e=>{
    const p=e.payload||{};
    const canUndo=liveMaster()&&e.event_type==='resource'&&p.character_id&&p.resource&&
      Number.isFinite(Number(p.old_value))&&Number.isFinite(Number(p.new_value));
    return '<div class="event-row">'+
      '<span class="event-icon">'+eventIcon(e.event_type)+'</span>'+
      '<div class="event-copy"><b>'+esc(e.message)+'</b>'+
        '<span class="event-meta"><small>'+new Date(e.created_at).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})+'</small>'+
        (canUndo?'<button data-undo-event="'+e.id+'">Desfazer</button>':'')+
        '</span>'+
      '</div>'+
    '</div>';
  }).join(''):'<div class="mini-empty">As ações importantes da sessão aparecerão aqui.</div>';

  $$('[data-undo-event]').forEach(b=>b.onclick=()=>undoResourceEvent(b.dataset.undoEvent));
}
async function undoResourceEvent(eventId){
  const e=events.find(x=>x.id===eventId);
  const p=e?.payload;
  if(!p)return;
  const {data,error}=await client.rpc('master_restore_character_resource',{
    p_room_id:roomId,p_character_id:p.character_id,p_resource:p.resource,
    p_expected_current:Number(p.new_value),p_value:Number(p.old_value)
  });
  if(error)return toast('Não foi possível desfazer: o valor já mudou depois desta ação.');
  await logEvent('Ajuste desfeito: '+e.message,'undo',{source_event:eventId,restored_value:data});
  toast('Alteração desfeita.');
  await Promise.all([loadParticipants(),loadEvents()]);
}

/* ---------- ROLL CHAT ---------- */

function rollPortrait(r){
  const p=participants.find(x=>x.character_id===r.character_id);
  if(p?.portrait_url)return '<img src="'+esc(p.portrait_url)+'" alt="">';
  const initial=(r.author_name||'?').trim().slice(0,1).toUpperCase();
  return '<span>'+esc(initial)+'</span>';
}
function rollClass(r){
  if(r.is_manual)return 'manual';
  if(r.expression?.toLowerCase().startsWith('1d20')&&Number(r.natural_roll)===20)return 'critical';
  if(r.expression?.toLowerCase().startsWith('1d20')&&Number(r.natural_roll)===1)return 'fumble';
  return '';
}
function renderRoll(r){
  const dice=Array.isArray(r.dice)?r.dice:[];
  const cls=rollClass(r);
  const mod=Number(r.modifier||0);
  const detail=r.is_manual
    ?'<span class="manual-mark">resultado manual</span>'
    :'<span class="roll-expression">'+esc(r.expression)+'</span>'+
      (dice.length?'<span class="dice-breakdown">['+dice.map(esc).join(', ')+']'+(mod?(' '+(mod>0?'+':'')+mod):'')+'</span>':'');

  const special=cls==='critical'
    ?'<span class="roll-special">ACERTO CRÍTICO</span>'
    :cls==='fumble'
      ?'<span class="roll-special">FALHA CRÍTICA</span>'
      :'';

  return '<article class="roll-message '+cls+(r.visibility==='master'?' secret':'')+'">'+
    '<div class="roll-avatar">'+rollPortrait(r)+'</div>'+
    '<div class="roll-message-main">'+
      '<header><div><b>'+esc(r.author_name)+'</b><span>'+esc(r.label)+'</span></div><time>'+new Date(r.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</time></header>'+
      '<div class="roll-result-line"><strong>'+Number(r.total)+'</strong><div>'+special+detail+'</div></div>'+
      (r.visibility==='master'?'<span class="secret-badge">OCULTA · SOMENTE MESTRE</span>':'')+
    '</div>'+
  '</article>';
}
async function loadRolls({stick=true}={}){
  const feed=$('#rollFeed');
  const nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<100;

  const {data,error}=await client.from('room_rolls')
    .select('id,room_id,actor_id,character_id,author_name,label,expression,dice,modifier,total,natural_roll,is_manual,visibility,created_at')
    .eq('room_id',roomId)
    .order('created_at',{ascending:false})
    .limit(80);
  if(error){
    console.warn('[SCUTUM] rolls',error);
    return;
  }

  rolls=(data||[]).reverse();
  $('#rollCount').textContent=rolls.length;
  feed.innerHTML=rolls.length
    ?rolls.map(renderRoll).join('')
    :'<div class="roll-empty"><span>✦</span><b>Nenhuma rolagem ainda.</b><small>Os dados da mesa aparecerão aqui em tempo real.</small></div>';

  if(stick||nearBottom)requestAnimationFrame(()=>{feed.scrollTop=feed.scrollHeight});
}
function rollLabel(){
  const kind=$('#rollKind').value.trim()||'Rolagem livre';
  const desc=$('#rollLabel').value.trim();
  return desc?kind+' · '+desc:kind;
}
function rollVisibility(){
  return isMaster&&$('#secretRoll')?.checked?'master':'public';
}
async function submitSystemRoll(){
  if(!roomLive())return toast('Esta sessão está encerrada.');
  const raw=$('#rollExpression').value.trim().toLowerCase().replace(/\s+/g,'');
  if(!/^[1-9]\d?d[1-9]\d{0,3}(?:[+-]\d{1,5})?$/i.test(raw)){
    return toast('Use uma expressão como 1d20+5, 2d6 ou 1d100.');
  }

  const btn=$('#submitRoll');
  btn.disabled=true;
  btn.textContent='Rolando…';

  const {error}=await client.rpc('roll_room_dice',{
    p_room_id:roomId,
    p_character_id:currentRollCharacterId(),
    p_label:rollLabel(),
    p_expression:raw,
    p_visibility:rollVisibility()
  });

  btn.disabled=false;
  btn.textContent='Rolar';

  if(error){
    console.warn(error);
    return toast('Não foi possível realizar a rolagem.');
  }
  $('#rollLabel').value='';
  loadRolls({stick:true});
}
async function submitManualRoll(){
  if(!roomLive())return toast('Esta sessão está encerrada.');
  const raw=$('#manualTotal').value.trim();
  if(raw==='')return toast('Digite o resultado manual.');
  const total=Math.trunc(Number(raw));
  if(!Number.isFinite(total)||Math.abs(total)>1000000)return toast('Resultado manual inválido.');

  const btn=$('#submitManualRoll');
  btn.disabled=true;
  btn.textContent='Registrando…';

  const {error}=await client.rpc('register_room_manual_roll',{
    p_room_id:roomId,
    p_character_id:currentRollCharacterId(),
    p_label:rollLabel(),
    p_total:total,
    p_visibility:rollVisibility()
  });

  btn.disabled=false;
  btn.textContent='Registrar';

  if(error){
    console.warn(error);
    return toast('Não foi possível registrar o resultado.');
  }
  $('#manualTotal').value='';
  $('#rollLabel').value='';
  loadRolls({stick:true});
}
async function clearRollChat(){
  if(!liveMaster())return;
  if(!confirm('Limpar todo o chat de rolagens desta sala? Esta ação não pode ser desfeita.'))return;
  const {error}=await client.from('room_rolls').delete().eq('room_id',roomId);
  if(error)return toast('Não foi possível limpar as rolagens.');
  toast('Chat de rolagens limpo.');
  loadRolls({stick:true});
}
function toggleManualMode(){
  const manual=$('#manualToggle').checked;
  $('#diceMode').classList.toggle('hidden',manual);
  $('#manualMode').classList.toggle('hidden',!manual);
  if(manual)setTimeout(()=>$('#manualTotal').focus(),0);
  else setTimeout(()=>$('#rollExpression').focus(),0);
}

/* ---------- EXPORT ---------- */

async function exportSession(){
  const [{data:allEvents},{data:allInitiative},{data:allTrackers},{data:allEffects},{data:allRolls}]=await Promise.all([
    client.from('room_events').select('event_type,message,payload,created_at').eq('room_id',roomId).order('created_at',{ascending:true}).limit(1000),
    client.from('room_initiative').select('kind,label,initiative,current_hp,max_hp,conditions').eq('room_id',roomId).order('initiative',{ascending:false}),
    client.from('room_trackers').select('label,current_value,max_value').eq('room_id',roomId).order('sort_order'),
    client.from('room_effects').select('character_id,label,remaining_rounds').eq('room_id',roomId),
    client.from('room_rolls').select('author_name,label,expression,dice,modifier,total,natural_roll,is_manual,visibility,created_at').eq('room_id',roomId).order('created_at',{ascending:true}).limit(2000)
  ]);

  const snapshot={
    scutumSessionExport:2,
    exportedAt:new Date().toISOString(),
    room:{name:room?.name,code:room?.code,status:room?.status,created_at:room?.created_at,ended_at:room?.ended_at},
    participants:participants.map(p=>({
      character_name:p.character_name,level:p.level,origin_type:p.origin_type,god_id:p.god_id,
      current_hp:p.current_hp,max_hp:p.max_hp,current_energy:p.current_energy,max_energy:p.max_energy,
      current_sanity:p.current_sanity,conditions:p.conditions,exhaustion:p.exhaustion
    })),
    initiative:allInitiative||[],
    trackers:allTrackers||[],
    timedEffects:allEffects||[],
    rolls:allRolls||[],
    events:allEvents||[]
  };

  const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='scutum-sessao-'+String(room?.name||'missao').toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')+'.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('Registro da sessão exportado.');
}

/* ---------- REFRESH / REALTIME ---------- */

async function refresh(){
  if(!await loadRoom())return;
  await Promise.all([
    loadParticipants(),
    loadCombat(),
    loadTrackers(),
    loadEvents(),
    loadBriefing()
  ]);
  await loadRolls({stick:false});
}

(async()=>{
  const {data:{session}}=await client.auth.getSession();
  if(!session){location.replace('index.html');return}
  me=session.user;

  const {data:master}=await client.rpc('is_room_master',{p_room_id:roomId});
  isMaster=!!master;

  $('#masterNote').classList.toggle('hidden',!isMaster);
  $('#masterWorkspace').classList.toggle('hidden',!isMaster);

  $('#roomBoot').classList.add('hidden');
  $('#roomView').classList.remove('hidden');

  await refresh();
  if(isMaster)await loadNotes();

  clearInterval(durationTimer);
  durationTimer=setInterval(updateDuration,30000);

  channel=client.channel('room-'+roomId,{config:{presence:{key:me.id}}})
    .on('presence',{event:'sync'},()=>{
      onlineIds=new Set(Object.keys(channel.presenceState()||{}));
      loadParticipants();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'room_members',filter:'room_id=eq.'+roomId},()=>schedule(refresh))
    .on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:'id=eq.'+roomId},()=>schedule(refresh))
    .on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>schedule(loadParticipants))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_combat',filter:'room_id=eq.'+roomId},()=>schedule(loadCombat))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_initiative',filter:'room_id=eq.'+roomId},()=>schedule(loadCombat))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_trackers',filter:'room_id=eq.'+roomId},()=>schedule(loadTrackers))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_briefing',filter:'room_id=eq.'+roomId},()=>schedule(loadBriefing))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_effects',filter:'room_id=eq.'+roomId},()=>schedule(loadParticipants))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_events',filter:'room_id=eq.'+roomId},()=>schedule(loadEvents))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_rolls',filter:'room_id=eq.'+roomId},()=>loadRolls({stick:true}))
    .subscribe(async status=>{
      const pill=$('#syncStatus');
      if(status==='SUBSCRIBED'){
        pill.textContent='Ao vivo';
        pill.className='sync-pill online';
        await channel.track({user_id:me.id,online_at:new Date().toISOString()});
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        pill.textContent='Reconectando…';
        pill.className='sync-pill warning';
      }else if(status==='CLOSED'){
        pill.textContent='Offline';
        pill.className='sync-pill warning';
      }
    });
})();

/* ---------- STATIC BINDINGS ---------- */

$('#logout').onclick=()=>client.auth.signOut().then(()=>location.replace('index.html'));

$('#copyCode').onclick=async()=>{
  try{await navigator.clipboard.writeText(room?.code||'');toast('Código copiado.')}
  catch{toast('Código: '+(room?.code||''))}
};
$('#copyInvite').onclick=async()=>{
  const base=location.href.split('room.html')[0]+'index.html?join='+encodeURIComponent(room?.code||'');
  try{await navigator.clipboard.writeText(base);toast('Link de convite copiado.')}
  catch{prompt('Copie o convite:',base)}
};

$('#leaveRoom').onclick=async()=>{
  if(!confirm('Sair desta sala?'))return;
  await logEvent('Um participante saiu da sala.','member_leave');
  const {error}=await client.from('room_members').delete().eq('room_id',roomId).eq('user_id',me.id);
  if(error)return toast(error.message);
  location.href='index.html';
};
$('#endRoom').onclick=async()=>{
  if(!confirm('Encerrar esta sala? Ela deixará de aceitar novos participantes.'))return;
  await logEvent('A sala foi encerrada.','room');
  const {error}=await client.from('rooms').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',roomId);
  if(error)return toast(error.message);
  toast('Sala encerrada.');
  refresh();
};
$('#reopenRoom').onclick=async()=>{
  if(!confirm('Reabrir esta sala e permitir novas entradas?'))return;
  const {error}=await client.from('rooms').update({status:'active',ended_at:null}).eq('id',roomId);
  if(error)return toast(error.message);
  await logEvent('A sala foi reaberta.','room');
  toast('Sala reaberta.');
  refresh();
};

$('#startCombat').onclick=startCombat;
$('#prevTurn').onclick=prevTurn;
$('#nextTurn').onclick=nextTurn;
$('#endCombat').onclick=endCombat;
$('#clearCombat').onclick=clearCombat;
$('#addNpc').onclick=addNpc;
$('#addTracker').onclick=addTracker;
$('#saveNotes').onclick=saveNotes;
$('#editBriefing').onclick=editBriefing;
$('#refreshEvents').onclick=loadEvents;
$('#exportSession').onclick=exportSession;

$('#rollForm').onsubmit=e=>{
  e.preventDefault();
  if($('#manualToggle').checked)return submitManualRoll();
  submitSystemRoll();
};
$('#submitManualRoll').onclick=submitManualRoll;
$('#manualToggle').onchange=toggleManualMode;
$('#clearRolls').onclick=clearRollChat;
$$('[data-die]').forEach(b=>b.onclick=()=>{
  $('#rollExpression').value=b.dataset.die;
  $('#rollExpression').focus();
});
$('#rollExpression').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){
    e.preventDefault();
    submitSystemRoll();
  }
});
$('#manualTotal').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    submitManualRoll();
  }
});

})();