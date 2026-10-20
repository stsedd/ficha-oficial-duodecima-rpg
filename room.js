(()=>{'use strict';
const cfg=window.SCUTUM_CONFIG||{},roomId=new URLSearchParams(location.search).get('id');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2600)};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase||!roomId){location.replace('index.html');return}
const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let me=null,room=null,isMaster=false,channel=null,onlineIds=new Set(),participants=[],combat=null,initiative=[],trackers=[],events=[],refreshTimer=0;

function pct(current,max){if(current==null||max==null||!Number.isFinite(Number(max))||Number(max)<=0)return 0;return Math.max(0,Math.min(100,(Number(current)/Number(max))*100))}
function liveMaster(){return isMaster&&room?.status==='active'}
function schedule(fn,delay=80){clearTimeout(refreshTimer);refreshTimer=setTimeout(fn,delay)}
async function logEvent(message,eventType='note',payload={}){
  if(!me)return;
  const {error}=await client.from('room_events').insert({room_id:roomId,actor_id:me.id,event_type:eventType,message,payload});
  if(error)console.warn('[SCUTUM] event log',error);
}
function adjustButtons(characterId,resource,current){
  if(!liveMaster()||current==null)return '';
  return '<span class="resource-actions"><button data-adjust="'+characterId+'" data-resource="'+resource+'" data-delta="-1" title="Diminuir 1">−</button><button data-adjust="'+characterId+'" data-resource="'+resource+'" data-delta="1" title="Aumentar 1">+</button><button data-custom-adjust="'+characterId+'" data-resource="'+resource+'" title="Ajuste personalizado">•••</button></span>';
}
function resource(label,current,max,characterId,key){
  const visible=current!=null,hasMax=max!=null&&Number.isFinite(Number(max))&&Number(max)>0;
  const value=visible?(hasMax?esc(current)+'/'+esc(max):esc(current)):'—';
  return '<div class="resource-row"><span>'+label+'</span><div class="bar"><i style="width:'+(visible&&hasMax?pct(current,max):0)+'%"></i></div><b>'+value+'</b>'+adjustButtons(characterId,key,current)+'</div>';
}
function participantCard(p){
  const self=p.user_id===me.id,canSee=isMaster||self,origin=p.origin_type==='mortal'?'Mortal da Névoa':(p.god_id||'—'),portrait=p.portrait_url||'',online=onlineIds.has(p.user_id),ready=!!p.ready;
  const cond=canSee?(p.conditions||[]):[],exhaustion=canSee?p.exhaustion:null;
  let conditions='';
  if(canSee){
    conditions='<div class="conditions">'+(cond.length?cond.map(x=>'<span>'+esc(x)+(liveMaster()?'<button data-remove-condition="'+p.character_id+'" data-condition="'+esc(x)+'" aria-label="Remover condição">×</button>':'')+'</span>').join(''):'<span class="quiet">Sem condições</span>')+(exhaustion?'<span>Exaustão '+exhaustion+'</span>':'')+(liveMaster()?'<button class="condition-add" data-add-condition="'+p.character_id+'">+ condição</button>':'')+'</div>';
  }
  let masterExtra='';
  if(liveMaster()){
    masterExtra='<div class="exhaustion-control"><span>Exaustão</span><button data-adjust="'+p.character_id+'" data-resource="exhaustion" data-delta="-1">−</button><b>'+Number(exhaustion||0)+'</b><button data-adjust="'+p.character_id+'" data-resource="exhaustion" data-delta="1">+</button></div>';
  }
  const actions=[];
  if(self){
    actions.push('<button class="primary" data-open-sheet="'+p.character_id+'">Abrir minha ficha</button>');
    if(room?.status==='active')actions.push('<button data-ready="'+p.user_id+'" class="'+(ready?'ready-on':'')+'">'+(ready?'✓ Pronto':'Marcar pronto')+'</button>');
  }
  if(liveMaster()&&!self)actions.push('<button class="danger" data-remove-member="'+p.user_id+'" data-remove-name="'+esc(p.character_name)+'">Remover da sala</button>');
  return '<article class="participant-card"><div class="participant-art">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'')+'</div><div class="participant-copy"><h3>'+esc(p.character_name)+'</h3><p class="sub"><span>'+esc(origin)+' · Nv '+Number(p.level||1)+(self?' · você':'')+'</span><span class="presence-wrap"><span class="presence '+(online?'online':'offline')+'"><i></i>'+(online?'online':'offline')+'</span>'+(ready?'<span class="ready-badge">pronto</span>':'')+'</span></p>'+(canSee?'<div class="resource-stack">'+resource('HP',p.current_hp,p.max_hp,p.character_id,'hp')+resource('EN',p.current_energy,p.max_energy,p.character_id,'energy')+resource('SAN',p.current_sanity,100,p.character_id,'sanity')+'</div>'+conditions+masterExtra:'<div class="privacy-note">Os valores mecânicos desta personagem ficam visíveis ao próprio jogador e ao mestre da sala.</div>')+(actions.length?'<div class="participant-actions">'+actions.join('')+'</div>':'')+'</div></article>';
}
function bindParticipantActions(){
  $$('[data-open-sheet]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.openSheet)+'&return='+encodeURIComponent('room.html?id='+roomId));
  $('[data-ready]').forEach(b=>b.onclick=async()=>{
    const p=participants.find(x=>x.user_id===b.dataset.ready);if(!p)return;
    const next=!p.ready;
    const {error}=await client.from('room_members').update({ready:next}).eq('room_id',roomId).eq('user_id',me.id);
    if(error)return toast('Não foi possível atualizar seu status.');
    await logEvent((p.character_name||'Personagem')+(next?' está pronto(a).':' não está mais pronto(a).'),'ready',{ready:next});
    loadParticipants();
  });
  $('[data-remove-member]').forEach(b=>b.onclick=async()=>{
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
    await toggleCondition(b.dataset.addCondition,condition,true);
  });
  $$('[data-remove-condition]').forEach(b=>b.onclick=()=>toggleCondition(b.dataset.removeCondition,b.dataset.condition,false));
}
async function adjustCharacter(characterId,res,delta){
  const p=participants.find(x=>x.character_id===characterId),label={hp:'HP',energy:'Energia',sanity:'Sanidade',exhaustion:'Exaustão'}[res]||res;
  const {data,error}=await client.rpc('master_adjust_character_resource',{p_room_id:roomId,p_character_id:characterId,p_resource:res,p_delta:delta});
  if(error)return toast('Não foi possível ajustar '+label+'.');
  const row=data?.[0];
  if(row)await logEvent((p?.character_name||'Personagem')+': '+label+' '+row.old_value+' → '+row.new_value+'.','resource',{character_id:characterId,resource:res,old_value:row.old_value,new_value:row.new_value});
  toast(label+' atualizado.');
  loadParticipants();
}
async function toggleCondition(characterId,condition,enabled){
  const p=participants.find(x=>x.character_id===characterId);
  const {error}=await client.rpc('master_toggle_character_condition',{p_room_id:roomId,p_character_id:characterId,p_condition:condition,p_enabled:enabled});
  if(error)return toast('Não foi possível alterar a condição.');
  await logEvent((p?.character_name||'Personagem')+(enabled?' recebeu ':' perdeu a condição ')+condition+'.','condition',{character_id:characterId,condition,enabled});
  loadParticipants();
}

async function loadRoom(){
  const {data,error}=await client.from('rooms').select('*').eq('id',roomId).single();
  if(error||!data){alert('Você não tem mais acesso a esta sala ou ela não existe.');location.replace('index.html');return false}
  room=data;$('#roomName').textContent=room.name;$('#roomCode').textContent=room.code;$('#roomStatus').textContent=room.status==='active'?'Ativa':'Encerrada';
  document.body.classList.toggle('ended',room.status!=='active');
  $('#endRoom').classList.toggle('hidden',!liveMaster());
  $('.master-only').forEach(x=>x.classList.toggle('hidden',!liveMaster()));
  $('#leaveRoom').classList.toggle('hidden',isMaster&&!await hasMembership());
  return true;
}
async function hasMembership(){const {data}=await client.from('room_members').select('room_id').eq('room_id',roomId).eq('user_id',me.id).maybeSingle();return !!data}
async function loadParticipants(){
  const {data,error}=await client.rpc('get_room_participants',{p_room_id:roomId});
  if(error){toast('Não foi possível atualizar a mesa.');return}
  const {data:memberStates}=await client.from('room_members').select('user_id,ready').eq('room_id',roomId);
  const readyMap=new Map((memberStates||[]).map(x=>[x.user_id,!!x.ready]));
  participants=(data||[]).map(x=>({...x,ready:readyMap.get(x.user_id)||false}));
  $('#participantCount').textContent=participants.length;
  $('#participantGrid').innerHTML=participants.length?participants.map(participantCard).join(''):'<div class="empty">Ainda não há personagens nesta sala. Compartilhe o convite com os jogadores.</div>';
  bindParticipantActions();
}

function initiativeRow(x,index){
  const active=combat?.active&&index===Math.min(Number(combat.turn_index||0),Math.max(0,initiative.length-1));
  let detail='';
  if(x.kind==='npc'&&x.current_hp!=null)detail='<span class="npc-hp">HP '+esc(x.current_hp)+(x.max_hp!=null?'/'+esc(x.max_hp):'')+'</span>';
  const controls=liveMaster()?'<div class="init-controls"><label>INI <input data-init-value="'+x.id+'" type="number" value="'+Number(x.initiative||0)+'"></label>'+(x.kind==='npc'&&x.current_hp!=null?'<button data-npc-hp="'+x.id+'" data-npc-delta="-1">−HP</button><button data-npc-hp="'+x.id+'" data-npc-delta="1">+HP</button>':'')+'<button class="danger ghost-danger" data-init-remove="'+x.id+'">×</button></div>':'<b class="init-score">'+Number(x.initiative||0)+'</b>';
  return '<div class="initiative-row '+(active?'active':'')+'"><span class="turn-number">'+(index+1)+'</span><div><b>'+esc(x.label)+'</b><small>'+(x.kind==='npc'?'NPC':'Personagem')+'</small>'+detail+'</div>'+controls+'</div>';
}
async function loadCombat(){
  const {data:state}=await client.from('room_combat').select('*').eq('room_id',roomId).maybeSingle();
  combat=state||{room_id:roomId,active:false,round:1,turn_index:0};
  const {data,error}=await client.from('room_initiative').select('*').eq('room_id',roomId).order('initiative',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
  if(error)return;
  initiative=data||[];
  if(combat.active&&initiative.length){
    const idx=Math.min(Number(combat.turn_index||0),initiative.length-1),current=initiative[idx];
    $('#combatStatus').innerHTML='<b>Rodada '+Number(combat.round||1)+'</b><span>Turno de '+esc(current.label)+'</span>';
  }else $('#combatStatus').textContent=initiative.length?'Combate pausado. A ordem está preservada.':'Nenhum combate ativo.';
  $('#initiativeList').innerHTML=initiative.length?initiative.map(initiativeRow).join(''):'<div class="mini-empty">A iniciativa ainda está vazia.</div>';
  $('#startCombat').textContent=combat.active?'Reiniciar':'Iniciar';
  bindCombatActions();
}
function bindCombatActions(){
  $$('[data-init-value]').forEach(i=>i.onchange=async()=>{await client.from('room_initiative').update({initiative:Number(i.value)||0}).eq('id',i.dataset.initValue);loadCombat()});
  $$('[data-init-remove]').forEach(b=>b.onclick=async()=>{await client.from('room_initiative').delete().eq('id',b.dataset.initRemove);await logEvent('Um participante foi removido da iniciativa.','combat');loadCombat()});
  $$('[data-npc-hp]').forEach(b=>b.onclick=async()=>{
    const row=initiative.find(x=>x.id===b.dataset.npcHp);if(!row)return;
    const delta=Number(b.dataset.npcDelta),max=row.max_hp==null?2147483647:Number(row.max_hp);
    const next=Math.max(0,Math.min(max,Number(row.current_hp||0)+delta));
    await client.from('room_initiative').update({current_hp:next}).eq('id',row.id);
    await logEvent(row.label+': HP '+row.current_hp+' → '+next+'.','npc_resource',{initiative_id:row.id});
    loadCombat();
  });
}
async function startCombat(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const existing=new Set(initiative.filter(x=>x.character_id).map(x=>x.character_id));
  const missing=participants.filter(p=>!existing.has(p.character_id)).map((p,i)=>({room_id:roomId,kind:'player',character_id:p.character_id,label:p.character_name,initiative:0,sort_order:i}));
  if(missing.length){const {error}=await client.from('room_initiative').insert(missing);if(error)return toast('Não foi possível montar a iniciativa.')}
  const {error}=await client.from('room_combat').upsert({room_id:roomId,active:true,round:1,turn_index:0});
  if(error)return toast('Não foi possível iniciar o combate.');
  await logEvent('Combate iniciado.','combat');
  loadCombat();
}
async function nextTurn(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  if(!combat?.active||!initiative.length)return toast('Inicie o combate primeiro.');
  let next=Number(combat.turn_index||0)+1,round=Number(combat.round||1);
  if(next>=initiative.length){next=0;round++}
  await client.from('room_combat').update({turn_index:next,round}).eq('room_id',roomId);
  const target=initiative[next];
  await logEvent('Rodada '+round+': turno de '+target.label+'.','turn',{round,turn_index:next,label:target.label});
  loadCombat();
}
async function endCombat(){
  if(!combat)return;
  await client.from('room_combat').upsert({room_id:roomId,active:false,round:Number(combat.round||1),turn_index:Number(combat.turn_index||0)});
  await logEvent('Combate encerrado.','combat');
  loadCombat();
}
async function addNpc(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const name=(prompt('Nome do NPC ou criatura:','')||'').trim();if(!name)return;
  const ini=Number(prompt('Iniciativa:','0')||0);
  const hpRaw=prompt('HP máximo (opcional):','');
  const hp=hpRaw==null||hpRaw.trim()===''?null:Math.max(0,Number(hpRaw)||0);
  const {error}=await client.from('room_initiative').insert({room_id:roomId,kind:'npc',label:name,initiative:Math.trunc(ini||0),current_hp:hp,max_hp:hp});
  if(error)return toast('Não foi possível adicionar o NPC.');
  await logEvent(name+' foi adicionado(a) à iniciativa.','combat',{kind:'npc'});
  loadCombat();
}

function trackerCard(t){
  const percent=pct(t.current_value,t.max_value);
  return '<div class="tracker-card"><div class="tracker-copy"><b>'+esc(t.label)+'</b><span>'+Number(t.current_value)+' / '+Number(t.max_value)+'</span></div><div class="tracker-bar"><i style="width:'+percent+'%"></i></div>'+(isMaster?'<div class="tracker-actions"><button data-tracker="'+t.id+'" data-tracker-delta="-1">−</button><button data-tracker="'+t.id+'" data-tracker-delta="1">+</button><button class="danger ghost-danger" data-tracker-delete="'+t.id+'">×</button></div>':'')+'</div>';
}
async function loadTrackers(){
  const {data,error}=await client.from('room_trackers').select('*').eq('room_id',roomId).order('sort_order').order('created_at');
  if(error)return;
  trackers=data||[];
  $('#trackerList').innerHTML=trackers.length?trackers.map(trackerCard).join(''):'<div class="mini-empty">Nenhum objetivo ou contador ativo.</div>';
  $$('[data-tracker]').forEach(b=>b.onclick=async()=>{
    const t=trackers.find(x=>x.id===b.dataset.tracker);if(!t)return;
    const next=Math.max(0,Math.min(Number(t.max_value),Number(t.current_value)+Number(b.dataset.trackerDelta)));
    await client.from('room_trackers').update({current_value:next}).eq('id',t.id);
    await logEvent(t.label+': '+t.current_value+' → '+next+'.','tracker',{tracker_id:t.id});
    loadTrackers();
  });
  $$('[data-tracker-delete]').forEach(b=>b.onclick=async()=>{const t=trackers.find(x=>x.id===b.dataset.trackerDelete);if(!t)return;if(!confirm('Excluir o contador "'+t.label+'"?'))return;await client.from('room_trackers').delete().eq('id',t.id);loadTrackers()});
}
async function addTracker(){
  if(!liveMaster())return toast('Esta sessão está encerrada.');
  const label=(prompt('Nome do objetivo ou contador:','Objetivo')||'').trim();if(!label)return;
  const max=Math.max(1,Math.trunc(Number(prompt('Valor máximo:','4'))||1));
  const current=Math.max(0,Math.min(max,Math.trunc(Number(prompt('Valor atual:','0'))||0)));
  const {error}=await client.from('room_trackers').insert({room_id:roomId,label,current_value:current,max_value:max});
  if(error)return toast('Não foi possível criar o contador.');
  await logEvent('Contador criado: '+label+'.','tracker');
  loadTrackers();
}

async function loadNotes(){
  if(!isMaster)return;
  const {data}=await client.from('room_master_notes').select('notes').eq('room_id',roomId).maybeSingle();
  $('#masterNotes').value=data?.notes||'';
}
async function saveNotes(){
  const btn=$('#saveNotes');btn.disabled=true;$('#notesState').textContent='Salvando…';
  const {error}=await client.from('room_master_notes').upsert({room_id:roomId,notes:$('#masterNotes').value});
  btn.disabled=false;
  $('#notesState').textContent=error?'Falha ao salvar.':'Salvo agora · somente você vê isto.';
  if(!error)setTimeout(()=>$('#notesState').textContent='Somente você vê isto.',2200);
}

function eventIcon(type){return ({combat:'⚔',turn:'➜',resource:'◈',condition:'◆',tracker:'◎',roll:'⚄',undo:'↶',ready:'✓',member_removed:'×',member_join:'+',member_leave:'−',npc_resource:'◇'})[type]||'·'}
async function loadEvents(){
  const {data,error}=await client.from('room_events').select('id,event_type,message,payload,created_at').eq('room_id',roomId).order('created_at',{ascending:false}).limit(40);
  if(error)return;
  events=data||[];
  $('#eventList').innerHTML=events.length?events.map(e=>{
    const canUndo=liveMaster()&&e.event_type==='resource'&&e.payload?.character_id&&e.payload?.resource&&Number.isFinite(Number(e.payload?.old_value))&&Number.isFinite(Number(e.payload?.new_value));
    return '<div class="event-row"><span>'+eventIcon(e.event_type)+'</span><div><b>'+esc(e.message)+'</b><span class="event-meta"><small>'+new Date(e.created_at).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})+'</small>'+(canUndo?'<button data-undo-event="'+e.id+'">Desfazer</button>':'')+'</span></div></div>';
  }).join(''):'<div class="mini-empty">As ações importantes da sessão aparecerão aqui.</div>';
  $('[data-undo-event]').forEach(b=>b.onclick=()=>undoResourceEvent(b.dataset.undoEvent));
}
async function undoResourceEvent(eventId){
  const e=events.find(x=>x.id===eventId),p=e?.payload;if(!p)return;
  const {data,error}=await client.rpc('master_restore_character_resource',{p_room_id:roomId,p_character_id:p.character_id,p_resource:p.resource,p_expected_current:Number(p.new_value),p_value:Number(p.old_value)});
  if(error)return toast('Não foi possível desfazer: o valor já mudou depois desta ação.');
  await logEvent('Ajuste desfeito: '+e.message,'undo',{source_event:eventId,restored_value:data});
  toast('Alteração desfeita.');
  await Promise.all([loadParticipants(),loadEvents()]);
}

