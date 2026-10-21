(()=>{'use strict';

const cfg=window.SCUTUM_CONFIG||{};
const ready=cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const VIEW_KEY='scutum_view_mode';
const inviteFromUrl=(new URLSearchParams(location.search).get('join')||'').trim().toUpperCase();

let mode='login';
let client=null;
let profile=null;
let currentUser=null;
let myCharacters=[];
let inviteHandled=false;
let appUserId=null;
let appBooting=false;

if(inviteFromUrl)sessionStorage.setItem('scutum_pending_invite',inviteFromUrl);

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(m){
  const t=$('#toast'); if(!t)return;
  t.textContent=m;t.classList.remove('hidden');
  clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2800);
}
function setMode(v){
  mode=v;
  $$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===v));
  $('#authSubmit').textContent=v==='login'?'Entrar':'Criar conta';
  $('#password').autocomplete=v==='login'?'current-password':'new-password';
  $('#authHint').textContent='';
}
function isPreviewPlayer(){
  return profile?.role==='admin'&&sessionStorage.getItem(VIEW_KEY)==='player';
}
function effectiveRole(){
  return isPreviewPlayer()?'player':(profile?.role||'player');
}
function roleLabel(role){
  return role==='admin'?'ADMINISTRADOR':role==='master'?'MESTRE':'JOGADOR';
}
function roomCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map(v=>chars[v%chars.length]).join('');
}
function openDialog(d){if(typeof d?.showModal==='function')d.showModal();else d?.setAttribute('open','')}

$$('[data-auth-tab]').forEach(b=>b.onclick=()=>setMode(b.dataset.authTab));

