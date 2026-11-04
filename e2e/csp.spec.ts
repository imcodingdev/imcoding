import { expect, test } from '@playwright/test'

test('header CSP giới hạn connect-src', async ({ request }) => {
  const res = await request.get('/')
  const csp = res.headers()['content-security-policy'] ?? ''
  for (const part of [
    "connect-src 'self'",
    'generativelanguage.googleapis.com',
    "frame-ancestors 'none'",
    "object-src 'none'",
  ]) {
    expect(csp).toContain(part)
  }
})

test('không có lỗi CSP trên console khi tải các trang chính', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  for (const path of ['/', '/map', '/concepts/client-server', '/settings']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  const bad = errors.filter((t) => t.includes('Content Security Policy') || t.includes('Refused to'))
  expect(bad).toEqual([])
})
