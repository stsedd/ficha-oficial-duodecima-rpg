/* Duodécima v5.36 — validação conservadora de arquivos de ficha.
   Sem modificar os dados: a migração do app continua responsável pelas regras. */
(function(root){
 'use strict';
 const SCHEMA_MAX=24;
 const FILE_MAX_BYTES=32*1024*1024;
 const fields={
  name:'string',player:'string',notes:'string',isCreated:'boolean',
  baseAttributes:'object',levelAttributes:'object',attributeExtras:'object',
  inventory:'object',familiars:'object',roma:'object',magic:'object',
  history:'object',appearance:'object',armor:'object',shield:'object',
  skillMeta:'object',abilityStakes:'object',abilityChoices:'object',
  weapons:'array',talents:'array',conditions:'array',abilityDeck:'array',
  equipmentDeckOrder:'array',initialSkills:'array',skillTrainings:'array'
 };
 const shape=value=>Array.isArray(value)?'array':value!==null&&typeof value==='object'?'object':typeof value;
 function validate(data,options={}){
  const byteSize=Number(options.byteSize)||0;
  if(byteSize>FILE_MAX_BYTES)throw new Error('O JSON excede 32 MB. Verifique se há imagens muito grandes antes de importar.');
  if(shape(data)!=='object')throw new Error('Este arquivo não é uma ficha válida da Duodécima.');
  const version=Number(data.schemaVersion);
  if(!Number.isInteger(version)||version<1||version>SCHEMA_MAX)
    throw new Error('Versão de ficha incompatível ('+String(data.schemaVersion??'sem versão')+').');
  // Evita que um JSON com apenas a versão substitua ou crie uma ficha vazia.
  const known=['baseAttributes','inventory','history','weapons','familiars','godId','magic','roma','isCreated','name','player','notes'];
  if(!known.some(k=>Object.prototype.hasOwnProperty.call(data,k)))
    throw new Error('Arquivo incompleto: não foram encontrados os campos de uma ficha.');
  for(const [key,type] of Object.entries(fields)){
   if(Object.prototype.hasOwnProperty.call(data,key)&&shape(data[key])!==type)
    throw new Error('Campo incompatível no JSON: '+key+'.');
  }
  if(Object.prototype.hasOwnProperty.call(data,'inventory')&&
     data.inventory?.items!==undefined&&!Array.isArray(data.inventory.items))
    throw new Error('A lista de itens do inventário está inválida.');
  if(Object.prototype.hasOwnProperty.call(data,'familiars')&&
     data.familiars?.entries!==undefined&&!Array.isArray(data.familiars.entries))
    throw new Error('A lista de familiares está inválida.');
  // Object.assign(defaultState(),data) é usado na migração; chaves especiais
  // em qualquer profundidade não são dados legítimos e devem ser recusadas.
  const stack=[{value:data,depth:0}];
  const forbidden=new Set(['__proto__','prototype','constructor']);
  let seen=0;
  while(stack.length){
   const {value,depth}=stack.pop();
   if(++seen>200000||depth>80)throw new Error('Estrutura do JSON excessivamente grande ou profunda.');
   if(!value||typeof value!=='object')continue;
   for(const key of Object.keys(value)){
    if(forbidden.has(key))throw new Error('O JSON contém um campo reservado e não pode ser importado.');
    const child=value[key];
    if(child&&typeof child==='object')stack.push({value:child,depth:depth+1});
   }
  }
  return data;
 }
 root.DUODECIMA_VALIDATE_SHEET_V536=validate;
 root.DUODECIMA_IMPORT_MAX_BYTES_V536=FILE_MAX_BYTES;
})(typeof window!=='undefined'?window:globalThis);
