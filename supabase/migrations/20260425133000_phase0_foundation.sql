create extension if not exists pgcrypto;

create table if not exists public.app_users (
  auth0_subject text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_children (
  id uuid primary key default gen_random_uuid(),
  owner_subject text not null references public.app_users(auth0_subject) on delete cascade,
  roblox_user_id bigint not null,
  username text not null,
  display_name text not null,
  avatar_url text,
  saved_at timestamptz not null default now(),
  unique (owner_subject, roblox_user_id)
);

create table if not exists public.user_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_subject text references public.app_users(auth0_subject) on delete cascade,
  roblox_user_id bigint not null,
  username text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  assessment_mode text not null default 'preview',
  summary text not null,
  source_payload jsonb not null default '{}'::jsonb,
  assessed_at timestamptz not null default now()
);

create table if not exists public.friend_assessments (
  id uuid primary key default gen_random_uuid(),
  user_assessment_id uuid not null references public.user_assessments(id) on delete cascade,
  roblox_user_id bigint not null,
  username text not null,
  display_name text not null,
  score integer not null check (score between 0 and 100),
  factors jsonb not null default '[]'::jsonb,
  assessed_at timestamptz not null default now()
);

create table if not exists public.game_assessments (
  id uuid primary key default gen_random_uuid(),
  user_assessment_id uuid not null references public.user_assessments(id) on delete cascade,
  place_id bigint,
  universe_id bigint,
  name text not null,
  creator_name text,
  score integer not null check (score between 0 and 100),
  factors jsonb not null default '[]'::jsonb,
  assessed_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  owner_subject text not null references public.app_users(auth0_subject) on delete cascade,
  roblox_user_id bigint not null,
  report_format text not null default 'pdf',
  status text not null default 'pending',
  storage_path text,
  exported_at timestamptz not null default now()
);

create index if not exists saved_children_owner_subject_idx
  on public.saved_children (owner_subject, saved_at desc);

create index if not exists user_assessments_owner_subject_idx
  on public.user_assessments (owner_subject, assessed_at desc);

create index if not exists friend_assessments_user_assessment_idx
  on public.friend_assessments (user_assessment_id, score desc);

create index if not exists game_assessments_user_assessment_idx
  on public.game_assessments (user_assessment_id, score desc);

create index if not exists report_exports_owner_subject_idx
  on public.report_exports (owner_subject, exported_at desc);

alter table public.app_users enable row level security;
alter table public.saved_children enable row level security;
alter table public.user_assessments enable row level security;
alter table public.friend_assessments enable row level security;
alter table public.game_assessments enable row level security;
alter table public.report_exports enable row level security;

create policy "app users manage own row"
on public.app_users
for all
using ((auth.jwt() ->> 'sub') = auth0_subject)
with check ((auth.jwt() ->> 'sub') = auth0_subject);

create policy "saved children owner access"
on public.saved_children
for all
using ((auth.jwt() ->> 'sub') = owner_subject)
with check ((auth.jwt() ->> 'sub') = owner_subject);

create policy "user assessments owner access"
on public.user_assessments
for all
using ((auth.jwt() ->> 'sub') = owner_subject)
with check ((auth.jwt() ->> 'sub') = owner_subject);

create policy "friend assessments owner access"
on public.friend_assessments
for all
using (
  exists (
    select 1
    from public.user_assessments
    where public.user_assessments.id = public.friend_assessments.user_assessment_id
      and (auth.jwt() ->> 'sub') = public.user_assessments.owner_subject
  )
)
with check (
  exists (
    select 1
    from public.user_assessments
    where public.user_assessments.id = public.friend_assessments.user_assessment_id
      and (auth.jwt() ->> 'sub') = public.user_assessments.owner_subject
  )
);

create policy "game assessments owner access"
on public.game_assessments
for all
using (
  exists (
    select 1
    from public.user_assessments
    where public.user_assessments.id = public.game_assessments.user_assessment_id
      and (auth.jwt() ->> 'sub') = public.user_assessments.owner_subject
  )
)
with check (
  exists (
    select 1
    from public.user_assessments
    where public.user_assessments.id = public.game_assessments.user_assessment_id
      and (auth.jwt() ->> 'sub') = public.user_assessments.owner_subject
  )
);

create policy "report exports owner access"
on public.report_exports
for all
using ((auth.jwt() ->> 'sub') = owner_subject)
with check ((auth.jwt() ->> 'sub') = owner_subject);
