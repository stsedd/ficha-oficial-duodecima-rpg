import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const rows=[];
for(const viewport of [
  {name:'desktop',width:1440,height:920},
  {name:'tablet',width:1024,height:900},
  {name:'mobile',width:390,height:844}
]){
 const ctx=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>failures.push(viewport.name+' JS '+e.message));
 try{
  await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#sheetView:not(.hidden) .duo-social-profile .duo-profile-cover',{state:'visible',timeout:26000});
  await page.waitForSelector('#sheetView [data-pane="roma"] .duo-roma-rebento-controls',{state:'attached',timeout:26000});
  const data=await page.evaluate(()=>{
    const r=sel=>{const el=document.querySelector(sel),box=el?.getBoundingClientRect();return box?{x:+box.x.toFixed(1),y:+box.y.toFixed(1),w:+box.width.toFixed(1),h:+box.height.toFixed(1),display:getComputedStyle(el).display}:null};
    const pane=document.querySelector('#sheetView [data-pane="status"]');
    return {
      cover:r('.duo-social-profile .duo-profile-cover'),
      avatar:r('.duo-social-profile .rail-portrait'),
      name:r('.duo-social-profile .rail-identity h2'),
      orb:r('.duo-profile-orbs #levelOrbInput'),
      currentStatus:!pane.classList.contains('hidden'),
      skills:pane.querySelectorAll('.skill-ledger-row').length,
      trained:pane.querySelectorAll('[data-skill-manual]').length,
      expert:pane.querySelectorAll('[data-skill-expertise]').length,
      attributes:pane.querySelectorAll('.vertical-attrs .attr').length,
      legend:pane.querySelector('.duo-skill-legend')?.textContent,
      secondaryOpen:pane.querySelector('.duo-overview-secondary')?.open,
      lineageOpen:pane.querySelector('.duo-overview-lineage')?.open,
      hiddenResources:getComputedStyle(document.querySelector('.duo-social-profile > .rail-vitals')).display==='none',
      sourceRebento:getComputedStyle(document.querySelector('.duo-social-profile > .rebento-profile-control')).display,
      romaCopies:document.querySelectorAll('[data-pane="roma"] .duo-roma-rebento-controls').length,
      bodyOverflow:document.documentElement.scrollWidth>innerWidth+4,
      srcId:!!document.getElementById('siteBannerImage')
    };
  });
  rows.push({viewport:viewport.name,data});
  if(!data.cover||!data.avatar||!data.orb||!data.name)failures.push(viewport.name+' missing visible profile sections');
  if(data.cover&&data.avatar &&!(data.avatar.y<data.cover.y+data.cover.h&&data.avatar.y+data.avatar.h>data.cover.y+data.cover.h))
    failures.push(viewport.name+' avatar not overlapping bottom of cover');
  if(data.skills!==26||data.attributes!==6||data.trained!==26||data.expert!==26)failures.push(viewport.name+' attributes/perícias changed '+JSON.stringify(data));
  if(!data.legend||data.secondaryOpen!==false||data.lineageOpen!==false)failures.push(viewport.name+' secondary panels not arranged '+JSON.stringify(data));
  if(!data.hiddenResources)failures.push(viewport.name+' duplicate resources remain in profile while on status');
  if(data.romaCopies!==1||data.sourceRebento!=='none')failures.push(viewport.name+' rebento not moved to Roma');
  if(data.bodyOverflow)failures.push(viewport.name+' page horizontal overflow');
  await page.locator('.duo-overview-secondary > summary').click();
  const aux=page.locator('.duo-overview-secondary .talents-compact-card');
  if(!(await aux.isVisible()))failures.push(viewport.name+' talents not accessible after expansion');
  await page.locator('.duo-overview-secondary > summary').click();
  await page.locator('.duo-overview-lineage > summary').click();
  if(!(await page.locator('.duo-overview-lineage .lineage-config-visible').isVisible()))
    failures.push(viewport.name+' lineage configuration inaccessible');
  await page.locator('.duo-overview-lineage > summary').click();
  // Keep existing character editor and all inputs in their original DOM.
  const editor=page.locator('.duo-social-profile > .rail-editor');
  await editor.locator('summary').click();
  if(!(await editor.locator('#sheetNameInput').isVisible()))failures.push(viewport.name+' profile editor missing');
  await editor.locator('summary').click();
  // The cover is a view of the existing per-character banner, not another save format.
  await page.evaluate(()=>{
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 150"><rect width="600" height="150" fill="#7e1f37"/></svg>';
    document.getElementById('siteBannerImage').setAttribute('src','data:image/svg+xml,'+encodeURIComponent(svg));
  });
  await page.waitForFunction(()=>document.querySelector('.duo-profile-cover-image')?.getAttribute('src')?.includes('data:image/svg+xml'),{timeout:8000});
  const coverVisible=await page.locator('.duo-profile-cover-image').isVisible();
  if(!coverVisible)failures.push(viewport.name+' banner image not copied into profile');
  await page.screenshot({path:'ui-artifacts/overview-social-'+viewport.name+'.png',fullPage:false});
  if(viewport.name==='desktop'||viewport.name==='mobile'){
    const jpg=await page.screenshot({type:'jpeg',quality:46,fullPage:false});
    console.log('OVERVIEW_PROFILE_JPEG_'+viewport.name+':'+jpg.toString('base64'));
  }
  await page.locator('#sheetView [data-tab="combat"]').click();
  const extra=page.locator('.duo-social-profile > .rail-vitals');
  if(!(await extra.isVisible()))failures.push(viewport.name+' compact resources hidden outside Visão Geral');
  await page.locator('#sheetView [data-tab="roma"]').click();
  const prog=page.locator('[data-pane="roma"] .duo-roma-rebento-controls');
  if(!(await prog.isVisible())||!(await prog.locator('.rebento-profile-toggle').isVisible()))
    failures.push(viewport.name+' rebento control not available in Roma');
  await page.locator('[data-pane="roma"] .rebento-profile-toggle').click();
  await page.waitForLoadState('domcontentloaded',{timeout:15000});
  await page.waitForSelector('#sheetView:not(.hidden) .duo-profile-rebento-badge',{state:'attached',timeout:20000});
  const enabled=await page.locator('.duo-social-profile .duo-profile-rebento-badge').textContent();
  if(!enabled?.includes('Rebento'))failures.push(viewport.name+' rebento activation badge absent after click');
  console.log('OVERVIEW_PROFILE '+viewport.name+' '+JSON.stringify(data));
 }catch(e){failures.push(viewport.name+': '+(e.stack||e.message))}
 await ctx.close();
}
await browser.close();
console.log('OVERVIEW_PROFILE_SUMMARY '+JSON.stringify(rows));
if(failures.length){console.error('OVERVIEW_PROFILE_FAILURES\n'+failures.join('\n'));process.exit(1)}
console.log('OVERVIEW_PROFILE_PASSED: profile, skills, secondary controls and Rebento tested on all viewports.');