function card(c){
  const portrait=c.portrait_url||'';
  const god=c.origin_type==='mortal'?'Mortal da Névoa':(c.god_id||'—');
  const hp=c.current_hp==null?'—':c.current_hp;
  const en=c.current_energy==null?'—':c.current_energy;
  const san=c.current_sanity==null?'—':c.current_sanity;
  return '<article class="character-card">'+
    '<div class="char-cover">'+(portrait?'<img src="'+esc(portrait)+'" alt="">':'')+'</div>'+
    '<div class="char-copy"><h3>'+esc(c.name||'Sem nome')+'</h3><p>'+esc(god)+' · Nv '+Number(c.level||1)+'</p>'+
    '<div class="vitals"><div><span>HP</span><b>'+hp+(hp==='—'?'':'/'+(c.max_hp??'?'))+'</b></div>'+
    '<div><span>EN</span><b>'+en+(en==='—'?'':'/'+(c.max_energy??'?'))+'</b></div>'+
    '<div><span>SAN</span><b>'+san+'</b></div></div>'+
    '<div class="char-actions"><button class="primary" data-open="'+c.id+'">Abrir ficha</button><button data-delete="'+c.id+'">Arquivar</button></div></div>'+
  '</article>';
}
function bindCards(){
  $$('[data-open]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.open));
  $$('[data-delete]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Arquivar esta ficha?'))return;
    const {error}=await client.from('characters').update({archived:true}).eq('id',b.dataset.delete);
    if(error)return toast(error.message);
    await loadCharacters();
  });
}
async function loadCharacters(){
  const {data,error}=await client.from('characters')
    .select('id,name,level,origin_type,god_id,portrait_url,current_hp,max_hp,current_energy,max_energy,current_sanity,conditions,exhaustion,updated_at')
    .eq('owner_id',currentUser.id).eq('archived',false).order('updated_at',{ascending:false});
  if(error){toast(error.message);return}
  myCharacters=data||[];
  $('#characterCount').textContent=myCharacters.length;
  $('#firstRun')?.classList.toggle('hidden',myCharacters.length>0);
  $('#characterGrid').innerHTML=myCharacters.length
    ?myCharacters.map(card).join('')
    :'<div class="empty compact-empty">Quando você criar ou importar a primeira ficha, ela aparece aqui.</div>';
  bindCards();
}
function roomCard(r,count){
  const creator=r.created_by===currentUser.id;
  const role=effectiveRole();
  const label=role==='admin'
    ?(creator?'SUA MESA':'MESA DO SISTEMA')
    :role==='master'
      ?(creator?'SUA MESA':'SALA')
      :'SALA';
  return '<article class="room-card"><div><p class="eyebrow">'+label+'</p><h3>'+esc(r.name)+'</h3>'+
    '<p><span class="room-code">'+esc(r.code)+'</span> · '+count+' participante'+(count===1?'':'s')+'</p></div>'+
    '<button class="primary" data-open-room="'+r.id+'">Abrir sala</button></article>';
}
async function membershipRoomIds(){
  const {data,error}=await client.from('room_members').select('room_id').eq('user_id',currentUser.id);
  if(error)return new Set();
  return new Set((data||[]).map(x=>x.room_id));
}
async function loadRooms(){
  const role=effectiveRole();
  const {data,error}=await client.from('rooms')
    .select('id,name,code,status,created_by,created_at,ended_at')
    .eq('status','active').order('created_at',{ascending:false});
  if(error){toast('Não foi possível carregar as salas: '+error.message);return}

  let rooms=data||[];
  if(isPreviewPlayer()){
    const allowed=await membershipRoomIds();
    rooms=rooms.filter(r=>allowed.has(r.id));
  }

  const ids=rooms.map(r=>r.id);
  const counts={};
  if(ids.length){
    const {data:members}=await client.from('room_members').select('room_id').in('room_id',ids);
    for(const m of members||[])counts[m.room_id]=(counts[m.room_id]||0)+1;
  }
  $('#roomCount').textContent=rooms.length;
  $('#roomsGrid').innerHTML=rooms.length
    ?rooms.map(r=>roomCard(r,counts[r.id]||0)).join('')
    :'<div class="empty room-empty">'+(role==='player'?'Você ainda não entrou em nenhuma sala ativa. Use um código do mestre.':'Nenhuma sala ativa.')+'</div>';
  $$('[data-open-room]').forEach(b=>b.onclick=()=>location.href='room.html?id='+encodeURIComponent(b.dataset.openRoom));
}
async function loadEndedRooms(){
  const section=$('#endedRoomsSection');
  if(effectiveRole()==='player'){
    section.classList.add('hidden');
    return;
  }
  const {data,error}=await client.from('rooms')
    .select('id,name,code,status,created_by,created_at,ended_at')
    .eq('status','ended').order('ended_at',{ascending:false}).limit(30);
  if(error){section.classList.add('hidden');return}
  const rooms=data||[];
  const ids=rooms.map(r=>r.id);
  const counts={};
  if(ids.length){
    const {data:members}=await client.from('room_members').select('room_id').in('room_id',ids);
    for(const m of members||[])counts[m.room_id]=(counts[m.room_id]||0)+1;
  }
  section.classList.toggle('hidden',!rooms.length);
  $('#endedRoomCount').textContent=rooms.length;
  $('#endedRoomsGrid').innerHTML=rooms.map(r=>roomCard(r,counts[r.id]||0)).join('');
  $('#endedRoomsGrid').querySelectorAll('[data-open-room]').forEach(b=>b.onclick=()=>location.href='room.html?id='+encodeURIComponent(b.dataset.openRoom));
}
function renderSessionActions(){
  const role=profile?.role||'player';
  const preview=isPreviewPlayer();
  $('#sessionActions').innerHTML=
    '<span class="session-role '+role+'">'+(preview?'VISÃO: JOGADOR':roleLabel(role))+'</span>'+
    (role==='admin'?'<button id="previewToggle">'+(preview?'Voltar ao admin':'Ver como jogador')+'</button>':'')+
    '<button id="logout">Sair</button>';
  $('#logout').onclick=()=>client.auth.signOut();
  const previewBtn=$('#previewToggle');
  if(previewBtn)previewBtn.onclick=()=>{
    if(preview)sessionStorage.removeItem(VIEW_KEY);
    else sessionStorage.setItem(VIEW_KEY,'player');
    location.reload();
  };
}
function renderRoleState(){
  const role=effectiveRole();
  $('#roleBadge').textContent=isPreviewPlayer()?'VISÃO DE JOGADOR':roleLabel(role);
  $('#roleBadge').className='role-badge '+role+(isPreviewPlayer()?' preview':'');
  $('#createRoomBtn').classList.toggle('hidden',!(role==='master'||role==='admin'));
  $('#roomsHelp').textContent=role==='admin'
    ?'Como administrador, você enxerga todas as mesas. Use “Ver como jogador” para testar a experiência comum.'
    :role==='master'
      ?'Você pode criar e administrar suas próprias mesas e entrar em outras com um código.'
      :'Entre em uma sala usando o código enviado pelo mestre.';
  $('#roleDescription').textContent=isPreviewPlayer()
    ?'Modo de teste local: esta janela se comporta visualmente como jogador. A outra janela pode continuar como admin.'
    :role==='admin'
      ?'Você tem acesso administrativo geral ao SCUTUM.'
      :role==='master'
        ?'Você pode criar mesas e conduzir as salas que pertencem a você.'
        :'Suas fichas ficam ligadas somente à sua conta.';
}

