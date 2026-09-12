# Validação — Ficha da Duodécima v5.7

Validação executada antes do empacotamento.

## Core
- `scripts/validate.mjs`: aprovado.
- Core: schema v2 / conteúdo `2026.09.11.1`.
- 52 divindades / 51 kits selecionáveis.
- 26 perícias, 32 talentos, 27 condições.
- Snapshot da Ficha comparado ao Core: **51/51 kits**, sem divergências de `resources[]`, `choices[]` ou `skillEffects[]`.
- Bridge online simulado contra os JSONs reais do Core: aprovado.

## Mecânicas testadas
- Raiva do Trovão, Maré Crescente, Acúmulo Necromântico e Carga Noturna: limite 8 + `floor(nível/10)`.
- Potestas: Imperium coletivo + Pontos de Potestas pessoais; escolha Atletismo/Intimidação.
- Metus: Tensão por alvo, até 4 por pessoa; várias pessoas mantêm contadores independentes.
- Somnos: Fadiga por alvo, até 10 por pessoa.
- Proserpina, Timor e Invidia: máximos por estaca 2/3/4.
- Vis e Victoria: recursos locais de habilidade até 3.
- Netuno: Estágios da Água libera 1/2/3 escolhas por estaca.
- Cimopoleia: Scaleskin, Dentes de Tubarão e Shimmerskin disponíveis.
- Opções dinâmicas de Mercúrio, Febo e Diana testadas.
- Renderização de escolhas persistentes e progressivas testada para todos os kits.
- Renderização completa testada para os 51 kits: 877 cards de habilidades.

## Interface / estrutura
- 26 perícias renderizadas com nome completo, P e E separados e atributos abreviados.
- CSS final força uma coluna de perícias e permite quebra de linha, sem ellipsis.
- Quatro temas presentes e persistentes: Legio XII, Pergaminho, Obsidiana e Loureiro.
- Nível/BP usam camada final de centralização nos orbes.
- CSS analisado por parser: sem erros de sintaxe.
- Todos os JavaScripts passaram em `node --check`.
- HTML conferido para arquivos locais inexistentes e IDs duplicados.

## Limitação do ambiente
O Chromium headless disponível neste sandbox não inicializa corretamente (subprocesso/DBus/zygote) e não produziu screenshot local. Por isso, não foi alegado teste visual por navegador. A revisão visual foi feita diretamente sobre a captura enviada e sobre as regras finais de layout/CSS; a lógica, o Core e as funções de renderização foram testados automaticamente.
