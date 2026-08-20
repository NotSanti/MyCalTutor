-- Course material uploads and page-level extracted text (no auth).

create table public.course_materials (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  name text not null,
  original_filename text not null,
  material_type text not null check (
    material_type in ('textbook', 'syllabus', 'notes', 'worksheet')
  ),
  storage_path text,
  page_count integer,
  status text not null check (
    status in ('uploading', 'extracting', 'ready', 'failed')
  ),
  error_message text,
  created_at timestamptz not null default now()
);

create table public.material_pages (
  id uuid primary key default gen_random_uuid(),
  material_id text not null references public.course_materials (id) on delete cascade,
  page_number integer not null,
  text text not null default '',
  created_at timestamptz not null default now(),
  unique (material_id, page_number)
);

create index material_pages_material_id_idx
  on public.material_pages (material_id, page_number);

alter table public.course_materials enable row level security;
alter table public.material_pages enable row level security;

create policy "anon_all" on public.course_materials for all using (true) with check (true);
create policy "anon_all" on public.material_pages for all using (true) with check (true);

grant all on table public.course_materials to anon, authenticated, service_role;
grant all on table public.material_pages to anon, authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('course-materials', 'course-materials', false, 157286400)
on conflict (id) do nothing;

create policy "anon_course_materials_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'course-materials');

create policy "anon_course_materials_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'course-materials');

create policy "anon_course_materials_update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'course-materials')
  with check (bucket_id = 'course-materials');

create policy "anon_course_materials_delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'course-materials');
