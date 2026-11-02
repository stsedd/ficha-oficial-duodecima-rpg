/* QA focalizado da v5.37.1 — roda independentemente de outras seções da ficha. */
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const base=process.env.UI_BASE_URL||'http://127.0.0.1:4173/';
const failures=[];
const sizes=[{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844},{name:'desktop-wide',width:2200,height:1000}];

try {
  for(const test of sizes){
    const context=await browser.newContext({viewport:{width:test.width,height:test.height}});
    await context.addInitScript(()=>{
      localStorage.setItem('duodecima_universal_stage4_v24',JSON.stringify({
        schemaVersion:24,isCreated:true,name:'QA de perícias',player:'CI',level:25,godId:'iuppiter',activeTab:'status',
        lineage:{type:'normal',namingVersion:2,secondaryGodId:'',structureGodId:'iuppiter'},
        baseAttributes:{for:0,des:4,con:3,int:2,fe:4,car:0},
        skillMeta:{},initialSkills:[],levelSkillChoices:{20:'',40:''},
        appearance:{mode:'dark',palette:'red',special:'none',exclusiveThemeId:''}
      }));
    });
    const page=await context.newPage();
    page.on('pageerror',err=>failures.push(test.name+': erro JS: '+err.message));
    try{
      await page.goto(base,{waitUntil:'networkidle',timeout:60000});
      await page.waitForSelector('#sheetView:not(.hidden) .skill-ledger-row',{timeout:25000});
      const layout=await page.evaluate(()=>{
        const row=document.querySelector('#sheetView .skill-ledger-row');
        const q=s=>row.querySelector(s);
        const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        const labels=[...row.querySelectorAll('.skill-tiny-check')];
        const flags=q('.skill-ledger-flags'),roll=q('.skill-roll-value'),name=q('.skill-ledger-name');
        const title=q('.skill-ledger-name b'),badge=q('.skill-attr-badge'),detail=q('.skill-settings summary');
        const ledger=document.querySelector('#sheetView .skill-ledger');
        const cols=getComputedStyle(ledger).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
        return {
          flags:box(flags),p:box(labels[0]),e:box(labels[1]),roll:box(roll),
          name:box(name),title:box(title),badge:box(badge),detail:box(detail),row:box(row),
          nameDirection:getComputedStyle(name).flexDirection,
          columns:cols,skillsWidth:ledger.getBoundingClientRect().width,
          hasManual:!!q('input[data-skill-manual]'),
          hasExpertise:!!q('input[data-skill-expertise]'),
          hasSource:!!q('[data-skill-source]')||!!q('.skill-source-tags'),
          hasDetail:!!q('[data-skill-detail]')
        };
      });
      const label=test.name+': ';
      if(layout.nameDirection!=='row')failures.push(label+'nome ainda vertical');
      if(Math.abs(layout.p.y-layout.e.y)>3)failures.push(label+'P/E desalinhados verticalmente');
      if(layout.p.width<30||layout.e.width<30||layout.p.height<(test.name==='mobile'?39:32))failures.push(label+'áreas P/E insuficientes');
      if(!(layout.p.right<=layout.roll.x+2&&layout.roll.right<=layout.name.x+2&&layout.name.right<=layout.detail.x+2))failures.push(label+'ordem das colunas incorreta');
      if(layout.detail.width<(test.name==='mobile'?39:36))failures.push(label+'botão de detalhes muito pequeno');
      if(layout.row.right<layout.detail.right-2)failures.push(label+'detalhes escaparam da linha');
      if(layout.name.right>layout.detail.x+2)failures.push(label+'nome invadiu detalhes');
      if(test.name!=='mobile'&&Math.abs(layout.title.y-layout.badge.y)>9)failures.push(label+'atributo separado do nome');
      if(!(layout.hasManual&&layout.hasExpertise&&layout.hasSource&&layout.hasDetail))failures.push(label+'inputs mecânicos ausentes');
      if(layout.columns!==(layout.skillsWidth>=890?2:1))failures.push(label+'número de colunas não respeita container: '+layout.columns+' / '+layout.skillsWidth);
      await page.locator('#sheetView .skill-ledger-row .skill-settings summary').first().click();
      const detailsVisible=await page.locator('#sheetView .skill-ledger-row .skill-settings[open] [data-skill-detail]').first().isVisible();
      if(!detailsVisible)failures.push(label+'detalhes não expandem');
      console.log('Perícias',test.name,JSON.stringify({columns:layout.columns,skillsWidth:layout.skillsWidth,nameDirection:layout.nameDirection,flags:[layout.p.width,layout.p.height],detail:layout.detail.width}));
    }catch(e){failures.push(test.name+': '+e.message)}
    await context.close();
  }
}finally{
  await browser.close();
}
if(failures.length){console.error('❌ QA perícias v5.37.1\n- '+failures.join('\n- '));process.exit(1)}
console.log('✅ Perícias: desktop 1440, mobile 390 e desktop largo 2200 validados.');
