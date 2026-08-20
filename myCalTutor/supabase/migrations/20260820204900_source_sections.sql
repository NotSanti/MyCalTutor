-- Detected textbook hierarchy and structure-analysis status.

alter table public.course_materials
  add column structure_status text not null default 'idle'
    check (
      structure_status in ('idle', 'analyzing', 'draft', 'approved', 'failed')
    ),
  add column structure_error text,
  add column structure_model text,
  add column structure_analyzed_at timestamptz;

create table public.source_sections (
  id uuid primary key default gen_random_uuid(),
  material_id text not null references public.course_materials (id) on delete cascade,
  parent_section_id uuid references public.source_sections (id) on delete cascade,
  title text not null,
  section_number text not null default '',
  section_type text not null check (section_type in ('chapter', 'section')),
  start_page integer,
  end_page integer,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create index source_sections_material_id_idx
  on public.source_sections (material_id, sort_order);

alter table public.source_sections enable row level security;

create policy "anon_all" on public.source_sections for all using (true) with check (true);

grant all on table public.source_sections to anon, authenticated, service_role;
