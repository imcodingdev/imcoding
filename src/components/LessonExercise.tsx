'use client'

import { useState } from 'react'
import type { LessonExercise as Exercise } from '@/lib/concepts/types'
import { Markdown } from './Markdown'

export function LessonExercise({ exercise }: { exercise: Exercise }) {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4 text-ink">
      <Markdown source={exercise.goal} />
      <h3 className="font-semibold">Việc cần làm</h3>
      <ol className="space-y-2">
        {exercise.steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2">
            <label className="flex min-h-[44px] w-full cursor-pointer items-start gap-3 rounded-lg bg-surface-muted px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
              <input
                type="checkbox"
                checked={!!completed[index]}
                onChange={event => setCompleted(previous => ({ ...previous, [index]: event.target.checked }))}
                className="mt-2 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="pt-0.5 font-mono" aria-hidden="true">{index + 1}.</span>
              <Markdown source={step} />
            </label>
          </li>
        ))}
      </ol>
      <h3 className="font-semibold">Kết quả đúng</h3>
      <Markdown source={exercise.expectedResult} />
      {exercise.reviewPrompt && <>
        <h3 className="font-semibold">Nhờ AI rà lại</h3>
        <Markdown source={exercise.reviewPrompt} />
      </>}
    </div>
  )
}
