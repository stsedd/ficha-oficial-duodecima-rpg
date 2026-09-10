# v5.9.0 — temas de cor

## Aparência
- Separado **Modo** (Dark / Light) de **Tema** (paleta de cor).
- Botão de modo visível no topo alterna Dark e Light sem trocar a paleta.
- Botão Tema abre um seletor visual de paletas.
- Paletas disponíveis: Vermelho, Rosa, Azul, Laranja, Verde, Roxo, Dourado, Prata, Vinho, Teal, Sépia, Mono Black e Mono White.
- A mesma paleta funciona sobre Dark ou Light.
- Tema e modo ficam salvos na própria ficha e acompanham o JSON exportado.
- O vermelho da Legio XII permanece como padrão para fichas antigas.

## Banner
- Removido definitivamente o texto de placeholder "Capa do personagem" sobre a capa.
- Banner continua livre, com reposicionamento vertical e zoom.

## Arquitetura
- Nenhuma alteração no Duodécima Core.
- A camada de temas usa variáveis de cor para permitir futuras skins visuais (gelo, fogo, eletricidade, abissal etc.) sem duplicar a ficha.
