# SPEC-04 Supabase e login

Status: concluída.

Auth por e-mail, Google e recuperação. Tabelas por entidade com RLS `auth.uid() = user_id`. Depois do login, a conta pode salvar o carnê que estava na sessão.

Aceite: sem sessão, `/inicio` redireciona para `/entrar`. A migration tem políticas de select, insert, update e delete em todas as tabelas.
