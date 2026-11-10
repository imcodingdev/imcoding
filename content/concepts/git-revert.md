---
id: git-revert
title: Hoàn tác thay đổi bằng Git
group: ai-git
prerequisites: [git-commit, code-review]
priority: 1
stage: 2
format: 2
signals:
  - "git revert"
  - "git restore"
  - "git reset --hard"
  - "git log --oneline"
  - "git reflog"
---

## Nhắc lại

### Một commit trong Git lưu lại điều gì, và vì sao nên commit trước khi giao việc mới cho AI?

Commit là bản chụp toàn bộ mã nguồn tại một thời điểm, kèm lời ghi chú. Commit lúc app đang chạy tốt cho bạn một mốc chắc chắn để quay về nếu việc tiếp theo làm hỏng app.

### Khi đọc `git diff`, dòng bắt đầu bằng dấu `-` và dấu `+` nghĩa là gì?

Dấu `-` là dòng bị xóa khỏi code, dấu `+` là dòng được thêm vào. Dòng không có dấu được giữ nguyên.

## Đoán trước

Bạn nhờ một AI agent "dọn bảng khách hàng cho gọn". Agent sửa code, rồi tự chạy luôn một lệnh lên database Supabase để xóa cột `phone` vì cho rằng cột này "không còn được dùng". Bạn commit, deploy, và trang đặt hàng bắt đầu báo lỗi. Bạn bình tĩnh chạy `git revert` để đảo ngược commit đó rồi đẩy lên. Code trở về đúng như hôm qua. Nhưng trang đặt hàng vẫn lỗi, và toàn bộ số điện thoại của khách không còn. Vì sao code đã quay về bản cũ mà app vẫn hỏng?

### Đáp án

Vì Git chỉ quản lý các file trong thư mục project. Database nằm ở một nơi khác, trên máy chủ của Supabase, và Git không lưu bản chụp nào của nó. Lệnh xóa cột đã chạy thật trên database, nên `git revert` chỉ đưa code về trạng thái còn đọc cột `phone`, trong khi cột đó đã mất cùng dữ liệu bên trong. Code cũ gặp database mới nên vẫn lỗi. Dữ liệu chỉ lấy lại được từ bản sao lưu (backup) của database, nếu có. Năm 2025 từng có vụ một agent của Replit xóa database thật trong lúc đang đóng băng code, theo tường thuật của người dùng. Trong những vụ như vậy, không lệnh Git nào cứu được dữ liệu.

## Ví dụ mẫu

Hãy nghĩ về sổ quỹ của cửa hàng. Ghi nhầm một khoản, kế toán cẩn thận không xé trang đó đi. Họ ghi thêm một dòng điều chỉnh ngược lại, để ai xem sổ cũng thấy đã có khoản nhầm và đã được sửa. Xé trang thì sổ trông sạch hơn, nhưng mất dấu vết và có thể xé nhầm cả những dòng đúng.

Git có ba cách hoàn tác, khác nhau đúng ở chỗ đó:

- `git restore <file>`: bỏ các thay đổi **chưa commit** của một file, đưa file về bản commit gần nhất.
- `git revert <mã commit>`: tạo một **commit mới** làm ngược lại một commit cũ. Lịch sử giữ nguyên, giống dòng điều chỉnh trong sổ.
- `git reset --hard <mã commit>`: đưa cả project lùi về một commit cũ, **bỏ đi** các commit sau đó và mọi thay đổi chưa commit. Đây là xé trang.

Cách làm ĐÚNG khi AI vừa làm hỏng app:

```bash
git status                         # 1. Xem đang có gì dở dang
git restore app/checkout/page.tsx  # 2a. Chưa commit: bỏ thay đổi của file này
git log --oneline -n 5             # 2b. Đã commit: tìm mã của commit gây lỗi
git revert --no-edit a1b2c3d       # 3. Tạo commit mới đảo ngược commit a1b2c3d
git log --oneline -n 3             # 4. Thấy thêm dòng: Revert "..."
git push                           # 5. Đẩy lên để Vercel deploy lại bản đã hoàn tác
```

Cách làm NGUY HIỂM mà AI hay đề xuất khi bạn nói "quay lại như cũ đi":

```bash
# Lùi 3 commit và xóa mọi thay đổi chưa commit, không hỏi lại
git reset --hard HEAD~3
# Ghi đè lịch sử trên GitHub bằng lịch sử đã cắt
git push --force
# Với thay đổi chưa commit, lệnh này không có đường lùi vì ___
```