async function renderAdmin(){
  const panel=$('#adminPanel');
  if(profile?.role!=='admin'||isPreviewPlayer()){panel.classList.add('hidden');return}
  panel.classList.remove('hidden');

  const [profilesRes,grantsRes,roomsRes,membersRes,charsRes]=await Promise.all([
    client.from('profiles').select('id,display_name,email,role,created_at').order('created_at'),
    client.from('role_grants').select('email,role,created_at').order('created_at'),
    client.from('rooms').select('id,name,code,status,created_by,created_at,ended_at').order('created_at',{ascending:false}).limit(100),
    client.from('room_members').select('room_id'),
    client.from('characters').select('id,owner_id').eq('archived',false)
  ]);

  if(profilesRes.error||grantsRes.error||roomsRes.error){
    toast('Não foi possível carregar toda a administração.');
    return;
  }

  const profiles=profilesRes.data||[];
  const grants=grantsRes.data||[];
  const rooms=roomsRes.data||[];
  const memberCounts={};
  for(const m of membersRes.data||[])memberCounts[m.room_id]=(memberCounts[m.room_id]||0)+1;
  const profileById=new Map(profiles.map(p=>[p.id,p]));

  $('#adminStats').innerHTML=
    '<div><span>Contas</span><b>'+profiles.length+'</b></div>'+
    '<div><span>Mestres</span><b>'+profiles.filter(p=>p.role==='master').length+'</b></div>'+
    '<div><span>Admins</span><b>'+profiles.filter(p=>p.role==='admin').length+'</b></div>'+
    '<div><span>Mesas</span><b>'+rooms.length+'</b></div>'+
    '<div><span>Fichas</span><b>'+((charsRes.data||[]).length)+'</b></div>';

  const registeredEmails=new Set(profiles.map(p=>String(p.email||'').toLowerCase()).filter(Boolean));
  const pending=grants.filter(g=>!registeredEmails.has(String(g.email||'').toLowerCase()));

  $('#adminUsers').innerHTML=
    profiles.map(p=>'<div class="admin-row role-row"><div><b>'+esc(p.display_name||'Sem nome')+'</b><small>'+esc(p.email||'sem e-mail')+'</small></div><span class="role-pill '+p.role+'">'+roleLabel(p.role)+'</span></div>').join('')+
    pending.map(g=>'<div class="admin-row role-row pending"><div><b>'+esc(g.email)+'</b><small>Permissão reservada para quando a conta for criada</small></div><span class="role-pill '+g.role+'">'+roleLabel(g.role)+'</span></div>').join('')+
    (!profiles.length&&!pending.length?'<p class="empty">Nenhuma conta.</p>':'');

  $('#adminRooms').innerHTML=rooms.length?rooms.map(r=>{
    const owner=profileById.get(r.created_by);
    const who=owner?.display_name||owner?.email||'Conta removida';
    return '<div class="admin-row room-admin-row"><div><b>'+esc(r.name)+'</b><small>'+esc(who)+' · '+esc(r.code)+' · '+(memberCounts[r.id]||0)+' participantes · '+(r.status==='active'?'ativa':'encerrada')+'</small></div><button data-admin-room="'+r.id+'">Abrir</button></div>';
  }).join(''):'<p class="empty">Nenhuma mesa criada.</p>';

  $$('[data-admin-room]').forEach(b=>b.onclick=()=>location.href='room.html?id='+encodeURIComponent(b.dataset.adminRoom));
}
async function grantRole(email,role){
  email=String(email||'').trim().toLowerCase();
  if(!email)return;
  if(!['player','master','admin'].includes(role))return toast('Permissão inválida.');

  const {data:target,error:targetError}=await client.from('profiles').select('id,email,role').ilike('email',email).maybeSingle();
  if(targetError)return toast(targetError.message);
  if(target?.id===currentUser.id&&role!=='admin')return toast('Por segurança, você não pode remover seu próprio acesso de administrador por aqui.');

  if(role==='player'){
    const {error:grantError}=await client.from('role_grants').delete().eq('email',email);
    if(grantError)return toast(grantError.message);
  }else{
    const {error:grantError}=await client.from('role_grants').upsert({email,role,granted_by:currentUser.id},{onConflict:'email'});
    if(grantError)return toast(grantError.message);
  }

  if(target){
    const {error:updateError}=await client.from('profiles').update({role}).eq('id',target.id);
    if(updateError)return toast(updateError.message);
    toast('Permissão atualizada.');
  }else{
    toast(role==='player'?'Não há uma conta cadastrada com esse e-mail.':'E-mail liberado. A permissão será aplicada quando a conta for criada.');
  }
  $('#roleEmail').value='';
  await renderAdmin();
}

