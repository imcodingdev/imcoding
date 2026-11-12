-- Chỉ bổ sung điểm dừng; giữ nguyên tất cả policy RLS hiện có.
alter table public.progress
  add column last_step smallint null check (last_step between 1 and 20),
  add column last_step_at timestamptz null;
