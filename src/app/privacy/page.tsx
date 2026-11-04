import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quyền riêng tư – ImCoding' }

const CONTACT = 'hello@imcoding.dev'

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl space-y-6 px-4 py-8 text-base leading-relaxed sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Quyền riêng tư</h1>
      <p className="text-sm text-ink-muted">Cập nhật lần cuối: 2026-11-03</p>
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
          <li>Ở giai đoạn này, ImCoding không đọc kho mã (repo) của bạn.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-semibold">Dùng để làm gì</h2>
        <p>
          Chỉ để bạn đăng nhập và xem lại tiến độ học. Chúng tôi không bán dữ liệu và không chạy
          quảng cáo.
        </p>
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
          <li>ImCoding không nhận và không lưu câu hỏi hay khoá của bạn.</li>
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
