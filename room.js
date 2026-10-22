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
let actualMaster=false;
let accountRole='player';
let previewPlayer=false;
let channel=null;
let onlineIds=new Set();
let participants=[];
let combat=null;
let initiative=[];
let trackers=[];
let events=[];
let effects=[];
let rolls=[];
let messages=[];
let selectedCharacterId=null;
const refreshTimers=new Map();
let durationTimer=0;

function pct(current,max){
  if(current==null||max==null||!Number.isFinite(Number(max))||Number(max)<=0)return 0;
  return Math.max(0,Math.min(100,(Number(current)/Number(max))*100));
}
function liveMaster(){return isMaster&&room?.status==='active'}
function roomLive(){return room?.status==='active'}
function schedule(fn,delay=90){
  const key=fn?.name||'anonymous';
  clearTimeout(refreshTimers.get(key));
  refreshTimers.set(key,setTimeout(()=>{
    refreshTimers.delete(key);
    Promise.resolve(fn()).catch(err=>console.warn('[SCUTUM] atualização em tempo real',err));
  },delay));
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


function closeToolPanels(){
  $$('.tool-window').forEach(p=>p.classList.add('hidden'));
  $$('.dock-button[data-panel]').forEach(b=>b.classList.remove('active'));
  $('#dockTable')?.classList.add('active');
}
function openToolPanel(id){
  if(!id||id==='table'){closeToolPanels();return}
  const panel=$('#'+id);
  if(!panel)return;
  const wasOpen=!panel.classList.contains('hidden');
  $$('.tool-window').forEach(p=>p.classList.add('hidden'));
  $$('.dock-button[data-panel]').forEach(b=>b.classList.remove('active'));
  if(!wasOpen){
    panel.classList.remove('hidden');
    const trigger=$$('.dock-button[data-panel]').find(b=>b.dataset.panel===id);
    trigger?.classList.add('active');
    $('#dockTable')?.classList.remove('active');
  }else{
    $('#dockTable')?.classList.add('active');
  }
}
function toggleChat(force){
  const hidden=typeof force==='boolean'?!force:!document.body.classList.contains('chat-hidden');
  document.body.classList.toggle('chat-hidden',hidden);
  $('#dockChat')?.classList.toggle('active',!hidden);
}
function openSelectedSheet(){
  let characterId=isMaster?selectedCharacterId:(ownParticipant()?.character_id||null);
  if(!characterId&&isMaster){
    const first=participants[0];
    if(first){characterId=first.character_id;selectedCharacterId=characterId}
  }
  if(!characterId)return toast('Selecione uma personagem primeiro.');
  location.href='sheet.html?character='+encodeURIComponent(characterId)+'&return='+encodeURIComponent('room.html?id='+roomId);
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
  const safe=visible?Math.max(0,Math.min(100,Number(percent))):null;
  return '<div class="resource-row public-resource">'+
    '<span>'+label+'</span>'+
    '<div class="bar"><i style="width:'+(safe??0)+'%"></i></div>'+
    '<b aria-label="porcentagem">'+(safe==null?'—':Math.round(safe)+'%')+'</b>'+
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

  let conditionHtml='';
  if(canSee){
    const chips=cond.length?cond.slice(0,2).map(x=>{
      const timed=effects.find(e=>e.character_id===p.character_id&&e.label===x);
      return '<span>'+esc(x)+(timed?'<small class="effect-duration">'+Number(timed.remaining_rounds)+'r</small>':'')+
        (liveMaster()?'<button data-remove-condition="'+p.character_id+'" data-condition="'+esc(x)+'">×</button>':'')+'</span>';
    }).join(''):'<span class="quiet">Sem condições</span>';
    conditionHtml='<div class="conditions">'+chips+
      (liveMaster()?'<button class="condition-add" data-add-condition="'+p.character_id+'">+</button>':'')+
    '</div>';
  }

  const vitals=canSee
    ?'<div class="resource-stack">'+
      resource('HP',p.current_hp,p.max_hp,p.character_id,'hp')+
      resource('EN',p.current_energy,p.max_energy,p.character_id,'energy')+
      resource('SAN',p.current_sanity,100,p.character_id,'sanity')+
    '</div>'
    :'<div class="resource-stack public-vitals">'+
      publicResource('HP',p.hp_percent)+
      publicResource('EN',p.energy_percent)+
      publicResource('SAN',p.sanity_percent)+
    '</div>';

  return '<article class="participant-card '+(selectedCharacterId===p.character_id?'selected':'')+'" data-card-character="'+p.character_id+'" data-card-user="'+p.user_id+'">'+
    '<div class="participant-art">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'<span class="portrait-fallback">'+esc((p.character_name||'?').slice(0,1).toUpperCase())+'</span>')+'</div>'+
    '<div class="participant-copy">'+
      '<div class="participant-title"><div><h3>'+esc(p.character_name)+'</h3><p>'+esc(origin)+' · Nv '+Number(p.level||1)+'</p></div>'+
      '<span class="presence-wrap"><span class="presence '+(online?'online':'offline')+'"><i></i>'+(online?'online':'offline')+'</span>'+(ready?'<span class="ready-badge">pronto</span>':'')+'</span></div>'+
      vitals+
      conditionHtml+
      (self&&roomLive()?'<button class="card-ready-action '+(ready?'ready-on':'')+'" data-ready="'+p.user_id+'">'+(ready?'✓ Pronto':'Marcar pronto')+'</button>':'')+
    '</div>'+
  '</article>';
}
function bindParticipantActions(){
  $$('[data-card-character]').forEach(card=>{
    card.onclick=e=>{
      if(e.target.closest('button,input,select'))return;
      if(!isMaster&&card.dataset.cardUser!==me.id)return;
      selectedCharacterId=card.dataset.cardCharacter;
      $$('[data-card-character]').forEach(x=>x.classList.toggle('selected',x.dataset.cardCharacter===selectedCharacterId));
    };
    card.ondblclick=e=>{
      if(e.target.closest('button,input,select'))return;
      if(!isMaster&&card.dataset.cardUser!==me.id)return;
      selectedCharacterId=card.dataset.cardCharacter;
      openSelectedSheet();
    };
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
    const accessLost=error?.code==='PGRST116'||error?.code==='42501';
    if(room&&!accessLost){
      console.warn('[SCUTUM] falha temporária ao atualizar a sala',error);
      toast('Conexão instável. Mantendo a mesa aberta e tentando sincronizar novamente.');
      return true;
    }
    alert('Você não tem mais acesso a esta sala ou ela não existe.');
    location.replace('index.html');
    return false;
  }
  room=data;
  $('#roomName').textContent=room.name;
  $('#roomCode').textContent=room.code;
  $('#roomStatus').textContent=room.status==='active'?'Ativa':'Encerrada';
  const stateChip=$('#roomStateChip');
  if(stateChip){
    stateChip.textContent=room.status==='active'?'ATIVA':'ENCERRADA';
    stateChip.classList.toggle('ended',room.status!=='active');
  }
  document.body.classList.toggle('ended',room.status!=='active');
  $('#endRoom').classList.toggle('hidden',!liveMaster());
  $('#reopenRoom').classList.toggle('hidden',!isMaster||room.status==='active');
  $$('.master-only').forEach(x=>x.classList.toggle('hidden',!isMaster));
  $$('.window-footer.master-only').forEach(x=>x.classList.toggle('hidden',!liveMaster()));
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
  if(selectedCharacterId&&!participants.some(x=>x.character_id===selectedCharacterId))selectedCharacterId=null;
  if(!selectedCharacterId){
    const preferred=isMaster?participants[0]:participants.find(x=>x.user_id===me.id);
    if(preferred)selectedCharacterId=preferred.character_id;
  }

  $('#participantCount').textContent=participants.length;
  $('#participantGrid').innerHTML=participants.length
    ?participants.map(participantCard).join('')
    :'<div class="empty">Ainda não há personagens nesta sala. Compartilhe o convite com os jogadores.</div>';
  bindParticipantActions();
}

/* ---------- COMBAT ---------- */

function initiativeRow(x,index){
  const active=combat?.active&&combat?.current_entry_id===x.id;
  const hidden=isMaster&&x.visibility==='master';
  const npcHp=x.kind==='npc'&&x.current_hp!=null
    ?'<span class="npc-hp">HP '+esc(x.current_hp)+(x.max_hp!=null?'/'+esc(x.max_hp):'')+'</span>'
    :'';
  const hiddenBadge=hidden?'<span class="hidden-init-badge">OCULTO</span>':'';

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

  return '<div class="initiative-row '+(active?'active ':'')+(hidden?'hidden-entry':'')+'">'+
    '<span class="turn-number">'+(index+1)+'</span>'+
    '<div class="initiative-name"><b>'+esc(x.label)+'</b><small>'+(x.kind==='npc'?'NPC':'Personagem')+'</small>'+hiddenBadge+npcHp+'</div>'+
    controls+
  '</div>';
}

async function loadCombat(){
  const [{data:state},{data,error}]=await Promise.all([
    client.from('room_combat').select('*').eq('room_id',roomId).maybeSingle(),
    client.from('room_initiative').select('*').eq('room_id',roomId)
      .order('initiative',{ascending:false})
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true})
  ]);
  if(error)return;

  combat=state||{room_id:roomId,active:false,round:1,turn_index:0,current_entry_id:null};
  initiative=(data||[]).filter(x=>!previewPlayer||x.visibility==='public');

  if(combat.active){
    let current=initiative.find(x=>x.id===combat.current_entry_id);
    if(!current&&!combat.current_entry_id&&initiative.length){
      current=initiative[Math.min(Number(combat.turn_index||0),initiative.length-1)];
    }
    const currentLabel=current
      ?current.label
      :(combat.current_entry_id?'Ação do mestre':'Turno em andamento');
    $('#combatStatus').innerHTML=
      '<div><span>RODADA</span><b>'+Number(combat.round||1)+'</b></div>'+
      '<div><span>TURNO</span><strong>'+esc(currentLabel)+'</strong></div>';
  }else{
    $('#combatStatus').innerHTML='<span>'+(initiative.length?'Iniciativa preparada. O combate ainda não começou.':'Nenhum combate ativo.')+'</span>';
  }

  $('#initiativeList').innerHTML=initiative.length
    ?initiative.map(initiativeRow).join('')
    :'<div class="mini-empty">A iniciativa ainda está vazia.</div>';

  $('#startCombat').textContent=combat.active?'Reiniciar':'Iniciar';
  const quick=$('#initiativeQuickStatus'),roundMini=$('#roundMini');
  if(quick)quick.textContent=combat.active?'R'+Number(combat.round||1):initiative.length?initiative.length+' na ordem':'—';
  if(roundMini)roundMini.textContent=combat.active?'R'+Number(combat.round||1):'—';
  bindCombatActions();
}

