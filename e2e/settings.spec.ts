import { expect, test, type Page } from '@playwright/test'

const FAKE = { id: 'fake-user', email: null, name: 'Học viên', avatarUrl: null }
const OTHER = { id: 'other-user', email: null, name: 'Khác', avatarUrl: null }

async function loginAs(page: Page, user: object) {
  await page.goto('/')
  await page.evaluate((u) => localStorage.setItem('imcoding-fake-user', JSON.stringify(u)), user)
}

async function saveKey(page: Page, key: string) {
  await page.getByLabel('Gemini API key').fill(key)
  await page.getByRole('button', { name: 'Lưu và kiểm tra' }).click()
}

test('chưa đăng nhập: chỉ thấy nút đăng nhập', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Bài thực hành: Gắn API key để hỏi AI' })).toBeVisible()
  await expect(page.getByText('Đăng nhập bằng GitHub để làm bài thực hành này.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Đăng nhập bằng GitHub' }).last()).toBeVisible()
  await expect(page.getByLabel('Gemini API key')).toHaveCount(0)
})

test('đã đăng nhập: link header và 4 bước', async ({ page }) => {
  await loginAs(page, FAKE)
  await page.reload()
  await page.locator('header').getByRole('link', { name: 'Cài đặt AI' }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.locator('main ol > li:visible')).toHaveCount(4)
  await expect(page.locator('main ol a[href^="/concepts/"]')).toHaveCount(4)
  await expect(page.locator('main ol a[href="/concepts/secrets"]')).toHaveCount(1)
})

test('lưu key, kiểm tra, tải lại, xoá', async ({ page }) => {
  await loginAs(page, FAKE)
  await page.goto('/settings')
  await saveKey(page, 'fake-ok')
  await expect(page.getByRole('status')).toHaveText('Key dùng được')
  await expect(page.getByText('Hoàn thành bài thực hành 🎉')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Đã có key:')).toBeVisible()
  expect(await page.content()).not.toContain('fake-ok')
  await page.getByRole('button', { name: 'Xoá key' }).click()
  await expect(page.getByRole('status')).toHaveText('Chưa có key')
})

test('key sai và hết hạn mức', async ({ page }) => {
  await loginAs(page, FAKE)
  await page.goto('/settings')
  await saveKey(page, 'fake-invalid')
  await expect(page.getByRole('status')).toContainText('Key không đúng')
  await saveKey(page, 'fake-quota')
  await expect(page.getByRole('status')).toContainText('hết hạn mức')
})

test('hai người dùng một máy không thấy key của nhau', async ({ page }) => {
  await loginAs(page, FAKE)
  await page.goto('/settings')
  await saveKey(page, 'fake-ok')
  await expect(page.getByRole('status')).toHaveText('Key dùng được')
  await page.evaluate((u) => localStorage.setItem('imcoding-fake-user', JSON.stringify(u)), OTHER)
  await page.reload()
  await expect(page.getByRole('status')).toHaveText('Chưa có key')
  await expect(page.getByText('Đã có key:')).toHaveCount(0)
})

test('375px: không cuộn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await loginAs(page, FAKE)
  await page.goto('/settings')
  await expect(page.getByLabel('Gemini API key')).toBeVisible()
  const w = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(w).toBeLessThanOrEqual(375)
})

test('đăng nhập lỗi được báo trên trang', async ({ page }) => {
  await page.goto('/settings')
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  await page.reload()
  await page.locator('main').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.locator('main').getByRole('alert')).toHaveText('Không đăng nhập được, thử lại sau.')
})
