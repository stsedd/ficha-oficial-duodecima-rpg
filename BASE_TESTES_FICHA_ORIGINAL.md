# Base permanente de testes — ficha original

Esta branch foi criada **diretamente da `main`**, sem incorporar o redesign do Roll20 ou a prévia do Armamentarium.

## Link da ficha de testes

https://raw.githack.com/stsedd/ficha-oficial-duodecima-rpg/preview-ficha-original-base/ficha-teste.html

O endereço usa um proxy externo para os arquivos públicos do repositório. **Não importe personagens reais** nessa prévia.

## Como vamos trabalhar

1. Começamos com a aparência e as funcionalidades da ficha original, sem alterações.
2. Todas as próximas propostas visuais são implementadas **somente nesta branch**.
3. Cada alteração deve preservar regras, cálculos, backup e salvamentos existentes.
4. Para a publicação oficial, a alteração será revisada e aprovada separadamente.
5. A `main` não deve receber mudanças sem aprovação.

## Isolamento

`ficha-teste.html` reproduz o HTML da ficha oficial exatamente (exceto título invisível, comentário e referência ao seletor de personagens isolado).

`multi-character-preview-original.js` é uma cópia do seletor original com **apenas as três chaves de armazenamento substituídas**, evitando compartilhamento de dados com a ficha oficial ou protótipos anteriores.

A cópia é intencional para permitir testes sem migrar ou apagar fichas reais. Não exporte fichas pessoais para o domínio externo.

## Versões descartadas

- Protótipo Roll20 minimalista: PR #3, encerrado sem mesclar.
- Protótipo de inventário experimental: PR #2, encerrado sem mesclar.
