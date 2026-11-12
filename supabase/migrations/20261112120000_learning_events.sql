-- Số liệu học bên thứ nhất: không liên kết tài khoản hoặc nội dung câu hỏi.
create table public.learning_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor text not null check (visitor ~ '^[A-Za-z0-9_-]{16,64}$'),
  event text not null check (event in ('lesson_open', 'step_reached', 'quiz_done', 'check_opened', 'understood', 'practical_search', 'practical_ai')),
  concept_id text null check (concept_id ~ '^[a-z0-9-]{1,64}$'),
  step smallint null check (step between 1 and 20),
  score smallint null check (score between 0 and 20),
  total smallint null check (total between 0 and 20),
  check ((score is null and total is null) or (score is not null and total is not null and score <= total))
);

alter table public.learning_events enable row level security;

-- Thu hồi cả quyền mặc định của Supabase; chỉ cho chèn các cột cho phép.
-- Không cấp INSERT(created_at/id), UPDATE, DELETE hoặc SELECT cho client.
revoke all on public.learning_events from public, anon, authenticated;
revoke all on sequence public.learning_events_id_seq from public, anon, authenticated;
grant insert (visitor, event, concept_id, step, score, total) on public.learning_events to anon, authenticated;
grant usage on sequence public.learning_events_id_seq to anon, authenticated;

create policy learning_events_insert on public.learning_events
  for insert to anon, authenticated
  with check (
    visitor is not null and visitor ~ '^[A-Za-z0-9_-]{16,64}$'
    and event is not null and event in ('lesson_open', 'step_reached', 'quiz_done', 'check_opened', 'understood', 'practical_search', 'practical_ai')
    and (concept_id is null or concept_id ~ '^[a-z0-9-]{1,64}$')
    and (step is null or step between 1 and 20)
    and ((score is null and total is null) or
      (score is not null and total is not null and score between 0 and 20 and total between 0 and 20 and score <= total))
  );

create index learning_events_created_at_idx on public.learning_events (created_at);
