(()=>{'use strict';const cfg=window.SCUTUM_CONFIG||{},ready=cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase;const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2600)};let mode='login',client=null,session=null,profile=null,adminChannel=null;
function setMode(v){mode=v;$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===v));$('#authSubmit').textContent=v==='login'?'Entrar':'Criar conta';$('#password').autocomplete=v==='login'?'current-password':'new-password';$('#authHint').textContent=''}
$$('[data-auth-tab]').forEach(b=>b.onclick=()=>setMode(b.dataset.authTab));
function summary(d={}){const hp=Number(d.currentHp??0),en=d.currentEnergy==null?'—':Number(d.currentEnergy),san=Number(d.currentSanity??100);return {hp,en,san,conditions:Array.isArray(d.conditions)?d.conditions:[],exhaustion:Number(d.exhaustion||0)}}
function card(c){const d=c.sheet_data||{},s=summary(d),portrait=d.history?.portraitUrl||'',god=c.origin_type==='mortal'?'Mortal da Névoa':(c.god_id||'—');return '<article class="character-card"><div class="char-cover">'+(portrait?'<img src="'+portrait+'" alt="">':'')+'</div><div class="char-copy"><h3>'+escapeHtml(c.name||'Sem nome')+'</h3><p>'+escapeHtml(god)+' · Nv '+Number(c.level||1)+'</p><div class="vitals"><div><span>HP</span><b>'+s.hp+'/'+Number(c.max_hp||'?')+'</b></div><div><span>EN</span><b>'+s.en+(s.en==='—'?'':'/'+Number(c.max_energy||'?'))+'</b></div><div><span>SAN</span><b>'+s.san+'</b></div></div><div class="char-actions"><button class="primary" data-open="'+c.id+'">Abrir ficha</button><button data-delete="'+c.id+'">Arquivar</button></div></div></article>'}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
async function renderApp(){const {data:{user}}=await client.auth.getUser();if(!user)return showAuth();$('#bootView')?.classList.add('hidden');const {data:p}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();profile=p;$('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#sessionActions').innerHTML='<button id="logout">Sair</button>';$('#logout').onclick=()=>client.auth.signOut();$('#welcome').textContent='Meus personagens';const {data:chars,error}=await client.from('characters').select('*').eq('owner_id',user.id).eq('archived',false).order('updated_at',{ascending:false});if(error){toast(error.message);return}$('#characterCount').textContent=chars.length;$('#firstRun')?.classList.toggle('hidden',chars.length>0);$('#characterGrid').innerHTML=chars.length?chars.map(card).join(''):'<div class="empty compact-empty">Quando você importar a primeira ficha, ela aparece aqui.</div>';bindCards();if(p?.role==='admin')await renderAdmin()}
async function renderAdmin(){$('#adminPanel').classList.remove('hidden');if(!adminChannel){adminChannel=client.channel('admin-character-watch').on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>renderAdmin()).subscribe();}const {data}=await client.from('characters').select('id,name,level,current_hp,max_hp,current_energy,max_energy,current_sanity,conditions,exhaustion,updated_at').eq('archived',false).order('updated_at',{ascending:false});$('#adminCharacters').innerHTML=(data||[]).map(c=>'<div class="admin-row"><div><b>'+escapeHtml(c.name)+'</b><small><br>HP '+(c.current_hp??'—')+'/'+(c.max_hp??'—')+' · EN '+(c.current_energy??'—')+'/'+(c.max_energy??'—')+' · SAN '+(c.current_sanity??'—')+(c.conditions?.length?' · '+c.conditions.join(', '):'')+'</small></div><button data-admin-open="'+c.id+'">Ver</button></div>').join('')||'<p class="empty">Nenhuma ficha.</p>';$$('[data-admin-open]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.adminOpen))}
function bindCards(){$$('[data-open]').forEach(b=>b.onclick=()=>location.href='sheet.html?character='+encodeURIComponent(b.dataset.open));$$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Arquivar esta ficha?'))return;await client.from('characters').update({archived:true}).eq('id',b.dataset.delete);renderApp()})}
$('#newCharacter').onclick=async()=>{const {data:{user}}=await client.auth.getUser();const blank={schemaVersion:24,isCreated:false,name:'',player:'',level:1,godId:'iuppiter'};const {data,error}=await client.from('characters').insert({owner_id:user.id,name:'Nova personagem',level:1,origin_type:'divine',god_id:'iuppiter',sheet_data:blank}).select().single();if(error)return toast(error.message);location.href='sheet.html?character='+data.id};
const importCharacterFile=async f=>{if(!f)return;try{const d=JSON.parse(await f.text()),{data:{user}}=await client.auth.getUser();const {data,error}=await client.from('characters').insert({owner_id:user.id,name:d.name||'Personagem importada',level:Number(d.level||1),origin_type:d.originType==='mortal'?'mortal':'divine',god_id:d.godId||null,current_hp:d.currentHp,max_hp:null,current_energy:d.currentEnergy,max_energy:null,current_sanity:d.currentSanity??100,conditions:d.conditions||[],exhaustion:d.exhaustion||0,sheet_data:d}).select().single();if(error)throw error;toast('Ficha importada.');location.href='sheet.html?character='+data.id}catch(err){toast('Não foi possível importar: '+err.message)}};
$('#importCharacter').onchange=e=>importCharacterFile(e.target.files?.[0]);
const firstImport=$('#firstRunImport');if(firstImport)firstImport.onchange=e=>importCharacterFile(e.target.files?.[0]);
const firstNew=$('#firstRunNew');if(firstNew)firstNew.onclick=()=>$('#newCharacter').click();
function showAuth(){$('#bootView')?.classList.add('hidden');$('#authView').classList.remove('hidden');$('#appView').classList.add('hidden');$('#sessionActions').innerHTML=''}
$('#authForm').onsubmit=async e=>{
  e.preventDefault();if(!ready)return toast('Backend do Lab ainda não foi conectado.');
  const submit=$('#authSubmit');if(submit.disabled)return;
  const email=$('#email').value.trim(),password=$('#password').value;
  submit.disabled=true;submit.setAttribute('aria-busy','true');submit.textContent=mode==='login'?'Entrando…':'Criando…';$('#authHint').textContent='';
  try{
    const r=mode==='login'
      ?await client.auth.signInWithPassword({email,password})
      :await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
    if(r.error){
      const msg=String(r.error.message||'');
      if(mode==='signup'&&(/database error saving new user/i.test(msg)||/already registered|already exists|duplicate/i.test(msg))){
        $('#authHint').innerHTML='Essa conta já foi criada. <b>Confira o e-mail de confirmação</b> ou mude para “Entrar”.';
        return;
      }
      if(mode==='login'&&/email not confirmed/i.test(msg)){
        $('#authHint').innerHTML='Seu cadastro existe, mas o e-mail ainda não foi confirmado. <b>Confira sua caixa de entrada e spam.</b>';
        return;
      }
      $('#authHint').textContent=msg||'Não foi possível continuar.';
      return;
    }
    if(mode==='signup'&&!r.data.session){
      $('#authHint').innerHTML='<b>Conta criada.</b> Enviamos um e-mail de confirmação. Depois de confirmar, volte aqui e use “Entrar”.';
      return;
    }
    renderApp();
  }finally{
    submit.disabled=false;submit.removeAttribute('aria-busy');submit.textContent=mode==='login'?'Entrar':'Criar conta';
  }
};
if(!ready){$('#bootView')?.classList.add('hidden');$('#authView').classList.remove('hidden');$('#authHint').textContent='Interface pronta. Falta conectar o projeto Supabase.';return}client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);client.auth.onAuthStateChange(()=>setTimeout(()=>renderApp(),0));renderApp()})();