function bindCombatActions(){
  $$('[data-set-turn]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const index=Number(b.dataset.setTurn)||0;
    const target=initiative[index];
    if(!target)return;
    await client.from('room_combat').upsert({
      room_id:roomId,
      active:true,
      round:Number(combat?.round||1),
      turn_index:index,
      current_entry_id:target.id
    });
    await logEvent(
      target.visibility==='master'?'O mestre avançou para uma ação oculta.':'Turno definido para '+target.label+'.',
      'turn',
      {round:Number(combat?.round||1),turn_index:index,hidden:target.visibility==='master'}
    );
    loadCombat();
  });

  $$('[data-init-value]').forEach(i=>i.onchange=async()=>{
    if(!liveMaster())return;
    await client.from('room_initiative').update({initiative:Number(i.value)||0}).eq('id',i.dataset.initValue);
    loadCombat();
  });

  $$('[data-init-remove]').forEach(b=>b.onclick=async()=>{
    if(!liveMaster())return;
    const row=initiative.find(x=>x.id===b.dataset.initRemove);
    await client.from('room_initiative').delete().eq('id',b.dataset.initRemove);
    if(row?.visibility!=='master')await logEvent('Um participante foi removido da iniciativa.','combat');
    if(combat?.current_entry_id===b.dataset.initRemove){
      await client.from('room_combat').update({current_entry_id:null}).eq('room_id',roomId);
    }
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
    if(row.visibility!=='master'){
      await logEvent(row.label+': HP '+row.current_hp+' → '+next+'.','npc_resource',{initiative_id:row.id});
    }
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
    if(row.visibility!=='master'){
      await logEvent(row.label+': HP '+row.current_hp+' → '+next+'.','npc_resource',{initiative_id:row.id});
    }
    loadCombat();
  });
}

