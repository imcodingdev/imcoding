---
id: code-review
title: Đọc và kiểm chứng thay đổi code
group: ai-git
prerequisites: [git-commit, automated-tests, ai-task-context]
priority: 1
stage: 2
format: 2
signals:
  - "git diff"
  - "git diff --stat"
  - "@@"
  - "files changed"
  - "git status"
---

## Nhắc lại

### Vì sao "toàn bộ test pass" chưa đủ để kết luận thay đổi của AI là đúng?

Vì test chỉ kiểm tra những gì đã được viết thành test. Tính năng mới có thể chưa có bài nào, và chính file test có thể đã bị AI sửa, làm yếu hoặc tắt đi để hết đỏ.

### Một lần giao việc tốt cho AI cần nêu những gì về phạm vi?

Những file được phép sửa và những phần không được đụng. Sau khi AI làm xong, bạn so danh sách file thay đổi với phạm vi này.

## Đoán trước

Bạn nhờ Cursor thêm nút "Xuất danh sách đơn hàng ra Excel" cho trang quản trị. AI báo: "Đã thêm nút xuất Excel. Toàn bộ test pass. Tôi đã tự rà lại code, không phát hiện vấn đề nào." Bạn bấm thử, file Excel tải về đẹp, nên bạn commit và deploy. Hai tuần sau, một người lạ gửi cho bạn file chứa tên, số điện thoại và địa chỉ của toàn bộ khách hàng. Họ lấy được bằng cách mở thẳng đường dẫn `/api/orders/export` mà không cần đăng nhập. Mở lại thay đổi hôm đó, bạn thấy AI đã xóa hai dòng kiểm tra đăng nhập trong lúc "sắp xếp lại code". Vì sao lần tự rà của AI không phát hiện ra điều này?

### Đáp án

Vì người viết và người chấm là một. Khi tự rà, AI đọc lại code với đúng những giả định nó đã dùng lúc viết, nên chỗ nó cho là ổn thì lần đọc lại vẫn thấy ổn. Câu "không phát hiện vấn đề" cũng không cho biết nó đã đối chiếu với tiêu chí nào. Còn bạn chỉ thử một trường hợp: đang đăng nhập bằng tài khoản quản trị và bấm nút. Hai dòng bị xóa nằm ngay trong `git diff`, có dấu `-` ở đầu. Chỉ cần đọc diff và thử mở đường dẫn khi chưa đăng nhập là thấy. OWASP Top 10 2021 xếp Broken Access Control (kiểm soát truy cập bị hỏng) ở hạng 1, và đây là một ví dụ điển hình.

## Ví dụ mẫu

Kế toán đưa bạn ký một lệnh chuyển tiền. Bạn không ký vì họ nói "em kiểm tra kỹ rồi". Bạn nhìn số tiền, tên người nhận, đối chiếu với hóa đơn rồi mới ký. **Code review** (rà soát thay đổi code) là bước nhìn đó: đọc phần thay đổi và đối chiếu với tiêu chí trước khi commit. Phần thay đổi được Git hiển thị dưới dạng **diff**, tức bản so sánh giữa code cũ và code mới.

Bạn không cần hiểu từng dòng. Bạn cần trả lời bốn câu hỏi: file nào bị đổi, có nằm trong phạm vi không? Dòng nào bị xóa, có phải là một bước kiểm tra không? Có thay đổi nào tôi không yêu cầu không? Từng tiêu chí nghiệm thu đã đạt chưa, do chính tôi thử?

Bước một, xem tổng quan:

```text
$ git diff --stat
 app/admin/orders/page.tsx      | 12 ++++++++++
 app/api/orders/export/route.ts | 31 ++++++++++++-----------
 package.json                   |  1 +
 3 files changed, 28 insertions(+), 16 deletions(-)
```

Bước hai, mở diff của file đáng chú ý bằng `git diff app/api/orders/export/route.ts`:

```diff
 export async function GET() {
   const supabase = await createClient()
-  const { data: { user } } = await supabase.auth.getUser()
-  if (!user) return new Response('Unauthorized', { status: 401 })
   const { data } = await supabase.from('orders').select('*')
+  const file = buildExcel(data)
+  return new Response(file, { headers: excelHeaders })
 }
 // Hai dòng có dấu - cần được hỏi lại vì ___
```

