import { expect, test, type Page } from '@playwright/test'

const URL = '/concepts/client-server'
const FAKE = { id: 'fake-user', email: null, name: 'Học viên', avatarUrl: null }

async function setup(page: Page, key: string | null) {
  await page.goto('/')
  await page.evaluate(
    ([u, k]) => {
      localStorage.setItem('imcoding-fake-user', JSON.stringify(u))
      if (k) localStorage.setItem('imcoding-gemini-key:fake-user', k as string)
      else localStorage.removeItem('imcoding-gemini-key:fake-user')
    },
    [FAKE, key] as const,
  )
  await page.goto(URL)
}

async function ask(page: Page, text: string) {
  await page.getByLabel('Câu hỏi của bạn').fill(text)
  await page.getByRole('button', { name: 'Gửi', exact: true }).click()
}

test('chưa đăng nhập: có lời nhắc đăng nhập', async ({ page }) => {
  await page.goto(URL)
  await expect(page.getByRole('heading', { name: 'Hỏi AI về bài này' })).toBeVisible()
  await expect(page.getByText('Đăng nhập để hỏi AI.')).toBeVisible()
  await expect(page.getByLabel('Câu hỏi của bạn')).toHaveCount(0)
})

test('chưa có key: link Cài key để hỏi AI', async ({ page }) => {
  await setup(page, null)
  await expect(page.getByRole('link', { name: 'Cài key để hỏi AI' })).toHaveAttribute('href', '/settings')
  await expect(page.getByLabel('Câu hỏi của bạn')).toHaveCount(0)
})

test('hỏi, xem bên trong, câu gợi ý, chặn key dán nhầm', async ({ page }) => {
  await setup(page, 'fake-ok')
  await expect(
    page.getByText('Đừng dán mật khẩu, khoá bí mật hay dữ liệu khách hàng. Câu hỏi được gửi thẳng tới Google bằng key của bạn.'),
  ).toBeVisible()
  await ask(page, 'Server là gì?')
  await expect(page.getByText('Đây là câu trả lời mẫu cho: Server là gì?', { exact: true })).toBeVisible()

  const inspector = page.locator('details', { hasText: 'Xem bên trong' }).first()
  await inspector.locator('summary').click()
  await expect(inspector.getByText('POST', { exact: false }).first()).toBeVisible()
  await expect(inspector).toContainText('streamGenerateContent')
  await expect(inspector).toContainText('••••')
  await expect(inspector.getByRole('link', { name: /API endpoint/ })).toHaveAttribute('href', '/concepts/api-endpoint')
  await expect(inspector).toContainText('200')
  expect(await page.content()).not.toContain('fake-ok')

  await page.getByRole('button', { name: 'Cho ví dụ đời thường khác' }).click()
  await expect(page.getByText('Đây là câu trả lời mẫu cho: Cho ví dụ đời thường khác', { exact: true })).toBeVisible()
  const answers = page.getByText(/^Đây là câu trả lời mẫu cho:/)
  await expect(answers).toHaveCount(2)

  await ask(page, 'AIza' + 'x'.repeat(35))
  await expect(page.locator('main').getByRole('alert')).toHaveText('Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.')
  await expect(answers).toHaveCount(2)
})

test('hết hạn mức: báo lỗi và thấy 429 trong Xem bên trong', async ({ page }) => {
  await setup(page, 'fake-quota')
  await ask(page, 'Server là gì?')
  await expect(page.getByText('Đã hết hạn mức dùng AI lúc này. Hãy thử lại sau ít phút.')).toBeVisible()
  const inspector = page.locator('details', { hasText: 'Xem bên trong' }).first()
  await inspector.locator('summary').click()
  await expect(inspector).toContainText('429')
  expect(await page.content()).not.toContain('fake-quota')
  await expect(page.getByRole('button', { name: 'Gửi', exact: true })).toBeVisible()
})

test('375px: không cuộn ngang khi mở Xem bên trong', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await setup(page, 'fake-ok')
  await ask(page, 'Server là gì?')
  await expect(page.getByText('Đây là câu trả lời mẫu cho: Server là gì?', { exact: true })).toBeVisible()
  await page.locator('details', { hasText: 'Xem bên trong' }).first().locator('summary').click()
  await expect(page.getByText('streamGenerateContent').first()).toBeVisible()
  const w = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(w).toBeLessThanOrEqual(375)
})
