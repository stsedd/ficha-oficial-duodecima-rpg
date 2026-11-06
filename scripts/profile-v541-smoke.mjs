import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.UI_BASE_URL||'http://127.0.0.1:4173/';
const out='ui-artifacts/profile-v541';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const banner='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="400"><rect width="1800" height="400" fill="#533b45"/><circle cx="900" cy="200" r="130" fill="#e3a5b7"/></svg>');
const portrait='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="#553d50"/><circle cx="400" cy="350" r="210" fill="#e3bdb2"/><circle cx="325" cy="330" r="20" fill="#241c27"/><circle cx="475" cy="330" r="20" fill="#241c27"/></svg>');
const cases=[['desktop',{width:1440,height:950}],['mobile',{width:390,height:844}]];
const failures=[];
for(const [name,viewport] of cases){
  const context=await browser.newContext({viewport});
  const seed={schemaVersion:24,isCreated:true,name:'Personagem de Teste',player:'QA',
    godId:'iuppiter',level:30,activeTab:'status',
    roma:{cohort:'I Coorte',legionRank:'',job:'',fameEntries:[{id:'qa1',amount:30,source:'Evento'}]},
    history:{epithet:'Prima Maxima',aliases:'Rosa de Roma',office:'Centuriã',
      age:'15',origin:'Florença',birth:'2011',residence:'Nazzano',
      portraitUrl:portrait,portraitSourceUrl:portrait,
      bannerUrl:banner,bannerSourceUrl:banner,
      bannerPositionX:50,bannerPositionY:50,bannerScale:100}};
  await context.addInitScript(s=>{const k='duodecima_universal_stage4_v24';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify(s))},seed);
  const page=await context.newPage();
  page.on('pageerror',e=>failures.push(name+': erro JS '+e.message));
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#sheetView:not(.hidden) .rail-identity h2',{state:'visible',timeout:30000});
  const facts=await page.evaluate(()=>{
    const r=e=>{if(!e)return null;const x=e.getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}};
    const cover=document.querySelector('#siteBanner'),avatar=document.querySelector('#sheetView .rail-portrait'),
      card=document.querySelector('#sheetView .character-rail'),
      level=document.querySelector('#sheetView .rail-orb-level'),
      bp=document.querySelector('#sheetView .rail-orb-bp');
    return {banner:r(cover),avatar:r(avatar),card:r(card),level:r(level),bp:r(bp),
      name:document.querySelector('.rail-identity h2')?.textContent,
      prole:document.querySelector('.rail-prole')?.textContent,
      epithet:document.querySelector('.rail-epithet')?.textContent,
      aliases:document.querySelector('.rail-aliases')?.textContent,
      cohort:document.querySelector('.rail-meta')?.textContent,
      deathVisible:[...document.querySelectorAll('.character-rail .rail-death')].some(e=>getComputedStyle(e).display!=='none'),
      vitalsVisible:[...document.querySelectorAll('.character-rail .rail-vitals')].some(e=>getComputedStyle(e).display!=='none'),
      bannerFit:getComputedStyle(document.querySelector('#siteBannerImage')).objectFit,
      viewport:window.innerWidth};
  });
  if(facts.name!=='Personagem de Teste')failures.push(name+': nome incorreto');
  if(!facts.prole?.startsWith('Prole de '))failures.push(name+': prole ausente');
  if(facts.epithet!=='Prima Maxima')failures.push(name+': epíteto não aparece');
  if(!facts.cohort?.includes('I Coorte')||!facts.cohort?.includes('Centuriã'))failures.push(name+': coorte ou cargo ausente');
  if(facts.deathVisible||facts.vitalsVisible)failures.push(name+': mecânicas aparecem no perfil');
  if(Math.abs(facts.banner.width/facts.banner.height-4.5)>.04||facts.bannerFit!=='contain')failures.push(name+': capa não preserva proporção/recorte');
  if(facts.avatar.width<160)failures.push(name+': retrato menor que 160px');
  if(Math.abs(facts.level.top-facts.bp.top)>2||facts.level.right>facts.viewport+2||facts.bp.right>facts.viewport+2)failures.push(name+': nivel/BP desalinhados ou cortados');
  if(facts.card.right>facts.viewport+2)failures.push(name+': cartão de perfil ultrapassa a tela');
  await page.screenshot({path:out+'/'+name+'-perfil.png',fullPage:false});
  await page.locator('#openCharacterProfile').click();
  await page.waitForSelector('#characterNameInput',{state:'visible'});
  const ep=page.locator('[data-pane="history"] [data-history="epithet"]');
  await ep.fill('A Indivisível');
  await ep.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.rail-epithet')?.textContent==='A Indivisível');
  await page.screenshot({path:out+'/'+name+'-personagem.png',fullPage:false});
  await page.locator('#characterPortraitCropBtn').click();
  await page.waitForSelector('#portraitCropDialog',{state:'visible'});
  await page.locator('#portraitCropZoom').evaluate(el=>{el.value='145';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#portraitCropSave').click();
  await page.waitForSelector('#portraitCropDialog',{state:'hidden'});
  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('duodecima_universal_stage4_v24')));
  if(storage?.history?.epithet!=='A Indivisível')failures.push(name+': epíteto não persistiu');
  if(!storage?.history?.portraitUrl?.startsWith('data:image/webp'))failures.push(name+': recorte do avatar não salvou em webp');
  if(!storage?.history?.portraitSourceUrl?.startsWith('data:image/svg+xml'))failures.push(name+': original do avatar foi perdido');
  if(storage?.history?.bannerSourceUrl!==banner)failures.push(name+': banner foi modificado');
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#sheetView:not(.hidden) .rail-identity h2',{state:'visible'});
  if((await page.locator('.rail-epithet').textContent())!=='A Indivisível')failures.push(name+': epíteto perdido após recarregar');
  await context.close();
}
await browser.close();
if(failures.length){console.error('Perfil v5.41: falhas:\n'+failures.map(s=>'- '+s).join('\n'));process.exitCode=1}
else console.log('Perfil v5.41: desktop e mobile, identidade, banner, grid, editor e persistência validados.');
