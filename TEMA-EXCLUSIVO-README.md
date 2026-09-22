# Temas exclusivos — formato v1

A ficha v5.15.1 aceita arquivos `.duodecima-theme` pelo menu **Aparência → Temas exclusivos → Upar tema exclusivo**.

O arquivo é um JSON único. Ele pode conter CSS, imagens e fontes em Data URL. Não aceita JavaScript e bloqueia `@import` e URLs externas no CSS.

## Estrutura mínima

```json
{
  "format": "duodecima-theme",
  "formatVersion": 1,
  "id": "meu-tema",
  "name": "Meu Tema",
  "version": "1.0.0",
  "author": "Duodécima",
  "description": "Descrição curta.",
  "icon": "✦",
  "preferredMode": "dark",
  "css": "{{scope}} { --accent:#d53645; } {{scope}} .card { border-color:var(--accent)!important; }",
  "assets": {}
}
```

## Escopo obrigatório

Todo seletor visual do tema deve permanecer dentro de `{{scope}}`. A ficha troca esse marcador por `body[data-exclusive-theme="id-do-tema"]`, mantendo o tema isolado do restante da aplicação.

A partir da v5.15.1, a importação faz uma validação adicional e recusa CSS com seletores comuns fora de `{{scope}}`. Regras auxiliares como `@keyframes`, `@font-face`, `@property`, `@media` e seus quadros internos continuam permitidas, mas qualquer seletor que altere elementos da página precisa carregar o escopo.

Também é possível validar os temas versionados no repositório sem abrir a ficha:

`node scripts/validate-themes.mjs`

## Assets

Imagens e fontes podem ser embutidas em `assets` como Data URL base64. São aceitos PNG/JPEG/WebP/GIF/SVG e WOFF/WOFF2/TTF/OTF.

No CSS, use `{{asset:nome}}`:

```css
{{scope}} {
  background-image: url("{{asset:background}}");
}
```

O JSON da personagem salva somente `appearance.exclusiveThemeId`. Portanto, outro dispositivo precisa instalar o mesmo arquivo `.duodecima-theme` para reproduzir o visual.