async function refresh(){
  if(!await loadRoom())return;
  await Promise.all([loadParticipants(),loadCombat(),loadTrackers(),loadEvents()]);
}
(async()=>{
  const {data:{session}}=await client.auth.getSession();if(!session){location.replace('index.html');return}
  me=session.user;
  const {data:master}=await client.rpc('is_room_master',{p_room_id:roomId});isMaster=!!master;
  $('#masterNote').classList.toggle('hidden',!isMaster);
  $('#masterWorkspace').classList.toggle('hidden',!isMaster);
  $$('.master-only').forEach(x=>x.classList.toggle('hidden',!isMaster));
  $('#roomBoot').classList.add('hidden');$('#roomView').classList.remove('hidden');
  await refresh();if(isMaster)await loadNotes();
  channel=client.channel('room-'+roomId,{config:{presence:{key:me.id}}})
    .on('presence',{event:'sync'},()=>{onlineIds=new Set(Object.keys(channel.presenceState()||{}));loadParticipants()})
    .on('postgres_changes',{event:'*',schema:'public',table:'room_members',filter:'room_id=eq.'+roomId},()=>schedule(refresh))
    .on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:'id=eq.'+roomId},()=>schedule(refresh))
    .on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>schedule(loadParticipants))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_combat',filter:'room_id=eq.'+roomId},()=>schedule(loadCombat))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_initiative',filter:'room_id=eq.'+roomId},()=>schedule(loadCombat))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_trackers',filter:'room_id=eq.'+roomId},()=>schedule(loadTrackers))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_events',filter:'room_id=eq.'+roomId},()=>schedule(loadEvents))
    .subscribe(async status=>{if(status==='SUBSCRIBED')await channel.track({user_id:me.id,online_at:new Date().toISOString()})});
})();
$('#logout').onclick=()=>client.auth.signOut().then(()=>location.replace('index.html'));
$('#copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(room?.code||'');toast('Código copiado.')}catch{toast('Código: '+(room?.code||''))}};
$('#copyInvite').onclick=async()=>{
  const base=location.href.split('room.html')[0]+'index.html?join='+encodeURIComponent(room?.code||'');
  try{await navigator.clipboard.writeText(base);toast('Link de convite copiado.')}catch{prompt('Copie o convite:',base)}
};
$('#leaveRoom').onclick=async()=>{if(!confirm('Sair desta sala?'))return;await logEvent('Um participante saiu da sala.','member_leave');const {error}=await client.from('room_members').delete().eq('room_id',roomId).eq('user_id',me.id);if(error)return toast(error.message);location.href='index.html'};
$('#endRoom').onclick=async()=>{if(!confirm('Encerrar esta sala? Ela deixará de aceitar novos participantes.'))return;await logEvent('A sala foi encerrada.','room');const {error}=await client.from('rooms').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',roomId);if(error)return toast(error.message);toast('Sala encerrada.');refresh()};
$('#startCombat').onclick=startCombat;$('#nextTurn').onclick=nextTurn;$('#endCombat').onclick=endCombat;$('#addNpc').onclick=addNpc;$('#addTracker').onclick=addTracker;
$('#saveNotes').onclick=saveNotes;$('#refreshEvents').onclick=loadEvents;
function secureRoll(sides){
  const max=Math.floor(0x100000000/sides)*sides;
  const a=new Uint32Array(1);let n;
  do{crypto.getRandomValues(a);n=a[0]}while(n>=max);
  return (n%sides)+1;
}
$('[data-roll]').forEach(b=>b.onclick=async()=>{
  const sides=Math.max(2,Number(b.dataset.roll)||20),mod=Math.trunc(Number($('#rollModifier').value)||0),natural=secureRoll(sides),total=natural+mod;
  $('#rollResult').textContent=String(total);
  const who=participants.find(p=>p.user_id===me.id)?.character_name||(isMaster?'Mestre':'Jogador');
  const modText=mod===0?'':(mod>0?' +'+mod:' '+mod);
  await logEvent(who+' rolou d'+sides+modText+': '+total+' (dado '+natural+').','roll',{sides,modifier:mod,natural,total});
  loadEvents();
});
})();