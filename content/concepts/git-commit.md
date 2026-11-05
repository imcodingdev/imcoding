---
id: git-commit
title: Lưu phiên bản bằng Git (Git Commit)
group: ai-git
prerequisites: []
priority: 1
stage: 1
signals:
  - ".git"
  - ".gitignore"
  - "git commit"
  - "git status"
  - "git log"
---

## Giải thích đời thường

Khi sửa sang cửa hàng, một chủ tiệm cẩn thận sẽ **chụp ảnh hiện trạng** sau mỗi đợt thay đổi và ghi chú bên dưới: "Ngày 3/11: dời quầy thu ngân ra cửa". Nếu cách bày mới làm khách khó đi, ông có thể nhìn lại ảnh cũ và đưa mọi thứ về như trước. Cuốn album đó còn cho biết ai đổi gì, khi nào, vì sao.

**Git** là cuốn album đó cho mã nguồn. Mỗi **commit** là một tấm ảnh chụp toàn bộ dự án tại một thời điểm, kèm lời ghi chú. Trước khi chụp, bạn chọn những thay đổi nào sẽ vào ảnh (`git add`), rồi chụp (`git commit`).

Với người làm phần mềm bằng AI, Git là **lưới an toàn** quan trọng nhất. AI có thể sửa hai mươi file trong một lượt và làm hỏng thứ đang chạy tốt. Nếu bạn commit mỗi khi có một bước chạy ổn, bạn luôn có điểm để quay về. Nếu không, bạn chỉ còn cách nhờ AI "sửa lại cho giống hôm qua", mà nó thì không nhớ hôm qua ra sao.

## Trong code trông như thế nào

Một vòng làm việc hằng ngày trong terminal:

```bash
git status                 # có những file nào đã đổi?
git diff                   # đổi cụ thể những dòng nào?
git add app/page.tsx       # chọn file đưa vào ảnh chụp
git commit -m "Thêm nút đặt hàng ở trang chủ"
git log --oneline          # xem lại các ảnh đã chụp
```

Bỏ những thay đổi chưa commit của một file, đưa nó về như lần commit gần nhất. **Cẩn thận:** lệnh này vứt bỏ các thay đổi chưa commit của file đó, không lấy lại được:

```bash
git restore app/page.tsx
```

File `.gitignore` liệt kê những thứ không bao giờ được chụp vào ảnh, ví dụ `node_modules` và `.env*` (thêm dòng `!.env.example` nếu muốn vẫn commit file mẫu `.env.example`).

## Hay gặp lỗi gì

- **Commit mà không xem AI đã đổi gì.** Gõ `git add .` rồi commit ngay, trong đó có cả file AI sửa nhầm. Cách nhận ra: commit có nhiều file bạn không nhớ đã nhờ sửa. Hãy chạy `git status` và `git diff` trước.
- **Lâu lắm mới commit một lần.** Một commit gồm ba ngày làm việc thì không quay lại được từng bước. Cách nhận ra: `git log` thưa thớt, mỗi commit đổi hàng chục file.
- **Lời ghi chú vô nghĩa.** "update", "fix", "abc". Cách nhận ra: đọc `git log --oneline` không biết commit nào làm gì.
- **Để AI chạy lệnh xóa không hỏi.** Lệnh như `git reset --hard` hay `git checkout .` vứt bỏ mọi thay đổi chưa commit, không lấy lại được. Cách nhận ra: AI đề xuất các lệnh này; hãy commit hoặc hỏi kỹ trước khi đồng ý.

## Tự kiểm tra

### Mở terminal trong thư mục dự án và chạy `git log --oneline`. Commit gần nhất của bạn là gì, cách đây bao lâu?

Mỗi dòng là một commit: mã ngắn ở đầu và lời ghi chú. Nếu commit gần nhất đã cách nhiều ngày làm việc, bạn đang làm mà không có lưới an toàn.

### AI vừa sửa xong và web chạy ổn. Ba lệnh nào bạn nên chạy trước khi nhờ AI làm việc tiếp?

`git status` và `git diff` để xem đã đổi gì, rồi `git add` và `git commit -m "..."` với lời ghi chú nói rõ việc vừa làm.
