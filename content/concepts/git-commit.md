---
id: git-commit
title: Lưu phiên bản bằng Git (Git Commit)
group: ai-git
prerequisites: []
priority: 1
stage: 1
format: 2
signals:
  - ".git"
  - ".gitignore"
  - "git commit"
  - "git status"
  - "git log"
---

## Đoán trước

Chiều nay, trang thanh toán của bạn đã chạy trơn tru. Bạn bảo AI: "Làm giao diện đẹp hơn và thêm hiệu ứng chuyển trang nhé". AI sửa một mạch 18 file. Khi mở lại web thì màn hình trắng xóa, báo lỗi đỏ rực. Bạn bảo AI quay lại như 10 phút trước, nhưng AI càng sửa càng phát sinh lỗi mới vì không nhớ code lúc chạy tốt trông thế nào. Suốt 3 ngày qua, bạn chưa chạy lệnh `git commit` lần nào. Vì sao bạn không thể lấy lại trang thanh toán lúc chiều?

### Đáp án

Vì dự án chỉ lưu trạng thái hiện tại trên ổ cứng chứ không tự nhớ lịch sử từng mốc chạy tốt. Khi bạn chưa chạy `git commit` để chụp lại phiên bản lúc trang thanh toán ổn định, việc AI ghi đè 18 file đã xóa mất code cũ. Không có bản chụp (`commit`), cả bạn lẫn AI đều không có mốc chuẩn để khôi phục.

## Ví dụ mẫu

Khi sửa cửa hàng, người chủ cẩn thận sẽ **chụp ảnh hiện trạng** sau mỗi đợt thay đổi hoàn chỉnh và ghi chú: *"Ngày 5/11: Lắp xong quầy thu ngân"*. Nếu đợt trang trí tiếp theo làm hỏng bố cục, chủ tiệm chỉ cần nhìn ảnh để xếp lại như cũ.

Trong lập trình, **Git** là cuốn album lịch sử đó, và mỗi **commit** là một tấm ảnh chụp toàn bộ mã nguồn tại một thời điểm kèm ghi chú. Với founder làm sản phẩm cùng AI, `git commit` là **lưới an toàn** quan trọng nhất: mỗi khi một tính năng chạy ổn, bạn chụp một tấm ảnh trước khi giao việc mới cho AI.

Dưới đây là quy trình kiểm tra và chụp phiên bản trong terminal sau khi AI sửa code:

```bash
# 1. Xem AI vừa đụng vào những file nào
git status
# 2. Xem chi tiết từng dòng AI vừa thêm (+) hoặc xóa (-)
git diff
# 3. Đưa các file đã kiểm tra vào khung ngắm để chuẩn bị chụp
git add app/page.tsx components/OrderButton.tsx
# 4. Chụp phiên bản kèm lời ghi chú rõ ràng vì ___
git commit -m "Thêm nút đặt hàng ở trang chủ"
# 5. Xem lại danh sách các mốc phiên bản đã chụp
git log --oneline
```


Dự án cũng luôn cần file `.gitignore` để dặn Git những thứ **không đưa vào ảnh chụp**, nhất là thư mục thư viện (`node_modules`) và file chứa khóa bí mật (`.env*`):

```gitignore
# File: .gitignore
node_modules/
.env*
!.env.example
```

## Tìm trong project của bạn

Báo cáo GitGuardian 2025 ghi nhận 23.770.171 secret (khóa bí mật) mới bị lộ trên GitHub công khai năm 2024; các kho mã dùng công cụ gợi ý AI như Copilot có tỷ lệ lộ 6,4%, cao hơn khoảng 40% so với mức chung (tương quan). Nguyên nhân phổ biến là gõ `git add .` và `git commit` mà không kiểm tra `.gitignore` hay xem AI đã thêm gì. Hãy kiểm tra dự án của bạn theo 4 bước:

1. Mở file `.gitignore` ở thư mục gốc, kiểm tra xem đã có dòng `.env` hoặc `.env*` chưa.
2. Mở terminal tại thư mục dự án, chạy `git status` xem có bao nhiêu file đang thay đổi mà chưa được chụp lại.
3. Chạy `git log --oneline -n 5` để xem 5 lần chụp phiên bản gần nhất.
4. Điền thông tin thực tế của dự án:
   - **File `.gitignore` đã chặn `.env*` chưa:** `Đã chặn / Chưa có`
   - **Số file đang thay đổi dở dang khi gõ `git status`:** `____________________`
   - **Nội dung dòng trên cùng của `git log --oneline`:** `____________________`
   - **Lần commit gần nhất cách đây bao lâu:** `____________________`

