create table if not exists public.game_wide_web_scans (
  place_id bigint primary key,
  universe_id bigint,
  game_name text not null,
  normalized_game_name text not null,
  score integer not null check (score between 0 and 100),
  matches jsonb not null default '[]'::jsonb,
  searched_sources jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_wide_web_scans_name_idx
  on public.game_wide_web_scans (normalized_game_name, fetched_at desc);

alter table public.game_wide_web_scans enable row level security;
