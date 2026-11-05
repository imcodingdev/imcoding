import { expect, test } from '@playwright/test'

test('cảnh báo chặng trước là khuyến nghị, nội dung và tự kiểm tra vẫn dùng được', async ({ page }) => {
  await page.goto('/concepts/api-endpoint')
  const note = page.getByRole('note', { name: 'Khuyến nghị trước khi học' })
  await expect(note).toHaveCount(0)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(note).toBeVisible()
  await expect(note).toContainText(/Bạn còn \d+ bài ở chặng trước chưa nắm/)
  await expect(note).toContainText('Nên học các bài này trước khi giao AI sửa code')
  await expect(note.locator('a[href="/concepts/secrets"]')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('API')
  const check = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Tự kiểm tra', exact: true }) })
  await expect(check).toBeVisible()
  for (const summary of await check.locator('summary').all()) await summary.click()
  await expect(page.getByRole('button', { name: 'Mình đã hiểu bài này' })).toBeEnabled()
  await page.locator('header').getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(note).toHaveCount(0)
})
