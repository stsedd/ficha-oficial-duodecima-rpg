import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});

const browser=await chromium.launch({headless:true});
const failures=[];
const profiles=[
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:980,height:850},
  {name:'mobile',width:390,height:844}
];

for(const p of profiles){
  const ctx=await browser.newContext({viewport:{width:p.width,height:p.height}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>failures.push(p.name+': JS '+e.message));
  try{
    await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForSelector('#sheetView:not(.hidden) [data-tab="combat"]',{state:'visible',timeout:25000});
    await page.locator('#sheetView [data-tab="combat"]').click();
    await page.waitForSelector('[data-pane="combat"] .duo-combat-topline',{state:'visible',timeout:15000});
    const pane=page.locator('#sheetView [data-pane="combat"]');
    const nav=pane.locator('.duo-combat-nav');
    const b1=nav.locator('button[data-duo-combat-view="quick"]');
    const b2=nav.locator('button[data-duo-combat-view="powers"]');
    const navPosition=()=>nav.evaluate(n=>{
      const first=n.querySelector('button[data-duo-combat-view="quick"]');
      const second=n.querySelector('button[data-duo-combat-view="powers"]');
      return {y1:first?.getBoundingClientRect().top??null,y2:second?.getBoundingClientRect().top??null,
        columns:getComputedStyle(n.querySelector('.duo-combat-nav-buttons')).gridTemplateColumns};
    });
    let {y1,y2}=await navPosition();
    const empty=pane.locator('.duo-combat-topline > .duo-compact-conditions');
    if(!(await empty.evaluate(n=>n.classList.contains('duo-conditions-empty')))){
      failures.push(p.name+': demo unexpectedly has an active condition at start');
    }
    if(y1==null||y2==null)failures.push(p.name+': missing navigation button');
    else if(Math.abs(y1-y2)>5)failures.push(p.name+': empty conditions should keep navigation on one row');

    const meters=await pane.locator('.combat-resource-dock .combat-mini-meter').evaluateAll(els=>els.map(el=>{
      const cs=getComputedStyle(el);
      return {height:parseFloat(cs.height),aria:el.getAttribute('aria-valuenow'),
        max:el.getAttribute('aria-valuemax'),text:el.getAttribute('aria-valuetext'),
        label:el.getAttribute('aria-label'),
        fill:el.querySelector('i')?.style.width};
    }));
    if(meters.length<3)failures.push(p.name+': missing resource meters');
    if(meters.some(m=>Math.abs(m.height-6)>1||!m.aria||!m.max||!m.text||!m.label||!m.fill)){
      failures.push(p.name+': meters not readable/accessible: '+JSON.stringify(meters));
    }
    await pane.locator('.duo-add-condition').click();
    await pane.locator('#conditionSelect').selectOption('Enjoado');
    await pane.locator('#addConditionBtn').click();
    await pane.locator('.duo-combat-topline .active-condition-item').waitFor({state:'visible',timeout:10000});
    await page.waitForTimeout(100);
    const current=await navPosition();
    y1=current.y1;y2=current.y2;
    console.log('POLISH_V4_NAV_'+p.name+' '+JSON.stringify(current));
    if(p.width>760 && !(y2>y1+20))failures.push(p.name+': navigation did not stack when condition is present');
    if(p.width<=760 && Math.abs(y1-y2)>5)failures.push(p.name+': mobile navigation should remain side-by-side');
    const read=await pane.locator('.duo-combat-topline .active-condition-item small').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    if(read<11.9)failures.push(p.name+': condition text too small');
    await pane.locator('.duo-combat-topline').scrollIntoViewIfNeeded();
    await page.screenshot({path:'ui-artifacts/polish-v4-'+p.name+'-combat.png',fullPage:false});

    await b2.click();
    await pane.locator('.abilities-wrap .ability-card').first().waitFor({state:'visible'});
    const powerResults=await pane.evaluate(root=>{
      const rect=el=>el?.getBoundingClientRect();
      const group=type=>root.querySelector('.ability-card[data-ability-type="'+type+'"]');
      return ['passive','active'].map(type=>{
        const card=group(type),name=card?.querySelector('.ability-title-row > b');
        const badge=card?.querySelector('.ability-title-row .duo-ability-kind');
        const meta=card?.querySelector('.ability-title-row > .duo-ability-inline-meta');
        const before=card?.querySelector('.ability-head > div:first-child > .ability-meta');
        return {type,has:!!card,name:name?.textContent,
          badge:badge?.textContent?.trim(),badgeNested:!!badge,
          titleY:rect(name)?.y,badgeY:rect(badge)?.y,
          originalMetaOutside:!!before,
          cost:meta?.textContent||'',isCollapsed:card?.classList.contains('duo-power-minimized')};
      });
    });
    for(const info of powerResults){
      const expected=info.type==='active'?'Ativa':'Passiva';
      if(!info.has||info.badge!==expected||info.originalMetaOutside){
        failures.push(p.name+': metadata not inline: '+JSON.stringify(info));
      }
      if(info.titleY!=null&&info.badgeY!=null&&Math.abs(info.titleY-info.badgeY)>17){
        failures.push(p.name+': type badge far below title: '+JSON.stringify(info));
      }
      if(info.type==='active'&&!(/EN|Nv|Extra/i.test(info.cost))){
        failures.push(p.name+': active power lost cost/level: '+JSON.stringify(info));
      }
    }
    const focus=pane.locator('.abilities-wrap .ability-card').first();
    await focus.locator('.duo-power-toggle').click();
    if(!(await focus.locator('.ability-summary').isVisible()))failures.push(p.name+': power expand stopped working');
    await focus.locator('.duo-power-toggle').click();
    if(!(await focus.locator('.duo-power-compact').isVisible()))failures.push(p.name+': power collapse stopped working');
    const widths=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth}));
    if(widths.doc>widths.viewport+4)failures.push(p.name+': horizontal overflow '+JSON.stringify(widths));
    await pane.locator('.abilities-wrap .ability-group').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:'ui-artifacts/polish-v4-'+p.name+'-powers.png',fullPage:false});
    if(p.name==='desktop'||p.name==='mobile'){
      const photo=await page.screenshot({type:'jpeg',quality:40,fullPage:false});
      console.log('POLISH_V4_SCREEN_'+p.name+':'+photo.toString('base64'));
    }
    console.log('POLISH_V4 '+p.name+' '+JSON.stringify({meters,powerResults,widths,navY:{quick:y1,powers:y2}}));
  }catch(e){failures.push(p.name+': '+(e.stack||e.message))}
  await ctx.close();
}
await browser.close();
if(failures.length){
  console.error('POLISH_V4_FAILURES\n'+failures.join('\n'));
  process.exit(1);
}
console.log('POLISH_V4_PASSED: recursos, navegação adaptativa, rótulos inline e poderes em três tamanhos.');
