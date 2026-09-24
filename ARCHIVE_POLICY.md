# Política de arquivo do repositório

O branch `main` deve priorizar apenas o runtime atual, assets em uso, testes e documentação ativa.

Antes de remover snapshots históricos completos, preserve o estado anterior em um branch de arquivo. Pastas duplicadas que já representam cópias integrais de versões antigas não devem ser usadas como fonte de manutenção; o histórico do Git continua sendo a referência para recuperar versões anteriores.

Arquivos versionados que ainda são referenciados pelo `index.html`, por previews ou por documentação ativa devem permanecer no `main` até a migração correspondente.
