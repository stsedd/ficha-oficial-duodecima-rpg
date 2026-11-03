# Prévia experimental — inventário v5.38

Esta branch serve **apenas para avaliação visual** do novo inventário. A branch `main` continua com a interface aprovada pelos jogadores.

## Abrir a ficha de testes

[Visualizar a ficha de demonstração](https://raw.githack.com/stsedd/ficha-oficial-duodecima-rpg/preview-inventario-v538/index.html)

O link é servido por um proxy público de arquivos do GitHub, **raw.githack.com**, independente do domínio oficial da ficha. Ele pode exibir um aviso de confirmação de navegação. Por precaução, **não importe fichas reais, pessoais ou sensíveis nesse ambiente**.

O navegador recebe uma personagem fictícia automaticamente se não houver dados nesta origem. É possível testar:
- Abas Equipamentos, Itens e Heranças;
- busca e filtro das categorias existentes;
- cartões com imagens de exemplo, indicadores e informações essenciais;
- botão para expandir edição completa sem recriar os campos;
- ativação de armas, consumo de poções, adição manual e biblioteca;
- opções de tema e versão mobile;
- **Restaurar exemplo**, para voltar a testar com os dados iniciais.

O armazenamento do protótipo é local do domínio de prévia, separado do `stsedd.github.io`. O código da prévia contém somente modificações visuais e dados fictícios. A versão final **não deve** incluir `inventory-preview-demo-v538.js`.

## Aprovação

Esta branch está ligada a um **pull request em rascunho**. Não mesclar nem substituir a versão oficial antes da aprovação visual.

As mudanças estão isoladas em:
- `inventory-preview-v538.css`
- `inventory-preview-v538.js`
- `inventory-preview-demo-v538.js`
- adições exclusivas desta branch em `index.html`
- `scripts/preview-inventory-v538-smoke.mjs`, para testes desktop/mobile

As regras, cálculos, dados, materiais e handlers originais permanecem inalterados. Os nós dos controles existentes são reorganizados visualmente sem alterar os seus identificadores e valores.

## Observações para implementação definitiva

Após a aprovação, migrar somente a interface consolidada (sem a personagem fictícia), testar a persistência de inventário em fichas existentes, conferir eventos de importação/exportação e rever casos extremos no mobile.
