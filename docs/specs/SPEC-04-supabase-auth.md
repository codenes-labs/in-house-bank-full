# SPEC-04 Supabase e login

Status: concluída.

Auth por e-mail, Google e recuperação. Tabelas por entidade com RLS `auth.uid() = user_id`. Depois do login, a conta pode salvar o carnê que estava na sessão.

Aceite: sem sessão, `/inicio` redireciona para `/entrar`. A migration tem políticas de select, insert, update e delete em todas as tabelas. JWT com validade **12 h**; após **2 h** sem atividade na aba, o cliente encerra a sessão (token removido).
