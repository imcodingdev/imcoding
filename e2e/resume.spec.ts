import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
})

test('lưu bước 4, học tiếp ở trang chủ/map và cuộn đúng hash', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  await page.getByRole('banner').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await page.locator('#buoc-4').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 16))
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('imcoding-fake-steps') ?? '{}')['v2-lesson']?.step)).toBe(4)
  await page.goto('/')
  const card = page.getByTestId('resume-card')
  await expect(card).toContainText('bước 4/9')
  await page.goto('/map')
  await expect(card).toContainText('bước 4/9')
  await card.getByRole('link', { name: 'Học tiếp' }).click()
  await expect(page).toHaveURL(/\/concepts\/v2-lesson#buoc-4$/)
  await expect.poll(() => page.locator('#buoc-4').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0)
  expect(await page.locator('#buoc-4').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(200)
})

test('khách giữ điểm dừng, bài đã hiểu không hiện thẻ', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('imcoding-resume', JSON.stringify({ conceptId: 'v2-lesson', step: 4, at: new Date().toISOString() })))
  await page.reload()
  await expect(page.getByTestId('resume-card')).toContainText('bước 4/9')
  await page.getByRole('banner').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await page.evaluate(() => {
    localStorage.setItem('imcoding-fake-steps', JSON.stringify({ 'v2-lesson': { conceptId: 'v2-lesson', step: 4, at: new Date().toISOString() } }))
    localStorage.setItem('imcoding-fake-progress', JSON.stringify({ 'v2-lesson': 'understood' }))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await expect(page.getByTestId('resume-card')).toHaveCount(0)
})
