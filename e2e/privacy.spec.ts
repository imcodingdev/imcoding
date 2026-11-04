import { expect, test } from '@playwright/test'

test('trang quyền riêng tư có đủ nội dung', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1, name: 'Quyền riêng tư' })).toBeVisible()
  await expect(page.getByText('hello@imcoding.dev').first()).toBeVisible()
  await expect(page.getByText('nền tảng học giúp mọi người')).toBeVisible()
  await expect(page.getByText('cookie', { exact: false }).first()).toBeVisible()
  for (const name of ['Dữ liệu chúng tôi lưu', 'Dùng để làm gì', 'Xoá dữ liệu']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
  }
})

test('trang quyền riêng tư nói rõ về Hỏi AI', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 2, name: 'Hỏi AI' })).toBeVisible()
  await expect(page.getByText('ImCoding không nhận và không lưu').first()).toBeVisible()
  await expect(page.getByText('Google').first()).toBeVisible()
})
