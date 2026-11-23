import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
})

async function seedToday(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('imcoding-fake-user', JSON.stringify({ id: 'fake-user', email: 'hocvien@example.com', name: 'Học viên', avatarUrl: null }))
    localStorage.setItem('imcoding-fake-progress', JSON.stringify({ 'client-server': 'understood' }))
    localStorage.setItem('imcoding-fake-reviews', JSON.stringify([{
      conceptId: 'client-server', understoodAt: new Date(Date.now() - 48 * 3_600_000).toISOString(), lastReviewedAt: null,
    }]))
    localStorage.setItem('imcoding-fake-steps', JSON.stringify({
      'v2-lesson': { conceptId: 'v2-lesson', step: 4, at: new Date().toISOString() },
    }))
  })
  await page.reload()
}

test('bài đến hạn và điểm dừng: hai mục đúng thứ tự, tổng 25 phút trên trang chủ và map', async ({ page }) => {
  await seedToday(page)
  for (const path of ['/', '/map']) {
    await page.goto(path)
    const card = page.getByTestId('today-card').filter({ visible: true })
    await expect(card.getByRole('heading')).toHaveText('Buổi học hôm nay · khoảng 25 phút')
    const links = card.getByRole('link').filter({ visible: true })
    await expect(links).toHaveCount(2)
    await expect(links.nth(0)).toHaveText('Ôn 1 bài đến hạn')
    await expect(links.nth(0)).toHaveAttribute('href', '/on-tap')
    await expect(links.nth(1)).toHaveText(/^Học tiếp · .+ · bước 4\/9$/)
    await expect(links.nth(1)).toHaveAttribute('href', '/concepts/v2-lesson#buoc-4')
    await expect(card.getByRole('link', { name: /^Bài mới ·/ }).filter({ visible: true })).toHaveCount(0)
  }
})

test('khách mới: trang chủ chỉ có bài mới, map giữ gợi ý riêng', async ({ page }) => {
  await page.goto('/')
  const card = page.getByTestId('today-card').filter({ visible: true })
  await expect(card).toContainText('khoảng 30 phút')
  await expect(card.getByRole('link').filter({ visible: true })).toHaveCount(1)
  await expect(card.getByRole('link')).toHaveText(/^Bài mới ·/)
  await expect(card.getByRole('link')).toHaveAttribute('href', '/concepts/client-server')
  await page.getByRole('main').getByRole('link', { name: 'Xem bản đồ kiến thức', exact: true }).click()
  await expect(page.getByTestId('next-up').filter({ visible: true })).toBeVisible()
  await expect(page.getByTestId('today-card').filter({ visible: true })).toHaveCount(0)
})

test('thẻ hôm nay tại 375px không tràn ngang, các mục có vùng bấm đủ lớn', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await seedToday(page)
  const card = page.getByTestId('today-card').filter({ visible: true })
  await expect(card).toContainText('khoảng 25 phút')
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    for (const link of await card.getByRole('link').filter({ visible: true }).all()) {
      expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    }
  }
})
