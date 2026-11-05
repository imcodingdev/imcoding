import Link from "next/link";
import { Logo } from "@/components/Logo";
import { STAGES } from "@/lib/concepts/stages";

const steps = [
  { title: "Nhắc lại, đoán trước, xem ví dụ", minutes: 10, body: "Nhớ lại bài trước, tự đoán cách xử lý một sự cố ngắn, rồi xem ví dụ code có chú thích." },
  { title: "Tìm trong code của bạn", minutes: 7, body: "Mở project của chính bạn và tìm chỗ khái niệm đó xuất hiện thật." },
  { title: "Tự giải thích", minutes: 4, body: "Trả lời câu hỏi “vì sao” bằng lời của mình. Đáp án mẫu chỉ mở khi bạn đã nghĩ xong." },
  { title: "Kiểm tra không dùng AI", minutes: 9, body: "Giải một tình huống mới mà không hỏi AI, rồi xem những lỗi suy luận hay gặp." },
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
          Mỗi bài 30 phút, học bằng cách tự làm
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-testid="learn-step"
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted font-display text-base font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-ink-muted">{s.minutes} phút</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 md:mt-20" aria-labelledby="stages-heading">
        <h2 id="stages-heading" className="font-display text-2xl font-bold text-ink">
          Lộ trình chia 4 chặng theo rủi ro thật
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Mỗi chặng là những gì nên hiểu trước khi làm một việc có rủi ro với app của bạn. Đây là khuyến nghị, bạn vẫn học theo thứ tự mình muốn.
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {STAGES.map((stage) => (
            <li key={stage.id} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display text-lg font-bold text-ink">
                Chặng {stage.id} · {stage.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">{stage.description}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/map"
          className={`mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-surface px-6 text-base font-semibold text-ink hover:bg-surface-muted motion-safe:transition-colors ${focus}`}
        >
          Xem lộ trình
        </Link>
      </section>
    </main>
  );
}
