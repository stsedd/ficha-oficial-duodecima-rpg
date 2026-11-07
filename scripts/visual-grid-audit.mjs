import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const records=[], issues=[];
await fs.mkdir('visual-grid-artifacts',{recursive:true});
for(const width of [320,390,768,1024,1440,1920]){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.addInitScript(()=>{
  localStorage.setItem('duodecima_universal_stage4_v24',JSON.stringify({
   isCreated:true,name:'Auditoria visual da Duodécima — personagem de teste',player:'QA',
   level:35,godId:'iuppiter',activeTab:'status',
   lineage:{type:'normal',namingVersion:2,secondaryGodId:'',structureGodId:'iuppiter'},
   inventory:{items:[]},weapons:[],familiars:{entries:[]}
  }));
 });
 const page=await context.newPage();
 page.on('pageerror',e=>issues.push({width,tab:'all',type:'javascript',message:e.message}));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle',timeout:60000});
 await page.locator('#sheetView:not(.hidden)').waitFor({timeout:25000});
 if(width<=390){
   const header=await page.evaluate(()=>{
     const pick=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,width:r.width,right:r.right,display:getComputedStyle(el).display,gridColumn:getComputedStyle(el).gridColumn,flex:getComputedStyle(el).flex,maxWidth:getComputedStyle(el).maxWidth}};
     return {brand:pick('.archive-brandbar'),bar:pick('.multi-character-bar'),select:pick('#duoCharacterSelect'),newButton:pick('[data-multi="new"]'),appearance:pick('.appearance-top-actions')};
   });
   console.log('GRID_HEADER_METRICS|'+width+'|'+JSON.stringify(header));
   if(!header.bar||header.bar.width<width-62)issues.push({width,tab:'header',type:'character-switcher-too-narrow',details:header});
 }
 const tabs=await page.locator('#sheetView [data-tab]').evaluateAll(els=>[...new Set(els.map(el=>el.dataset.tab))]);
 for(const tab of tabs){
  if(!tab)continue;
  await page.locator('#sheetView [data-tab="'+tab+'"]').first().click();
  await page.waitForTimeout(80);
  const measure=await page.evaluate(()=>{
   const vw=document.documentElement.clientWidth;
   const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1};
   const names='.card,.subcard,.stat,.skill-ledger-row,.weapon-card,.inventory-item,.ability-card';
   const cards=[...document.querySelectorAll('#sheetView '+names.replaceAll(',',',#sheetView '))].filter(visible);
   const escaping=cards.filter(el=>{const r=el.getBoundingClientRect();return r.left < -3||r.right>vw+3}).slice(0,8).map(el=>({className:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
   const skillRows=[...document.querySelectorAll('#sheetView .skill-ledger-row')].filter(visible);
   const skillOverlaps=skillRows.slice(0,10).some(row=>{
    const arr=['.skill-ledger-flags','.skill-roll-value','.skill-ledger-name','.skill-settings summary'].map(s=>row.querySelector(s));
    return arr.every(Boolean)&&arr.some((e,i)=>i>0&&arr[i-1].getBoundingClientRect().right>e.getBoundingClientRect().left+5);
   });
   const fonts=[...document.querySelectorAll('#sheetView h2,#sheetView h3,#sheetView .label,#sheetView button')].filter(visible).slice(0,60).map(el=>getComputedStyle(el).fontFamily);

   const overlaps=(a,b)=>{
    if(!a||!b||!visible(a)||!visible(b))return false;
    const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
    const intersectX=Math.min(x.right,y.right)-Math.max(x.left,y.left);
    const intersectY=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);
    return intersectX>3&&intersectY>3;
   };
   const q=s=>document.querySelector('#sheetView [data-pane="inventory"] '+s);
   const inventoryCollision=overlaps(q('.inventory-toolbar-grid'),q('.inventory-filter-row'))||
       overlaps(q('.inventory-import-card'),q('.inventory-manual-card'))||
       overlaps(q('.inventory-manual-row select'),q('.inventory-manual-row button'))||
       overlaps(q('.inventory-filter-row input'),q('.inventory-filter-row select'));
   return {scroll:document.documentElement.scrollWidth,vw,escaping,skillOverlaps,inventoryCollision,
     cards:cards.length,skills:skillRows.length,fonts:[...new Set(fonts)]};
  });
  if(measure.scroll>width+3)issues.push({width,tab,type:'horizontal-overflow',scroll:measure.scroll});
  if(measure.escaping.length)issues.push({width,tab,type:'offscreen-cards',samples:measure.escaping});
  if(measure.skillOverlaps)issues.push({width,tab,type:'skills-overlap'});
  if(measure.inventoryCollision)issues.push({width,tab,type:'inventory-controls-overlap'});
  records.push({width,tab,...measure});
  await page.screenshot({path:'visual-grid-artifacts/'+width+'-'+tab+'.png',fullPage:true,animations:'disabled'});
  if([390,1440].includes(width)){
   const shot=await page.screenshot({type:'jpeg',quality:38,fullPage:false,animations:'disabled'});
   console.log('GRID_AUDIT_IMAGE|'+width+'|'+tab+'|'+shot.toString('base64'));
  }
 }
 await context.close();
}
await browser.close();
await fs.writeFile('visual-grid-artifacts/report.json',JSON.stringify({records,issues},null,2));
console.log(JSON.stringify({screenshots:records.length,issues:issues.slice(0,40),issueCount:issues.length},null,2));
if(issues.length)process.exitCode=1;
