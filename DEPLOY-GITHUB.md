# Deploy no GitHub Pages

1. Extraia o ZIP.
2. Substitua os arquivos da raiz do repositório atual do Guia pelos arquivos desta pasta.
3. Confirme que `index.html`, `app.js`, `content.js`, `core-bridge.js`, `styles.css` e `assets/` estão na raiz.
4. Faça commit e push para `main`.
5. Em **Settings → Pages**, mantenha **Deploy from a branch → main → /(root)**.
6. Aguarde o Pages publicar.

## Teste obrigatório

Abra o Guia e confira a sidebar:

- `CORE 2026.09.04.1` = integração funcionando.
- `SNAPSHOT LOCAL` = o Guia abriu, mas não conseguiu ler o Core.

Depois teste:

- Sistema → Perícias;
- Sistema → Talentos;
- Sistema → Condições;
- Deuses → Vulcano → Autômato.

O Autômato deve mostrar **Bastião, Infiltrador e Utilitário** como blocos próprios, com as estacas internas de cada capacidade quando existirem.