Kiểm tra thêm `git diff --cached --name-only` để xem tên file sắp commit, rồi `git diff --cached -- <file-code-đã-chọn>` để đọc đúng phần đã đưa vào khung chụp. Ổn: chỉ các file thuộc yêu cầu, không có `.env.local`. Có vấn đề: file bí mật xuất hiện trong danh sách, hoặc file có cả thay đổi đã stage và chưa stage. Không mở nội dung file bí mật để chụp ảnh gửi AI; dừng commit và xử lý riêng.

## Tự giải thích

### Vì sao phải chạy `git status` và `git diff` trước khi `git commit`, thay vì gõ `git add .` rồi commit luôn?

Vì AI thường tự sửa thêm file ngoài yêu cầu, để sót mã thử nghiệm hoặc tạo file chứa thông tin nhạy cảm. Chạy `git status` và `git diff` giúp bạn xác nhận chính xác file nào và dòng nào đã đổi, tránh đưa nhầm file lỗi hoặc khóa bí mật vào lịch sử Git.

### Nếu gộp 3 ngày làm việc cùng AI vào một lần `git commit -m "update"`, bạn sẽ gặp khó khăn gì khi web hỏng ở ngày thứ 3?

Bạn mất khả năng quay lùi từng bước nhỏ. Nếu quay về commit trước đó, bạn mất trắng công sức 3 ngày; nếu giữ nguyên thì không tách được lỗi nằm ở lượt sửa nào. Chữ `"update"` cũng không cho biết mốc đó chứa tính năng gì.

### Vì sao trong `.gitignore` thường chặn `.env*` nhưng lại thêm dòng `!.env.example`?

Dòng `.env*` chặn mọi file môi trường chứa khóa bí mật thật (`.env`, `.env.local`) khỏi bị lộ khi đẩy code lên mạng. Dấu chấm than trong `!.env.example` nghĩa là "ngoại trừ file mẫu này": `.env.example` chỉ chứa tên biến trống (như `OPENAI_API_KEY=sk-proj-XXXX...`) để nhắc dự án cần biến nào mà không chứa khóa thật, nên cần lưu vào Git.

## Trắc nghiệm

### Sau khi AI sửa giao diện, terminal hiện như sau. Commit tiếp theo chứa gì?

```text
Changes to be committed: app/page.tsx
Changes not staged for commit: app/globals.css
```

- [x] Phần đã stage của `app/page.tsx`
- [ ] Tất cả thay đổi trong cả hai file
- [ ] Chỉ file được sửa gần nhất

**Giải thích:** Commit lấy nội dung đã stage. File CSS còn ở phần chưa stage không tự được thêm chỉ vì cùng một yêu cầu của AI.

### Bạn đã git add một file, rồi AI sửa tiếp file đó. Cách xem đúng bản sắp commit là gì?

- [ ] Chỉ mở file hiện tại trong trình soạn thảo
- [ ] Chỉ chạy `git diff` là đủ
- [x] Chạy `git diff --cached -- <tên-file>`

**Giải thích:** `--cached` xem phần đã stage so với commit trước. File trên ổ đĩa có thể chứa sửa đổi mới chưa stage, còn `git diff` mặc định xem phần chưa stage.

### AI báo “commit thành công là đồng đội đã có bản mới”. Bạn chọn nhận định nào?

- [ ] Đúng vì Git tự đồng bộ sau mỗi commit
- [x] Commit lưu mốc tại máy này; chia sẻ qua remote là bước riêng
- [ ] Muốn lưu mốc local cũng bắt buộc có Internet

**Giải thích:** Commit làm việc cục bộ. Có remote không đồng nghĩa mỗi commit tự được gửi lên đó.

### Trên nhánh thử sạch, bạn muốn đảo tác dụng một commit thử nhưng giữ dấu vết. Chọn cách nào?

- [x] `git revert <mã-commit-thử>` tạo commit đảo thay đổi
- [ ] Sửa lời nhắn commit là code sẽ quay lại
- [ ] Xóa file `.git` rồi tạo lại lịch sử

**Giải thích:** Revert ghi thêm mốc đảo thay đổi và giữ lịch sử. Đổi lời nhắn không đổi code; xóa `.git` làm mất lịch sử cục bộ.

## Kiểm tra không dùng AI

### Tình huống: Bạn vừa commit xong tính năng "Đăng nhập", rồi nhờ AI làm tiếp "Đổi mật khẩu". AI sửa xong nhưng làm hỏng luôn trang Đăng nhập, liền đề xuất chạy `git reset --hard HEAD~3` trong terminal. Hãy chỉ ra rủi ro của lệnh này và nêu cách xử lý đúng kèm lý do.

#### Đáp án

