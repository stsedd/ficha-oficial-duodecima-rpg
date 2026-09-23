import fs from 'node:fs/promises';

// Mantém a versão visível e as cache keys do GitHub Pages sincronizadas com VERSION.txt.
const indexFile=new URL('../index.html',import.meta.url);
const versionFile=new URL('../VERSION.txt',import.meta.url);
const version=(await fs.readFile(versionFile,'utf8')).trim();
let html=await fs.readFile(indexFile,'utf8');

html=html
  .replace(/(<title>[^<]*?·\s*)v[^<]+(<\/title>)/,`$1${version}$2`)
  .replace(/(<span class="version-chip"[^>]*>)v[^<]+(<\/span>)/,`$1${version}$2`)
  .replace(/(SCUTUM · Ficha Universal da Legio XII Fulminata · )v[^<]+(<\/p>)/,`$1${version}$2`)
  .replace(/styles-v511\.css\?v=[^"']+/g,`styles-v511.css?v=${version}`)
  .replace(/core-bridge-v511\.js\?v=[^"']+/g,`core-bridge-v511.js?v=${version}-core`)
  .replace(/bootstrap-v511\.js\?v=[^"']+/g,`bootstrap-v511.js?v=${version}`);

await fs.writeFile(indexFile,html,'utf8');
console.log(`index.html sincronizado com ${version}`);