Một lưu ý cho `git restore`: nó cũng xóa hẳn phần thay đổi chưa commit của file đó. Hãy chắc rằng bạn muốn bỏ phần đó trước khi chạy.

## Tìm trong project của bạn

1. **Kiểm tra bạn có mốc để quay về không.** Chạy `git log --oneline -n 10`. Mỗi dòng là một commit với mã 7 ký tự ở đầu. Có nhiều commit nhỏ với lời ghi rõ ràng là ổn. Chỉ có một hai commit khổng lồ kiểu "update" thì hoàn tác sẽ kéo theo cả những phần đang tốt.
2. **Kiểm tra trạng thái hiện tại.** Chạy `git status`. Dòng `nothing to commit, working tree clean` nghĩa là không có gì dở dang. Nếu có file đang thay đổi, bạn cần quyết định giữ hay bỏ trước khi hoàn tác bất cứ thứ gì.
3. **Tìm dấu vết các lệnh nguy hiểm.** Tìm trong lịch sử chat với AI và trong các file hướng dẫn (`AGENTS.md`, `CLAUDE.md`, `README.md`) các chuỗi `reset --hard`, `push --force`, `push -f`, `git clean`. Nếu AI từng tự chạy các lệnh này mà không hỏi, hãy thêm quy định cấm vào file hướng dẫn.
4. **Tìm các lần hoàn tác trước đây.** Chạy `git log --oneline --grep="Revert"`. Mỗi kết quả là một lần hoàn tác bằng `git revert`, lịch sử còn nguyên để xem lại.
5. **Xác định phần Git không hoàn tác được.** Mở thư mục `supabase/migrations` nếu có. Mỗi file ở đó là một thay đổi cấu trúc database. Hoàn tác file này trong Git không làm database tự quay lại. Tiếp theo, mở trang quản trị Supabase, tìm mục sao lưu của database và ghi lại gói của bạn có sao lưu tự động hay không.
6. **Ghi lại:**
   - Commit gần nhất mà bạn chắc app chạy tốt: `[mã commit, lời ghi]`
   - `git status` hiện tại: `[sạch / còn ... file dở dang]`
   - AI có từng tự chạy `reset --hard` hoặc `push --force` không: `[Có / Không / Chưa rõ]`
   - Database có bản sao lưu không, gần nhất khi nào: `[...]`

## Tự giải thích

### Vì sao `git revert` an toàn hơn `git reset --hard` khi commit lỗi đã được đẩy lên GitHub?

`git revert` chỉ thêm một commit mới nên lịch sử trên máy bạn và trên GitHub vẫn khớp nhau, chỉ cần `git push` bình thường. Nếu đổi ý, bạn hoàn tác chính commit revert đó. `git reset --hard` cắt bỏ commit khỏi lịch sử ở máy bạn, khiến máy bạn lệch với GitHub và phải `push --force` để ghi đè. Việc ghi đè đó có thể làm mất công việc của người khác hoặc của chính bạn ở máy khác.

### Hoàn tác code xong, những thứ gì vẫn không quay về trạng thái cũ?

Mọi thứ nằm ngoài thư mục project: cấu trúc và dữ liệu trong database, biến môi trường đã sửa trên Vercel, email đã gửi cho khách, tiền đã thu qua cổng thanh toán, file đã bị xóa trong kho lưu trữ. Mỗi thứ có cách khôi phục riêng, và có thứ không khôi phục được.

### Vì sao nên commit ngay trước khi giao một việc mới cho AI?

Vì khi đó mọi thay đổi của AI đều là thay đổi chưa commit so với một mốc sạch. Nếu kết quả hỏng, bạn bỏ chúng bằng `git restore` mà không ảnh hưởng tới thứ gì khác. Nếu để thay đổi cũ chưa commit trộn với thay đổi mới, bạn không tách được phần nào cần giữ, phần nào cần bỏ.

## Trắc nghiệm

### AI vừa sửa 3 file, bạn chưa commit, và trang chủ bị vỡ bố cục. Bạn muốn bỏ thay đổi ở riêng file `app/page.tsx`. Lệnh nào phù hợp?

- [ ] `git revert app/page.tsx`
- [ ] `git reset --hard`
- [x] `git restore app/page.tsx`

