import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
let fail=[];
try{
 for(const p of [{name:'ref-desktop',width:1024,height:900},{name:'ref-mobile',width:390,height:844}]){
  const ctx=await browser.newContext({viewport:{width:p.width,height:p.height}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>fail.push(p.name+': JS '+e.message));
  try{
   await page.goto('http://127.0.0.1:4173/armamentarium-referencia-v538.html',{waitUntil:'networkidle',timeout:60000});
   await page.waitForSelector('#sheetView:not(.hidden) .am-shell',{state:'visible',timeout:30000});
   const layout=await page.evaluate(()=>{
    const rect=x=>{const b=document.querySelector(x)?.getBoundingClientRect();return b?{x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)}:null};
    return {screen:innerWidth,scroll:document.documentElement.scrollWidth,style:document.body.className,
      banner:!!document.querySelector('.am-used'),tabs:document.querySelectorAll('.am-tab').length,items:document.querySelectorAll('.am-item-row').length,
      preview:rect('.am-shell'),left:rect('.am-list'),right:rect('.am-detail'),
      title:document.querySelector('.am-detail-name')?.textContent,
      header:getComputedStyle(document.querySelector('.archive-brandbar')).display,
      rail:getComputedStyle(document.querySelector('#sheetView .character-rail')).display
    };
   });
   if(!layout.banner||layout.tabs!==4||layout.items!==6)fail.push(p.name+': dados básicos '+JSON.stringify(layout));
   if(layout.rail!=='none'||layout.header!=='none')fail.push(p.name+': chrome antigo visível');
   if(layout.scroll>layout.screen+3)fail.push(p.name+': overflow horizontal');
   if(p.name==='ref-desktop'&&!(layout.left.x+layout.left.width<layout.right.x))fail.push(p.name+': lista à esquerda e detalhe à direita ausentes');
   if(p.name==='ref-mobile'){
    await page.locator('.am-item-row').first().click();
    if(!(await page.locator('.am-detail').isVisible()))fail.push(p.name+': detalhes não abrem');
   }
   console.log('REFERENCE_LAYOUT '+JSON.stringify(layout));
   const shot=await page.screenshot({type:'jpeg',quality:58,fullPage:false});
   console.log('REFERENCE_JPEG_'+p.name+':'+shot.toString('base64'));
   await page.screenshot({path:'ui-artifacts/armamentarium-reference-'+p.name+'.png',fullPage:false});
  }catch(e){fail.push(p.name+': '+(e.stack||e.message))}
  await ctx.close();
 }
}finally{await browser.close()}
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('Referência focal aprovada em PC e mobile.');
