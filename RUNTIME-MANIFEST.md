# Runtime ativo da Ficha

Este arquivo existe para impedir alterações acidentais em cópias históricas mantidas no repositório.

## Entrada publicada

- `index.html`
- `styles-v511.css`
- `skills-v511.js`, `gods-v511.js`, `abilities-v511.js`
- `abilities-extra-v55.js`, `system-v55.js`, `talents-v55.js`, `magic-v55.js`, `roma-v55.js`, `familiars-v55.js` como fallback legado
- `core-bridge-v511.js`
- `bootstrap-v511.js`
- `lineage-creation-v515.js` carregado dinamicamente pelo bootstrap
- `app-v511.js` carregado dinamicamente pelo bootstrap
- `stabilization-v516.js` carregado após o app
- `core-snapshot.json` quando gerado pelo workflow de sincronização

Arquivos `v54`, `v55`, `v56`, `v57`, `v58`, `v59*`, pastas de entregas anteriores e previews antigos são históricos e **não devem receber correções do runtime atual**. O histórico continua preservado pelo Git; novas alterações devem mirar apenas a lista acima.

## Regra de manutenção

Ao trocar qualquer arquivo ativo, atualize este manifesto e a chave de cache correspondente em `index.html` ou `bootstrap-v511.js`. A camada automática de snapshot mantém a última versão canônica do Core disponível caso o endpoint remoto falhe.
