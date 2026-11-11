export const schemaStatements = [
  `create table if not exists public.users (
    id uuid primary key,
    email text not null unique,
    password_hash text not null,
    account_kind text not null default 'standard',
    must_change_password boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `alter table public.users add column if not exists account_kind text not null default 'standard'`,
  `alter table public.users add column if not exists must_change_password boolean not null default false`,
  `create table if not exists public.auth_login_lockouts (
    email text primary key,
    failure_count integer not null default 0,
    lockout_level integer not null default 0,
    locked_until timestamptz,
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists public.auth_rate_limits (
    scope text not null,
    subject text not null,
    failure_count integer not null default 0,
    lockout_level integer not null default 0,
    locked_until timestamptz,
    updated_at timestamptz not null default now(),
    primary key (scope, subject)
  )`,
  `alter table public.users add column if not exists totp_secret text`,
  `alter table public.users add column if not exists totp_enabled boolean not null default false`,
  `create table if not exists public.settings (
    user_id uuid primary key references public.users (id) on delete cascade,
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
  )`,
  `create table if not exists public.installment_plans (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
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
  )`,
  `create table if not exists public.installments (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
    plan_id uuid not null references public.installment_plans (id) on delete cascade,
    number integer not null,
    due_date date not null,
    amount_cents bigint not null,
    paid_date date,
    txid text not null,
    unique (plan_id, number)
  )`,
  `create table if not exists public.cash_boxes (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
    name text not null,
    institution text not null,
    cdi_percent numeric not null default 100,
    limit_cents bigint,
    balance_cents bigint not null default 0
  )`,
  `create table if not exists public.cash_box_movements (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
    cash_box_id uuid not null references public.cash_boxes (id) on delete cascade,
    type text not null,
    amount_cents bigint not null,
    movement_date date not null,
    note text
  )`,
  `create table if not exists public.free_balance_withdrawals (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
    amount_cents bigint not null,
    withdrawal_date date not null,
    note text
  )`,
  `create table if not exists public.free_balance_deposits (
    id uuid primary key,
    user_id uuid not null references public.users (id) on delete cascade,
    amount_cents bigint not null,
    deposit_date date not null,
    note text
  )`,
  `create index if not exists installment_plans_user_id_idx on public.installment_plans (user_id)`,
  `create index if not exists installments_user_id_idx on public.installments (user_id)`,
  `create index if not exists installments_plan_id_idx on public.installments (plan_id)`,
  `create index if not exists cash_boxes_user_id_idx on public.cash_boxes (user_id)`,
  `create index if not exists cash_box_movements_user_id_idx on public.cash_box_movements (user_id)`,
  `create index if not exists free_balance_withdrawals_user_id_idx on public.free_balance_withdrawals (user_id)`,
  `create index if not exists free_balance_deposits_user_id_idx on public.free_balance_deposits (user_id)`,
  `alter table public.free_balance_deposits add column if not exists recorded_at timestamptz`,
  `alter table public.free_balance_withdrawals add column if not exists recorded_at timestamptz`,
  `alter table public.cash_box_movements add column if not exists recorded_at timestamptz`,
];

const dataTables = [
  'settings',
  'installment_plans',
  'installments',
  'cash_boxes',
  'cash_box_movements',
  'free_balance_withdrawals',
  'free_balance_deposits',
] as const;

for (const table of dataTables) {
  schemaStatements.push(`alter table public.${table} enable row level security`);
  schemaStatements.push(`alter table public.${table} force row level security`);
  for (const action of ['select', 'insert', 'update', 'delete'] as const) {
    const check = action === 'insert' || action === 'update' ? ` with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid)` : '';
    const using = action === 'insert' ? '' : ` using (user_id = nullif(current_setting('app.user_id', true), '')::uuid)`;
    schemaStatements.push(`drop policy if exists ${table}_${action}_own on public.${table}`);
    schemaStatements.push(`create policy ${table}_${action}_own on public.${table} for ${action}${using}${check}`);
  }
}
