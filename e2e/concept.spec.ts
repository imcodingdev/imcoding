import { expect, test } from '@playwright/test'

test('trang khái niệm v1 (json)', async ({ page }) => {
  await page.goto('/concepts/json')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('JSON')
  for (const name of ['Giải thích đời thường', 'Trong code trông như thế nào', 'Hay gặp lỗi gì']) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
  const summaries = page.locator('summary')
  expect(await summaries.count()).toBeGreaterThanOrEqual(2)
  const first = page.locator('details').first()
  await summaries.first().click()
  await expect(first).toHaveAttribute('open', '')
  await expect(first.locator('div').first()).toBeVisible()
  await expect(page.getByRole('link', { name: '← Bản đồ' })).toHaveAttribute('href', '/map')
})

test('api-endpoint có link Cần học trước', async ({ page }) => {
  await page.goto('/concepts/api-endpoint')
  await expect(page.locator('a[href="/concepts/server-code"]')).toBeVisible()
  await expect(page.getByText('Cần học trước')).toBeVisible()
})

test('id không tồn tại trả 404', async ({ page }) => {
  const res = await page.goto('/concepts/khong-ton-tai')
  expect(res?.status()).toBe(404)
  await expect(page.getByText('Không tìm thấy khái niệm')).toBeVisible()
  await expect(page.getByRole('link', { name: '← Bản đồ' })).toHaveAttribute('href', '/map')
})

test('đầu trang bài học có pill nhóm và thời lượng', async ({ page }) => {
  await page.goto('/concepts/secrets')
  await expect(page.getByTestId('group-pill')).toBeVisible()
  await expect(page.getByText('Khoảng 30 phút')).toBeVisible()
})

test('khối code có nút Sao chép, bấm thì báo Đã chép', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'chromium', 'clipboard chỉ test ở chromium')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/concepts/secrets')
  const btns = page.getByRole('button', { name: 'Sao chép' })
  expect(await btns.count()).toBeGreaterThan(0)
  await btns.first().click()
  await expect(page.getByText('Đã chép')).toBeVisible()
})

test('clipboard bị chặn thì báo Không sao chép được', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) },
      configurable: true,
    })
  })
  await page.goto('/concepts/secrets')
  await page.getByRole('button', { name: 'Sao chép' }).first().click()
  await expect(page.getByText('Không sao chép được')).toBeVisible()
})

test('không cuộn ngang với khối code dài', async ({ page }) => {
  await page.goto('/concepts/package-dependencies')
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }))
  expect(w.s).toBeLessThanOrEqual(w.i)
})

test('bài thật client-server hiển thị dạng v2', async ({ page }) => {
  await page.goto('/concepts/client-server')
  for (const name of ['Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp']) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
  await expect(page.getByText('Làm phần này khi không dùng AI')).toBeVisible()
})
