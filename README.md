# Ficha da Duodécima — v5.7

Ficha oficial da Legio XII Fulminata integrada ao **Duodécima Core schema v2**. Esta versão parte da v5.6 e mantém Vis, Magia, Legados, inventário, familiares, Roma e demais sistemas já existentes, com uma revisão completa da interface ligada ao Core.

## Destaques da v5.7

- perícias em **uma coluna**, sem truncar nomes;
- controles separados **P (Perito)** e **E (Expertise)**;
- atributos abreviados `FOR`, `DES`, `CON`, `INT`, `FÉ`, `CAR`;
- Nível e BP reposicionados e centralizados nos orbes do retrato;
- temas persistentes: **Legio XII, Pergaminho, Obsidiana e Loureiro**;
- múltiplos recursos divinos por personagem (`resources[]`);
- recursos por alvo com uma linha independente por pessoa (Metus/Somnos);
- recursos locais de habilidade (Vis/Victoria);
- escolhas divinas persistentes/progressivas (`choices[]`) com seleção e limite visíveis;
- concessões de perícia do Core (`skillEffects[]`) aplicadas automaticamente;
- migração dos saves anteriores para o schema local 23;
- arquivos principais com nomes `v57` para evitar cache de versões anteriores no GitHub Pages.

## Fonte canônica

Quando online, regras compartilhadas vêm de `https://stsedd.github.io/duodecima-core/`. Os snapshots locais incluídos no pacote ficam como fallback caso o Core esteja indisponível.

## Publicação

O ZIP é **root-ready** para GitHub Pages. Substitua os arquivos da raiz do repositório atual da Ficha e mantenha Pages publicado a partir de `main / (root)`.

Consulte `CHANGELOG_V5_7.md` e `CORE-INTEGRATION.md` para detalhes.
