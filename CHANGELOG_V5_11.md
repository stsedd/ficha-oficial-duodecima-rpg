# Ficha da Duodécima — v5.11

## Pente-fino visual e estrutural

Esta revisão parte da v5.10, preserva a integração com o Duodécima Core schema v2 e mantém como referência visual a v5.9.6 para temas, Fogo/Neve e baralho.

### Perícias

- a Visão Geral usa Atributos + uma coluna legível de Perícias + uma coluna auxiliar;
- a coluna auxiliar reúne Talentos e Consulta Rápida;
- cada perícia mantém os controles independentes P (Perito) e E (Expertise), badge FOR/DES/CON/INT/FÉ/CAR, nome completo, bônus e menu;
- nomes não usam ellipsis/truncamento; em larguras menores a composição responde sem criar overflow horizontal;
- abaixo do breakpoint de segurança, Talentos/Consulta descem para evitar que a ficha ultrapasse a viewport.

### Habilidades e Core v2

- corrigido o layout das estacas para que textos longos, inclusive 30+, permaneçam na coluna de conteúdo e cresçam verticalmente;
- o mesmo tratamento foi aplicado às estacas internas de variantes complexas do Core;
- notas de acúmulos, marcos e mini-fichas passam por formatação semântica com cabeçalhos e linhas separadas;
- Raiva do Trovão exibe ACÚMULO e EFEITOS em blocos legíveis;
- Arautos de Jove separa mini-ficha e ações (Atacar, Distrair, Proteger, Conduzir raio e Rajada celeste);
- o renderer é global, então regras estruturadas equivalentes em outros kits recebem o mesmo tratamento;
- resíduos de metadata do Discord (SPQR/ícone de cargo/copão/timestamps do trecho conhecido) foram removidos do snapshot e filtrados também no Core remoto;
- trackers por alvo de Metus e Somnos e escolhas persistentes/progressivas continuam integrados ao Core v2.

### Temas

- os modos Dark/Light e todas as paletas da linha v5.9.x foram preservados;
- blocos de usos/contadores e seus botões respeitam o tema, inclusive no Light;
- a aba ativa no Light usa a cor da paleta para permanecer visível;
- Fogo e Neve mantêm suas skins especiais e continuam responsivos.

### Baralho de combate

- carta voltou a ser tratada como uma peça inteira: moldura completa, sem barra de seleção lateral;
- categoria aparece como bandeira/tag sobre a imagem;
- títulos longos quebram linha;
- descrição principal não é cortada por clamp;
- espaçamento interno foi centralizado/simetrizado;
- hover mantém a elevação;
- stats permanecem no rodapé da carta;
- Fogo e Neve preservam ornamentos sem provocar overflow da página.

### Banner

- banner continua sendo somente a imagem, sem XII, nome, retrato ou texto sobreposto;
- upload abre editor de recorte com posição horizontal, vertical e zoom;
- o recorte pode ser reaberto e alterado posteriormente;
- removida uma duplicação interna de input de upload para evitar conflito de IDs/eventos.

### Responsividade

- corrigido um overflow intermediário em ~1200 px causado pela soma das larguras mínimas da Visão Geral;
- a coluna auxiliar passa para uma faixa abaixo das Perícias antes que o layout ultrapasse a viewport;
- mobile continua em coluna única.
