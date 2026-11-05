import { expect, test } from '@playwright/test'

test('v2: đủ bảy bước, số phút và đáp án đóng mặc định', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  const names = ['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp']
  const minutes = [3, 2, 5, 7, 4, 5, 3]
  for (let i = 0; i < names.length; i++) {
    await expect(page.getByRole('heading', { level: 2, name: `0${i + 1}.${names[i]} · ${minutes[i]} phút`, exact: true })).toBeVisible()
  }
  await expect(page.getByText('Làm phần này khi không dùng AI')).toBeVisible()
  const answers = page.locator('section[aria-labelledby] details')
  await expect(answers).toHaveCount(5)
  for (const answer of await answers.all()) {
    await expect(answer).not.toHaveAttribute('open')
    await expect(answer.locator('div').first()).toBeHidden()
    await answer.locator('summary').click()
    await expect(answer.locator('div').first()).toBeVisible()
  }
})

test('v2: SelfCheck lưu tiến độ sau khi mở câu hỏi bước 5 và 6; Hỏi AI hoạt động', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  await page.locator('header').getByRole('button', { name: 'Đăng nhập bằng GitHub' }).click()
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  const check = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Tự kiểm tra', exact: true }) })
  const button = page.getByRole('button', { name: 'Mình đã hiểu bài này' })
  await expect(button).toBeDisabled()
  const summaries = check.locator('summary')
  await expect(summaries).toHaveCount(3)
  await expect(summaries.nth(2)).toContainText('Đồng đội đã commit khóa giả')
  for (const summary of await summaries.all()) await summary.click()
  await expect(button).toBeEnabled()
  await button.click()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await page.reload()
  await expect(page.getByText('✓ Đã hiểu')).toBeVisible()
  await page.evaluate(() => localStorage.setItem('imcoding-gemini-key:fake-user', 'fake-ok'))
  await page.reload()
  await page.getByLabel('Câu hỏi của bạn').fill('Giải thích ví dụ mẫu')
  await page.getByRole('button', { name: 'Gửi', exact: true }).click()
  await expect(page.getByText('Đây là câu trả lời mẫu cho: Giải thích ví dụ mẫu', { exact: true })).toBeVisible()
})
