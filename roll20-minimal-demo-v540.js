(function roll20MinimalDemo(){
 'use strict';
 // Este arquivo só existe na branch de demonstração. Não toca a produção.
 const KEY='duodecima_universal_stage4_v24';
 const DEMO_TAG='duodecima-roll20-minimal-demo-v540';
 const old=(()=>{try{return localStorage.getItem(KEY)}catch(_){return null}})();
 const art=(word,glyph,a,b)=>{
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300"><defs><linearGradient id="g" x2=".85" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="240" height="300" rx="22" fill="url(#g)"/><path d="M18 18 H222 V282 H18 Z" fill="none" stroke="#c8a47e" stroke-opacity=".7" stroke-width="2"/><circle cx="120" cy="123" r="73" fill="#eacfa1" fill-opacity=".08" stroke="#d3aa7a" stroke-opacity=".35"/><text x="120" y="148" text-anchor="middle" font-family="Georgia,serif" font-size="75" fill="#ebd6b7">${glyph}</text><text x="120" y="253" text-anchor="middle" font-family="Georgia,serif" font-size="16" letter-spacing="2" fill="#e6c9a4">${word}</text></svg>`;
   return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 };
 const makeItem=(id,name,qty,category,imageUrl,material,effect,notes,showInDeck=false,isHeritage=false)=>({
   id,name,qty,category,imageUrl,material,effect,rune:effect,notes,showInDeck,isHeritage,
   attackAttr:'for',attackBonus:0,damage:'',range:''
 });
 const build=()=>{
   const zero={for:0,des:0,con:0,int:0,fe:0,car:0};
   return {
    schemaVersion:24,isCreated:true,name:'Legionária de Demonstração',player:'Prévia visual',level:30,
    godId:'iuppiter',activeTab:'status',baseAttributes:{for:3,des:2,con:2,int:2,fe:3,car:1},
    levelAttributes:{...zero},attributeExtras:{...zero},
    initialSkills:['Atletismo','Percepção'],levelSkillChoices:{20:'',40:''},skillMeta:{},talents:[],
    lineage:{type:'normal',namingVersion:2,secondaryGodId:'',structureGodId:'iuppiter',compoundPassiveReplacements:[],compoundActiveReplacements:[],compoundActiveSlots:[],directPrimaryPassives:[],directSecondaryPassives:[]},
    weapons:[
      {id:'prev-gladius',name:'Gladius Fulminata',type:'corpo-a-corpo',attr:'for',material:'ferro-aco',stakes:30,resistanceCurrent:3,attackExtra:1,damageExtra:0,equipped:true,imageUrl:'',isHeritage:false,notes:'Arma de treino em bronze e ferro, cuidadosamente mantida.'},
      {id:'prev-arco',name:'Arco de Diana',type:'distancia',attr:'des',material:'ferro-aco',stakes:15,resistanceCurrent:3,attackExtra:0,damageExtra:0,equipped:false,imageUrl:'',isHeritage:false,notes:'Arco entregue como lembrança de uma missão. Apenas para testar o marcador de herança.'}
    ],
    armor:{equipped:true,name:'Lorica Segmentata',type:'leve',material:'ferro-aco',resistanceCurrent:3,
      imageUrl:'',isHeritage:false,notes:'Armadura pessoal de serviço.'},
    shield:{equipped:false,name:'Escudo',material:'ferro-aco',stakes:18,resistanceCurrent:3,masterTalent:false,
      imageUrl:'',isHeritage:false,notes:'Escudo de treinamento.'},
    inventory:{aureus:0,denarius:0,notes:'Itens exclusivamente demonstrativos.',items:[
      makeItem('prev-pocao','Poção de Cura',3,'consumivel','','Vidro','Recupera pontos de vida durante a cena.','Um frasco de demonstração; não constitui regra adicional.',true,false),
      makeItem('prev-corda','Corda de Viagem',1,'outro','','Cânhamo','Corda para escalada e acampamentos.','Utensílio de viagem.',false,false),
      makeItem('prev-anel','Anel de Jove',1,'item-magico','','Prata','Um brilho acompanha o movimento das nuvens.','Item ilustrativo. Nenhuma habilidade automática é atribuída.',true,true)
    ]},
    familiars:{entries:[],mountFameClaimed:false,notes:''},
    roma:{fame:0,fameEntries:[],rebentoApproved:false,rebentoAttributes:[],successorOfRebento:false,affinities:[],affinityEntries:[],legionRank:'',religioRank:'',customRank:'',job:'',jobSalary:0,jobPeriod:'',cohort:'I',citizenship:'',legionYears:0,serviceMarks:0,retired:false,titles:[],permissions:[],deeds:[],notes:''},
    magic:{enabled:false,castingAttr:'fe',circle:1,sacrifices:{for:0,des:0,con:0},spells:[],concentrationSpellId:'',concentrationDamage:0,highCircleUsed:{6:0,7:0,8:0,9:0},notes:''},
    currentHp:null,currentEnergy:null,currentSanity:100,resourceCurrent:0,resourceValues:{},targetResources:{},abilityStakes:{},abilityChoices:{},choiceDetails:{},abilityUses:{},conditions:[],exhaustion:0,
    death:{successes:0,failures:0,stable:false,dead:false,atZero:false,lastRoll:null,returnCount:0},
    tempMods:{rolls:0,defense:0,damageReduction:0},fortunaBlessing:false,fortunaBlessingMonth:'',skillTrainings:[],
    appearance:{mode:'light',palette:'mono-white',special:'none',exclusiveThemeId:''},
    history:{summary:'Prévia isolada para aprovação do inventário.',goals:'',relationships:'',milestones:'',origin:'',age:'',affiliation:'',description:'',tagline:'',birth:'',residence:'',portraitUrl:'',bannerUrl:'',bannerSourceUrl:'',bannerPositionX:50,bannerPositionY:50,bannerScale:100},
    notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    [DEMO_TAG]:true
   };
 };
 if(old===null){
   try{localStorage.setItem(KEY,JSON.stringify(build()))}catch(e){console.warn('Prévia: armazenamento indisponível',e)}
 }
 window.DUODECIMA_MINIMAL_RESTORE_DEMO=()=>{
   if(!window.confirm('Restaurar a personagem de demonstração? As alterações feitas apenas nesta prévia serão substituídas.'))return;
   try{
     localStorage.setItem(KEY,JSON.stringify(build()));
     sessionStorage.removeItem('duodecima-preview-roll20-v540');
     window.location.reload();
   }catch(e){console.warn('Falha ao restaurar a demonstração',e)}
 };
})();
