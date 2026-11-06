import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
const profiles=[
 {name:'desktop',width:1440,height:960},
 {name:'tablet',width:980,height:900},
 {name:'mobile',width:390,height:844}
];
const fail=(p,m)=>errors.push(p+': '+m);
async function metrics(page){
 return page.evaluate(()=>{
  const pane=document.querySelector('#sheetView [data-pane="combat"]');
  const cards=[...pane.querySelectorAll('.abilities-wrap .ability-card')];
  const vis=e=>e&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
  return {
    view:pane.dataset.duoCombatView,
    total:cards.length,
    visible:cards.filter(c=>vis(c)&&!c.classList.contains('duo-power-filtered')).length,
    minimized:cards.filter(c=>c.classList.contains('duo-power-minimized')).length,
    expanded:cards.filter(c=>c.classList.contains('duo-power-open')).length,
    quickDeck:!!pane.querySelector('.ability-quick-deck'),
    resource:vis(pane.querySelector('.combat-resource-dock')),
    combatValues:vis(pane.querySelector('.duo-compact-conditions')),
    powerList:vis(pane.querySelector('.abilities-wrap')),
    tools:vis(pane.querySelector('.duo-power-tools')),
    buttons:[...pane.querySelectorAll('[data-duo-combat-view]')].map(b=>b.getAttribute('aria-selected')),
    uiState:!!localStorage.getItem('duo-test-combat-powers-v2:'+String(window.DUODECIMA_CHARACTER_STORAGE_KEY||'preview-original')),
    allInputs:cards.reduce((sum,c)=>sum+c.querySelectorAll('input,select,textarea').length,0),
    powerColumns:pane.querySelector('.ability-grid')?getComputedStyle(pane.querySelector('.ability-grid')).columnCount:null,
    overflow:document.documentElement.scrollWidth>innerWidth+4,
    bodyH:Math.round(pane.getBoundingClientRect().height)
  };
 });
}
try{
 for(const p of profiles){
  const context=await browser.newContext({viewport:{width:p.width,height:p.height}});
  const page=await context.newPage();
  page.on('pageerror',e=>fail(p.name,'JavaScript '+(e.stack||e.message)));
  try{
   await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:60000});
   await page.waitForSelector('#sheetView:not(.hidden) [data-pane="status"]',{state:'visible',timeout:25000});
   if(await page.locator('.skill-ledger-row').count()!==26)fail(p.name,'visão geral alterada');
   await page.locator('[data-tab="combat"]').click();
   await page.waitForSelector('[data-pane="combat"] .duo-combat-nav',{state:'visible',timeout:15000});
   let data=await metrics(page);
   if(data.total<15||data.view!=='quick'||!data.resource||!data.combatValues||data.powerList)fail(p.name,'aba Combate rápido inicial '+JSON.stringify(data));
   if(data.overflow)fail(p.name,'overflow inicial');
   // Tabs também funcionam por teclado (setas esquerda/direita).
   await page.locator('button[data-duo-combat-view="quick"]').focus();
   await page.keyboard.press('ArrowRight');
   if((await metrics(page)).view!=='powers')fail(p.name,'navegação por teclado não alterou o painel');
   await page.locator('button[data-duo-combat-view="powers"]').click();
   await page.waitForSelector('[data-pane="combat"] .duo-power-tools',{state:'visible'});
   data=await metrics(page);
   if(data.view!=='powers'||!data.powerList||data.combatValues||data.expanded!==0||!data.uiState){
     fail(p.name,'poderes não recolhidos: '+JSON.stringify(data));
   }
   if(data.powerColumns!==(p.width>760?'2':'1'))fail(p.name,'número de colunas: '+data.powerColumns);
   const first=page.locator('[data-pane="combat"] .ability-card:has(.stake-compact input[type="range"])').first();
   const firstKey=await first.getAttribute('data-ability-key');
   const preview=first.locator('.duo-power-compact');
   if(!(await preview.isVisible())||await first.locator('.stake-compact input[type="range"]').isVisible()){
     fail(p.name,'resumo compacto não funcionou');
   }
   await page.screenshot({path:'ui-artifacts/combat-powers-'+p.name+'-compact.png',fullPage:false});
   if(p.name==='desktop'||p.name==='mobile'){
     const jpeg=await page.screenshot({type:'jpeg',quality:50,fullPage:false});
     console.log('COMBAT_ORGANIZER_VISUAL_'+p.name+':'+jpeg.toString('base64'));
   }
   const toggle=first.locator('.duo-power-toggle');
   await toggle.click();
   if(!(await first.locator('.stake-compact input[type="range"]').isVisible())){
     fail(p.name,'expansão não revelou estacas');
   }
   // As estacas continuam no input original e sobreviverão ao rerender da ficha.
   await first.locator('input[data-stakes]').evaluate(el=>{
     el.value='16';
     el.dispatchEvent(new Event('change',{bubbles:true}));
   });
   await page.waitForTimeout(160);
   const afterStake=page.locator('[data-ability-key="'+firstKey+'"]');
   if((await afterStake.locator('input[data-stakes]').inputValue())!=='16'||
      !(await afterStake.locator('input[data-stakes]').isVisible())){
     fail(p.name,'estacas e expansão não persistiram ao salvar');
   }
   await first.locator('[data-ability-deck-toggle]').click();
   await page.waitForTimeout(180);
   const firstRerender=page.locator('[data-ability-key="'+firstKey+'"]');
   if(!(await firstRerender.locator('.ability-deck-toggle.active').count())||
      !(await firstRerender.locator('.stake-compact input[type="range"]').isVisible())){
     fail(p.name,'favorito não sobreviveu ao rerender');
   }
   await page.locator('.duo-power-action').filter({hasText:'Recolher todos'}).click();
   if(!(await firstRerender.locator('.duo-power-compact').isVisible()))fail(p.name,'recolher todos falhou');
   await page.locator('.duo-power-action').filter({hasText:'Só destaques abertos'}).click();
   if(!(await firstRerender.locator('.stake-compact input[type="range"]').isVisible()))fail(p.name,'priorizar favorito falhou');
   await page.locator('[data-duo-power-filter="favorite"]').click();
   const fav=await metrics(page);
   if(fav.visible!==1||fav.total<15)fail(p.name,'filtro favorito '+JSON.stringify(fav));
   await page.locator('[data-duo-power-filter="all"]').click();
   const search=page.locator('.duo-power-search');
   const name=await firstRerender.locator('.ability-title-row b').textContent();
   await search.fill(name||'');
   const results=await metrics(page);
   if(results.visible!==1)fail(p.name,'busca não filtrou: '+JSON.stringify(results));
   await search.fill('');
   await page.locator('[data-duo-power-filter="active"]').click();
   const active=await metrics(page);
   if(active.visible<2||active.visible>=active.total)fail(p.name,'filtro de ativas: '+JSON.stringify(active));
   await page.locator('[data-duo-power-filter="passive"]').click();
   const passive=await metrics(page);
   if(passive.visible<2||passive.visible>=passive.total)fail(p.name,'filtro de passivas: '+JSON.stringify(passive));
   await page.locator('[data-duo-power-filter="all"]').click();
   await page.locator('.duo-power-action').filter({hasText:'Expandir todos'}).click();
   const expanded=await metrics(page);
   if(expanded.expanded!==expanded.total)fail(p.name,'expandir todos: '+JSON.stringify(expanded));
   await page.screenshot({path:'ui-artifacts/combat-powers-'+p.name+'-expanded.png',fullPage:false});
   await page.locator('.duo-power-action').filter({hasText:'Só destaques abertos'}).click();
   await page.locator('button[data-duo-combat-view="quick"]').click();
   await page.waitForSelector('[data-pane="combat"] .duo-compact-conditions',{state:'visible'});
   await page.locator('[data-pane="combat"] [data-open-ability]').first().click();
   await page.waitForTimeout(100);
   const quick=await metrics(page);
   if(quick.view!=='powers'||quick.expanded<1||!quick.powerList)fail(p.name,'baralho não levou ao poder: '+JSON.stringify(quick));
   await page.locator('[data-tab="inventory"]').click();
   if(!(await page.locator('#sheetView [data-pane="inventory"] [data-weapon-card]').count()))fail(p.name,'inventário original alterado');
   await page.locator('[data-tab="combat"]').click();
   const back=await metrics(page);
   if(back.view!=='powers'||!back.powerList)fail(p.name,'troca de aba perdeu seção');
   await page.reload({waitUntil:'networkidle'});
   await page.waitForSelector('#sheetView:not(.hidden) .duo-combat-nav',{state:'attached',timeout:20000});
   const afterReload=await metrics(page);
   if(afterReload.view!=='powers'||!afterReload.uiState)fail(p.name,'estado do painel não persistiu: '+JSON.stringify(afterReload));
   await page.locator('button[data-duo-combat-view="quick"]').click();
   console.log('COMBAT_ORGANIZER_'+p.name+' '+JSON.stringify({initial:data, favorite:fav, active, passive, reload:afterReload}));
  }catch(err){fail(p.name,err.stack||err.message)}
  await context.close();
 }
}finally{await browser.close()}
if(errors.length){console.error('❌ Falhas de Combat/Poderes:\n'+errors.join('\n'));process.exit(1)}
console.log('✅ Combate e Poderes organizados: filtros, favoritos, minimização, rerender, mobile e persistência aprovados.');
