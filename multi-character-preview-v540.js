/* Duodécima v5.23 — seletor de personagens locais. */
(function(){
'use strict';
const MAIN='duodecima_roll20_minimal_v540_demo', META='duodecima_roll20_minimal_v540_registry', PREFIX='duodecima_roll20_minimal_v540_character_';
let store;try{store=window.localStorage;const probe='__multi_probe';store.setItem(probe,'1');store.removeItem(probe)}catch(e){return}
function read(k){try{return JSON.parse(store.getItem(k)||'null')}catch(e){return null}}
function write(k,v){store.setItem(k,JSON.stringify(v))}
function registry(){const r=read(META);const base=r&&Array.isArray(r.characters)&&r.characters.length?r:{active:'legacy',characters:[{id:'legacy',name:'Personagem original'}]};return {...base,trash:Array.isArray(base.trash)?base.trash:[]}}
function key(id){return id==='legacy'?MAIN:PREFIX+id}
function sheet(id){return read(key(id))}
function label(id){const s=sheet(id);return String(s?.name||'').trim()|| (id==='legacy'?'Personagem original':'Novo personagem')}
function makeId(){return (window.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2))}
function ensure(){let r=registry();if(!r.characters.some(c=>c.id===r.active))r.active='legacy';if(!store.getItem(META)){const raw=store.getItem(MAIN);if(raw){try{store.setItem(MAIN+'_before_multichar_v1',raw)}catch(e){}}write(META,r)}return r}
function current(){return registry().active}
function change(id){const r=registry();if(!r.characters.some(c=>c.id===id))return;r.active=id;write(META,r);window.location.reload()}
function add(copy){const r=registry();const id=makeId();if(copy){const data=store.getItem(key(r.active));if(data){try{store.setItem(key(id),data)}catch(e){alert('Não há espaço suficiente para duplicar esta ficha. Exporte o JSON antes de continuar.');return}}}r.characters.push({id,name:copy?label(r.active)+' (cópia)':'Novo personagem'});r.active=id;try{write(META,r)}catch(e){alert('Não foi possível criar a ficha neste navegador.');return}window.location.reload()}
function importAsNew(data){
 const r=registry(),id=makeId(),storageKey=key(id),name=String(data?.name||'').trim()||'Personagem importado';
 let stored=false;
 try{
   // Grava a ficha ANTES de ativá-la. Se o registro falhar, não troca a personagem atual.
   store.setItem(storageKey,JSON.stringify(data));stored=true;
   const next={...r,characters:[...r.characters,{id,name}],active:id};
   write(META,next);
   window.location.reload();
   return true;
 }catch(err){
   if(stored)try{store.removeItem(storageKey)}catch(_){}
   console.error('[Duodecima] Não foi possível importar como novo personagem.',err);
   return false;
 }
}
window.DUODECIMA_CHARACTER_MANAGER={
 activeStorageKey:()=>key(current()),
 importAsNew
};
function del(){
 const r=registry();
 if(r.characters.length===1){alert('É necessário manter pelo menos um personagem.');return}
 const id=r.active;
 if(id==='legacy'){alert('Para proteger a ficha original, ela não pode ser excluída. Você pode mudar para outra ficha.');return}
 const name=label(id);
 if(!confirm('Mover “'+name+'” para a lixeira? A ficha e seus backups serão preservados para recuperação.'))return;
 // Exclusão reversível: nunca remove a chave da ficha nem seus backups do navegador.
 const next={...r,characters:r.characters.filter(c=>c.id!==id),trash:[...r.trash.filter(t=>t.id!==id),{id,name,deletedAt:new Date().toISOString()}],active:r.characters.find(c=>c.id!==id).id};
 try{write(META,next);window.location.reload()}
 catch(e){console.error('[Duodecima] Falha ao arquivar personagem',e);alert('Não foi possível mover a ficha para a lixeira. Seus dados continuam intactos.')}
}
function restoreTrashed(id){
 const r=registry(),old=r.trash.find(x=>x.id===id);
 if(!old)return false;
 if(r.characters.some(x=>x.id===id)){alert('Este personagem já está na lista principal.');return false}
 // Se os dados não existem, não oferece falsa recuperação.
 if(!store.getItem(key(id))){alert('Não encontrei os dados desta ficha neste navegador. Nenhuma alteração foi realizada.');return false}
 const next={...r,characters:[...r.characters,{id,name:old.name||label(id)}],trash:r.trash.filter(x=>x.id!==id),active:id};
 try{write(META,next);window.location.reload();return true}
 catch(e){console.error('[Duodecima] Falha ao restaurar personagem',e);alert('Não foi possível restaurar a ficha. Tente novamente depois.');return false}
}
function trashDialog(){
 let dialog=document.getElementById('duoTrashDialog');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='duoTrashDialog';dialog.className='theme-dialog duo-trash-dialog';
  const content=document.createElement('div');content.className='theme-dialog-card duo-trash-card';
  const head=document.createElement('div');head.className='row between';
  const copy=document.createElement('div'),title=document.createElement('h2'),eyebrow=document.createElement('p'),hint=document.createElement('p');
  eyebrow.className='eyebrow';eyebrow.textContent='SEGURANÇA';
  title.textContent='Lixeira de personagens';
  hint.className='muted compact';hint.textContent='As fichas removidas ficam preservadas neste navegador, junto dos backups. Nada é apagado automaticamente.';
  copy.append(eyebrow,title,hint);
  const close=document.createElement('button');close.type='button';close.className='theme-dialog-close';close.textContent='×';close.setAttribute('aria-label','Fechar lixeira');close.onclick=()=>dialog.close();
  head.append(copy,close);
  const list=document.createElement('div');list.id='duoTrashList';list.className='duo-trash-list';
  content.append(head,list);dialog.append(content);document.body.append(dialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  list.addEventListener('click',e=>{const button=e.target.closest?.('[data-restore-trash]');if(button)restoreTrashed(button.dataset.restoreTrash)});
 }
 const list=dialog.querySelector('#duoTrashList');list.replaceChildren();
 const trash=registry().trash;
 if(!trash.length){const empty=document.createElement('p');empty.className='muted compact';empty.textContent='A lixeira está vazia.';list.append(empty)}
 for(const entry of [...trash].reverse()){
  const row=document.createElement('div');row.className='duo-trash-entry';
  const info=document.createElement('div'),name=document.createElement('strong'),date=document.createElement('small'),restore=document.createElement('button');
  name.textContent=entry.name||'Personagem';date.textContent='Movido em '+(entry.deletedAt?new Date(entry.deletedAt).toLocaleDateString('pt-BR'):'data desconhecida');
  info.append(name,date);restore.type='button';restore.className='primary';restore.dataset.restoreTrash=entry.id;restore.textContent='Restaurar ficha';
  row.append(info,restore);list.append(row);
 }
 if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
}
function download(){const data=store.getItem(key(current()));if(!data){alert('Esta ficha ainda não contém dados salvos.');return}const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='duodecima-'+label(current()).replace(/[^a-z0-9-]+/gi,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function init(){
const r=ensure(),parent=document.querySelector('.archive-brandbar')||document.querySelector('.archive-toolbar');if(!parent)return;
const box=document.createElement('div');box.className='multi-character-bar';box.innerHTML='<label for="duoCharacterSelect">PERSONAGEM</label><select id="duoCharacterSelect" aria-label="Selecionar personagem"></select><button type="button" data-multi="new" title="Criar nova ficha">+ Nova</button><details class="multi-character-actions"><summary aria-label="Mais opções de personagem" title="Mais opções">•••</summary><div class="multi-character-menu"><button type="button" data-multi="copy">Duplicar ficha</button><button type="button" data-multi="export">Exportar JSON</button><button type="button" data-multi="trash">Lixeira</button><button type="button" data-multi="delete">Mover para lixeira</button></div></details>';
const appearance=parent.querySelector('.appearance-top-actions');if(appearance)parent.insertBefore(box,appearance);else parent.appendChild(box);
const select=box.querySelector('select');r.characters.forEach(c=>{const opt=document.createElement('option');opt.value=c.id;opt.textContent=label(c.id);select.appendChild(opt)});select.value=r.active;
select.onchange=()=>change(select.value);
box.querySelector('[data-multi="new"]').onclick=()=>add(false);
box.querySelector('[data-multi="copy"]').onclick=()=>add(true);
box.querySelector('[data-multi="export"]').onclick=download;
box.querySelector('[data-multi="delete"]').onclick=del;
box.querySelector('[data-multi="trash"]').onclick=()=>{box.querySelector('.multi-character-actions').open=false;trashDialog()};
const count=r.trash.length;if(count){box.querySelector('[data-multi="trash"]').textContent='Lixeira · '+count}
}
ensure();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.DUODECIMA_CHARACTER_STORAGE_KEY=key(current());
})();