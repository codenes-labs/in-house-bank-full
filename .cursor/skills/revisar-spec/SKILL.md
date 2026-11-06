---
name: revisar-spec
description: Use quando o usuário pedir para revisar ou fechar uma spec. Devolve o que passou, o que falhou e o que corrigir.
---

# Revisar spec

Checklist:

- Critérios de aceite da spec
- Testes unitários passando
- Lint e build
- Se mexeu em dados: isolamento por `auth.uid() = user_id`

Não marcar a spec como concluída se algum item falhar.
