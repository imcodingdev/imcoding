import { Children, isValidElement, type ReactElement } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

const components: Components = {
  pre({ children }) {
    const child = Children.toArray(children)[0]
    if (isValidElement(child)) {
      const props = (child as ReactElement<{ className?: string; children?: unknown }>).props
      const language = /language-([\w-]+)/.exec(props.className ?? '')?.[1] ?? ''
      const code = String(props.children ?? '').replace(/\n$/, '')
      return <CodeBlock language={language} code={code} />
    }
    return <pre>{children}</pre>
  },
}

const INLINE_CODE =
  '[&_p>code]:rounded [&_p>code]:bg-surface-muted [&_p>code]:px-1 [&_p>code]:font-mono [&_p>code]:text-[0.9em] [&_li>code]:rounded [&_li>code]:bg-surface-muted [&_li>code]:px-1 [&_li>code]:font-mono [&_li>code]:text-[0.9em]'

export function Markdown({ source }: { source: string }) {
  return (
    <div
      className={`min-w-0 space-y-3 break-words text-base leading-7 md:text-[17px] md:leading-8 [&_a]:text-accent [&_a]:underline [&_h3]:mt-4 [&_h3]:font-display [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc ${INLINE_CODE}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
