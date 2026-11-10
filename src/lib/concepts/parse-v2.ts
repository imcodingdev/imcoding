import { ConceptError, type ConceptV2, type QuizItem, type MultipleChoiceQuestion, type LessonExercise } from './types'

const HEADINGS = ['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp']

/** Chỉ nhận heading ngoài fenced/indented code. Fence đóng phải cùng loại và đủ dài. */
function scan(markdown: string) {
  const headings: { level: number; title: string; start: number; end: number }[] = []
  let fence: string | undefined
  let offset = 0
  let codeBlocks = 0
  const prose: string[] = []
  const lines: { text: string; start: number; end: number }[] = []
  const blocks: { start: number; end: number; contentStart: number; contentEnd: number }[] = []
  for (const line of markdown.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = undefined
        blocks[blocks.length - 1].end = offset + line.length
        blocks[blocks.length - 1].contentEnd = offset
      }
    } else if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
      fence = marker[1]
      codeBlocks++
      blocks.push({ start: offset, end: markdown.length, contentStart: offset + line.length + 1, contentEnd: markdown.length })
    } else if (!/^( {4}|\t)/.test(line)) {
      const h = /^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/.exec(line)
      if (h) headings.push({ level: h[1].length, title: (h[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim(), start: offset, end: offset + line.length + 1 })
      else {
        prose.push(line)
        lines.push({ text: line, start: offset, end: offset + line.length + 1 })
      }
    }
    offset += line.length + 1
  }
  return { headings, codeBlocks, prose: prose.join('\n').trim(), lines, blocks, unclosed: !!fence }
}

type V2Content = Pick<ConceptV2, 'recall' | 'predict' | 'example' | 'findInProject' | 'explain' | 'check' | 'misconceptions' | 'quiz' | 'exercise'>