- **Rủi ro nghiêm trọng:** `git reset --hard` xóa sạch mọi thay đổi chưa commit, và `HEAD~3` còn lùi lịch sử về tận 3 commit trước đó, tức là **xóa mất luôn cả bản commit "Đăng nhập" vừa làm xong** cùng 2 mốc trước đó.
- **Cách xử lý đúng và lý do:** Từ chối chạy `git reset --hard HEAD~3`. Vì tính năng "Đăng nhập" đã được commit ở mốc gần nhất, chỉ cần chạy `git status` xem các file vừa bị sửa hỏng ở lượt "Đổi mật khẩu", rồi dùng `git restore <tên-file>` để hủy phần sửa hỏng mà vẫn giữ nguyên mốc "Đăng nhập".

## Lỗi suy luận hay gặp

### "Cứ để AI tự chạy mọi lệnh Git trong terminal cho nhanh, mình không cần nhìn"

- **Vì sao sai:** Khi gặp lỗi khó, AI hay chọn cách xóa lịch sử hoặc xóa thay đổi chưa lưu bằng `git reset --hard`, `git checkout .`, hoặc `git clean -fd`. Dù đã dặn bằng lời, AI vẫn có thể làm trái — tương tự sự cố Replit năm 2025 khi agent xóa cơ sở dữ liệu thật dù đã được dặn không sửa.
- **Cách sửa:** Tự kiểm tra kỹ từng lệnh Git trước khi đồng ý, đặc biệt cảnh giác với `reset --hard`, `restore`, `clean`, hoặc `push --force`.

### "Chừng nào làm xong hết cả dự án rồi mới cần `git commit` một thể để đẩy lên mạng"

- **Vì sao sai:** Mục đích lớn nhất của `git commit` khi làm với AI là tạo các điểm neo an toàn cách nhau mỗi 15–30 phút. Chờ đến cuối dự án mới commit đồng nghĩa với việc làm việc không có phanh bảo hiểm trong suốt quá trình AI sửa code.
- **Cách sửa:** Cứ xong một yêu cầu nhỏ và bấm thử thấy chạy đúng, hãy commit ngay rồi mới giao việc tiếp theo cho AI.

### "Đã lỡ commit file `.env` chứa khóa thật vào Git rồi thì chỉ cần thêm `.env` vào `.gitignore` là an toàn"

- **Vì sao sai:** `.gitignore` chỉ ngăn các file **chưa từng** được Git theo dõi. Khi `.env` đã nằm trong một `commit` trước đó, lịch sử Git vẫn giữ nguyên khóa bí mật; ai xem lại lịch sử kho mã đều lấy được.
- **Cách sửa:** Nếu lỡ commit khóa bí mật, phải vào ngay trang quản trị dịch vụ (OpenAI, Supabase, Stripe...) để **hủy khóa cũ và tạo khóa mới**, sau đó mới xóa file khỏi Git.

## Bài tập thực hành

Tạo và đảo một commit chỉ chứa ghi chú giả trên nhánh thử, không đụng mã ứng dụng hay dữ liệu thật.

### Việc cần làm

1. Chạy `git status`; chỉ tiếp tục nếu cây làm việc sạch. Ghi nhánh hiện tại bằng `git branch --show-current`; nếu đang detached HEAD thì dừng để tìm hiểu trước.
2. Tạo nhánh mới bằng `git switch -c lesson-git-practice`. Nếu tên đã có, chọn tên mới, không ghi đè nhánh cũ.
3. Tạo file mới `lesson-git-practice.txt` với câu “Ghi chú thử”; nếu file đã có thì chọn tên khác. Chỉ stage file đó, xem `git diff --cached` và commit với lời nhắn “Thêm ghi chú thử”.
4. Lấy mã commit vừa tạo bằng `git log -1 --oneline`, chạy `git revert --no-edit <mã-vừa-ghi>`. Nếu có xung đột, dừng, không dùng lệnh ép hoặc reset.
5. Xem `git log -2 --oneline`, `git status`, rồi quay về nhánh ban đầu bằng `git switch <tên-nhánh>`. Giữ nhánh thử để đối chiếu; không push.

### Kết quả đúng

Nhánh thử có hai commit: thêm ghi chú và đảo thay đổi. File thử không còn sau revert, cây làm việc sạch, mã ứng dụng không đổi. Đây là đảo thay đổi đã chủ động tạo cho bài tập, không phải xóa công việc đang làm.

### Nhờ AI rà lại

```text
Đọc kết quả git status và hai commit thử tôi cung cấp. Chỉ báo cáo, không tự sửa, không chạy lệnh Git. Xác nhận chỉ file ghi chú thử thay đổi và commit đảo giữ lại lịch sử. Không đề xuất reset --hard hoặc push.
```