async function pullInitiative(showToast=true){
  if(!liveMaster())return;
  const existing=new Set(initiative.filter(x=>x.character_id).map(x=>x.character_id));
  const missing=participants
    .filter(p=>!existing.has(p.character_id))
    .map((p,i)=>({
      room_id:roomId,
      kind:'player',
      character_id:p.character_id,
      label:p.character_name,
      initiative:0,
      sort_order:i,
      visibility:'public'
    }));

  if(missing.length){
    const {error}=await client.from('room_initiative').insert(missing);
    if(error){toast('Não foi possível puxar os personagens para a iniciativa.');return false}
  }
  if(showToast)toast(missing.length?'Personagens adicionados à iniciativa.':'Todos os personagens já estão na iniciativa.');
  await loadCombat();
  return true;
}

async function startCombat(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const ok=await pullInitiative(false);
  if(ok===false)return;

  const {data:list,error:listError}=await client.from('room_initiative').select('*').eq('room_id',roomId)
    .order('initiative',{ascending:false})
    .order('sort_order',{ascending:true})
    .order('created_at',{ascending:true});
  if(listError||!(list||[]).length)return toast('Adicione alguém à iniciativa antes de começar.');

  const first=list[0];
  const {error}=await client.from('room_combat').upsert({
    room_id:roomId,
    active:true,
    round:1,
    turn_index:0,
    current_entry_id:first.id
  });
  if(error)return toast('Não foi possível iniciar o combate.');
  await logEvent('Combate iniciado.','combat');
  loadCombat();
}

