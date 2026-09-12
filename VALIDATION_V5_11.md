# Validação — Ficha da Duodécima v5.11

Validação realizada sobre os arquivos finais v5.11.

## Estrutura

- sintaxe verificada em todos os arquivos JavaScript;
- CSS processado com parser sem erros;
- referências locais do `index.html` conferidas;
- IDs duplicados verificados após renderização completa: nenhum;
- ZIP final deve ser validado com teste de integridade após compactação.

## Renderização dos kits

- 51/51 kits locais renderizados em Chromium headless;
- nenhum `pageerror`/erro de console nos 51 casos;
- nenhum overflow horizontal detectado nos cards de habilidades, estacas, opções, escolhas, recursos vinculados, recursos locais, trackers por alvo, variantes e subestacas;
- kits com escolhas estruturadas conferidos: Netuno, Mercúrio, Febo, Marte, Diana, Libitina, Potestas, Cimopoleia e Silvano;
- trackers por alvo confirmados em Metus e Somnos.

## Testes mecânicos direcionados

- Netuno em estaca 30: limite exibido 0/3 e três escolhas aceitas até 3/3;
- Metus: criação de alvo, nome persistido no renderer e Tensão incrementada 0→2/4;
- Somnos: criação de alvo, nome persistido no renderer e Fadiga incrementada 0→2/10;
- Iuppiter, Netuno, Plutão e Summanus: máximo validado em níveis 1/10/20/41/100 como 8/9/10/12/18;
- Aemulatio preservada sem recurso de Pontos de Determinação; Imperium coletivo continua separado;
- Potestas mantém Imperium + Pontos de Potestas e escolha Atletismo/Intimidação.

## Temas e responsividade

- 23 paletas verificadas em Dark e Light (46 combinações) para estado ativo e bloco de usos;
- Fogo e Neve verificados separadamente;
- estados de uso no Light não permanecem com painel preto;
- aba ativa no Light recebe destaque da paleta e texto legível;
- páginas Status, Combate e Inventário verificadas em 1440, 1200, 1024, 780 e 390 px sem overflow da página;
- Fogo e Neve verificados em 1440, 1200, 1024 e 390 px sem overflow da página.

## Baralho

- moldura dos quatro lados confirmada;
- título longo confirmado com quebra de linha e sem truncamento;
- descrição longa confirmada integralmente (`scrollHeight == clientHeight` no teste dirigido);
- Fogo e Neve mantêm os ornamentos dentro da composição da carta.

## Banner

- apenas um `#bannerUploadInput` permanece no DOM;
- upload de imagem abre o diálogo de recorte;
- posição vertical e zoom foram alterados durante teste;
- após salvar, a imagem do banner recebeu o enquadramento correspondente e os controles Ajustar recorte/Remover banner ficaram disponíveis.

Observação: o navegador deste ambiente bloqueia navegação direta para localhost/file URLs por política, então a validação visual foi executada em Chromium com o HTML/CSS/JS finais injetados na mesma página de teste. Isso executa o renderer e os handlers reais da ficha sem depender de navegação externa. O Core online continua coberto pelo bridge e pelo fallback local.
