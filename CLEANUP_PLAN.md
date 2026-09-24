# Limpeza segura

A limpeza do `main` deve remover apenas cópias integrais antigas que não são referenciadas pelo runtime atual. Arquivos versionados ainda apontados por `index.html`, previews ou documentação ativa permanecem até migração explícita.

Antes de uma exclusão em massa, preserve o estado correspondente em branch/tag de arquivo.
