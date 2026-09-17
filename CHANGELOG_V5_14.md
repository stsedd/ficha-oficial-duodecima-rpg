# v5.14.0 — base preparada para temas

## Aparência padrão
- removido o botão separado Dark / Light;
- cada paleta padrão agora oferece as opções Dark e Light diretamente no seletor;
- todos os temas existentes continuam disponíveis;
- JSONs antigos seguem compatíveis, pois `appearance.mode` e `appearance.palette` continuam sendo usados internamente;
- temas Fogo, Neve e temas exclusivos permanecem separados.

## Theme API
- adicionados hooks semânticos `data-theme-*` para perfil, abas, recursos, habilidades, perícias, talentos, inventário, familiares, magia e baralho;
- recursos recebem `data-resource-kind`, `data-resource-id` e `data-resource-key`;
- adicionados slots ocultos de ícones para HP, Energia, Sanidade, Defesa, DT, Conjuração e recursos divinos;
- cards do baralho recebem estado visual selecionável (`data-theme-selected`) sem interferir nas mecânicas;
- adicionadas duas camadas ambientais fixas para fundos, ruído, raios e overlays;
- adicionados helpers para frames PNG e `border-image` 9-slice;
- adicionadas variáveis estáveis de fonte, fundo, cards, glow, orbs e superfícies.

## Temas exclusivos
- continuam isolados da ficha padrão e sem JavaScript;
- assets agora aceitam imagens e fontes base64 (`woff`, `woff2`, `ttf`, `otf`);
- documentação completa em `THEME-API-V5.14.md`;
- incluído `TEMA-EXCLUSIVO-TEMPLATE.duodecima-theme` como ponto de partida.
