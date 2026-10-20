(()=>{'use strict';
const cfg=window.SCUTUM_CONFIG||{},ready=cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2800)};
let mode='login',client=null,profile=null,adminChannel=null,roomChannel=null,myCharacters=[];

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function setMode(v){mode=v;$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===v));$('#authSubmit').textContent=v==='login'?'Entrar':'Criar conta';$('#password').autocomplete=v==='login'?'current-password':'new-password';$('#authHint').textContent=''}
$$('[data-auth-tab]').forEach(b=>b.onclick=()=>setMode(b.dataset.authTab));

function summary(d={}){return {hp:Number(d.currentHp??0),en:d.currentEnergy==null?'—':Number(d.currentEnergy),san:Number(d.currentSanity??100),conditions:Array.isArray(d.conditions)?d.conditions:[],exhaustion:Number(d.exhaustion||0)}}
function card(c){
  const d=c.sheet_data||{},s=summary(d),portrait=d.history?.portraitUrl||c.portrait_url||'',god=c.origin_type==='mortal'?'Mortal da Névoa':(c.god_id||'—');
  return '<article class="character-card"><div class="char-cover">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'')+'</div><div class="char-copy"><h3>'+esc(c.name||'Sem nome')+'</h3><p>'+esc(god)+' · Nv '+Number(c.level||1)+'</p><div class="vitals"><div><span>HP</span><b>'+s.hp+'/'+(c.max_hp??'?')+'</b></div><div><span>EN</span><b>'+s.en+(s.en==='—'?'':'/'+(c.max_energy??'?'))+'</b></div><div><span>SAN</span><b>'+s.san+'</b></div></div><div class="char-actions"><button class="primary" data-open="'+c.id+'">Abrir ficha</button><button data-delete="'+c.id+'">Arquivar</button></div></div></article>'
}
function bindCards(){
  $$('[data-open]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.open));
  $$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Arquivar esta ficha?'))return;await client.from('characters').update({archived:true}).eq('id',b.dataset.delete);renderApp()})
}

function roomCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(6);crypto.getRandomValues(bytes);
  return [...bytes].map(v=>chars[v%chars.length]).join('');
}
function roomCard(r,count,userId){
  const master=r.created_by===userId||profile?.role==='admin';
  return '<article class="room-card"><div><p class="eyebrow">'+(master?'MESA DO MESTRE':'SALA ATIVA')+'</p><h3>'+esc(r.name)+'</h3><p><span class="room-code">'+esc(r.code)+'</span> · '+count+' participante'+(count===1?'':'s')+'</p></div><button class="primary" data-open-room="'+r.id+'">Abrir sala</button></article>';
}
async function loadRooms(user){
  const {data:rooms,error}=await client.from('rooms').select('id,name,code,status,created_by,created_at').eq('status','active').order('created_at',{ascending:false});
  if(error){toast('Não foi possível carregar as salas: '+error.message);return}
  const ids=(rooms||[]).map(r=>r.id);let counts={};
  if(ids.length){
    const {data:members}=await client.from('room_members').select('room_id').in('room_id',ids);
    for(const m of members||[])counts[m.room_id]=(counts[m.room_id]||0)+1;
  }
  $('#roomCount').textContent=(rooms||[]).length;
  $('#roomsGrid').innerHTML=(rooms||[]).length?(rooms||[]).map(r=>roomCard(r,counts[r.id]||0,user.id)).join(''):'<div class="empty room-empty">Nenhuma sala ativa. O mestre pode criar uma quando a missão começar.</div>';
  $$('[data-open-room]').forEach(b=>b.onclick=()=>location.href='room.html?id='+encodeURIComponent(b.dataset.openRoom));
  if(roomChannel){client.removeChannel(roomChannel);roomChannel=null}
  roomChannel=client.channel('hub-rooms')
    .on('postgres_changes',{event:'*',schema:'public',table:'rooms'},()=>loadRooms(user))
    .on('postgres_changes',{event:'*',schema:'public',table:'room_members'},()=>loadRooms(user))
    .subscribe();
}