export function parseV2(fileName: string, body: string, hasPrerequisites: boolean): V2Content {
  const fail = (section: string, reason: string): never => {
    throw new ConceptError(`${fileName}: mục "${section}" ${reason}`)
  }
  const h2 = scan(body).headings.filter(h => h.level === 2)
  const expected = [...(hasPrerequisites ? HEADINGS : HEADINGS.slice(1))]
  if (h2.some(h => h.title === 'Trắc nghiệm')) expected.splice(expected.indexOf('Kiểm tra không dùng AI'), 0, 'Trắc nghiệm')
  if (h2.some(h => h.title === 'Bài tập thực hành')) expected.push('Bài tập thực hành')
  if (!hasPrerequisites && h2.some(h => h.title === HEADINGS[0])) fail(HEADINGS[0], 'không được có khi prerequisites rỗng')
  expected.forEach((title, i) => {
    if (h2[i]?.title !== title) fail(title, h2.some(h => h.title === title) ? 'sai thứ tự H2' : 'bị thiếu')
  })
  if (h2.length !== expected.length) fail('H2', 'có mục thừa hoặc trùng')
  if (body.slice(0, h2[0].start).trim()) fail('H2', 'có nội dung trước mục đầu tiên')
  const sections = new Map(h2.map((h, i) => [h.title, body.slice(h.end, h2[i + 1]?.start).trim()]))
  for (const [title, content] of sections) if (!content) fail(title, 'đang rỗng')
  const get = (title: string) => sections.get(title) ?? ''

  const qa = (title: string, min: number, max: number): QuizItem[] => {
    const content = get(title)
    const hs = scan(content).headings
    if (hs.length < min || hs.length > max || hs.some(h => h.level !== 3)) fail(title, `cần ${min}-${max} câu hỏi (###)`)
    if (content.slice(0, hs[0].start).trim()) fail(title, 'có nội dung trước câu hỏi')
    return hs.map((h, i) => {
      const answer = content.slice(h.end, hs[i + 1]?.start).trim()
      if (!h.title || !answer) fail(title, 'có câu hỏi hoặc đáp án rỗng')
      return { question: h.title, answer }
    })
  }

  const predictText = get(HEADINGS[1])
  const predictHeadings = scan(predictText).headings
  if (predictHeadings.length !== 1 || predictHeadings[0].level !== 3 || predictHeadings[0].title !== 'Đáp án') fail(HEADINGS[1], 'cần đúng một ### Đáp án')
  const scenario = predictText.slice(0, predictHeadings[0].start).trim()
  const answer = predictText.slice(predictHeadings[0].end).trim()
  if (!scenario.endsWith('?') || !answer) fail(HEADINGS[1], 'cần tình huống kết thúc bằng câu hỏi và đáp án không rỗng')

  const example = get(HEADINGS[2])
  const exampleScan = scan(example)
  if (!exampleScan.prose || exampleScan.codeBlocks < 1 || exampleScan.codeBlocks > 2 || exampleScan.headings.length) fail(HEADINGS[2], 'cần giải thích và 1–2 đoạn code mẫu')
  if ((example.match(/___/g) ?? []).length > 1) fail(HEADINGS[2], 'chỉ được có tối đa một chỗ trống ___')
  const findInProject = get(HEADINGS[3])
  if (!/^ {0,3}\d+[.)]\s+\S/m.test(scan(findInProject).prose)) fail(HEADINGS[3], 'cần danh sách có thứ tự')

  const checkText = get(HEADINGS[5])
  const ch = scan(checkText).headings
  if (ch.length !== 2 || ch[0].level !== 3 || ch[1].level !== 4 || ch[1].title !== 'Đáp án') fail(HEADINGS[5], 'cần đúng một ### tình huống và #### Đáp án')
  if (checkText.slice(0, ch[0].start).trim()) fail(HEADINGS[5], 'có nội dung trước câu hỏi')
  const check = {
    question: ch[0].title,
    body: checkText.slice(ch[0].end, ch[1].start).trim(),
    answer: checkText.slice(ch[1].end).trim(),
  }
  if (!check.question || !check.answer) fail(HEADINGS[5], 'có câu hỏi hoặc đáp án rỗng')

  let quiz: MultipleChoiceQuestion[] | undefined
  if (sections.has('Trắc nghiệm')) {
    const title = 'Trắc nghiệm'
    const content = get(title)
    const hs = scan(content).headings
    if (hs.length < 3 || hs.length > 5 || hs.some(h => h.level !== 3 || !h.title)) fail(title, 'cần 3–5 câu hỏi ### không rỗng')
    if (content.slice(0, hs[0].start).trim()) fail(title, 'có nội dung trước câu hỏi')
    quiz = hs.map((h, i) => {
      const text = content.slice(h.end, hs[i + 1]?.start).trim()
      const parsed = scan(text)
      const explanations = parsed.lines.filter(l => /^\*\*Giải thích:\*\*/.test(l.text))
      if (explanations.length !== 1) fail(title, 'cần đúng một **Giải thích:**')
      const explanationLine = explanations[0]
      const explanation = text.slice(explanationLine.start + '**Giải thích:**'.length).trim()
      if (!explanation) fail(title, 'có giải thích rỗng')
      const options = parsed.lines.filter(l => /^ {0,3}- \[[ x]\](?:\s|$)/.test(l.text))
      if (options.length < 3 || options.length > 4 || options.some(l => l.start >= explanationLine.start)) fail(title, 'cần 3–4 phương án trước giải thích')
      const values = options.map(l => l.text.replace(/^ {0,3}- \[[ x]\]\s*/, '').trim())
      if (values.some(v => !v)) fail(title, 'có phương án rỗng')
      // Không bỏ sót phương án sai cú pháp hoặc nội dung chen giữa danh sách.
      const beforeExplanation = text.slice(options[0].start, explanationLine.start).trim()
      if (beforeExplanation !== options.map(l => l.text).join('\n').trim()) fail(title, 'phương án phải liên tiếp, mỗi phương án một dòng')
      const questionBody = text.slice(0, options[0].start).trim()
      if (scan(questionBody).lines.some(l => /^ {0,3}- \[/.test(l.text))) fail(title, 'dấu chọn phương án không hợp lệ')
      const correct = options.flatMap((l, index) => /^ {0,3}- \[x\]/.test(l.text) ? [index] : [])
      if (correct.length !== 1) fail(title, 'cần đúng một phương án [x]')
      if (parsed.unclosed) fail(title, 'code block chưa đóng')
      return { question: h.title, body: questionBody, options: values, correctIndex: correct[0], explanation }
    })
    if (new Set(quiz.map(q => q.correctIndex)).size === 1) fail(title, 'vị trí đáp án đúng không được trùng hết')
  }

  let exercise: LessonExercise | undefined
  if (sections.has('Bài tập thực hành')) {
    const title = 'Bài tập thực hành'
    const content = get(title)
    const hs = scan(content).headings
    const names = ['Việc cần làm', 'Kết quả đúng', 'Nhờ AI rà lại']
    if (hs.length < 2 || hs.length > 3 || hs.some((h, i) => h.level !== 3 || h.title !== names[i])) fail(title, 'cần ### Việc cần làm, ### Kết quả đúng, rồi tùy chọn ### Nhờ AI rà lại')
    const goal = content.slice(0, hs[0].start).trim()
    if (!scan(goal).prose) fail(title, 'thiếu mục tiêu')
    const stepText = content.slice(hs[0].end, hs[1].start).trim()
    const starts = scan(stepText).lines.filter(l => /^ {0,3}\d+[.)]\s+\S/.test(l.text))
    if (starts.length < 3 || starts.length > 6 || stepText.slice(0, starts[0]?.start).trim()) fail(title, 'cần danh sách có thứ tự 3–6 bước')
    const steps = starts.map((l, i) => stepText.slice(l.start, starts[i + 1]?.start).replace(/^ {0,3}\d+[.)]\s+/, '').trim())
    const expectedResult = content.slice(hs[1].end, hs[2]?.start).trim()
    if (!expectedResult) fail(title, 'Kết quả đúng đang rỗng')
    let reviewPrompt: string | undefined
    if (hs[2]) {
      reviewPrompt = content.slice(hs[2].end).trim()
      const parsed = scan(reviewPrompt)
      if (parsed.codeBlocks !== 1 || parsed.unclosed || parsed.prose) fail(title, 'Nhờ AI rà lại cần đúng một code block đã đóng')
      const block = parsed.blocks[0]
      if (!reviewPrompt.slice(block.contentStart, block.contentEnd).trim()) fail(title, 'prompt AI đang rỗng')
    }
    exercise = { goal, steps, expectedResult, reviewPrompt }
  }

  return {
    recall: hasPrerequisites ? qa(HEADINGS[0], 1, 2) : [],
    predict: { scenario, answer }, example, findInProject,
    explain: qa(HEADINGS[4], 2, 3), check,
    misconceptions: qa(HEADINGS[6], 2, 4).map(q => ({ wrong: q.question, correction: q.answer })),
    ...(quiz ? { quiz } : {}),
    ...(exercise ? { exercise } : {}),
  }
}
