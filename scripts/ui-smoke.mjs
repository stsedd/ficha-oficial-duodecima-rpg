import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base=process.env.UI_BASE_URL||'http://127.0.0.1:4173/';
await fs.mkdir('ui-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',viewport:{width:1440,height:1100}},
  {name:'mobile',viewport:{width:390,height:844}}
];
const failures=[];

for(const test of cases){
  const page=await browser.newPage({viewport:test.viewport});
  page.on('pageerror',error=>failures.push(`${test.name}: pageerror ${error.message}`));
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#creationView',{state:'visible',timeout:30000});
  await page.screenshot({path:`ui-artifacts/${test.name}-creation.png`,fullPage:true});
  const layout=await page.evaluate(()=>({
    viewport:window.innerWidth,
    scroll:document.documentElement.scrollWidth,
    core:document.querySelector('#coreStatus')?.textContent?.trim()||'',
    creationVisible:!document.querySelector('#creationView')?.classList.contains('hidden')
  }));
  if(!layout.creationVisible)failures.push(`${test.name}: tela de criação não está visível`);
  if(layout.scroll>layout.viewport+2)failures.push(`${test.name}: overflow horizontal ${layout.scroll}px > ${layout.viewport}px`);
  if(!layout.core)failures.push(`${test.name}: status do Core ausente`);

  const themeButton=page.locator('#themePaletteBtn');
  if(await themeButton.count()){
    await themeButton.click();
    const dialog=page.locator('#themeDialog');
    if(await dialog.count()){
      await dialog.waitFor({state:'visible',timeout:5000});
      await page.screenshot({path:`ui-artifacts/${test.name}-theme-dialog.png`,fullPage:true});
    }
  }
  await page.close();
}

await browser.close();
if(failures.length){
  console.error('❌ Smoke visual falhou\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('✅ Smoke visual concluído em desktop e mobile.');
