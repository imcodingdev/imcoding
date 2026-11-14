import { expect, test } from '@playwright/test'

const lessons = [
  { id: 'agent-instructions', title: 'File hướng dẫn cho agent (AGENTS.md, CLAUDE.md)', lectures: ['01', '02', '03', '04'] },
  { id: 'agent-scope', title: 'Giao một việc một lúc cho agent', lectures: ['07', '08'] },
  { id: 'done-evidence', title: 'Bằng chứng "đã xong" của agent', lectures: ['09', '10'] },
  { id: 'agent-handoff', title: 'Bàn giao giữa các phiên làm việc của agent', lectures: ['05', '06', '12'] },
  { id: 'agent-loops', title: 'Cho agent tự chạy vòng lặp an toàn', lectures: ['11', '13'] },
]

for (const lesson of lessons) {
  test(`${lesson.id}: đủ bài, nguồn ở cuối và không tràn ngang`, async ({ page }) => {
    await page.goto(`/concepts/${lesson.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title)
    await expect(page.locator('fieldset')).toHaveCount(4)
    await expect(page.getByRole('heading', { level: 2, name: /Bài tập thực hành/ })).toBeVisible()
    const footer = page.locator('main > p').filter({ hasText: 'Tham khảo:' })
    await expect(footer).toBeVisible()
    await expect(footer.locator('a')).toHaveCount(lesson.lectures.length)
    for (const number of lesson.lectures) {
      const link = footer.getByRole('link', { name: `Learn Harness Engineering — Lecture ${number}`, exact: true })
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link).toHaveAttribute('href', new RegExp(`^https://github\\.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-${number}-[^/]+/index\\.md$`))
    }
    expect(await footer.evaluate(element => element === element.parentElement?.lastElementChild)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('bài cũ không có nguồn thì không hiện dòng tham khảo', async ({ page }) => {
  await page.goto('/concepts/client-server')
  await expect(page.locator('main > p').filter({ hasText: 'Tham khảo:' })).toHaveCount(0)
})
