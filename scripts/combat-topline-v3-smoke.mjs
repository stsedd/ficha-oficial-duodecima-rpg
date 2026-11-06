import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('ui-artifacts', {recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
for(const profile of [
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:1024,height:900},
  {name:'mobile',width:390,height:844}
]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(profile.name+' JS: '+e.message));
  try{
    await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForSelector('#sheetView:not(.hidden) [data-tab="combat"]',{state:'visible',timeout:25000});
    await page.locator('#sheetView [data-tab="combat"]').click();
    await page.waitForSelector('[data-pane="combat"] .duo-combat-topline > .qol-sanity-card',{state:'visible',timeout:15000});
    const box=await page.locator('[data-pane="combat"]').evaluate(pane=>{
      const rect=sel=>{const r=pane.querySelector(sel)?.getBoundingClientRect();return r?{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}:null};
      const sane=pane.querySelector('.duo-combat-topline > .qol-sanity-card');
      const stateLabel=sane?.querySelector('.qol-sanity-name b')?.textContent.trim();
      const status=document.querySelector('[data-pane="status"] .qol-sanity-name b')?.textContent.trim();
      const desc=pane.querySelector('.duo-combat-topline .active-condition-item small');
      return {
        nav:rect('.duo-combat-topline > .duo-combat-nav'),
        conditions:rect('.duo-combat-topline > .duo-compact-conditions'),
        sanity:rect('.duo-combat-topline > .qol-sanity-card'),
        heading:stateLabel,referenceStatus:status,
        sanityValue:sane?.querySelector('.qol-sanity-value')?.textContent.trim(),
        conditionsFont:desc?Number.parseFloat(getComputedStyle(desc).fontSize):null,
        conditionRows:pane.querySelectorAll('.duo-combat-topline .active-condition-item').length,
        detailsCollapsed:!sane?.querySelector('.duo-sanity-more')?.open,
        brokenSiblings:pane.querySelectorAll(':scope > .qol-sanity-card').length,
        quickCount:pane.querySelectorAll('button[data-duo-combat-view]').length,
        screen:window.innerWidth,fullWidth:document.documentElement.scrollWidth,
        emptyDeckHeight:pane.querySelector('.ability-quick-deck.is-empty')?Math.round(pane.querySelector('.ability-quick-deck.is-empty').getBoundingClientRect().height):null
      };
    });
    console.log('TOPLINE_V3 '+profile.name+' '+JSON.stringify(box));
    if(!box.nav||!box.conditions||!box.sanity)errors.push(profile.name+' missing one of three panels');
    if(!box.heading||!box.sanityValue||box.heading!==box.referenceStatus)errors.push(profile.name+' Sanity out of sync: '+JSON.stringify(box));
    if(box.brokenSiblings!==0)errors.push(profile.name+' Sanity remained below the ability deck');
    if(box.quickCount!==2)errors.push(profile.name+' Combat and Powers buttons missing');
    if(box.fullWidth>profile.width+4)errors.push(profile.name+' horizontal overflow '+JSON.stringify(box));
    if(profile.width>=1200){
      if(Math.abs(box.nav.y-box.conditions.y)>5||Math.abs(box.nav.y-box.sanity.y)>5)errors.push(profile.name+' panels not in one row');
      if(!(box.nav.x+box.nav.width<=box.conditions.x+2&&box.conditions.x+box.conditions.width<=box.sanity.x+2))errors.push(profile.name+' wrong panel order');
    }else if(profile.width===1024){
      if(!(box.nav.x+box.nav.width<=box.conditions.x+2))errors.push(profile.name+' tablet nav and conditions do not share first row');
    }else{
      if(!(box.nav.y<box.conditions.y&&box.conditions.y<box.sanity.y))errors.push(profile.name+' mobile panel flow incorrect');
    }
    if(box.conditionsFont!==null&&box.conditionsFont<11.9)errors.push(profile.name+' condition description too small');
    if(box.emptyDeckHeight!==null&&box.emptyDeckHeight>140)errors.push(profile.name+' empty deck too tall: '+box.emptyDeckHeight);
    const sanityPanel=page.locator('[data-pane="combat"] .duo-combat-topline .qol-sanity-card');
    const details=sanityPanel.locator('.duo-sanity-more');
    const initiallyOpen=await details.evaluate(el=>el.open);
    await details.locator('summary').click();
    if((await details.evaluate(el=>el.open))===initiallyOpen)errors.push(profile.name+' Sanity details did not toggle');
    await details.locator('summary').click();
    const sanInput=page.locator('[data-pane="combat"] input[data-resource-manual-input="san"]');
    await sanInput.fill('-45');
    await page.locator('[data-pane="combat"] button[data-manual-resource="san"]').click();
    await page.waitForFunction(()=>{
      const card=document.querySelector('[data-pane="combat"] .duo-combat-topline > .qol-sanity-card');
      return card?.querySelector('.qol-sanity-name b')?.textContent.trim()==='Instável';
    },{timeout:10000});
    const dynamicSanity=page.locator('[data-pane="combat"] .duo-combat-topline > .qol-sanity-card');
    if((await dynamicSanity.locator('.qol-sanity-value').textContent())?.trim()!=='55')errors.push(profile.name+' Sanity value did not follow resource change');
    if(await dynamicSanity.locator('.duo-sanity-more').evaluate(el=>el.open))errors.push(profile.name+' long Sanity explanation should start collapsed');
    if(!(await dynamicSanity.locator('.duo-sanity-auto-peek').textContent())?.includes('INT'))errors.push(profile.name+' automatic penalties not visible in compact Sanity');
    const firstCond=page.locator('[data-pane="combat"] .duo-compact-conditions');
    const add=firstCond.locator('.duo-add-condition');
    await add.click();
    if(!(await firstCond.locator('.condition-adder').isVisible()))errors.push(profile.name+' Condition form cannot open');
    const conditionSelect=firstCond.locator('#conditionSelect');
    const choice=await conditionSelect.evaluate(select=>{
      const options=[...select.options].filter(x=>x.value);
      return (options.find(o=>o.value==='Enjoado')||options[0])?.value||null;
    });
    if(choice){
      await conditionSelect.selectOption(choice);
      await firstCond.locator('#addConditionBtn').click();
      await page.waitForSelector('[data-pane="combat"] .duo-combat-topline .active-condition-item',{state:'visible',timeout:10000});
      const fontSize=await page.locator('[data-pane="combat"] .duo-combat-topline .active-condition-item small').first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize));
      if(fontSize<11.9)errors.push(profile.name+' condition description remained too small after adding condition');
      const more=page.locator('[data-pane="combat"] .duo-combat-topline .duo-condition-more').first();
      if(await more.count()){
        await more.click();
        if((await more.getAttribute('aria-expanded'))!=='true')errors.push(profile.name+' condition description did not expand');
      }
    }else{
      errors.push(profile.name+' could not find a test condition');
      await add.click();
    }
    await page.locator('button[data-duo-combat-view="powers"]').click();
    await page.waitForSelector('[data-pane="combat"] .duo-power-tools',{state:'visible',timeout:10000});
    if(!(await sanityPanel.isVisible())||!(await firstCond.isVisible()))errors.push(profile.name+' Sanity and conditions disappeared on Powers view');
    if(await page.locator('[data-pane="combat"] .ability-quick-deck').isVisible())errors.push(profile.name+' quick deck remains visible on Powers view');
    if(!(await page.locator('[data-pane="combat"] .abilities-wrap .ability-card').first().isVisible()))errors.push(profile.name+' Powers not shown');
    await page.locator('button[data-duo-combat-view="quick"]').click();
    await page.locator('[data-pane="combat"] .duo-combat-topline').scrollIntoViewIfNeeded();
    await page.screenshot({path:'ui-artifacts/combat-topline-v3-'+profile.name+'.png',fullPage:false});
    const jpeg=await page.screenshot({type:'jpeg',quality:35,fullPage:false});
    if(profile.name==='desktop'||profile.name==='mobile')console.log('TOPLINE_V3_IMAGE_'+profile.name+':'+jpeg.toString('base64'));
  }catch(e){errors.push(profile.name+': '+(e.stack||e.message))}
  await context.close();
}
await browser.close();
if(errors.length){
  console.error('TOPLINE_V3_FAILURES\n'+errors.join('\n'));
  process.exit(1);
}
console.log('TOPLINE_V3_PASSED: desktop, tablet and mobile; Sanity/conditions aligned, quick deck compact, Powers accessible.');
