-- In House Bank: per-user records and row level security.

create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text not null default '',
  document text,
  city text not null default '',
  default_pix_key text not null default '',
  default_institution text not null default '',
  default_installments integer not null default 1,
  default_due_day integer,
  default_interest_type text not null default 'SIMPLE',
  theme text not null default 'light',
  cdi_annual_percent numeric not null default 0,
  milestones_cents jsonb not null default '[]'::jsonb,
  free_balance_cents bigint not null default 0,
  pdf_footer_text text,
  payment_instructions text,
  responsibility_term text,
  whatsapp_message_template text,
  logo_data_url text,
  updated_at timestamptz not null default now()
);

create table public.installment_plans (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  reference text not null,
  borrower_name text not null,
  used_amount_cents bigint not null,
  return_amount_cents bigint not null,
  issue_date date not null,
  first_due_date date not null,
  installments_count integer not null,
  pix_key text not null,
  beneficiary text not null,
  institution text not null,
  card_price_cents bigint,
  payer_phone text,
  payment_instructions text,
  responsibility_term text,
  created_at timestamptz not null default now()
);

create table public.installments (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.installment_plans (id) on delete cascade,
  number integer not null,
  due_date date not null,
  amount_cents bigint not null,
  paid_date date,
  txid text not null,
  unique (plan_id, number)
);

create table public.cash_boxes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  institution text not null,
  cdi_percent numeric not null default 100,
  limit_cents bigint,
  balance_cents bigint not null default 0
);

create table public.cash_box_movements (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  cash_box_id uuid not null references public.cash_boxes (id) on delete cascade,
  type text not null,
  amount_cents bigint not null,
  movement_date date not null,
  note text
);

create index installment_plans_user_id_idx on public.installment_plans (user_id);
create index installments_user_id_idx on public.installments (user_id);
create index installments_plan_id_idx on public.installments (plan_id);
create index cash_boxes_user_id_idx on public.cash_boxes (user_id);
create index cash_box_movements_user_id_idx on public.cash_box_movements (user_id);

alter table public.settings enable row level security;
alter table public.installment_plans enable row level security;
alter table public.installments enable row level security;
alter table public.cash_boxes enable row level security;
alter table public.cash_box_movements enable row level security;

create policy settings_select_own on public.settings for select using (auth.uid() = user_id);
create policy settings_insert_own on public.settings for insert with check (auth.uid() = user_id);
create policy settings_update_own on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy settings_delete_own on public.settings for delete using (auth.uid() = user_id);

create policy installment_plans_select_own on public.installment_plans for select using (auth.uid() = user_id);
create policy installment_plans_insert_own on public.installment_plans for insert with check (auth.uid() = user_id);
create policy installment_plans_update_own on public.installment_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy installment_plans_delete_own on public.installment_plans for delete using (auth.uid() = user_id);

create policy installments_select_own on public.installments for select using (auth.uid() = user_id);
create policy installments_insert_own on public.installments for insert with check (auth.uid() = user_id);
create policy installments_update_own on public.installments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy installments_delete_own on public.installments for delete using (auth.uid() = user_id);

create policy cash_boxes_select_own on public.cash_boxes for select using (auth.uid() = user_id);
create policy cash_boxes_insert_own on public.cash_boxes for insert with check (auth.uid() = user_id);
create policy cash_boxes_update_own on public.cash_boxes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cash_boxes_delete_own on public.cash_boxes for delete using (auth.uid() = user_id);

create policy cash_box_movements_select_own on public.cash_box_movements for select using (auth.uid() = user_id);
create policy cash_box_movements_insert_own on public.cash_box_movements for insert with check (auth.uid() = user_id);
create policy cash_box_movements_update_own on public.cash_box_movements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cash_box_movements_delete_own on public.cash_box_movements for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.installment_plans to authenticated;
grant select, insert, update, delete on public.installments to authenticated;
grant select, insert, update, delete on public.cash_boxes to authenticated;
grant select, insert, update, delete on public.cash_box_movements to authenticated;
