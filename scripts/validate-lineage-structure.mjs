import fs from 'node:fs';
const app=fs.readFileSync('app-v511.js','utf8');
const lineage=fs.readFileSync('lineage-creation-v515.js','utf8');
const bootstrap=fs.readFileSync('bootstrap-v511.js','utf8');
const fail=[];
if(!app.includes('function god(){return primaryGod()}'))fail.push('god() não está fixo no deus principal');
if(app.includes('id="creationStructureGod"'))fail.push('seletor estrutural ainda existe na criação');
if(app.includes('id="structureGodSelect"'))fail.push('seletor estrutural ainda existe na ficha');
if(!app.includes('const migrateGodId=out.godId'))fail.push('migração ainda pode usar a segunda origem como estrutural');
if(!app.includes("state.lineage.structureGodId=state.godId;initializeDirectSelections()"))fail.push('troca da segunda origem não força estrutura principal');
if(!lineage.includes("data.lineage.structureGodId=data.godId"))fail.push('saves antigos não são normalizados para o deus principal');
if(!lineage.includes('HP inicial e progressão, conjuração, bônus de atributos, perícia divina e recursos seguem sempre o <b>deus principal</b>'))fail.push('texto de regra do Direto não reflete a regra canônica');
if(!bootstrap.includes('app-v511.js?v=v5.15.9-lineage-structure-'))fail.push('cache key do app não foi invalidada');
if(!bootstrap.includes('lineage-creation-v515.js?v=v5.15.9-lineage-structure-'))fail.push('cache key da automação de legado não foi invalidada');
if(fail.length){console.error('❌ Legado Direto inválido\n- '+fail.join('\n- '));process.exit(1)}
console.log('✅ Legado Direto usa exclusivamente a estrutura do deus principal; menor HP permanece exclusivo do Composto.');
