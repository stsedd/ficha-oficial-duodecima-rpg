import fs from 'node:fs/promises';

const file=new URL('../app-v511.js',import.meta.url);
let src=await fs.readFile(file,'utf8');
let changes=0;
function once(from,to,label){
  if(src.includes(to))return;
  if(!src.includes(from))throw new Error(`Trecho não encontrado para ${label}`);
  src=src.replace(from,to);changes++;
}

once(
  "  const system = window.DUODECIMA_SYSTEM || {conditions:[],materials:[],armorTypes:[],weaponTypes:[]};\n  const talentsDb = window.DUODECIMA_TALENTS || [];",
  "  const system = window.DUODECIMA_SYSTEM || {conditions:[],materials:[],armorTypes:[],weaponTypes:[]};\n  const CORE_ATTR_START=Math.max(0,Number(system.attributes?.startingPoints ?? 8));\n  const CORE_ATTR_MAX=Math.max(1,Number(system.attributes?.normalMax ?? 5));\n  const CORE_LEVEL_MIN=Math.max(1,Number(system.levels?.min ?? 1));\n  const CORE_LEVEL_MAX=Math.max(CORE_LEVEL_MIN,Number(system.levels?.max ?? 100));\n  const talentsDb = window.DUODECIMA_TALENTS || [];",
  'constantes canônicas'
);
once("function ordinaryAttrCapped(k){return Math.min(5,ordinaryAttrRaw(k))}","function ordinaryAttrCapped(k){return Math.min(CORE_ATTR_MAX,ordinaryAttrRaw(k))}",'limite de atributo');
once(
  "    const outAttrs=emptyAttrs();for(const k of Object.keys(outAttrs)){const n=Number(src?.[k]);outAttrs[k]=clamp(Number.isFinite(n)?Math.abs(n):0,0,5)}return outAttrs",
  "    const outAttrs=emptyAttrs();for(const k of Object.keys(outAttrs)){const n=Number(src?.[k]);outAttrs[k]=clamp(Number.isFinite(n)?Math.abs(n):0,0,CORE_ATTR_MAX)}return outAttrs",
  'normalização de atributos'
);
once(
  "    const divine=Math.max(0,Number(god()?.bonuses?.[k])||0),lvl=Math.max(0,Number(state.levelAttributes[k])||0),base=Math.max(0,Number(state.baseAttributes[k])||0),tal=Math.max(0,talentAttributeBonus(k)),raw=base+lvl+tal+divine,capped=Math.min(5,raw),extra=attributeExtraBonus(k),total=capped+extra,pen=sanityAttrPenalty(k),eff=total+pen,overflow=Math.max(0,raw-5),incDisabled=raw>=5||(!state.isCreated&&sum(state.baseAttributes)>=8);",
  "    const divine=Math.max(0,Number(god()?.bonuses?.[k])||0),lvl=Math.max(0,Number(state.levelAttributes[k])||0),base=Math.max(0,Number(state.baseAttributes[k])||0),tal=Math.max(0,talentAttributeBonus(k)),raw=base+lvl+tal+divine,capped=Math.min(CORE_ATTR_MAX,raw),extra=attributeExtraBonus(k),total=capped+extra,pen=sanityAttrPenalty(k),eff=total+pen,overflow=Math.max(0,raw-CORE_ATTR_MAX),incDisabled=raw>=CORE_ATTR_MAX||(!state.isCreated&&sum(state.baseAttributes)>=CORE_ATTR_START);",
  'cartão de atributo'
);
once(
  "overflow} ignorado pelo limite 5`",
  "overflow} ignorado pelo limite ${CORE_ATTR_MAX}`",
  'texto de limite'
);
once(
  "return lineageOk&&sum(state.baseAttributes)===8&&state.initialSkills.length===initialSkillLimit()&&(!g.skillChoice?.length||!!state.divineSkillChoice);",
  "return lineageOk&&sum(state.baseAttributes)===CORE_ATTR_START&&state.initialSkills.length===initialSkillLimit()&&(!g.skillChoice?.length||!!state.divineSkillChoice);",
  'validação de criação'
);
once(
  "const g=god(),spent=sum(state.baseAttributes),left=8-spent,granted=g.grantedSkills||[],customGranted=granted.filter(s=>!skills.some(x=>x.name===s));",
  "const g=god(),spent=sum(state.baseAttributes),left=CORE_ATTR_START-spent,granted=g.grantedSkills||[],customGranted=granted.filter(s=>!skills.some(x=>x.name===s));",
  'saldo de criação'
);
once(
  "<span class=\"label\">8 pontos de atributos</span>",
  "<span class=\"label\">${CORE_ATTR_START} pontos de atributos</span>",
  'rótulo de criação'
);
once(
  "clamp(spent/8*100,0,100)",
  "clamp(spent/Math.max(1,CORE_ATTR_START)*100,0,100)",
  'progresso de criação'
);
once(
  "O limite normal é 5 considerando pontos da criação, progressão, talentos comuns e bônus divinos. Só efeitos que digam explicitamente ultrapassar o limite podem levar o atributo acima de 5.",
  "O limite normal é ${CORE_ATTR_MAX} considerando pontos da criação, progressão, talentos comuns e bônus divinos. Só efeitos que digam explicitamente ultrapassar o limite podem levar o atributo acima de ${CORE_ATTR_MAX}.",
  'texto de limite de criação'
);
once(
  "Para concluir: distribua exatamente 8 pontos, escolha ${initialSkillLimit()} perícias por INT e preencha a escolha divina quando o kit exigir.",
  "Para concluir: distribua exatamente ${CORE_ATTR_START} pontos, escolha ${initialSkillLimit()} perícias por INT e preencha a escolha divina quando o kit exigir.",
  'aviso de criação'
);
once(
  "function changeBase(k,delta){const cur=state.baseAttributes[k]||0;if(delta>0&&ordinaryAttrRaw(k)>=5)return;if(delta>0&&!state.isCreated&&sum(state.baseAttributes)>=8)return;if(delta<0&&cur<=0)return;",
  "function changeBase(k,delta){const cur=state.baseAttributes[k]||0;if(delta>0&&ordinaryAttrRaw(k)>=CORE_ATTR_MAX)return;if(delta>0&&!state.isCreated&&sum(state.baseAttributes)>=CORE_ATTR_START)return;if(delta<0&&cur<=0)return;",
  'alteração de atributo base'
);
once(
  "${[20,40,60,80,100].map(n=>`<span class=\"${state.level>=n?'earned':''}\">${n}</span>`).join('')}",
  "${(system.attributeIncreaseLevels||[20,40,60,80,100]).map(n=>`<span class=\"${state.level>=n?'earned':''}\">${n}</span>`).join('')}",
  'marcos de atributo'
);
once(
  "${ordinaryAttrRaw(k)>=5?'disabled':''}",
  "${ordinaryAttrRaw(k)>=CORE_ATTR_MAX?'disabled':''}",
  'botão de atributo por nível'
);
once(
  "function changeLevelAttr(k,d){if(d>0){if(remainingLevelPoints()<=0||ordinaryAttrRaw(k)>=5)return;",
  "function changeLevelAttr(k,d){if(d>0){if(remainingLevelPoints()<=0||ordinaryAttrRaw(k)>=CORE_ATTR_MAX)return;",
  'mudança de atributo por nível'
);

// Os dois controles visuais de nível têm o mesmo contrato.
const levelInputOld='type="number" min="1" max="100" value="${state.level}"';
const levelInputNew='type="number" min="${CORE_LEVEL_MIN}" max="${CORE_LEVEL_MAX}" value="${state.level}"';
const count=(src.match(/type=\\?"number\\?" min=\\?"1\\?" max=\\?"100\\?" value=\\?"\$\{state\.level\}\\?"/g)||[]).length;
if(!src.includes(levelInputNew)){
  const before=src;
  src=src.split(levelInputOld).join(levelInputNew);
  if(src!==before)changes++;
}
once(
  "state.level=clamp(parseInt(e.target.value||1,10),1,100);",
  "state.level=clamp(parseInt(e.target.value||CORE_LEVEL_MIN,10),CORE_LEVEL_MIN,CORE_LEVEL_MAX);",
  'limite de nível'
);

if(changes){await fs.writeFile(file,src,'utf8');console.log(`app-v511.js atualizado em ${changes} grupo(s) de contrato canônico.`)}
else console.log('app-v511.js já usa o contrato canônico do Core.');
