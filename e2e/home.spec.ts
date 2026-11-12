import { expect, test } from '@playwright/test'
import { STAGES } from '../src/lib/concepts/stages'

test('trang chủ có h1, CTA và link bản đồ', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ImCoding')
  const cta = page.locator('main').getByRole('link', { name: 'Bắt đầu bài đầu tiên' })
  await expect(cta).toHaveAttribute('href', '/concepts/client-server')
  const map = page.locator('main').getByRole('link', { name: 'Xem bản đồ kiến thức' })
  await expect(map).toHaveAttribute('href', '/map')
})

test('trang chủ giới thiệu bài v2.1 và nói rõ định vị', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2, name: 'Mỗi bài 30 phút, học bằng cách tự làm', exact: true })).toBeVisible()
  const cards = page.getByTestId('learn-step')
  await expect(cards).toHaveCount(5)
  const titles = ['Nhắc lại, đoán trước, xem ví dụ', 'Tìm trong code của bạn', 'Tự giải thích', 'Trắc nghiệm', 'Kiểm tra không dùng AI']
  const minutes = [10, 7, 4, 3, 8]
  for (let i = 0; i < titles.length; i++) {
    await expect(cards.nth(i).getByRole('heading', { name: titles[i], exact: true })).toBeVisible()
    await expect(cards.nth(i).getByText(String(i + 1), { exact: true })).toBeVisible()
    await expect(cards.nth(i).getByText(`${minutes[i]} phút`, { exact: true })).toBeVisible()
  }
  await expect(page.locator('main').getByText('Nền tảng học cho founder').first()).toBeVisible()
  await expect(page.getByText('Đa số bài có Bài tập thực hành')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Học tiếp chỗ đang dở', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hỏi thực chiến', exact: true })).toHaveAttribute('href', '/hoi')
  await expect(page.getByRole('searchbox')).toBeVisible()
})

test('trang chủ giới thiệu 4 chặng và liên kết lộ trình', async ({ page }) => {
  await page.goto('/')
  const stages = page.getByRole('region', { name: 'Lộ trình chia 4 chặng theo rủi ro thật' })
  await expect(stages.getByRole('heading', { level: 2 })).toBeVisible()
  await expect(stages.getByRole('listitem')).toHaveCount(4)
  for (const stage of STAGES) {
    await expect(stages.getByRole('heading', { name: `Chặng ${stage.id} · ${stage.title}`, exact: true })).toBeVisible()
    await expect(stages.getByText(stage.description, { exact: true })).toBeVisible()
  }
  await expect(stages.getByRole('link', { name: 'Xem lộ trình', exact: true })).toHaveAttribute('href', '/map')
})

test('mobile: không cuộn ngang, nút CTA cao ≥ 44px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'chỉ chạy ở mobile')
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const box = await page.locator('main').getByRole('link', { name: 'Bắt đầu bài đầu tiên' }).boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
