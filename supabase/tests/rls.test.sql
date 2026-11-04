-- pgTAP: schema, trigger tạo profiles và RLS cho profiles/progress.
-- Chạy: npm run db:test  (= supabase test db)
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

select has_table('public', 'profiles', 'có bảng public.profiles');
select has_table('public', 'progress', 'có bảng public.progress');

-- Hai user giả (chèn trực tiếp vào auth.users như GoTrue làm khi đăng ký).
insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'b@test.local');

-- 1. Tạo user thì tự có profiles với plan = 'free'.
select results_eq(
  $$ select id, plan from public.profiles order by id $$,
  $$ values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'free'::text),
            ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'free'::text) $$,
  'trigger on_auth_user_created tạo profiles plan=free cho mỗi user mới'
);

-- Dữ liệu progress có sẵn (role postgres, bỏ qua RLS).
insert into public.progress (user_id, concept_id, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'concept-a', 'seen'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'concept-b', 'seen');

-- ===== Đóng vai user A =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

-- 2. A chỉ đọc được progress của chính A.
select is((select count(*) from public.progress), 1::bigint, 'A chỉ thấy 1 dòng progress');
select is(
  (select count(*) from public.progress where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0::bigint, 'A không thấy dòng progress của B'
);
select is((select count(*) from public.profiles), 1::bigint, 'A chỉ thấy profiles của chính A');

-- 3. A insert progress với user_id = B → vi phạm RLS.
select throws_ok(
  $$ insert into public.progress (user_id, concept_id, status)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'hack', 'understood') $$,
  '42501', null, 'A không thể insert progress cho B'
);

-- A ghi được tiến độ của chính mình (user_id mặc định = auth.uid()).
select lives_ok(
  $$ insert into public.progress (concept_id, status) values ('concept-a2', 'seen') $$,
  'A insert progress của chính mình, user_id mặc định auth.uid()'
);
-- Đúng kiểu upsert app dùng (onConflict: user_id,concept_id).
select lives_ok(
  $$ insert into public.progress (user_id, concept_id, status, understood_at, updated_at)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'concept-a', 'understood', now(), now())
     on conflict (user_id, concept_id) do update
       set status = excluded.status,
           understood_at = excluded.understood_at,
           updated_at = excluded.updated_at $$,
  'A upsert progress của chính mình'
);
select is(
  (select user_id from public.progress where concept_id = 'concept-a2'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'user_id mặc định là auth.uid()'
);

-- A không sửa/xoá được progress của B.
select is_empty(
  $$ update public.progress set status = 'understood'
     where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' returning concept_id $$,
  'A update progress của B: 0 dòng'
);
select is_empty(
  $$ delete from public.progress
     where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' returning concept_id $$,
  'A delete progress của B: 0 dòng'
);
-- A không đổi user_id dòng của mình sang B được.
select throws_ok(
  $$ update public.progress set user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
     where concept_id = 'concept-a2' $$,
  '42501', null, 'A không thể chuyển dòng progress sang B'
);

-- 4. A tự nâng plan → không dòng nào thay đổi.
select is_empty(
  $$ update public.profiles set plan = 'pro'
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id $$,
  'A update profiles set plan=pro: 0 dòng thay đổi'
);

-- 5. A insert vào profiles → bị từ chối.
select throws_ok(
  $$ insert into public.profiles (id, plan) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pro') $$,
  '42501', null, 'A không thể insert profiles'
);

-- 7. status ngoài ('seen','understood') → vi phạm check.
select throws_ok(
  $$ insert into public.progress (concept_id, status) values ('concept-x', 'done') $$,
  '23514', null, 'status = done vi phạm check constraint'
);

-- ===== Kiểm tra lại bằng role postgres =====
reset role;
select is(
  (select plan from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'free', 'plan của A vẫn là free'
);
select results_eq(
  $$ select user_id, concept_id, status from public.progress
     where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  $$ values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'concept-b'::text, 'seen'::text) $$,
  'progress của B không bị A thay đổi'
);
select is(
  (select status from public.progress
   where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and concept_id = 'concept-a'),
  'understood', 'upsert của A đã cập nhật dòng của A'
);

-- ===== Đóng vai anon =====
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

-- 6. anon select progress → 0 dòng.
select is((select count(*) from public.progress), 0::bigint, 'anon không thấy progress');
select is((select count(*) from public.profiles), 0::bigint, 'anon không thấy profiles');
select throws_ok(
  $$ insert into public.progress (user_id, concept_id, status)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'anon', 'seen') $$,
  '42501', null, 'anon không thể insert progress'
);

reset role;
select * from finish();
rollback;
