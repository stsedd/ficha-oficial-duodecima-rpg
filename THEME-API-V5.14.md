# Theme API — Ficha Duodécima v5.14.0

Esta versão prepara a ficha padrão para temas exclusivos muito mais profundos sem quebrar as mecânicas.

## 1. Temas padrão

O botão separado **Dark / Light** foi removido. No seletor de temas, cada paleta padrão possui dois botões: **Dark** e **Light**. Internamente a ficha continua salvando `appearance.mode` e `appearance.palette`, portanto JSONs antigos continuam compatíveis.

## 2. Hooks semânticos

Componentes importantes agora expõem atributos estáveis:

- `data-theme-component="profile"`
- `data-theme-component="tabs"`
- `data-theme-component="resource-strip"`
- `data-theme-component="combat-resource-dock"`
- `data-theme-component="resource"`
- `data-theme-component="abilities"`
- `data-theme-component="ability"`
- `data-theme-component="equipment-deck"`
- `data-theme-component="equipment-card"`
- `data-theme-component="orb"`

Recursos expõem:

- `data-resource-kind="hp"`
- `data-resource-kind="en"`
- `data-resource-kind="san"`
- `data-resource-kind="defense"`
- `data-resource-kind="dt"`
- `data-resource-kind="cast"`
- `data-resource-kind="divine"`
- recursos divinos também recebem `data-resource-id`.

Habilidades expõem `data-ability-id`, `data-ability-type` e `data-ability-source`.

Cartas de equipamento expõem `data-equipment-kind` e `data-equipment-key`.

## 3. Slots de ícone

Recursos recebem um elemento `.theme-resource-icon` que fica oculto nos temas padrão. Um tema exclusivo pode ativá-lo:

```css
{{scope}} { --theme-resource-icon-display:inline-flex; }
{{scope}} [data-resource-kind="hp"] .theme-resource-icon { color:#e43d4d; }
```

Também é possível substituir o desenho por uma imagem:

```css
{{scope}} [data-resource-kind="hp"] .theme-resource-icon {
  color:transparent;
  background-image:url("{{asset:heart}}");
}
```

## 4. Frames / molduras

Componentes importantes recebem `data-theme-frame`. O contrato inclui um pseudo-elemento de moldura invisível por padrão. Para usar um PNG com centro transparente:

```css
{{scope}} [data-theme-frame="ability"] {
  --theme-frame-image:url("{{asset:frame-red-gold}}");
  --theme-frame-opacity:1;
  --theme-frame-inset:-4px;
}
```

Para molduras que precisam escalar melhor, o tema também pode ignorar este helper e usar `border-image` diretamente.

## 5. Variáveis globais para tema exclusivo

Um tema pode alterar apenas estas variáveis para mudar grande parte da ficha:

```css
{{scope}} {
  --theme-font-body: Arial, sans-serif;
  --theme-font-display: Georgia, serif;
  --theme-font-label: Arial, sans-serif;
  --theme-page-bg:#080406;
  --theme-card-bg:linear-gradient(180deg,#16080d,#080405);
  --theme-card-border:#b88a3a;
  --theme-card-radius:8px;
  --theme-card-shadow:0 18px 40px #0009;
  --theme-card-glow:0 0 24px #ff263344;
  --theme-ability-bg:#090506;
  --theme-equipment-bg:linear-gradient(180deg,#10070a,#050304);
  --theme-resource-icon-display:inline-flex;
  --theme-orb-content-y:0px;
}
```

## 6. Fontes embutidas

O formato `.duodecima-theme` v1 agora aceita em `assets` imagens e fontes base64 (`woff`, `woff2`, `ttf`, `otf`). Assim um tema pode conter uma fonte própria sem buscar arquivos externos.

Exemplo:

```css
@font-face{
  font-family:"MinhaFonte";
  src:url("{{asset:display-font}}") format("woff2");
  font-weight:400 900;
}
{{scope}}{--theme-font-display:"MinhaFonte",serif;}
```

## 7. Limite intencional

O tema continua **sem JavaScript**. Isso é proposital: aparência pode mudar profundamente sem permitir que um arquivo de tema altere regras, cálculos ou dados da personagem. Mudanças mecânicas continuam pertencendo à ficha/Core.


## 8. Camadas ambientais

A ficha possui duas camadas vazias que os temas podem usar sem tocar no conteúdo:

- `[data-theme-layer="back"]` — fundo / textura / tempestade.
- `[data-theme-layer="front"]` — partículas / raios / overlays por cima da interface.

Exemplo:

```css
{{scope}} [data-theme-layer="back"]{
  opacity:.45;
  background-image:url("{{asset:storm-background}}");
}
{{scope}} [data-theme-layer="front"]{
  opacity:.28;
  background-image:url("{{asset:lightning-gif}}");
  background-size:cover;
  mix-blend-mode:screen;
}
```

## 9. Zonas por aba

Cada conteúdo principal expõe `data-theme-zone="status|combat|inventory|familiars|roma|magic|history|notes"`. Isso permite, por exemplo, usar um fundo diferente só em Combate ou mudar a textura apenas no Inventário.

## 10. Outros componentes estáveis

Também existem hooks para `skill`, `talent`, `inventory-item`, `weapon-editor`, `familiar`, `spell`, `conditions` e `death`.

## 11. Moldura 9-slice

Para uma imagem de moldura que precisa acompanhar cards de tamanhos diferentes, use as variáveis de `border-image`:

```css
{{scope}} [data-theme-frame="ability"]{
  --theme-border-image-source:url("{{asset:ability-frame}}");
  --theme-border-image-slice:60;
  --theme-border-image-width:22px;
  --theme-border-image-outset:4px;
  --theme-border-image-repeat:stretch;
}
```

Isso é preferível ao `background-size:100% 100%` quando a ornamentação das bordas não pode ser deformada.
