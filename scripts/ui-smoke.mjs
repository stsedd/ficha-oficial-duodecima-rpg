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

  const bannerCheck=await page.evaluate(async()=>{
    const cover=document.querySelector('#siteBanner'),img=document.querySelector('#siteBannerImage');
    if(!cover||!img)return {missing:true};
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="400" viewBox="0 0 1800 400"><rect width="1800" height="400" fill="#d44"/><rect x="0" width="80" height="400" fill="#fff"/><rect x="1720" width="80" height="400" fill="#fff"/></svg>`;
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    img.classList.remove('hidden');
    img.style.objectPosition='50% 50%';
    img.style.transform='scale(1)';
    try{await img.decode()}catch(_){}
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const rect=cover.getBoundingClientRect(),coverStyle=getComputedStyle(cover),imgStyle=getComputedStyle(img);
    return {missing:false,width:rect.width,height:rect.height,ratio:rect.width/rect.height,maxHeight:coverStyle.maxHeight,objectFit:imgStyle.objectFit};
  });
  if(bannerCheck.missing)failures.push(`${test.name}: banner não encontrado`);
  else{
    if(Math.abs(bannerCheck.ratio-4.5)>.03)failures.push(`${test.name}: banner 1800x400 renderizou em ${bannerCheck.ratio.toFixed(3)}:1 (${bannerCheck.width.toFixed(1)}x${bannerCheck.height.toFixed(1)})`);
    if(bannerCheck.maxHeight!=='none')failures.push(`${test.name}: banner ainda tem max-height ${bannerCheck.maxHeight}`);
    if(bannerCheck.objectFit!=='contain')failures.push(`${test.name}: banner em 100% ainda usa object-fit ${bannerCheck.objectFit}`);
    await page.screenshot({path:`ui-artifacts/${test.name}-banner-1800x400.png`,fullPage:false});
  }

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
