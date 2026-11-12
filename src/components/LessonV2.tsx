import type { ReactNode } from 'react'
import type { ConceptV2, QuizItem } from '@/lib/concepts/types'
import { Markdown } from './Markdown'
import { LessonQuiz } from './LessonQuiz'
import { LessonExercise } from './LessonExercise'
import { LessonSteps } from './LessonSteps'

function Step({ number, title, minutes, children }: {
  number: number; title: string; minutes: number; children: ReactNode
}) {
  return (
    <section id={`buoc-${number}`} className="scroll-mt-24 space-y-3" aria-labelledby={`step-${number}`}>
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
  let step = 0
  return (
    <LessonSteps key={concept.id} conceptId={concept.id}>
      {concept.recall.length > 0 && (
        <Step number={++step} title="Nhắc lại" minutes={3}><Questions items={concept.recall} /></Step>
      )}
      <Step number={++step} title="Đoán trước" minutes={2}>
        <Markdown source={concept.predict.scenario} />
        <Answer source={concept.predict.answer} />
      </Step>
      <Step number={++step} title="Ví dụ mẫu" minutes={5}><Markdown source={concept.example} /></Step>
      <Step number={++step} title="Tìm trong project của bạn" minutes={7}><Markdown source={concept.findInProject} /></Step>
      <Step number={++step} title="Tự giải thích" minutes={4}><Questions items={concept.explain} /></Step>
      {concept.quiz && <Step number={++step} title="Trắc nghiệm" minutes={3}><LessonQuiz key={concept.id} items={concept.quiz} /></Step>}
      <Step number={++step} title="Kiểm tra không dùng AI" minutes={5}>
        <p className="font-semibold text-accent">Làm phần này khi không dùng AI</p>
        <Questions items={[concept.check]} />
      </Step>
      <Step number={++step} title="Lỗi suy luận hay gặp" minutes={3}>
        {concept.misconceptions.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-ink">{item.wrong}</h3>
            <Markdown source={item.correction} />
          </div>
        ))}
      </Step>
      {concept.exercise && <Step number={++step} title="Bài tập thực hành" minutes={15}><LessonExercise key={concept.id} exercise={concept.exercise} /></Step>}
    </LessonSteps>
  )
}