async function nextTurn(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!combat?.active||!initiative.length)return toast('Inicie o combate primeiro.');

  let currentIndex=initiative.findIndex(x=>x.id===combat.current_entry_id);
  if(currentIndex<0)currentIndex=Math.min(Number(combat.turn_index||0),initiative.length-1);

  let next=currentIndex+1;
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

  const target=initiative[next];
  await client.from('room_combat').update({
    turn_index:next,
    round,
    current_entry_id:target.id
  }).eq('room_id',roomId);

  await logEvent(
    target.visibility==='master'
      ?'Rodada '+round+': ação oculta do mestre.'
      :'Rodada '+round+': turno de '+target.label+'.',
    'turn',
    {round,turn_index:next,label:target.visibility==='master'?null:target.label,hidden:target.visibility==='master'}
  );
  await Promise.all([loadCombat(),loadParticipants()]);
}

async function prevTurn(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!combat?.active||!initiative.length)return toast('Inicie o combate primeiro.');

  let currentIndex=initiative.findIndex(x=>x.id===combat.current_entry_id);
  if(currentIndex<0)currentIndex=Math.min(Number(combat.turn_index||0),initiative.length-1);

  let prev=currentIndex-1;
  let round=Number(combat.round||1);
  if(prev<0){
    prev=initiative.length-1;
    round=Math.max(1,round-1);
  }

  const target=initiative[prev];
  await client.from('room_combat').update({
    turn_index:prev,
    round,
    current_entry_id:target.id
  }).eq('room_id',roomId);

  await logEvent(
    target.visibility==='master'?'Turno voltou para uma ação oculta.':'Turno voltou para '+target.label+'.',
    'turn',
    {round,turn_index:prev,hidden:target.visibility==='master'}
  );
  loadCombat();
}

