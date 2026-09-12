# Ficha da Duodécima — v5.6 · Core schema v2

Ficha oficial da Legio XII Fulminata integrada ao **Duodécima Core**. Esta versão parte da v5.5 e preserva os ajustes de Vis, Magia e Legados, adicionando suporte ao schema v2 do Core e a revisão visual da matriz de perícias.

## Destaques da v5.6

- múltiplos recursos divinos por personagem (`resources[]`);
- recursos pessoais/coletivos no HUD, recursos por alvo em trackers próprios e recursos temporários dentro das habilidades;
- escolhas divinas persistentes/progressivas salvas no JSON;
- benefícios de perícia concedidos por passivas e escolhas aplicados automaticamente;
- matriz de perícias em duas colunas, com os dois quadrados **P (Perito)** e **E (Expertise)**, atributo abreviado (`FOR`, `DES`, `CON`, `INT`, `FÉ`, `CAR`) e alinhamento revisado;
- textos longos das habilidades renderizados em blocos legíveis sem duplicar notas do Core;
- contadores para limites de uso quando a regra informa explicitamente quantidade e período;
- migração de saves da v5.5 (schema local v21) para v5.6 (schema local v22).

## Fonte canônica

Quando online, regras compartilhadas vêm de `https://stsedd.github.io/duodecima-core/`. Os snapshots locais v5.6 ficam apenas como fallback para indisponibilidade do Core.

## Publicação

O ZIP é root-ready para GitHub Pages. Substitua os arquivos da raiz do repositório atual da Ficha e mantenha Pages publicado a partir de `main / (root)`.