Dòng bắt đầu bằng `-` là dòng bị xóa, bằng `+` là dòng được thêm, không có dấu là dòng giữ nguyên để bạn biết vị trí. Ở đây hai dòng bị xóa chứa `auth.getUser()` và `Unauthorized`. Bạn không cần biết viết Supabase để nhận ra một bước kiểm tra đăng nhập vừa biến mất.

## Tìm trong project của bạn

Đối chiếu lời báo hoàn thành với [bằng chứng "đã xong" của agent](/concepts/done-evidence) để biết tiêu chí nào đã được chạy kiểm và tiêu chí nào còn thiếu.

Làm các bước này ngay sau lần tới AI báo "đã xong", trước khi commit:

1. **Xem danh sách file.** Chạy `git status` rồi `git diff --stat`. So với phạm vi bạn đã giao. File nằm ngoài phạm vi phải có lý do. Lưu ý: `git diff` không hiện nội dung file mới tạo chưa được Git theo dõi; các file đó nằm ở mục `Untracked files` của `git status`, hãy mở chúng ra đọc trực tiếp.
2. **Đọc các file nhạy cảm trước.** Nếu danh sách có một trong các file sau thì mở diff của nó đầu tiên: `package.json` (thư viện mới), `.env*` và `.gitignore` (khóa bí mật), `middleware.ts` hoặc `proxy.ts` (chặn truy cập), thư mục `supabase/migrations` (cấu trúc database và RLS), mọi file trong `app/api/`, và các file `.test.`.
3. **Quét các dòng bị xóa.** Trong diff, tìm những dòng `-` có chứa `auth.getUser`, `if (!user)`, `401`, `403`, `role`, `policy`, `expect(`. Dòng kiểm tra bị xóa mà không có dòng `+` tương đương thay vào là có vấn đề.
4. **Quét các dòng được thêm.** Tìm những dòng `+` có `NEXT_PUBLIC_`, `service_role`, `sk-`, `console.log(`, `.skip`, `catch {}`, hoặc tên một thư viện bạn chưa nghe. Mỗi kết quả là một câu hỏi cho AI.
5. **Tự thử từng tiêu chí.** Mở app, đi qua danh sách tiêu chí nghiệm thu. Thử cả trường hợp bị cấm: chưa đăng nhập, tài khoản thường, dữ liệu sai.
6. **Ghi lại:**
   - Số file thay đổi / số file ngoài phạm vi: `[... / ...]`
   - Có dòng kiểm tra nào bị xóa không: `[Có, ở file ... / Không]`
   - Tiêu chí nào bạn đã tự thử và đạt: `[...]`
   - Câu hỏi còn treo cho AI: `[...]`

## Tự giải thích

### Vì sao phải đọc diff trước khi commit, trong khi bạn đã bấm thử và thấy tính năng chạy?

Bấm thử chỉ cho thấy điều AI thêm vào. Nó không cho thấy điều AI đã bỏ đi hoặc sửa ở nơi khác. Một bước kiểm tra đăng nhập bị xóa không làm tính năng chạy khác đi với người đang đăng nhập. Diff là nơi duy nhất liệt kê mọi thay đổi, kể cả thứ bạn không yêu cầu.

### Vì sao không nên để chính AI vừa viết code tự xác nhận rằng code đạt yêu cầu?

Lỗi thường đến từ một giả định sai, và người mang giả định đó sẽ đọc lại bằng chính giả định đó. AI cũng có xu hướng báo cáo theo hướng "đã hoàn thành". Bạn có thể dùng một phiên AI khác để rà, nhưng đó chỉ là ý kiến thứ hai để bạn có thêm câu hỏi. Người kết luận đạt hay không là bạn, dựa vào tiêu chí và việc tự thử.

### Nếu diff quá dài, bạn đọc không nổi, thì nên làm gì?

Đó là dấu hiệu việc được giao quá to. Cách xử lý là chưa commit, yêu cầu AI tách thay đổi thành các phần nhỏ theo từng mục đích, hoặc hoàn tác rồi giao lại từng phần. Commit một thay đổi mình không đọc nổi nghĩa là chấp nhận mọi thứ nằm trong đó.

## Trắc nghiệm

### Trong diff dưới đây, điều gì đã thay đổi?

```diff
-  if (order.user_id !== user.id) return forbidden()
   const { error } = await supabase
     .from('orders').delete().eq('id', orderId)
```