async function renderApp(){
  const {data:{user}}=await client.auth.getUser();if(!user)return showAuth();
  $('#bootView')?.classList.add('hidden');
  const {data:p}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();profile=p;
  $('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');
  $('#sessionActions').innerHTML='<button id="logout">Sair</button>';$('#logout').onclick=()=>client.auth.signOut();
  $('#welcome').textContent='Meus personagens';
  const {data:chars,error}=await client.from('characters').select('*').eq('owner_id',user.id).eq('archived',false).order('updated_at',{ascending:false});
  if(error){toast(error.message);return}
  myCharacters=chars||[];
  $('#characterCount').textContent=myCharacters.length;$('#firstRun')?.classList.toggle('hidden',myCharacters.length>0);
  $('#characterGrid').innerHTML=myCharacters.length?myCharacters.map(card).join(''):'<div class="empty compact-empty">Quando você importar a primeira ficha, ela aparece aqui.</div>';
  bindCards();
  $('#createRoomBtn').classList.toggle('hidden',p?.role!=='admin');
  await loadRooms(user);
  if(p?.role==='admin')await renderAdmin();else $('#adminPanel').classList.add('hidden');
}
async function renderAdmin(){
  $('#adminPanel').classList.remove('hidden');
  if(!adminChannel)adminChannel=client.channel('admin-character-watch').on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>renderAdmin()).subscribe();
  const {data}=await client.from('characters').select('id,name,level,current_hp,max_hp,current_energy,max_energy,current_sanity,conditions,exhaustion,updated_at').eq('archived',false).order('updated_at',{ascending:false});
  $('#adminCharacters').innerHTML=(data||[]).map(c=>'<div class="admin-row"><div><b>'+esc(c.name)+'</b><small><br>HP '+(c.current_hp??'—')+'/'+(c.max_hp??'—')+' · EN '+(c.current_energy??'—')+'/'+(c.max_energy??'—')+' · SAN '+(c.current_sanity??'—')+(c.conditions?.length?' · '+c.conditions.join(', '):'')+'</small></div><button data-admin-open="'+c.id+'">Ver</button></div>').join('')||'<p class="empty">Nenhuma ficha.</p>';
  $$('[data-admin-open]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.adminOpen))
}

$('#newCharacter').onclick=async()=>{const {data:{user}}=await client.auth.getUser();const blank={schemaVersion:24,isCreated:false,name:'',player:'',level:1,godId:'iuppiter'};const {data,error}=await client.from('characters').insert({owner_id:user.id,name:'Nova personagem',level:1,origin_type:'divine',god_id:'iuppiter',sheet_data:blank}).select().single();if(error)return toast(error.message);location.href='sheet.html?character='+data.id};
const importCharacterFile=async f=>{if(!f)return;try{const d=JSON.parse(await f.text()),{data:{user}}=await client.auth.getUser();const {data,error}=await client.from('characters').insert({owner_id:user.id,name:d.name||'Personagem importada',level:Number(d.level||1),origin_type:d.originType==='mortal'?'mortal':'divine',god_id:d.godId||null,current_hp:d.currentHp,max_hp:null,current_energy:d.currentEnergy,max_energy:null,current_sanity:d.currentSanity??100,conditions:d.conditions||[],exhaustion:d.exhaustion||0,portrait_url:d.history?.portraitUrl||null,sheet_data:d}).select().single();if(error)throw error;toast('Ficha importada.');location.href='sheet.html?character='+data.id}catch(err){toast('Não foi possível importar: '+err.message)}};
$('#importCharacter').onchange=e=>importCharacterFile(e.target.files?.[0]);
$('#firstRunImport')?.addEventListener('change',e=>importCharacterFile(e.target.files?.[0]));
$('#firstRunNew')?.addEventListener('click',()=>$('#newCharacter').click());

