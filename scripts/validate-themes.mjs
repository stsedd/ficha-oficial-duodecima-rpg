import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const files=fs.readdirSync(root).filter(x=>x.endsWith('.duodecima-theme'));
const errors=[];

function issues(css){
  const raw=String(css||'').replace(/\/\*[\s\S]*?\*\//g,'');
  const out=[];
  if(raw.trim()&&!raw.includes('{{scope}}'))out.push('CSS sem {{scope}}');
  const headers=[...raw.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).filter(Boolean);
  for(const header of headers){
    if(header.startsWith('@')||/^(from|to|\d+(?:\.\d+)?%)$/i.test(header))continue;
    for(const selector of header.split(',').map(x=>x.trim()).filter(Boolean)){
      if(!selector.includes('{{scope}}'))out.push(`seletor fora do escopo: ${selector.slice(0,120)}`);
    }
  }
  return out;
}

for(const name of files){
  try{
    const data=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
    if(data.format!=='duodecima-theme')errors.push(`${name}: format inválido`);
    if(Number(data.formatVersion)!==1)errors.push(`${name}: formatVersion inválido`);
    for(const issue of issues(data.css))errors.push(`${name}: ${issue}`);
  }catch(err){errors.push(`${name}: JSON inválido (${err.message})`)}
}

if(errors.length){console.error('❌ Temas inválidos\n- '+errors.join('\n- '));process.exit(1)}
console.log(`✅ ${files.length} tema(s) exclusivo(s) validados com escopo obrigatório.`);
