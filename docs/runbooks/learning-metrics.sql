-- Chủ sản phẩm chạy thủ công bằng quyền admin. Không chạy bằng anon/authenticated.
-- Đếm trình duyệt, không phải người; xoá storage/đổi trình duyệt tạo mã khác.
-- Opt-out và hạn mức client làm số liệu không phản ánh mọi lượt học.

-- Số visitor theo tuần UTC trong 12 tuần gần đây.
select date_trunc('week', created_at at time zone 'UTC') as week_utc,
       count(distinct visitor) as visitors
from public.learning_events
where created_at >= now() - interval '12 weeks'
group by 1 order by 1;

-- Phễu bước theo bài trong 30 ngày: số trình duyệt mở bài và xem mỗi bước.
-- Có thể nhảy bước/học từ lần mở trước; không suy ra phiên hoặc đường đi bắt buộc.
with opened as (
  select concept_id, count(distinct visitor) as opened_visitors
  from public.learning_events
  where event = 'lesson_open' and created_at >= now() - interval '30 days'
  group by concept_id
), reached as (
  select concept_id, step, count(distinct visitor) as reached_visitors
  from public.learning_events
  where event = 'step_reached' and created_at >= now() - interval '30 days'
  group by concept_id, step
)
select r.concept_id, r.step, o.opened_visitors, r.reached_visitors,
       round(100.0 * r.reached_visitors / nullif(o.opened_visitors, 0), 1) as percent_of_opened
from reached r left join opened o using (concept_id)
order by r.concept_id, r.step;

-- Mỗi nút Kiểm tra chấm một câu: score=0/1, total=1; có tính các lần làm lại.
select concept_id, count(*) as checks, sum(score) as correct, sum(total) as attempted,
       round(100.0 * sum(score) / nullif(sum(total), 0), 1) as percent_correct
from public.learning_events
where event = 'quiz_done' and created_at >= now() - interval '30 days'
group by concept_id order by concept_id;