**Giải thích:** `git restore <file>` đưa một file về bản commit gần nhất và không đụng tới file khác. `git revert` làm việc với commit, không phải với file chưa commit. `git reset --hard` bỏ thay đổi của cả ba file, kể cả hai file bạn có thể muốn giữ.

### Bạn nói với AI "app hỏng rồi, quay về bản hôm qua". AI trả lời như sau. Bạn nên làm gì?

```text
Tôi sẽ chạy: git reset --hard HEAD~4 && git push --force
```

- [ ] Đồng ý, vì đây là cách nhanh nhất và lịch sử sẽ sạch hơn
- [x] Dừng lại; yêu cầu chỉ ra commit nào gây lỗi và dùng `git revert` cho commit đó, không ghi đè lịch sử
- [ ] Đồng ý, nhưng dặn AI sao lưu thư mục project trước
- [ ] Tự chạy lệnh đó thay AI để chắc chắn nó được thực hiện đúng

**Giải thích:** Lệnh này bỏ 4 commit gần nhất, xóa mọi thay đổi chưa commit và ghi đè lịch sử trên GitHub. Trong 4 commit đó có thể có ba commit tốt. `git revert` chỉ đảo ngược đúng commit lỗi và để lại dấu vết. Sao lưu thư mục không giải quyết việc lịch sử trên GitHub bị ghi đè.

### Sau khi chạy `git revert --no-edit a1b2c3d`, `git log --oneline` hiện như sau. Điều gì đã xảy ra?

```text
f9e8d7c Revert "Thêm giảm giá theo nhóm khách"
a1b2c3d Thêm giảm giá theo nhóm khách
7c6b5a4 Sửa lỗi hiển thị giỏ hàng
```

- [x] Có thêm một commit mới làm ngược lại `a1b2c3d`; commit `a1b2c3d` vẫn nằm trong lịch sử
- [ ] Commit `a1b2c3d` đã bị xóa vĩnh viễn khỏi Git
- [ ] Cả `a1b2c3d` và `7c6b5a4` đều đã bị hoàn tác

**Giải thích:** `git revert` không xóa gì. Nó thêm commit `f9e8d7c` có nội dung ngược với `a1b2c3d`, nên code hiện tại giống như lúc ở `7c6b5a4`. Commit sửa giỏ hàng không bị ảnh hưởng vì bạn chỉ revert một commit.

### Commit hôm qua của AI gồm cả code lẫn một file migration thêm cột `discount` vào bảng `orders`, và migration đã được chạy lên database thật. Bạn `git revert` commit đó. Trạng thái nào đúng?

- [ ] Code và database cùng quay về như trước, vì migration nằm trong commit
- [ ] Database quay về như trước, còn code giữ nguyên
- [ ] `git revert` sẽ báo lỗi vì commit có chứa migration
- [x] Code và file migration trong project quay về như trước; cột `discount` vẫn còn trên database

**Giải thích:** Git chỉ hoàn tác file. File migration biến mất khỏi project, nhưng thay đổi nó đã gây ra trên database thì vẫn ở đó. Muốn bỏ cột phải có một thay đổi database riêng, được xem xét cẩn thận. Với cột bị xóa thì còn nặng hơn: dữ liệu chỉ lấy lại được từ bản sao lưu.

## Kiểm tra không dùng AI

### Tình huống: Sáng thứ Hai bạn deploy commit `d4e5f6a` do AI viết để đổi cách tính phí ship. Đến trưa, khách báo phí ship bị tính gấp đôi. Từ sáng tới giờ bạn đã có thêm 2 commit khác đang chạy tốt, và trên máy còn một file sửa dở chưa commit. AI đề xuất `git reset --hard` về commit tối Chủ nhật. Hãy nêu trình tự bạn làm và lý do.

#### Đáp án

