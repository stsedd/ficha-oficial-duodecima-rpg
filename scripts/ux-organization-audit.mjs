import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const b=await chromium.launch({headless:true});
const errs=[];
const tabs=['status','combat','inventory','familiars','roma','magic','history','notes'];
try{
 for(const p of [{label:'desktop',width:1280,height:860},{label:'mobile',width:390,height:844}]){
  const context=await b.newContext({viewport:{width:p.width,height:p.height}});
  const page=await context.newPage();
  page.on('pageerror',e=>errs.push(p.label+': '+e.message));
  await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:50000});
  await page.waitForSelector('#sheetView:not(.hidden) .sheet-main',{state:'visible',timeout:20000});
  for(const tab of tabs){
    const nav=page.locator('#sheetView [data-tab="'+tab+'"]');
    await nav.click({timeout:10000});
    const pane=page.locator('#sheetView [data-pane="'+tab+'"]');
    await pane.waitFor({state:'visible',timeout:10000});
    await page.waitForTimeout(130);
    const metrics=await pane.evaluate((root,id)=>{
      const rect=el=>{let r=el?.getBoundingClientRect();return r?{y:Math.round(r.y),x:Math.round(r.x),width:Math.round(r.width),height:Math.round(r.height)}:null};
      const vis=el=>{if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!!el.getClientRects().length};
      const sectionLabels=[...root.querySelectorAll('.section-title h2,.section-title h3,.ability-group-title b,.eyebrow,h2,h3,summary')].filter(vis).map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,55);
      const direct=[...root.children].map(el=>({type:el.tagName,class:(typeof el.className==='string'?el.className:'').slice(0,85),height:Math.round(el.getBoundingClientRect().height),label:el.textContent.replace(/\s+/g,' ').trim().slice(0,45)}));
      const allCards=[...root.querySelectorAll('.card,.ability-card,.subcard,.weapon-editor-card,.inventory-item-card')];
      const skillRows=[...root.querySelectorAll('.skill-ledger-row')];
      const powerCards=[...root.querySelectorAll('.ability-card')];
      const itemCards=[...root.querySelectorAll('[data-item-card],[data-weapon-card]')];
      const main= document.querySelector('.sheet-main');
      const tabs= document.querySelector('.sheet-tabs');
      const height=Math.round(root.getBoundingClientRect().height);
      return {tab:id,height,firstChildren:direct,headings:sectionLabels,cardCount:allCards.length,
       textFields:root.querySelectorAll('input,select,textarea').length,buttons:root.querySelectorAll('button,summary').length,
       skills:skillRows.length,powers:powerCards.length,items:itemCards.length,
       mainWidth:Math.round(main.getBoundingClientRect().width),
       paneWidth:Math.round(root.getBoundingClientRect().width),
       navWidth:Math.round(tabs.getBoundingClientRect().width),
       navScrollable:tabs.querySelector('.sheet-tab-scroll')?.scrollWidth>tabs.querySelector('.sheet-tab-scroll')?.clientWidth,
       bodyOverflow:document.documentElement.scrollWidth>innerWidth+4,
       cardsHeight:powerCards.length?Math.round(powerCards.reduce((acc,el)=>acc+el.getBoundingClientRect().height,0)):undefined,
       skillColumns:root.querySelector('.skill-ledger')?getComputedStyle(root.querySelector('.skill-ledger')).gridTemplateColumns:undefined,
       skillsBox:rect(root.querySelector('.skills-ledger-card')),
       firstPowerBox:rect(root.querySelector('.ability-card')),
       inventoryForm:rect(root.querySelector('.inventory-toolbar-card')),
       filterBox:rect(root.querySelector('.inventory-filter-row')),
       coins:!!root.querySelector('#invAureus'),
       how:!!root.querySelector('.inventory-ledger'),
       firstInteractive:rect(root.querySelector('input,button,summary'))
      };
    },tab);
    console.log('AUDIT_LAYOUT '+p.label+' '+JSON.stringify(metrics));
    const images=(p.label==='desktop'&&['status','combat','inventory','roma','familiars','magic'].includes(tab))||
                 (p.label==='mobile'&&['status','combat','inventory'].includes(tab));
    if(images){
      if(tab==='combat'){
       const power=page.locator('.abilities-wrap .ability-group').first();
       if(await power.count()){await power.scrollIntoViewIfNeeded();await page.waitForTimeout(100);}
      }
      if(tab==='inventory'&&p.label==='desktop'){
       const protection=page.locator('[data-pane="inventory"] [data-inventory-kind="protection"]');
       if(await protection.count()){await protection.scrollIntoViewIfNeeded();await page.waitForTimeout(100);}
      }
      if(tab==='roma'){await page.locator('#sheetView [data-pane="roma"] .mechanics-section').first().scrollIntoViewIfNeeded();}
      const shot=await page.screenshot({type:'jpeg',quality:48,fullPage:false});
      console.log('AUDIT_SCREEN_'+p.label+'_'+tab+':'+shot.toString('base64'));
      await page.screenshot({path:'ui-artifacts/audit-'+p.label+'-'+tab+'.png',fullPage:false});
    }
  }
  await context.close();
 }
}finally{await b.close()}
if(errs.length){console.error('PAGE_ERRORS '+JSON.stringify(errs));process.exitCode=1}
console.log('AUDIT_COMPLETE');
