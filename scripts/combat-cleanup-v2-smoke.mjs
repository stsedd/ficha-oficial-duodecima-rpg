import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const checks=[];
const profiles=[{id:'desktop',width:1440,height:900},{id:'mobile',width:390,height:844}];
for(const profile of profiles){
 const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
 const page=await ctx.newPage();
 page.on('pageerror',error=>failures.push(profile.id+' JS '+error.message));
 try{
  await page.goto('http://127.0.0.1:4173/ficha-teste.html',{waitUntil:'networkidle',timeout:45000});
  await page.waitForSelector('#sheetView:not(.hidden) [data-pane="status"] .duo-status-support',{state:'visible',timeout:25000});
  const status=page.locator('#sheetView [data-pane="status"]');
  const exhaustion=status.locator('#combatExhaustionSelect');
  const rest=status.locator('#shortRest');
  if(!(await exhaustion.isVisible())||!(await rest.isVisible()))failures.push(profile.id+' status exaustão/descanso não visíveis');
  if(await status.locator('#tempDefense').isVisible())failures.push(profile.id+' ajuste manual de Defesa indevidamente exposto');
  await status.locator('.duo-status-advanced summary').click();
  for(const id of ['tempDefense','tempReduction','resetAbilityUses']){
    if(!(await status.locator('#'+id).isVisible()))failures.push(profile.id+' ajuste avançado ausente '+id);
  }
  await exhaustion.selectOption('2');
  await page.waitForTimeout(120);
  if(await status.locator('#combatExhaustionSelect').inputValue()!=='2')failures.push(profile.id+' exaustão não persistiu no rerender');
  await page.locator('[data-tab="combat"]').click();
  const pane=page.locator('#sheetView [data-pane="combat"]');
  await pane.locator('.duo-combat-nav').waitFor({state:'visible',timeout:10000});
  await page.waitForTimeout(250);
  const rules=pane.locator('.duo-turn-rules-small > details');
  if(await rules.count()){
    if(await rules.evaluate(el=>el.open))failures.push(profile.id+' regras de turno visíveis por padrão');
    await rules.locator('summary').click();
    if(!(await rules.locator('.combat-general-rules-grid').isVisible()))failures.push(profile.id+' regras completas não abriram');
    await rules.locator('summary').click();
  }else failures.push(profile.id+' guia de turno ausente');
  if(await pane.locator('.combat-essentials-card').isVisible()||await pane.locator('.combat-rest-card').isVisible()){
    failures.push(profile.id+' painéis obsoletos ainda visíveis');
  }
  const condition=pane.locator('.duo-compact-conditions');
  if(!(await condition.isVisible()))failures.push(profile.id+' condições não visíveis');
  if(await condition.locator('.condition-adder').isVisible())failures.push(profile.id+' seletor de condição visível sem abrir');
  await condition.locator('.duo-add-condition').click();
  if(!(await condition.locator('.condition-adder').isVisible()))failures.push(profile.id+' adicionar condição não abre');
  await condition.locator('.duo-add-condition').click();
  await pane.locator('button[data-duo-combat-view="powers"]').click();
  const card=pane.locator('.abilities-wrap .ability-card').first();
  await card.locator('.duo-power-toggle').waitFor({state:'visible'});
  const label=await card.locator('.duo-power-toggle').textContent();
  const collapsed=await card.locator('.ability-summary').evaluate(el=>getComputedStyle(el).display==='none');
  if(label?.trim()!=='Expandir'||!collapsed)failures.push(profile.id+' poder não começa minimizado ou mostra descrição '+label+' '+collapsed);
  const h1=await card.evaluate(el=>Math.round(el.getBoundingClientRect().height));
  await card.locator('.duo-power-toggle').click();
  const h2=await card.evaluate(el=>Math.round(el.getBoundingClientRect().height));
  const details=await card.locator('.ability-summary').isVisible();
  if(h2<=h1+25||!details)failures.push(profile.id+' poder não expandiu ('+h1+' -> '+h2+', details '+details+')');
  await card.locator('.duo-power-toggle').click();
  if(!(await card.locator('.duo-power-compact').isVisible()))failures.push(profile.id+' recolher não restaurou resumo');
  await pane.locator('.duo-power-action').filter({hasText:'Expandir todos'}).click();
  const anyCollapsed=await pane.locator('.ability-card.duo-power-minimized').count();
  if(anyCollapsed)failures.push(profile.id+' expandir todos deixou '+anyCollapsed+' poderes minimizados');
  await pane.locator('.duo-power-action').filter({hasText:'Recolher todos'}).click();
  const allCollapsed=await pane.locator('.ability-card.duo-power-minimized').count();
  const count=await pane.locator('.abilities-wrap .ability-card').count();
  if(allCollapsed!==count)failures.push(profile.id+' recolher todos deixou '+(count-allCollapsed)+' abertos');
  const first=page.locator('.abilities-wrap .ability-card').first();
  await first.locator('.duo-power-toggle').click();
  await page.locator('[data-tab="status"]').click();
  await page.locator('[data-tab="combat"]').click();
  const stillExpanded=await page.locator('.abilities-wrap .ability-card').first().locator('.duo-power-toggle').getAttribute('aria-expanded');
  if(stillExpanded!=='true')failures.push(profile.id+' expansão perdida na troca de aba');
  await page.screenshot({path:'ui-artifacts/combat-cleanup-'+profile.id+'.png',fullPage:false});
  const summary=await page.evaluate(()=>{
    const pane=document.querySelector('[data-pane="combat"]');
    const status=document.querySelector('[data-pane="status"]');
    const size=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r?Math.round(r.height):null};
    const calc=(el)=>el&&getComputedStyle(el).display!=='none';
    return {
      cards:pane.querySelectorAll('.ability-card').length,
      collapsed:pane.querySelectorAll('.ability-card.duo-power-minimized').length,
      statusSupport:!!status.querySelector('.duo-status-support'),
      rulesSmall:!!pane.querySelector('.duo-turn-rules-small'),
      quickHidden:!calc(pane.querySelector('.ability-quick-deck')),
      widths:{screen:innerWidth,document:document.documentElement.scrollWidth},
      abilityHeight:size('.abilities-wrap')
    };
  });
  checks.push({profile:profile.id,...summary,collapsedHeight:h1,expandedHeight:h2});
  if(summary.widths.document>summary.widths.screen+4)failures.push(profile.id+' overflow horizontal '+JSON.stringify(summary.widths));
 }catch(err){failures.push(profile.id+' '+(err.stack||err.message))}
 await ctx.close();
}
await browser.close();
console.log('COMBAT_CLEANUP_SUMMARY '+JSON.stringify(checks));
if(failures.length){console.error('COMBAT_CLEANUP_FAILURES\n'+failures.join('\n'));process.exit(1)}
console.log('COMBAT_CLEANUP_PASSED: referência, regras, condição, exaustão, minimização e persistência.');
