-- Curriculum, attempts, and personal learner state (no auth).

create table public.courses (
  id text primary key,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table public.skills (
  id text primary key,
  unit_id text not null references public.units (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null,
  starts_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id text primary key,
  skill_id text not null references public.skills (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 1,
  estimated_minutes integer not null default 10,
  xp_reward integer not null default 0,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id text primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  type text not null,
  prompt text not null,
  content jsonb not null default '{}'::jsonb,
  correct_answer text,
  explanation text not null default '',
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities (id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table public.skill_progress (
  skill_id text primary key references public.skills (id) on delete cascade,
  completed boolean not null default false,
  mastery integer not null default 0,
  last_practiced_at timestamptz
);

create table public.learner_state (
  id integer primary key check (id = 1),
  xp integer not null default 0,
  streak_days integer not null default 0,
  last_practiced_on date,
  in_progress_lesson_id text references public.lessons (id) on delete set null,
  in_progress_block_index integer,
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.skills enable row level security;
alter table public.lessons enable row level security;
alter table public.activities enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.skill_progress enable row level security;
alter table public.learner_state enable row level security;

create policy "anon_all" on public.courses for all using (true) with check (true);
create policy "anon_all" on public.units for all using (true) with check (true);
create policy "anon_all" on public.skills for all using (true) with check (true);
create policy "anon_all" on public.lessons for all using (true) with check (true);
create policy "anon_all" on public.activities for all using (true) with check (true);
create policy "anon_all" on public.activity_attempts for all using (true) with check (true);
create policy "anon_all" on public.skill_progress for all using (true) with check (true);
create policy "anon_all" on public.learner_state for all using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
