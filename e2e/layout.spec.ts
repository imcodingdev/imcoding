import { expect, test } from '@playwright/test'

test('header có logo trỏ về trang chủ và link Bản đồ', async ({ page }) => {
  await page.goto('/')
  const logoLink = page.locator('header a[href="/"]').filter({ has: page.locator('[aria-label="ImCoding"]') })
  await expect(logoLink).toHaveCount(1)
  await expect(page.locator('header').getByRole('link', { name: 'Bản đồ' })).toBeVisible()
})

test('favicon là file svg và tải được', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="icon"][href$=".svg"], link[rel="icon"][href*=".svg?"]').first().getAttribute('href')
  expect(href).toBeTruthy()
  const res = await request.get(new URL(href!, page.url()).toString())
  expect(res.status()).toBe(200)
})

test('tiến độ trong header chỉ hiện khi đã đăng nhập', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible()
  await expect(page.locator('header').getByText('đã hiểu')).toHaveCount(0)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.locator('header').getByText('0/16 đã hiểu')).toBeVisible()
})

test('mobile: không cuộn ngang và vùng chạm header đủ lớn', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'chỉ chạy ở mobile')
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(overflow).toBe(true)
  const els = page.locator('header a, header button')
  const n = await els.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) {
    const box = await els.nth(i).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})

test('font nội dung là Be Vietnam Pro', async ({ page }) => {
  await page.goto('/')
  const ff = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(ff).toContain('Be Vietnam Pro')
})
