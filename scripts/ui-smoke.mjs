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
  try{await page.waitForSelector('#rebentoSuccessorToggle',{state:'attached',timeout:7000})}catch(_){failures.push(`${test.name}: toggle Sucessor de Rebento não apareceu na criação`)}
  await page.screenshot({path:`ui-artifacts/${test.name}-creation.png`,fullPage:true});
  const layout=await page.evaluate(()=>({
    viewport:window.innerWidth,
    scroll:document.documentElement.scrollWidth,
    core:document.querySelector('#coreStatus')?.textContent?.trim()||'',
    creationVisible:!document.querySelector('#creationView')?.classList.contains('hidden'),
    successorToggle:!!document.querySelector('#rebentoSuccessorToggle')
  }));
  if(!layout.creationVisible)failures.push(`${test.name}: tela de criação não está visível`);
  if(layout.scroll>layout.viewport+2)failures.push(`${test.name}: overflow horizontal ${layout.scroll}px > ${layout.viewport}px`);
  if(!layout.core)failures.push(`${test.name}: status do Core ausente`);
  if(!layout.successorToggle)failures.push(`${test.name}: controle de sucessor ausente`);

  if(layout.successorToggle){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null),
      page.locator('#rebentoSuccessorToggle').click()
    ]);
    await page.waitForSelector('#rebentoSuccessorToggle',{state:'attached',timeout:10000});
    const successor=await page.evaluate(()=>({
      checked:document.querySelector('#rebentoSuccessorToggle')?.checked===true,
      nine:[...document.querySelectorAll('#creationView .label')].some(x=>/9 pontos de atributos/i.test(x.textContent||'')),
      energy:Number(window.DUODECIMA_SYSTEM?.energy?.base||0)
    }));
    if(!successor.checked)failures.push(`${test.name}: sucessor não persistiu após recarregar`);
    if(!successor.nine)failures.push(`${test.name}: criação de sucessor não mostrou 9 pontos`);
    if(successor.energy!==125)failures.push(`${test.name}: Energia base de sucessor esperada 125, recebeu ${successor.energy}`);
  }

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

