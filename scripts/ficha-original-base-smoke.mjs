import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
for(const profile of [{name:'desktop',width:1440,height:960},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
  const page=await context.newPage();
  page.on('pageerror',error=>failures.push(profile.name+': '+error.message));
  try{
    await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForSelector('#sheetView:not(.hidden) [data-pane="status"]',{state:'attached',timeout:30000});
    const checks=await page.evaluate(()=>{
      const v=document.querySelector('#sheetView');
      const main=JSON.parse(localStorage.getItem('duodecima_preview_original_base_v1')||'null');
      return {created:!!main?.isCreated,name:main?.name,
        looksOriginal:!!document.querySelector('.character-rail')&&!document.body.classList.contains('duo-roll20-minimal')&&!document.querySelector('.am-shell'),
        baseHasData:!!localStorage.getItem('duodecima_universal_stage4_v24'),
        separateRegistry:!!localStorage.getItem('duodecima_preview_original_registry_v1'),
        skillCount:v.querySelectorAll('[data-pane="status"] [data-skill-manual]').length,
        powerCount:v.querySelectorAll('[data-pane="combat"] .ability-card').length,
        tabs:!!v.querySelector('[data-tab="status"]')&&!!v.querySelector('[data-tab="combat"]'),
        overflow:document.documentElement.scrollWidth>window.innerWidth+4};
    });
    console.log('ORIGINAL_BASE '+profile.name+' '+JSON.stringify(checks));
    if(!checks.created||checks.name!=='Personagem de Teste'||!checks.looksOriginal||checks.baseHasData||!checks.separateRegistry||checks.skillCount<20||checks.powerCount<2||!checks.tabs||checks.overflow){
      failures.push(profile.name+': '+JSON.stringify(checks));
    }
    await page.screenshot({path:'ui-artifacts/ficha-original-'+profile.name+'.png',fullPage:false});
  }catch(e){failures.push(profile.name+': '+(e.stack||e.message))}
  await context.close();
}
await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('✅ Base original aprovada, com dados isolados e visual da main.');