1. **Từ chối `reset --hard`.** Lệnh đó bỏ cả 2 commit tốt và xóa file đang sửa dở. Commit lỗi đã ở trên GitHub nên còn phải ghi đè lịch sử.
2. **Xử lý phần dở dang.** Chạy `git status`. Hoàn thành và commit file đang sửa nếu nó đã ổn, hoặc tạm cất bản sao của file ra ngoài project. Lý do: `git revert` cần bắt đầu từ trạng thái sạch để không trộn lẫn.
3. **Hoàn tác đúng commit lỗi.** Chạy `git revert --no-edit d4e5f6a`. Hai commit sau đó được giữ nguyên. Nếu Git báo xung đột (conflict), dừng lại và nhờ AI giải thích trước khi làm tiếp.
4. **Kiểm tra rồi đẩy lên.** Chạy app ở máy, thử lại cách tính phí ship theo tiêu chí, rồi `git push` để Vercel deploy lại.
5. **Xử lý phần Git không hoàn tác được.** Các đơn đã bị tính gấp đôi từ sáng tới trưa vẫn nằm trong database và tiền đã thu của khách. Lập danh sách các đơn đó để hoàn tiền. Hoàn tác code không sửa được những đơn này.

## Lỗi suy luận hay gặp

### "Có Git rồi thì cái gì cũng hoàn tác được"

- **Vì sao sai:** Git chỉ biết về các file đã được commit trong project. Database, biến môi trường trên Vercel, email đã gửi, tiền đã thu đều nằm ngoài tầm của nó.
- **Cách sửa:** Trước khi cho AI chạy bất kỳ lệnh nào lên database thật, hỏi: nếu sai thì khôi phục bằng gì? Câu trả lời phải là một bản sao lưu cụ thể, không phải "git revert".

### "`reset --hard` và `revert` giống nhau, đều là quay về bản cũ"

- **Vì sao sai:** `revert` thêm một commit đảo ngược và giữ nguyên lịch sử. `reset --hard` cắt bỏ lịch sử và xóa luôn thay đổi chưa commit, phần này không lấy lại được.
- **Cách sửa:** Mặc định dùng `git restore` cho thay đổi chưa commit và `git revert` cho commit đã có. Ghi vào file hướng dẫn cho AI: không chạy `reset --hard` hay `push --force` khi chưa được bạn đồng ý rõ ràng.

### "Hoàn tác xong là sự cố đã được xử lý"

- **Vì sao sai:** Hoàn tác chỉ dừng việc gây thêm thiệt hại. Những gì đã xảy ra trong lúc bản lỗi chạy, như đơn tính sai hay dữ liệu ghi sai, vẫn còn đó.
- **Cách sửa:** Sau khi hoàn tác, làm thêm hai việc: kiểm tra app theo tiêu chí, và rà dữ liệu phát sinh trong khoảng thời gian bản lỗi hoạt động.

## Bài tập thực hành

Mục tiêu: tập `git restore` và `git revert` trên một file thử vô hại, để khi có sự cố thật bạn đã quen tay. Bài tập không đẩy gì lên GitHub và không đụng tới database.

### Việc cần làm

1. Chạy `git status`. Chỉ làm tiếp khi kết quả là `working tree clean`.
2. Tạo file `thu-hoan-tac.txt` ở thư mục gốc với một dòng chữ bất kỳ. Chạy `git add thu-hoan-tac.txt` rồi `git commit -m "Thử: thêm file tập hoàn tác"`.
3. Mở file, thêm một dòng thứ hai, lưu lại. Chạy `git diff` để thấy dòng `+`. Sau đó chạy `git restore thu-hoan-tac.txt` và mở file xem dòng thứ hai còn không.
4. Chạy `git log --oneline -n 3`, chép mã của commit vừa tạo ở bước 2.
5. Chạy `git revert --no-edit <mã commit đó>`.
6. Chạy lại `git log --oneline -n 3` và kiểm tra file `thu-hoan-tac.txt` có còn trong thư mục không.

### Kết quả đúng

Sau bước 3, dòng thứ hai biến mất và `git status` sạch. Sau bước 5, lịch sử có thêm một dòng bắt đầu bằng `Revert`, commit ở bước 2 vẫn còn trong danh sách, và file `thu-hoan-tac.txt` không còn trong thư mục. Các file khác của project không thay đổi. Hai commit thử này chỉ nằm ở máy bạn và không ảnh hưởng tới app.

### Nhờ AI rà lại

```text
Hãy đọc kết quả `git status` và `git log --oneline -n 15` của project.
Chỉ báo cáo, không chạy lệnh nào làm thay đổi file hay lịch sử Git:
1. Có thay đổi nào chưa commit không, ở những file nào.
2. Nếu phải hoàn tác commit gần nhất thì dùng lệnh gì, ảnh hưởng tới đâu.
3. Trong 15 commit này, commit nào có thay đổi database (migration)
   mà git revert sẽ không hoàn tác được trên database thật.
```
