(() => {
  'use strict';
  const STORAGE_KEY='duodecima_universal_stage4_v24';
  const RECOVERY_KEY='duodecima_import_recovery_v1';
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
  function currentSheet(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(_){return null}}
  function backupBeforeImport(){const current=currentSheet();if(!current)return;try{localStorage.setItem(RECOVERY_KEY,JSON.stringify({savedAt:new Date().toISOString(),state:current}))}catch(_){}}
  function validateSheet(data){
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Este JSON não parece ser uma ficha da Duodécima.');
    const version=Number(data.schemaVersion);
    if(!Number.isFinite(version)||version<1||version>24)throw new Error(`Versão de ficha incompatível (${data.schemaVersion??'sem versão'}).`);
    return data;
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
  async function importTheme(file){const raw=await parseJsonFile(file),theme=validateTheme(raw);try{await Promise.race([storeTheme(theme),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),2500))])}catch(_){fallbackStoreTheme(theme)}const sheet=currentSheet();if(sheet){sheet.appearance=sheet.appearance||{};sheet.appearance.exclusiveThemeId=theme.id;sheet.appearance.special='none';localStorage.setItem(STORAGE_KEY,JSON.stringify(sheet))}toast(`Tema exclusivo ${theme.name} instalado. Recarregando…`);setTimeout(()=>location.reload(),250)}
  function install(){
    const exp=q('exportBtn'),imp=q('importInput'),theme=q('exclusiveThemeInput');
    if(exp&&!exp.dataset.ioRecovery){exp.dataset.ioRecovery='1';exp.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const data=currentSheet();if(!data){toast('Não encontrei uma ficha local para exportar.');return}downloadJson(data,`duodecima-${safeName(data.name)}.json`);toast('Ficha exportada.')},true)}
    if(imp&&!imp.dataset.ioRecovery){imp.dataset.ioRecovery='1';imp.addEventListener('change',async e=>{e.stopImmediatePropagation();const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const data=validateSheet(await parseJsonFile(file));backupBeforeImport();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));toast('Ficha importada. Recarregando…');setTimeout(()=>location.reload(),250)}catch(err){console.warn('[Duodecima IO] import',err);toast(err?.message||'Não foi possível importar este JSON.')}},true)}
    if(theme&&!theme.dataset.ioRecovery){theme.dataset.ioRecovery='1';theme.addEventListener('change',async e=>{e.stopImmediatePropagation();const file=e.target.files?.[0];e.target.value='';if(!file)return;try{await importTheme(file)}catch(err){console.warn('[Duodecima IO] theme',err);toast(err?.message||'Não foi possível instalar este tema exclusivo.')}},true)}
  }
  install();
  const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',install);
})();