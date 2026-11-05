# Prévia da ficha em preto e branco · v5.40

**Apenas para avaliação visual e funcional — não mesclar sem aprovação.**

## Abrir

[Prévia da Ficha e Poderes](https://raw.githack.com/stsedd/ficha-oficial-duodecima-rpg/preview-ficha-roll20-minimal-v540/roll20-minimal.html)

O proxy público `raw.githack.com` serve os arquivos do repositório sem publicar esta versão na ficha oficial. Não importar dados reais ou sensíveis no ambiente externo.

## O que a prévia demonstra

### Ficha (principal)
- Cabeçalho compacto em preto e branco, com nome, filiação divina, nível e BP.
- HP, Energia, Sanidade, Defesa, DT, conjuração e recursos divinos em faixa numérica.
- Atributos em coluna estreita, com valores e controles originais.
- Perícias agrupadas por atributo, em duas colunas no PC e uma no mobile, com P/E e bônus editáveis.
- Descansos em barra curta, com informação adicional de Sanidade sob expansão.
- Talentos, referência e configurações de linhagem em seções recolhíveis.

### Poderes
- Faixa curta de recursos.
- Busca e filtros Todas / Ativas / Passivas / Favoritas.
- Lista de habilidades à esquerda e descrição completa da seleção à direita.
- Controle original de estacas, baralho, usos e outros mecanismos mantido dentro do painel da habilidade.
- No mobile, tocar em uma habilidade abre sua descrição e permite voltar à lista.
- Combate, condições, descanso e baralhos acessíveis numa seção recolhível.

## Escopo e isolamento

- **Nenhum arquivo da branch `main` foi alterado.**
- Arquivo de entrada independente: `roll20-minimal.html`.
- CSS e JS próprios: `roll20-minimal-v540.css`, `roll20-minimal-v540.js`.
- Dados fictícios: `roll20-minimal-demo-v540.js`.
- Seletor de personagens de teste: `multi-character-preview-v540.js`, usando chaves de armazenamento exclusivas para não misturar dados de outras prévias.
- Testes Playwright: `scripts/preview-roll20-v540-smoke.mjs`.

**Não é a implementação final**. A versão oficial só deve ser alterada após aprovação do layout e validação com os demais dados reais no ambiente oficial. Inventário e as demais abas não fazem parte deste protótipo.
