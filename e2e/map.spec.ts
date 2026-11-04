import { expect, test } from '@playwright/test'

const openMapView = async (page: import('@playwright/test').Page, testInfo: import('@playwright/test').TestInfo) => {
  if (testInfo.project.name === 'mobile') await page.getByRole('tab', { name: 'Sơ đồ' }).click()
}

test('bản đồ có 16 node và bấm node chuyển trang', async ({ page }, testInfo) => {
  await page.goto('/map')
  await openMapView(page, testInfo)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bản đồ kiến thức')
  const nodes = page.locator('[data-testid="concept-node"]')
  await expect(nodes).toHaveCount(16)
  await nodes.filter({ hasText: 'Client–Server' }).first().click()
  await expect(page).toHaveURL(/\/concepts\/client-server$/)
})

test('danh sách có 9 nhóm', async ({ page }) => {
  await page.goto('/map')
  await expect(page.locator('[data-testid="concept-list"] h2')).toHaveCount(9)
  await expect(page.locator('[data-testid="concept-list"] a[data-status][href="/concepts/client-server"]')).toBeVisible()
})

test('không tràn ngang trên mobile', async ({ page }, testInfo) => {
  await page.goto('/map')
  await expect(page.locator('[data-testid="concept-list"]')).toBeVisible()
  if (testInfo.project.name === 'mobile') {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

const LOGIN = async (page: import('@playwright/test').Page) =>
  page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()

test('chưa đăng nhập: mọi node trung tính, có lời mời đăng nhập', async ({ page }, testInfo) => {
  await page.goto('/map')
  await openMapView(page, testInfo)
  const nodes = page.locator('[data-testid="concept-node"]')
  await expect(nodes).toHaveCount(16)
  await expect(page.locator('[data-testid="concept-node"][data-status="neutral"]')).toHaveCount(16)
  await expect(page.getByText('Đăng nhập để thấy tiến độ của bạn')).toBeVisible()
  await expect(page.getByText('Chưa học · Đã gặp trong code · Đã hiểu')).toBeVisible()
})

test('đã đánh dấu đã hiểu: node tô xanh, 15 node còn lại trung tính', async ({ page }, testInfo) => {
  await page.goto('/concepts/client-server')
  await LOGIN(page)
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  await page.getByRole('button', { name: 'Mình đã hiểu bài này' }).click()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await page.goto('/map')
  await openMapView(page, testInfo)
  const done = page.locator('[data-testid="concept-node"][data-status="understood"]')
  await expect(done).toHaveCount(1)
  await expect(done).toContainText('Client–Server')
  await expect(done).toContainText('✓')
  await expect(page.locator('[data-testid="concept-node"][data-status="neutral"]')).toHaveCount(15)
  await expect(page.locator('[data-testid="concept-list"] a[data-status="understood"]')).toHaveCount(1)
  await expect(page.getByText('Đăng nhập để thấy tiến độ của bạn')).toHaveCount(0)
})

test('lỗi tải tiến độ: báo lỗi, node trung tính, không crash', async ({ page }, testInfo) => {
  await page.goto('/map')
  await LOGIN(page)
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  await page.reload()
  await expect(page.getByText('Không tải được tiến độ')).toBeVisible()
  await openMapView(page, testInfo)
  await expect(page.locator('[data-testid="concept-node"][data-status="neutral"]')).toHaveCount(16)
})

test('mobile: mặc định tab Lộ trình, bấm Sơ đồ thấy 16 node', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  await page.goto('/map')
  await expect(page.getByRole('tab', { name: 'Lộ trình' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-testid="concept-list"] a[data-status][href="/concepts/client-server"]')).toBeVisible()
  await page.getByRole('tab', { name: 'Sơ đồ' }).click()
  await expect(page.getByRole('tab', { name: 'Sơ đồ' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-testid="concept-node"]')).toHaveCount(16)
  await expect(page.locator('[data-testid="concept-node"]').first()).toBeVisible()
})

test('desktop: sơ đồ luôn hiện, không có tab', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile')
  await page.goto('/map')
  await expect(page.getByRole('tablist')).toBeHidden()
  await expect(page.locator('[data-testid="concept-node"]')).toHaveCount(16)
  await expect(page.locator('[data-testid="concept-node"]').first()).toBeVisible()
})

test('thẻ Bài nên học tiếp: đổi sau khi hiểu client-server', async ({ page }) => {
  await page.goto('/map')
  const card = page.locator('[data-testid="next-up"]')
  await expect(card).toContainText('Bài nên học tiếp')
  await expect(card).toContainText('Client')
  await page.goto('/concepts/client-server')
  await LOGIN(page)
  const summaries = page.locator('details > summary')
  const n = await summaries.count()
  for (let i = 0; i < n; i++) await summaries.nth(i).click()
  await page.getByRole('button', { name: 'Mình đã hiểu bài này' }).click()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await page.goto('/map')
  await expect(page.getByText('Đã hiểu 1 ·')).toBeVisible()
  await expect(card).toContainText('Bài nên học tiếp')
  await expect(card).not.toContainText('Client–Server')
  await expect(card.getByRole('link', { name: /Học bài này/ })).not.toHaveAttribute('href', '/concepts/client-server')
})

test('mobile: chip Cần học trước hiện trong Lộ trình', async ({ page }) => {
  await page.goto('/map')
  await expect(page.getByText(/Cần học trước:/).first()).toBeVisible()
})

test('đã đăng nhập nhưng tải tiến độ lỗi: không hiện thẻ gợi ý sai', async ({ page }) => {
  await page.goto('/map')
  await LOGIN(page)
  await expect(page.getByTestId('progress-summary')).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  await page.reload()
  await expect(page.getByText('Không tải được tiến độ')).toBeVisible()
  await expect(page.locator('[data-testid="next-up"]')).toHaveCount(0)
})

test('desktop: node bản đồ đọc được và không cuộn ngang trang', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop only')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/map')
  const node = page.locator('[data-testid="concept-node"]').first()
  await expect(node).toBeVisible()
  await page.waitForTimeout(500)
  const box = await node.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(28)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
