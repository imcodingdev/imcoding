import { ConceptError, type ConceptV2, type QuizItem } from './types'

const HEADINGS = ['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp']

/** Chỉ nhận heading ngoài fenced/indented code. Fence đóng phải cùng loại và đủ dài. */
function scan(markdown: string) {
  const headings: { level: number; title: string; start: number; end: number }[] = []
  let fence: string | undefined
  let offset = 0
  let codeBlocks = 0
  const prose: string[] = []
  for (const line of markdown.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined
    } else if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
      fence = marker[1]
      codeBlocks++
    } else if (!/^( {4}|\t)/.test(line)) {
      const h = /^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/.exec(line)
      if (h) headings.push({ level: h[1].length, title: (h[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim(), start: offset, end: offset + line.length + 1 })
      else prose.push(line)
    }
    offset += line.length + 1
  }
  return { headings, codeBlocks, prose: prose.join('\n').trim() }
}

type V2Content = Pick<ConceptV2, 'recall' | 'predict' | 'example' | 'findInProject' | 'explain' | 'check' | 'misconceptions'>

export function parseV2(fileName: string, body: string, hasPrerequisites: boolean): V2Content {
  const fail = (section: string, reason: string): never => {
    throw new ConceptError(`${fileName}: mục "${section}" ${reason}`)
  }
  const h2 = scan(body).headings.filter(h => h.level === 2)
  const expected = hasPrerequisites ? HEADINGS : HEADINGS.slice(1)
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
  if (checkText.slice(0, ch[0].start).trim() || checkText.slice(ch[0].end, ch[1].start).trim()) fail(HEADINGS[5], 'đáp án phải nằm ngay dưới tình huống')
  const check = { question: ch[0].title, answer: checkText.slice(ch[1].end).trim() }
  if (!check.question || !check.answer) fail(HEADINGS[5], 'có câu hỏi hoặc đáp án rỗng')

  return {
    recall: hasPrerequisites ? qa(HEADINGS[0], 1, 2) : [],
    predict: { scenario, answer }, example, findInProject,
    explain: qa(HEADINGS[4], 2, 3), check,
    misconceptions: qa(HEADINGS[6], 2, 4).map(q => ({ wrong: q.question, correction: q.answer })),
  }
}
