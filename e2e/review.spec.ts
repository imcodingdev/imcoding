import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
})

async function seedReview(page: Page, hoursAgo: number) {
  await page.goto('/')
  await page.evaluate(hours => {
    localStorage.setItem('imcoding-fake-user', JSON.stringify({ id: 'fake-user', email: 'hocvien@example.com', name: 'Học viên', avatarUrl: null }))
    localStorage.setItem('imcoding-fake-progress', JSON.stringify({ 'v2-lesson': 'understood' }))
    localStorage.setItem('imcoding-fake-reviews', JSON.stringify([{
      conceptId: 'v2-lesson', understoodAt: new Date(Date.now() - hours * 3_600_000).toISOString(), lastReviewedAt: null,
    }]))
  }, hoursAgo)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
}

test('bài hiểu hai ngày trước: thẻ ở trang chủ/map, ôn và giữ kết quả sau tải lại', async ({ page }) => {
  await seedReview(page, 48)
  const card = page.getByTestId('review-due-card')
  await expect(card).toContainText('Hôm nay có 1 bài cần ôn')
  await page.goto('/map')
  await expect(card).toContainText('Hôm nay có 1 bài cần ôn')
  await card.getByRole('link', { name: 'Ôn tập', exact: true }).click()
  await expect(page).toHaveURL(/\/on-tap$/)
  await expect(page).toHaveTitle('Ôn tập – ImCoding')
  const review = page.getByRole('article')
  await expect(review.getByRole('link')).toHaveAttribute('href', '/concepts/v2-lesson')
  await expect(review).toContainText('Lần ôn 1/3')
  const answer = review.locator('details')
  await expect(answer).not.toHaveAttribute('open', '')
  await expect(answer.locator('div').first()).toBeHidden()
  await answer.locator('summary').click()
  await expect(answer.locator('div').first()).toBeVisible()
  await review.getByRole('button', { name: 'Đã ôn xong' }).click()
  await expect(page.getByText('Chưa có bài cần ôn hôm nay')).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('imcoding-fake-reviews')!)[0].lastReviewedAt)).not.toBeNull()
  await page.getByRole('banner').locator('a[href="/"]').click()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await expect(card).toHaveCount(0)
  await page.goto('/on-tap')
  await expect(page.getByText('Chưa có bài cần ôn hôm nay')).toBeVisible()
})

test('bài hiểu một giờ trước chưa có thẻ nhắc ôn', async ({ page }) => {
  await seedReview(page, 1)
  await page.goto('/on-tap')
  await expect(page.getByText('Chưa có bài cần ôn hôm nay')).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await expect(page.getByTestId('review-due-card')).toHaveCount(0)
})

test('khách được mời đăng nhập trên trang ôn', async ({ page }) => {
  await page.goto('/on-tap')
  const main = page.getByRole('main')
  await expect(main.getByText('Đăng nhập để xem lịch ôn tập và lưu những bài bạn đã ôn.')).toBeVisible()
  await expect(main.getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible()
  await expect(main.getByRole('button', { name: 'Đã ôn xong' })).toHaveCount(0)
})

test('lỗi lưu giữ bài và cho phép thử lại', async ({ page }) => {
  await seedReview(page, 48)
  await page.goto('/on-tap')
  const button = page.getByRole('button', { name: 'Đã ôn xong' })
  await expect(button).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  await button.click()
  await expect(page.getByRole('alert')).toContainText('Chưa lưu được, thử lại nhé')
  await expect(button).toBeEnabled()
  await page.evaluate(() => localStorage.removeItem('imcoding-fake-fail'))
  await button.click()
  await expect(page.getByText('Chưa có bài cần ôn hôm nay')).toBeVisible()
})

test('trang ôn 375px không tràn ngang, vùng bấm đủ lớn ở hai giao diện màu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await seedReview(page, 48)
  await page.goto('/on-tap')
  await expect(page.getByRole('button', { name: 'Đã ôn xong' })).toBeVisible()
  await page.getByRole('article').locator('summary').click()
  const backgrounds: string[] = []
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    backgrounds.push(await page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    for (const target of await page.getByRole('main').locator('button:visible, summary:visible, label:visible, h2 a:visible').all()) {
      const box = await target.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  }
  expect(backgrounds[0]).not.toBe(backgrounds[1])
})
