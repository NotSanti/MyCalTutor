-- Lesson generation status on each textbook section.

alter table public.source_sections
  add column generated_lesson_id text references public.lessons (id) on delete set null,
  add column lesson_status text not null default 'idle'
    check (
      lesson_status in ('idle', 'generating', 'ready', 'failed')
    ),
  add column lesson_error text,
  add column lesson_model text,
  add column lesson_generated_at timestamptz;
