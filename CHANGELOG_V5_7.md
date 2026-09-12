# Ficha da Duodécima v5.7

Revisão geral feita sobre a v5.6/Core schema v2.

## Interface
- Perícias passam a usar **uma coluna** na visão principal para que nenhum nome seja truncado.
- Cada perícia mantém dois controles independentes: **P (Perito)** e **E (Expertise)**.
- Atributos das perícias usam apenas **FOR, DES, CON, INT, FÉ e CAR**.
- Orbes de **Nível** e **BP** foram reposicionados e o conteúdo foi centralizado vertical e horizontalmente.
- Temas restaurados com seleção persistente: **Legio XII, Pergaminho, Obsidiana e Loureiro**.
- O seletor de tema aparece no cabeçalho e também na barra de navegação da ficha.
- Os arquivos principais agora usam nomes `v57`, além do cache-buster `5.7.0`, para impedir que o GitHub Pages reutilize CSS/JS da versão anterior.

## Core schema v2
- Recursos pessoais/coletivos continuam no HUD de combate.
- **Tensão (Metus)** e **Fadiga (Somnos)** têm tracker por alvo, com quantidade de alvos visível e um contador independente para cada pessoa.
- Recursos locais de habilidade, como **Frenesi (Vis)** e **Momentum (Victoria)**, aparecem dentro da habilidade correspondente.
- Escolhas persistentes/progressivas mostram claramente quantas opções podem ser selecionadas, quais estão selecionadas e como o limite cresce por nível/estacas.
- Netuno, Cimopoleia, Febo, Diana, Marte, Mercúrio, Libitina e Silvano usam a estrutura de escolhas do Core sem depender de interpretação manual do texto.
- Potestas mantém Imperium coletivo + Pontos de Potestas pessoais e a escolha de **Atletismo ou Intimidação**.

## Compatibilidade
- Schema local da ficha: **v23**.
- Saves da v5.6/schema 22 são migrados sem apagar personagem, recursos, perícias ou demais dados.
- Tema escolhido também passa a ser salvo junto à ficha.
