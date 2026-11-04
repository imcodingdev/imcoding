import { expect, test } from '@playwright/test'
test('trang chủ có tên ImCoding', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ImCoding')
})
