import fs from 'node:fs/promises';

const file=new URL('../index.html',import.meta.url);
let html=await fs.readFile(file,'utf8');
html=html
  .replaceAll('v5.14.3','v5.15.1-stabilization')
  .replace('styles-v511.css?v=5.14.3-profile-banner','styles-v511.css?v=5.15.1-stabilization')
  .replace('core-bridge-v511.js?v=5.11.0','core-bridge-v511.js?v=5.15.1-core-contract')
  .replace('bootstrap-v511.js?v=5.14.3-profile-banner','bootstrap-v511.js?v=5.15.1-stabilization');
await fs.writeFile(file,html,'utf8');
console.log('index.html sincronizado com v5.15.1-stabilization');
