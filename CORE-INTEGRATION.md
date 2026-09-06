# Ficha da Duodécima · integração com Duodécima Core

Versão: **v5.2 Core**

## Fonte canônica

A ficha tenta carregar as regras atuais de:

`https://stsedd.github.io/duodecima-core/`

No carregamento, `core-bridge.js` lê o `manifest.json` e sincroniza:

- deuses e kits;
- habilidades passivas e ativas;
- estruturas complexas de habilidades (`tiers`, `variants`, `options`);
- perícias;
- talentos;
- condições;
- progressão de BP;
- níveis de talento e de treinamento;
- Energia, descanso e Exaustão;
- equipamentos básicos compartilhados.

A ficha mantém `gods.js`, `abilities.js`, `skills.js`, `talents.js` e `system.js` como **snapshot local de emergência**. Eles não são mais a fonte canônica quando o Core está online.

## Status no cabeçalho

- `CORE <versão>`: a ficha está usando o Core.
- `SNAPSHOT LOCAL`: o Core não carregou e a ficha usa os dados locais.

## Saves

Os saves continuam no navegador e permanecem compatíveis com o schema v21. O save guarda escolhas do personagem (`godId`, talentos escolhidos, estacas etc.), não uma cópia das descrições atuais dos kits. Assim, reworks feitos no Core aparecem na ficha sem recriar o personagem.

## Habilidades complexas

A ficha agora preserva blocos complexos vindos do Core. Em Vulcano, por exemplo, `Autômato` renderiza:

- Bastião;
- Infiltrador;
- Utilitário;

Sub-habilidades com progressões próprias recebem controles independentes de estacas e salvam seus valores em `abilityStakes` com chaves internas próprias.

## Teste de sincronização recomendado

Depois de publicar esta versão:

1. confirme que o cabeçalho mostra `CORE 2026.09.04.1` (ou versão posterior);
2. abra Vulcano → Autômato e confirme as três variantes;
3. depois faça uma alteração real em Iuppiter **somente no Duodécima Core**;
4. publique o Core;
5. recarregue Guia e Ficha;
6. os dois devem exibir a alteração sem editar seus repositórios.
