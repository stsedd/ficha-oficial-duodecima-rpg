import {chromium} from 'playwright';
import {randomBytes} from 'node:crypto';
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173/';
const fixture={schemaVersion:24,isCreated:true,name:'Importação E2E',player:'QA',level:2,godId:'iuppiter',baseAttributes:{for:1,des:1,con:1,int:1,fe:1,car:1},inventory:{items:[]},familiars:{entries:[]},history:{summary:'Importado e verificado'},weapons:[],talents:[],conditions:[]};
const original={...fixture,name:'Personagem original'};
const failures=[];
async function run(mode){
 const context=await browser.newContext();
 await context.addInitScript(({seed})=>{
   if(!localStorage.getItem('duodecima_universal_stage4_v24'))localStorage.setItem('duodecima_universal_stage4_v24',JSON.stringify(seed));
 },{seed:original});
 await context.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='duodecima_universal_stage4_v24'){try{console.log('TRACE main setItem name='+JSON.parse(v).name+' caller='+new Error().stack.split('\\n').slice(2,4).join(' | '))}catch(_){}}return original.call(this,k,v)}});
 const page=await context.newPage();
 page.on('pageerror',e=>failures.push(mode+': pageerror '+e.message));
 page.on('console',msg=>{if(msg.type()==='error'||msg.text().startsWith('TRACE'))console.log('browser:',msg.text())});
 page.on('dialog',async d=>{console.log('browser dialog:',d.message());await d.accept()});
 try{
   await page.goto(base,{waitUntil:'networkidle',timeout:60000});
   await page.waitForFunction(()=>!!window.DUODECIMA_SAFE_IMPORT_READY,{timeout:20000});
   console.log(mode,'ready, keys:',await page.evaluate(()=>({active:window.DUODECIMA_CHARACTER_MANAGER?.activeStorageKey?.(),hasBackup:!!window.DUODECIMA_BACKUP_API,trigger:!!document.querySelector('#importJsonBtn')})));
   const archive=page.locator('.unified-menu').filter({has:page.locator('summary[aria-label="Abrir menu Arquivo"]')});
   await archive.locator('summary').click();
   const trigger=page.locator('#importJsonBtn');
   await trigger.waitFor({state:'visible',timeout:5000});
   const [chooser]=await Promise.all([page.waitForEvent('filechooser',{timeout:8000}),trigger.click()]);
   await chooser.setFiles({name:'import-e2e.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
   await page.locator('#duodecimaSafeImportDialog').waitFor({state:'visible',timeout:9000});
   console.log(mode,'dialog visible, backup ready:',await page.evaluate(()=>!!window.DUODECIMA_BACKUP_API));
   if(mode==='replace'){
     await page.waitForFunction(()=>!!window.DUODECIMA_BACKUP_API,null,{timeout:30000}).catch(e=>console.warn('BACKUP NEVER READY',e.message));
     console.log('replace readiness:',await page.evaluate(()=>({backup:!!window.DUODECIMA_BACKUP_API,activeKey:window.DUODECIMA_BACKUP_API?.activeStorageKey,saveStatus:window.DUODECIMA_STORAGE_PERSISTENT,loaded:!!document.querySelector('.rail-vitals')})));
   }
   await Promise.all([
     page.waitForEvent('load',{timeout:15000}),
     page.locator('[data-safe-import="'+mode+'"]').click()
   ]);
   const state=await page.evaluate(()=>({
     registry:JSON.parse(localStorage.getItem('duodecima_character_registry_v1')||'null'),
     main:JSON.parse(localStorage.getItem('duodecima_universal_stage4_v24')||'null')
   }));
   console.log(mode,'result',{active:state.registry?.active,characters:state.registry?.characters?.length,name:state.main?.name});
   if(mode==='new'&&!(state.registry?.characters?.length>=2&&state.registry.active!=='legacy'))throw Error('new character not activated');
   if(mode==='new'){
     const key='duodecima_character_v1_'+state.registry.active;
     const imported=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),key);
     if(imported?.name!==fixture.name)throw Error('new sheet data missing');
     if(state.main?.name!==original.name)throw Error('original overwritten');
   }else if(state.main?.name!==fixture.name)throw Error('replace did not update original');
 }catch(e){failures.push(mode+': '+e.stack);console.error(mode,'FAILED',e)}
 await context.close();
}
await run('new');
await run('replace');

async function probeLarge(){
 const context=await browser.newContext({acceptDownloads:true});
 const page=await context.newPage();
 page.on('pageerror',e=>failures.push('large: pageerror '+e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 const archive=page.locator('.unified-menu').filter({has:page.locator('summary[aria-label="Abrir menu Arquivo"]')});
 await archive.locator('summary').click();
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#importJsonBtn').click()]);
 const heavy={...fixture,name:'Importação Grande',extraPayload:randomBytes(4300000).toString('base64')};
 const bytes=Buffer.byteLength(JSON.stringify(heavy));
 await chooser.setFiles({name:'import-large.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(heavy))});
 await page.locator('#duodecimaSafeImportDialog').waitFor({state:'visible',timeout:15000});
 await Promise.all([page.waitForEvent('load',{timeout:30000}),page.locator('[data-safe-import="new"]').click()]);
 const saved=await page.evaluate(async()=>{
   const registry=JSON.parse(localStorage.getItem('duodecima_character_registry_v1')||'null');
   const key=window.DUODECIMA_CHARACTER_MANAGER.activeStorageKey();
   const db=await window.DUODECIMA_LARGE_SHEETS.get(key);
   return {registry,dbName:db?.name,payloadLength:db?.extraPayload?.length,key};
 });
 console.log('LARGE IMPORT PROBE',{bytes,name:saved.dbName,payloadLength:saved.payloadLength,active:saved.registry?.active});
 if(saved.dbName!=='Importação Grande'||saved.payloadLength!==heavy.extraPayload.length)throw Error('Large JSON not preserved in IndexedDB');
 console.log('LARGE UI CHECK',await page.evaluate(()=>({sheet:document.querySelector('#sheetView')?.className,creation:document.querySelector('#creationView')?.className,appReady:!!window.DUODECIMA_BACKUP_API,nameInput:!!document.querySelector('#nameInput')})));
 await page.locator('#nameInput').fill('Importação Grande Editada');
 await page.evaluate(async()=>{if(window.DUODECIMA_SAVE_PENDING)await window.DUODECIMA_SAVE_PENDING});
 await page.reload({waitUntil:'networkidle'});
 const edited=await page.evaluate(async()=>{
  const key=window.DUODECIMA_CHARACTER_MANAGER.activeStorageKey();
  return (await window.DUODECIMA_LARGE_SHEETS.get(key))?.name;
 });
 if(edited!=='Importação Grande Editada')throw Error('Large-sheet edits did not persist after reload: '+edited);
 await archive.locator('summary').click();
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#exportBtn').click()]);
 const json=JSON.parse((await import('node:fs/promises')).readFile?await (await import('node:fs/promises')).readFile(await download.path(),'utf8'):'{}');
 if(json.name!==edited||json.extraPayload?.length!==heavy.extraPayload.length)throw Error('Large JSON export was incomplete');
 console.log('LARGE IMPORT EDIT EXPORT SUCCESS',json.name,json.extraPayload.length);
 await context.close();
}
await probeLarge();

await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('IMPORT E2E SUCCESS');
