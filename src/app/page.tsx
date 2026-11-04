import Link from "next/link";
import { Logo } from "@/components/Logo";

const steps = [
  { title: "Đọc bài 10 phút", body: "Mỗi bài giải thích một khái niệm bằng lời đơn giản và một ví dụ ngắn." },
  { title: "Tìm trong code của bạn 10 phút", body: "Mở project của bạn và tìm chỗ khái niệm đó xuất hiện thật." },
  { title: "Tự kiểm tra 10 phút", body: "Trả lời vài câu hỏi để biết mình đã hiểu hay còn chỗ chưa chắc." },
];

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-20">
      <section className="flex flex-col items-start gap-5">
        <Logo decorative className="[&_svg]:h-12 [&_svg]:w-12" />
        <p className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
          Nền tảng học cho founder và người làm sản phẩm
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">ImCoding</h1>
        <p className="font-display text-xl font-semibold text-ink md:text-2xl">
          Hiểu code AI viết cho bạn, từ nền tảng
        </p>
        <p className="max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
          ImCoding là nền tảng giúp founder và người mới hiểu những gì AI đã viết trong project của chính mình. Lộ trình nền tảng hiện miễn phí.
          Mỗi ngày chỉ cần 30 phút, học từng khái niệm một.
        </p>
        <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
          <Link
            href="/concepts/client-server"
            className={`inline-flex min-h-[48px] items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-accent-fg hover:bg-accent-hover motion-safe:transition-colors ${focus}`}
          >
            Bắt đầu bài đầu tiên
          </Link>
          <Link
            href="/map"
            className={`inline-flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-surface px-6 text-base font-semibold text-ink hover:bg-surface-muted motion-safe:transition-colors ${focus}`}
          >
            Xem bản đồ kiến thức
          </Link>
        </div>
      </section>

      <section className="mt-14 md:mt-20" aria-labelledby="learn-heading">
        <h2 id="learn-heading" className="font-display text-2xl font-bold text-ink">
          30 phút mỗi ngày, chia làm 3 bước
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-testid="learn-step"
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted font-display text-base font-bold text-accent">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
