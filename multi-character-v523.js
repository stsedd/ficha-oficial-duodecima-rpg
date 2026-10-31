/* Duodécima v5.23 — seletor de personagens locais. */
(function(){
'use strict';
const MAIN='duodecima_universal_stage4_v24', META='duodecima_character_registry_v1', PREFIX='duodecima_character_v1_';
let store;try{store=window.localStorage;const probe='__multi_probe';store.setItem(probe,'1');store.removeItem(probe)}catch(e){return}
function read(k){try{return JSON.parse(store.getItem(k)||'null')}catch(e){return null}}
function write(k,v){store.setItem(k,JSON.stringify(v))}
function registry(){const r=read(META);return r&&Array.isArray(r.characters)&&r.characters.length?r:{active:'legacy',characters:[{id:'legacy',name:'Personagem original'}]}}
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
function del(){const r=registry();if(r.characters.length===1){alert('É necessário manter pelo menos um personagem.');return}const id=r.active;if(!confirm('Excluir '+label(id)+' da lista local? Exporte o JSON antes: a exclusão não pode ser desfeita.'))return;if(id==='legacy'){alert('Para proteger a ficha original, ela não pode ser excluída. Você pode mudar para outra ficha.');return}r.characters=r.characters.filter(c=>c.id!==id);r.active=r.characters[0].id;write(META,r);store.removeItem(key(id));window.location.reload()}
function download(){const data=store.getItem(key(current()));if(!data){alert('Esta ficha ainda não contém dados salvos.');return}const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='duodecima-'+label(current()).replace(/[^a-z0-9-]+/gi,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function init(){
const r=ensure(),parent=document.querySelector('.archive-brandbar')||document.querySelector('.archive-toolbar');if(!parent)return;
const box=document.createElement('div');box.className='multi-character-bar';box.innerHTML='<label for="duoCharacterSelect">PERSONAGEM</label><select id="duoCharacterSelect" aria-label="Selecionar personagem"></select><button type="button" data-multi="new" title="Criar nova ficha">+ Nova</button><details class="multi-character-actions"><summary aria-label="Mais opções de personagem" title="Mais opções">•••</summary><div class="multi-character-menu"><button type="button" data-multi="copy">Duplicar ficha</button><button type="button" data-multi="export">Exportar JSON</button><button type="button" data-multi="delete">Excluir ficha</button></div></details>';
const appearance=parent.querySelector('.appearance-top-actions');if(appearance)parent.insertBefore(box,appearance);else parent.appendChild(box);
const select=box.querySelector('select');r.characters.forEach(c=>{const opt=document.createElement('option');opt.value=c.id;opt.textContent=label(c.id);select.appendChild(opt)});select.value=r.active;
select.onchange=()=>change(select.value);
box.querySelector('[data-multi="new"]').onclick=()=>add(false);
box.querySelector('[data-multi="copy"]').onclick=()=>add(true);
box.querySelector('[data-multi="export"]').onclick=download;
box.querySelector('[data-multi="delete"]').onclick=del;
}
ensure();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.DUODECIMA_CHARACTER_STORAGE_KEY=key(current());
})();