# Integração com Duodécima Core — Ficha v5.7

Versão da ficha: **v5.7**  
Schema local da ficha: **23**  
Core esperado: **schema v2 / conteúdo 2026.09.11.1 ou compatível**

## Fonte online

A Ficha tenta carregar `https://stsedd.github.io/duodecima-core/` através de `core-bridge-v57.js`. O bridge lê o `manifest.json` e sincroniza deuses, kits, habilidades, perícias, talentos, condições, progressões e equipamentos.

O bridge também preserva os campos estruturados do schema v2:

- `resources[]`: recursos pessoais, coletivos, por alvo e locais de habilidade;
- `choices[]`: escolhas persistentes/progressivas dentro de habilidades;
- `skillEffects[]`: proficiências, expertises e escolhas de perícia concedidas pelo kit.

## Fallback local

Os arquivos `gods-v57.js`, `abilities-v57.js` e `skills-v57.js` são snapshots do Core 2026.09.11.1. Eles permitem que a ficha continue funcional se o Core online estiver temporariamente indisponível.

## Comportamento na interface

- Recursos `personal` e `collective` aparecem no HUD.
- Recursos `target` usam uma lista independente de alvos na aba Combate. Cada pessoa mantém seu próprio contador.
- Recursos `ability` aparecem dentro da habilidade correspondente.
- Escolhas persistentes ficam em `abilityChoices` e mostram seleção atual + limite permitido.
- Efeitos de perícia estruturados são aplicados à matriz de Perícias sem exigir duplicação manual.

## Compatibilidade

A v5.7 migra saves anteriores a partir das chaves legadas, inclusive schema local 22/v5.6. Os arquivos principais v57 usam cache-buster `5.7.0` para evitar que GitHub Pages misture JS/CSS desta revisão com arquivos antigos.
