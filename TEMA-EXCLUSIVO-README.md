# Temas exclusivos — formato v1

A ficha v5.13.11 aceita arquivos `.duodecima-theme` pelo menu **Aparência → Temas exclusivos → Upar tema exclusivo**.

O arquivo é um JSON único. Ele pode conter CSS e imagens em Data URL. Não aceita JavaScript e bloqueia `@import` e URLs externas no CSS.

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

## Assets

Imagens devem ser `data:image/...;base64,...` dentro de `assets`.

No CSS, use `{{asset:nome}}`:

```css
{{scope}} {
  background-image: url("{{asset:background}}");
}
```

A ficha troca `{{scope}}` por `body[data-exclusive-theme="id-do-tema"]`, mantendo o visual isolado do tema padrão.

O JSON da personagem salva somente `appearance.exclusiveThemeId`. Portanto, outro dispositivo precisa instalar o mesmo arquivo `.duodecima-theme` para reproduzir o visual.


## v5.13.12 — fundo completo

A ficha agora fornece `#exclusiveThemeBackdrop`, uma camada fixa atrás da interface. Temas completos devem preferir:

```css
{{scope}} #exclusiveThemeBackdrop {
  background: url("{{asset:background}}") center/cover fixed no-repeat;
}
```

O `{{scope}}` também é resolvido com especificidade maior que as regras `body[data-theme][data-palette]` da ficha padrão, evitando que a paleta sobrescreva background, orbes, tabs e cards do tema importado.
