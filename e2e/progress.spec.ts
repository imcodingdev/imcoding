import { expect, test } from '@playwright/test'

const URL = '/concepts/client-server'
const BTN = 'Mình đã hiểu bài này'

test('chưa đăng nhập: có lời mời đăng nhập, không có nút đã hiểu', async ({ page }) => {
  await page.goto(URL)
  await expect(page.getByText('Đăng nhập để lưu tiến độ học')).toBeVisible()
  await expect(page.getByRole('button', { name: BTN })).toHaveCount(0)
})

test('đăng nhập: mở hết đáp án mới bấm được, lưu và giữ sau khi tải lại', async ({ page }) => {
  await page.goto(URL)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  const btn = page.getByRole('button', { name: BTN })
  await expect(btn).toBeDisabled()
  await expect(page.getByText('Mở hết đáp án để tự kiểm tra trước nhé')).toBeVisible()
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  await expect(btn).toBeEnabled()
  await btn.click()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await page.reload()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
})

test('lỗi ghi: báo lỗi, không giả vờ đã lưu, nút bật lại', async ({ page }) => {
  await page.goto(URL)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  const btn = page.getByRole('button', { name: BTN })
  await btn.click()
  await expect(page.getByText('Chưa lưu được, thử lại nhé')).toBeVisible()
  await expect(page.getByText('✓ Đã hiểu')).toHaveCount(0)
  await expect(btn).toBeEnabled()
})

test('đánh dấu đã hiểu: hiện lời khen và bài nên học tiếp', async ({ page }) => {
  await page.goto(URL)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  await page.getByRole('button', { name: BTN }).click()
  await expect(page.getByText('Tuyệt! Bạn đã hiểu 1/17 bài.')).toBeVisible()
  await expect(page.getByText('Bài nên học tiếp')).toBeVisible()
})

test('tiến độ ở header cập nhật ngay sau khi đánh dấu và giữ khi chuyển trang', async ({ page }) => {
  await page.goto(URL)
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.locator('header').getByText('0/17 đã hiểu')).toBeVisible()
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  await page.getByRole('button', { name: BTN }).click()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await expect(page.locator('header').getByText('1/17 đã hiểu')).toBeVisible()
  await page.getByRole('link', { name: '← Bản đồ' }).click()
  await expect(page).toHaveURL(/\/map$/)
  await expect(page.locator('header').getByText('1/17 đã hiểu')).toBeVisible()
})