async function endCombat(){
  if(!liveMaster()||!combat)return;
  await client.from('room_combat').upsert({
    room_id:roomId,
    active:false,
    round:Number(combat.round||1),
    turn_index:Number(combat.turn_index||0),
    current_entry_id:combat.current_entry_id||null
  });
  await logEvent('Combate encerrado.','combat');
  loadCombat();
}

async function clearCombat(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!confirm('Limpar toda a iniciativa? Isso não remove ninguém da sala.'))return;
  await client.from('room_combat').upsert({
    room_id:roomId,active:false,round:1,turn_index:0,current_entry_id:null
  });
  const {error}=await client.from('room_initiative').delete().eq('room_id',roomId);
  if(error)return toast('Não foi possível limpar a iniciativa.');
  await logEvent('A iniciativa foi limpa.','combat');
  loadCombat();
}

async function addNpc(hidden=false){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const name=(prompt(hidden?'Nome interno do monstro oculto:':'Nome do NPC ou criatura:','')||'').trim();
  if(!name)return;
  const ini=Math.trunc(Number(prompt('Iniciativa:','0'))||0);
  const hpRaw=prompt('HP máximo (opcional):','');
  const hp=hpRaw==null||hpRaw.trim()===''?null:Math.max(0,Math.trunc(Number(hpRaw)||0));
  const visibility=hidden?'master':'public';

  const {error}=await client.from('room_initiative').insert({
    room_id:roomId,
    kind:'npc',
    label:name,
    initiative:ini,
    current_hp:hp,
    max_hp:hp,
    visibility
  });
  if(error)return toast('Não foi possível adicionar o NPC.');

  if(!hidden)await logEvent(name+' foi adicionado(a) à iniciativa.','combat',{kind:'npc'});
  toast(hidden?'Monstro oculto adicionado apenas à iniciativa do mestre.':name+' adicionado à iniciativa.');
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

/* ---------- NOTES ---------- */

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
  const breakdown=r.breakdown||{};
  const baseMod=breakdown.base_modifier!=null?Number(breakdown.base_modifier||0):Number(r.modifier||0);
  const extraMod=Number(breakdown.extra_modifier||0);

  let detail='';
  if(r.is_manual){
    detail='<span class="manual-mark">resultado manual</span>';
  }else{
    detail='<span class="roll-expression">'+esc(r.expression)+'</span>'+
      (dice.length?'<span class="dice-breakdown">['+dice.map(esc).join(', ')+']'+(baseMod?(' '+(baseMod>0?'+':'')+baseMod):'')+'</span>':'')+
      (extraMod?'<span class="roll-extra">'+(extraMod>0?'+':'')+extraMod+' extra</span>':'');
  }

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
      (r.note?'<p class="roll-note">'+esc(r.note)+'</p>':'')+
      (r.visibility==='master'?'<span class="secret-badge">OCULTA · SOMENTE MESTRE</span>':'')+
    '</div>'+
  '</article>';
}
function renderChatMessage(m){
  const p=participants.find(x=>x.character_id===m.character_id);
  const portrait=p?.portrait_url
    ?'<img src="'+esc(p.portrait_url)+'" alt="">'
    :'<span>'+esc((m.author_name||'?').trim().slice(0,1).toUpperCase())+'</span>';
  const body=esc(m.body||'').replace(/\n/g,'<br>');
  return '<article class="roll-message shared-card '+esc(m.message_type||'ability')+'">'+
    '<div class="roll-avatar">'+portrait+'</div>'+
    '<div class="roll-message-main">'+
      '<header><div><b>'+esc(m.author_name)+'</b><span>compartilhou uma habilidade</span></div><time>'+new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</time></header>'+
      '<div class="shared-card-body">'+
        '<span class="shared-type">HABILIDADE</span>'+
        '<h3>'+esc(m.title)+'</h3>'+
        (m.subtitle?'<small>'+esc(m.subtitle)+'</small>':'')+
        (body?'<p>'+body+'</p>':'')+
      '</div>'+
    '</div>'+
  '</article>';
}
async function loadRolls({stick=true}={}){
  const feed=$('#rollFeed');
  const nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<100;

  const [{data:rollData,error:rollError},{data:messageData,error:messageError}]=await Promise.all([
    client.from('room_rolls')
      .select('id,room_id,actor_id,character_id,author_name,label,expression,dice,modifier,total,natural_roll,is_manual,visibility,breakdown,note,created_at')
      .eq('room_id',roomId)
      .order('created_at',{ascending:false})
      .limit(80),
    client.from('room_messages')
      .select('id,room_id,actor_id,character_id,message_type,author_name,title,subtitle,body,metadata,visibility,created_at')
      .eq('room_id',roomId)
      .order('created_at',{ascending:false})
      .limit(80)
  ]);

  if(rollError||messageError){
    console.warn('[SCUTUM] chat',rollError||messageError);
    return;
  }

  rolls=(rollData||[]).filter(x=>!previewPlayer||x.visibility==='public');
  messages=(messageData||[]).filter(x=>!previewPlayer||x.visibility==='public');
  const feedRows=[
    ...rolls.map(x=>({...x,_feedType:'roll'})),
    ...messages.map(x=>({...x,_feedType:'message'}))
  ].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(-100);

  $('#rollCount').textContent=feedRows.length;
  feed.innerHTML=feedRows.length
    ?feedRows.map(x=>x._feedType==='roll'?renderRoll(x):renderChatMessage(x)).join('')
    :'<div class="roll-empty"><span>✦</span><b>Nenhuma mensagem ainda.</b><small>Rolagens e habilidades compartilhadas aparecerão aqui em tempo real.</small></div>';

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

  const extra=Math.trunc(Number($('#rollExtraModifier')?.value)||0);
  const note=($('#rollNote')?.value||'').trim();

  const btn=$('#submitRoll');
  btn.disabled=true;
  btn.textContent='Rolando…';

  const {error}=await client.rpc('roll_room_dice_with_modifiers',{
    p_room_id:roomId,
    p_character_id:currentRollCharacterId(),
    p_label:rollLabel(),
    p_expression:raw,
    p_extra_modifier:extra,
    p_note:note,
    p_visibility:rollVisibility()
  });

  btn.disabled=false;
  btn.textContent='Rolar';

  if(error){
    console.warn(error);
    return toast('Não foi possível realizar a rolagem.');
  }
  $('#rollLabel').value='';
  if($('#rollExtraModifier'))$('#rollExtraModifier').value='0';
  if($('#rollNote'))$('#rollNote').value='';
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
  if(!confirm('Limpar rolagens e habilidades compartilhadas desta sala? Esta ação não pode ser desfeita.'))return;

  const [{error:rollError},{error:messageError}]=await Promise.all([
    client.from('room_rolls').delete().eq('room_id',roomId),
    client.from('room_messages').delete().eq('room_id',roomId)
  ]);
  if(rollError||messageError)return toast('Não foi possível limpar o chat.');
  toast('Chat limpo.');
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
  const [{data:allEvents},{data:allInitiative},{data:allTrackers},{data:allEffects},{data:allRolls},{data:allMessages}]=await Promise.all([
    client.from('room_events').select('event_type,message,payload,created_at').eq('room_id',roomId).order('created_at',{ascending:true}).limit(1000),
    client.from('room_initiative').select('kind,label,initiative,current_hp,max_hp,conditions,visibility').eq('room_id',roomId).order('initiative',{ascending:false}),
    client.from('room_trackers').select('label,current_value,max_value').eq('room_id',roomId).order('sort_order'),
    client.from('room_effects').select('character_id,label,remaining_rounds').eq('room_id',roomId),
    client.from('room_rolls').select('author_name,label,expression,dice,modifier,total,natural_roll,is_manual,visibility,breakdown,note,created_at').eq('room_id',roomId).order('created_at',{ascending:true}).limit(2000),
    client.from('room_messages').select('message_type,author_name,title,subtitle,body,metadata,visibility,created_at').eq('room_id',roomId).order('created_at',{ascending:true}).limit(2000)
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
    sharedMessages:allMessages||[],
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
    loadEvents()
  ]);
  await loadRolls({stick:false});
}

