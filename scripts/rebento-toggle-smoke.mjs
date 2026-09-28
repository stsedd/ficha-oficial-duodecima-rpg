import { chromium } from 'playwright';

const base=process.env.UI_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const failures=[];

for(const test of [
  {name:'desktop',viewport:{width:1440,height:1100}},
  {name:'mobile',viewport:{width:390,height:844}}
]){
  const context=await browser.newContext({viewport:test.viewport});
  await context.addInitScript(()=>{
    const key='duodecima_universal_stage4_v24';
    if(sessionStorage.getItem('__rebento_toggle_seeded__')==='1')return;
    sessionStorage.setItem('__rebento_toggle_seeded__','1');
    const zero={for:0,des:0,con:0,int:0,fe:0,car:0};
    localStorage.setItem(key,JSON.stringify({
      schemaVersion:24,isCreated:true,name:'Rebento Toggle QA',player:'CI',level:50,godId:'iuppiter',
      baseAttributes:{for:0,des:0,con:4,int:0,fe:0,car:4},levelAttributes:{...zero},attributeExtras:{...zero},
      initialSkills:[],levelSkillChoices:{20:'',40:''},skillMeta:{},talents:[],talentDraftId:'',
      lineage:{type:'normal',namingVersion:2,secondaryGodId:'',structureGodId:'iuppiter',compoundPassiveReplacements:[],compoundActiveReplacements:[],compoundActiveSlots:[],directPrimaryPassives:[],directSecondaryPassives:[]},
      magic:{enabled:false,castingAttr:'fe',circle:1,sacrifices:{for:0,des:0,con:0},spells:[],concentrationSpellId:'',concentrationDamage:0,highCircleUsed:{6:0,7:0,8:0,9:0},notes:''},
      roma:{fame:0,fameEntries:[],rebentoApproved:false,rebentoAttributes:[],successorOfRebento:false,affinities:[],affinityEntries:[],legionRank:'',religioRank:'',customRank:'',job:'',jobSalary:0,jobPeriod:'',cohort:'',citizenship:'',legionYears:0,serviceMarks:0,retired:false,titles:[],permissions:[],deeds:[],notes:''},
      currentHp:null,currentEnergy:null,currentSanity:100,resourceCurrent:0,resourceValues:{},targetResources:{},
      abilityStakes:{},abilityChoices:{},choiceDetails:{},abilityUses:{},conditions:[],exhaustion:0,
      death:{successes:0,failures:0,stable:false,dead:false,atZero:false,lastRoll:null,returnCount:0},
      tempMods:{rolls:0,defense:0,damageReduction:0},fortunaBlessing:false,fortunaBlessingMonth:'',skillTrainings:[],weapons:[],
      armor:{equipped:false,name:'Armadura',type:'nenhuma',material:'ferro-aco',resistanceCurrent:3,imageUrl:'',isHeritage:false,notes:''},
      shield:{equipped:false,name:'Escudo',material:'ferro-aco',stakes:0,resistanceCurrent:3,masterTalent:false,imageUrl:'',isHeritage:false,notes:''},
      inventory:{aureus:0,denarius:0,items:[],notes:''},familiars:{entries:[],mountFameClaimed:false,notes:''},
      activeTab:'status',appearance:{mode:'dark',palette:'navy',special:'none',exclusiveThemeId:''},
      history:{summary:'',goals:'',relationships:'',milestones:'',origin:'',age:'',affiliation:'',description:'',tagline:'',birth:'',residence:'',portraitUrl:'',bannerUrl:'',bannerSourceUrl:'',bannerPositionX:50,bannerPositionY:50,bannerScale:100},notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    }));
  });

  const page=await context.newPage();
  page.on('pageerror',error=>failures.push(`${test.name}: pageerror ${error.message}`));
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#sheetView:not(.hidden)',{state:'visible',timeout:30000});
  await page.waitForSelector('.rebento-profile-toggle',{state:'visible',timeout:10000});

  const before=await page.evaluate(()=>({
    active:document.querySelector('.rebento-profile-toggle')?.getAttribute('aria-pressed'),
    text:document.querySelector('.rebento-profile-toggle')?.textContent||''
  }));
  if(before.active!=='false'||!/Marcar como Rebento de Roma/.test(before.text))failures.push(`${test.name}: controle não iniciou desmarcado`);

  await Promise.all([
    page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null),
    page.locator('.rebento-profile-toggle').click()
  ]);
  await page.waitForSelector('.rebento-profile-toggle[aria-pressed="true"]',{state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.body.dataset.rebento==='true',{timeout:10000});

  const after=await page.evaluate(()=>{
    const stored=JSON.parse(localStorage.getItem('duodecima_universal_stage4_v24')||'null');
    return {
      approved:stored?.roma?.rebentoApproved===true,
      selectors:document.querySelectorAll('[data-rebento-slot]').length,
      body:document.body.dataset.rebento,
      text:document.querySelector('.rebento-profile-toggle')?.textContent||''
    };
  });
  if(!after.approved)failures.push(`${test.name}: clique não persistiu rebentoApproved=true`);
  if(after.selectors!==2)failures.push(`${test.name}: ativação deveria exibir 2 seletores, encontrou ${after.selectors}`);
  if(after.body!=='true')failures.push(`${test.name}: camada visual não ativou após marcar Rebento`);
  if(!/Rebento de Roma/.test(after.text))failures.push(`${test.name}: rótulo ativo não apareceu`);

  await Promise.all([
    page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null),
    page.locator('[data-rebento-slot="0"]').selectOption('con')
  ]);
  await page.waitForSelector('[data-rebento-slot="1"]',{state:'visible',timeout:15000});
  await Promise.all([
    page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null),
    page.locator('[data-rebento-slot="1"]').selectOption('car')
  ]);
  await page.waitForSelector('.rebento-profile-toggle[aria-pressed="true"]',{state:'visible',timeout:15000});

  const selected=await page.evaluate(()=>{
    const stored=JSON.parse(localStorage.getItem('duodecima_universal_stage4_v24')||'null');
    return {attrs:stored?.roma?.rebentoAttributes||[],extras:stored?.attributeExtras||{}};
  });
  if(selected.attrs.join(',')!=='con,car')failures.push(`${test.name}: seletores não persistiram CON/CAR (${selected.attrs.join(',')})`);
  if(Number(selected.extras.con)!==1||Number(selected.extras.car)!==1)failures.push(`${test.name}: +1 de Rebento não foi aplicado aos dois atributos`);

  await context.close();
}

await browser.close();
if(failures.length){
  console.error('❌ Rebento toggle smoke falhou\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('✅ Rebento pode ser marcado pelo perfil e os dois +1 persistem em desktop e mobile.');