// Regressão integrada: sucessor + Rebento, teto 6, bônus protegido, sacrifício e visual sem trocar o tema.
for(const test of cases){
  const context=await browser.newContext({viewport:test.viewport});
  await context.addInitScript(()=>{
    const key='duodecima_universal_stage4_v24';
    const zero={for:0,des:0,con:0,int:0,fe:0,car:0};
    const seed={
      schemaVersion:24,isCreated:true,name:'Rebento QA',player:'CI',level:50,godId:'iuppiter',
      baseAttributes:{for:0,des:0,con:5,int:0,fe:0,car:5},levelAttributes:{...zero},attributeExtras:{...zero,con:1,car:1},
      initialSkills:[],levelSkillChoices:{20:'',40:''},skillMeta:{},talents:[],talentDraftId:'',
      lineage:{type:'normal',namingVersion:2,secondaryGodId:'',structureGodId:'iuppiter',compoundPassiveReplacements:[],compoundActiveReplacements:[],compoundActiveSlots:[],directPrimaryPassives:[],directSecondaryPassives:[]},
      magic:{enabled:true,castingAttr:'fe',circle:1,sacrifices:{for:0,des:0,con:1},spells:[],concentrationSpellId:'',concentrationDamage:0,highCircleUsed:{6:0,7:0,8:0,9:0},notes:''},
      roma:{fame:0,fameEntries:[],rebentoApproved:true,rebentoAttributes:['con','car'],successorOfRebento:true,affinities:[],affinityEntries:[],legionRank:'',religioRank:'',customRank:'',job:'',jobSalary:0,jobPeriod:'',cohort:'',citizenship:'',legionYears:0,serviceMarks:0,retired:false,titles:[],permissions:[],deeds:[],notes:''},
      currentHp:null,currentEnergy:null,currentSanity:100,resourceCurrent:0,resourceValues:{},targetResources:{},
      abilityStakes:{},abilityChoices:{},choiceDetails:{},abilityUses:{},conditions:[],exhaustion:0,
      death:{successes:0,failures:0,stable:false,dead:false,atZero:false,lastRoll:null,returnCount:0},
      tempMods:{rolls:0,defense:0,damageReduction:0},fortunaBlessing:false,fortunaBlessingMonth:'',skillTrainings:[],weapons:[],
      armor:{equipped:false,name:'Armadura',type:'nenhuma',material:'ferro-aco',resistanceCurrent:3,imageUrl:'',isHeritage:false,notes:''},
      shield:{equipped:false,name:'Escudo',material:'ferro-aco',stakes:0,resistanceCurrent:3,masterTalent:false,imageUrl:'',isHeritage:false,notes:''},
      inventory:{aureus:0,denarius:0,items:[],notes:''},familiars:{entries:[],mountFameClaimed:false,notes:''},
      activeTab:'status',appearance:{mode:'light',palette:'pink',special:'none',exclusiveThemeId:''},
      history:{summary:'',goals:'',relationships:'',milestones:'',origin:'',age:'',affiliation:'',description:'',tagline:'',birth:'',residence:'',portraitUrl:'',bannerUrl:'',bannerSourceUrl:'',bannerPositionX:50,bannerPositionY:50,bannerScale:100},notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    };
    localStorage.setItem(key,JSON.stringify(seed));
  });
  const page=await context.newPage();
  page.on('pageerror',error=>failures.push(`${test.name}-rebento: pageerror ${error.message}`));
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#sheetView:not(.hidden)',{state:'visible',timeout:30000});
  await page.waitForFunction(()=>document.body.dataset.rebento==='true',{timeout:10000});
  const result=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#sheetView .attr')];
    const byName=abbr=>cards.find(card=>(card.querySelector('.attr-name')?.textContent||'').startsWith(`${abbr} ·`));
    const car=byName('CAR'),con=byName('CON'),embers=document.querySelector('.fire-embers'),mainCard=document.querySelector('#sheetView .card');
    let stored=null;try{stored=JSON.parse(localStorage.getItem('duodecima_universal_stage4_v24')||'null')}catch(_){}
    return {
      rebento:document.body.dataset.rebento,
      palette:document.body.dataset.palette,
      mode:document.body.dataset.mode,
      special:document.body.dataset.special,
      energy:Number(window.DUODECIMA_SYSTEM?.energy?.base||0),
      carTotal:Number(car?.querySelector('.attr-total')?.textContent||NaN),
      conTotal:Number(con?.querySelector('.attr-total')?.textContent||NaN),
      conBreak:con?.querySelector('.attr-break')?.textContent||'',
      rebentoCards:document.querySelectorAll('#sheetView .attr.has-rebento-bonus').length,
      selected:[...(stored?.roma?.rebentoAttributes||[])],
      extras:{...(stored?.attributeExtras||{})},
      particles:embers?getComputedStyle(embers).display:'missing',
      particleColor:embers?.querySelector('i')?getComputedStyle(embers.querySelector('i')).backgroundColor:'',
      glow:mainCard?getComputedStyle(mainCard).filter:'none',
      legacyMagicPatch:[...document.scripts].some(script=>script.src.includes('magic-sacrifice-sync-v5153.js')),
      scroll:document.documentElement.scrollWidth,
      viewport:window.innerWidth
    };
  });
  if(result.rebento!=='true')failures.push(`${test.name}-rebento: marcador visual de Rebento ausente`);
  if(result.palette!=='pink'||result.mode!=='light'||result.special!=='none')failures.push(`${test.name}-rebento: visual alterou o tema escolhido (${result.palette}/${result.mode}/${result.special})`);
  if(result.energy!==125)failures.push(`${test.name}-rebento: sucessor + Rebento deveria manter Energia base 125, recebeu ${result.energy}`);
  if(result.carTotal!==6)failures.push(`${test.name}-rebento: CAR com +1 de Rebento deveria chegar a 6, recebeu ${result.carTotal}`);
  if(result.conTotal!==5)failures.push(`${test.name}-rebento: CON 5 + Rebento 1 − sacrifício 1 deveria exibir 5, recebeu ${result.conTotal}`);
  if(!/extra \+1/.test(result.conBreak)||!/magia [−-]1/.test(result.conBreak))failures.push(`${test.name}-rebento: detalhamento de CON não separou bônus protegido e sacrifício (${result.conBreak})`);
  if(new Set(result.selected).size!==2||result.selected.length!==2)failures.push(`${test.name}-rebento: bônus não permaneceu em dois atributos diferentes`);
  if(Number(result.extras.con)!==1||Number(result.extras.car)!==1)failures.push(`${test.name}-rebento: bônus de Rebento não permaneceu protegido no estado`);
  if(result.particles!=='block')failures.push(`${test.name}-rebento: partículas de brasa não foram ativadas fora do tema Brasa`);
  if(result.glow==='none')failures.push(`${test.name}-rebento: glow dourado não foi aplicado aos cards`);
  if(result.legacyMagicPatch)failures.push(`${test.name}-rebento: patch legado magic-sacrifice-sync ainda está sendo carregado`);
  if(result.scroll>result.viewport+2)failures.push(`${test.name}-rebento: overflow horizontal ${result.scroll}px > ${result.viewport}px`);
  await page.screenshot({path:`ui-artifacts/${test.name}-rebento-pink-light.png`,fullPage:true});
  await context.close();
}

await browser.close();
if(failures.length){
  console.error('❌ Smoke visual falhou\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('✅ Smoke visual concluído em desktop e mobile, incluindo Rebento + sucessor + sacrifício.');