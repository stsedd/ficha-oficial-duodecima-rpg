# Runtime ativo da Ficha

Este arquivo existe para impedir alterações acidentais em arquivos históricos e para manter o `main` focado no runtime publicado.

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

Pastas completas de entregas antigas foram retiradas do `main`; o histórico continua preservado pelos commits do Git. Arquivos versionados antigos que ainda permanecerem são apenas referência histórica e **não devem receber correções do runtime atual**.

- `v5.15.4-fortuna-blessing`: adiciona o toggle persistente de Bênção de Fortuna (+10 HP máximo enquanto ativo).

- `v5.15.5-fortuna-month-reset`: a Bênção de Fortuna continua dando +10 HP máximo enquanto marcada e agora desativa automaticamente quando o mês muda.

- `v5.15.6-banner-ratio`: corrige a capa para a proporção canônica 1800×400 (4,5:1) no desktop, mobile e editor de recorte, removendo o crop/zoom automático causado pela antiga proporção 5,4:1.

- `v5.15.7-image-storage`: impede a camada de estabilização de regredir o número de versão e compacta imagens de armamentos antes de salvá-las, incluindo compactação automática das imagens antigas e tratamento de limite do armazenamento local.

- `v5.15.8-banner-fit`: remove o limite de 260 px que achatava a capa em telas largas; a área publicada permanece 4,5:1 e o banner em 100% usa `contain`, mostrando a imagem inteira sem crop. O smoke test valida um banner 1800×400 em desktop e mobile.

## Regra de manutenção

Ao trocar qualquer arquivo ativo, atualize este manifesto e a chave de cache correspondente em `index.html` ou `bootstrap-v511.js`. A camada automática de snapshot mantém a última versão canônica do Core disponível caso o endpoint remoto falhe.
