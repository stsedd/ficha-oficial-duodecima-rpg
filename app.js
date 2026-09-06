(() => {
  'use strict';

  const SCHEMA_VERSION = 21;
  const STORAGE_KEY = 'duodecima_universal_stage4_v21';
  const LEGACY_KEYS = [
    'duodecima_universal_stage3a_v20','duodecima_universal_stage2m_v19','duodecima_universal_stage2l_v18','duodecima_universal_stage2k_v17','duodecima_universal_stage2h_v14','duodecima_universal_stage2g_v13','duodecima_universal_stage2f_v12','duodecima_universal_stage2e_v11','duodecima_universal_stage2d_v10','duodecima_universal_stage2c_v9','duodecima_universal_stage2b_v8','duodecima_universal_stage2a_v7','duodecima_universal_stage1f_v6','duodecima_universal_stage1e_v5','duodecima_universal_stage1d_v4',
    'duodecima_universal_stage1c_v3','duodecima_universal_stage1b_v2','duodecima_universal_stage1a_v1'
  ];
  const ATTRS = [
    ['for','FOR','Força'],['des','DES','Destreza'],['con','CON','Constituição'],
    ['int','INT','Inteligência'],['fe','FÉ','Fé'],['car','CAR','Carisma']
  ];
  const GROUP_ORDER = ['Triunviro','Dii Consentis','Dii Inferi','Alati','Ventis','Numina'];
  const GROUP_LABEL = {
    'Triunviro':'Triunviros','Dii Consentis':'Dii Consentis','Dii Inferi':'Dii Inferi',
    'Alati':'Alati','Ventis':'Ventis','Numina':'Numina'
  };
  const INVENTORY_CATEGORIES = [
    ['geral','Geral'],['arma','Arma'],['arma-magica','Arma mágica'],['armadura','Armadura'],['escudo','Escudo'],
    ['heranca','Herança'],['reliquia','Relíquia'],['consumivel','Consumível'],['material','Material'],['crafting','Crafting'],
    ['ferramenta','Ferramenta'],['missao','Missão'],['magico','Mágico / especial'],['outro','Outro']
  ];

  const gods = window.DUODECIMA_GODS || [];
  const skills = window.DUODECIMA_SKILLS || [];
  const abilitiesDb = window.DUODECIMA_ABILITIES || {};
  const system = window.DUODECIMA_SYSTEM || {conditions:[],materials:[],armorTypes:[],weaponTypes:[]};
  const talentsDb = window.DUODECIMA_TALENTS || [];
  const magicRules = window.DUODECIMA_MAGIC || {circles:[],castingAttributes:['int','fe','car'],maxSacrifices:3,sacrificeEnergyEach:25,hpProgressionPenalty:2,highCircleUses:{6:2,7:2,8:1,9:1}};
  const romaRules = window.DUODECIMA_ROMA || {fameBands:[],affinityMarks:[-50,-25,0,30,60,100],legionRanks:[],religioRanks:[]};
  const familiarRules = window.DUODECIMA_FAMILIARS || {types:{auxiliar:{name:'Auxiliar',hpBase:15,hpPerTen:5,attributePoints:5,skillCount:1},montaria:{name:'Montaria',hpBase:40,hpPerTen:5,attributePoints:5,skillCount:2},lendario:{name:'Lendário',legendary:true,actions:2}}};
  const creationView = document.querySelector('#creationView');
  const sheetView = document.querySelector('#sheetView');
  const toast = document.querySelector('#toast');
  const safeStorage = (() => {
    try {
      const probe='__duodecima_probe__';
      window.localStorage.setItem(probe,'1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (err) {
      const memory = {};
      return {
        getItem: key => Object.prototype.hasOwnProperty.call(memory,key) ? memory[key] : null,
        setItem: (key,val) => { memory[key] = String(val); },
        removeItem: key => { delete memory[key]; }
      };
    }
  })();

  const emptyAttrs = () => ({for:0,des:0,con:0,int:0,fe:0,car:0});
  const defaultDeath = () => ({successes:0,failures:0,stable:false,dead:false,atZero:false,lastRoll:null,returnCount:0});
  const defaultArmor = () => ({equipped:false,name:'Armadura',type:'nenhuma',material:'ferro-aco',resistanceCurrent:3,imageUrl:''});
  const defaultShield = () => ({equipped:false,name:'Escudo',material:'ferro-aco',stakes:0,resistanceCurrent:3,masterTalent:false,imageUrl:''});
  const defaultTempMods = () => ({rolls:0,defense:0,damageReduction:0});
  const defaultLineage = () => ({type:'normal',secondaryGodId:'',structureGodId:'',compoundPassiveReplacements:[],compoundActiveReplacements:[],compoundActiveSlots:[],directPrimaryPassives:[],directSecondaryPassives:[]});
  const defaultMagic = () => ({enabled:false,castingAttr:'fe',circle:1,sacrifices:{for:0,des:0,con:0},spells:[],concentrationSpellId:'',concentrationDamage:0,highCircleUsed:{6:0,7:0,8:0,9:0},notes:''});
  const defaultInventory = () => ({aureus:0,denarius:0,items:[],notes:''});
  const defaultFamiliar = (type='auxiliar') => ({id:uid('fam'),name:'Novo familiar',type,active:false,currentHp:null,attributes:emptyAttrs(),skills:[],knownVip:false,staffApproved:false,legendaryHpMax:0,legendaryUsed:false,legendaryOccasion:'',notes:''});
  const defaultFamiliars = () => ({entries:[],mountFameClaimed:false,notes:''});
  const defaultRoma = () => ({fame:0,fameEntries:[],rebentoApproved:false,affinities:[],affinityEntries:[],legionRank:'',religioRank:'',customRank:'',job:'',jobSalary:0,jobPeriod:'',cohort:'',citizenship:'',legionYears:0,serviceMarks:0,retired:false,titles:[],permissions:[],deeds:[],notes:''});
  const defaultState = () => ({
    schemaVersion:SCHEMA_VERSION,isCreated:false,name:'',player:'',level:1,godId:'iuppiter',
    baseAttributes:emptyAttrs(),levelAttributes:emptyAttrs(),attributeExtras:emptyAttrs(),divineSkillChoice:'',initialSkills:[],levelSkillChoices:{20:'',40:''},skillMeta:{},lineage:defaultLineage(),talents:[],talentDraftId:'',magic:defaultMagic(),inventory:defaultInventory(),familiars:defaultFamiliars(),roma:defaultRoma(),
    currentHp:null,currentEnergy:null,currentSanity:100,resourceCurrent:0,
    abilityStakes:{},conditions:[],exhaustion:0,death:defaultDeath(),tempMods:defaultTempMods(),
    skillTrainings:[],weapons:[],armor:defaultArmor(),shield:defaultShield(),lastRoll:null,
    activeTab:'status',history:{summary:'',goals:'',relationships:'',milestones:'',origin:'',age:'',affiliation:'',description:'',tagline:'',birth:'',residence:'',portraitUrl:'',bannerUrl:''},notes:'',
    createdAt:null,updatedAt:null
  });
  let state = defaultState();

  function godById(id){return gods.find(g=>g.id===id)||null}
  function primaryGod(){return godById(state.godId)||gods[0]}
  function god(){const sid=state.lineage?.type==='direct'&&state.lineage?.structureGodId?state.lineage.structureGodId:state.godId;return godById(sid)||primaryGod()}
  function baseAbilitySet(id=state.godId){return abilitiesDb[id]||null}
  function isTriumvir(id){return godById(id)?.group==='Triunviro'}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0)}
  function talentDef(id){return talentsDb.find(t=>t.id===id)||null}
  function talentCount(id){return (state.talents||[]).filter(t=>t.talentId===id).length}
  function hasTalent(id){return talentCount(id)>0}
  function talentAttributeBonus(k){return (state.talents||[]).filter(t=>t.talentId==='aumento-atributo'&&t.params?.attribute===k).length}
  function talentGrantedSkills(){const out=[];(state.talents||[]).filter(t=>t.talentId==='perito').forEach(t=>['skill1','skill2','skill3'].forEach(k=>{const v=t.params?.[k];if(v)out.push(v)}));return [...new Set(out)]}
  function talentExpertSkills(){return [...new Set((state.talents||[]).filter(t=>t.talentId==='expert').map(t=>t.params?.skill).filter(Boolean))]}
  function magicSacrifice(k){return state.magic?.enabled&&['for','des','con'].includes(k)?clamp(Number(state.magic?.sacrifices?.[k])||0,0,3):0}
  function ordinaryAttrRaw(k){return (state.baseAttributes[k]||0)+(state.levelAttributes[k]||0)+talentAttributeBonus(k)+(god()?.bonuses?.[k]||0)}
  function attributeExtraBonus(k){return Number(state.attributeExtras?.[k])||0}
  function ordinaryAttrCapped(k){return Math.min(5,ordinaryAttrRaw(k))}
  function structuralAttr(k){return ordinaryAttrCapped(k)+attributeExtraBonus(k)-magicSacrifice(k)}
  function basePlusLevel(k){return (state.baseAttributes[k]||0)+(state.levelAttributes[k]||0)+talentAttributeBonus(k)}
  function talentSlotsEarned(){return (system.talentLevels||[1,30,60,90]).filter(n=>state.level>=n).length}
  function standardTalentsUsed(){return (state.talents||[]).filter(t=>!t.extra).length}
  function sanityAttrPenalty(k){
    const s=Number(state.currentSanity ?? 100);
    if(s<=40){if(k==='int'||k==='car')return -5;if(k==='fe')return -3;}
    if(s<=70&&(k==='int'||k==='car'))return -2;
    return 0;
  }
  function effectiveAttr(k){return structuralAttr(k)+sanityAttrPenalty(k)}
  function initialSkillLimit(){return 2+(state.baseAttributes.int||0)}
  function earnedLevelPoints(){return (system.attributeIncreaseLevels||[20,40,60,80,100]).filter(n=>state.level>=n).length}
  function spentLevelPoints(){return sum(state.levelAttributes)}
  function remainingLevelPoints(){return Math.max(0,earnedLevelPoints()-spentLevelPoints())}
  function bp(){const l=state.level,ranges=system.proficiencyRanges||[];if(ranges.length){const row=ranges.find(r=>l>=Number(r.min||0)&&(r.max==null||l<=Number(r.max)));if(row)return Number(row.bonus)||0}if(l<=20)return 1;if(l<=40)return 2;if(l<=60)return 3;if(l<=80)return 4;if(l<=99)return 5;return 6}
  function rawHpMax(){const g=god(),con=structuralAttr('con'),dec=Math.floor(state.level/10),fragility=state.magic?.enabled?(Number(magicRules.hpProgressionPenalty)||2):0,perDec=Math.max(0,g.hpPerDecade-fragility);return g.hpBase+con+dec*(perDec+con)+(talentCount('duravel')*con*(1+dec))}
  function magicSacrificeTotal(){return ['for','des','con'].reduce((t,k)=>t+magicSacrifice(k),0)}
  function rawEnergyMax(){const e=system.energy||{},base=Number(e.base??100),every=Math.max(1,Number(e.everyLevels??5)),inc=Number(e.increment??25);return base+Math.floor(state.level/every)*inc+(state.magic?.enabled?magicSacrificeTotal()*(Number(magicRules.sacrificeEnergyEach)||25):0)}
  function hpMax(){return state.exhaustion>=5?Math.max(1,Math.floor(rawHpMax()/2)):rawHpMax()}
  function energyMax(){return state.exhaustion>=5?Math.max(1,Math.floor(rawEnergyMax()/2)):rawEnergyMax()}
  function resourceMax(){const r=god()?.resource;return r?Number(r.max(state.level)):0}
  function divineGranted(){return [...(god().grantedSkills||[]),...(state.divineSkillChoice?[state.divineSkillChoice]:[])]}
  function skillAttr(name){return skills.find(s=>s.name===name)?.attr||null}
  function activeCondition(name){return state.conditions.includes(name)}
  function conditionData(name){return system.conditions.find(c=>c.name===name)}
  function conditionDefenseMod(){return state.conditions.reduce((t,n)=>t+(Number(conditionData(n)?.defenseMod)||0),0)}
  function conditionDexRollMod(){return state.conditions.reduce((t,n)=>t+(Number(conditionData(n)?.dexRollMod)||0),0)}
  function fixedDefense(){const vals=state.conditions.map(n=>conditionData(n)?.fixedDefense).filter(v=>Number.isFinite(v));return vals.length?Math.min(...vals):null}
  function energyRollPenalty(){const e=system.energy||{},ratio=Number(e.lowThresholdRatio??.5),pen=Number(e.lowPenaltyD20??-1);return state.currentEnergy<=energyMax()*ratio?pen:0}
  function exhaustionRollPenalty(){const per=Number(system.exhaustion?.d20PenaltyPerLevel??-2);return per*clamp(Number(state.exhaustion)||0,0,Number(system.exhaustion?.max??6))}
  function globalD20Penalty(){return energyRollPenalty()+exhaustionRollPenalty()}
  function attrRollConditionPenalty(k){return k==='des'?conditionDexRollMod():0}
  function castAttack(){return effectiveAttr(god().casting)+bp()+globalD20Penalty()+attrRollConditionPenalty(god().casting)}
  function castDT(){return 8+effectiveAttr(god().casting)+bp()}
  function skillTraining(name){return state.skillTrainings.find(t=>t.name===name)}
  function skillMetaFor(name){
    if(!state.skillMeta||typeof state.skillMeta!=='object')state.skillMeta={};
    if(!state.skillMeta[name])state.skillMeta[name]={proficient:false,expertise:false,source:'extras',detail:''};
    return state.skillMeta[name];
  }
  function automaticSkillSources(name){
    const out=[];
    if(state.initialSkills.includes(name))out.push('Inicial');
    if(divineGranted().includes(name))out.push('Prole');
    if(talentGrantedSkills().includes(name)||talentExpertSkills().includes(name))out.push('Talento');
    if((skillTraining(name)?.stakes||0)>=30)out.push('Treino');
    return [...new Set(out)];
  }
  function manualSkillSourceLabel(name){
    const m=skillMetaFor(name);if(!m.proficient)return '';
    return ({prole:'Prole',inicial:'Inicial',treino:'Treino','nivel-20':'Nível 20','nivel-40':'Nível 40',talento:'Talento',extras:'Extras'}[m.source]||'Extras');
  }
  function skillSources(name){const out=automaticSkillSources(name);const manual=manualSkillSourceLabel(name);if(manual&&!out.includes(manual))out.push(manual);return out}
  function skillIsProficient(name){return automaticSkillSources(name).length>0||!!skillMetaFor(name).proficient}
  function skillHasExpertise(name){return skillIsProficient(name)&&(!!skillMetaFor(name).expertise||talentExpertSkills().includes(name))}
  function skillValue(name){
    const a=skillAttr(name),base=a?effectiveAttr(a):0,trained=skillIsProficient(name),expertise=skillHasExpertise(name),fixed=god()?.skillBonuses?.[name]||0;
    let cond=attrRollConditionPenalty(a);
    if(activeCondition('Desorientado')&&(name==='Percepção'||name==='Investigação'))cond+=-2;
    const prof=trained?bp()*(expertise?2:1):0;
    return base+prof+fixed+globalD20Penalty()+cond;
  }
  function canUseInitialSkill(name){return !divineGranted().includes(name)}
  function abilityKey(a){return `${a.sourceGodId||state.godId}:${a.type}:${a.id}`}
  function stakesOf(a){return clamp(Number(state.abilityStakes?.[abilityKey(a)]||0),0,30)}
  function tierName(stakes){return stakes>=30?'30+':stakes>=16?'16–29':'0–15'}
  function tierText(a,stakes){if(!a.tiers)return a.extra||'Sem estacas mecânicas cadastradas.';return stakes>=30?a.tiers.high:stakes>=16?a.tiers.mid:a.tiers.low}
  function material(id){return system.materials.find(m=>m.id===id)||system.materials[0]||{name:'—',attack:0,resistance:0}}
  function armorType(id){return system.armorTypes.find(a=>a.id===id)||system.armorTypes[0]||{name:'—',defense:0,reduction:0}}
  function weaponType(id){return system.weaponTypes.find(w=>w.id===id)||system.weaponTypes[0]||{name:'—',die:8}}
  function armorDefense(){return state.armor?.equipped?(armorType(state.armor.type).defense||0):0}
  function armorReduction(){return state.armor?.equipped?(armorType(state.armor.type).reduction||0):0}
  function shieldDefense(){if(!state.shield?.equipped||Number(state.shield.stakes)<30)return 0;return hasTalent('mestre-escudos')?bp():Math.ceil(bp()/2)}
  function damageReduction(){return armorReduction()+(Number(state.tempMods?.damageReduction)||0)}
  function defenseBonus(){const base=hasTalent('bruto')?effectiveAttr('con'):effectiveAttr('des');return base+talentCount('defensor')+armorDefense()+shieldDefense()+(Number(state.tempMods?.defense)||0)+globalD20Penalty()+conditionDefenseMod()}
  function initiativeBonus(){return effectiveAttr('des')+globalD20Penalty()+conditionDexRollMod()}
  function weaponDiceCount(){return state.level>=80?3:state.level>=40?2:1}
  function weaponAttack(w){const a=w.attr||'for',mat=material(w.material),prof=Number(w.stakes)>=30?bp():0;return effectiveAttr(a)+(mat.attack||0)+prof+(Number(w.attackExtra)||0)+globalD20Penalty()+attrRollConditionPenalty(a)}
  function weaponDamageFormula(w){const wt=weaponType(w.type),count=weaponDiceCount(),bonus=effectiveAttr(w.attr||'for')+(Number(w.damageExtra)||0);return `${count}d${wt.die}${bonus===0?'':bonus>0?` + ${bonus}`:` - ${Math.abs(bonus)}`}`}
  function skillTrainingSlots(){return (system.skillTrainingLevels||[21,41,61,81,100]).filter(n=>state.level>=n).length}
  function availableSkillTrainingSlots(){return Math.max(0,skillTrainingSlots()-state.skillTrainings.length)}
  function levelSkillUnlocked(n){return state.level>=Number(n)}
  function levelSkillChoicesFromMeta(n){
    const source=`nivel-${Number(n)}`;
    return Object.entries(state.skillMeta||{}).filter(([,m])=>m?.proficient&&m?.source===source).map(([name])=>name);
  }
  function levelSkillChoice(n){return levelSkillChoicesFromMeta(n)[0]||''}
  function sanityBand(){
    const s=Number(state.currentSanity ?? 100);
    if(s<=0)return {name:'Perdido',cls:'danger-text',text:'Sanidade 0: perda permanente do personagem.'};
    if(s<=20)return {name:'À Beira da Loucura',cls:'warn-text',text:'Falha automática contra efeitos que causariam Abalado/Apavorado. No início do turno, teste de Fé DT 15; em falha, não pode agir. Mantém as penalidades mentais do estágio anterior.'};
    if(s<=40)return {name:'Abalado',cls:'warn-text',text:'−5 INT/CAR e −3 FÉ. Ataques que exploram medo causam dano dobrado de Sanidade.'};
    if(s<=70)return {name:'Instável',cls:'warn-text',text:'−2 INT/CAR e em testes ligados a lógica/concentração.'};
    return {name:'Estável',cls:'good-text',text:'Sem penalidade de Sanidade.'};
  }
  function energyBand(){
    if(state.currentEnergy<=0)return {name:'0 EN · Inconsciente',cls:'danger-text',text:'Energia 0 causa inconsciência imediata.'};
    if(state.currentEnergy<=energyMax()/2)return {name:'≤50% · Desgastado',cls:'warn-text',text:'−1 em todas as rolagens enquanto a Energia estiver em metade ou menos.'};
    return {name:'Energia estável',cls:'good-text',text:'Sem penalidade por Energia.'};
  }
  function notify(msg){toast.textContent=msg;toast.classList.remove('hidden');clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.add('hidden'),2800)}
  function save(){state.schemaVersion=SCHEMA_VERSION;state.updatedAt=new Date().toISOString();safeStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
  function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`}
  function migrate(data){
    const out=Object.assign(defaultState(),data||{});
    out.schemaVersion=SCHEMA_VERSION;
    const normalizeAttrLayer=(src)=>{const outAttrs=emptyAttrs();for(const k of Object.keys(outAttrs)){const n=Number(src?.[k]);outAttrs[k]=clamp(Number.isFinite(n)?Math.abs(n):0,0,5)}return outAttrs};
    // Atributos-base e pontos de nível nunca são negativos. Versões antigas puderam persistir o sinal invertido em alguns saves;
    // normalizamos o valor absoluto aqui para que, por exemplo, -5 volte a ser +5 em vez de contaminar a ficha.
    out.baseAttributes=normalizeAttrLayer(data?.baseAttributes||{});
    out.levelAttributes=normalizeAttrLayer(data?.levelAttributes||{});
    out.attributeExtras=emptyAttrs();
    for(const k of Object.keys(out.attributeExtras)){const n=Number(data?.attributeExtras?.[k]);out.attributeExtras[k]=clamp(Number.isFinite(n)?n:0,-10,10)}
    out.levelSkillChoices=Object.assign({20:'',40:''},data?.levelSkillChoices||{});
    out.skillMeta={};
    if(data?.skillMeta&&typeof data.skillMeta==='object')for(const [name,meta] of Object.entries(data.skillMeta))out.skillMeta[name]=Object.assign({proficient:false,expertise:false,source:'extras',detail:''},meta||{});
    for(const n of [20,40]){const name=data?.levelSkillChoices?.[n];if(name){out.skillMeta[name]=Object.assign({proficient:true,expertise:false,source:`nivel-${n}`,detail:''},out.skillMeta[name]||{}, {proficient:true,source:`nivel-${n}`})}}
    out.levelSkillChoices={20:'',40:''};
    out.lineage=Object.assign(defaultLineage(),data?.lineage||{});
    out.lineage.compoundPassiveReplacements=Array.isArray(data?.lineage?.compoundPassiveReplacements)?data.lineage.compoundPassiveReplacements:[];
    out.lineage.compoundActiveSlots=Array.isArray(data?.lineage?.compoundActiveSlots)?data.lineage.compoundActiveSlots.map(Number).filter(n=>n>=1&&n<=5).slice(0,2):[];
    out.lineage.compoundActiveReplacements=Array.isArray(data?.lineage?.compoundActiveReplacements)?data.lineage.compoundActiveReplacements.slice(0,2):[];
    // Migra a seleção antiga por “slot igual” para o novo modelo de substituição livre por nível.
    if(!out.lineage.compoundActiveReplacements.length&&out.lineage.compoundActiveSlots.length){
      const mainSet=abilitiesDb[out.godId],subSet=abilitiesDb[out.lineage.secondaryGodId];
      out.lineage.compoundActiveReplacements=out.lineage.compoundActiveSlots.map(slot=>{const idx=slot-1;return {primaryIndex:idx,secondaryId:subSet?.actives?.[idx]?.id||''}}).filter(r=>mainSet?.actives?.[r.primaryIndex]).slice(0,2);
    }
    out.lineage.directPrimaryPassives=Array.isArray(data?.lineage?.directPrimaryPassives)?data.lineage.directPrimaryPassives:[];
    out.lineage.directSecondaryPassives=Array.isArray(data?.lineage?.directSecondaryPassives)?data.lineage.directSecondaryPassives:[];
    out.magic=Object.assign(defaultMagic(),data?.magic||{});
    out.magic.sacrifices=Object.assign({for:0,des:0,con:0},data?.magic?.sacrifices||{});
    ['for','des','con'].forEach(k=>out.magic.sacrifices[k]=clamp(Number(out.magic.sacrifices[k])||0,0,3));
    out.magic.circle=clamp(Number(out.magic.circle)||1,1,9);
    out.magic.spells=Array.isArray(data?.magic?.spells)?data.magic.spells.map(sp=>Object.assign({id:uid('spell'),name:'',circle:1,components:{v:false,s:false,m:false},concentration:false,ritual:false,source:'',notes:''},sp,{components:Object.assign({v:false,s:false,m:false},sp?.components||{})})):[];
    out.magic.highCircleUsed=Object.assign({6:0,7:0,8:0,9:0},data?.magic?.highCircleUsed||{});
    [6,7,8,9].forEach(c=>out.magic.highCircleUsed[c]=Math.max(0,Number(out.magic.highCircleUsed[c])||0));
    out.inventory=Object.assign(defaultInventory(),data?.inventory||{});
    out.inventory.aureus=Math.max(0,Number(out.inventory.aureus)||0);
    out.inventory.denarius=Math.max(0,Number(out.inventory.denarius)||0);
    out.inventory.items=Array.isArray(data?.inventory?.items)?data.inventory.items.map(it=>Object.assign({id:uid('item'),name:'Item',qty:1,category:'geral',material:'',rune:'',notes:'',imageUrl:'',showInDeck:false},it,{qty:Math.max(0,Number(it?.qty)||0),showInDeck:!!it?.showInDeck})):[];
    out.inventory.notes=typeof data?.inventory?.notes==='string'?data.inventory.notes:(typeof data?.crafting?.notes==='string'?data.crafting.notes:'');
    out.familiars=Object.assign(defaultFamiliars(),data?.familiars||{});
    out.familiars.mountFameClaimed=!!out.familiars.mountFameClaimed;
    out.familiars.entries=Array.isArray(data?.familiars?.entries)?data.familiars.entries.map(f=>{
      const type=['auxiliar','montaria','lendario'].includes(f?.type)?f.type:'auxiliar';
      const x=Object.assign(defaultFamiliar(type),f||{},{type});
      x.attributes=emptyAttrs();for(const k of Object.keys(x.attributes))x.attributes[k]=clamp(Number(f?.attributes?.[k])||0,0,5);
      x.skills=Array.isArray(f?.skills)?f.skills.filter(Boolean).slice(0,type==='auxiliar'?1:type==='montaria'?2:6):[];
      x.currentHp=f?.currentHp==null?null:Math.max(0,Number(f.currentHp)||0);x.legendaryHpMax=Math.max(0,Number(f?.legendaryHpMax)||0);
      x.active=!!f?.active;x.knownVip=!!f?.knownVip;x.staffApproved=!!f?.staffApproved;x.legendaryUsed=!!f?.legendaryUsed;return x;
    }):[];
    out.roma=Object.assign(defaultRoma(),data?.roma||{});
    out.roma.fame=Number(out.roma.fame)||0;
    out.roma.fameEntries=Array.isArray(data?.roma?.fameEntries)?data.roma.fameEntries.map(x=>Object.assign({id:uid('fame'),source:'',discordLink:'',amount:0,notes:''},x,{discordLink:x?.discordLink||'',amount:Number(x?.amount)||0})):[];
    if(!out.roma.fameEntries.length&&out.roma.fame)out.roma.fameEntries.push({id:uid('fame'),source:'Saldo migrado da ficha anterior',discordLink:'',amount:out.roma.fame,notes:''});
    out.roma.rebentoApproved=!!out.roma.rebentoApproved;
    out.roma.affinities=Array.isArray(data?.roma?.affinities)?data.roma.affinities.map(a=>Object.assign({id:uid('aff'),godId:'',value:0,notes:''},a,{value:clamp(Number(a?.value)||0,-100,100)})):[];
    out.roma.affinityEntries=Array.isArray(data?.roma?.affinityEntries)?data.roma.affinityEntries.map(x=>Object.assign({id:uid('affentry'),target:'',source:'',discordLink:'',amount:0,notes:''},x,{discordLink:x?.discordLink||'',amount:Number(x?.amount)||0})):[];
    if(!out.roma.affinityEntries.length&&out.roma.affinities.length){for(const a of out.roma.affinities){const gn=godById(a.godId)?.name||a.godId||'Afinidade migrada';out.roma.affinityEntries.push({id:uid('affentry'),target:gn,source:'Registro migrado da ficha anterior',discordLink:'',amount:Number(a.value)||0,notes:a.notes||''})}}
    out.roma.jobSalary=Math.max(0,Number(out.roma.jobSalary)||0);
    out.roma.legionYears=Math.max(0,Number(out.roma.legionYears)||0);out.roma.serviceMarks=Math.max(0,Number(out.roma.serviceMarks)||0);out.roma.retired=!!out.roma.retired;
    out.roma.titles=Array.isArray(out.roma.titles)?out.roma.titles.map(x=>typeof x==='string'?{id:uid('title'),name:x,source:'',notes:''}:Object.assign({id:uid('title'),name:'',source:'',notes:''},x)):[];
    out.roma.permissions=Array.isArray(out.roma.permissions)?out.roma.permissions.map(x=>typeof x==='string'?{id:uid('perm'),name:x,source:'',notes:''}:Object.assign({id:uid('perm'),name:'',source:'',notes:''},x)):[];
    out.roma.deeds=Array.isArray(out.roma.deeds)?out.roma.deeds.map(x=>typeof x==='string'?{id:uid('deed'),name:x,fame:0,notes:''}:Object.assign({id:uid('deed'),name:'',fame:0,notes:''},x,{fame:Number(x?.fame)||0})):[];
    out.talents=Array.isArray(data?.talents)?data.talents.map(t=>typeof t==='string'?{id:uid('talent'),talentId:t,extra:false,params:{},notes:''}:Object.assign({id:uid('talent'),talentId:'',extra:false,params:{},notes:''},t)) : [];
    out.abilityStakes=Object.assign({},data?.abilityStakes||{});
    out.conditions=Array.isArray(data?.conditions)?data.conditions:[];
    out.exhaustion=clamp(Number(data?.exhaustion)||0,0,6);
    out.death=Object.assign(defaultDeath(),data?.death||{});
    out.tempMods=Object.assign(defaultTempMods(),data?.tempMods||{});
    out.skillTrainings=Array.isArray(data?.skillTrainings)?data.skillTrainings.map(t=>({id:t.id||uid('skill'),name:t.name||'',stakes:clamp(Number(t.stakes)||0,0,30)})):[];
    out.weapons=Array.isArray(data?.weapons)?data.weapons.map(w=>Object.assign({id:uid('weapon'),name:'Arma',type:'corpo-a-corpo',attr:'for',material:'ferro-aco',stakes:0,resistanceCurrent:3,attackExtra:0,damageExtra:0,equipped:true,imageUrl:''},w)):[];
    out.armor=Object.assign(defaultArmor(),data?.armor||{});
    out.shield=Object.assign(defaultShield(),data?.shield||{});
    out.activeTab=(data?.activeTab==='abilities'?'combat':(['status','combat','inventory','familiars','roma','magic','history','notes'].includes(data?.activeTab)?data.activeTab:(data?.activeTab==='crafting'?'inventory':'status')));
    out.history=Object.assign({summary:'',goals:'',relationships:'',milestones:'',origin:'',age:'',affiliation:'',description:'',tagline:'',birth:'',residence:'',portraitUrl:'',bannerUrl:''},data?.history||{});
    out.notes=typeof data?.notes==='string'?data.notes:'';
    return out;
  }
  function load(){
    try{
      if(window.__DUODECIMA_PRELOAD__){state=migrate(window.__DUODECIMA_PRELOAD__); if(state.tempMods) state.tempMods.rolls=0; save();return;}
      let raw=safeStorage.getItem(STORAGE_KEY);
      if(!raw){for(const k of LEGACY_KEYS){raw=safeStorage.getItem(k);if(raw)break}}
      if(!raw)return;
      state=migrate(JSON.parse(raw)); if(state.tempMods) state.tempMods.rolls=0; save();
    }catch(e){console.warn(e)}
  }
  function syncCurrentCaps(){
    const h=hpMax(),e=energyMax(),r=resourceMax();
    if(state.currentHp==null)state.currentHp=h;else state.currentHp=clamp(Number(state.currentHp)||0,0,h);
    if(state.currentEnergy==null)state.currentEnergy=e;else state.currentEnergy=clamp(Number(state.currentEnergy)||0,0,e);
    state.currentSanity=clamp(Number(state.currentSanity ?? 100),0,100);
    state.resourceCurrent=clamp(state.resourceCurrent||0,0,r||0);
    (state.familiars?.entries||[]).forEach(f=>{const mx=familiarHpMax(f);if(f.currentHp==null)f.currentHp=mx;else f.currentHp=clamp(Number(f.currentHp)||0,0,mx)});
  }

  function setHp(next,{countReturn=true}={}){
    const old=Number(state.currentHp)||0;
    if(state.death.dead&&next>0){notify('O personagem está marcado como morto. Use “Intervenção narrativa” para restaurá-lo.');return;}
    state.currentHp=clamp(Number(next)||0,0,hpMax());
    if(old>0&&state.currentHp===0){state.death.successes=0;state.death.failures=0;state.death.stable=false;state.death.dead=false;state.death.atZero=true;state.death.lastRoll=null;}
    if(old===0&&state.currentHp>0&&state.death.atZero){if(countReturn)state.death.returnCount=(state.death.returnCount||0)+1;state.death.successes=0;state.death.failures=0;state.death.stable=false;state.death.dead=false;state.death.atZero=false;state.death.lastRoll=null;}
  }
  function setEnergy(next){state.currentEnergy=clamp(Number(next)||0,0,energyMax())}
  function setSanity(next){state.currentSanity=clamp(Number(next)||0,0,100)}

  function secondaryGod(){return godById(state.lineage?.secondaryGodId)}
  function eligibleLegacyGods(){return gods.filter(g=>g.id!==state.godId&&!isTriumvir(g.id))}
  function resetLineage(type='normal'){state.lineage=defaultLineage();state.lineage.type=type;if(type!=='normal'&&eligibleLegacyGods()[0])state.lineage.secondaryGodId=eligibleLegacyGods()[0].id;if(type==='direct'){state.lineage.structureGodId=state.godId;initializeDirectSelections()}}
  function initializeDirectSelections(){const a=baseAbilitySet(state.godId),b=baseAbilitySet(state.lineage?.secondaryGodId);if(a)state.lineage.directPrimaryPassives=a.passives.slice(0,4).map(x=>x.id);if(b)state.lineage.directSecondaryPassives=b.passives.slice(0,3).map(x=>x.id)}
  function effectiveAbilitySet(){
    const main=baseAbilitySet(state.godId);if(!main)return null;
    const type=state.lineage?.type||'normal';if(type==='normal'||isTriumvir(state.godId))return {passives:main.passives.map(a=>({...a,sourceGodId:state.godId})),actives:main.actives.map(a=>({...a,sourceGodId:state.godId}))};
    const sid=state.lineage?.secondaryGodId,sub=baseAbilitySet(sid);if(!sub)return {passives:main.passives.map(a=>({...a,sourceGodId:state.godId})),actives:main.actives.map(a=>({...a,sourceGodId:state.godId}))};
    if(type==='compound'){
      const passives=main.passives.map(a=>({...a,sourceGodId:state.godId}));
      (state.lineage.compoundPassiveReplacements||[]).slice(0,3).forEach(r=>{const idx=Number(r.primaryIndex),rep=sub.passives.find(x=>x.id===r.secondaryId);if(Number.isInteger(idx)&&idx>=0&&idx<passives.length&&rep)passives[idx]={...rep,sourceGodId:sid,legacyFrom:sid}});
      const actives=main.actives.map(a=>({...a,sourceGodId:state.godId}));
      (state.lineage.compoundActiveReplacements||[]).slice(0,2).forEach(r=>{
        const idx=Number(r.primaryIndex),target=main.actives[idx],rep=sub.actives.find(x=>x.id===r.secondaryId);
        if(Number.isInteger(idx)&&idx>=0&&idx<5&&target&&rep&&Number(rep.level)<=Number(target.level)) actives[idx]={...rep,sourceGodId:sid,legacyFrom:sid};
      });
      return {passives,actives};
    }
    if(type==='direct'){
      const pa=new Set(state.lineage.directPrimaryPassives||[]),pb=new Set(state.lineage.directSecondaryPassives||[]);
      return {passives:[...main.passives.filter(a=>pa.has(a.id)).map(a=>({...a,sourceGodId:state.godId})),...sub.passives.filter(a=>pb.has(a.id)).map(a=>({...a,sourceGodId:sid}))],actives:[...main.actives.slice(0,5).map(a=>({...a,sourceGodId:state.godId})),...sub.actives.slice(0,5).map(a=>({...a,sourceGodId:sid}))]};
    }
    return main;
  }
  function attrName(k){return ATTRS.find(a=>a[0]===k)?.[2]||k}
  function bonusText(g){const xs=ATTRS.filter(a=>g.bonuses?.[a[0]]).map(a=>`+${g.bonuses[a[0]]} ${a[1]}`),sk=Object.entries(g.skillBonuses||{}).map(([n,v])=>`+${v} em ${n}`);return [...xs,...sk].join(' · ')||'—'}
  function groupedGodOptions(selectedId=state.godId,list=gods){
    const groups={};list.forEach(g=>(groups[g.group]??=[]).push(g));
    const ordered=[...GROUP_ORDER,...Object.keys(groups).filter(x=>!GROUP_ORDER.includes(x))];
    return ordered.filter(group=>groups[group]?.length).map(group=>`<optgroup label="${GROUP_LABEL[group]||group}">${groups[group].map(g=>`<option value="${g.id}" ${selectedId===g.id?'selected':''}>${g.name}</option>`).join('')}</optgroup>`).join('');
  }
  function attrCard(k,abbr,label,creation=false){
    const divine=Math.max(0,Number(god()?.bonuses?.[k])||0),lvl=Math.max(0,Number(state.levelAttributes[k])||0),base=Math.max(0,Number(state.baseAttributes[k])||0),tal=Math.max(0,talentAttributeBonus(k)),raw=base+lvl+tal+divine,capped=Math.min(5,raw),extra=attributeExtraBonus(k),total=capped+extra,pen=sanityAttrPenalty(k),eff=total+pen,overflow=Math.max(0,raw-5),incDisabled=raw>=5||(!state.isCreated&&sum(state.baseAttributes)>=8);
    return `<div class="attr"><div class="attr-name">${abbr} · ${label}</div><div class="attr-total">${total}</div><div class="attr-break">base ${base} · nível +${lvl}${tal?` · talento +${tal}`:''} · divino +${divine}${extra?` · extra +${extra}`:''}${overflow?` · excedente padrão ${overflow} ignorado pelo limite 5`:''}${pen?` · penalidade de sanidade ${pen} (efetivo ${eff})`:''}</div>${creation?`<div class="stepper"><button data-base-dec="${k}">−</button><span class="base">${base}</span><button data-base-inc="${k}" ${incDisabled?'disabled':''}>+</button></div>`:''}</div>`;
  }

  function renderCreationLineage(){
    if(isTriumvir(state.godId))return `<div class="legacy-creation-box"><p class="eyebrow">LINHAGEM</p><div class="notice">${primaryGod().name} é um Triúnviro. Triúnviros usam o kit próprio e não participam da mistura por Legado.</div></div>`;
    const type=state.lineage?.type||'normal',eligible=eligibleLegacyGods(),sub=secondaryGod();
    const directStructure=state.lineage.structureGodId||state.godId;
    return `<div class="legacy-creation-box">
      <div class="section-title"><div><p class="eyebrow">LINHAGEM</p><h3>Uma ou duas origens divinas</h3></div>${type!=='normal'?'<span class="pill good">2 origens</span>':'<span class="pill">1 origem</span>'}</div>
      <p class="muted compact">Escolha aqui se a personagem é uma prole direta ou possui Legado. Ao selecionar um Legado, a segunda divindade aparece imediatamente abaixo.</p>
      <div class="grid two">
        <label><span class="label">Tipo de linhagem</span><select id="creationLineageType"><option value="normal" ${type==='normal'?'selected':''}>Prole direta · uma divindade</option><option value="compound" ${type==='compound'?'selected':''}>Legado Composto · duas divindades</option><option value="direct" ${type==='direct'?'selected':''}>Legado Direto · duas divindades</option></select></label>
        ${type!=='normal'?`<label><span class="label">Segunda origem divina</span><select id="creationSecondaryGod">${groupedGodOptions(state.lineage.secondaryGodId,eligible)}</select></label>`:'<div class="subcard compact"><b>Sem Legado</b><br><span class="muted">A ficha usa somente o kit da divindade principal.</span></div>'}
      </div>
      ${type!=='normal'&&sub?`<div class="legacy-pair-preview"><div><span class="label">Origem principal</span><b>${primaryGod().name}</b><small>${GROUP_LABEL[primaryGod().group]||primaryGod().group}</small></div><span class="legacy-plus">+</span><div><span class="label">Segunda origem</span><b>${sub.name}</b><small>${GROUP_LABEL[sub.group]||sub.group}</small></div></div>`:''}
      ${type==='compound'?'<div class="notice">Legado Composto: mantém o kit principal. Depois da criação, na própria aba Status, você escolhe até 3 passivas e até 2 das primeiras 5 ativas para substituir pelas da segunda origem.</div>':''}
      ${type==='direct'&&sub?`<div class="notice">Legado Direto: 4 passivas de uma origem + 3 da outra, e as cinco primeiras ativas dos dois kits. Nenhuma habilidade 6+ entra.</div><label style="margin-top:10px"><span class="label">Kit estrutural durante a criação · HP, conjuração, bônus e perícias divinas</span><select id="creationStructureGod"><option value="${state.godId}" ${directStructure===state.godId?'selected':''}>${primaryGod().name}</option><option value="${sub.id}" ${directStructure===sub.id?'selected':''}>${sub.name}</option></select></label>`:''}
    </div>`;
  }
  function canFinishCreation(){
    const g=god(),type=state.lineage?.type||'normal',sub=secondaryGod();
    const lineageOk=type==='normal'||(!isTriumvir(state.godId)&&!!sub&&sub.id!==state.godId&&(type!=='direct'||[state.godId,sub.id].includes(state.lineage.structureGodId||state.godId)));
    return lineageOk&&sum(state.baseAttributes)===8&&state.initialSkills.length===initialSkillLimit()&&(!g.skillChoice?.length||!!state.divineSkillChoice);
  }
  function renderCreation(){
    const g=god(),spent=sum(state.baseAttributes),left=8-spent,granted=g.grantedSkills||[],customGranted=granted.filter(s=>!skills.some(x=>x.name===s));
    const sourceClass=g.source.startsWith('Atualizado')?'good':g.source.startsWith('Provisório')?'warn':'';
    creationView.innerHTML=`
      <article class="card stack">
        <div class="section-title"><div><p class="eyebrow">1 · IDENTIDADE & DIVINDADE</p><h2>Criação</h2></div><span class="pill ${sourceClass}">${g.source}</span></div>
        <div class="grid two"><label><span class="label">Personagem</span><input id="nameInput" value="${esc(state.name)}" placeholder="Nome do personagem"></label><label><span class="label">Player</span><input id="playerInput" value="${esc(state.player)}" placeholder="Nome do player"></label></div>
        <label><span class="label">Divindade principal / primeira origem</span><select id="godSelect">${groupedGodOptions()}</select></label>${renderCreationLineage()}
        <div class="subcard compact"><div class="row between"><strong>${g.name}${state.lineage?.type==='direct'?' · kit estrutural':''}</strong><span class="pill">${GROUP_LABEL[g.group]||g.group}</span></div><p class="muted">Conjuração: <b>${attrName(g.casting)}</b> · HP: <b>${g.hpBase} + CON</b> · por 10 níveis: <b>+${g.hpPerDecade} + CON</b></p><p><span class="label">Bônus divinos</span>${bonusText(g)}</p>${granted.length?`<p><span class="label">Perícia(s) divina(s)</span>${granted.join(', ')}</p>`:''}${g.skillChoice?.length?`<label><span class="label">Escolha divina (não gasta escolhas por Inteligência)</span><select id="divineSkillChoice"><option value="">Selecione…</option>${g.skillChoice.map(s=>`<option ${state.divineSkillChoice===s?'selected':''}>${s}</option>`).join('')}</select></label>`:''}${customGranted.length?`<div class="notice">Atenção: ${customGranted.join(', ')} não existe na lista-base atual de perícias. Mantive como veio da fonte.</div>`:''}${(g.notes||[]).map(n=>`<div class="notice">${n}</div>`).join('')}</div>
        <div><div class="row between"><span class="label">8 pontos de atributos</span><b>${left} restante(s)</b></div><div class="progress"><i style="width:${clamp(spent/8*100,0,100)}%"></i></div></div>
        <div class="attrs">${ATTRS.map(a=>attrCard(...a,true)).join('')}</div><p class="dev-note">O limite normal é 5 considerando pontos da criação, progressão, talentos comuns e bônus divinos. Só efeitos que digam explicitamente ultrapassar o limite podem levar o atributo acima de 5.</p>
      </article>
      <aside class="card stack"><div><p class="eyebrow">2 · PERÍCIAS INICIAIS</p><h2>Escolhas por Inteligência</h2><p class="muted">A ficha usa <b>2 + INT inicial</b>. Bônus divinos não consomem essas escolhas.</p></div><div class="row between"><span class="pill">Limite: ${initialSkillLimit()}</span><span class="pill">Escolhidas: ${state.initialSkills.length}</span></div><div class="skills">${skills.map(s=>{const divine=divineGranted().includes(s.name),checked=state.initialSkills.includes(s.name),disabled=divine||(!checked&&state.initialSkills.length>=initialSkillLimit());return `<label class="skill-check ${disabled?'disabled':''}"><input type="checkbox" data-skill="${esc(s.name)}" ${checked?'checked':''} ${disabled?'disabled':''}><span>${s.name}<small class="muted"> · ${s.attr.toUpperCase()}${divine?' · divina':''}</small></span></label>`}).join('')}</div><button id="finishBtn" class="primary" ${canFinishCreation()?'':'disabled'}>Criar ficha de teste</button>${!canFinishCreation()?`<p class="notice">Para concluir: distribua exatamente 8 pontos, escolha ${initialSkillLimit()} perícias por INT e preencha a escolha divina quando o kit exigir.</p>`:''}</aside>`;
    bindCreation();
  }
  function bindCreation(){
    byId('nameInput').oninput=e=>{state.name=e.target.value;save()};byId('playerInput').oninput=e=>{state.player=e.target.value;save()};
    byId('godSelect').onchange=e=>{state.godId=e.target.value;state.divineSkillChoice='';state.initialSkills=[];state.resourceCurrent=0;if(isTriumvir(state.godId))resetLineage('normal');else if(state.lineage?.type!=='normal'&&state.lineage.secondaryGodId===state.godId)resetLineage(state.lineage.type);else if(state.lineage?.type==='direct')state.lineage.structureGodId=state.godId;save();renderCreation()};

    const lineageType=byId('creationLineageType');if(lineageType)lineageType.onchange=e=>{const type=e.target.value;if(type!=='normal'&&isTriumvir(state.godId)){notify('Triúnviros não participam da mistura de kits por Legado.');resetLineage('normal')}else resetLineage(type);state.divineSkillChoice='';state.initialSkills=[];save();renderCreation()};
    const lineageSecondary=byId('creationSecondaryGod');if(lineageSecondary)lineageSecondary.onchange=e=>{const previous=state.lineage.secondaryGodId;state.lineage.secondaryGodId=e.target.value;if(state.lineage.type==='direct'){if(state.lineage.structureGodId===previous)state.lineage.structureGodId=e.target.value;initializeDirectSelections()}state.divineSkillChoice='';state.initialSkills=[];save();renderCreation()};
    const structure=byId('creationStructureGod');if(structure)structure.onchange=e=>{state.lineage.structureGodId=e.target.value;state.divineSkillChoice='';state.initialSkills=[];syncCurrentCaps();save();renderCreation()};
    const d=byId('divineSkillChoice');if(d)d.onchange=e=>{state.divineSkillChoice=e.target.value;state.initialSkills=state.initialSkills.filter(s=>s!==e.target.value);save();renderCreation()};
    document.querySelectorAll('[data-base-inc]').forEach(b=>b.onclick=()=>changeBase(b.dataset.baseInc,1));document.querySelectorAll('[data-base-dec]').forEach(b=>b.onclick=()=>changeBase(b.dataset.baseDec,-1));document.querySelectorAll('[data-skill]').forEach(c=>c.onchange=()=>toggleInitialSkill(c.dataset.skill,c.checked));byId('finishBtn').onclick=finishCreation;
  }
  function changeBase(k,delta){const cur=state.baseAttributes[k]||0;if(delta>0&&ordinaryAttrRaw(k)>=5)return;if(delta>0&&!state.isCreated&&sum(state.baseAttributes)>=8)return;if(delta<0&&cur<=0)return;state.baseAttributes[k]=cur+delta;const limit=initialSkillLimit();if(state.initialSkills.length>limit)state.initialSkills=state.initialSkills.slice(0,limit);syncCurrentCaps();save();state.isCreated?renderSheet():renderCreation()}
  function toggleInitialSkill(name,on){if(!canUseInitialSkill(name))return;if(on&&!state.initialSkills.includes(name)&&state.initialSkills.length<initialSkillLimit())state.initialSkills.push(name);if(!on)state.initialSkills=state.initialSkills.filter(s=>s!==name);save();renderCreation()}
  function finishCreation(){if(!canFinishCreation())return;state.isCreated=true;state.createdAt=state.createdAt||new Date().toISOString();syncCurrentCaps();save();render();notify('Ficha criada.')}

  function renderTabs(){
    const tabs=[['status','Visão geral'],['combat','Combate & Poderes'],['inventory','Inventário'],['familiars','Familiares'],['roma','Roma'],['magic','Magia'],['history','História'],['notes','Notas']];
    return `<nav class="sheet-tabs" aria-label="Seções da ficha">${tabs.map(([id,label],idx)=>`<button type="button" data-tab="${id}" class="${state.activeTab===id?'active':''}"><span>${String(idx+1).padStart(2,'0')}</span>${label}</button>`).join('')}</nav>`;
  }
  function resourceAdjustBox(kind,label,current,max,quick,context='status',showBand=false){
    const inputId=`${context}-${kind}Manual`;
    const quickButtons=quick.map(v=>`<button type="button" data-${kind}="${v}">${Number(v)>0?'+':''}${v}</button>`).join('');
    const full=kind==='en'?'<button type="button" data-en-full="1">Máx.</button>':'';
    const band=showBand&&kind==='san'?sanityBand():null;
    const ratio=max?clamp((Number(current)||0)/Number(max)*100,0,100):0;
    return `<div class="resource-chip resource-${kind}"><div class="row between"><span>${label}</span><strong>${current}/${max}</strong></div><div class="resource-meter"><i style="width:${ratio}%"></i></div><div class="mini-actions">${quickButtons}${full}</div><div class="resource-manual"><input id="${inputId}" data-resource-manual-input="${kind}" type="number" step="1" placeholder="Ex.: -37 ou 20"><button type="button" data-manual-resource="${kind}" data-manual-input="${inputId}">Aplicar</button></div>${band?`<div class="status-line ${band.cls}"><b>${band.name}</b><span>${band.text}</span></div>`:''}</div>`;
  }
  function renderResourceDock(){
    const g=god(),rMax=resourceMax(),band=sanityBand();
    const core=(kind,label,current,max,extra='')=>{const inputId=`status-${kind}Manual`,ratio=max?clamp((Number(current)||0)/Number(max)*100,0,100):0;return `<div class="core-stat core-${kind}"><div class="core-stat-label">${label}</div><div class="core-stat-value">${current}<small>/${max}</small></div><div class="core-stat-meter"><i style="width:${ratio}%"></i></div>${extra}<div class="core-stat-adjust"><input id="${inputId}" data-resource-manual-input="${kind}" type="number" step="1" placeholder="+/−"><button type="button" data-manual-resource="${kind}" data-manual-input="${inputId}" title="Aplicar">↵</button></div></div>`};
    return `<section class="status-core-strip">
      ${core('hp','HP',state.currentHp,hpMax())}
      ${core('san','Sanidade',state.currentSanity,100,`<div class="core-stat-caption">${band.name}</div>`)}
      <div class="core-stat core-defense"><div class="core-stat-label">Defesa</div><div class="core-stat-value">${signed(defenseBonus())}</div><div class="core-stat-caption">1d20 ${signed(defenseBonus())}</div><div class="core-stat-caption muted-mini">DES + equipamento</div></div>
      ${core('en','Energia',state.currentEnergy,energyMax())}
      ${g.resource?core('resource',g.resource.name,state.resourceCurrent,rMax,`<div class="core-stat-caption">Acúmulo</div>`):''}
      <div class="core-stat core-cast"><div class="core-stat-label">Conjuração</div><div class="core-stat-value">${signed(castAttack())}</div><div class="core-stat-caption">DT ${castDT()} · ${attrName(g.casting)}</div></div>
    </section>`;
  }
  function renderCombatResourceDock(){
    const g=god(),rMax=resourceMax();
    const mini=(kind,label,current,max)=>{const inputId=`combat-${kind}Manual`,ratio=max?clamp((Number(current)||0)/Number(max)*100,0,100):0;return `<div class="combat-resource-chip resource-${kind}"><span>${label}</span><strong>${current}<small>/${max}</small></strong><div class="combat-mini-meter"><i style="width:${ratio}%"></i></div><div class="combat-resource-adjust"><input id="${inputId}" data-resource-manual-input="${kind}" type="number" step="1" placeholder="+/−"><button type="button" data-manual-resource="${kind}" data-manual-input="${inputId}" title="Aplicar">↵</button></div></div>`};
    return `<section class="combat-resource-dock">
      ${mini('hp','HP',state.currentHp,hpMax())}
      ${mini('en','Energia',state.currentEnergy,energyMax())}
      ${mini('san','Sanidade',state.currentSanity,100)}
      ${g.resource?mini('resource',g.resource.name,state.resourceCurrent,rMax).replace(`data-manual-resource="resource"`,'data-manual-resource="resource"').replace(`data-resource-manual-input="resource"`,'data-resource-manual-input="resource"'):''}
    </section>`;
  }
  function renderResourceSummaryPanel(){
    const g=god(),band=sanityBand(),energy=energyBand(),specialMax=resourceMax();
    return `<article class="card resource-summary-card"><p class="eyebrow">FOCO DO SISTEMA</p><h2>Combate rápido</h2><div class="resource-summary-grid">
      <div class="stat compact-stat"><span>HP</span><strong>${state.currentHp}/${hpMax()}</strong><small>${Math.round((state.currentHp/Math.max(1,hpMax()))*100)}%</small></div>
      <div class="stat compact-stat"><span>Energia</span><strong>${state.currentEnergy}/${energyMax()}</strong><small>${energy.name}</small></div>
      <div class="stat compact-stat"><span>Sanidade</span><strong>${state.currentSanity}/100</strong><small>${band.name}</small></div>
      <div class="stat compact-stat"><span>Defesa base</span><strong>${signed(defenseBonus())}</strong><small>DES + armadura + escudo</small></div>
      <div class="stat compact-stat"><span>Conjuração</span><strong>${signed(castAttack())}</strong><small>DT ${castDT()} · ${attrName(g.casting)}</small></div>
      ${g.resource?`<div class="stat compact-stat"><span>${g.resource.name}</span><strong>${state.resourceCurrent}/${specialMax}</strong><small>acúmulo</small></div>`:''}
    </div><div class="subcard compact" style="margin-top:12px"><b>Estado mental:</b> ${band.name}. ${band.text}</div></article>`;
  }
  function renderCompactActiveConditions(){
    const active=(state.conditions||[]).map(name=>conditionData(name)).filter(Boolean);
    const available=system.conditions.filter(c=>!activeCondition(c.name));
    return `<article class="card compact-conditions-card"><div class="section-title"><div><p class="eyebrow">CONDIÇÕES</p><h3>Em evidência</h3></div><span class="pill">${active.length} ativa(s)</span></div><div class="row condition-adder"><select id="conditionSelect"><option value="">Adicionar condição…</option>${available.map(c=>`<option value="${c.name}">${c.name}</option>`).join('')}</select><button id="addConditionBtn" type="button">Adicionar</button></div><div class="active-condition-list">${active.length?active.map(c=>`<div class="active-condition-item"><div><b>${c.name}</b><small>${c.mechanic}</small></div><button type="button" data-remove-condition="${c.name}" class="danger">Remover</button></div>`).join(''):'<div class="notice">Nenhuma condição ativa.</div>'}</div></article>`;
  }

  function familiarTypeRule(type){return familiarRules.types?.[type]||familiarRules.types?.auxiliar||{name:'Auxiliar',hpBase:15,hpPerTen:5,attributePoints:5,skillCount:1}}
  function familiarHpMax(f){const rule=familiarTypeRule(f?.type);if(rule.legendary)return Math.max(1,Number(f?.legendaryHpMax)||1);return Number(rule.hpBase||0)+Math.floor(state.level/10)*Number(rule.hpPerTen||0)}
  function familiarAttrSpent(f){return sum(f?.attributes||{})}
  function familiarSkillLimit(f){return Number(familiarTypeRule(f?.type)?.skillCount||0)}
  function familiarActiveCommons(){return (state.familiars?.entries||[]).filter(f=>f.active&&f.type!=='lendario')}
  function familiarActiveLegendaries(){return (state.familiars?.entries||[]).filter(f=>f.active&&f.type==='lendario')}
  function mountRouteOk(f){return !!f?.knownVip||fameTotal()>=50}
  function mountEligible(f){return mountRouteOk(f)&&!!f?.staffApproved}
  function canActivateFamiliar(f){
    if(f.type==='lendario')return true;
    const current=familiarActiveCommons().filter(x=>x.id!==f.id);
    if(current.length>=2)return false;
    if(current.length===1&&f.type==='auxiliar'&&current[0].type==='auxiliar')return false;
    return true;
  }
  function validationIssues(){
    const issues=[];
    const add=(level,text)=>issues.push({level,text});
    if(!godById(state.godId))add('error','Deus principal não encontrado no banco de dados.');
    if(sum(state.baseAttributes)!==8)add(state.isCreated?'warn':'error',`Atributos-base somam ${sum(state.baseAttributes)}/8. A edição após a criação é livre para permitir correções, mas confira se o total final deveria continuar em 8.`);
    if(state.initialSkills.length!==initialSkillLimit())add('warn',`Perícias iniciais: ${state.initialSkills.length}/${initialSkillLimit()} escolhas por Inteligência inicial.`);
    const lvl20Skills=levelSkillChoicesFromMeta(20),lvl40Skills=levelSkillChoicesFromMeta(40);
    if(state.level>=20&&lvl20Skills.length===0)add('warn','Falta marcar uma perícia treinada com origem Nível 20.');
    if(state.level>=40&&lvl40Skills.length===0)add('warn','Falta marcar uma perícia treinada com origem Nível 40.');
    if(lvl20Skills.length>1)add('warn','Há mais de uma perícia marcada com origem Nível 20.');
    if(lvl40Skills.length>1)add('warn','Há mais de uma perícia marcada com origem Nível 40.');
    if(spentLevelPoints()>earnedLevelPoints())add('error',`Há ${spentLevelPoints()} pontos de nível gastos para ${earnedLevelPoints()} disponíveis.`);
    ATTRS.forEach(([k,,label])=>{if(ordinaryAttrRaw(k)>5)add('warn',`${label} recebe ${ordinaryAttrRaw(k)} por fontes normais, mas está corretamente limitado a 5 antes de ajustes excepcionais.`)});
    if(standardTalentsUsed()>talentSlotsEarned())add('warn',`Há ${standardTalentsUsed()} talentos padrão para ${talentSlotsEarned()} slots por nível.`);
    if(state.skillTrainings.length>skillTrainingSlots())add('warn',`Há ${state.skillTrainings.length} perícias em treinamento para ${skillTrainingSlots()} vagas liberadas.`);
    const l=state.lineage||defaultLineage();
    if(l.type!=='normal'&&(!l.secondaryGodId||l.secondaryGodId===state.godId))add('error','Legado precisa de dois deuses diferentes.');
    if(l.type!=='normal'&&(isTriumvir(state.godId)||isTriumvir(l.secondaryGodId)))add('error','Triúnviros não participam da mistura de kits por Legado.');
    if(l.type==='compound'){
      if((l.compoundPassiveReplacements||[]).length>3)add('error','Legado Composto excedeu 3 trocas de passivas.');
      if((l.compoundActiveReplacements||[]).length>2)add('error','Legado Composto excedeu 2 trocas de ativas.');
      const main=abilitiesDb[state.godId],sub=abilitiesDb[l.secondaryGodId];
      for(const r of l.compoundActiveReplacements||[]){const a=main?.actives?.[Number(r.primaryIndex)],b=sub?.actives?.find(x=>x.id===r.secondaryId);if(a&&b&&Number(b.level)>Number(a.level))add('error',`Troca de Legado inválida: ${b.name} exige nível maior que ${a.name}.`)}
    }
    if(l.type==='direct'){
      if((l.directPrimaryPassives||[]).length!==4)add('warn','Legado Direto deve selecionar 4 passivas da primeira origem.');
      if((l.directSecondaryPassives||[]).length!==3)add('warn','Legado Direto deve selecionar 3 passivas da segunda origem.');
    }
    const common=familiarActiveCommons();
    if(common.length>2)add('error','Mais de 2 familiares comuns estão ativos na missão.');
    if(common.length===2&&common.every(f=>f.type==='auxiliar'))add('error','Com 2 familiares comuns ativos, pelo menos um precisa ser Montaria ou superior.');
    (state.familiars?.entries||[]).filter(f=>f.active&&f.type==='montaria').forEach(f=>{if(!mountEligible(f))add('warn',`${f.name||'Montaria'} está ativa, mas os requisitos sociais/aprovação ainda não estão marcados como cumpridos.`)});
    if(state.magic?.enabled&&magicSacrificeTotal()>Number(magicRules.maxSacrifices||3))add('error','Sacrifícios mágicos excedem o limite de 3 pontos.');
    return issues;
  }
  function renderDiagnostics(){const issues=validationIssues();const errors=issues.filter(x=>x.level==='error').length,warns=issues.filter(x=>x.level==='warn').length;return `<article class="card mechanics-section"><div class="section-title"><div><p class="eyebrow">REVISÃO MECÂNICA</p><h2>Diagnóstico da ficha</h2></div><span class="pill ${errors?'warn':warns?'warn':'good'}">${errors?`${errors} erro(s)`:warns?`${warns} aviso(s)`:'Tudo consistente'}</span></div>${issues.length?`<div class="diagnostic-list">${issues.map(x=>`<div class="diagnostic ${x.level}"><b>${x.level==='error'?'Corrigir':'Conferir'}</b><span>${esc(x.text)}</span></div>`).join('')}</div>`:'<div class="notice success-note">Nenhuma inconsistência estrutural detectada. Isso não substitui regras narrativas ou aprovação da staff.</div>'}<p class="muted compact" style="margin-top:10px">Esta checagem procura limites, vagas, Legados, progressão e familiares. Efeitos narrativos continuam manuais.</p></article>`}

  function renderMiniDeath(){
    const d=state.death||defaultDeath(),active=state.currentHp===0;
    const dots=(value,kind)=>`<span class="death-dot-line ${kind}">${[1,2,3].map(n=>`<i class="${value>=n?'filled':''}"></i>`).join('')}</span>`;
    return `<section class="rail-death ${active?'active':''} ${d.dead?'dead':''}">
      <div class="rail-death-head"><div><span class="rail-label">TESTES CONTRA A MORTE</span><b>${d.dead?'Morto':d.stable?'Estável':active?'Ativo':'Inativo'}</b></div><span class="rail-hp">HP ${state.currentHp}</span></div>
      <div class="rail-death-counters"><span>Sucessos ${dots(d.successes,'success')}</span><span>Falhas ${dots(d.failures,'failure')}</span></div>
      ${active&&!d.dead&&!d.stable?`<button id="rollDeath" class="primary rail-death-roll">Rolar teste</button><div class="rail-death-actions"><button id="deathSuccessManual">+ sucesso</button><button id="deathFailureManual">+ falha</button><button id="deathDamage">dano</button><button id="deathCrit">crítico</button><button id="medicineStabilize">medicina</button></div>`:''}
      ${d.stable&&!d.dead?`<button id="stableRecover">Recuperar 1 HP</button>`:''}${d.dead?`<button id="narrativeRestore">Intervenção narrativa</button>`:''}
      <details><summary>regra rápida · ${d.returnCount||0} retorno(s)</summary><p>10+ sucesso · 1 natural = 2 falhas · 20 natural = 1 HP. Retornar à consciência após 0 HP não aplica penalidade cumulativa.</p></details>
    </section>`;
  }

  function renderCharacterRail(g){
    const h=state.history||{},band=sanityBand(),energy=energyBand();
    const profileBits=[h.age?`${esc(h.age)} anos`:'',state.roma?.cohort?esc(state.roma.cohort):'',h.origin?esc(h.origin):'',state.roma?.citizenship?esc(state.roma.citizenship):''].filter(Boolean);
    return `<aside class="character-rail card">
      <div class="rail-brandline"><span>LEG · XII · FULMINATA</span><b>${GROUP_LABEL[g.group]||g.group}</b></div>
      <div class="rail-portrait-wrap"><div class="rail-portrait-badges"><label class="rail-orb rail-orb-level"><span>Nível</span><input id="levelOrbInput" type="number" min="1" max="100" value="${state.level}"></label><div class="rail-orb rail-orb-bp"><span>BP</span><strong>${signed(bp())}</strong></div></div><div class="rail-portrait ${h.portraitUrl?'has-image':''}"${h.portraitUrl?` style="background-image:url('${esc(h.portraitUrl)}')"`:''}>${h.portraitUrl?'':esc(initials(state.name||g.name))}</div><button id="heroPortraitUploadBtn" class="rail-photo-button" type="button">Trocar retrato</button></div>
      <div class="rail-identity"><p class="eyebrow">${esc(g.name)}${state.lineage?.type!=='normal'?' · LEGADO':''}</p><h2>${esc(state.name||'Sem nome')}</h2>${h.tagline?`<p class="rail-tagline">${esc(h.tagline)}</p>`:''}<div class="rail-meta">${profileBits.length?profileBits.map(x=>`<span>${x}</span>`).join(''):'<span>Perfil sem detalhes adicionais</span>'}</div></div>
      <div class="rail-level-row"><div class="rail-defense-stat"><span>Defesa</span><strong>${signed(defenseBonus())}</strong><label class="rail-defense-adjust" title="Bônus ou penalidade manual de Defesa">manual <input id="railDefenseAdjust" type="number" value="${Number(state.tempMods.defense)||0}"></label></div><div><span>DT</span><strong>${castDT()}</strong></div></div>
      <div class="rail-vitals"><div><span>HP</span><b>${state.currentHp}/${hpMax()}</b></div><div><span>EN</span><b>${state.currentEnergy}/${energyMax()}</b><small>${energy.name}</small></div><div><span>SAN</span><b>${state.currentSanity}/100</b><small>${band.name}</small></div>${g.resource?`<div><span>${esc(g.resource.name)}</span><b>${state.resourceCurrent}/${resourceMax()}</b></div>`:''}</div>
      ${renderMiniDeath()}
      <details class="rail-editor"><summary>Editar perfil</summary><div class="stack">
        <label><span class="label">Personagem</span><input id="sheetNameInput" value="${esc(state.name)}"></label>
        <div class="grid two compact-fields"><label><span class="label">Player</span><input id="sheetPlayerInput" value="${esc(state.player)}"></label><label><span class="label">Nível</span><input id="levelInput" type="number" min="1" max="100" value="${state.level}"></label></div>
        <label><span class="label">Frase / subtítulo</span><input data-history="tagline" value="${esc(h.tagline||'')}" placeholder="Ex.: Centurião da Segunda Coorte"></label>
        <div class="grid two compact-fields"><label><span class="label">Idade</span><input data-history="age" value="${esc(h.age||'')}"></label><label><span class="label">Nascimento</span><input data-history="birth" value="${esc(h.birth||'')}"></label></div>
        <div class="grid two compact-fields"><label><span class="label">Origem</span><input data-history="origin" value="${esc(h.origin||'')}"></label><label><span class="label">Residência</span><input data-history="residence" value="${esc(h.residence||h.affiliation||'')}"></label></div>
        <label><span class="label">URL do retrato</span><input data-history="portraitUrl" value="${esc(h.portraitUrl||'')}"></label><div class="row"><button id="uploadPortraitBtn" type="button">Upload do retrato</button></div>
        <label class="hidden"><span class="label">Banner</span><input data-history="bannerUrl" value="${esc(h.bannerUrl||'')}"></label><input id="portraitUploadInput" type="file" accept="image/*" hidden><input id="bannerUploadInput" type="file" accept="image/*" hidden>
      </div></details>
      <button id="backCreation" class="ghost rail-back">Voltar à criação</button>
    </aside>`;
  }

  function renderTalentsCompact(){
    const earned=talentSlotsEarned(),used=standardTalentsUsed(),eligible=talentsDb,preview=talentDef(state.talentDraftId);
    const owned=(state.talents||[]).map(inst=>{const def=talentDef(inst.talentId)||{name:'Talento desconhecido',description:'',manual:true};return `<div class="talent-compact-item"><div class="row between"><div><b>${def.name}</b><small>${inst.extra?'Extra':'Padrão'}${def.minLevel>1?` · Nv ${def.minLevel}+`:''}${def.repeatable===false?' · único':''}</small></div><button class="danger icon-danger" data-remove-talent="${inst.id}" title="Remover">×</button></div><p>${def.description}</p>${def.params?.length?`<div class="talent-params compact-fields">${talentParameterHtml(inst,def)}</div>`:''}<input class="talent-note-mini" data-talent-notes="${inst.id}" value="${esc(inst.notes||'')}" placeholder="nota / origem"></div>`}).join('');
    return `<article class="card talents-compact-card"><div class="section-title"><div><p class="eyebrow">TALENTOS</p><h3>Talentos atuais</h3></div><span class="pill">${used}/${earned}</span></div><div class="row" style="justify-content:space-between;margin:0 0 8px"><span class="muted compact">Banco carregado: <b>${eligible.length}</b> talentos</span><span class="muted compact">Escolhas padrão: níveis 1, 30, 60 e 90</span></div><div class="talent-compact-list">${owned||'<p class="muted compact">Nenhum talento selecionado.</p>'}</div><details open class="compact-disclosure talent-add"><summary>Adicionar ou consultar talento</summary><div class="talent-picker"><select id="newTalentDef"><option value="">Escolha um talento…</option>${eligible.map(t=>`<option value="${t.id}" ${state.talentDraftId===t.id?'selected':''}>${t.name}${t.minLevel>1?` · Nv ${t.minLevel}+${state.level<t.minLevel?' · bloqueado':''}`:''}</option>`).join('')}</select><div id="talentPreview">${talentPreviewHtml(preview)}</div><div class="row"><button id="addStandardTalent" class="primary" ${used>=earned||!preview||(preview&&state.level<preview.minLevel)?'disabled':''}>Adicionar padrão</button><button id="addExtraTalent" ${!preview||(preview&&state.level<preview.minLevel)?'disabled':''}>Adicionar extra</button></div></div></details>${hasTalent('pau-toda-obra')?`<div class="notice compact">Pau pra Toda Obra: +${talentCount('pau-toda-obra')}d4 em Testes de Perícia.</div>`:''}</article>`;
  }

  function renderStatusQuickCard(g){
    const l=state.lineage||defaultLineage(),energy=energyBand();
    return `<article class="card status-quick-card"><p class="eyebrow">REFERÊNCIA RÁPIDA</p><h3>Ficha mecânica</h3><div class="quick-fact-list">
      <div><span>Iniciativa</span><b>1d20 ${signed(initiativeBonus())}</b></div><div><span>Conjuração</span><b>1d20 ${signed(castAttack())}</b></div><div><span>DT</span><b>${castDT()}</b></div><div><span>RD</span><b>${damageReduction()}</b></div><div><span>Energia</span><b>${energy.name}</b></div><div><span>Exaustão</span><b>${state.exhaustion}/6</b></div><div><span>Fama</span><b>${signed(fameTotal())}</b></div><div><span>Linhagem</span><b>${l.type==='normal'?'Direta':l.type==='compound'?'Legado composto':'Legado direto'}</b></div>
    </div><div class="divider"></div><div class="status-line ${energy.cls}"><b>Estado atual</b><span>Energia ${energy.name} · Exaustão ${state.exhaustion}/6 · Retornos ${state.death?.returnCount||0}</span></div><details class="compact-disclosure"><summary>Origem dos valores</summary><p class="compact"><b>Kit:</b> ${esc(g.source)}<br><b>HP:</b> ${g.hpBase} + CON; +${g.hpPerDecade} + CON a cada 10 níveis.<br><b>Bônus divinos:</b> ${bonusText(g)}<br><b>Perícias divinas:</b> ${divineGranted().join(', ')||'—'}</p></details></article>`;
  }

  function renderStatusTab(g){
    return `<section class="tab-pane ${state.activeTab==='status'?'':'hidden'}" data-pane="status">
      ${renderResourceDock()}
      <section class="overview-grid">
        <article class="card attribute-sidebar"><div class="section-title"><div><p class="eyebrow">ATRIBUTOS</p><h3>Base</h3></div><b class="level-point-count">${remainingLevelPoints()}/${earnedLevelPoints()}</b></div><div class="attrs vertical-attrs">${ATTRS.map(a=>attrCard(...a,true)).join('')}</div><div class="level-point-mini">${[20,40,60,80,100].map(n=>`<span class="${state.level>=n?'earned':''}">${n}</span>`).join('')}</div>${remainingLevelPoints()>0?`<div class="attr-level-buttons">${ATTRS.map(([k,a])=>`<button data-lvl-inc="${k}" ${ordinaryAttrRaw(k)>=5?'disabled':''}>+ ${a}</button>`).join('')}</div>`:''}${spentLevelPoints()>0?`<div class="attr-level-buttons minus">${ATTRS.filter(([k])=>state.levelAttributes[k]>0).map(([k,a])=>`<button data-lvl-dec="${k}">− ${a}</button>`).join('')}</div>`:''}</article>
        <div class="overview-skills">${renderSkillMatrix()}<details class="compact-disclosure training-disclosure"><summary>Treinamento de novas perícias · ${availableSkillTrainingSlots()} vaga(s)</summary>${renderSkillTrainingCard()}</details></div>
        <div class="overview-talents overview-side-stack">${renderTalentsCompact()}<details class="card compact-config"><summary>Legado & linhagem</summary>${renderLegacySection()}</details></div>
        <div class="overview-quick overview-side-stack">${renderStatusQuickCard(g)}<details class="card compact-config"><summary>Ajustes excepcionais</summary><p class="muted compact">Use apenas quando um efeito disser explicitamente que pode ultrapassar o limite normal.</p><div class="grid two compact-fields">${ATTRS.map(([k,a])=>`<label><span class="label">${a} extra</span><input type="number" min="-10" max="10" value="${Number(state.attributeExtras[k])||0}" data-attr-extra="${k}"></label>`).join('')}</div></details><details class="card compact-config"><summary>Diagnóstico mecânico</summary>${renderDiagnostics()}</details></div>
      </section>
    </section>`;
  }
  function equipmentCardVisual(imageUrl,glyph){
    return imageUrl?`<div class="equipment-card-media"><img src="${esc(imageUrl)}" alt=""></div>`:`<div class="equipment-card-glyph">${glyph}</div>`;
  }
  function renderEquippedDeck(){
    const cards=[];
    const a=state.armor,t=armorType(a.type),am=material(a.material),sh=state.shield,sm=material(sh.material);
    if(a.equipped)cards.push(`<div class="equipment-card armor"><span class="equipment-card-index">I</span><button class="equipment-card-edit" data-edit-equipment="armor" type="button">Editar</button>${equipmentCardVisual(a.imageUrl,'◈')}<div class="equipment-card-copy"><small>ARMADURA</small><b>${esc(a.name||'Armadura')}</b><span>${esc(t.name)} · ${esc(am.name)}</span></div><div class="equipment-card-stats"><span>DEF +${t.defense}</span><span>RD ${t.reduction}</span></div></div>`);
    if(sh.equipped)cards.push(`<div class="equipment-card shield"><span class="equipment-card-index">II</span><button class="equipment-card-edit" data-edit-equipment="shield" type="button">Editar</button>${equipmentCardVisual(sh.imageUrl,'⬡')}<div class="equipment-card-copy"><small>ESCUDO</small><b>${esc(sh.name||'Escudo')}</b><span>${esc(sm.name)}</span></div><div class="equipment-card-stats"><span>DEF +${shieldDefense()}</span><span>${Number(sh.stakes)||0}/30</span></div></div>`);
    (state.weapons||[]).filter(w=>w.equipped!==false).forEach(w=>{const wm=material(w.material),wt=weaponType(w.type);cards.push(`<div class="equipment-card weapon"><span class="equipment-card-index">${cards.length+1}</span><button class="equipment-card-edit" data-edit-equipment="weapon:${w.id}" type="button">Editar</button>${equipmentCardVisual(w.imageUrl,'✦')}<div class="equipment-card-copy"><small>ARMA</small><b>${esc(w.name||'Arma')}</b><span>${esc(wt.name)} · ${esc(wm.name)}</span></div><div class="equipment-card-stats"><span>ATQ ${signed(weaponAttack(w))}</span><span>${weaponDamageFormula(w)}</span></div></div>`)});
    (state.inventory?.items||[]).filter(it=>it.showInDeck).forEach(it=>cards.push(`<div class="equipment-card item"><span class="equipment-card-index">${cards.length+1}</span><button class="equipment-card-edit" data-edit-equipment="item:${it.id}" type="button">Editar</button>${equipmentCardVisual(it.imageUrl,'✧')}<div class="equipment-card-copy"><small>${esc(inventoryCategoryLabel(it.category).toUpperCase())}</small><b>${esc(it.name||'Item')}</b><span>${it.material?esc(it.material):'Item do acervo'}</span></div><div class="equipment-card-stats"><span>QTD ${Math.max(0,Number(it.qty)||0)}</span>${it.rune?`<span>${esc(it.rune)}</span>`:''}</div></div>`));
    const desired=Math.max(4,cards.length);
    for(let i=cards.length;i<desired;i++)cards.push(`<div class="equipment-card empty"><span class="equipment-card-index">${i+1}</span><button class="equipment-card-edit" data-go-tab="inventory" type="button">Adicionar</button><div class="equipment-card-glyph">XII</div><div class="equipment-card-copy"><small>SLOT LIVRE</small><b>Item ou equipamento</b><span>Equipe ou fixe um item no baralho</span></div></div>`);
    return `<div class="equipment-deck">${cards.join('')}</div>`;
  }
  function renderCombatEquipmentSummary(){
    const a=state.armor,t=armorType(a.type),s=state.shield,eqWeapons=(state.weapons||[]).filter(w=>w.equipped!==false);
    return `<article class="card equipment-summary-card"><div class="section-title"><div><p class="eyebrow">EQUIPAMENTO EM USO</p><h3>Baralho de combate</h3></div><button type="button" data-go-tab="inventory">Abrir Inventário</button></div>${renderEquippedDeck()}<div class="equipment-inline-summary"><span>${a.equipped?`Armadura +${t.defense} DEF / ${t.reduction} RD`:'Sem armadura'}</span><span>${s.equipped?`Escudo +${shieldDefense()} DEF`:'Sem escudo'}</span><span>${eqWeapons.length?`${eqWeapons.length} arma(s) equipada(s)`:'Sem arma equipada'}</span></div></article>`;
  }

  function renderCombatTab(fDef,set){
    const san=sanityBand(),energy=energyBand();
    return `<section class="tab-pane ${state.activeTab==='combat'?'':'hidden'}" data-pane="combat">
      ${renderCombatResourceDock()}
      <section class="combat-command-grid mechanics-section">
        <article class="card combat-essentials-card"><div class="section-title"><div><p class="eyebrow">COMBATE</p><h3>Referência imediata</h3></div><button id="rollDefense" class="primary">Rolar Defesa</button></div><div class="combat-quick-values"><div><span>Defesa</span><b>${fDef!==null?fDef:`1d20 ${signed(defenseBonus())}`}</b></div><div><span>Iniciativa</span><b>1d20 ${signed(initiativeBonus())}</b></div><div><span>RD</span><b>${damageReduction()}</b></div><div><span>Conjuração</span><b>1d20 ${signed(castAttack())}</b></div><div><span>DT</span><b>${castDT()}</b></div><div><span>Sanidade</span><b>${san.name}</b></div></div><div class="compact-fields"><label><span class="label">Ajuste manual de Defesa</span><input id="tempDefense" type="number" value="${state.tempMods.defense}"></label></div>${state.lastRoll?`<div class="roll-result compact-roll"><span>${esc(state.lastRoll.label)}</span><b>${state.lastRoll.total}</b><small>d20 ${state.lastRoll.die}${state.lastRoll.modifier!==undefined?` ${signed(state.lastRoll.modifier)}`:''}</small></div>`:''}</article>
        ${renderCompactActiveConditions()}
        <article class="card combat-rest-card"><p class="eyebrow">DESCANSOS & MODS</p><div class="row"><button id="shortRest" class="primary">Descanso curto</button><button id="longRest">Longo</button></div><div class="grid two compact-fields"><label><span class="label">RD temporária</span><input id="tempReduction" type="number" value="${state.tempMods.damageReduction}"></label><label><span class="label">Exaustão</span><select id="combatExhaustionSelect">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${state.exhaustion===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="subcard compact"><b>Energia:</b> ${energy.name}<br><b>Curto:</b> +25 HP / +150 EN · <b>Longo:</b> HP e EN completos.</div></article>
      </section>
      <section class="mechanics-section">${renderCombatEquipmentSummary()}</section>
      ${set?renderAbilities(set):'<div class="notice mechanics-section">Nenhum conjunto de habilidades carregado.</div>'}
    </section>`;
  }
  function magicCircleRule(circle){return magicRules.circles.find(c=>Number(c.circle)===Number(circle))||null}
  function maxMagicCircleByLevel(){let max=1;for(const c of magicRules.circles||[]){if(state.level>=c.minLevel)max=Math.max(max,c.circle)}return max}
  function magicSpellCost(circle,ritual=false){if(Number(circle)===0)return 0;const base=Number(magicCircleRule(circle)?.cost)||0;if(!ritual)return base;return Math.ceil((base/2)/5)*5}
  function highCircleRemaining(circle){const max=Number(magicRules.highCircleUses?.[circle]||0);if(!max)return null;return Math.max(0,max-(Number(state.magic?.highCircleUsed?.[circle])||0))}
  function magicCastBonus(){const k=state.magic?.castingAttr||'fe';return effectiveAttr(k)+bp()+globalD20Penalty()+attrRollConditionPenalty(k)}
  function magicCastDT(){const k=state.magic?.castingAttr||'fe';return 8+effectiveAttr(k)+bp()}
  function magicSacrificeAvailable(k){return Math.max(0,basePlusLevel(k)-magicSacrifice(k))}
  function magicComponentsText(sp){const xs=[];if(sp.components?.v)xs.push('V');if(sp.components?.s)xs.push('S');if(sp.components?.m)xs.push('M');return xs.length?xs.join(' / '):'—'}
  function ensureMagicStarters(){
    if((state.magic.spells||[]).length)return;
    for(let i=1;i<=Number(magicRules.startingCantrips||2);i++)state.magic.spells.push({id:uid('spell'),name:`Truque ${i}`,circle:0,components:{v:false,s:false,m:false},concentration:false,ritual:false,source:'Inicial',notes:''});
    for(let i=1;i<=Number(magicRules.startingSpells||3);i++)state.magic.spells.push({id:uid('spell'),name:`Magia inicial ${i}`,circle:1,components:{v:false,s:false,m:false},concentration:false,ritual:false,source:'Inicial',notes:''});
  }
  function renderMagicSpell(sp){
    const circle=Number(sp.circle)||0,cost=magicSpellCost(circle,false),ritualCost=magicSpellCost(circle,true),rule=magicCircleRule(circle),circleAllowed=circle===0||circle<=state.magic.circle,levelAllowed=circle===0||state.level>=(rule?.minLevel||999),remaining=highCircleRemaining(circle),highBlocked=remaining!==null&&remaining<=0,canCast=circleAllowed&&levelAllowed&&!highBlocked;
    const conc=state.magic.concentrationSpellId===sp.id;
    return `<div class="spell-card ${!canCast?'ability-locked':''}"><div class="row between"><div><b>${esc(sp.name||'Magia sem nome')}</b><div class="muted compact">${circle===0?'Truque':`${circle}º círculo`} · ${circle===0?'0 EN':`${cost} EN`} · componentes ${magicComponentsText(sp)}${sp.concentration?' · Concentração':''}${sp.ritual?' · Ritual':''}</div></div><button class="danger" data-remove-spell="${sp.id}">Remover</button></div><div class="spell-grid"><label><span class="label">Nome</span><input data-spell-field="${sp.id}:name" value="${esc(sp.name||'')}"></label><label><span class="label">Círculo</span><select data-spell-field="${sp.id}:circle"><option value="0" ${circle===0?'selected':''}>Truque</option>${(magicRules.circles||[]).map(c=>`<option value="${c.circle}" ${circle===c.circle?'selected':''}>${c.circle}º · Nv ${c.minLevel}+ · ${c.cost} EN</option>`).join('')}</select></label><label><span class="label">Fonte</span><input data-spell-field="${sp.id}:source" value="${esc(sp.source||'')}" placeholder="Inicial, grimório, ensinada..."></label></div><div class="row spell-flags"><label class="toggle-inline"><input type="checkbox" data-spell-flag="${sp.id}:v" ${sp.components?.v?'checked':''}> V</label><label class="toggle-inline"><input type="checkbox" data-spell-flag="${sp.id}:s" ${sp.components?.s?'checked':''}> S</label><label class="toggle-inline"><input type="checkbox" data-spell-flag="${sp.id}:m" ${sp.components?.m?'checked':''}> M</label><label class="toggle-inline"><input type="checkbox" data-spell-bool="${sp.id}:concentration" ${sp.concentration?'checked':''}> Concentração</label><label class="toggle-inline"><input type="checkbox" data-spell-bool="${sp.id}:ritual" ${sp.ritual?'checked':''}> Pode ser ritual</label></div><label><span class="label">Notas / efeito</span><textarea data-spell-field="${sp.id}:notes" rows="3" placeholder="Descrição resumida, alcance, alvo, efeito...">${esc(sp.notes||'')}</textarea></label><div class="row between spell-actions"><div class="row">${canCast?`<button class="primary" data-cast-spell="${sp.id}" data-ritual="0">Conjurar${cost?` · −${cost} EN`:''}</button>`:`<span class="locked">${highBlocked?'Usos altos esgotados':!levelAllowed?`Nível mínimo ${rule?.minLevel||'—'}`:`Círculo ${circle} ainda não concedido`}</span>`}${sp.ritual&&circle>0&&circle<=state.magic.circle&&levelAllowed?`<button data-cast-spell="${sp.id}" data-ritual="1" ${highBlocked?'disabled':''}>Ritual · 10 min · −${ritualCost} EN</button>`:''}</div><div class="row">${remaining!==null?`<span class="pill ${remaining>0?'good':'warn'}">${remaining}/${magicRules.highCircleUses[circle]} uso(s) restantes</span>`:''}${conc?'<span class="pill good">Concentração ativa</span>':''}</div></div></div>`;
  }
  function renderMagicTab(){
    const m=state.magic||defaultMagic(),maxByLevel=maxMagicCircleByLevel(),sacTotal=magicSacrificeTotal(),conc=(m.spells||[]).find(sp=>sp.id===m.concentrationSpellId),damage=Number(m.concentrationDamage)||0,concDt=Math.max(10,damage/2);
    if(!m.enabled)return `<section class="tab-pane ${state.activeTab==='magic'?'':'hidden'}" data-pane="magic"><article class="card magic-off"><p class="eyebrow">MAGIA</p><h2>Personagem não despertado para Magia</h2><p class="muted">Ative somente quando o personagem realmente possuir acesso ao sistema de Magia. Isso altera a progressão de HP e habilita círculos, feitiços, concentração, rituais e sacrifícios físicos.</p><div class="notice">Ao despertar, a progressão de HP perde 2 pontos por avanço de 10 níveis, inclusive retroativamente. É possível sacrificar até 3 pontos entre FOR, DES e CON; bônus divinos não podem ser sacrificados. Cada ponto sacrificado concede +25 de Energia máxima.</div><button id="enableMagic" class="primary">Ativar Magia neste personagem</button>${hasTalent('iniciado-magia')?'<div class="notice">Iniciado em Magia está na ficha: o talento concede 2 truques simples mesmo sem despertar todo o sistema mágico.</div>':''}</article></section>`;
    return `<section class="tab-pane ${state.activeTab==='magic'?'':'hidden'}" data-pane="magic"><div class="grid two"><article class="card"><div class="row between"><div><p class="eyebrow">DESPERTAR MÁGICO</p><h2>Estrutura de conjuração</h2></div><button id="disableMagic" class="danger">Desativar Magia</button></div><div class="grid two"><label><span class="label">Atributo de conjuração mágica</span><select id="magicCastingAttr">${['int','fe','car'].map(k=>`<option value="${k}" ${m.castingAttr===k?'selected':''}>${attrName(k)}</option>`).join('')}</select></label><label><span class="label">Círculo concedido</span><select id="magicCircle">${(magicRules.circles||[]).map(c=>`<option value="${c.circle}" ${m.circle===c.circle?'selected':''} ${c.circle>maxByLevel?'disabled':''}>${c.circle}º círculo · mínimo Nv ${c.minLevel}</option>`).join('')}</select></label></div><div class="row magic-summary"><span class="pill">Ataque mágico ${signed(magicCastBonus())}</span><span class="pill">DT ${magicCastDT()}</span><span class="pill">Círculo ${m.circle}/9</span><span class="pill">Energia máx. ${energyMax()}</span></div><div class="notice">Nível apenas define o mínimo possível; a progressão de círculo depende da concessão narrativa. Magias conhecidas não têm limite fixo.</div></article><article class="card"><p class="eyebrow">SACRIFÍCIO NO DESPERTAR</p><div class="row between"><h2>Pontos físicos</h2><span class="pill ${sacTotal>=magicRules.maxSacrifices?'warn':''}">${sacTotal}/${magicRules.maxSacrifices}</span></div><p class="muted compact">Cada ponto sacrificado: +${magicRules.sacrificeEnergyEach} Energia máxima. Bônus divinos não entram na reserva sacrificável.</p>${['for','des','con'].map(k=>`<div class="subcard magic-sac-row"><div><b>${attrName(k)}</b><small class="muted">estrutural ${structuralAttr(k)} · disponível não divino ${magicSacrificeAvailable(k)}</small></div><div class="row"><button data-magic-sac="${k}:-1">−</button><strong>${magicSacrifice(k)}</strong><button data-magic-sac="${k}:1" ${sacTotal>=magicRules.maxSacrifices||magicSacrificeAvailable(k)<=0?'disabled':''}>+</button></div></div>`).join('')}<div class="subcard compact"><b>Fragilidade mágica:</b> a progressão de HP por 10 níveis é reduzida em 2. HP atual máximo: <b>${hpMax()}</b>.</div></article></div><div class="grid two mechanics-section"><article class="card"><p class="eyebrow">CONCENTRAÇÃO</p><h2>${conc?esc(conc.name):'Nenhuma magia mantida'}</h2>${conc?'<button id="endConcentration">Encerrar concentração</button>':'<p class="muted">Conjurar outra magia de concentração substitui a atual.</p>'}<label><span class="label">Dano recebido para conferir teste</span><input id="concentrationDamage" type="number" min="0" step="1" value="${damage}"></label><div class="subcard">Resistência de CON: <b>DT ${concDt}</b><br><span class="muted compact">Use o maior valor entre 10 e metade do dano recebido. A rolagem continua podendo ser feita no Discord.</span></div></article><article class="card"><p class="eyebrow">REGRAS RÁPIDAS</p><h2>Uso em mesa</h2><div class="stack compact"><div class="subcard">1 magia de círculo por turno; normalmente usa 1 ação.</div><div class="subcard">Ritual: 10 minutos e metade do custo, arredondado para cima até múltiplo de 5.</div><div class="subcard">Componentes: Verbal (V), Somático (S) e Material (M); um foco pode substituir componentes quando a regra permitir.</div><div class="subcard">6º e 7º círculos: 2 usos cada por descanso longo. 8º e 9º: 1 uso cada.</div><div class="subcard">Personagens mágicos ficam limitados à segunda estaca das habilidades divinas, salvo as exceções específicas previstas pelo sistema.</div></div></article></div><section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">GRIMÓRIO / MAGIAS CONHECIDAS</p><h2>Feitiços & truques</h2></div><button id="addSpell" class="primary">Adicionar magia</button></div><p class="muted">No despertar, a referência inicial é 2 truques + 3 magias. Depois disso, novas magias entram conforme forem adquiridas narrativamente.</p><div class="spell-list">${(m.spells||[]).length?(m.spells||[]).map(renderMagicSpell).join(''):'<div class="notice">Nenhuma magia cadastrada.</div>'}</div></section><article class="card mechanics-section"><label><span class="label">Notas de Magia</span><textarea id="magicNotes" rows="6" placeholder="Foco, grimório, professor, peculiaridades, permissões da staff...">${esc(m.notes||'')}</textarea></label></article></section>`;
  }
  function castMagicSpell(id,ritual){
    const sp=state.magic.spells.find(x=>x.id===id);if(!sp)return;const circle=Number(sp.circle)||0,rule=magicCircleRule(circle);if(circle>0&&(circle>state.magic.circle||state.level<(rule?.minLevel||999))){notify('Este círculo ainda não está disponível.');return}
    const remaining=highCircleRemaining(circle);if(remaining!==null&&remaining<=0){notify('Usos deste círculo esgotados até o próximo descanso longo.');return}
    const cost=magicSpellCost(circle,ritual);if(state.currentEnergy<cost){notify('Energia insuficiente.');return}
    setEnergy(state.currentEnergy-cost);if(remaining!==null)state.magic.highCircleUsed[circle]=(Number(state.magic.highCircleUsed[circle])||0)+1;if(sp.concentration)state.magic.concentrationSpellId=sp.id;save();renderSheet();notify(`${ritual?'Ritual':'Magia'} registrado${cost?`: −${cost} EN`:''}.`)
  }
  function bindMagic(){
    const enable=byId('enableMagic');if(enable)enable.onclick=()=>{state.magic.enabled=true;state.magic.castingAttr=state.magic.castingAttr||'fe';ensureMagicStarters();syncCurrentCaps();save();renderSheet();notify('Sistema de Magia ativado.')};
    const disable=byId('disableMagic');if(disable)disable.onclick=()=>{if(!confirm('Desativar Magia? As magias cadastradas serão preservadas, mas os modificadores mágicos deixam de valer.'))return;state.magic.enabled=false;state.magic.concentrationSpellId='';syncCurrentCaps();save();renderSheet()};
    const ca=byId('magicCastingAttr');if(ca)ca.onchange=e=>{state.magic.castingAttr=e.target.value;save();renderSheet()};
    const ci=byId('magicCircle');if(ci)ci.onchange=e=>{state.magic.circle=clamp(Number(e.target.value)||1,1,maxMagicCircleByLevel());save();renderSheet()};
    document.querySelectorAll('[data-magic-sac]').forEach(b=>b.onclick=()=>{const [k,ds]=b.dataset.magicSac.split(':'),d=Number(ds),total=magicSacrificeTotal(),cur=magicSacrifice(k);if(d>0&&(total>=magicRules.maxSacrifices||magicSacrificeAvailable(k)<=0))return;state.magic.sacrifices[k]=clamp(cur+d,0,3);syncCurrentCaps();save();renderSheet()});
    const cd=byId('concentrationDamage');if(cd)cd.oninput=e=>{state.magic.concentrationDamage=Math.max(0,Number(e.target.value)||0);save();renderSheet()};
    const ec=byId('endConcentration');if(ec)ec.onclick=()=>{state.magic.concentrationSpellId='';save();renderSheet()};
    const add=byId('addSpell');if(add)add.onclick=()=>{state.magic.spells.push({id:uid('spell'),name:'Nova magia',circle:1,components:{v:false,s:false,m:false},concentration:false,ritual:false,source:'',notes:''});save();renderSheet()};
    document.querySelectorAll('[data-remove-spell]').forEach(b=>b.onclick=()=>{const id=b.dataset.removeSpell;state.magic.spells=state.magic.spells.filter(x=>x.id!==id);if(state.magic.concentrationSpellId===id)state.magic.concentrationSpellId='';save();renderSheet()});
    document.querySelectorAll('[data-spell-field]').forEach(el=>el.onchange=()=>{const [id,field]=el.dataset.spellField.split(':'),sp=state.magic.spells.find(x=>x.id===id);if(!sp)return;sp[field]=field==='circle'?clamp(Number(el.value)||0,0,9):el.value;save();renderSheet()});
    document.querySelectorAll('[data-spell-flag]').forEach(el=>el.onchange=()=>{const [id,flag]=el.dataset.spellFlag.split(':'),sp=state.magic.spells.find(x=>x.id===id);if(!sp)return;sp.components[flag]=el.checked;save();renderSheet()});
    document.querySelectorAll('[data-spell-bool]').forEach(el=>el.onchange=()=>{const [id,field]=el.dataset.spellBool.split(':'),sp=state.magic.spells.find(x=>x.id===id);if(!sp)return;sp[field]=el.checked;save();renderSheet()});
    document.querySelectorAll('[data-cast-spell]').forEach(b=>b.onclick=()=>castMagicSpell(b.dataset.castSpell,b.dataset.ritual==='1'));
    const notes=byId('magicNotes');if(notes)notes.oninput=e=>{state.magic.notes=e.target.value;save()};
  }

  function inventoryCategoryLabel(id){return INVENTORY_CATEGORIES.find(x=>x[0]===id)?.[1]||'Geral'}
  function inventoryCategoryOptions(current){return INVENTORY_CATEGORIES.map(([id,label])=>`<option value="${id}" ${current===id?'selected':''}>${label}</option>`).join('')}
  function imageEditorPreview(imageUrl,label='Imagem'){
    return `<div class="inventory-image-preview ${imageUrl?'has-image':''}">${imageUrl?`<img src="${esc(imageUrl)}" alt="${esc(label)}">`:'<span>sem imagem</span>'}</div>`;
  }
  function renderInventoryItem(it){
    return `<div class="subcard inventory-item" data-item-card="${it.id}"><div class="inventory-item-head">${imageEditorPreview(it.imageUrl,it.name||'Item')}<div class="inventory-item-title"><div class="row between"><input class="weapon-name" data-item-field="${it.id}:name" value="${esc(it.name||'Item')}"><button class="danger" data-remove-item="${it.id}">Remover</button></div><div class="row inventory-image-actions"><button type="button" data-upload-item-image="${it.id}">Adicionar imagem</button>${it.imageUrl?`<button type="button" data-clear-item-image="${it.id}">Remover imagem</button>`:''}<label class="toggle-inline"><input type="checkbox" data-item-deck="${it.id}" ${it.showInDeck?'checked':''}> no baralho</label></div></div></div><div class="grid three compact-fields"><label><span class="label">Quantidade</span><input type="number" min="0" step="1" data-item-field="${it.id}:qty" value="${Math.max(0,Number(it.qty)||0)}"></label><label><span class="label">Categoria</span><select data-item-field="${it.id}:category">${inventoryCategoryOptions(it.category)}</select></label><label><span class="label">Material / origem</span><input data-item-field="${it.id}:material" value="${esc(it.material||'')}" placeholder="Opcional"></label></div><label><span class="label">Runa / efeito já aplicado</span><input data-item-field="${it.id}:rune" value="${esc(it.rune||'')}" placeholder="Somente o efeito que já existe no item"></label><label><span class="label">Notas</span><textarea rows="3" data-item-field="${it.id}:notes">${esc(it.notes||'')}</textarea></label></div>`;
  }
  function renderInventoryTab(){
    const inv=state.inventory||defaultInventory(),totalDn=(Number(inv.aureus)||0)*100+(Number(inv.denarius)||0);
    return `<section class="tab-pane ${state.activeTab==='inventory'?'':'hidden'}" data-pane="inventory"><section class="mechanics-section inventory-showcase"><div class="section-title"><div><p class="eyebrow">EQUIPADOS</p><h2>Baralho de itens & equipamento</h2></div><span class="pill">Itens em uso</span></div><p class="muted compact">Armadura, escudo e armas equipadas aparecem aqui. Itens gerais também podem ser fixados no baralho para consulta rápida.</p>${renderEquippedDeck()}</section><div class="grid two mechanics-section inventory-ledger"><article class="card"><p class="eyebrow">MOEDAS</p><h2>Aureus & Denários</h2><div class="grid two"><label><span class="label">Aureus</span><input id="invAureus" type="number" min="0" step="1" value="${Number(inv.aureus)||0}"></label><label><span class="label">Denários</span><input id="invDenarius" type="number" min="0" step="1" value="${Number(inv.denarius)||0}"></label></div><div class="subcard compact" style="margin-top:10px">Referência: <b>1 Aureus = 100 denários</b> · total equivalente atual: <b>${totalDn} dn</b>.</div></article><article class="card"><p class="eyebrow">INVENTÁRIO</p><h2>Acervo do personagem</h2><p class="muted">A ficha guarda o que o personagem <b>possui</b>: equipamento, consumíveis, materiais, itens especiais e efeitos/runes já aplicados.</p><label><span class="label">Notas gerais de inventário</span><textarea id="inventoryNotes" rows="4" placeholder="Baú, itens emprestados, materiais reservados...">${esc(inv.notes||'')}</textarea></label></article></div><section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">PROTEÇÃO</p><h2>Armadura & escudo</h2></div></div><div class="grid two">${renderArmorCard()}${renderShieldCard()}</div></section><article class="card mechanics-section"><div class="section-title"><div><p class="eyebrow">ARMAS</p><h2>Armas & treinamento</h2></div><button id="addWeapon" class="primary">+ Adicionar arma</button></div><p class="muted">O Inventário guarda as armas; a aba Combate usa automaticamente as que estiverem marcadas como equipadas.</p><div class="weapon-list">${state.weapons.length?state.weapons.map(renderWeapon).join(''):'<div class="notice">Nenhuma arma cadastrada ainda.</div>'}</div></article><section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">ITENS</p><h2>Itens gerais</h2></div><button id="addInventoryItem" class="primary">+ Adicionar item</button></div><div class="inventory-grid" style="margin-top:12px">${inv.items.length?inv.items.map(renderInventoryItem).join(''):'<div class="notice wide">Nenhum item geral cadastrado.</div>'}</div></section></section>`;
  }

  function bindInventory(){
    const inv=state.inventory;
    const au=byId('invAureus');if(au)au.onchange=e=>{inv.aureus=Math.max(0,Number(e.target.value)||0);save();renderSheet()};
    const dn=byId('invDenarius');if(dn)dn.onchange=e=>{inv.denarius=Math.max(0,Number(e.target.value)||0);save();renderSheet()};
    const notes=byId('inventoryNotes');if(notes)notes.oninput=e=>{inv.notes=e.target.value;save()};
    const add=byId('addInventoryItem');if(add)add.onclick=()=>{inv.items.push({id:uid('item'),name:'Novo item',qty:1,category:'geral',material:'',rune:'',notes:'',imageUrl:'',showInDeck:false});save();renderSheet()};
    document.querySelectorAll('[data-remove-item]').forEach(b=>b.onclick=()=>{inv.items=inv.items.filter(x=>x.id!==b.dataset.removeItem);save();renderSheet()});
    document.querySelectorAll('[data-item-field]').forEach(el=>el.onchange=()=>{const [id,field]=el.dataset.itemField.split(':'),it=inv.items.find(x=>x.id===id);if(!it)return;it[field]=field==='qty'?Math.max(0,Number(el.value)||0):el.value;save();if(field==='category'||field==='qty')renderSheet()});
    document.querySelectorAll('[data-item-deck]').forEach(el=>el.onchange=()=>{const it=inv.items.find(x=>x.id===el.dataset.itemDeck);if(!it)return;it.showInDeck=el.checked;save();renderSheet()});
    document.querySelectorAll('[data-upload-item-image]').forEach(b=>b.onclick=()=>{const it=inv.items.find(x=>x.id===b.dataset.uploadItemImage);if(!it)return;chooseStoredImage(url=>{it.imageUrl=url;save();renderSheet();notify('Imagem do item atualizada.')})});
    document.querySelectorAll('[data-clear-item-image]').forEach(b=>b.onclick=()=>{const it=inv.items.find(x=>x.id===b.dataset.clearItemImage);if(!it)return;it.imageUrl='';save();renderSheet()});
    bindArmor();bindShield();bindWeapons();
  }

  function renderFamiliarCard(f){
    const rule=familiarTypeRule(f.type),mx=familiarHpMax(f),spent=familiarAttrSpent(f),skillLimit=familiarSkillLimit(f),mount=f.type==='montaria',legend=f.type==='lendario';
    const route=fameTotal()>=50?'Fama ≥50':f.knownVip?'Conhecido + VIP':'rota social pendente';
    return `<div class="familiar-card subcard ${f.active?'active':''}"><div class="row between"><div><input class="weapon-name" data-familiar-field="${f.id}:name" value="${esc(f.name||'Familiar')}"><div class="muted compact">${rule.name}${f.active?' · em missão':''}</div></div><button class="danger" data-remove-familiar="${f.id}">Remover</button></div><div class="grid three compact-fields" style="margin-top:10px"><label><span class="label">Tipo</span><select data-familiar-field="${f.id}:type"><option value="auxiliar" ${f.type==='auxiliar'?'selected':''}>Auxiliar</option><option value="montaria" ${f.type==='montaria'?'selected':''}>Montaria</option><option value="lendario" ${f.type==='lendario'?'selected':''}>Lendário</option></select></label><label><span class="label">Na missão</span><select data-familiar-field="${f.id}:active"><option value="0" ${!f.active?'selected':''}>Não</option><option value="1" ${f.active?'selected':''}>Sim</option></select></label>${legend?`<label><span class="label">HP máximo definido pela staff</span><input type="number" min="1" data-familiar-field="${f.id}:legendaryHpMax" value="${Number(f.legendaryHpMax)||0}"></label>`:`<div class="subcard compact"><b>HP máximo:</b> ${mx}<br><span class="muted">${rule.hpBase} base + ${rule.hpPerTen}/10 níveis do dono</span></div>`}</div><div class="familiar-hp-row"><b>HP ${Number(f.currentHp)||0}/${mx}</b><div class="row"><button data-familiar-hp="${f.id}:-5">−5</button><button data-familiar-hp="${f.id}:-1">−1</button><button data-familiar-hp="${f.id}:1">+1</button><button data-familiar-hp="${f.id}:5">+5</button><input type="number" data-familiar-hp-manual="${f.id}" placeholder="Ex.: -12" aria-label="Ajuste manual de HP"><button data-familiar-hp-apply="${f.id}">Aplicar</button></div></div>${!legend?`<div class="divider"></div><div class="row between"><b>Atributos do familiar</b><span class="pill ${spent>Number(rule.attributePoints||5)?'warn':''}">${spent}/${rule.attributePoints||5} pontos</span></div><div class="attrs familiar-attrs">${ATTRS.map(([k,a])=>`<div class="attr"><div class="attr-name">${a}</div><div class="attr-total">${Number(f.attributes?.[k])||0}</div><div class="stepper"><button data-familiar-attr="${f.id}:${k}:-1">−</button><button data-familiar-attr="${f.id}:${k}:1" ${(spent>=Number(rule.attributePoints||5)||Number(f.attributes?.[k])>=5)?'disabled':''}>+</button></div></div>`).join('')}</div><div class="grid two" style="margin-top:10px">${Array.from({length:skillLimit},(_,i)=>`<label><span class="label">Perícia ${i+1}/${skillLimit}</span><select data-familiar-skill="${f.id}:${i}"><option value="">Escolha…</option>${skills.map(sk=>`<option ${f.skills?.[i]===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`).join('')}</div>`:`<div class="notice">Familiares Lendários têm estatísticas definidas pela staff, <b>2 ações</b> e uso normalmente limitado a uma missão/ocasião. A ficha não inventa atributos para eles.</div><div class="grid two compact-fields"><label><span class="label">Ocasião / condição de uso</span><input data-familiar-field="${f.id}:legendaryOccasion" value="${esc(f.legendaryOccasion||'')}"></label><label class="toggle-inline"><input type="checkbox" data-familiar-legendary-used="${f.id}" ${f.legendaryUsed?'checked':''}> uso desta ocasião já consumido</label></div>`}${mount?`<div class="mount-box"><div class="row between"><b>Requisitos de Montaria</b><span class="pill ${mountEligible(f)?'good':'warn'}">${mountEligible(f)?'elegível':'conferir'}</span></div><p class="muted compact">Rota social: ${route}. A ficha considera a combinação de uma rota social válida + aprovação da staff.</p><div class="row"><label class="toggle-inline"><input type="checkbox" data-familiar-knownvip="${f.id}" ${f.knownVip?'checked':''}> Conhecido + VIP cumprido</label><label class="toggle-inline"><input type="checkbox" data-familiar-approved="${f.id}" ${f.staffApproved?'checked':''}> aprovação da staff</label></div><div class="subcard compact" style="margin-top:8px">Montaria age imediatamente depois do dono e possui 2 perícias.</div></div>`:''}<label style="margin-top:10px"><span class="label">Notas / aparência / vínculo</span><textarea rows="3" data-familiar-field="${f.id}:notes">${esc(f.notes||'')}</textarea></label></div>`;
  }
  function renderFamiliarsTab(){
    const fs=state.familiars||defaultFamiliars(),commons=familiarActiveCommons(),legs=familiarActiveLegendaries(),hasMount=(fs.entries||[]).some(f=>f.type==='montaria');
    return `<section class="tab-pane ${state.activeTab==='familiars'?'':'hidden'}" data-pane="familiars"><div class="section-title"><div><p class="eyebrow">FAMILIARES</p><h2>Companheiros, montarias & lendários</h2></div><div class="row"><span class="pill ${commons.length<=2?'good':'warn'}">Comuns em missão ${commons.length}/2</span><span class="pill">Lendários ativos ${legs.length}</span><button id="addFamiliar" class="primary">+ Familiar</button></div></div><div class="notice" style="margin-top:12px">Até 2 familiares comuns podem acompanhar uma missão; se houver dois, pelo menos um deve ser Montaria ou superior. Lendários ficam fora desse limite comum. Auxiliares: 15 HP +5/10 níveis, 5 pontos de atributo, 1 perícia. Montarias: 40 HP +5/10 níveis, 5 pontos, 2 perícias e agem logo após o dono.</div>${hasMount&&!fs.mountFameClaimed?`<article class="card mechanics-section"><div class="row between"><div><p class="eyebrow">FAMA DE MONTARIA</p><h3>+10 Fama por possuir uma Montaria</h3><p class="muted compact">Use uma única vez quando a concessão for confirmada. A ficha não retira Fama automaticamente se a montaria deixar de acompanhar uma missão.</p></div><button id="claimMountFame" class="primary">Registrar +10 Fama</button></div></article>`:hasMount&&fs.mountFameClaimed?'<div class="pill good mechanics-section">+10 Fama de Montaria já registrada</div>':''}<div class="familiar-list mechanics-section">${fs.entries.length?fs.entries.map(renderFamiliarCard).join(''):'<div class="notice">Nenhum familiar cadastrado.</div>'}</div><article class="card mechanics-section"><label><span class="label">Notas gerais de Familiares</span><textarea id="familiarsNotes" rows="5" placeholder="Regras especiais, cuidados, alojamento, permissões...">${esc(fs.notes||'')}</textarea></label></article></section>`;
  }
  function bindFamiliars(){
    const fs=state.familiars;
    const add=byId('addFamiliar');if(add)add.onclick=()=>{fs.entries.push(defaultFamiliar('auxiliar'));syncCurrentCaps();save();renderSheet()};
    const claim=byId('claimMountFame');if(claim)claim.onclick=()=>{if(fs.mountFameClaimed)return;state.roma.fameEntries=state.roma.fameEntries||[];state.roma.fameEntries.push({id:uid('fame'),source:'Posse de Montaria',discordLink:'',amount:10,notes:'Bônus de Fama por possuir uma Montaria.'});state.roma.fame=fameTotal();fs.mountFameClaimed=true;save();renderSheet();notify('+10 Fama de Montaria registrada no histórico.')};
    document.querySelectorAll('[data-remove-familiar]').forEach(b=>b.onclick=()=>{fs.entries=fs.entries.filter(f=>f.id!==b.dataset.removeFamiliar);save();renderSheet()});
    document.querySelectorAll('[data-familiar-field]').forEach(el=>{const handler=()=>{const [id,field]=el.dataset.familiarField.split(':'),f=fs.entries.find(x=>x.id===id);if(!f)return;let v=el.value;if(field==='active'){v=v==='1';if(v&&!canActivateFamiliar(f)){notify('Limite: dois comuns, e dois Auxiliares não podem ficar ativos juntos.');el.value='0';return}}if(field==='type'){if(!['auxiliar','montaria','lendario'].includes(v))v='auxiliar';if(f.active&&v!=='lendario'&&!canActivateFamiliar({...f,type:v})){notify('Essa troca deixaria a missão com familiares comuns acima do limite ou com dois Auxiliares ativos.');el.value=f.type;return}f.skills=(f.skills||[]).slice(0,v==='auxiliar'?1:v==='montaria'?2:6)}if(field==='legendaryHpMax')v=Math.max(0,Number(v)||0);f[field]=v;syncCurrentCaps();save();renderSheet()};el.onchange=handler;if(el.tagName==='TEXTAREA'||fieldFrom(el)==='name'||fieldFrom(el)==='legendaryOccasion')el.oninput=()=>{const [id,field]=el.dataset.familiarField.split(':'),f=fs.entries.find(x=>x.id===id);if(f){f[field]=el.value;save()}}});
    document.querySelectorAll('[data-familiar-attr]').forEach(b=>b.onclick=()=>{const [id,k,d]=b.dataset.familiarAttr.split(':'),f=fs.entries.find(x=>x.id===id);if(!f)return;const delta=Number(d),rule=familiarTypeRule(f.type);if(delta>0&&(familiarAttrSpent(f)>=Number(rule.attributePoints||5)||Number(f.attributes[k])>=5))return;if(delta<0&&Number(f.attributes[k])<=0)return;f.attributes[k]=clamp((Number(f.attributes[k])||0)+delta,0,5);save();renderSheet()});
    document.querySelectorAll('[data-familiar-skill]').forEach(el=>el.onchange=()=>{const [id,i]=el.dataset.familiarSkill.split(':'),f=fs.entries.find(x=>x.id===id);if(!f)return;f.skills=f.skills||[];f.skills[Number(i)]=el.value;f.skills=[...new Set(f.skills.filter(Boolean))];save();renderSheet()});
    document.querySelectorAll('[data-familiar-hp]').forEach(b=>b.onclick=()=>{const i=b.dataset.familiarHp.lastIndexOf(':'),id=b.dataset.familiarHp.slice(0,i),delta=Number(b.dataset.familiarHp.slice(i+1)),f=fs.entries.find(x=>x.id===id);if(!f)return;f.currentHp=clamp((Number(f.currentHp)||0)+delta,0,familiarHpMax(f));save();renderSheet()});
    document.querySelectorAll('[data-familiar-hp-apply]').forEach(b=>{const apply=()=>{const id=b.dataset.familiarHpApply,f=fs.entries.find(x=>x.id===id),inp=document.querySelector(`[data-familiar-hp-manual="${id}"]`);if(!f||!inp)return;const v=Number(inp.value);if(!Number.isFinite(v))return;f.currentHp=clamp((Number(f.currentHp)||0)+v,0,familiarHpMax(f));inp.value='';save();renderSheet()};b.onclick=apply;const inp=document.querySelector(`[data-familiar-hp-manual="${b.dataset.familiarHpApply}"]`);if(inp)inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply()}}});
    document.querySelectorAll('[data-familiar-knownvip]').forEach(el=>el.onchange=()=>{const f=fs.entries.find(x=>x.id===el.dataset.familiarKnownvip);if(f){f.knownVip=el.checked;save();renderSheet()}});
    document.querySelectorAll('[data-familiar-approved]').forEach(el=>el.onchange=()=>{const f=fs.entries.find(x=>x.id===el.dataset.familiarApproved);if(f){f.staffApproved=el.checked;save();renderSheet()}});
    document.querySelectorAll('[data-familiar-legendary-used]').forEach(el=>el.onchange=()=>{const f=fs.entries.find(x=>x.id===el.dataset.familiarLegendaryUsed);if(f){f.legendaryUsed=el.checked;save();renderSheet()}});
    const notes=byId('familiarsNotes');if(notes)notes.oninput=e=>{fs.notes=e.target.value;save()};
  }
  function fieldFrom(el){return el?.dataset?.familiarField?.split(':')?.[1]||''}

  function fameTotal(){return (state.roma?.fameEntries||[]).reduce((t,x)=>t+(Number(x.amount)||0),0)}
  function fameBand(){const v=fameTotal();return (romaRules.fameBands||[]).find(b=>v>=b.min&&v<=b.max)||{name:'Sem faixa',summary:''}}
  function affinityGrandTotal(){return (state.roma?.affinityEntries||[]).reduce((t,x)=>t+(Number(x.amount)||0),0)}
  function affinityTotals(){const map=new Map();for(const x of state.roma?.affinityEntries||[]){const target=(x.target||'').trim()||'Sem alvo';map.set(target,(map.get(target)||0)+(Number(x.amount)||0))}return [...map.entries()].map(([target,value])=>({target,value:clamp(value,-100,100)})).sort((a,b)=>a.target.localeCompare(b.target,'pt-BR'))}
  function affinityMark(v){v=clamp(Number(v)||0,-100,100);if(v>=100)return '+100';if(v>=60)return '+60 a +99';if(v>=30)return '+30 a +59';if(v>=0)return '0 a +29';if(v>=-25)return '−25 a −1';if(v>=-50)return '−50 a −26';return '−100 a −51'}
  function rankById(kind,id){const rows=kind==='religio'?romaRules.religioRanks:romaRules.legionRanks;return (rows||[]).find(r=>r.id===id)||null}
  function renderRomaEntry(kind,x){const labels={title:'Título / honra',perm:'Permissão / acesso',deed:'Feito / marco'};return `<div class="subcard roma-entry"><div class="row between"><b>${labels[kind]}</b><button class="danger" data-remove-roma-entry="${kind}:${x.id}">Remover</button></div><div class="grid two compact-fields"><label><span class="label">Nome</span><input data-roma-entry="${kind}:${x.id}:name" value="${esc(x.name||'')}"></label><label><span class="label">Fonte / concessão</span><input data-roma-entry="${kind}:${x.id}:source" value="${esc(x.source||'')}"></label><label class="wide"><span class="label">Notas</span><input data-roma-entry="${kind}:${x.id}:notes" value="${esc(x.notes||'')}"></label></div></div>`}
  function renderRomaTab(){
    const r=state.roma||defaultRoma(),total=fameTotal(),band=fameBand(),leg=rankById('legion',r.legionRank),rel=rankById('religio',r.religioRank),canRebento=total>=100,affTotals=affinityTotals(),affGrand=affinityGrandTotal();
    const fameRows=(r.fameEntries||[]).map(x=>`<div class="subcard ledger-row"><div class="grid four compact-fields"><label><span class="label">Onde conseguiu</span><input data-fame-entry="${x.id}:source" value="${esc(x.source||'')}" placeholder="Missão, chegada, evento..."></label><label><span class="label">Fama</span><input type="number" step="1" data-fame-entry="${x.id}:amount" value="${Number(x.amount)||0}"></label><label><span class="label">Link da mensagem no Discord</span><input data-fame-entry="${x.id}:discordLink" value="${esc(x.discordLink||'')}" placeholder="https://discord.com/channels/..."></label><label><span class="label">Observação</span><input data-fame-entry="${x.id}:notes" value="${esc(x.notes||'')}"></label></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="danger" data-remove-fame-entry="${x.id}">Remover</button></div></div>`).join('');
    const affRows=(r.affinityEntries||[]).map(x=>`<div class="subcard ledger-row"><div class="grid five compact-fields"><label><span class="label">Afinidade com</span><input data-affinity-entry="${x.id}:target" value="${esc(x.target||'')}" placeholder="Deus ou figura importante"></label><label><span class="label">Onde conseguiu</span><input data-affinity-entry="${x.id}:source" value="${esc(x.source||'')}" placeholder="Missão, cena, evento..."></label><label><span class="label">Valor</span><input type="number" step="1" data-affinity-entry="${x.id}:amount" value="${Number(x.amount)||0}"></label><label><span class="label">Link da mensagem no Discord</span><input data-affinity-entry="${x.id}:discordLink" value="${esc(x.discordLink||'')}" placeholder="https://discord.com/channels/..."></label><label><span class="label">Observação</span><input data-affinity-entry="${x.id}:notes" value="${esc(x.notes||'')}"></label></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="danger" data-remove-affinity-entry="${x.id}">Remover</button></div></div>`).join('');
    return `<section class="tab-pane ${state.activeTab==='roma'?'':'hidden'}" data-pane="roma"><div class="grid two"><article class="card"><div class="row between"><div><p class="eyebrow">FAMA</p><h2>${band.name}</h2><p class="muted">${band.summary}</p></div><div class="big-stat">${total}</div></div><p class="muted compact">A Fama é calculada pelo histórico abaixo. Cada ganho ou perda fica registrado com sua origem.</p>${canRebento?`<label class="toggle-inline" style="margin-top:12px"><input id="rebentoApproved" type="checkbox" ${r.rebentoApproved?'checked':''}> requisitos narrativos de Rebento aprovados</label>${!r.rebentoApproved?'<div class="notice" style="margin-top:10px">100 pontos tornam o personagem elegível, mas o título não é concedido só pelos pontos.</div>':'<div class="pill good" style="margin-top:10px">Rebento de Roma Aeterna confirmado</div>'}`:''}</article><article class="card"><p class="eyebrow">CARGOS & RENDA</p><div class="grid two"><label><span class="label">Patente na Legião</span><select id="legionRank">${(romaRules.legionRanks||[]).map(x=>`<option value="${x.id}" ${r.legionRank===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label><label><span class="label">Patente na Religio</span><select id="religioRank">${(romaRules.religioRanks||[]).map(x=>`<option value="${x.id}" ${r.religioRank===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label></div>${leg?.detail?`<div class="subcard compact" style="margin-top:10px"><b>Legião:</b> ${leg.detail}</div>`:''}${rel?.detail?`<div class="subcard compact" style="margin-top:8px"><b>Religio:</b> ${rel.detail}</div>`:''}<div class="grid three compact-fields" style="margin-top:12px"><label><span class="label">Trabalho / função</span><input id="romaJob" value="${esc(r.job||'')}" placeholder="Opcional"></label><label><span class="label">Salário</span><input id="romaJobSalary" type="number" min="0" value="${Number(r.jobSalary)||0}"></label><label><span class="label">Período</span><input id="romaJobPeriod" value="${esc(r.jobPeriod||'')}" placeholder="semana, ação..."></label></div></article></div>
    <section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">HISTÓRICO DE FAMA</p><h2>De onde vieram os pontos</h2></div><button id="addFameEntry" class="primary">+ Registro de fama</button></div><div class="stack">${fameRows||'<div class="notice">Nenhum ganho ou perda de Fama registrado.</div>'}</div></section>
    <div class="grid two mechanics-section"><article class="card"><p class="eyebrow">SERVIÇO ROMANO</p><h2>Legião & cidadania</h2><div class="grid two compact-fields"><label><span class="label">Coorte</span><input id="romaCohort" value="${esc(r.cohort||'')}" placeholder="Ex.: V Coorte"></label><label><span class="label">Situação de cidadania</span><input id="romaCitizenship" value="${esc(r.citizenship||'')}" placeholder="Cidadão, estrangeiro, outra..."></label><label><span class="label">Anos de serviço</span><input id="romaLegionYears" type="number" min="0" step="0.25" value="${Number(r.legionYears)||0}"></label><label><span class="label">Marcas de serviço</span><input id="romaServiceMarks" type="number" min="0" step="1" value="${Number(r.serviceMarks)||0}"></label></div><label class="toggle-inline" style="margin-top:10px"><input id="romaRetired" type="checkbox" ${r.retired?'checked':''}> aposentado / veterano</label></article><article class="card"><p class="eyebrow">PROGRESSÃO</p><h2>Resumo atual</h2><div class="stack compact"><div class="subcard"><b>Fama:</b> ${total} · ${band.name}</div><div class="subcard"><b>Legião:</b> ${leg?.name||'—'}</div><div class="subcard"><b>Religio:</b> ${rel?.name||'—'}</div><div class="subcard"><b>Títulos/honras:</b> ${(r.titles||[]).length}</div><div class="subcard"><b>Permissões:</b> ${(r.permissions||[]).length}</div><div class="subcard"><b>Feitos registrados:</b> ${(r.deeds||[]).length}</div></div></article></div>
    <section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">AFINIDADE</p><h2>Histórico por deus ou figura importante</h2></div><div class="row"><span class="pill">Afinidade total ${signed(affGrand)}</span><button id="addAffinityEntry" class="primary">+ Registro de afinidade</button></div></div><p class="muted">Cada registro informa com quem é a afinidade, onde ela foi conquistada, o valor recebido ou perdido e, opcionalmente, o link da mensagem no Discord.</p>${affTotals.length?`<div class="affinity-summary">${affTotals.map(a=>`<div class="subcard compact"><b>${esc(a.target)}</b><span class="skill-total">${signed(a.value)}</span><small class="muted">${affinityMark(a.value)}</small></div>`).join('')}</div>`:''}<div class="stack" style="margin-top:12px">${affRows||'<div class="notice">Nenhum registro de Afinidade.</div>'}</div></section>
    <div class="grid three mechanics-section"><article class="card"><div class="section-title"><div><p class="eyebrow">TÍTULOS & HONRAS</p><h3>Reconhecimentos</h3></div><button id="addRomaTitle">+</button></div><div class="stack" style="margin-top:10px">${(r.titles||[]).length?r.titles.map(x=>renderRomaEntry('title',x)).join(''):'<p class="muted compact">Nenhum título registrado.</p>'}</div></article><article class="card"><div class="section-title"><div><p class="eyebrow">PERMISSÕES</p><h3>Acessos especiais</h3></div><button id="addRomaPermission">+</button></div><div class="stack" style="margin-top:10px">${(r.permissions||[]).length?r.permissions.map(x=>renderRomaEntry('perm',x)).join(''):'<p class="muted compact">Nenhuma permissão registrada.</p>'}</div></article><article class="card"><div class="section-title"><div><p class="eyebrow">FEITOS</p><h3>Marcos de progressão</h3></div><button id="addRomaDeed">+</button></div><div class="stack" style="margin-top:10px">${(r.deeds||[]).length?r.deeds.map(x=>renderRomaEntry('deed',x)).join(''):'<p class="muted compact">Nenhum feito registrado.</p>'}</div></article></div><article class="card mechanics-section"><label><span class="label">Notas de Roma</span><textarea id="romaNotes" rows="6" placeholder="Eleições, permissões, títulos, cidadania, recompensas, decisões do Senado...">${esc(r.notes||'')}</textarea></label></article></section>`;
  }

  function bindRoma(){
    const r=state.roma;
    const rb=byId('rebentoApproved');if(rb)rb.onchange=e=>{r.rebentoApproved=e.target.checked;save();renderSheet()};
    const lr=byId('legionRank');if(lr)lr.onchange=e=>{r.legionRank=e.target.value;save();renderSheet()};
    const rr=byId('religioRank');if(rr)rr.onchange=e=>{r.religioRank=e.target.value;save();renderSheet()};
    const j=byId('romaJob');if(j)j.oninput=e=>{r.job=e.target.value;save()};const js=byId('romaJobSalary');if(js)js.onchange=e=>{r.jobSalary=Math.max(0,Number(e.target.value)||0);save()};const jp=byId('romaJobPeriod');if(jp)jp.oninput=e=>{r.jobPeriod=e.target.value;save()};
    const addF=byId('addFameEntry');if(addF)addF.onclick=()=>{r.fameEntries.push({id:uid('fame'),source:'',discordLink:'',amount:0,notes:''});save();renderSheet()};
    document.querySelectorAll('[data-remove-fame-entry]').forEach(b=>b.onclick=()=>{r.fameEntries=r.fameEntries.filter(x=>x.id!==b.dataset.removeFameEntry);save();renderSheet()});
    document.querySelectorAll('[data-fame-entry]').forEach(el=>{const handler=()=>{const [id,field]=el.dataset.fameEntry.split(':'),x=r.fameEntries.find(z=>z.id===id);if(!x)return;x[field]=field==='amount'?Number(el.value)||0:el.value;r.fame=fameTotal();save();if(field==='amount')renderSheet()};el.onchange=handler;el.oninput=fieldFromRoma(el)==='amount'?null:handler});
    const addA=byId('addAffinityEntry');if(addA)addA.onclick=()=>{r.affinityEntries.push({id:uid('affentry'),target:'',source:'',discordLink:'',amount:0,notes:''});save();renderSheet()};
    document.querySelectorAll('[data-remove-affinity-entry]').forEach(b=>b.onclick=()=>{r.affinityEntries=r.affinityEntries.filter(x=>x.id!==b.dataset.removeAffinityEntry);save();renderSheet()});
    document.querySelectorAll('[data-affinity-entry]').forEach(el=>{const update=(rerender=false)=>{const [id,field]=el.dataset.affinityEntry.split(':'),x=r.affinityEntries.find(z=>z.id===id);if(!x)return;x[field]=field==='amount'?Number(el.value)||0:el.value;save();if(rerender)renderSheet()};el.onchange=()=>update(fieldFromRoma(el)==='amount'||fieldFromRoma(el)==='target');if(fieldFromRoma(el)!=='amount')el.oninput=()=>update(false)});
    const simpleFields={romaCohort:'cohort',romaCitizenship:'citizenship',romaLegionYears:'legionYears',romaServiceMarks:'serviceMarks'};Object.entries(simpleFields).forEach(([id,field])=>{const el=byId(id);if(!el)return;const handler=()=>{r[field]=['legionYears','serviceMarks'].includes(field)?Math.max(0,Number(el.value)||0):el.value;save()};el.oninput=handler;el.onchange=handler});
    const retired=byId('romaRetired');if(retired)retired.onchange=e=>{r.retired=e.target.checked;save();renderSheet()};
    const addTitle=byId('addRomaTitle');if(addTitle)addTitle.onclick=()=>{r.titles.push({id:uid('title'),name:'',source:'',notes:''});save();renderSheet()};
    const addPerm=byId('addRomaPermission');if(addPerm)addPerm.onclick=()=>{r.permissions.push({id:uid('perm'),name:'',source:'',notes:''});save();renderSheet()};
    const addDeed=byId('addRomaDeed');if(addDeed)addDeed.onclick=()=>{r.deeds.push({id:uid('deed'),name:'',fame:0,notes:''});save();renderSheet()};
    document.querySelectorAll('[data-remove-roma-entry]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.removeRomaEntry.split(':'),arr=kind==='title'?r.titles:kind==='perm'?r.permissions:r.deeds;if(kind==='title')r.titles=arr.filter(x=>x.id!==id);else if(kind==='perm')r.permissions=arr.filter(x=>x.id!==id);else r.deeds=arr.filter(x=>x.id!==id);save();renderSheet()});
    document.querySelectorAll('[data-roma-entry]').forEach(el=>{const handler=()=>{const [kind,id,field]=el.dataset.romaEntry.split(':'),arr=kind==='title'?r.titles:kind==='perm'?r.permissions:r.deeds,x=arr.find(z=>z.id===id);if(!x)return;x[field]=field==='fame'?Number(el.value)||0:el.value;save()};el.oninput=handler;el.onchange=handler});
    const notes=byId('romaNotes');if(notes)notes.oninput=e=>{r.notes=e.target.value;save()};
  }
  function fieldFromRoma(el){return (el?.dataset?.fameEntry||el?.dataset?.affinityEntry||'').split(':')[1]||''}

  function renderHistoryTab(){
    const h=state.history||{};
    return `<section class="tab-pane ${state.activeTab==='history'?'':'hidden'}" data-pane="history"><div class="grid two"><article class="card"><p class="eyebrow">INFORMAÇÕES NARRATIVAS</p><div class="grid two"><label><span class="label">Origem</span><input data-history="origin" value="${esc(h.origin||'')}" placeholder="Cidade, região, contexto..."></label><label><span class="label">Idade</span><input data-history="age" value="${esc(h.age||'')}" placeholder="Opcional"></label></div><label><span class="label">Afiliação / coorte / grupo</span><input data-history="affiliation" value="${esc(h.affiliation||'')}" placeholder="Informação livre"></label><label><span class="label">Descrição curta</span><textarea data-history="description" rows="5" placeholder="Aparência, personalidade ou apresentação...">${esc(h.description||'')}</textarea></label></article><article class="card"><p class="eyebrow">HISTÓRIA DO PERSONAGEM</p><label><span class="label">Resumo da história</span><textarea data-history="summary" rows="10" placeholder="Lore, passado, acontecimentos importantes...">${esc(h.summary||'')}</textarea></label></article></div><div class="grid two mechanics-section"><article class="card"><label><span class="label">Objetivos</span><textarea data-history="goals" rows="8" placeholder="Objetivos atuais, promessas, missões pessoais...">${esc(h.goals||'')}</textarea></label></article><article class="card"><label><span class="label">Vínculos & relações</span><textarea data-history="relationships" rows="8" placeholder="Aliados, família, rivalidades, relações importantes...">${esc(h.relationships||'')}</textarea></label></article></div><article class="card mechanics-section"><label><span class="label">Marcos da campanha</span><textarea data-history="milestones" rows="10" placeholder="Missões, títulos, decisões, acontecimentos que você quer lembrar...">${esc(h.milestones||'')}</textarea></label></article></section>`;
  }

  function renderNotesTab(){
    return `<section class="tab-pane ${state.activeTab==='notes'?'':'hidden'}" data-pane="notes"><article class="card"><p class="eyebrow">NOTAS LIVRES</p><h2>Anotações da mesa</h2><p class="muted">Use como um bloco livre. O conteúdo é salvo automaticamente junto da ficha e também vai no JSON exportado.</p><textarea id="notesField" class="notes-field" rows="24" placeholder="NPCs, pistas, itens, lembretes, combinações, qualquer coisa...">${esc(state.notes||'')}</textarea></article></section>`;
  }

  function renderSheet(){
    syncCurrentCaps();const g=god(),set=effectiveAbilitySet(),fDef=fixedDefense();
    sheetView.innerHTML=`<div class="sheet-frame">${renderCharacterRail(g)}<div class="sheet-main">${renderTabs()}${renderStatusTab(g)}${renderCombatTab(fDef,set)}${renderInventoryTab()}${renderFamiliarsTab()}${renderRomaTab()}${renderMagicTab()}${renderHistoryTab()}${renderNotesTab()}</div></div>`;
    bindSheet();save();
  }
  function renderArmorCard(){
    const a=state.armor,m=material(a.material),t=armorType(a.type),res=m.unbreakable?'∞':clamp(Number(a.resistanceCurrent)||0,0,m.resistance||0);
    return `<article class="card equipment-editor-card" id="armorEditor"><div class="row between"><p class="eyebrow">ARMADURA</p><label class="toggle-inline"><input id="armorEquipped" type="checkbox" ${a.equipped?'checked':''}> ativa</label></div><div class="equipment-editor-head">${imageEditorPreview(a.imageUrl,a.name||'Armadura')}<div class="equipment-editor-fields"><label><span class="label">Nome</span><input id="armorName" value="${esc(a.name)}"></label><div class="row inventory-image-actions"><button id="uploadArmorImage" type="button">Adicionar imagem</button>${a.imageUrl?'<button id="clearArmorImage" type="button">Remover imagem</button>':''}</div></div></div><div class="grid two"><label><span class="label">Tipo</span><select id="armorType">${system.armorTypes.map(x=>`<option value="${x.id}" ${a.type===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label><label><span class="label">Material</span><select id="armorMaterial">${system.materials.map(x=>`<option value="${x.id}" ${a.material===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label></div><div class="subcard compact"><b>${t.name}</b> · +${t.defense} Defesa · ${t.reduction} redução de dano<br><span class="muted">Material: ${m.name} · resistência ${m.unbreakable?'inquebrável':m.resistance} · referência de armadura: ${m.armorHint}</span></div>${!m.unbreakable?`<div class="row between"><span>Resistência atual <b>${res}/${m.resistance}</b></span><div class="row"><button data-armor-res="-1">−1</button><button data-armor-res="1">+1</button></div></div>`:'<div class="pill good">Material inquebrável</div>'}</article>`;
  }
  function renderShieldCard(){
    const sh=state.shield,m=material(sh.material),res=m.unbreakable?'∞':clamp(Number(sh.resistanceCurrent)||0,0,m.resistance||0);
    return `<article class="card equipment-editor-card" id="shieldEditor"><div class="row between"><p class="eyebrow">ESCUDO</p><label class="toggle-inline"><input id="shieldEquipped" type="checkbox" ${sh.equipped?'checked':''}> ativo</label></div><div class="equipment-editor-head">${imageEditorPreview(sh.imageUrl,sh.name||'Escudo')}<div class="equipment-editor-fields"><label><span class="label">Nome</span><input id="shieldName" value="${esc(sh.name)}"></label><div class="row inventory-image-actions"><button id="uploadShieldImage" type="button">Adicionar imagem</button>${sh.imageUrl?'<button id="clearShieldImage" type="button">Remover imagem</button>':''}</div></div></div><label><span class="label">Material</span><select id="shieldMaterial">${system.materials.map(x=>`<option value="${x.id}" ${sh.material===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label><label><span class="label">Estacas do escudo · ${sh.stakes}/30</span><input id="shieldStakes" type="range" min="0" max="30" value="${sh.stakes}"></label><div class="pill ${hasTalent('mestre-escudos')?'good':''}">Mestre de Escudos: ${hasTalent('mestre-escudos')?'ativo':'não adquirido'}</div><div class="subcard compact">Bônus atual de Defesa: <b>+${shieldDefense()}</b>. Aos 30, usa metade do BP arredondada para cima; com Mestre de Escudos, BP completo.</div>${!m.unbreakable?`<div class="row between"><span>Resistência atual <b>${res}/${m.resistance}</b></span><div class="row"><button data-shield-res="-1">−1</button><button data-shield-res="1">+1</button></div></div>`:'<div class="pill good">Material inquebrável</div>'}</article>`;
  }
  function renderWeapon(w){
    const m=material(w.material),wt=weaponType(w.type),res=m.unbreakable?'∞':clamp(Number(w.resistanceCurrent)||0,0,m.resistance||0),broken=!m.unbreakable&&res<=0;
    return `<div class="weapon-card ${broken?'broken':''}" data-weapon-card="${w.id}"><div class="weapon-editor-head">${imageEditorPreview(w.imageUrl,w.name||'Arma')}<div class="weapon-editor-fields"><div class="row between"><input class="weapon-name" data-weapon-field="${w.id}:name" value="${esc(w.name)}"><div class="row"><label class="toggle-inline"><input type="checkbox" data-weapon-equipped="${w.id}" ${w.equipped!==false?'checked':''}> equipada</label><button class="danger" data-remove-weapon="${w.id}">Remover</button></div></div><div class="row inventory-image-actions"><button type="button" data-upload-weapon-image="${w.id}">Adicionar imagem</button>${w.imageUrl?`<button type="button" data-clear-weapon-image="${w.id}">Remover imagem</button>`:''}</div></div></div><div class="weapon-grid"><label><span class="label">Tipo</span><select data-weapon-field="${w.id}:type">${system.weaponTypes.map(x=>`<option value="${x.id}" ${w.type===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label><label><span class="label">Atributo</span><select data-weapon-field="${w.id}:attr"><option value="for" ${w.attr==='for'?'selected':''}>Força</option><option value="des" ${w.attr==='des'?'selected':''}>Destreza</option></select></label><label><span class="label">Material</span><select data-weapon-field="${w.id}:material">${system.materials.map(x=>`<option value="${x.id}" ${w.material===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label><label><span class="label">Estacas · ${w.stakes}/30</span><input type="range" min="0" max="30" value="${w.stakes}" data-weapon-field="${w.id}:stakes"></label><label><span class="label">Bônus ataque extra</span><input type="number" value="${Number(w.attackExtra)||0}" data-weapon-field="${w.id}:attackExtra"></label><label><span class="label">Bônus dano extra</span><input type="number" value="${Number(w.damageExtra)||0}" data-weapon-field="${w.id}:damageExtra"></label></div><div class="row weapon-results"><span class="pill">Ataque ${signed(weaponAttack(w))}</span><span class="pill">Dano ${weaponDamageFormula(w)}</span><span class="pill ${Number(w.stakes)>=30?'good':''}">${Number(w.stakes)>=30?'Dominada · BP aplicado':'Sem BP · precisa 30 estacas'}</span><span class="pill">Material ${signed(m.attack)} ataque</span></div><div class="row between"><span class="muted compact">${wt.name} · resistência ${m.unbreakable?'inquebrável':`${res}/${m.resistance}`}${broken?' · QUEBRADA':''}</span>${!m.unbreakable?`<div class="row"><button data-weapon-res="${w.id}:-1">−1 Resist.</button><button data-weapon-res="${w.id}:1">+1 Resist.</button></div>`:''}</div></div>`;
  }
  function sourceOption(value,label,current){return `<option value="${value}" ${current===value?'selected':''}>${label}</option>`}
  function renderSkillMatrix(){
    return `<article class="card skills-ledger-card"><div class="row between skills-ledger-head"><div><p class="eyebrow">PERÍCIAS</p><h3>Todas as perícias</h3></div><span class="pill">BP +${bp()}</span></div><div class="skill-ledger">${skills.map(sk=>{
      const automatic=automaticSkillSources(sk.name),meta=skillMetaFor(sk.name),trained=skillIsProficient(sk.name),expert=skillHasExpertise(sk.name),sources=skillSources(sk.name),fixed=god()?.skillBonuses?.[sk.name]||0;
      const sourceHtml=automatic.length?`<div class="skill-source-tags">${sources.map(x=>`<span class="skill-source-tag">${x}</span>`).join('')}</div>`:`<select class="skill-source-select" data-skill-source="${esc(sk.name)}" ${meta.proficient?'':'disabled'}>${sourceOption('prole','Prole',meta.source)}${sourceOption('inicial','Inicial',meta.source)}${sourceOption('treino','Treino',meta.source)}${sourceOption('nivel-20','Nível 20',meta.source)}${sourceOption('nivel-40','Nível 40',meta.source)}${sourceOption('talento','Talento',meta.source)}${sourceOption('extras','Extras',meta.source)}</select>`;
      return `<div class="skill-ledger-row ${trained?'trained':''} ${expert?'expert':''}"><div class="skill-row-main"><div class="skill-ledger-flags"><label class="skill-tiny-check ${trained?'active':''}" title="Perito"><input type="checkbox" data-skill-manual="${esc(sk.name)}" ${trained?'checked':''} ${automatic.length?'disabled':''}><span>P</span></label><label class="skill-tiny-check expert ${expert?'active':''}" title="Expertise"><input type="checkbox" data-skill-expertise="${esc(sk.name)}" ${expert?'checked':''} ${trained?'':'disabled'}><span>E</span></label></div><div class="skill-ledger-name"><b>${sk.name}</b><small>${attrName(sk.attr)}${fixed?` · kit ${signed(fixed)}`:''}</small></div><strong class="skill-roll-value">${signed(skillValue(sk.name))}</strong><details class="skill-settings"><summary title="Editar origem">•••</summary><div class="skill-settings-body">${sourceHtml}<input class="skill-detail-inline" data-skill-detail="${esc(sk.name)}" value="${esc(meta.detail||'')}" placeholder="Detalhe / origem"></div></details></div></div>`;
    }).join('')}</div><p class="muted mini-help">P = Perito · E = Expertise. Abra “origem” apenas quando precisar editar a fonte.</p></article>`;
  }
  function renderSkillTrainingCard(){
    const chosen=new Set([...state.initialSkills,...divineGranted(),...talentGrantedSkills(),...Object.values(state.levelSkillChoices||{}).filter(Boolean),...state.skillTrainings.map(t=>t.name)]),available=skills.filter(s=>!chosen.has(s.name));
    return `<article class="card"><div class="row between"><div><h3>Novas perícias em treinamento</h3><p class="muted compact">Treinamentos adicionais nos níveis 21, 41, 61, 81 e 100. A perícia só passa a somar BP quando alcançar 30 estacas.</p></div><span class="pill">${availableSkillTrainingSlots()} vaga(s)</span></div>${availableSkillTrainingSlots()>0&&available.length?`<div class="row"><select id="newTrainingSkill" style="flex:1"><option value="">Escolha uma perícia…</option>${available.map(s=>`<option>${s.name}</option>`).join('')}</select><button id="addSkillTraining" class="primary">Adicionar</button></div>`:''}<div class="stack" style="margin-top:12px">${state.skillTrainings.length?state.skillTrainings.map(t=>`<div class="subcard"><div class="row between"><div><b>${t.name}</b><div class="muted compact">${t.stakes>=30?'Dominada · fonte Treino · BP aplicado':'Em treinamento · ainda sem BP'}</div></div><button data-remove-skill-training="${t.id}" class="danger">Remover</button></div><label><span class="label">Estacas · ${t.stakes}/30</span><input type="range" min="0" max="30" value="${t.stakes}" data-skill-training="${t.id}"></label><div class="row between"><span>Bônus atual</span><b>${signed(skillValue(t.name))}</b></div></div>`).join(''):'<p class="muted">Nenhuma nova perícia em treinamento.</p>'}</div>${state.skillTrainings.length>skillTrainingSlots()?'<div class="notice">Há mais treinamentos salvos do que o nível atual permite. Nada foi apagado ao reduzir o nível, mas novas escolhas ficam bloqueadas.</div>':''}</article>`;
  }

  function lineageAbilityTitle(){const a=primaryGod(),b=secondaryGod(),t=state.lineage?.type||'normal';if(t==='compound'&&b)return `${a.name} · legado de ${b.name}`;if(t==='direct'&&b)return `${a.name} + ${b.name} · Legado Direto`;return a.name}
  function talentParameterHtml(inst,def){const p=inst.params||{};let out='';const attrOpts=ATTRS.map(([k,a,l])=>`<option value="${k}" ${p.attribute===k?'selected':''}>${l}</option>`).join('');if(def.params?.includes('attribute'))out+=`<label><span class="label">Atributo</span><select data-talent-param="${inst.id}:attribute"><option value="">Selecione…</option>${attrOpts}</select></label>`;if(def.params?.includes('element'))out+=`<label><span class="label">Elemento</span><input data-talent-param="${inst.id}:element" value="${esc(p.element||'')}" placeholder="Ex.: fogo, gelo..."></label>`;if(def.params?.includes('skill'))out+=`<label><span class="label">Perícia</span><select data-talent-param="${inst.id}:skill"><option value="">Selecione…</option>${skills.map(sk=>`<option ${p.skill===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`;if(def.params?.some(x=>/^skill[123]$/.test(x))){for(const key of ['skill1','skill2','skill3'])out+=`<label><span class="label">Perícia</span><select data-talent-param="${inst.id}:${key}"><option value="">Selecione…</option>${skills.map(sk=>`<option ${p[key]===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`}return out}
  function talentPreviewHtml(def){
    if(!def)return `<div class="talent-preview empty"><b>Leia antes de escolher</b><p>Selecione um talento acima para ver o que ele faz antes de adicioná-lo à ficha.</p></div>`;
    const details=[];if(def.minLevel>1)details.push(`Nível mínimo ${def.minLevel}`);details.push(def.repeatable?'Pode ser repetido':'Não repetível');if(def.manual)details.push('Controle manual');
    return `<div class="talent-preview"><div class="row between"><div><span class="label">Talento selecionado</span><h3>${def.name}</h3></div><span class="pill">${details.join(' · ')}</span></div><p>${def.description}</p>${def.params?.length?`<p class="muted compact">Após adicionar, a ficha abrirá ${def.params.length===1?'a escolha necessária':'as escolhas necessárias'} para configurar este talento.</p>`:''}</div>`;
  }
  function renderTalentsSection(){
    const earned=talentSlotsEarned(),used=standardTalentsUsed(),eligible=talentsDb,preview=talentDef(state.talentDraftId);
    return `<section class="mechanics-section"><div class="section-title"><div><p class="eyebrow">TALENTOS</p><h2>Desenvolvimento do personagem</h2></div><span class="pill">Padrão ${used}/${earned}</span></div><article class="card"><p class="muted">Slots padrão nos níveis 1, 30, 60 e 90. Selecione um talento para ler a descrição primeiro; ele só entra na ficha quando você clicar em Adicionar.</p><div class="talent-picker"><select id="newTalentDef"><option value="">Escolha um talento para consultar…</option>${eligible.map(t=>`<option value="${t.id}" ${state.talentDraftId===t.id?'selected':''}>${t.name}${t.minLevel>1?` · Nv ${t.minLevel}+${state.level<t.minLevel?' · bloqueado':''}`:''}</option>`).join('')}</select><div id="talentPreview">${talentPreviewHtml(preview)}</div><div class="row"><button id="addStandardTalent" class="primary" ${used>=earned||!preview||(preview&&state.level<preview.minLevel)?'disabled':''}>Adicionar padrão</button><button id="addExtraTalent" ${!preview||(preview&&state.level<preview.minLevel)?'disabled':''}>Adicionar extra</button></div></div><div class="talent-grid">${(state.talents||[]).length?(state.talents||[]).map(inst=>{const def=talentDef(inst.talentId)||{name:'Talento desconhecido',description:'',manual:true};return `<div class="subcard talent-card"><div class="row between"><div><b>${def.name}</b><div class="muted compact">${inst.extra?'Extra / concedido':'Slot padrão'}${def.manual?' · controle manual':''}</div></div><button class="danger" data-remove-talent="${inst.id}">Remover</button></div><p class="compact">${def.description}</p><div class="talent-params">${talentParameterHtml(inst,def)}</div><label><span class="label">Notas</span><input data-talent-notes="${inst.id}" value="${esc(inst.notes||'')}" placeholder="Fonte, detalhe, uso aprovado..."></label></div>`}).join(''):'<div class="notice">Nenhum talento selecionado.</div>'}</div>${hasTalent('pau-toda-obra')?`<div class="notice">Pau pra Toda Obra ativo: some <b>+${talentCount('pau-toda-obra')}d4</b> em Testes de Perícia. A ficha não transforma este dado em bônus fixo.</div>`:''}</article></section>`;
  }
  function renderLegacySection(){
    const type=state.lineage?.type||'normal',main=primaryGod(),sub=secondaryGod();
    if(isTriumvir(state.godId))return `<section class="mechanics-section"><article class="card"><p class="eyebrow">LEGADO</p><h2>Kit Triunviral</h2><div class="notice">Triúnviros não participam do sistema de mistura de kits por Legado. O kit permanece integral.</div></article></section>`;
    const eligible=eligibleLegacyGods();
    let controls=`<div class="grid two"><label><span class="label">Tipo</span><select id="lineageType"><option value="normal" ${type==='normal'?'selected':''}>Filho direto</option><option value="compound" ${type==='compound'?'selected':''}>Legado Composto</option><option value="direct" ${type==='direct'?'selected':''}>Legado Direto</option></select></label>${type!=='normal'?`<label><span class="label">Segundo deus</span><select id="secondaryGodSelect">${eligible.map(g=>`<option value="${g.id}" ${state.lineage.secondaryGodId===g.id?'selected':''}>${g.name}</option>`).join('')}</select></label>`:''}</div>`;
    if(type==='normal')return `<section class="mechanics-section"><article class="card"><p class="eyebrow">LEGADO</p><h2>Linhagem</h2>${controls}<p class="muted">Nenhuma mistura de kits ativa.</p></article></section>`;
    if(!sub)return `<section class="mechanics-section"><article class="card"><p class="eyebrow">LEGADO</p><h2>Linhagem</h2>${controls}<div class="notice">Escolha um segundo deus para configurar o Legado.</div></article></section>`;
    const a=baseAbilitySet(state.godId),b=baseAbilitySet(sub.id);
    if(type==='compound'){
      const reps=state.lineage.compoundPassiveReplacements||[];
      const activeReps=state.lineage.compoundActiveReplacements||[];
      const activeRows=[0,1].map(row=>{
        const r=activeReps[row]||{},primaryIndex=r.primaryIndex===''||r.primaryIndex==null?'':Number(r.primaryIndex),target=primaryIndex===''?null:a.actives[primaryIndex];
        const candidates=target?b.actives.filter(x=>Number(x.level)<=Number(target.level)):[];
        return `<div class="subcard"><b>Substituição ativa ${row+1}</b><p class="muted compact">Escolha primeiro qual habilidade do kit principal será trocada. Depois, escolha uma habilidade da segunda origem de <b>mesmo nível ou menor</b>.</p><label><span class="label">Ativa do kit principal</span><select data-legacy-active-row="${row}:primaryIndex"><option value="">Nenhuma</option>${a.actives.slice(0,5).map((x,i)=>`<option value="${i}" ${primaryIndex===i?'selected':''}>Nv ${x.level} · ${x.name}</option>`).join('')}</select></label><label><span class="label">Ativa do legado</span><select data-legacy-active-row="${row}:secondaryId" ${target?'':'disabled'}><option value="">${target?'Selecione…':'Escolha a ativa principal primeiro'}</option>${candidates.map(x=>`<option value="${x.id}" ${r.secondaryId===x.id?'selected':''}>Nv ${x.level} · ${x.name}</option>`).join('')}</select></label>${target?`<small class="muted">Pode escolher qualquer ativa de ${sub.name} até o nível ${target.level}.</small>`:''}</div>`;
      }).join('');
      return `<section class="mechanics-section"><article class="card"><p class="eyebrow">LEGADO COMPOSTO</p><h2>${main.name} + ${sub.name}</h2>${controls}<p class="muted">Mantém o kit principal. Substitua até 3 passivas e até 2 das primeiras 5 ativas. Nas ativas, a habilidade herdada pode ser do <b>mesmo nível ou de um nível inferior</b> à habilidade que está sendo substituída.</p><div class="grid three legacy-grid">${[0,1,2].map(row=>{const r=reps[row]||{};return `<div class="subcard"><b>Substituição passiva ${row+1}</b><label><span class="label">Passiva do kit principal</span><select data-legacy-passive-row="${row}:primaryIndex"><option value="">Nenhuma</option>${a.passives.map((x,i)=>`<option value="${i}" ${Number(r.primaryIndex)===i?'selected':''}>${i+1}. ${x.name}</option>`).join('')}</select></label><label><span class="label">Passiva do legado</span><select data-legacy-passive-row="${row}:secondaryId"><option value="">Selecione…</option>${b.passives.map(x=>`<option value="${x.id}" ${r.secondaryId===x.id?'selected':''}>${x.name}</option>`).join('')}</select></label></div>`}).join('')}</div><div class="grid two legacy-active-grid" style="margin-top:12px">${activeRows}</div></article></section>`;
    }
    const pa=new Set(state.lineage.directPrimaryPassives||[]),pb=new Set(state.lineage.directSecondaryPassives||[]);
    return `<section class="mechanics-section"><article class="card"><p class="eyebrow">LEGADO DIRETO</p><h2>${main.name} + ${sub.name}</h2>${controls}<div class="notice">Regra automatizada: 4 passivas de uma origem + 3 da outra; as primeiras 5 ativas dos dois kits; nenhuma habilidade 6+.</div><label><span class="label">Kit estrutural para HP, conjuração e bônus</span><select id="structureGodSelect"><option value="${main.id}" ${state.lineage.structureGodId===main.id?'selected':''}>${main.name}</option><option value="${sub.id}" ${state.lineage.structureGodId===sub.id?'selected':''}>${sub.name}</option></select></label><div class="grid two" style="margin-top:12px"><div class="subcard"><b>${main.name} · escolha 4 (${pa.size}/4)</b><div class="stack" style="margin-top:8px">${a.passives.map(x=>`<label class="skill-check"><input type="checkbox" data-direct-passive="primary:${x.id}" ${pa.has(x.id)?'checked':''}><span>${x.name}</span></label>`).join('')}</div></div><div class="subcard"><b>${sub.name} · escolha 3 (${pb.size}/3)</b><div class="stack" style="margin-top:8px">${b.passives.map(x=>`<label class="skill-check"><input type="checkbox" data-direct-passive="secondary:${x.id}" ${pb.has(x.id)?'checked':''}><span>${x.name}</span></label>`).join('')}</div></div></div><p class="muted compact" style="margin-top:12px">As ativas 1–5 de ambos os kits entram automaticamente na aba Habilidades.</p></article></section>`;
  }

  function bindTalents(){
    const sel=byId('newTalentDef');if(sel)sel.onchange=()=>{state.talentDraftId=sel.value;const def=talentDef(sel.value),box=byId('talentPreview');if(box)box.innerHTML=talentPreviewHtml(def);const locked=!!def&&state.level<def.minLevel,standard=byId('addStandardTalent'),extra=byId('addExtraTalent');if(standard)standard.disabled=!sel.value||locked||standardTalentsUsed()>=talentSlotsEarned();if(extra)extra.disabled=!sel.value||locked;save()};
    const add=(extra)=>{const picker=byId('newTalentDef'),id=picker?.value,def=talentDef(id);if(!def)return;if(!extra&&standardTalentsUsed()>=talentSlotsEarned())return;if(state.level<def.minLevel){notify(`Este talento exige nível ${def.minLevel}.`);return}if(def.repeatable===false&&hasTalent(id)){notify('Este talento só pode ser escolhido uma vez.');return}state.talents.push({id:uid('talent'),talentId:id,extra:!!extra,params:{},notes:''});state.talentDraftId='';syncCurrentCaps();save();renderSheet()};
    const a=byId('addStandardTalent');if(a)a.onclick=()=>add(false);const e=byId('addExtraTalent');if(e)e.onclick=()=>add(true);document.querySelectorAll('[data-remove-talent]').forEach(b=>b.onclick=()=>{state.talents=state.talents.filter(t=>t.id!==b.dataset.removeTalent);syncCurrentCaps();save();renderSheet()});document.querySelectorAll('[data-talent-param]').forEach(el=>el.onchange=()=>{const idx=el.dataset.talentParam.indexOf(':'),id=el.dataset.talentParam.slice(0,idx),key=el.dataset.talentParam.slice(idx+1),t=state.talents.find(x=>x.id===id);if(!t)return;t.params=t.params||{};if(t.talentId==='aumento-atributo'&&key==='attribute'&&el.value){const without=(state.baseAttributes[el.value]||0)+(state.levelAttributes[el.value]||0)+(god()?.bonuses?.[el.value]||0)+talentAttributeBonus(el.value)-(t.params.attribute===el.value?1:0);if(without>=5){notify('Este atributo já atingiu 5 na camada não divina.');el.value=t.params.attribute||'';return}}if(t.talentId==='adepto-elemental'&&key==='element'&&el.value.trim()){const chosen=el.value.trim().toLocaleLowerCase('pt-BR'),duplicate=(state.talents||[]).some(x=>x.id!==t.id&&x.talentId==='adepto-elemental'&&String(x.params?.element||'').trim().toLocaleLowerCase('pt-BR')===chosen);if(duplicate){notify('Adepto Elemental precisa usar um elemento diferente em cada escolha.');el.value=t.params.element||'';return}}t.params[key]=el.value;syncCurrentCaps();save();renderSheet()});document.querySelectorAll('[data-talent-notes]').forEach(el=>el.onchange=()=>{const t=state.talents.find(x=>x.id===el.dataset.talentNotes);if(t){t.notes=el.value;save()}})
  }
  function bindLegacy(){
    const t=byId('lineageType');
    if(t)t.onchange=e=>{const type=e.target.value;if(type!=='normal'&&isTriumvir(state.godId)){notify('Triúnviros não participam da mistura por Legado.');return}resetLineage(type);save();renderSheet()};
    const s=byId('secondaryGodSelect');
    if(s)s.onchange=e=>{state.lineage.secondaryGodId=e.target.value;state.lineage.compoundPassiveReplacements=[];state.lineage.compoundActiveReplacements=[];state.lineage.compoundActiveSlots=[];if(state.lineage.type==='direct')initializeDirectSelections();save();renderSheet()};
    const st=byId('structureGodSelect');if(st)st.onchange=e=>{state.lineage.structureGodId=e.target.value;syncCurrentCaps();save();renderSheet()};
    document.querySelectorAll('[data-legacy-passive-row]').forEach(el=>el.onchange=()=>{const [rowS,field]=el.dataset.legacyPassiveRow.split(':'),row=Number(rowS);while(state.lineage.compoundPassiveReplacements.length<3)state.lineage.compoundPassiveReplacements.push({primaryIndex:'',secondaryId:''});state.lineage.compoundPassiveReplacements[row][field]=field==='primaryIndex'&&el.value!==''?Number(el.value):el.value;save();renderSheet()});
    document.querySelectorAll('[data-legacy-active-row]').forEach(el=>el.onchange=()=>{
      const [rowS,field]=el.dataset.legacyActiveRow.split(':'),row=Number(rowS);
      state.lineage.compoundActiveReplacements=state.lineage.compoundActiveReplacements||[];
      while(state.lineage.compoundActiveReplacements.length<2)state.lineage.compoundActiveReplacements.push({primaryIndex:'',secondaryId:''});
      const current=state.lineage.compoundActiveReplacements[row];
      if(field==='primaryIndex'){
        current.primaryIndex=el.value===''?'':Number(el.value);
        const mainSet=baseAbilitySet(state.godId),subSet=baseAbilitySet(state.lineage.secondaryGodId),target=current.primaryIndex===''?null:mainSet?.actives?.[current.primaryIndex],chosen=subSet?.actives?.find(x=>x.id===current.secondaryId);
        if(!target||!chosen||Number(chosen.level)>Number(target.level))current.secondaryId='';
      }else{
        const mainSet=baseAbilitySet(state.godId),subSet=baseAbilitySet(state.lineage.secondaryGodId),target=current.primaryIndex===''?null:mainSet?.actives?.[current.primaryIndex],chosen=subSet?.actives?.find(x=>x.id===el.value);
        if(el.value&&(!target||!chosen||Number(chosen.level)>Number(target.level))){notify('A habilidade herdada precisa ser do mesmo nível ou menor que a habilidade substituída.');renderSheet();return}
        current.secondaryId=el.value;
      }
      // A mesma habilidade principal ou herdada não pode ocupar duas substituições ao mesmo tempo.
      const other=state.lineage.compoundActiveReplacements[row===0?1:0];
      if(other&&current.primaryIndex!==''&&other.primaryIndex===current.primaryIndex){notify('Essa habilidade principal já está sendo substituída no outro espaço.');current.primaryIndex='';current.secondaryId=''}
      if(other&&current.secondaryId&&other.secondaryId===current.secondaryId){notify('Essa habilidade do legado já foi escolhida no outro espaço.');current.secondaryId=''}
      save();renderSheet();
    });
    document.querySelectorAll('[data-direct-passive]').forEach(el=>el.onchange=()=>{const [side,id]=el.dataset.directPassive.split(':'),key=side==='primary'?'directPrimaryPassives':'directSecondaryPassives',max=side==='primary'?4:3,arr=state.lineage[key]||[];if(el.checked){if(arr.length>=max){notify(`Escolha exatamente ${max} passivas deste lado.`);renderSheet();return}if(!arr.includes(id))arr.push(id)}else state.lineage[key]=arr.filter(x=>x!==id);save();renderSheet()})
  }


  function renderExhaustion(){
    return `<div><div class="row between"><h3>Exaustão</h3><b>${state.exhaustion}/6</b></div><div class="row exhaustion-dots">${[0,1,2,3,4,5,6].map(n=>`<button data-exhaustion="${n}" class="${state.exhaustion===n?'primary':''}">${n}</button>`).join('')}</div><div class="subcard compact" style="margin-top:10px"><b>Efeito atual:</b> ${state.exhaustion?`${exhaustionRollPenalty()} em todos os d20 e −${state.exhaustion*5}m de deslocamento.`:'sem penalidade.'}${state.exhaustion>=5?' No nível 5, HP e Energia máximos ficam pela metade.':''}${state.exhaustion>=6?' <strong>Exaustão 6 significa morte.</strong>':''}</div></div>`;
  }
  function renderDeath(){
    const d=state.death,active=state.currentHp===0;
    const counters=`<div class="grid two"><div class="death-count success"><span>Sucessos</span><b>${d.successes}/3</b></div><div class="death-count failure"><span>Falhas</span><b>${d.failures}/3</b></div></div>`;
    if(!active)return `<div class="death-panel inactive"><div class="row between"><div><p class="eyebrow">VIDA & MORTE</p><h3>Testes contra a morte</h3></div><span class="pill good">Inativos · HP ${state.currentHp}</span></div>${counters}<p class="muted compact">Os testes ficam ativos automaticamente quando o HP chegar a 0. Regra: 10+ = sucesso; abaixo de 10 = falha; 1 natural = 2 falhas; 20 natural = recupera 1 HP e pode agir.</p><div class="subcard compact"><b>Ao sofrer dano em 0 HP:</b> +1 falha; se for crítico, +2 falhas. Medicina DT 10 estabiliza. Após 3 sucessos, estabiliza; após 3 falhas, morre.</div><div class="subcard compact"><b>Retornos após chegar a 0 HP:</b> ${d.returnCount||0}<br><span class="muted">Retornar à consciência não aplica penalidade cumulativa.</span></div></div>`;
    return `<div class="death-panel ${d.dead?'dead':''}"><div class="row between"><div><p class="eyebrow">VIDA & MORTE</p><h3>${d.dead?'Morto':d.stable?'Estável':'Testes contra a morte'}</h3></div><span class="pill warn">HP 0</span></div>${counters}${d.lastRoll!==null?`<div class="roll-result"><span>Último teste</span><b>${d.lastRoll}</b></div>`:''}${!d.dead&&!d.stable?`<div class="row death-manual"><button id="deathSuccessManual">+1 sucesso</button><button id="deathFailureManual">+1 falha</button></div><button id="rollDeath" class="primary wide-button">Rolar 1d20 na ficha</button><p class="muted compact">Se preferir rolar no Discord, use os botões de sucesso/falha acima. 10+ sucesso · abaixo de 10 falha · 1 natural = 2 falhas · 20 natural = 1 HP e pode agir.</p><div class="row"><button id="deathDamage">Dano a 0 HP · +1 falha</button><button id="deathCrit">Crítico a 0 HP · +2 falhas</button><button id="medicineStabilize">Medicina DT 10 · estabilizar</button></div>`:''}${d.stable&&!d.dead?`<div class="notice">3 sucessos: estabilizado. Sem cura, recupera 1 HP após 1d4 horas.</div><button id="stableRecover">Recuperar 1 HP após 1d4h</button>`:''}${d.dead?`<div class="notice danger-note">3 falhas: personagem morto.</div><button id="narrativeRestore">Intervenção narrativa · restaurar 1 HP</button>`:''}<div class="subcard compact" style="margin-top:10px">Retornos após atingir 0 HP: <b>${d.returnCount||0}</b>. <span class="muted">Não existe penalidade cumulativa por retornar.</span></div></div>`;
  }

  function magicAbilityStakeMax(a){
    if(!state.magic?.enabled)return 30;
    const source=a?.sourceGodId||state.godId;
    const exemptGods=new Set(['jano','libitina','trivia','somnia']);
    const set=abilitiesDb[source];
    const activeIndex=set?.actives?.findIndex(x=>x.id===a?.id) ?? -1;
    if(a?.type==='active'&&exemptGods.has(source)&&activeIndex>=0&&activeIndex<4)return 30;
    return 29;
  }

  function renderAbilities(set){
    const passives=Array.isArray(set?.passives)?set.passives:[],actives=Array.isArray(set?.actives)?set.actives:[];
    return `<section class="abilities-wrap mechanics-section"><div class="section-title ability-section-head"><div><p class="eyebrow">PODERES DIVINOS</p><h2>${lineageAbilityTitle()}</h2><p class="muted compact">As três estacas ficam sempre visíveis. A faixa atual é destacada sem esconder as demais regras.</p></div><div class="row"><span class="pill">${passives.length} passivas</span><span class="pill">${actives.length} ativas</span></div></div><div class="ability-group"><div class="ability-group-title"><b>Passivas</b><span>sempre disponíveis quando a regra permitir</span></div><div class="ability-grid">${passives.length?passives.map(renderAbility).join(''):'<div class="notice">Nenhuma passiva carregada.</div>'}</div></div><div class="ability-group"><div class="ability-group-title"><b>Ativas</b><span>nível, custo e uso em combate</span></div><div class="ability-grid">${actives.length?actives.map(renderAbility).join(''):'<div class="notice">Nenhuma ativa carregada.</div>'}</div></div></section>`;
  }
  function coreSubStakeKey(a,variantId,subId){return `${abilityKey(a)}:core:${variantId}:${subId}`}
  function coreStakeValue(key){return clamp(Number(state.abilityStakes?.[key]||0),0,30)}
  function coreTierCurrent(tier,value){const min=Number(tier?.min??0),max=tier?.max==null?Infinity:Number(tier.max);return value>=min&&value<=max}
  function renderCoreTierRows(tiers,key){
    const value=coreStakeValue(key);
    return `<div class="core-subtiers">${(tiers||[]).map(t=>`<div class="core-subtier ${coreTierCurrent(t,value)?'current':''}"><b>${esc(t.label||t.id||'Estaca')}</b><p>${esc(t.text||'')}</p></div>`).join('')}</div><div class="core-substake"><div class="row between"><span>Estacas</span><b>${value}/30</b></div><input type="range" min="0" max="30" value="${value}" data-core-stakes="${esc(key)}"><div class="stake-quick"><button data-core-stake-set="${esc(key)}:0">0</button><button data-core-stake-set="${esc(key)}:16">16</button><button data-core-stake-set="${esc(key)}:30">30</button></div></div>`;
  }
  function renderCoreVariant(a,v){
    const stats=v.stats?Object.entries(v.stats).map(([k,val])=>`<span><small>${k==='hpFormula'?'HP':k==='defense'?'DEFESA':esc(k)}</small><b>${esc(val)}</b></span>`).join(''):'';
    const traits=(v.traits||[]).length?`<ul>${v.traits.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
    const abilities=(v.abilities||[]).map(sub=>{const key=coreSubStakeKey(a,v.id||v.name,sub.id||sub.name);return `<section class="core-subability"><h5>${esc(sub.name)}</h5>${sub.description?`<p>${esc(sub.description)}</p>`:''}${(sub.tiers||[]).length?renderCoreTierRows(sub.tiers,key):''}</section>`}).join('');
    return `<article class="core-variant"><header><h4>${esc(v.name)}</h4>${v.description?`<p>${esc(v.description)}</p>`:''}</header>${stats?`<div class="core-stat-pills">${stats}</div>`:''}${traits}${abilities?`<div class="core-variant-abilities">${abilities}</div>`:''}</article>`;
  }
  function renderCoreBlocks(a){
    const blocks=Array.isArray(a.coreBlocks)?a.coreBlocks:[];
    if(!blocks.length)return '';
    return `<div class="core-blocks">${blocks.map(b=>{
      if(b.type==='description'){if(String(b.text||'').trim()===String(a.summary||'').trim())return '';return `<p class="core-description">${esc(b.text||'')}</p>`;}
      if(b.type==='note')return `<div class="core-note">${esc(b.text||'')}</div>`;
      if(b.type==='tiers')return a.tiers?'':`<div class="core-subtiers plain">${(b.items||[]).map(t=>`<div class="core-subtier"><b>${esc(t.label||t.id)}</b><p>${esc(t.text||'')}</p></div>`).join('')}</div>`;
      if(b.type==='variants')return `<div class="core-complex"><div class="core-block-label">${esc(b.label||'Variantes')}</div><div class="core-variant-grid">${(b.items||[]).map(v=>renderCoreVariant(a,v)).join('')}</div></div>`;
      if(b.type==='options')return `<div class="core-complex"><div class="core-block-label">${esc(b.label||'Opções')}</div><div class="core-option-grid">${(b.items||[]).map(o=>`<article><h4>${esc(o.name)}</h4>${o.base?`<p>${esc(o.base)}</p>`:''}${o.upgrade?`<small>${esc(o.upgrade)}</small>`:''}</article>`).join('')}</div></div>`;
      return '';
    }).join('')}</div>`;
  }

  function renderAbility(a){
    const maxSt=magicAbilityStakeMax(a),rawSt=stakesOf(a),st=Math.min(rawSt,maxSt),locked=a.type==='active'&&state.level<a.level,cost=a.type==='active'?a.cost:null;
    const tiers=a.tiers?[['low','0–15',a.tiers.low,st<=15],['mid','16–29',a.tiers.mid,st>=16&&st<=29],['high','30+',a.tiers.high,st>=30]].filter(x=>x[2]):[];
    return `<article class="ability-card ${locked?'ability-locked':''} ${a.type==='active'?'active-ability':'passive-ability'}"><div class="ability-head"><div><div class="row ability-title-row"><b>${a.name}</b>${a.sourceGodId&&a.sourceGodId!==state.godId?`<span class="pill warn">${godById(a.sourceGodId)?.name||'Legado'}</span>`:''}</div><div class="ability-meta">${a.type==='active'?(a.isExtra?'<span>Extra</span>':`<span>Nv ${a.level}</span><span>${cost} EN</span>`):'<span>Passiva</span>'}${state.magic?.enabled&&maxSt===29?'<span>mágico · até 29</span>':''}</div></div></div><p class="ability-summary">${a.summary}</p>${renderCoreBlocks(a)}${tiers.length?`<div class="ability-tier-list">${tiers.map(([key,label,text,current])=>`<div class="ability-tier ${current?'current':''}" data-tier="${key}"><b>${label}</b><p>${text}</p></div>`).join('')}</div><div class="stake-compact"><div class="row between"><span>Estacas</span><b>${st}/${maxSt}</b></div><input type="range" min="0" max="${maxSt}" value="${st}" data-stakes="${abilityKey(a)}" data-stake-max="${maxSt}"><div class="stake-quick"><button data-stake-set="${abilityKey(a)}:0" data-stake-limit="${maxSt}">0</button><button data-stake-set="${abilityKey(a)}:16" data-stake-limit="${maxSt}">16</button>${maxSt>=30?`<button data-stake-set="${abilityKey(a)}:30" data-stake-limit="${maxSt}">30</button>`:''}</div></div>`:`<div class="ability-tier-list single"><div class="ability-tier current"><p>${a.extra||'Sem estacas mecânicas cadastradas.'}</p></div></div>`}${a.extra&&a.tiers?`<details class="ability-notes"><summary>Observações</summary><p>${a.extra}</p></details>`:''}${a.type==='active'?`<div class="ability-actions">${a.isExtra?'<span class="pill warn">Habilidade extra</span>':(locked?`<span class="locked">Bloqueada até o nível ${a.level}</span>`:`<button class="primary" data-use-ability="${abilityKey(a)}" data-cost="${cost}">Usar · −${cost} EN</button>`)}${a.isExtra?'':`<small>EN atual ${state.currentEnergy}</small>`}</div>`:''}</article>`;
  }
  function applyManualResource(kind,input){
    const delta=Number(input?.value);if(!Number.isFinite(delta)||delta===0){notify('Digite um ajuste, por exemplo -37 ou 20.');return}
    if(kind==='hp')setHp(state.currentHp+delta);else if(kind==='en')setEnergy(state.currentEnergy+delta);else if(kind==='san')setSanity(state.currentSanity+delta);else if(kind==='resource')state.resourceCurrent=clamp((state.resourceCurrent||0)+delta,0,resourceMax());
    if(input)input.value='';save();renderSheet();const label=kind==='hp'?'HP':kind==='en'?'Energia':kind==='san'?'Sanidade':god()?.resource?.name||'Recurso';notify(`${label} ${delta>0?'+':''}${delta}.`);
  }

  function bindSheet(){
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.activeTab=b.dataset.tab;save();renderSheet()});
    document.querySelectorAll('[data-go-tab]').forEach(b=>b.onclick=()=>{state.activeTab=b.dataset.goTab;save();renderSheet()});
    document.querySelectorAll('[data-edit-equipment]').forEach(b=>b.onclick=()=>{const target=b.dataset.editEquipment;state.activeTab='inventory';save();renderSheet();setTimeout(()=>{let el=null;if(target==='armor')el=byId('armorEditor');else if(target==='shield')el=byId('shieldEditor');else if(target.startsWith('weapon:'))el=document.querySelector(`[data-weapon-card="${target.slice(7)}"]`);else if(target.startsWith('item:'))el=document.querySelector(`[data-item-card="${target.slice(5)}"]`);if(el){el.classList.add('edit-flash');el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.classList.remove('edit-flash'),1400)}},0)});
    const bindLevelChange = el => { if(!el) return; el.onchange=e=>{const old=state.level;state.level=clamp(parseInt(e.target.value||1,10),1,100);while(spentLevelPoints()>earnedLevelPoints()){const k=Object.keys(state.levelAttributes).find(x=>state.levelAttributes[x]>0);if(!k)break;state.levelAttributes[k]--}syncCurrentCaps();save();renderSheet();if(state.level!==old)notify('Nível atualizado.')}; };
    bindLevelChange(byId('levelInput'));
    bindLevelChange(byId('levelOrbInput'));
    const sn=byId('sheetNameInput');if(sn)sn.onchange=e=>{state.name=e.target.value;save();renderSheet()};
    const sp=byId('sheetPlayerInput');if(sp)sp.onchange=e=>{state.player=e.target.value;save()};
    byId('backCreation').onclick=()=>{state.isCreated=false;save();render()};
    document.querySelectorAll('[data-base-inc]').forEach(b=>b.onclick=()=>changeBase(b.dataset.baseInc,1));document.querySelectorAll('[data-base-dec]').forEach(b=>b.onclick=()=>changeBase(b.dataset.baseDec,-1));
    document.querySelectorAll('[data-lvl-inc]').forEach(b=>b.onclick=()=>changeLevelAttr(b.dataset.lvlInc,1));document.querySelectorAll('[data-lvl-dec]').forEach(b=>b.onclick=()=>changeLevelAttr(b.dataset.lvlDec,-1));
    document.querySelectorAll('[data-resource]').forEach(b=>b.onclick=()=>{state.resourceCurrent=clamp((state.resourceCurrent||0)+Number(b.dataset.resource),0,resourceMax());save();renderSheet()});
    document.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>{setHp(state.currentHp+Number(b.dataset.hp));save();renderSheet()});
    document.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{setEnergy(state.currentEnergy+Number(b.dataset.en));save();renderSheet()});
    document.querySelectorAll('[data-san]').forEach(b=>b.onclick=()=>{setSanity(state.currentSanity+Number(b.dataset.san));save();renderSheet()});
    document.querySelectorAll('[data-en-full]').forEach(b=>b.onclick=()=>{setEnergy(energyMax());save();renderSheet()});
    document.querySelectorAll('[data-manual-resource]').forEach(b=>b.onclick=()=>applyManualResource(b.dataset.manualResource,byId(b.dataset.manualInput)));
    document.querySelectorAll('[data-resource-manual-input]').forEach(input=>input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();applyManualResource(input.dataset.resourceManualInput,input)}});
    document.querySelectorAll('[data-stakes]').forEach(input=>input.onchange=()=>{state.abilityStakes[input.dataset.stakes]=clamp(Number(input.value),0,Number(input.dataset.stakeMax)||30);save();renderSheet()});
    document.querySelectorAll('[data-core-stakes]').forEach(input=>input.onchange=()=>{state.abilityStakes[input.dataset.coreStakes]=clamp(Number(input.value),0,30);save();renderSheet()});
    document.querySelectorAll('[data-core-stake-set]').forEach(btn=>btn.onclick=()=>{const raw=btn.dataset.coreStakeSet||'',idx=raw.lastIndexOf(':'),key=raw.slice(0,idx),value=Number(raw.slice(idx+1));if(!key)return;state.abilityStakes[key]=clamp(value,0,30);save();renderSheet()});
    document.querySelectorAll('[data-stake-set]').forEach(b=>b.onclick=()=>{const idx=b.dataset.stakeSet.lastIndexOf(':'),key=b.dataset.stakeSet.slice(0,idx),v=Number(b.dataset.stakeSet.slice(idx+1)),limit=Number(b.dataset.stakeLimit)||30;state.abilityStakes[key]=clamp(v,0,limit);save();renderSheet()});
    document.querySelectorAll('[data-use-ability]').forEach(b=>b.onclick=()=>useAbility(Number(b.dataset.cost)));
    document.querySelectorAll('[data-condition]').forEach(c=>c.onchange=()=>toggleCondition(c.dataset.condition,c.checked));
    document.querySelectorAll('[data-remove-condition]').forEach(b=>b.onclick=()=>toggleCondition(b.dataset.removeCondition,false));
    const addConditionBtn=byId('addConditionBtn'); if(addConditionBtn) addConditionBtn.onclick=()=>{const sel=byId('conditionSelect'); if(sel&&sel.value) toggleCondition(sel.value,true)};
    document.querySelectorAll('[data-exhaustion]').forEach(b=>b.onclick=()=>{state.exhaustion=Number(b.dataset.exhaustion);syncCurrentCaps();save();renderSheet()});
    const exSel=byId('combatExhaustionSelect'); if(exSel) exSel.onchange=e=>{state.exhaustion=Number(e.target.value)||0; syncCurrentCaps(); save(); renderSheet()};

    const td=byId('tempDefense');if(td)td.onchange=e=>{state.tempMods.defense=Number(e.target.value)||0;save();renderSheet()};
    const railDef=byId('railDefenseAdjust');if(railDef)railDef.onchange=e=>{state.tempMods.defense=Number(e.target.value)||0;save();renderSheet()};
    const tdr=byId('tempReduction');if(tdr)tdr.onchange=e=>{state.tempMods.damageReduction=Number(e.target.value)||0;save();renderSheet()};
    const pBtn=byId('uploadPortraitBtn'); const pInput=byId('portraitUploadInput'); if(pBtn&&pInput){pBtn.onclick=()=>pInput.click(); pInput.onchange=e=>readImageToHistory(e.target.files?.[0],'portraitUrl')}
    const bBtn=byId('uploadBannerBtn'); const bInput=byId('bannerUploadInput'); if(bBtn&&bInput){bBtn.onclick=()=>bInput.click(); bInput.onchange=e=>readImageToHistory(e.target.files?.[0],'bannerUrl')}
    const heroBtn=byId('heroPortraitUploadBtn'); if(heroBtn&&pInput){heroBtn.onclick=()=>pInput.click()}
    const short=byId('shortRest');if(short)short.onclick=shortRest;const long=byId('longRest');if(long)long.onclick=longRest;
    const rd=byId('rollDefense');if(rd)rd.onclick=rollDefense;const ri=byId('rollInitiative');if(ri)ri.onclick=rollInitiative;

    document.querySelectorAll('[data-attr-extra]').forEach(el=>el.onchange=()=>{state.attributeExtras[el.dataset.attrExtra]=clamp(Number(el.value)||0,-10,10);syncCurrentCaps();save();renderSheet()});
    document.querySelectorAll('[data-history]').forEach(el=>el.oninput=()=>{state.history[el.dataset.history]=el.value;save()});
    const notes=byId('notesField');if(notes)notes.oninput=e=>{state.notes=e.target.value;save()};
    bindDeath();
    if(state.activeTab==='status'){bindSkillTraining();bindSkillMatrix();bindTalents();bindLegacy();}
    if(state.activeTab==='inventory'){bindInventory();}
    if(state.activeTab==='familiars'){bindFamiliars();}
    if(state.activeTab==='roma'){bindRoma();}
    if(state.activeTab==='magic'){bindMagic();}
  }

  function bindArmor(){
    byId('armorEquipped').onchange=e=>{state.armor.equipped=e.target.checked;save();renderSheet()};
    byId('armorName').onchange=e=>{state.armor.name=e.target.value;save()};
    byId('armorType').onchange=e=>{state.armor.type=e.target.value;save();renderSheet()};
    byId('armorMaterial').onchange=e=>{state.armor.material=e.target.value;const m=material(e.target.value);state.armor.resistanceCurrent=m.unbreakable?null:m.resistance;save();renderSheet()};
    const upload=byId('uploadArmorImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{state.armor.imageUrl=url;save();renderSheet();notify('Imagem da armadura atualizada.')});
    const clear=byId('clearArmorImage');if(clear)clear.onclick=()=>{state.armor.imageUrl='';save();renderSheet()};
    document.querySelectorAll('[data-armor-res]').forEach(b=>b.onclick=()=>{const m=material(state.armor.material);if(m.unbreakable)return;state.armor.resistanceCurrent=clamp((Number(state.armor.resistanceCurrent)||0)+Number(b.dataset.armorRes),0,m.resistance);save();renderSheet()});
  }
  function bindShield(){
    byId('shieldEquipped').onchange=e=>{state.shield.equipped=e.target.checked;save();renderSheet()};
    byId('shieldName').onchange=e=>{state.shield.name=e.target.value;save()};
    byId('shieldMaterial').onchange=e=>{state.shield.material=e.target.value;const m=material(e.target.value);state.shield.resistanceCurrent=m.unbreakable?null:m.resistance;save();renderSheet()};
    byId('shieldStakes').onchange=e=>{state.shield.stakes=clamp(Number(e.target.value),0,30);save();renderSheet()};
    const upload=byId('uploadShieldImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{state.shield.imageUrl=url;save();renderSheet();notify('Imagem do escudo atualizada.')});
    const clear=byId('clearShieldImage');if(clear)clear.onclick=()=>{state.shield.imageUrl='';save();renderSheet()};
    document.querySelectorAll('[data-shield-res]').forEach(b=>b.onclick=()=>{const m=material(state.shield.material);if(m.unbreakable)return;state.shield.resistanceCurrent=clamp((Number(state.shield.resistanceCurrent)||0)+Number(b.dataset.shieldRes),0,m.resistance);save();renderSheet()});
  }
  function bindWeapons(){
    byId('addWeapon').onclick=()=>{const m=material('ferro-aco');state.weapons.push({id:uid('weapon'),name:'Nova arma',type:'corpo-a-corpo',attr:'for',material:'ferro-aco',stakes:0,resistanceCurrent:m.resistance,attackExtra:0,damageExtra:0,equipped:true,imageUrl:''});save();renderSheet()};
    document.querySelectorAll('[data-remove-weapon]').forEach(b=>b.onclick=()=>{state.weapons=state.weapons.filter(w=>w.id!==b.dataset.removeWeapon);save();renderSheet()});
    document.querySelectorAll('[data-weapon-equipped]').forEach(el=>el.onchange=()=>{const w=state.weapons.find(x=>x.id===el.dataset.weaponEquipped);if(!w)return;w.equipped=el.checked;save();renderSheet()});
    document.querySelectorAll('[data-weapon-field]').forEach(el=>el.onchange=()=>{const [id,field]=el.dataset.weaponField.split(':'),w=state.weapons.find(x=>x.id===id);if(!w)return;let value=el.value;if(['stakes','attackExtra','damageExtra'].includes(field))value=Number(value)||0;if(field==='stakes')value=clamp(value,0,30);w[field]=value;if(field==='material'){const m=material(value);w.resistanceCurrent=m.unbreakable?null:m.resistance}save();renderSheet()});
    document.querySelectorAll('[data-upload-weapon-image]').forEach(b=>b.onclick=()=>{const w=state.weapons.find(x=>x.id===b.dataset.uploadWeaponImage);if(!w)return;chooseStoredImage(url=>{w.imageUrl=url;save();renderSheet();notify('Imagem da arma atualizada.')})});
    document.querySelectorAll('[data-clear-weapon-image]').forEach(b=>b.onclick=()=>{const w=state.weapons.find(x=>x.id===b.dataset.clearWeaponImage);if(!w)return;w.imageUrl='';save();renderSheet()});
    document.querySelectorAll('[data-weapon-res]').forEach(b=>b.onclick=()=>{const idx=b.dataset.weaponRes.lastIndexOf(':'),id=b.dataset.weaponRes.slice(0,idx),delta=Number(b.dataset.weaponRes.slice(idx+1)),w=state.weapons.find(x=>x.id===id);if(!w)return;const m=material(w.material);if(m.unbreakable)return;w.resistanceCurrent=clamp((Number(w.resistanceCurrent)||0)+delta,0,m.resistance);save();renderSheet()});
  }
  function bindSkillMatrix(){
    document.querySelectorAll('[data-skill-manual]').forEach(el=>el.onchange=()=>{const name=el.dataset.skillManual,m=skillMetaFor(name);m.proficient=el.checked;if(!m.proficient)m.expertise=false;save();renderSheet()});
    document.querySelectorAll('[data-skill-expertise]').forEach(el=>el.onchange=()=>{const name=el.dataset.skillExpertise,m=skillMetaFor(name);if(!skillIsProficient(name))return;m.expertise=el.checked;save();renderSheet()});
    document.querySelectorAll('[data-skill-source]').forEach(el=>el.onchange=()=>{const name=el.dataset.skillSource,m=skillMetaFor(name),src=el.value;if(src==='nivel-20'&&state.level<20){notify('A origem Nível 20 só pode ser usada a partir do nível 20.');renderSheet();return}if(src==='nivel-40'&&state.level<40){notify('A origem Nível 40 só pode ser usada a partir do nível 40.');renderSheet();return}if(src==='nivel-20'||src==='nivel-40'){for(const [otherName,other] of Object.entries(state.skillMeta||{})){if(otherName!==name&&other?.proficient&&other?.source===src){other.source='extras';notify(`A origem ${src==='nivel-20'?'Nível 20':'Nível 40'} foi movida para ${name}.`);}}}m.source=src;m.proficient=true;save();renderSheet()});
    document.querySelectorAll('[data-skill-detail]').forEach(el=>el.oninput=()=>{const m=skillMetaFor(el.dataset.skillDetail);m.detail=el.value;save()});
  }
  function bindSkillTraining(){
    const add=byId('addSkillTraining');if(add)add.onclick=()=>{const sel=byId('newTrainingSkill'),name=sel.value;if(!name||availableSkillTrainingSlots()<=0)return;state.skillTrainings.push({id:uid('skill'),name,stakes:0});save();renderSheet()};
    document.querySelectorAll('[data-skill-training]').forEach(el=>el.onchange=()=>{const t=state.skillTrainings.find(x=>x.id===el.dataset.skillTraining);if(!t)return;t.stakes=clamp(Number(el.value),0,30);save();renderSheet()});
    document.querySelectorAll('[data-remove-skill-training]').forEach(b=>b.onclick=()=>{state.skillTrainings=state.skillTrainings.filter(t=>t.id!==b.dataset.removeSkillTraining);save();renderSheet()});
  }
  function bindDeath(){
    const r=byId('rollDeath');if(r)r.onclick=rollDeathSave;
    const ds=byId('deathSuccessManual');if(ds)ds.onclick=()=>addDeathSuccesses(1);
    const df=byId('deathFailureManual');if(df)df.onclick=()=>addDeathFailures(1);
    const dd=byId('deathDamage');if(dd)dd.onclick=()=>addDeathFailures(1);
    const dc=byId('deathCrit');if(dc)dc.onclick=()=>addDeathFailures(2);
    const med=byId('medicineStabilize');if(med)med.onclick=()=>{state.death.stable=true;state.death.successes=3;save();renderSheet();notify('Estabilizado por Medicina DT 10.')};
    const sr=byId('stableRecover');if(sr)sr.onclick=()=>{setHp(1);save();renderSheet();notify('1 HP recuperado após estabilização.')};
    const nr=byId('narrativeRestore');if(nr)nr.onclick=()=>{state.death.dead=false;state.death.atZero=true;setHp(1);save();renderSheet();notify('Restaurado por intervenção narrativa.')};
  }

  function useAbility(cost){if(state.currentEnergy<cost){notify('Energia insuficiente.');return}setEnergy(state.currentEnergy-cost);save();renderSheet();notify(`Habilidade usada: −${cost} EN.`)}
  function changeLevelAttr(k,d){if(d>0){if(remainingLevelPoints()<=0||ordinaryAttrRaw(k)>=5)return;state.levelAttributes[k]++}else{if(state.levelAttributes[k]<=0)return;state.levelAttributes[k]--}syncCurrentCaps();save();renderSheet()}
  function readImageToHistory(file,key){if(!file)return;const reader=new FileReader();reader.onload=()=>{state.history[key]=String(reader.result||'');save();renderSheet();notify(key==='portraitUrl'?'Retrato atualizado.':'Banner atualizado.')};reader.readAsDataURL(file)}
  function chooseStoredImage(onReady){
    const input=document.createElement('input');input.type='file';input.accept='image/*';
    input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const src=String(reader.result||'');const img=new Image();img.onload=()=>{try{const max=1000,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);const compact=canvas.toDataURL('image/webp',.82);onReady(compact&&compact!=='data:,'?compact:src)}catch(err){onReady(src)}};img.onerror=()=>onReady(src);img.src=src};reader.readAsDataURL(file)};input.click();
  }
  function toggleCondition(name,on){if(on&&!state.conditions.includes(name))state.conditions.push(name);if(!on)state.conditions=state.conditions.filter(x=>x!==name);save();renderSheet()}
  function shortRest(){if(state.death.dead){notify('Personagem morto não pode descansar.');return}if(state.currentHp===0){notify('Em 0 HP, estabilize e recupere 1 HP antes de descansar.');return}const hp=Number(system.rests?.short?.hp??25),en=Number(system.rests?.short?.energy??150);setHp(state.currentHp+hp);setEnergy(state.currentEnergy+en);save();renderSheet();notify(`Descanso curto: +${hp} HP e +${en} Energia.`)}
  function longRest(){if(state.death.dead){notify('Personagem morto não pode descansar.');return}if(state.currentHp===0){notify('Em 0 HP, estabilize e recupere 1 HP antes de descansar.');return}setHp(hpMax());setEnergy(energyMax());if(state.magic?.enabled)state.magic.highCircleUsed={6:0,7:0,8:0,9:0};save();renderSheet();notify('Descanso longo: HP e Energia completos; usos mágicos altos restaurados.')}
  function rollD20(label,modifier){const die=Math.floor(Math.random()*20)+1,total=die+modifier;state.lastRoll={label,die,modifier,total};save();renderSheet();notify(`${label}: ${total} (${die} no d20).`)}
  function rollDefense(){const f=fixedDefense();if(f!==null){state.lastRoll={label:'Defesa fixa',die:'—',modifier:0,total:f};save();renderSheet();notify(`Defesa fixa: ${f}.`);return}rollD20('Defesa',defenseBonus())}
  function rollInitiative(){rollD20('Iniciativa',initiativeBonus())}
  function rollDeathSave(){if(state.currentHp!==0||state.death.dead||state.death.stable)return;const d=Math.floor(Math.random()*20)+1;state.death.lastRoll=d;if(d===20){setHp(1);save();renderSheet();notify('20 natural: recupera 1 HP e pode agir.');return}if(d===1)state.death.failures+=2;else if(d>=10)state.death.successes+=1;else state.death.failures+=1;if(state.death.successes>=3){state.death.successes=3;state.death.stable=true}if(state.death.failures>=3){state.death.failures=3;state.death.dead=true}save();renderSheet()}
  function addDeathSuccesses(n){if(state.death.dead||state.death.stable||state.currentHp!==0)return;state.death.successes=clamp(state.death.successes+n,0,3);if(state.death.successes>=3){state.death.successes=3;state.death.stable=true}save();renderSheet()}
  function addDeathFailures(n){if(state.death.dead||state.currentHp!==0)return;state.death.failures=clamp(state.death.failures+n,0,3);if(state.death.failures>=3)state.death.dead=true;save();renderSheet()}
  function signed(n){const v=Number(n)||0;return v>=0?`+${v}`:`−${Math.abs(v)}`}

  function render(){creationView.classList.toggle('hidden',state.isCreated);sheetView.classList.toggle('hidden',!state.isCreated);if(state.isCreated)renderSheet();else renderCreation()}
  function byId(id){return document.getElementById(id)}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function initials(name=''){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return 'XII';return (parts[0][0]||'').concat(parts.length>1?(parts[parts.length-1][0]||''):'').toUpperCase()}

  byId('exportBtn').onclick=()=>{save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`duodecima-${(state.name||'personagem').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  byId('importInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);const ver=Number(data.schemaVersion);if(!Number.isFinite(ver)||ver<1||ver>SCHEMA_VERSION)throw new Error('schema');state=migrate(data);syncCurrentCaps();save();render();notify('Ficha importada.')}catch(err){notify('Não foi possível importar este JSON.')}};reader.readAsText(f)};
  byId('resetBtn').onclick=()=>{if(!confirm('Apagar a ficha local desta versão?'))return;safeStorage.removeItem(STORAGE_KEY);LEGACY_KEYS.forEach(k=>safeStorage.removeItem(k));state=defaultState();render();notify('Ficha resetada.')};

  load();render();
})();