(async()=>{
  const {data:{session}}=await client.auth.getSession();
  if(!session){location.replace('index.html');return}
  me=session.user;

  const [{data:master},{data:account}]=await Promise.all([
    client.rpc('is_room_master',{p_room_id:roomId}),
    client.from('profiles').select('role').eq('id',me.id).maybeSingle()
  ]);
  actualMaster=!!master;
  accountRole=account?.role||'player';
  previewPlayer=accountRole==='admin'&&sessionStorage.getItem('scutum_view_mode')==='player';

  if(previewPlayer){
    const {data:membership}=await client.from('room_members').select('room_id').eq('room_id',roomId).eq('user_id',me.id).maybeSingle();
    if(!membership){
      alert('No modo jogador, entre na sala usando o código e uma personagem.');
      location.replace('index.html');
      return;
    }
  }

  isMaster=actualMaster&&!previewPlayer;

  $('#notesPanel')?.classList.toggle('master-only',true);
  if(!isMaster)$('#notesPanel')?.classList.add('hidden');

  $('#roomBoot').classList.add('hidden');
  $('#roomView').classList.remove('hidden');

  await refresh();
  if(previewPlayer)toast('Modo de teste: visualização como jogador.');
  if(isMaster)await loadNotes();
  $('#dockChat')?.classList.toggle('active',!document.body.classList.contains('chat-hidden'));

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
    .on('postgres_changes',{event:'*',schema:'public',table:'room_effects',filter:'room_id=eq.'+roomId},()=>schedule(loadParticipants))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_events',filter:'room_id=eq.'+roomId},()=>schedule(loadEvents))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_rolls',filter:'room_id=eq.'+roomId},()=>loadRolls({stick:true}))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_messages',filter:'room_id=eq.'+roomId},()=>loadRolls({stick:true}))
    .subscribe(async status=>{
      const pill=$('#syncStatus');
      if(status==='SUBSCRIBED'){
        pill.textContent='Conectado';
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

$$('.dock-button[data-panel]').forEach(b=>b.onclick=()=>openToolPanel(b.dataset.panel));
$('#dockTable').onclick=()=>closeToolPanels();
$('#dockChat').onclick=()=>toggleChat();
$('#dockSheet').onclick=openSelectedSheet;
$('#initiativeQuick').onclick=()=>openToolPanel('initiativePanel');
$('#openInitiativeFloat').onclick=()=>openToolPanel('initiativePanel');
$('#openChatFloat').onclick=()=>toggleChat(true);
$('#closeChat').onclick=()=>toggleChat(false);
$('#liveButton').onclick=()=>openToolPanel('settingsPanel');
$$('[data-close-panel]').forEach(b=>b.onclick=()=>openToolPanel(b.dataset.closePanel));
if(matchMedia('(max-width:900px)').matches)document.body.classList.add('chat-hidden');

$('#pullInitiative').onclick=()=>pullInitiative(true);
$('#startCombat').onclick=startCombat;
$('#prevTurn').onclick=prevTurn;
$('#nextTurn').onclick=nextTurn;
$('#endCombat').onclick=endCombat;
$('#clearCombat').onclick=clearCombat;
$('#addNpc').onclick=()=>addNpc(false);
$('#addHiddenNpc').onclick=()=>addNpc(true);
$('#addTracker').onclick=addTracker;
$('#saveNotes').onclick=saveNotes;
$('#refreshEvents').onclick=loadEvents;
$('#exportSession').onclick=exportSession;

$('#submitRoll').onclick=()=>$('#manualToggle').checked?submitManualRoll():submitSystemRoll();
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