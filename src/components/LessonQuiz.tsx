'use client'

import { useId, useState } from 'react'
import type { MultipleChoiceQuestion } from '@/lib/concepts/types'
import { Markdown } from './Markdown'
import { track } from '@/lib/metrics'

const buttonClass = 'min-h-[44px] rounded-lg border border-line px-4 py-2 font-semibold text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50'

export function LessonQuiz({ items, conceptId }: { items: MultipleChoiceQuestion[]; conceptId: string }) {
  const id = useId()
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const score = items.filter((item, index) => checked[index] && selected[index] === item.correctIndex).length

  return (
    <div className="space-y-5">
      <p role="status" className="font-semibold text-ink">{score}/{items.length} câu đúng</p>
      {items.map((item, index) => (
        <fieldset key={index} className="min-w-0 space-y-3 rounded-xl border border-line bg-surface p-4">
          <legend className="px-1 font-semibold text-ink">{index + 1}. {item.question}</legend>
          {item.body && <Markdown source={item.body} />}
          <div className="space-y-2">
            {item.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2 text-ink focus-within:ring-2 focus-within:ring-accent">
                <input
                  type="radio"
                  name={`${id}-${index}`}
                  value={optionIndex}
                  checked={selected[index] === optionIndex}
                  disabled={!!checked[index]}
                  onChange={() => setSelected(previous => ({ ...previous, [index]: optionIndex }))}
                  className="mt-2 h-4 w-4 shrink-0 accent-accent"
                />
                <Markdown source={option} />
              </label>
            ))}
          </div>
          <button
            type="button"
            className={buttonClass}
            disabled={selected[index] === undefined || !!checked[index]}
            onClick={() => {
              setChecked(previous => ({ ...previous, [index]: true }))
              // Mỗi nút chấm một câu, không cộng lại những câu đã chấm trước đó.
              track({ event: 'quiz_done', concept_id: conceptId, score: Number(selected[index] === item.correctIndex), total: 1 })
            }}
          >Kiểm tra</button>
          <div role="status" aria-live="polite">
            {checked[index] && (
              <div className="space-y-2 rounded-lg border border-line bg-surface-muted p-3 text-ink">
                <p className="font-bold">{selected[index] === item.correctIndex ? 'Chính xác' : 'Chưa đúng'}</p>
                <p className="font-semibold">Giải thích:</p>
                <Markdown source={item.explanation} />
              </div>
            )}
          </div>
        </fieldset>
      ))}
      <button type="button" className={buttonClass} onClick={() => { setSelected({}); setChecked({}) }}>Làm lại</button>
    </div>
  )
}
