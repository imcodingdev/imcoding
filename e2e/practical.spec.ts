import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
})

test('form GET từ trang chủ và tìm bài không cần đăng nhập', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Bạn đang muốn làm gì?').fill('database')
  await page.getByRole('button', { name: 'Tìm bài' }).click()
  await expect(page).toHaveURL(/\/hoi\?q=database$/)
  const related = page.getByRole('region', { name: 'Bài liên quan' })
  await expect(related.locator('a[href="/concepts/database-table"]')).toBeVisible()
  expect(await related.getByRole('link').count()).toBeLessThanOrEqual(6)
  await expect(page.getByText('Đăng nhập để hỏi AI.')).toBeVisible()
})

test('key giả + AI giả: link whitelist, inspector và mobile 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/hoi?q=database')
  await page.getByRole('banner').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.getByRole('link', { name: 'Cài key để hỏi AI' })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-gemini-key:fake-user', 'fake-ok'))
  await page.reload()
  await page.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
  const answer = page.getByTestId('practical-answer')
  await expect(answer.locator('a[href="/concepts/database-table"]')).toBeVisible()
  await expect(answer).not.toContainText("[[database-table]]")
  await expect(answer).not.toContainText('khong-co-bai-nay')
  await page.locator('details', { hasText: 'Xem bên trong' }).locator('summary').click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  expect(await page.evaluate(() => Object.values(localStorage).join(' '))).not.toContain('database')
  expect(await page.content()).not.toContain('fake-ok')
})

test('dán nhầm key không đưa vào URL khi tìm bài', async ({ page }) => {
  await page.goto('/hoi')
  await page.getByLabel('Bạn đang muốn làm gì?').fill('AIza' + 'x'.repeat(35))
  await page.getByRole('button', { name: 'Tìm bài' }).click()
  await expect(page.getByRole("alert").filter({ hasText: "khoá bí mật" })).toBeVisible()
  await expect(page).toHaveURL(/\/hoi$/)
})
