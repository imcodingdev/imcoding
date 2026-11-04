import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'dark' })

// Chuẩn hoá mọi định dạng màu (oklch, lab...) về rgb qua canvas rồi tính luminance.
const toRgb = (page: Page, css: string) =>
  page.evaluate((c) => {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 1, 1)
    return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3))
  }, css)
const lum = ([r0, g0, b0]: number[]) => {
  const [r, g, b] = [r0, g0, b0].map((v) => {
    const c = Number(v) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

for (const path of ['/', '/map', '/concepts/secrets', '/privacy', '/concepts/khong-co']) {
  test(`dark mode ${path}`, async ({ page }) => {
    await page.goto(path)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).not.toBe('rgb(250, 248, 245)')
    expect(lum(await toRgb(page, bg))).toBeLessThan(0.1)
    const h1 = page.locator('h1').first()
    const color = await h1.evaluate((el) => getComputedStyle(el).color)
    expect(lum(await toRgb(page, color))).toBeGreaterThan(0.7)
  })
}

test('banner lỗi đăng nhập đọc được ở dark mode', async ({ page }) => {
  await page.goto('/?login_error=1')
  const el = page.getByRole('alert').filter({ hasText: 'Đăng nhập chưa thành công' })
  const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor)
  expect(lum(await toRgb(page, bg))).toBeLessThan(0.1)
})

test('logo hiện rõ trên nền dark', async ({ page }) => {
  await page.goto('/')
  const rect = page.locator('header svg rect').first()
  const { fill, stroke } = await rect.evaluate((e) => {
    const s = getComputedStyle(e)
    return { fill: s.fill, stroke: s.stroke }
  })
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const bgL = lum(await toRgb(page, bg))
  const fillL = lum(await toRgb(page, fill))
  const strokeL = stroke === 'none' ? 0 : lum(await toRgb(page, stroke))
  expect(Math.max(Math.abs(fillL - bgL), Math.abs(strokeL - bgL))).toBeGreaterThan(0.03)
})
