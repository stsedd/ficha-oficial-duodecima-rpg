# Ficha da Duodécima v5.6

## Core schema v2
- Integra `resources[]` com múltiplos recursos por personagem.
- Recursos pessoais e coletivos aparecem no HUD; recursos por alvo ganham trackers próprios; recursos locais aparecem dentro da habilidade.
- Netuno, Plutão e Summanus usam o mesmo limite por nível de Iuppiter quando definido pelo Core.
- Metus e Somnos guardam acúmulos por alvo.
- Potestas suporta Imperium coletivo e Pontos de Potestas pessoais.

## Escolhas e perícias
- Escolhas persistentes/progressivas das habilidades são salvas no JSON.
- Benefícios de perícia das passivas e escolhas passam a ser aplicados pela ficha.
- Potestas oferece Atletismo ou Intimidação.
- Cimopoleia preserva Scaleskin, Dentes de Tubarão e Shimmerskin.
- Perícias foram reorganizadas em duas colunas com P e E independentes, atributo abreviado (FOR/DES/CON/INT/FÉ/CAR), nome, valor e edição alinhados.

## Habilidades
- Dedicação Compartilhada de Aemulatio vem diretamente do Core atualizado, sem Pontos de Determinação.
- Textos longos preservam blocos legíveis e notas do Core não são duplicadas.
- Habilidades com limite de uso explicitamente reconhecível recebem contador manual; há reset manual no combate e descanso longo restaura os contadores.

## Compatibilidade
- Saves da v5.5 são migrados para o schema local v22.
- Snapshot local sincronizado com o Core 2026.09.11.1 para fallback offline.
