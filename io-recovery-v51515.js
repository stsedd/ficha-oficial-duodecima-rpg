(() => {
  'use strict';
  const STORAGE_KEY=window.DUODECIMA_CHARACTER_STORAGE_KEY||'duodecima_universal_stage4_v24';
  const activeStorageKey=()=>window.DUODECIMA_CHARACTER_MANAGER?.activeStorageKey?.()||window.DUODECIMA_CHARACTER_STORAGE_KEY||STORAGE_KEY;
  const RECOVERY_KEY='duodecima_import_recovery_v1_'+encodeURIComponent(STORAGE_KEY);
  const THEME_DB='duodecima_exclusive_themes_v1';
  const THEME_STORE='themes';
  const THEME_INDEX='duodecima_exclusive_theme_index_v1';
  const q=id=>document.getElementById(id);
  const toast=msg=>{
    const el=q('toast');
    if(!el){console.info('[Duodecima IO]',msg);return}
    el.textContent=msg;el.classList.remove('hidden');
    clearTimeout(window.__duodecimaIoToastTimer);
    window.__duodecimaIoToastTimer=setTimeout(()=>el.classList.add('hidden'),3200);
  };
  const parseJsonFile=file=>new Promise((resolve,reject)=>{
    const limit=window.DUODECIMA_IMPORT_MAX_BYTES_V536||32*1024*1024;
    if(Number(file?.size)>limit){reject(new Error('Arquivo maior que 32 MB. Exporte uma versão com imagens menores.'));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error||new Error('Falha ao ler arquivo'));
    reader.onload=()=>{try{resolve(JSON.parse(String(reader.result||'')))}catch(err){reject(new Error('O arquivo não contém um JSON válido.'))}};
    reader.readAsText(file);
  });
  const downloadJson=(data,name)=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  };
  function safeName(value){return String(value||'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'personagem'}
  async function currentSheet(){
    const key=activeStorageKey();
    try{
      const raw=localStorage.getItem(key);
      if(raw)return JSON.parse(raw);
      return await window.DUODECIMA_LARGE_SHEETS?.get(key)||null;
    }catch(err){console.warn('[Duodecima IO] Não foi possível ler a ficha.',err);return null}
  }
  async function backupBeforeImport(){
    const current=await currentSheet();if(!current)return;
    try{localStorage.setItem(RECOVERY_KEY,JSON.stringify({savedAt:new Date().toISOString(),storageKey:activeStorageKey(),state:current}))}catch(_){}
  }
  function validateSheet(data,file){
    if(typeof window.DUODECIMA_VALIDATE_SHEET_V536!=='function')throw new Error('Verificação de segurança indisponível. Recarregue a página antes de importar.');
    return window.DUODECIMA_VALIDATE_SHEET_V536(data,{byteSize:file?.size||0});
  }
  function normalizeThemeId(v=''){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}
  function assetOk(v){return typeof v==='string'&&/^data:(?:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml)|font\/(?:woff2?|ttf|otf)|application\/(?:font-woff|font-woff2|x-font-ttf|x-font-opentype));base64,[A-Za-z0-9+/=\s]+$/i.test(v)}
  function validateTheme(raw){
    if(!raw||typeof raw!=='object'||raw.format!=='duodecima-theme'||Number(raw.formatVersion)!==1)throw new Error('Formato de tema não reconhecido.');
    const id=normalizeThemeId(raw.id),name=String(raw.name||'').trim().slice(0,80),css=String(raw.css||'');
    if(!id||!name)throw new Error('O tema precisa de id e nome.');
    if(!css||css.length>1500000)throw new Error('CSS do tema ausente ou grande demais.');
    if(!css.includes('{{scope}}'))throw new Error('O CSS precisa usar {{scope}}.');
    if(/@import\b|javascript\s*:|expression\s*\(|behavior\s*:|url\s*\(\s*["']?\s*(?:https?:|\/\/)/i.test(css))throw new Error('O tema contém CSS externo não permitido.');
    const assets={};for(const [key,val] of Object.entries(raw.assets||{})){const k=String(key).trim().replace(/[^a-zA-Z0-9_.-]+/g,'-').slice(0,80);if(!k||!assetOk(val))throw new Error(`Asset inválido: ${key}`);assets[k]=String(val)}
    for(const token of css.matchAll(/\{\{asset:([^}]+)\}\}/g))if(!Object.prototype.hasOwnProperty.call(assets,token[1]))throw new Error(`Asset ausente: ${token[1]}`);
    return {format:'duodecima-theme',formatVersion:1,id,name,version:String(raw.version||'1.0.0').slice(0,30),author:String(raw.author||'').slice(0,80),description:String(raw.description||'').slice(0,240),icon:String(raw.icon||'✦').slice(0,4),preferredMode:raw.preferredMode==='light'?'light':'dark',css,assets,installedAt:new Date().toISOString()};
  }
  function storeTheme(theme){return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error('IndexedDB indisponível'));return}
    const req=indexedDB.open(THEME_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(THEME_STORE))req.result.createObjectStore(THEME_STORE,{keyPath:'id'})};
    req.onerror=()=>reject(req.error||new Error('Falha ao abrir armazenamento de temas'));
    req.onsuccess=()=>{const db=req.result;let tx;try{tx=db.transaction(THEME_STORE,'readwrite');tx.objectStore(THEME_STORE).put(theme)}catch(err){db.close();reject(err);return}tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{const err=tx.error;db.close();reject(err||new Error('Falha ao salvar tema'))};tx.onabort=tx.onerror};
  })}
  function fallbackStoreTheme(theme){localStorage.setItem(`duodecima_exclusive_theme_v1_${theme.id}`,JSON.stringify(theme));let ids=[];try{ids=JSON.parse(localStorage.getItem(THEME_INDEX)||'[]')}catch(_){}if(!Array.isArray(ids))ids=[];localStorage.setItem(THEME_INDEX,JSON.stringify([...new Set([...ids,theme.id])]))}
  async function importTheme(file){const raw=await parseJsonFile(file),theme=validateTheme(raw);try{await Promise.race([storeTheme(theme),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),2500))])}catch(_){fallbackStoreTheme(theme)}const sheet=await currentSheet();if(sheet){sheet.appearance=sheet.appearance||{};sheet.appearance.exclusiveThemeId=theme.id;sheet.appearance.special='none';const key=activeStorageKey();if(localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(sheet));else await window.DUODECIMA_LARGE_SHEETS.put(key,sheet)}toast(`Tema exclusivo ${theme.name} instalado. Recarregando…`);setTimeout(()=>location.reload(),250)}

  let importing=false;
  function ensureImportDialog(){
    let dialog=document.getElementById('duodecimaSafeImportDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='duodecimaSafeImportDialog';
    dialog.className='theme-dialog safe-import-dialog';
    dialog.innerHTML='<div class="theme-dialog-card safe-import-card"><p class="eyebrow">IMPORTAR FICHA</p><h2>Como deseja importar?</h2><p class="muted compact" id="safeImportFilename"></p><p class="muted compact">O arquivo foi verificado. Você pode criar uma ficha separada ou substituir apenas a selecionada; neste último caso, um backup será obrigatório.</p><div class="safe-import-actions"><button type="button" class="primary" data-safe-import="new">+ Criar novo personagem</button><button type="button" class="ghost" data-safe-import="replace">Substituir personagem atual</button><button type="button" class="ghost" data-safe-import="cancel">Cancelar</button></div></div>';
    document.body.appendChild(dialog);
    return dialog;
  }
  function chooseImportMode(file,data){
    const dialog=ensureImportDialog();
    dialog.querySelector('#safeImportFilename').textContent='Arquivo: '+(file.name||'ficha.json')+' · Personagem: '+String(data.name||'Sem nome')+' · Versão: '+String(data.schemaVersion)+' · Itens: '+String(data.inventory?.items?.length||0);
    return new Promise(resolve=>{
      let finished=false;
      function settle(value){
        if(finished)return;finished=true;
        dialog.removeEventListener('click',onClick);
        dialog.removeEventListener('cancel',onCancel);
        if(dialog.open)dialog.close();
        resolve(value);
      }
      function onClick(event){
        const action=event.target.closest?.('[data-safe-import]')?.dataset.safeImport;
        if(!action)return;
        settle(action==='new'||action==='replace'?action:null);
      }
      function onCancel(event){event.preventDefault();settle(null)}
      dialog.addEventListener('click',onClick);
      dialog.addEventListener('cancel',onCancel);
      try{if(typeof dialog.showModal==='function')dialog.showModal();else settle(null)}catch(err){console.warn('[Duodecima IO] Falha ao abrir diálogo de importação',err);settle(null);toast('Não foi possível abrir a confirmação. Feche outras janelas e tente novamente.')}
    });
  }
  async function handleImport(file){
    const data=validateSheet(await parseJsonFile(file),file);
    const choice=await chooseImportMode(file,data);
    if(!choice)return;
    if(choice==='new'){
      const manager=window.DUODECIMA_CHARACTER_MANAGER;
      if(!manager?.importAsNew)throw new Error('O seletor de personagens está indisponível. Recarregue a página.');
      if(!await manager.importAsNew(data))throw new Error('Não foi possível guardar a nova personagem. Verifique o armazenamento do navegador.');
      return;
    }
    let backups=window.DUODECIMA_BACKUP_API;
    // A importação pode estar pronta antes da ficha carregar. Não rejeitar uma
    // substituição enquanto o gerenciador de backups ainda inicializa.
    for(let i=0;i<40&&(!backups||backups.activeStorageKey!==activeStorageKey());i++){
      await new Promise(resolve=>setTimeout(resolve,250));
      backups=window.DUODECIMA_BACKUP_API;
    }
    if(!backups||backups.activeStorageKey!==activeStorageKey())throw new Error('Sistema de backup não inicializou. Nenhum dado foi alterado.');
    if(window.DUODECIMA_SAVE_PENDING)await window.DUODECIMA_SAVE_PENDING;
    const ok=await backups.create('Antes de substituir por JSON');
    if(!ok)throw new Error('Substituição cancelada: não foi possível criar um backup. Exporte a ficha atual primeiro.');
    await backupBeforeImport();
    const key=activeStorageKey();
    try{
      localStorage.setItem(key,JSON.stringify(data));
      if(window.DUODECIMA_LARGE_SHEETS)await window.DUODECIMA_LARGE_SHEETS.remove(key);
    }catch(err){
      if(!window.DUODECIMA_LARGE_SHEETS?.isQuotaError(err))throw err;
      await window.DUODECIMA_LARGE_SHEETS.put(key,data);
      localStorage.removeItem(key);
    }
    toast('Importação concluída nesta personagem. Recarregando…');
    setTimeout(()=>location.reload(),180);
  }

  function install(){
    const exp=q('exportBtn'),imp=q('importInput'),trigger=q('importJsonBtn'),theme=q('exclusiveThemeInput');
    if(trigger&&!trigger.dataset.ioImportTrigger){trigger.dataset.ioImportTrigger='1';trigger.addEventListener('click',()=>{const input=q('importInput');if(!input){toast('Seletor de arquivo indisponível. Atualize a página.');return}input.value='';input.click()})}
    if(exp&&!exp.dataset.ioRecovery){exp.dataset.ioRecovery='1';exp.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();try{if(window.DUODECIMA_SAVE_PENDING)await window.DUODECIMA_SAVE_PENDING;const data=await currentSheet();if(!data){toast('Não encontrei uma ficha local para exportar.');return}downloadJson(data,`duodecima-${safeName(data.name)}.json`);toast('Ficha exportada.')}catch(err){toast('Falha ao exportar: '+String(err?.message||err))}},true)}
    if(imp&&!imp.dataset.ioRecovery){imp.dataset.ioRecovery='1';window.DUODECIMA_SAFE_IMPORT_READY=true;imp.addEventListener('change',async e=>{e.preventDefault();e.stopImmediatePropagation();const file=e.target.files?.[0];e.target.value='';if(!file||importing)return;importing=true;window.DUODECIMA_IMPORT_DECISION_PENDING=true;try{toast('Verificando arquivo da ficha…');await handleImport(file)}catch(err){console.warn('[Duodecima IO] import',err);const message=err?.message||'Não foi possível importar este JSON.';toast(message);window.alert('Importação não concluída: '+message+'\n\nNenhuma ficha foi substituída.')}finally{window.DUODECIMA_IMPORT_DECISION_PENDING=false;importing=false}},true)}
    if(theme&&!theme.dataset.ioRecovery){theme.dataset.ioRecovery='1';theme.addEventListener('change',async e=>{e.stopImmediatePropagation();const file=e.target.files?.[0];e.target.value='';if(!file)return;try{await importTheme(file)}catch(err){console.warn('[Duodecima IO] theme',err);toast(err?.message||'Não foi possível instalar este tema exclusivo.')}},true)}
  }
  install();
  const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',install);
})();