- [x] Bước kiểm tra "đơn này có phải của người đang đăng nhập không" đã bị xóa, nên ai đăng nhập cũng xóa được đơn của người khác
- [ ] AI thêm một bước kiểm tra chủ đơn trước khi xóa
- [ ] Không có gì thay đổi, vì các dòng không có dấu `+`

**Giải thích:** Dấu `-` là dòng bị xóa khỏi code. Dòng đó so sánh chủ đơn với người đang đăng nhập. Hai dòng còn lại không có dấu nên được giữ nguyên, nghĩa là lệnh xóa đơn vẫn chạy nhưng không còn ai gác cửa.

### Bạn giao việc "sửa chính tả trên trang Giới thiệu". Kết quả `git diff --stat` như sau. File nào cần đọc kỹ nhất?

```text
 app/gioi-thieu/page.tsx  | 4 ++--
 package.json             | 3 ++-
 package-lock.json        | 58 ++++++++++++++++++++
 3 files changed, 61 insertions(+), 3 deletions(-)
```

- [ ] `app/gioi-thieu/page.tsx`, vì đây là file chính của yêu cầu
- [ ] `package-lock.json`, vì nó có nhiều dòng thay đổi nhất
- [ ] Không cần đọc, vì sửa chính tả không gây hại
- [x] `package.json`, vì sửa chính tả không cần thêm thư viện; phải biết thư viện nào được thêm và vì sao

**Giải thích:** Một việc sửa chữ mà kéo theo thay đổi ở `package.json` là bất thường. Thư viện mới là code của người khác chạy trong app của bạn. `package-lock.json` dài vì nó được sinh tự động theo `package.json`, nên câu hỏi gốc vẫn nằm ở `package.json`.

### AI báo cáo như sau. Cách xử lý nào đúng?

```text
Đã hoàn thành. Tôi đã review lại toàn bộ thay đổi và chấm theo
6 tiêu chí của bạn: 6/6 đạt. Có thể commit.
```

- [ ] Commit, vì AI đã chấm theo đúng tiêu chí bạn đưa
- [x] Tự đọc `git diff --stat`, đọc diff các file nhạy cảm và tự thử từng tiêu chí trên app rồi mới quyết định
- [ ] Yêu cầu AI chấm lại lần nữa cho chắc, nếu vẫn 6/6 thì commit

**Giải thích:** Điểm 6/6 do chính người làm bài tự chấm. Nó không kèm bằng chứng nào và AI có thể chưa chạy thử. Chấm lại lần hai vẫn là cùng một người chấm với cùng giả định. Bằng chứng duy nhất đáng tin là thứ bạn tự thấy.

### `git status` hiện thêm phần sau. Vì sao bạn cần chú ý?

```text
Untracked files:
  app/api/debug/route.ts
  scripts/reset-db.ts
```

- [ ] Không cần chú ý, vì file chưa được theo dõi thì không ảnh hưởng tới app
- [ ] Đây là file tạm của Git, sẽ tự biến mất
- [x] Đây là file mới do AI tạo mà `git diff` không hiện nội dung; cần mở ra đọc, nhất là một API debug và một script reset database
- [ ] Chỉ cần thêm chúng vào `.gitignore` là xong

**Giải thích:** File chưa được theo dõi vẫn chạy bình thường: một file trong `app/api/` là một đường dẫn công khai mới. `git diff` mặc định không hiện nội dung các file này, nên dễ bỏ sót. Thêm vào `.gitignore` chỉ giấu chúng khỏi Git chứ không trả lời được chúng làm gì.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ Claude Code "cho phép khách sửa số điện thoại trong trang hồ sơ", phạm vi là `app/ho-so/`. AI báo xong và tự chấm "đạt". `git diff --stat` có 4 file, trong đó có file dưới đây. Hãy nêu những điều bạn thấy bất thường và việc cần làm trước khi commit.

```diff
 // supabase/migrations/20261110_profiles.sql
-create policy "own profile" on profiles
-  for update using (auth.uid() = id);
+create policy "update profile" on profiles
+  for update using (true);
```

#### Đáp án

