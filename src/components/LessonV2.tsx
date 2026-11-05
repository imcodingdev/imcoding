import type { ReactNode } from 'react'
import type { ConceptV2, QuizItem } from '@/lib/concepts/types'
import { Markdown } from './Markdown'

function Step({ number, title, minutes, children }: {
  number: number; title: string; minutes: number; children: ReactNode
}) {
  return (
    <section className="space-y-3" aria-labelledby={`step-${number}`}>
      <h2 id={`step-${number}`} className="font-display text-xl font-bold text-ink md:text-2xl">
        <span className="mr-2 font-mono text-base font-medium text-accent">0{number}.</span>
        {title} <span className="text-base font-normal text-ink-muted">· {minutes} phút</span>
      </h2>
      {children}
    </section>
  )
}

function Answer({ source }: { source: string }) {
  return (
    <details className="rounded-xl border border-line bg-surface-muted px-3">
      <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Đáp án</summary>
      <div className="pb-3"><Markdown source={source} /></div>
    </details>
  )
}

function Questions({ items }: { items: QuizItem[] }) {
  return items.map((item, index) => (
    <div key={index} className="space-y-2">
      <h3 className="font-semibold text-ink">{item.question}</h3>
      {item.body && <Markdown source={item.body} />}
      <Answer source={item.answer} />
    </div>
  ))
}

export function LessonV2({ concept }: { concept: ConceptV2 }) {
  return (
    <>
      {concept.recall.length > 0 && (
        <Step number={1} title="Nhắc lại" minutes={3}><Questions items={concept.recall} /></Step>
      )}
      <Step number={2} title="Đoán trước" minutes={2}>
        <Markdown source={concept.predict.scenario} />
        <Answer source={concept.predict.answer} />
      </Step>
      <Step number={3} title="Ví dụ mẫu" minutes={5}><Markdown source={concept.example} /></Step>
      <Step number={4} title="Tìm trong project của bạn" minutes={7}><Markdown source={concept.findInProject} /></Step>
      <Step number={5} title="Tự giải thích" minutes={4}><Questions items={concept.explain} /></Step>
      <Step number={6} title="Kiểm tra không dùng AI" minutes={5}>
        <p className="font-semibold text-accent">Làm phần này khi không dùng AI</p>
        <Questions items={[concept.check]} />
      </Step>
      <Step number={7} title="Lỗi suy luận hay gặp" minutes={3}>
        {concept.misconceptions.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-ink">{item.wrong}</h3>
            <Markdown source={item.correction} />
          </div>
        ))}
      </Step>
    </>
  )
}
