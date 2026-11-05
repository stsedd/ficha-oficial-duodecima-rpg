import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const problems=[];
const sample=[
  {name:'desktop',width:1440,height:960},
  {name:'tablet',width:980,height:850},
  {name:'mobile',width:390,height:844}
];
try{
 for(const profile of sample){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>problems.push(profile.name+' JS: '+(e.stack||e.message)));
  try{
   await page.goto('http://127.0.0.1:4173/roll20-minimal.html',{waitUntil:'networkidle',timeout:60000});
   await page.waitForSelector('#sheetView:not(.hidden) .r20-character-header',{state:'visible',timeout:25000});
   await page.waitForSelector('#sheetView [data-pane="status"] .skill-ledger-group',{state:'attached',timeout:10000});
   const status=await page.evaluate(()=>{
    const rect=sel=>{let r=document.querySelector(sel)?.getBoundingClientRect();return r?{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}:null};
    const visible=el=>!!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    return {
      body:document.body.className,
      tabs:[...document.querySelectorAll('#sheetView [data-tab]')].filter(visible).map(el=>el.textContent.trim()),
      resources:document.querySelectorAll('[data-pane="status"] .status-core-strip > .core-stat').length,
      attrs:document.querySelectorAll('[data-pane="status"] .vertical-attrs .attr').length,
      skills:document.querySelectorAll('[data-pane="status"] .skill-ledger-row').length,
      groups:document.querySelectorAll('[data-pane="status"] .skill-ledger-group').length,
      trainedButtons:document.querySelectorAll('[data-pane="status"] [data-skill-manual]').length,
      expertButtons:document.querySelectorAll('[data-pane="status"] [data-skill-expertise]').length,
      grid:rect('[data-pane="status"] .overview-grid'),
      attrsBox:rect('[data-pane="status"] .attribute-sidebar'),
      skillsBox:rect('[data-pane="status"] .skills-ledger-card'),
      screen:window.innerWidth,scroll:document.documentElement.scrollWidth,
      profileClosed:!document.querySelector('.r20-profile-popup').open,
      profileRailVisible:visible(document.querySelector('.r20-profile-popup .character-rail')),
      statusChildren:[...document.querySelector('[data-pane="status"]').children].map(x=>({tag:x.tagName,cls:x.className,txt:x.textContent.slice(0,55)})),
      rowBoxes:[...document.querySelectorAll('[data-pane="status"] .skill-ledger-row .skill-row-main:first-child > *')].slice(0,4).map(x=>({cls:x.className,position:getComputedStyle(x).position,x:Math.round(x.getBoundingClientRect().x),w:Math.round(x.getBoundingClientRect().width)}))
    };
   });
   if(status.attrs!==6||status.groups!==6||status.skills<20)problems.push(profile.name+' main missing attribute/skills: '+JSON.stringify(status));
   if(status.trainedButtons!==status.skills||status.expertButtons!==status.skills)problems.push(profile.name+' P/E missing');
   if(status.tabs.length!==2)problems.push(profile.name+' wrong number tabs '+JSON.stringify(status.tabs));
   if(status.profileRailVisible)problems.push(profile.name+' profile shown while collapsed');
   if(status.scroll>profile.width+3)problems.push(profile.name+' main horizontal overflow '+JSON.stringify(status));
   await page.screenshot({path:'ui-artifacts/minimal-main-'+profile.name+'.png',fullPage:false});
   if(profile.name==='desktop'){
     const jpg=await page.screenshot({type:'jpeg',quality:40,fullPage:false});
     console.log('MINIMAL_MAIN_JPEG:'+jpg.toString('base64'));
   }
   await page.locator('[data-tab="combat"]').click();
   await page.waitForSelector('[data-pane="combat"] .r20-power-board',{state:'visible',timeout:15000});
   const powers=await page.evaluate(()=>{
     const pane=document.querySelector('[data-pane="combat"]');
     const visible=el=>!!(el&&el.getClientRects().length);
     return {
       count:pane.querySelectorAll('.r20-power-row').length,
       filters:pane.querySelectorAll('.r20-filter').length,
       panelTitle:pane.querySelector('.r20-power-detail-top h3')?.textContent,
       selectedCards:pane.querySelectorAll('.r20-power-detail-content .ability-card').length,
       originalControls:pane.querySelectorAll('.r20-power-detail-content .ability-deck-toggle').length,
       stash:pane.querySelectorAll('.r20-powers-stash .ability-card').length,
       screen:pane.dataset.r20PowerScreen,
       listVisible:visible(pane.querySelector('.r20-power-list')),
       detailVisible:visible(pane.querySelector('.r20-power-detail')),
       deckButton:pane.querySelector('.r20-power-detail .ability-deck-toggle')?(()=>{const e=pane.querySelector('.r20-power-detail .ability-deck-toggle'),r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),position:getComputedStyle(e).position}})():null
     };
   });
   if(powers.count<3||powers.filters!==4||powers.selectedCards!==1||!powers.originalControls)problems.push(profile.name+' powers missing: '+JSON.stringify(powers));
   await page.locator('.r20-filter[data-filter="active"]').click();
   const activeRows=page.locator('.r20-power-row');
   if(await activeRows.count()<1)problems.push(profile.name+' no active powers');
   await page.locator('.r20-filter[data-filter="all"]').click();
   const firstName=await page.locator('.r20-power-row-copy strong').first().textContent();
   await page.locator('.r20-power-search').fill(firstName||'');
   if(await page.locator('.r20-power-row').count()!==1)problems.push(profile.name+' skill search not narrowing');
   await page.locator('.r20-power-search').fill('');
   await page.locator('.r20-power-row').nth(1).click();
   if(!(await page.locator('.r20-power-detail-content .ability-card').isVisible()))problems.push(profile.name+' power select did not reveal real card');
   if(profile.name==='mobile'){
     if(!(await page.locator('.r20-power-detail').isVisible()))problems.push(profile.name+' power details not visible');
     await page.locator('.r20-power-back').click();
     if(!(await page.locator('.r20-power-list').isVisible()))problems.push(profile.name+' mobile back broken');
   }
   await page.screenshot({path:'ui-artifacts/minimal-powers-'+profile.name+'.png',fullPage:false});
   if(profile.name==='desktop'){
     const jpg=await page.screenshot({type:'jpeg',quality:40,fullPage:false});
     console.log('MINIMAL_POWERS_JPEG:'+jpg.toString('base64'));
   }
   console.log('MINIMAL_V540 '+profile.name+' '+JSON.stringify({status,powers}));
  }catch(err){problems.push(profile.name+': '+(err.stack||err.message))}
  await ctx.close();
 }
}finally{await browser.close()}
if(problems.length){
 console.error('Falhas na prévia mínima:\n'+problems.join('\n'));
 process.exit(1);
}
console.log('✅ Ficha principal e Poderes: testes desktop, tablet e mobile aprovados.');
