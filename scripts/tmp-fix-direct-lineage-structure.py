from pathlib import Path

VERSION='v5.15.9-lineage-structure'

def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old,new,1)

app_path=Path('app-v511.js')
app=app_path.read_text(encoding='utf-8')

app=replace_once(
    app,
    "function god(){const sid=state.lineage?.type==='direct'&&state.lineage?.structureGodId?state.lineage.structureGodId:state.godId;return godById(sid)||primaryGod()}",
    "function god(){return primaryGod()}",
    'god structural source'
)

app=replace_once(
    app,
    "const migrateGodId=out.lineage?.type==='direct'&&out.lineage?.structureGodId?out.lineage.structureGodId:out.godId,migrateGod=godById(migrateGodId),firstLegacy=(migrateGod?.resources||[])[0]||migrateGod?.resource;",
    "const migrateGodId=out.godId,migrateGod=godById(migrateGodId),firstLegacy=(migrateGod?.resources||[])[0]||migrateGod?.resource;",
    'migration structural source'
)

app=replace_once(
    app,
    "const lineageOk=type==='normal'||(!isTriumvir(state.godId)&&!!sub&&sub.id!==state.godId&&(type!=='direct'||[state.godId,sub.id].includes(state.lineage.structureGodId||state.godId)));",
    "const lineageOk=type==='normal'||(!isTriumvir(state.godId)&&!!sub&&sub.id!==state.godId);",
    'creation lineage validation'
)

old_direct_block="${type==='direct'&&sub?`<div class=\"notice\"><b>LEGADO + LEGADO · Legado Direto:</b> ${esc(directRule.description||'É filho de semideuses e carrega duas heranças divinas próximas.')} A ficha usa 4 passivas de uma origem + 3 da outra e as cinco primeiras ativas dos dois kits; nenhuma habilidade 6+ entra.</div><label style=\"margin-top:10px\"><span class=\"label\">Kit estrutural durante a criação · HP, conjuração, bônus e perícias divinas</span><select id=\"creationStructureGod\"><option value=\"${state.godId}\" ${directStructure===state.godId?'selected':''}>${primaryGod().name}</option><option value=\"${sub.id}\" ${directStructure===sub.id?'selected':''}>${sub.name}</option></select></label>`:''}"
new_direct_block="${type==='direct'&&sub?`<div class=\"notice\"><b>LEGADO + LEGADO · Legado Direto:</b> ${esc(directRule.description||'É filho de semideuses e carrega duas heranças divinas próximas.')} A ficha usa 4 passivas de uma origem + 3 da outra e as cinco primeiras ativas dos dois kits; nenhuma habilidade 6+ entra. <b>HP, progressão de HP, conjuração, bônus de atributos, perícia divina e recursos estruturais vêm sempre do deus principal (${esc(primaryGod().name)}).</b></div>`:''}"
app=replace_once(app, old_direct_block, new_direct_block, 'direct creation structural selector')

app=replace_once(
    app,
    "const lineageSecondary=byId('creationSecondaryGod');if(lineageSecondary)lineageSecondary.onchange=e=>{const previous=state.lineage.secondaryGodId;state.lineage.secondaryGodId=e.target.value;if(state.lineage.type==='direct'){if(state.lineage.structureGodId===previous)state.lineage.structureGodId=e.target.value;initializeDirectSelections()}state.divineSkillChoice='';state.initialSkills=[];save();renderCreation()};",
    "const lineageSecondary=byId('creationSecondaryGod');if(lineageSecondary)lineageSecondary.onchange=e=>{state.lineage.secondaryGodId=e.target.value;if(state.lineage.type==='direct'){state.lineage.structureGodId=state.godId;initializeDirectSelections()}state.divineSkillChoice='';state.initialSkills=[];save();renderCreation()};",
    'direct secondary change'
)

app=replace_once(
    app,
    "    const structure=byId('creationStructureGod');if(structure)structure.onchange=e=>{state.lineage.structureGodId=e.target.value;state.divineSkillChoice='';state.initialSkills=[];syncCurrentCaps();save();renderCreation()};\n",
    "",
    'creation structure handler'
)

