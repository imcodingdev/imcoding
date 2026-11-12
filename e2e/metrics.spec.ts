import { expect, test, type Page } from '@playwright/test'

const events = (page: Page) => page.evaluate(() => window.__imcodingLearningEvents ?? [])

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
})

test('mở bài, cuộn và cuộn lại chỉ ghi mỗi bước một lần', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  await expect.poll(async () => (await events(page)).filter(e => e.event === 'lesson_open').length).toBe(1)
  const step = page.locator('#buoc-2')
  await step.scrollIntoViewIfNeeded()
  await expect.poll(async () => (await events(page)).filter(e => e.event === 'step_reached' && e.step === 2).length).toBe(1)
  await page.locator('#buoc-3').scrollIntoViewIfNeeded()
  await step.scrollIntoViewIfNeeded()
  const recorded = await events(page)
  expect(recorded.filter(e => e.event === 'step_reached' && e.step === 2)).toHaveLength(1)
  expect(recorded.filter(e => e.event === 'lesson_open')).toHaveLength(1)
  expect(recorded.every(e => e.concept_id === 'v2-lesson')).toBe(true)
})

test('tắt ở settings rồi mở bài, cuộn và tìm bài thì không ghi', async ({ page }) => {
  await page.goto('/settings')
  const toggle = page.getByRole('switch', { name: 'Gửi số liệu học ẩn danh' })
  await expect(toggle).toBeChecked()
  await toggle.uncheck()
  expect(await page.evaluate(() => localStorage.getItem('imcoding-metrics-off'))).toBe('1')
  await page.reload()
  await expect(toggle).not.toBeChecked()
  await page.goto('/concepts/v2-lesson')
  await page.locator('#buoc-2').scrollIntoViewIfNeeded()
  // Đợi giao diện hydrate rồi mới kiểm tra không có sự kiện.
  await expect(page.getByRole('banner').getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible()
  expect(await events(page)).toEqual([])
  await page.goto('/hoi')
  await page.locator('form').evaluate(form => form.addEventListener('submit', event => event.preventDefault()))
  await page.getByRole('searchbox').fill('database')
  await page.getByRole('button', { name: 'Tìm bài' }).click()
  expect(await events(page)).toEqual([])
  expect(await page.evaluate(() => localStorage.getItem('imcoding-visitor'))).toBeNull()
})

test('/hoi ghi tìm bài và hỏi AI nhưng không mang câu hỏi hoặc tài khoản', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('imcoding-fake-user', JSON.stringify({ id: 'fake-user', email: 'private@example.test', name: 'Học viên', avatarUrl: null }))
    localStorage.setItem('imcoding-gemini-key:fake-user', 'fake-ok')
  })
  await page.goto('/hoi?q=PRIVATE_QUESTION')
  await expect(page.getByRole('button', { name: 'Hỏi AI', exact: true })).toBeVisible()
  // Giữ trang để đọc mảng trong bộ nhớ sau handler gửi form.
  await page.locator('form').evaluate(form => form.addEventListener('submit', event => event.preventDefault()))
  await page.getByRole('button', { name: 'Tìm bài' }).click()
  await page.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
  await expect.poll(async () => (await events(page)).length).toBe(2)
  const recorded = await events(page)
  expect(recorded.map(e => e.event)).toEqual(['practical_search', 'practical_ai'])
  expect(recorded.every(e => Object.keys(e).sort().join(',') === 'event,visitor')).toBe(true)
  expect(recorded[0].visitor).toBe(recorded[1].visitor)
  for (const secret of ['PRIVATE_QUESTION', 'fake-user', 'private@example.test', 'fake-ok']) {
    expect(JSON.stringify(recorded)).not.toContain(secret)
  }
})

for (const signal of ['doNotTrack', 'globalPrivacyControl']) {
  test(`${signal} tắt số liệu mặc định`, async ({ page }) => {
    await page.addInitScript(signal => {
      Object.defineProperty(navigator, signal, { configurable: true, value: signal === 'doNotTrack' ? '1' : true })
    }, signal)
    await page.goto('/settings')
    const toggle = page.getByRole('switch', { name: 'Gửi số liệu học ẩn danh' })
    await expect(toggle).not.toBeChecked()
    await expect(toggle).toBeDisabled()
    await page.goto('/concepts/v2-lesson')
    await expect(page.getByRole('banner').getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible()
    expect(await events(page)).toEqual([])
  })
}
