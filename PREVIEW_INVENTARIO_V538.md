# Prévia experimental: Armamentarium minimalista v5.38

**Somente na branch `preview-inventario-v538` e no PR de rascunho #2.**
Nada foi mesclado para a `main`, e a versão pública da ficha mantém a interface anterior.

## Abrir a versão de testes

[Armamentarium minimalista (HTML experimental)](https://raw.githack.com/stsedd/ficha-oficial-duodecima-rpg/preview-inventario-v538/index.html)

Este link usa um proxy externo de arquivos públicos do GitHub, em uma origem separada da ficha oficial. **Não importe dados pessoais ou fichas reais**. Há uma personagem fictícia de demonstração. Para voltar aos dados de exemplo atualizados, escolha **Restaurar exemplo** na parte inferior da aba Inventário.

## Visual aprovado como referência

Inspirado diretamente no screenshot fornecido pelo usuário:

- Faixa **Em uso** com chips pequenos e ícones de traço;
- Abas discretas **Tudo / Equipamentos / Bolsa / Heranças**;
- Lista de registros à esquerda, linhas compactas, fundo neutro, contorno arredondado;
- Único painel de detalhes à direita: ícone ou imagem (quando cadastrada), tipo, nome, material, propriedades, descrição;
- Botões **Editar**, **Equipar/Desequipar** e **Baralho**, de acordo com a natureza do objeto;
- No celular, a lista abre a visualização do item com botão **Voltar aos itens**;
- Busca, filtros e inclusão manual/biblioteca presentes em controles discretos, recolhidos por padrão.

## Segurança de dados e compatibilidade

O novo layout usa os próprios inputs e os handlers da ficha original, **movendo os editores reais para o painel de detalhes** somente quando necessário. As regras de ataque, dano, defesa, materiais, estacas, resistência e consumo não são reimplementadas. As alterações de quantidade, estado equipado e fixação no baralho seguem os fluxos do app principal. O baralho de combate original continua com imagens, arrastar/soltar e cálculos.

A demonstração usa somente dados fictícios, em armazenamento local do domínio de prévia. O arquivo `inventory-preview-demo-v538.js` **não deve integrar a publicação oficial**.

A implementação definitiva, depois da aprovação, deve migrar a camada de UI sem o demonstrador, revisar importação/exportação, cores de todos os temas e dados longos, e repetir os testes responsivos.

## Arquivos do protótipo

- `inventory-preview-v538.js`: visualização lista + detalhe, usando elementos originais do DOM
- `inventory-preview-v538.css`: CSS limitado à aba de inventário experimental
- `inventory-preview-demo-v538.js`: personagem fictícia demonstrativa
- `scripts/preview-inventory-v538-smoke.mjs`: teste Playwright no PC e mobile
- `index.html`: referências aos arquivos exclusivos da branch

**Não mesclar antes da aprovação visual.**