function openDialog(d){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','')}
$('#createRoomBtn').onclick=()=>{const input=$('#roomName');input.value='';openDialog($('#createRoomDialog'));setTimeout(()=>input.focus(),30)};
$('#joinRoomBtn').onclick=()=>{
  if(!myCharacters.length){toast('Você precisa ter ao menos uma ficha antes de entrar em uma sala.');return}
  $('#joinRoomCode').value='';$('#joinCharacter').innerHTML=myCharacters.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · Nv '+Number(c.level||1)+'</option>').join('');
  openDialog($('#joinRoomDialog'));setTimeout(()=>$('#joinRoomCode').focus(),30);
};
$('#createRoomForm').onsubmit=async e=>{
  e.preventDefault();const name=$('#roomName').value.trim();if(!name)return;
  const {data:{user}}=await client.auth.getUser();const btn=$('#createRoomSubmit');btn.disabled=true;
  try{
    let created=null,lastError=null;
    for(let i=0;i<5&&!created;i++){
      const {data,error}=await client.from('rooms').insert({name,code:roomCode(),created_by:user.id}).select().single();
      if(error){lastError=error;if(error.code!=='23505')break}else created=data;
    }
    if(!created)throw lastError||new Error('Não foi possível criar a sala.');
    $('#createRoomDialog').close();location.href='room.html?id='+encodeURIComponent(created.id);
  }catch(err){toast(err.message)}finally{btn.disabled=false}
};
$('#joinRoomForm').onsubmit=async e=>{
  e.preventDefault();const code=$('#joinRoomCode').value.trim().toUpperCase(),characterId=$('#joinCharacter').value;if(!code||!characterId)return;
  const btn=$('#joinRoomSubmit');btn.disabled=true;
  try{
    const {data:found,error:findError}=await client.rpc('find_room_by_code',{p_code:code});if(findError)throw findError;
    const room=found?.[0];if(!room)throw new Error('Não encontrei uma sala ativa com esse código.');
    const {data:{user}}=await client.auth.getUser();
    const {data:existing}=await client.from('room_members').select('room_id').eq('room_id',room.id).eq('user_id',user.id).maybeSingle();
    if(!existing){const {error}=await client.from('room_members').insert({room_id:room.id,user_id:user.id,character_id:characterId,role:'player'});if(error)throw error}
    $('#joinRoomDialog').close();location.href='room.html?id='+encodeURIComponent(room.id);
  }catch(err){toast(err.message)}finally{btn.disabled=false}
};

function showAuth(){$('#bootView')?.classList.add('hidden');$('#authView').classList.remove('hidden');$('#appView').classList.add('hidden');$('#sessionActions').innerHTML=''}
$('#authForm').onsubmit=async e=>{
  e.preventDefault();if(!ready)return toast('Backend do Lab ainda não foi conectado.');
  const submit=$('#authSubmit');if(submit.disabled)return;const email=$('#email').value.trim(),password=$('#password').value;
  submit.disabled=true;submit.textContent=mode==='login'?'Entrando…':'Criando…';$('#authHint').textContent='';
  try{
    const r=mode==='login'?await client.auth.signInWithPassword({email,password}):await client.auth.signUp({email,password});
    if(r.error){
      const msg=String(r.error.message||'');
      if(/email rate limit exceeded|over_email_send_rate_limit/i.test(msg)){ $('#authHint').textContent='O serviço de confirmação por e-mail atingiu o limite temporário. A administração do Lab precisa liberar o cadastro sem confirmação.';return}
      if(mode==='signup'&&(/database error saving new user/i.test(msg)||/already registered|already exists|duplicate/i.test(msg))){$('#authHint').innerHTML='Essa conta já existe. Mude para <b>“Entrar”</b> e use a senha cadastrada.';return}
      if(mode==='login'&&/invalid login credentials/i.test(msg)){ $('#authHint').textContent='E-mail ou senha incorretos. Se você ainda não conseguiu concluir o cadastro, use “Criar conta”.';return}
      if(mode==='login'&&/email not confirmed/i.test(msg)){ $('#authHint').innerHTML='Seu cadastro existe, mas ainda depende de confirmação de e-mail. Avise a administração do Lab.';return}
      $('#authHint').textContent=msg||'Não foi possível continuar.';return
    }
    if(mode==='signup'&&!r.data.session){$('#authHint').innerHTML='<b>Cadastro iniciado.</b> Este projeto ainda está exigindo confirmação de e-mail; avise a administração do Lab se o e-mail não chegar.';return}
    renderApp();
  }finally{submit.disabled=false;submit.textContent=mode==='login'?'Entrar':'Criar conta'}
};
if(!ready){$('#bootView')?.classList.add('hidden');$('#authView').classList.remove('hidden');$('#authHint').textContent='Interface pronta. Falta conectar o projeto Supabase.';return}
client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
client.auth.onAuthStateChange(()=>setTimeout(()=>renderApp(),0));
renderApp();
})();