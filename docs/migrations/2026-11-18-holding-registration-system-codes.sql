-- IDs de cadastro com 6 dígitos (SPEC-18).
-- Sistema: 001001 (admin), 001002 (demo) | Empresas: 100001+
-- Idempotente.

update public.users
set registration_code = '001001'
where email = 'admin@codenes.com.br'
  and registration_code is distinct from '001001';

update public.users
set registration_code = '001002'
where email = 'teste@teste.com'
  and registration_code is distinct from '001002';