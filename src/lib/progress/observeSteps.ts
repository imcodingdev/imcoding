/** Mỗi lần mở bài chỉ tiến tới bước lớn hơn, gộp các bước lướt qua nhanh. */
export function observeSteps(root: HTMLElement, initialStep: number, save: (step: number) => void, reached?: (step: number) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  let highest = initialStep
  const seen = new Set<number>()
  let timer: ReturnType<typeof setTimeout> | undefined
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const step = Number(entry.target.id.replace('buoc-', ''))
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && Number.isInteger(step) && step >= 1 && step <= 20 && !seen.has(step)) {
        seen.add(step)
        reached?.(step)
      }
    }
    const next = entries.reduce((max, entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5
      ? Math.max(max, Number(entry.target.id.replace('buoc-', '')) || 0) : max, highest)
    if (next <= highest) return
    highest = next
    clearTimeout(timer)
    timer = setTimeout(() => save(next), 1500)
  }, { threshold: 0.5 })
  root.querySelectorAll('[id^="buoc-"]').forEach(step => observer.observe(step))
  return () => { clearTimeout(timer); observer.disconnect() }
}
