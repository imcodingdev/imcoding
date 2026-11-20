import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Chỉ cho phép server E2E cục bộ; không gọi dịch vụ ngoài.
  await context.route('**/*', route => {
    const host = new URL(route.request().url()).hostname
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort()
  })
})

test('tám lỗi founder dẫn tới bài thật, vùng bấm đủ lớn và vừa màn hình', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Lỗi founder hay gặp', exact: true })
  await expect(section.getByRole('heading', { level: 2, name: 'Lỗi founder hay gặp', exact: true })).toBeVisible()
  const links = section.getByRole('link')
  await expect(links).toHaveCount(8)
  for (const link of await links.all()) {
    await expect(link).toBeVisible()
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await section.getByRole('link', { name: /Đã deploy mà vẫn thấy bản cũ/ }).click()
  await expect(page).toHaveURL(/\/concepts\/debugging$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('bài đánh đổi có mục chưa cần trong ví dụ và giữ nguyên chín bước', async ({ page }) => {
  await page.goto('/concepts/system-tradeoffs')
  const example = page.locator('section#buoc-3')
  await expect(example.getByRole('heading', { level: 2 })).toContainText('Ví dụ mẫu')
  const callout = example.getByRole('region', { name: 'Khi nào chưa cần', exact: true })
  await expect(callout.getByRole('heading', { level: 3, name: 'Khi nào chưa cần', exact: true })).toBeVisible()
  await expect(callout.getByRole('listitem')).toHaveCount(3)
  await expect(page.locator('section[id^="buoc-"] > h2')).toHaveCount(9)
  await expect(page.locator('#buoc-4 > h2')).toContainText('Tìm trong project của bạn')
})