old_sheet="<label><span class=\"label\">Kit estrutural para HP, conjuração e bônus</span><select id=\"structureGodSelect\"><option value=\"${main.id}\" ${state.lineage.structureGodId===main.id?'selected':''}>${main.name}</option><option value=\"${sub.id}\" ${state.lineage.structureGodId===sub.id?'selected':''}>${sub.name}</option></select></label>"
new_sheet="<div class=\"notice\"><b>Estrutura do Legado Direto:</b> HP, progressão de HP, conjuração, bônus de atributos, perícia divina e recursos usam sempre <b>${main.name}</b>, o deus principal. A segunda origem participa apenas da composição prevista das habilidades.</div>"
app=replace_once(app, old_sheet, new_sheet, 'direct sheet structural selector')

app=replace_once(
    app,
    "    const st=byId('structureGodSelect');if(st)st.onchange=e=>{state.lineage.structureGodId=e.target.value;syncCurrentCaps();save();renderSheet()};\n",
    "",
    'sheet structure handler'
)

app_path.write_text(app,encoding='utf-8')

# Lineage bridge remains the authority that normalizes old saves to the principal god.
lineage_path=Path('lineage-creation-v515.js')
lineage=lineage_path.read_text(encoding='utf-8')
lineage=replace_once(
    lineage,
    "note.innerHTML='<b>Bônus iniciais do Legado Direto:</b> HP inicial, bônus de atributos e perícia seguem sempre o <b>deus principal</b>. A segunda origem continua sendo usada para a composição do kit de habilidades.';",
    "note.innerHTML='<b>Estrutura do Legado Direto:</b> HP inicial e progressão, conjuração, bônus de atributos, perícia divina e recursos seguem sempre o <b>deus principal</b>. A segunda origem continua sendo usada apenas na composição prevista do kit de habilidades.';",
    'direct lineage note'
)
lineage_path.write_text(lineage,encoding='utf-8')

# Permanent source-level regression check because the calculation lives inside app-v511.js closure.
check_path=Path('scripts/validate-lineage-structure.mjs')
check_path.write_text("""import fs from 'node:fs';
const app=fs.readFileSync('app-v511.js','utf8');
const lineage=fs.readFileSync('lineage-creation-v515.js','utf8');
const fail=[];
if(!app.includes('function god(){return primaryGod()}'))fail.push('god() não está fixo no deus principal');
if(app.includes('id=\"creationStructureGod\"'))fail.push('seletor estrutural ainda existe na criação');
if(app.includes('id=\"structureGodSelect\"'))fail.push('seletor estrutural ainda existe na ficha');
if(!app.includes('const migrateGodId=out.godId'))fail.push('migração ainda pode usar a segunda origem como estrutural');
if(!app.includes("state.lineage.structureGodId=state.godId;initializeDirectSelections()"))fail.push('troca da segunda origem não força estrutura principal');
if(!lineage.includes("data.lineage.structureGodId=data.godId"))fail.push('saves antigos não são normalizados para o deus principal');
if(!lineage.includes('HP inicial e progressão, conjuração, bônus de atributos, perícia divina e recursos seguem sempre o <b>deus principal</b>'))fail.push('texto de regra do Direto não reflete a regra canônica');
if(fail.length){console.error('❌ Legado Direto inválido\\n- '+fail.join('\\n- '));process.exit(1)}
console.log('✅ Legado Direto usa exclusivamente a estrutura do deus principal; menor HP permanece exclusivo do Composto.');
""",encoding='utf-8')

Path('VERSION.txt').write_text(VERSION+'\n',encoding='utf-8')

manifest_path=Path('RUNTIME-MANIFEST.md')
manifest=manifest_path.read_text(encoding='utf-8')
note='- `v5.15.9-lineage-structure`: corrige o Legado Direto para usar sempre HP/progressão, conjuração, bônus, perícia divina e recursos do deus principal; remove os seletores estruturais antigos. A regra de menor HP fica exclusiva do Legado Composto.\n'
anchor='## Regra de manutenção\n'
if note not in manifest:
    if anchor not in manifest: raise SystemExit('manifest anchor missing')
    manifest=manifest.replace(anchor,note+'\n'+anchor,1)
manifest_path.write_text(manifest,encoding='utf-8')
