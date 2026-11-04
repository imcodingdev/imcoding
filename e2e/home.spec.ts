import { expect, test } from '@playwright/test'

test('trang chủ có h1, CTA và link bản đồ', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ImCoding')
  const cta = page.locator('main').getByRole('link', { name: 'Bắt đầu bài đầu tiên' })
  await expect(cta).toHaveAttribute('href', '/concepts/client-server')
  const map = page.locator('main').getByRole('link', { name: 'Xem bản đồ kiến thức' })
  await expect(map).toHaveAttribute('href', '/map')
})

test('trang chủ có 3 bước học và nói rõ định vị', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="learn-step"]')).toHaveCount(3)
  await expect(page.locator('main').getByText('Nền tảng học cho founder').first()).toBeVisible()
})

test('mobile: không cuộn ngang, nút CTA cao ≥ 44px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'chỉ chạy ở mobile')
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const box = await page.locator('main').getByRole('link', { name: 'Bắt đầu bài đầu tiên' }).boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
