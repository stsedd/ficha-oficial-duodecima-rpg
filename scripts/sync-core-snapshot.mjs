import fs from 'node:fs/promises';

const base=(process.env.DUODECIMA_CORE_BASE||'https://stsedd.github.io/duodecima-core/').replace(/\/?$/,'/');
async function get(path){
  const response=await fetch(new URL(path,base),{headers:{'user-agent':'duodecima-snapshot-sync'}});
  if(!response.ok)throw new Error(`${response.status} ${response.statusText} · ${path}`);
  return response.json();
}

const manifest=await get('manifest.json');
const entries=await Promise.all(Object.entries(manifest.files||{}).map(async([key,path])=>[key,await get(path)]));
const snapshot={manifest,...Object.fromEntries(entries),generatedAt:new Date().toISOString()};
await fs.writeFile(new URL('../core-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n','utf8');
console.log(`Snapshot sincronizado: ${manifest.contentVersion||manifest.updatedAt||'sem versão'}`);