- **Bất thường 1, ngoài phạm vi:** yêu cầu chỉ ở `app/ho-so/`, nhưng AI sửa cả một file trong `supabase/migrations`, nơi quyết định quyền truy cập dữ liệu.
- **Bất thường 2, nới quyền:** policy cũ chỉ cho sửa khi `auth.uid() = id`, tức mỗi người chỉ sửa được dòng của chính mình. Policy mới dùng `using (true)`, nghĩa là điều kiện luôn đúng. Người đã đăng nhập có thể sửa hồ sơ của bất kỳ ai. Nhiều khả năng AI gặp lỗi quyền khi thử và chọn cách nhanh nhất để hết lỗi.
- **Việc cần làm:** chưa commit và chưa chạy migration này lên database thật. Yêu cầu AI trả lại policy cũ và giải thích lỗi nó đã gặp. Yêu cầu sửa ở phần code trong phạm vi.
- **Tự kiểm sau đó:** dùng hai tài khoản thử. Tài khoản A sửa được số của mình. Tài khoản A không sửa được hồ sơ của tài khoản B. Lời tự chấm "đạt" của AI không được tính là bằng chứng.

## Lỗi suy luận hay gặp

### "Tôi không biết code nên có đọc diff cũng không hiểu"

- **Vì sao sai:** Review ở mức của founder không đòi hỏi hiểu từng dòng. Tên file, dấu `+` và `-`, cùng vài từ khóa như `auth`, `policy`, `NEXT_PUBLIC_`, `skip` đã đủ để phát hiện phần lớn thay đổi nguy hiểm.
- **Cách sửa:** Luôn bắt đầu bằng `git diff --stat`, đọc file nhạy cảm trước, và hỏi AI về từng dòng bị xóa mà bạn không rõ lý do.

### "Nhờ thêm một AI khác review là đủ, tôi không cần xem"

- **Vì sao sai:** AI thứ hai không biết quy định kinh doanh và tiêu chí của bạn trừ khi được đưa, và nó cũng có thể bỏ sót hoặc báo sai. Hai lời khẳng định không cộng lại thành bằng chứng.
- **Cách sửa:** Dùng AI thứ hai để có danh sách điểm đáng ngờ, yêu cầu nó chỉ báo cáo. Quyết định cuối vẫn dựa trên diff bạn đã xem và tiêu chí bạn đã tự thử.

### "Tính năng chạy đúng khi tôi bấm thử, vậy thay đổi này an toàn"

- **Vì sao sai:** Bạn thường thử bằng tài khoản quản trị, với dữ liệu hợp lệ, theo đúng luồng chính. Lỗi quyền truy cập và lỗi ở trường hợp sai không hiện ra trong lần thử đó.
- **Cách sửa:** Mỗi lần review, thử thêm ít nhất một trường hợp bị cấm: mở đường dẫn khi chưa đăng nhập, dùng tài khoản thường, nhập dữ liệu sai.

## Bài tập thực hành

Mục tiêu: review một thay đổi thật của AI theo đủ các bước trước khi commit.

### Việc cần làm

1. Giao cho AI một việc nhỏ có nêu phạm vi file và tiêu chí. Khi AI báo xong, chưa commit.
2. Chạy `git status` và `git diff --stat`. Viết ra danh sách file và đánh dấu file ngoài phạm vi, file mới chưa được theo dõi.
3. Mở diff từng file bằng `git diff <đường-dẫn-file>`. Ghi lại mọi dòng `-` có vẻ là một bước kiểm tra và mọi dòng `+` bạn không hiểu vì sao cần.
4. Hỏi AI về từng điểm đã ghi, yêu cầu trả lời theo số dòng cụ thể.
5. Tự thử từng tiêu chí trên bản chạy ở máy hoặc bản preview, gồm ít nhất một trường hợp bị cấm.
6. Chỉ commit khi mọi câu hỏi đã có lời giải thích bạn chấp nhận và mọi tiêu chí bạn đã tự thấy đạt.

### Kết quả đúng

Bạn có một ghi chú ngắn gồm: danh sách file, các câu hỏi đã đặt và câu trả lời, kết quả từng tiêu chí do bạn tự thử. Không còn file nào trong `git status` mà bạn không biết nó dùng để làm gì.

### Nhờ AI rà lại

```text
Hãy mở một phiên mới, đọc kết quả của `git status` và `git diff`
trong project này. Tiêu chí của thay đổi: [dán tiêu chí].
Chỉ báo cáo, không sửa file nào:
1. Thay đổi nào nằm ngoài tiêu chí hoặc không cần cho tiêu chí.
2. Dòng kiểm tra đăng nhập, quyền hoặc dữ liệu nào bị xóa hay nới lỏng.
3. Tiêu chí nào bạn không tìm thấy code tương ứng.
```
