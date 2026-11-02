/* Duodécima v5.36 · diagnóstico local, sem acesso a dados de outros personagens */
(() => {
 'use strict';
 const key=window.DUODECIMA_CHARACTER_STORAGE_KEY||'duodecima_universal_stage4_v24';
 let last=null,dialog=null,queued=false;
 const text=id=>document.getElementById(id);
 const raw=()=>{try{return window.localStorage.getItem(key)}catch(_){return null}};
 const lastSaved=()=>{try{return JSON.parse(raw()||'null')?.updatedAt||null}catch(_){return null}};
 const persistent=()=>window.DUODECIMA_STORAGE_PERSISTENT!==false;
 const date=iso=>{
  const d=new Date(iso||'');
  return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Ainda não registrado';
 };
 const size=bytes=>bytes>=1048576?(bytes/1048576).toFixed(2)+' MB':bytes>=1024?(bytes/1024).toFixed(1)+' KB':bytes+' bytes';
 function foot(){
  let el=text('duoSaveHealth');
  if(el)return el;
  const footer=document.querySelector('footer');if(!footer)return null;
  el=document.createElement('small');el.id='duoSaveHealth';el.className='duo-save-health';
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  footer.appendChild(el);return el;
 }
 function stateText(){
  if(last?.status==='error')return '⚠ Falha ao salvar — exporte seu JSON';
  if(!persistent()||last?.status==='temporary')return '⚠ Dados temporários — exporte seu JSON';
  const when=last?.at||lastSaved();
  return when?'✓ Salvo · '+date(when):'Nenhum salvamento registrado';
 }
 function update(){
  queued=false;
  const el=foot();if(!el)return;
  const status=last?.status||(!persistent()?'temporary':'saved');
  el.dataset.status=status;
  const next=stateText();if(el.textContent!==next)el.textContent=next;
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(update)}
 function set(id,value){const el=text(id);if(el)el.textContent=value}
 function getDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='duoDiagnosticsDialog';dialog.className='theme-dialog duo-diagnostics-dialog';
  dialog.innerHTML=[
   '<div class="theme-dialog-card duo-diagnostics-card">',
   '<div class="row between theme-dialog-head"><div><p class="eyebrow">INTEGRIDADE</p><h2>Diagnóstico da ficha</h2><p class="muted compact">Somente leitura — não altera a ficha.</p></div><button type="button" class="theme-dialog-close" data-duo-diag-close aria-label="Fechar">×</button></div>',
   '<dl class="duo-diagnostics-grid">',
   '<div><dt>Salvamento</dt><dd id="duoDiagStatus">Conferindo...</dd></div>',
   '<div><dt>Último registro</dt><dd id="duoDiagUpdated">Conferindo...</dd></div>',
   '<div><dt>Tamanho do JSON</dt><dd id="duoDiagStorage">Conferindo...</dd></div>',
   '<div><dt>Backups do personagem</dt><dd id="duoDiagBackups">Conferindo...</dd></div>',
   '<div><dt>Core carregado</dt><dd id="duoDiagCore">Conferindo...</dd></div>',
   '</dl>',
   '<p class="muted compact duo-diagnostics-note">Dados e backups ficam neste navegador, sem sincronização na nuvem. Exporte JSON para manter uma cópia externa. O tamanho exibido não inclui os backups nem o cache.</p>',
   '<div class="duo-diagnostics-actions"><button type="button" class="ghost" data-duo-diag-refresh>Atualizar informações</button><button type="button" class="primary" data-duo-diag-close>Concluir</button></div>',
   '</div>'
  ].join('');
  document.body.appendChild(dialog);
  dialog.addEventListener('click',event=>{
   if(event.target===dialog||event.target.closest?.('[data-duo-diag-close]'))dialog.close();
   if(event.target.closest?.('[data-duo-diag-refresh]'))refresh();
  });
  return dialog;
 }
 async function refresh(){
  const value=raw(),isSaved=persistent(),status=last?.status;
  set('duoDiagStatus',status==='error'?'Falha de gravação':!isSaved||status==='temporary'?'Temporário (sem persistência garantida)':value?'Salvamento local ativo':'Ainda sem JSON local');
  set('duoDiagUpdated',date(last?.at||lastSaved()));
  set('duoDiagStorage',value?size(new Blob([value]).size):'Não disponível');
  set('duoDiagCore',String(window.DUODECIMA_CORE_STATE?.version||'Não identificado'));
  set('duoDiagBackups','Conferindo...');
  const api=window.DUODECIMA_BACKUP_API;
  if(api?.activeStorageKey!==key||typeof api.stats!=='function'){
   set('duoDiagBackups','Ficha ainda carregando');return;
  }
  try{
   const info=await api.stats();
   if(!dialog?.open)return;
   set('duoDiagBackups',info.total+' no total · '+info.automatic+' automáticos · '+info.protected+' protegidos');
  }catch(_){set('duoDiagBackups','Consulta indisponível')}
 }
 function init(){
  const menu=document.querySelector('.multi-character-menu');
  if(menu&&!menu.querySelector('[data-multi="diagnostics"]')){
   const btn=document.createElement('button');btn.type='button';btn.dataset.multi='diagnostics';btn.textContent='Diagnóstico';
   const anchor=menu.querySelector('[data-multi="trash"]');
   if(anchor)anchor.before(btn);else menu.appendChild(btn);
   btn.addEventListener('click',()=>{
    document.querySelector('.multi-character-actions')?.removeAttribute('open');
    const el=getDialog();
    if(el.showModal)el.showModal();else el.setAttribute('open','');
    refresh();
   });
  }
  update();
  window.addEventListener('duodecima:save-status',event=>{
   if(event.detail?.storageKey!==key)return;
   last=event.detail;schedule();
   if(dialog?.open)refresh();
  });
  window.addEventListener('pageshow',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
