import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173/';
const fixture={schemaVersion:24,isCreated:true,name:'Importação E2E',player:'QA',level:2,godId:'iuppiter',baseAttributes:{for:1,des:1,con:1,int:1,fe:1,car:1},inventory:{items:[]},familiars:{entries:[]},history:{summary:'Importado e verificado'},weapons:[],talents:[],conditions:[]};
const original={...fixture,name:'Personagem original'};
const failures=[];
async function run(mode){
 const context=await browser.newContext();
 await context.addInitScript(({seed})=>{
   localStorage.setItem('duodecima_universal_stage4_v24',JSON.stringify(seed));
 },{seed:original});
 const page=await context.newPage();
 page.on('pageerror',e=>failures.push(mode+': pageerror '+e.message));
 page.on('console',msg=>{if(msg.type()==='error')console.log('console error:',msg.text())});
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
   console.log(mode,'dialog visible');
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
await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('IMPORT E2E SUCCESS');
