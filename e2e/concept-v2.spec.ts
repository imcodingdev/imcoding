import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Chặn dịch vụ ngoài; backend và AI trong cấu hình E2E đều là giả.
  await context.route('**/*', route => {
    const host = new URL(route.request().url()).hostname
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort()
  })
})

test('v2: đủ chín bước, số phút và đáp án đóng mặc định', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  const names = ['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Trắc nghiệm', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp', 'Bài tập thực hành']
  const minutes = [3, 2, 5, 7, 4, 3, 5, 3, 15]
  await expect(page.getByText('Khoảng 30 phút · 9 bước · 3 câu hỏi')).toBeVisible()
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

test('v2: chấm sai/đúng, đổi tổng điểm, làm lại và tải lại không giữ kết quả', async ({ page }) => {
  await page.goto('/concepts/v2-lesson')
  const quiz = page.getByRole('region', { name: /Trắc nghiệm/ })
  const questions = quiz.getByRole('group')
  const explanation = 'Tiền tố công khai đưa giá trị xuống trình duyệt.'
  await expect(quiz.getByText(explanation)).toHaveCount(0)
  await expect(quiz.getByText('0/3 câu đúng')).toBeVisible()
  await expect(questions.nth(0).getByRole('button', { name: 'Kiểm tra' })).toBeDisabled()
  await questions.nth(0).getByRole('radio', { name: 'Chỉ server đọc được' }).check()
  await questions.nth(0).getByRole('button', { name: 'Kiểm tra' }).click()
  await expect(questions.nth(0).getByText('Chưa đúng', { exact: true })).toBeVisible()
  await expect(questions.nth(0).getByText(explanation)).toBeVisible()
  await expect(quiz.getByText('0/3 câu đúng')).toBeVisible()
  await questions.nth(1).getByRole('radio', { name: 'Bỏ khóa khỏi phản hồi' }).check()
  await questions.nth(1).getByRole('button', { name: 'Kiểm tra' }).click()
  await expect(questions.nth(1).getByText('Chính xác', { exact: true })).toBeVisible()
  await expect(quiz.getByText('1/3 câu đúng')).toBeVisible()
  await questions.nth(2).getByRole('radio', { name: 'Dùng cấu hình môi trường' }).check()
  await questions.nth(2).getByRole('button', { name: 'Kiểm tra' }).click()
  await expect(quiz.getByText('2/3 câu đúng')).toBeVisible()
  await quiz.getByRole('button', { name: 'Làm lại' }).click()
  await expect(quiz.getByText('0/3 câu đúng')).toBeVisible()
  await expect(quiz.getByText(explanation)).toHaveCount(0)
  await questions.nth(0).getByRole('radio', { name: 'Trình duyệt đọc được' }).check()
  await questions.nth(0).getByRole('button', { name: 'Kiểm tra' }).click()
  await expect(questions.nth(0).getByText('Chính xác', { exact: true })).toBeVisible()
  await expect(quiz.getByText('1/3 câu đúng')).toBeVisible()
  await page.reload()
  await expect(quiz.getByText('0/3 câu đúng')).toBeVisible()
  await expect(quiz.locator('input:checked')).toHaveCount(0)
})

test('v2: bài tập đủ bước, tick cục bộ, kết quả và sao chép prompt', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async (text: string) => { document.documentElement.dataset.copiedPrompt = text },
    }, configurable: true })
  })
  await page.goto('/concepts/v2-lesson')
  const exercise = page.getByRole('region', { name: /Bài tập thực hành/ })
  await expect(exercise.getByText('Rà soát khóa giả trong nhánh thử, không đụng dữ liệu thật.')).toBeVisible()
  await expect(exercise.getByRole('heading', { name: 'Việc cần làm', exact: true })).toBeVisible()
  await expect(exercise.getByRole('checkbox')).toHaveCount(3)
  for (const step of ['Tạo nhánh thử.', 'Tìm tên biến công khai.', 'Ghi lại vị trí cần sửa.']) {
    await expect(exercise.getByRole('checkbox', { name: step, exact: true })).toBeVisible()
  }
  const first = exercise.getByRole('checkbox').first()
  await first.check()
  await expect(first).toBeChecked()
  await expect(exercise.getByRole('heading', { name: 'Kết quả đúng', exact: true })).toBeVisible()
  await expect(exercise.getByText('Danh sách chỉ có tên biến và vị trí, không có giá trị khóa.')).toBeVisible()
  await expect(exercise.getByRole('heading', { name: 'Nhờ AI rà lại', exact: true })).toBeVisible()
  await exercise.getByRole('button', { name: 'Sao chép' }).click()
  await expect(exercise.getByText('Đã chép')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-copied-prompt', 'Rà lại danh sách trên nhánh thử. Chỉ báo cáo, không tự sửa.')
  await page.reload()
  await expect(first).not.toBeChecked()
})

test('v2: bàn phím, vùng chạm và giao diện tối', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/concepts/v2-lesson')
  const quiz = page.getByRole('region', { name: /Trắc nghiệm/ })
  const first = quiz.getByRole('group').first()
  const radio = first.getByRole('radio').first()
  await radio.focus()
  await page.keyboard.press('Space')
  await expect(radio).toBeChecked()
  await page.keyboard.press('ArrowDown')
  await expect(first.getByRole('radio').nth(1)).toBeChecked()
  await page.keyboard.press('Tab')
  await expect(first.getByRole('button', { name: 'Kiểm tra' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(first.getByText('Chính xác', { exact: true })).toBeVisible()
  const exercise = page.getByRole('region', { name: /Bài tập thực hành/ })
  const checkbox = exercise.getByRole('checkbox').first()
  await checkbox.focus()
  await page.keyboard.press('Space')
  await expect(checkbox).toBeChecked()
  for (const section of [quiz, exercise]) {
    for (const target of await section.locator('label, button').all()) {
      const box = await target.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  }
  await expect(quiz.locator('fieldset').first()).toHaveCSS('background-color', 'rgb(23, 31, 44)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
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
