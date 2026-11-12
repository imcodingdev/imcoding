import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quyền riêng tư – ImCoding' }

const CONTACT = 'hello@imcoding.dev'

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl space-y-6 px-4 py-8 text-base leading-relaxed sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Quyền riêng tư</h1>
      <p className="text-sm text-ink-muted">Cập nhật lần cuối: 2026-11-12</p>
      <p>ImCoding là nền tảng học giúp mọi người hiểu code AI viết.</p>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Dữ liệu chúng tôi lưu</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Khi bạn đăng nhập bằng GitHub: tên đăng nhập, email và ảnh đại diện.</li>
          <li>Supabase cũng giữ ID GitHub và tên hiển thị của bạn (tên đầy đủ nếu bạn đã đặt).</li>
          <li>
            Chúng tôi dùng một cookie cần thiết, chỉ để giữ bạn đăng nhập. Không có cookie theo dõi
            hay phân tích.
          </li>
          <li>Tiến độ học của bạn trên ImCoding.</li>
          <li>Điểm dừng học tiếp (bước đang học) lưu theo tài khoản khi đăng nhập, hoặc trên trình duyệt nếu chưa đăng nhập.</li>
          <li>Ở giai đoạn này, ImCoding không đọc kho mã (repo) của bạn.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Dùng để làm gì</h2>
        <p>
          Để bạn đăng nhập, xem lại tiến độ, học tiếp chỗ đang dở và giúp chúng tôi cải thiện bài học bằng số liệu ẩn danh dưới đây. Chúng tôi không bán dữ liệu và không chạy
          quảng cáo.
        </p>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Số liệu học ẩn danh</h2>
        <p>ImCoding lưu số liệu học trong Supabase của chính ImCoding, không dùng dịch vụ theo dõi bên thứ ba. Mục đích là biết bài và bước nào người học hay bỏ dở để sửa bài.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Các sự kiện: mở bài (lesson_open), đến bước học (step_reached), kiểm tra trắc nghiệm (quiz_done), mở đáp án kiểm tra không dùng AI (check_opened), đánh dấu đã hiểu (understood), tìm bài (practical_search) và bấm Hỏi AI ở Hỏi thực chiến (practical_ai).</li>
          <li>Mỗi sự kiện có mã ngẫu nhiên lưu trên trình duyệt và thời điểm; tùy sự kiện có mã bài, số bước hoặc số câu đúng/tổng số câu vừa chấm.</li>
          <li>Số liệu này không chứa tài khoản, email, nội dung câu hỏi, URL hay thông tin user agent. ImCoding không lưu IP trong bảng số liệu học. Mã ngẫu nhiên không gắn với tài khoản và không đổi khi đăng nhập.</li>
          <li>Tắt công tắc “Gửi số liệu học ẩn danh” tại <a href="/settings" className="text-accent underline">Cài đặt (/settings)</a> để ngừng gửi sự kiện mới trên trình duyệt này. Mặc định bật; khi trình duyệt bật Do Not Track hoặc Global Privacy Control thì tắt và không gửi.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Dữ liệu nằm ở đâu</h2>
        <p>Dữ liệu được lưu trên Supabase (khu vực Singapore). Trang web chạy trên Vercel.</p>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Hỏi AI</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Khi bạn dùng &quot;Hỏi AI&quot;, câu hỏi và nội dung bài học được gửi thẳng từ trình duyệt của
            bạn tới Google Gemini, bằng khoá (key) của chính bạn, theo điều khoản của Google.
          </li>
          <li>ImCoding không nhận khoá hoặc nội dung cuộc trò chuyện gửi trực tiếp tới Gemini. Riêng khi tìm bài tại /hoi, từ khoá tìm kiếm được gửi tới trang để tìm bài và nằm trong URL; nó không được đưa vào số liệu học.</li>
          <li>
            Ở gói miễn phí, Google có thể dùng dữ liệu để cải thiện sản phẩm của họ.
          </li>
          <li>
            Khoá chỉ nằm trong localStorage của trình duyệt này. Bạn có thể xoá nó bất cứ lúc nào ở
            trang Cài đặt (/settings).
          </li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Xoá dữ liệu</h2>
        <p>
          Muốn xoá dữ liệu của mình, hãy gửi email tới{' '}
          <a href={`mailto:${CONTACT}`} className="rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {CONTACT}
          </a>
          . Chúng tôi sẽ xoá trong vòng 30 ngày.
        </p>
      </section>
      <p className="text-sm text-ink-muted">Bên vận hành: ImCoding.</p>
    </main>
  )
}
