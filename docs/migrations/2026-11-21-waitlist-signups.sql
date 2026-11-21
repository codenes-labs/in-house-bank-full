create table if not exists public.waitlist_signups (
  id uuid primary key,
  name text not null,
  email text not null,
  interest text not null,
  message text,
  consent_given boolean not null default false,
  source text not null default 'direct',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_lower_key
  on public.waitlist_signups (lower(email));

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);