import { expect, test } from '@playwright/test'

test('đăng nhập và đăng xuất ở chế độ giả', async ({ page, isMobile }) => {
  await page.goto('/map')
  await page.getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page).toHaveURL(/\/map$/)
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  // Màn hẹp ẩn tên để header không bị cắt chữ
  if (isMobile) await expect(page.getByText('Học viên')).toBeHidden()
  else await expect(page.getByText('Học viên')).toBeVisible()
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible()
})

test('callback có error chuyển về trang chủ kèm banner', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied')
  await expect(page).toHaveURL(/\/\?login_error=1&reason=provider&detail=access_denied$/)
  await expect(page.getByText('Đăng nhập chưa thành công. Bạn thử lại nhé.')).toBeVisible()
})

test('callback không redirect ra ngoài origin', async ({ page, baseURL }) => {
  await page.goto('/auth/callback?code=x&next=//evil.com')
  expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin)
})

test('footer có link Quyền riêng tư', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Quyền riêng tư' })).toHaveAttribute('href', '/privacy')
})

test('lỗi đăng nhập và đăng xuất được báo', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('imcoding-fake-fail', '1'))
  await page.reload()
  await page.getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.getByText('Không đăng nhập được, thử lại sau.')).toBeVisible()
  await page.evaluate(() => {
    localStorage.removeItem('imcoding-fake-fail')
    localStorage.setItem(
      'imcoding-fake-user',
      JSON.stringify({ id: 'fake-user', email: null, name: 'Học viên', avatarUrl: null }),
    )
    localStorage.setItem('imcoding-fake-fail', '1')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByText('Không đăng xuất được, thử lại sau.')).toBeVisible()
})
