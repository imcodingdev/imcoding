-- Chỉ chạy trên DB local: npx supabase test db.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_table('public', 'learning_events', 'Có bảng số liệu học');
select ok((select relrowsecurity from pg_class where oid = 'public.learning_events'::regclass), 'RLS được bật');

set local role anon;
select lives_ok($$ insert into public.learning_events (visitor, event, concept_id, step)
  values ('visitor_1234567890', 'step_reached', 'client-server', 2) $$, 'anon chèn hợp lệ');
select lives_ok($$ insert into public.learning_events (visitor, event, score, total)
  values ('visitor_1234567890', 'quiz_done', 1, 1) $$, 'Điểm trắc nghiệm hợp lệ');
select throws_ok($$ select * from public.learning_events $$, '42501', null, 'anon không đọc');
select throws_ok($$ update public.learning_events set step = 3 $$, '42501', null, 'anon không sửa');
select throws_ok($$ delete from public.learning_events $$, '42501', null, 'anon không xoá');
select throws_ok($$ insert into public.learning_events (visitor, event, created_at)
  values ('visitor_1234567890', 'lesson_open', '2000-01-01') $$, '42501', null, 'anon không đặt created_at');
select throws_ok($$ insert into public.learning_events (visitor, event)
  values ('visitor_1234567890', 'unknown') $$, '42501', null, 'Chặn sự kiện lạ');
select throws_ok($$ insert into public.learning_events (visitor, event, concept_id)
  values ('visitor_1234567890', 'lesson_open', 'bad/ID') $$, '42501', null, 'Chặn concept_id sai mẫu');
select throws_ok($$ insert into public.learning_events (visitor, event)
  values ('short', 'lesson_open') $$, '42501', null, 'Chặn visitor quá ngắn');
select throws_ok($$ insert into public.learning_events (visitor, event)
  values ('visitor/1234567890', 'lesson_open') $$, '42501', null, 'Chặn visitor sai ký tự');
select throws_ok($$ insert into public.learning_events (visitor, event, step)
  values ('visitor_1234567890', 'step_reached', 21) $$, '42501', null, 'Chặn bước ngoài giới hạn');
select throws_ok($$ insert into public.learning_events (visitor, event, score, total)
  values ('visitor_1234567890', 'quiz_done', 2, 1) $$, '42501', null, 'Điểm không vượt tổng');
select throws_ok($$ insert into public.learning_events (visitor, event, score, total)
  values ('visitor_1234567890', 'quiz_done', -1, 1) $$, '42501', null, 'Điểm không âm');
select throws_ok($$ insert into public.learning_events (visitor, event, score, total)
  values ('visitor_1234567890', 'quiz_done', 1, 21) $$, '42501', null, 'Tổng không vượt 20');
select throws_ok($$ insert into public.learning_events (visitor, event, score)
  values ('visitor_1234567890', 'quiz_done', 1) $$, '42501', null, 'Điểm cần có tổng');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select lives_ok($$ insert into public.learning_events (visitor, event)
  values ('visitor_1234567890', 'practical_search') $$, 'authenticated chèn hợp lệ không cần user_id');
select throws_ok($$ select * from public.learning_events $$, '42501', null, 'authenticated không đọc');
select throws_ok($$ update public.learning_events set step = 3 $$, '42501', null, 'authenticated không sửa');
select throws_ok($$ delete from public.learning_events $$, '42501', null, 'authenticated không xoá');
select throws_ok($$ insert into public.learning_events (visitor, event, created_at)
  values ('visitor_1234567890', 'lesson_open', now()) $$, '42501', null, 'authenticated không đặt created_at kể cả now()');
select throws_ok($$ insert into public.learning_events (visitor, event)
  values ('visitor_1234567890', 'unknown') $$, '42501', null, 'authenticated không chèn sự kiện lạ');
select throws_ok($$ insert into public.learning_events (visitor, event, concept_id)
  values ('visitor_1234567890', 'lesson_open', 'bad/ID') $$, '42501', null, 'authenticated không chèn concept sai');

reset role;
select is((select count(*) from public.learning_events where visitor = 'visitor_1234567890'), 3::bigint, 'Admin đọc được ba lần chèn hợp lệ');
select ok((select bool_and(created_at = now()) from public.learning_events where visitor = 'visitor_1234567890'), 'Thời điểm do DB đặt');
select * from finish();
rollback;
