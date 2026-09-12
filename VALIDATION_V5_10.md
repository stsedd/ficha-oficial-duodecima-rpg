# Validação — Ficha v5.10

## Core / regras

- 51 kits carregados e comparados ao Core schema v2.
- 26 perícias carregadas.
- 13 blocos estruturados de escolha testados.
- 877 cards de habilidade renderizados em smoke test.
- Core bridge testado com os JSONs reais do Core 2026.09.11.1.
- recursos múltiplos, recursos por alvo, recursos locais e limites de escolha exercitados em teste programático.
- Metus e Somnos testados com linhas de alvos independentes.

## Temas

- sistema Modo + Paleta + Especial recuperado da v5.9.6.
- 23 paletas verificadas no CSS.
- Dark e Light independentes verificados estruturalmente.
- Fogo e Neve e seus assets locais verificados.
- efeitos especiais são bloqueados sobre o banner puro.

## Banner

- banner não contém nome, XII, retrato ou outro conteúdo sobreposto.
- upload, editor de recorte, posição X/Y e zoom existem e são persistidos.
- editor permite reabrir o enquadramento salvo.

## Baralho / inventário

- baralho da linha v5.9.6 reintegrado.
- sem slots falsos.
- filtros, busca, Herança e consumíveis presentes.
- categorias antigas do inventário são normalizadas para o modelo v5.9.6.
- armas continuam separadas do acervo geral e preservam seus cálculos.

## Validações técnicas

- `node --check`: todos os JavaScripts passam em sintaxe.
- parser CSS (`tinycss2`): 0 erros.
- teste lógico v5.10: aprovado.
- smoke render de todos os kits: aprovado.
- teste do Core bridge: aprovado.
- validação estática: aprovada.

### Limitação do ambiente

Foi tentado um teste visual automatizado com Chromium, mas o navegador headless deste sandbox não concluiu a inicialização por falhas de DBus/zygote. Por isso não é registrado aqui um screenshot de navegador como se tivesse sido executado. As validações mecânicas, estruturais, de sintaxe e de renderização programática foram concluídas.