async function bootApp(user){
  if(appBooting)return;
  if(appUserId===user.id&&!$('#appView').classList.contains('hidden'))return;
  appBooting=true;
  try{
    currentUser=user;
    appUserId=user.id;
    $('#bootView')?.classList.add('hidden');

    const {data:p,error:pError}=await client.from('profiles').select('id,display_name,email,role').eq('id',user.id).maybeSingle();
    if(pError)throw pError;
    profile=p||{id:user.id,email:user.email,role:'player'};

    $('#authView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    $('#welcome').textContent='Meus personagens';
    renderSessionActions();
    renderRoleState();

    await loadCharacters();
    await Promise.all([loadRooms(),loadEndedRooms()]);
    await renderAdmin();

    if(!inviteHandled){
      const invite=(inviteFromUrl||sessionStorage.getItem('scutum_pending_invite')||'').trim().toUpperCase();
      if(invite){
        inviteHandled=true;
        if(myCharacters.length){
          $('#joinRoomCode').value=invite;
          $('#joinCharacter').innerHTML=myCharacters.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · Nv '+Number(c.level||1)+'</option>').join('');
          openDialog($('#joinRoomDialog'));
        }else{
          sessionStorage.setItem('scutum_pending_invite',invite);
          toast('Crie ou importe uma ficha; o convite continuará guardado nesta aba.');
        }
      }
    }
  }catch(err){
    console.error('[SCUTUM] boot',err);
    toast('Não foi possível carregar o arquivo: '+(err.message||err));
  }finally{
    appBooting=false;
  }
}

async function importCharacterFile(f){
  if(!f)return;
  try{
    const d=JSON.parse(await f.text());
    const {data,error}=await client.from('characters').insert({
      owner_id:currentUser.id,
      name:d.name||'Personagem importada',
      level:Number(d.level||1),
      origin_type:d.originType==='mortal'?'mortal':'divine',
      god_id:d.godId||null,
      current_hp:d.currentHp,
      max_hp:null,
      current_energy:d.currentEnergy,
      max_energy:null,
      current_sanity:d.currentSanity??100,
      conditions:d.conditions||[],
      exhaustion:d.exhaustion||0,
      portrait_url:d.history?.portraitUrl||null,
      sheet_data:d
    }).select().single();
    if(error)throw error;
    toast('Ficha importada.');
    location.href='sheet.html?character='+data.id;
  }catch(err){toast('Não foi possível importar: '+err.message)}
}

$('#newCharacter').onclick=async()=>{
  const blank={schemaVersion:24,isCreated:false,name:'',player:'',level:1,godId:'iuppiter'};
  const {data,error}=await client.from('characters').insert({
    owner_id:currentUser.id,name:'Nova personagem',level:1,origin_type:'divine',god_id:'iuppiter',sheet_data:blank
  }).select().single();
  if(error)return toast(error.message);
  location.href='sheet.html?character='+data.id;
};
$('#importCharacter').onchange=e=>importCharacterFile(e.target.files?.[0]);
$('#firstRunImport')?.addEventListener('change',e=>importCharacterFile(e.target.files?.[0]));
$('#firstRunNew')?.addEventListener('click',()=>$('#newCharacter').click());

$('#createRoomBtn').onclick=()=>{
  $('#roomName').value='';
  openDialog($('#createRoomDialog'));
  setTimeout(()=>$('#roomName').focus(),30);
};
$('#joinRoomBtn').onclick=()=>{
  if(!myCharacters.length)return toast('Você precisa ter ao menos uma ficha antes de entrar em uma sala.');
  $('#joinRoomCode').value='';
  $('#joinCharacter').innerHTML=myCharacters.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · Nv '+Number(c.level||1)+'</option>').join('');
  openDialog($('#joinRoomDialog'));
  setTimeout(()=>$('#joinRoomCode').focus(),30);
};

$('#createRoomForm').onsubmit=async e=>{
  e.preventDefault();
  if(!['master','admin'].includes(effectiveRole()))return toast('Somente mestres e administradores podem criar mesas.');
  const name=$('#roomName').value.trim();
  if(!name)return;
  const btn=$('#createRoomSubmit');btn.disabled=true;
  try{
    let created=null,lastError=null;
    for(let i=0;i<5&&!created;i++){
      const {data,error}=await client.from('rooms').insert({name,code:roomCode(),created_by:currentUser.id}).select().single();
      if(error){lastError=error;if(error.code!=='23505')break}else created=data;
    }
    if(!created)throw lastError||new Error('Não foi possível criar a sala.');
    $('#createRoomDialog').close();
    location.href='room.html?id='+encodeURIComponent(created.id);
  }catch(err){toast(err.message)}finally{btn.disabled=false}
};

$('#joinRoomForm').onsubmit=async e=>{
  e.preventDefault();
  const code=$('#joinRoomCode').value.trim().toUpperCase();
  const characterId=$('#joinCharacter').value;
  if(!code||!characterId)return;
  const btn=$('#joinRoomSubmit');btn.disabled=true;
  try{
    const {data:found,error:findError}=await client.rpc('find_room_by_code',{p_code:code});
    if(findError)throw findError;
    const room=found?.[0];
    if(!room)throw new Error('Não encontrei uma sala ativa com esse código.');

    const {data:existing}=await client.from('room_members').select('room_id,character_id').eq('room_id',room.id).eq('user_id',currentUser.id).maybeSingle();
    if(!existing){
      const {error}=await client.from('room_members').insert({room_id:room.id,user_id:currentUser.id,character_id:characterId,role:'player'});
      if(error)throw error;
      const chosen=myCharacters.find(c=>c.id===characterId);
      await client.from('room_events').insert({
        room_id:room.id,actor_id:currentUser.id,event_type:'member_join',
        message:(chosen?.name||'Uma personagem')+' entrou na sala.'
      });
    }
    sessionStorage.removeItem('scutum_pending_invite');
    $('#joinRoomDialog').close();
    location.href='room.html?id='+encodeURIComponent(room.id);
  }catch(err){toast(err.message)}finally{btn.disabled=false}
};

$('#roleGrantForm').onsubmit=async e=>{
  e.preventDefault();
  if(profile?.role!=='admin'||isPreviewPlayer())return toast('Apenas administradores podem alterar permissões.');
  const btn=$('#roleGrantSubmit');btn.disabled=true;
  try{await grantRole($('#roleEmail').value,$('#roleGrantRole').value)}
  finally{btn.disabled=false}
};
$('#refreshAdminBtn').onclick=renderAdmin;

function showAuth(){
  appUserId=null;currentUser=null;profile=null;myCharacters=[];
  $('#bootView')?.classList.add('hidden');
  $('#authView').classList.remove('hidden');
  $('#appView').classList.add('hidden');
  $('#sessionActions').innerHTML='';
}

$('#authForm').onsubmit=async e=>{
  e.preventDefault();
  if(!ready)return toast('Backend do Lab ainda não foi conectado.');
  const submit=$('#authSubmit');
  if(submit.disabled)return;
  const email=$('#email').value.trim(),password=$('#password').value;
  submit.disabled=true;submit.textContent=mode==='login'?'Entrando…':'Criando…';
  $('#authHint').textContent='';
  try{
    const r=mode==='login'
      ?await client.auth.signInWithPassword({email,password})
      :await client.auth.signUp({email,password});
    if(r.error){
      const msg=String(r.error.message||'');
      if(/email rate limit exceeded|over_email_send_rate_limit/i.test(msg)){ $('#authHint').textContent='O serviço de e-mail atingiu o limite temporário.';return}
      if(mode==='signup'&&(/database error saving new user/i.test(msg)||/already registered|already exists|duplicate/i.test(msg))){$('#authHint').innerHTML='Essa conta já existe. Use <b>Entrar</b>.';return}
      if(mode==='login'&&/invalid login credentials/i.test(msg)){ $('#authHint').textContent='E-mail ou senha incorretos.';return}
      if(mode==='login'&&/email not confirmed/i.test(msg)){ $('#authHint').textContent='Seu cadastro ainda depende de confirmação de e-mail.';return}
      $('#authHint').textContent=msg||'Não foi possível continuar.';return;
    }
    if(mode==='signup'&&!r.data.session){$('#authHint').textContent='Cadastro criado. Confirme o e-mail para continuar.';return}
    if(r.data.user)await bootApp(r.data.user);
  }finally{
    submit.disabled=false;
    submit.textContent=mode==='login'?'Entrar':'Criar conta';
  }
};

if(!ready){
  $('#bootView')?.classList.add('hidden');
  $('#authView').classList.remove('hidden');
  $('#authHint').textContent='Interface pronta. Falta conectar o projeto Supabase.';
  return;
}

client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);

client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){showAuth();return}
  if(event==='SIGNED_IN'&&session?.user&&session.user.id!==appUserId){
    setTimeout(()=>bootApp(session.user),0);
  }
});

(async()=>{
  const {data:{session}}=await client.auth.getSession();
  if(session?.user)await bootApp(session.user);
  else showAuth();
})();

})();