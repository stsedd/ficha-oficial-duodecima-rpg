/* Armazenamento de fichas grandes: IndexedDB, sem limites pequenos do localStorage. */
(function(){
'use strict';
const DB='duodecima_character_large_v1',STORE='sheets';
let opening=null;
function open(){
 if(opening)return opening;
 opening=new Promise((resolve,reject)=>{
   if(!window.indexedDB){reject(new Error('Este navegador não disponibiliza IndexedDB.'));return}
   const request=indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
   request.onerror=()=>reject(request.error||new Error('Falha ao abrir armazenamento de fichas grandes.'));
   request.onsuccess=()=>resolve(request.result);
 }).catch(err=>{opening=null;throw err});
 return opening;
}
async function run(mode,key,data){
 const db=await open();
 return new Promise((resolve,reject)=>{
  let tx;
  try{
    tx=db.transaction(STORE,mode);
    const store=tx.objectStore(STORE);
    const req=mode==='readonly'?store.get(key):data===undefined?store.delete(key):store.put(data,key);
    let value;
    req.onsuccess=()=>{value=req.result};
    tx.oncomplete=()=>resolve(mode==='readonly'?value||null:true);
    tx.onabort=()=>reject(tx.error||new Error('Gravação da ficha interrompida.'));
    tx.onerror=()=>reject(tx.error||new Error('Erro de armazenamento da ficha.'));
  }catch(err){reject(err)}
 });
}
window.DUODECIMA_LARGE_SHEETS={
  get:key=>run('readonly',key),
  put:(key,data)=>run('readwrite',key,data),
  remove:key=>run('readwrite',key,undefined),
  isQuotaError:err=>err?.name==='QuotaExceededError'||err?.code===22||err?.code===1014
};
})();
