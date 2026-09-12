# Ficha da Duodécima — v5.10

## Mescla visual + Core v2

Esta versão parte da mecânica da v5.7/Core schema v2 e recupera como referência visual a ficha v5.9.6 (`fogo-neve-organizados`), especialmente o sistema de temas e o baralho de equipamento.

### Banner puro

- novo banner fixo no topo da ficha;
- nenhuma identidade, XII, nome, retrato, texto ou camada decorativa é desenhada sobre a imagem;
- upload abre um editor antes de salvar;
- o editor permite ajustar posição horizontal, posição vertical e zoom;
- o enquadramento fica persistido no JSON/localStorage e pode ser reaberto em **Ajustar recorte**;
- Fogo e Neve não sobrepõem partículas ao banner.

### Temas recuperados da v5.9.6

O tema volta a ser composto por **Modo + Paleta + Especial**.

- modos independentes: Dark e Light;
- paletas: Vermelho, Rosa, Azul, Laranja, Verde, Roxo, Dourado, Prata, Vinho, Teal, Sépia, Blush, Peach, Lilac, Sage, Lemon, Mauve, Coral, Aqua, Sand, Sky, Mono Black e Mono White;
- especiais: Fogo e Neve;
- o modo e a paleta são persistidos e continuam independentes quando não há especial ativo.

### Baralho recuperado da v5.9.6

- restauração do baralho visual aprovado da família v5.9.x;
- cartas maiores e legíveis para armadura, escudo, armas e itens fixados;
- imagens, categoria, material, descrição curta, atributos mecânicos e selo **HERANÇA**;
- consumíveis podem ser gastos diretamente no baralho;
- sem cartões falsos de "slot livre";
- inventário volta ao fluxo organizado por Arma corpo a corpo, Arma à distância, Consumível, Item mágico e Outro;
- itens antigos são migrados automaticamente para essas categorias;
- armas mantêm cálculo mecânico próprio e podem ser marcadas como Herança.

### Mecânicas atuais preservadas

- Duodécima Core schema v2;
- múltiplos recursos por kit;
- recursos pessoais, coletivos, locais e por alvo;
- Metus: Tensão acompanhada por alvo independente;
- Somnos: Fadiga acompanhada por alvo independente;
- acumuladores de Iuppiter, Netuno, Plutão e Summanus com fórmula de nível;
- escolhas persistentes e progressivas dentro de habilidades;
- Potestas com Atletismo/Intimidação;
- Aemulatio atualizada;
- Vis/Victoria com recursos locais;
- perícias em uma coluna, com nomes completos e controles P/E separados.

## Compatibilidade

O schema local passa a 24 e migra os saves anteriores. O Core remoto continua sendo a fonte canônica quando disponível; snapshots locais seguem como fallback.
