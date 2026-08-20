-- Concepts for one textbook section, with source-page provenance.

alter table public.source_sections
  add column concepts_status text not null default 'idle'
    check (
      concepts_status in ('idle', 'extracting', 'ready', 'failed')
    ),
  add column concepts_error text,
  add column concepts_model text,
  add column concepts_extracted_at timestamptz;

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  name text not null,
  description text not null default '',
  importance integer not null check (importance between 1 and 5),
  difficulty integer not null check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.concept_sources (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts (id) on delete cascade,
  material_id text not null references public.course_materials (id) on delete cascade,
  source_section_id uuid not null references public.source_sections (id) on delete cascade,
  page_start integer not null,
  page_end integer not null,
  created_at timestamptz not null default now()
);

create index concepts_course_id_idx on public.concepts (course_id);
create index concept_sources_section_id_idx
  on public.concept_sources (source_section_id);

alter table public.concepts enable row level security;
alter table public.concept_sources enable row level security;

create policy "anon_all" on public.concepts for all using (true) with check (true);
create policy "anon_all" on public.concept_sources for all using (true) with check (true);

grant all on table public.concepts to anon, authenticated, service_role;
grant all on table public.concept_sources to anon, authenticated, service_role;
