# Ficha da Duodécima · integração com Duodécima Core

Versão da ficha: **v5.6**  
Schema local de save: **22**  
Core esperado: **2026.09.11.1 ou posterior (schema v2)**

## Fonte canônica

A ficha tenta carregar as regras atuais de:

`https://stsedd.github.io/duodecima-core/`

O `core-bridge-v56.js` sincroniza deuses, kits, habilidades, perícias, talentos, condições, progressões do sistema e agora também:

- `resources[]` com escopo pessoal, coletivo, por alvo ou por habilidade;
- escolhas persistentes e progressivas (`choices`);
- efeitos estruturados de perícia (`skillEffects`).

Os arquivos `gods-v56.js`, `abilities-v56.js` e `skills-v56.js` são snapshots do Core 2026.09.11.1 para fallback offline. Os demais módulos locais v55 permanecem porque não tiveram mudança de conteúdo nesta revisão.

## Saves

Saves v5.5 são migrados automaticamente para o schema 22. Além dos dados anteriores, o JSON passa a guardar `resourceValues`, `targetResources`, `abilityChoices`, `choiceDetails` e `abilityUses`.

## Teste recomendado após publicar

1. confirme que o cabeçalho mostra `CORE 2026.09.11.1` ou posterior;
2. confira Iuppiter, Netuno, Plutão e Summanus e seus limites de acumuladores por nível;
3. abra Potestas e confirme Imperium + Pontos de Potestas e a escolha Atletismo/Intimidação;
4. abra Metus ou Somnos e teste adicionar um alvo ao tracker;
5. abra Netuno → Estágios da Água e confirme 1/2/3 escolhas conforme estacas;
6. abra Cimopoleia → Herança Monstruosa e confirme Scaleskin, Dentes de Tubarão e Shimmerskin;
7. confira a aba de Perícias: P e E devem aparecer lado a lado, com badges FOR/DES/CON/INT/FÉ/CAR.
