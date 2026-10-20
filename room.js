(()=>{'use strict';
const cfg=window.SCUTUM_CONFIG||{},roomId=new URLSearchParams(location.search).get('id');
const $=s=>document.querySelector(s),toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2400)};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase||!roomId){location.replace('index.html');return}
const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let me=null,room=null,isMaster=false,channel=null;

function pct(current,max){if(current==null||max==null||!Number.isFinite(Number(max))||Number(max)<=0)return 0;return Math.max(0,Math.min(100,(Number(current)/Number(max))*100))}
function resource(label,current,max){
  const visible=current!=null&&max!=null;
  return '<div class="resource-row"><span>'+label+'</span><div class="bar"><i style="width:'+(visible?pct(current,max):0)+'%"></i></div><b>'+(visible?esc(current)+'/'+esc(max):'—')+'</b></div>'
}
function participantCard(p){
  const self=p.user_id===me.id,canSee=isMaster||self,origin=p.origin_type==='mortal'?'Mortal da Névoa':(p.god_id||'—'),portrait=p.portrait_url||'';
  const cond=canSee?(p.conditions||[]):[],exhaustion=canSee?p.exhaustion:null;
  return '<article class="participant-card"><div class="participant-art">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'')+'</div><div class="participant-copy"><h3>'+esc(p.character_name)+'</h3><p class="sub">'+esc(origin)+' · Nv '+Number(p.level||1)+(self?' · você':'')+'</p>'+(canSee?'<div class="resource-stack">'+resource('HP',p.current_hp,p.max_hp)+resource('EN',p.current_energy,p.max_energy)+resource('SAN',p.current_sanity,100)+'</div><div class="conditions">'+(cond.length?cond.map(x=>'<span>'+esc(x)+'</span>').join(''):'<span class="quiet">Sem condições</span>')+(exhaustion?'<span>Exaustão '+exhaustion+'</span>':'')+'</div>':'<div class="privacy-note">Os valores mecânicos desta personagem ficam visíveis ao próprio jogador e ao mestre da sala.</div>')+(self?'<div class="participant-actions"><button class="primary" data-open-sheet="'+p.character_id+'">Abrir minha ficha</button></div>':'')+'</div></article>';
}
async function loadRoom(){
  const {data,error}=await client.from('rooms').select('*').eq('id',roomId).single();
  if(error||!data){alert('Você não tem acesso a esta sala ou ela não existe.');location.replace('index.html');return false}
  room=data;$('#roomName').textContent=room.name;$('#roomCode').textContent=room.code;$('#roomStatus').textContent=room.status==='active'?'Ativa':'Encerrada';
  document.body.classList.toggle('ended',room.status!=='active');
  $('#endRoom').classList.toggle('hidden',!isMaster||room.status!=='active');
  $('#leaveRoom').classList.toggle('hidden',isMaster&&!await hasMembership());
  return true;
}
async function hasMembership(){const {data}=await client.from('room_members').select('room_id').eq('room_id',roomId).eq('user_id',me.id).maybeSingle();return !!data}
async function loadParticipants(){
  const {data,error}=await client.rpc('get_room_participants',{p_room_id:roomId});
  if(error){toast('Não foi possível atualizar a mesa.');return}
  $('#participantCount').textContent=(data||[]).length;
  $('#participantGrid').innerHTML=(data||[]).length?(data||[]).map(participantCard).join(''):'<div class="empty">Ainda não há personagens nesta sala. Compartilhe o código com os jogadores.</div>';
  document.querySelectorAll('[data-open-sheet]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.openSheet)+'&return='+encodeURIComponent('room.html?id='+roomId));
}
async function refresh(){if(!await loadRoom())return;await loadParticipants()}
(async()=>{
  const {data:{session}}=await client.auth.getSession();if(!session){location.replace('index.html');return}
  me=session.user;
  const {data:master}=await client.rpc('is_room_master',{p_room_id:roomId});isMaster=!!master;
  $('#masterNote').classList.toggle('hidden',!isMaster);
  $('#roomBoot').classList.add('hidden');$('#roomView').classList.remove('hidden');
  await refresh();
  channel=client.channel('room-'+roomId)
    .on('postgres_changes',{event:'*',schema:'public',table:'room_members',filter:'room_id=eq.'+roomId},()=>loadParticipants())
    .on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:'id=eq.'+roomId},()=>refresh())
    .on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>loadParticipants())
    .subscribe();
})();
$('#logout').onclick=()=>client.auth.signOut().then(()=>location.replace('index.html'));
$('#copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(room?.code||'');toast('Código copiado.')}catch{toast('Código: '+(room?.code||''))}};
$('#leaveRoom').onclick=async()=>{if(!confirm('Sair desta sala?'))return;const {error}=await client.from('room_members').delete().eq('room_id',roomId).eq('user_id',me.id);if(error)return toast(error.message);location.href='index.html'};
$('#endRoom').onclick=async()=>{if(!confirm('Encerrar esta sala? Ela deixará de aceitar novos participantes.'))return;const {error}=await client.from('rooms').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',roomId);if(error)return toast(error.message);toast('Sala encerrada.');refresh()};
})();