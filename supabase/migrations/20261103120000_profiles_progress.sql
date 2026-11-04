-- M2: profiles (gói dịch vụ) và progress (tiến độ học) kèm RLS.
-- Nguyên tắc: người dùng chỉ đọc/ghi tiến độ của chính mình; không bao giờ tự đổi plan.

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chỉ có SELECT. Không có policy INSERT/UPDATE/DELETE nên mọi ghi từ
-- anon/authenticated đều bị RLS chặn (dòng được tạo bởi trigger bên dưới).
create policy "profiles: đọc của chính mình"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- ===== progress =====
create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  concept_id text not null,
  status text not null check (status in ('seen', 'understood')),
  understood_at timestamptz,
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table public.progress enable row level security;

create policy "progress: đọc của chính mình"
  on public.progress for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "progress: thêm của chính mình"
  on public.progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "progress: sửa của chính mình"
  on public.progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "progress: xoá của chính mình"
  on public.progress for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ===== trigger: tạo profiles khi có user mới =====
-- security definer + search_path rỗng + tên đầy đủ để không thể bị chiếm qua search_path.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Không ai cần gọi trực tiếp hàm này (trigger vẫn chạy được).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
