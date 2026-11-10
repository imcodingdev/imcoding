---
id: git-branch-merge
title: Nhánh Git và hợp nhất
group: ai-git
prerequisites: [git-commit, code-review]
priority: 2
stage: 4
format: 2
signals:
  - "<<<<<<<"
  - ">>>>>>>"
  - "git merge"
  - "git switch"
  - "git checkout -b"
  - "git branch"
---

## Nhắc lại

### Vì sao nên `git commit` ngay sau mỗi yêu cầu nhỏ đã chạy đúng, thay vì để AI sửa liền nhiều việc rồi commit một lần?

Vì mỗi commit là một điểm neo để quay lại. Nếu AI làm hỏng ở việc thứ ba, bạn lùi về đúng mốc sau việc thứ hai. Gộp tất cả vào một commit thì chỉ còn hai lựa chọn: giữ cả lỗi, hoặc mất hết.

### Khi AI báo "đã sửa xong", bạn cần xem gì trước khi chấp nhận thay đổi?

Xem `git status` và `git diff` để biết chính xác file nào, dòng nào đã đổi, có thay đổi nào nằm ngoài yêu cầu không. Sau đó tự chạy thử tính năng. Lời báo "đã xong" của AI không phải bằng chứng.

## Đoán trước

Shop của bạn đang bán hàng bình thường. Bạn muốn thử giao diện thanh toán mới nên bảo AI làm thẳng trên code đang chạy, và commit từng bước cho chắc. Đến commit thứ tư thì giao diện mới còn dang dở, nút "Thanh toán" chưa nối với cổng thanh toán. Đúng lúc đó khách báo phí ship tính sai. Bạn sửa một dòng, commit, `git push`. Vài phút sau Vercel deploy xong. Phí ship đã đúng, nhưng khách bắt đầu nhắn rằng bấm "Thanh toán" không có gì xảy ra. Bạn chỉ định đẩy một dòng sửa phí ship, vì sao giao diện dang dở cũng lên theo?

### Đáp án

Vì mọi commit của bạn nằm trên cùng một **branch** (nhánh): nhánh `main`, cũng là nhánh Vercel dùng để deploy bản Production. `git push` đẩy toàn bộ các commit chưa lên của nhánh đó, gồm cả bốn commit dang dở, không riêng commit sửa phí ship. Nếu việc thử nghiệm nằm trên một nhánh riêng thì `main` vẫn sạch. Bạn sửa phí ship trên `main`, đẩy lên, còn giao diện mới chỉ được hợp nhất khi đã xong.

## Ví dụ mẫu

Chủ quán muốn đổi công thức nước sốt. Họ không đổ thử vào nồi đang bán cho khách. Họ nấu thử ở một nồi riêng trong bếp sau. Ngon thì đưa ra bán, dở thì đổ đi, nồi chính không bị ảnh hưởng.

Trong Git, **branch** là một dòng lịch sử commit riêng, tách ra từ một thời điểm của nhánh chính. Thay đổi trên nhánh thử không chạm vào `main` cho tới khi bạn **merge** (hợp nhất) nhánh đó vào `main`. Với cách thiết lập phổ biến, Vercel deploy Production từ `main`, còn mỗi nhánh khác được đẩy lên sẽ có một bản Preview với đường dẫn riêng để bạn xem thử.

Các lệnh bạn cần đọc hiểu:

```bash
git branch --show-current     # tôi đang đứng ở nhánh nào?
git switch -c thu-thanh-toan  # tạo nhánh mới từ đây và chuyển sang
git switch main               # quay về nhánh chính
git merge thu-thanh-toan      # hợp nhất nhánh thử vào nhánh đang đứng
git merge --abort             # hủy lần hợp nhất dang dở, về như trước khi merge
```

Phần lớn lần merge tự xong. **Conflict (xung đột)** xảy ra khi hai nhánh cùng sửa một chỗ theo hai cách khác nhau. Git không đoán ý bạn. Nó dừng lại và đánh dấu ngay trong file:

```ts
<<<<<<< HEAD
const SHIPPING_FEE = 30000 // bản của nhánh đang đứng (main)
=======
const SHIPPING_FEE = 25000 // bản của nhánh được hợp nhất vào
>>>>>>> thu-thanh-toan
```

Cách đọc: từ `<<<<<<< HEAD` tới `=======` là bản của nhánh bạn đang đứng. Từ `=======` tới `>>>>>>>` là bản của nhánh đang được đưa vào. Giải quyết xung đột nghĩa là chọn bản đúng (hoặc ghép cả hai), xóa ba dòng đánh dấu, rồi commit. Câu hỏi để chọn không phải "bản nào mới hơn" mà là ___ .

AI giải quyết xung đột rất nhanh, và đó là chỗ nguy hiểm. Nó hay chọn nguyên một phía cho mọi file. Phía bị bỏ có thể chứa đúng dòng sửa phí ship mà bạn vừa làm hôm qua. Không có lỗi đỏ nào hiện ra, bản sửa cũ chỉ lặng lẽ biến mất.

## Tìm trong project của bạn

1. **Xem mình đang ở đâu:** chạy `git branch --show-current`. Ổn: bạn biết trước câu trả lời. Có vấn đề: bạn tưởng đang ở nhánh thử nhưng thực ra đang ở `main`, hoặc ngược lại.
2. **Xem có những nhánh nào:** chạy `git branch -a`. Ổn: vài nhánh, tên nói rõ mục đích (`thu-thanh-toan`, `sua-phi-ship`). Có vấn đề: hàng chục nhánh do AI hoặc công cụ tự tạo mà bạn không biết nhánh nào đang chứa gì.
3. **Xem nhánh nào lên Production:** trên Vercel, mở Settings của project, tìm mục cấu hình nhánh Production (Production Branch). Ghi lại tên nhánh. Mọi thứ được đẩy lên nhánh đó sẽ tới khách.
4. **Tìm dấu xung đột còn sót:** tìm toàn dự án chuỗi `<<<<<<<` và `>>>>>>>`. Ổn: không có kết quả nào. Có vấn đề: còn bất kỳ kết quả nào trong file code. Đó là một lần merge chưa giải quyết xong, và build thường sẽ lỗi.
5. **Xem lịch sử hợp nhất:** chạy `git log --oneline --graph -15`. Tìm các dòng `Merge branch ...`. Với lần merge gần nhất, bạn có nhớ ai giải quyết xung đột và đã kiểm tra gì sau đó không?
6. **Ghi lại:**
   - Nhánh đang đứng: `[ ... ]`, nhánh Production trên Vercel: `[ ... ]`
   - Số nhánh không rõ mục đích: `[ ... ]`
   - Còn dấu xung đột trong code không: `[ Có / Không, file: ... ]`

## Tự giải thích

### Vì sao thử nghiệm trên nhánh riêng an toàn hơn commit từng bước nhỏ trên `main`?

Commit nhỏ cho bạn điểm quay lại, nhưng không ngăn được code dang dở đi cùng khi bạn `git push` nhánh `main`. Nhánh riêng tách hẳn hai dòng việc: `main` luôn ở trạng thái có thể đưa cho khách, còn nhánh thử được phép dở dang bao lâu cũng được. Bạn còn có thể bỏ cả thử nghiệm mà không phải hoàn tác từng commit.

### Vì sao Git dừng lại khi gặp xung đột, thay vì tự chọn bản mới hơn?

Vì Git chỉ so sánh chữ, không hiểu nghĩa. Nó không biết 30.000 hay 25.000 mới là phí ship đúng theo quy tắc kinh doanh của bạn. "Mới hơn" không đồng nghĩa với "đúng": bản sửa lỗi hôm qua trên `main` có thể cũ hơn một commit trên nhánh thử nhưng lại là bản phải giữ. Dừng lại là cách Git trả quyết định về cho người hiểu nghiệp vụ.

### Nếu để AI tự giải quyết mọi xung đột rồi commit luôn, bạn mất gì?

Bạn mất lần duy nhất được thấy hai nhánh mâu thuẫn ở đâu. Sau khi AI chọn xong và commit, file trông sạch sẽ, build vẫn qua, và không có gì cho biết một bản sửa đã bị bỏ. Lỗi cũ quay lại vài ngày sau, lúc không ai còn nhớ tới lần merge đó.

## Trắc nghiệm

### Trong lúc merge, `git status` in ra đoạn dưới đây. Điều này có nghĩa gì?

```text
On branch main
You have unmerged paths.
Unmerged paths:
        both modified:   lib/pricing.ts
```

- [ ] Merge đã xong, `lib/pricing.ts` chứa bản mới nhất
- [ ] File `lib/pricing.ts` đã bị hỏng, phải xóa và tạo lại
- [x] Cả hai nhánh cùng sửa `lib/pricing.ts`; merge đang dừng giữa chừng, chờ bạn quyết định giữ nội dung nào rồi commit
- [ ] Git đã tự chọn bản của `main`, chỉ cần `git push`

**Giải thích:** `both modified` cùng `unmerged paths` là dấu hiệu merge đang dừng ở một xung đột. File không hỏng: nó đang chứa cả hai phiên bản kèm dấu đánh dấu. Git chưa chọn gì thay bạn, và lần merge chưa hoàn tất cho tới khi bạn giải quyết và commit.

### AI báo: "Có xung đột ở 6 file, tôi đã giải quyết bằng cách giữ phiên bản của nhánh `thu-thanh-toan` cho tất cả." Rủi ro chính là gì?

- [x] Mọi thay đổi trên `main` ở những đoạn xung đột đều bị bỏ, kể cả bản sửa lỗi bạn đã đưa lên sau khi tách nhánh
- [ ] Không có rủi ro, vì nhánh thử là nhánh mới hơn
- [ ] Nhánh `thu-thanh-toan` sẽ bị xóa khỏi kho mã

**Giải thích:** Chọn nguyên một phía cho mọi xung đột đồng nghĩa với vứt bỏ phía còn lại tại các đoạn đó. Nếu trong lúc bạn thử nghiệm, `main` có thêm bản sửa phí ship hay bản vá bảo mật, chúng biến mất mà không có cảnh báo. "Mới hơn" không phải tiêu chí. Bạn cần xem từng chỗ.

### Bạn tạo nhánh `thu-giao-dien` và `git push` nhánh đó lên GitHub. Project Vercel dùng `main` làm nhánh Production. Khách hàng thấy gì?

- [ ] Thấy ngay giao diện mới, vì mọi thứ đẩy lên GitHub đều tới khách
- [x] Vẫn thấy bản cũ; Vercel tạo một bản Preview có đường dẫn riêng cho nhánh thử
- [ ] Trang web tạm ngừng cho tới khi bạn merge

**Giải thích:** Chỉ nhánh Production mới cập nhật tên miền chính. Nhánh khác tạo ra bản Preview để bạn xem trước. Đây là lý do làm việc trên nhánh riêng giúp bạn thử trên môi trường gần giống thật mà khách không bị ảnh hưởng.

### Bạn mở file và thấy đoạn sau. Dòng `const MAX_ITEMS = 20` đến từ đâu?

```ts
<<<<<<< HEAD
const MAX_ITEMS = 20
=======
const MAX_ITEMS = 50
>>>>>>> them-gio-hang
```

- [ ] Từ nhánh `them-gio-hang`
- [ ] Từ commit cũ nhất trong lịch sử
- [ ] Do Git tự tạo ra để gợi ý
- [x] Từ nhánh bạn đang đứng khi chạy `git merge`

**Giải thích:** Phần giữa `<<<<<<< HEAD` và `=======` là bản của `HEAD`, tức nhánh bạn đang đứng. Phần giữa `=======` và `>>>>>>> them-gio-hang` là bản của nhánh đang được đưa vào. Git không tự viết ra giá trị nào, nó chỉ đặt hai bản cạnh nhau.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ AI merge nhánh `them-ma-giam-gia` vào `main`. AI gặp xung đột ở `lib/pricing.ts` và `app/api/checkout/route.ts`, rồi đề xuất chạy hai lệnh dưới đây và báo "xong, tôi sẽ push luôn". Hãy nêu rủi ro và cách bạn xử lý.

```bash
git checkout --theirs .
git commit -am "resolve conflicts"
```

#### Đáp án

Rủi ro: `git checkout --theirs .` lấy nguyên bản của nhánh được đưa vào cho mọi file đang xung đột. Mọi thay đổi của `main` tại các đoạn đó bị bỏ. Hai file này tính tiền và xử lý thanh toán. Nếu `main` đã có bản sửa phí ship hoặc một bước kiểm tra đăng nhập mới thêm, chúng có thể biến mất. Push ngay sau đó sẽ đưa kết quả lên Production khi chưa ai xem.

Cách xử lý:

1. Không cho chạy hai lệnh đó. Nếu merge đang dở, có thể `git merge --abort` để về trạng thái trước khi merge rồi làm lại.
2. Yêu cầu AI liệt kê từng đoạn xung đột: file nào, bản `main` nói gì, bản nhánh nói gì, nó đề xuất giữ gì và vì sao. Chưa sửa.
3. Tự quyết định từng đoạn theo quy tắc nghiệp vụ. Với code tính tiền, thường phải ghép cả hai: giữ bản sửa phí ship và thêm mã giảm giá.
4. Sau khi giải quyết: tìm `<<<<<<<` để chắc không sót, xem `git diff`, chạy build và test, tự thử cả tính năng mới lẫn tính năng cũ nằm trong hai file đó.
5. Đẩy lên một nhánh để xem bản Preview trước khi đưa vào `main`.

## Lỗi suy luận hay gặp

### "Xung đột nghĩa là Git bị lỗi hoặc tôi đã làm hỏng gì đó"

- **Vì sao sai:** Xung đột là hành vi bình thường và có chủ đích. Git báo rằng hai dòng việc cùng sửa một chỗ và cần người quyết định. Không có gì mất cả: cả hai bản đều còn nguyên trong lịch sử của hai nhánh.
- **Cách sửa:** Bình tĩnh đọc từng đoạn đánh dấu. Nếu rối, `git merge --abort` đưa bạn về trạng thái trước khi merge mà không mất gì.

### "Merge xong, build qua là hai nhánh đã ghép đúng"

- **Vì sao sai:** Build chỉ kiểm tra code có đóng gói được không. Chọn nhầm phía trong một xung đột vẫn cho ra code hợp lệ, chỉ là sai nghiệp vụ: phí ship cũ, thiếu bước kiểm tra, mất một điều kiện.
- **Cách sửa:** Sau mỗi lần merge có xung đột, thử lại bằng tay các tính năng nằm trong những file từng xung đột, ở cả hai phía.

### "Làm việc một mình thì không cần nhánh"

- **Vì sao sai:** Bạn không làm một mình. AI là một người cùng sửa code với tốc độ rất cao, và bạn thường có hai dòng việc song song: thử cái mới và sửa gấp cái đang chạy. Không có nhánh, hai dòng việc này trộn vào nhau trên `main`.
- **Cách sửa:** Mỗi thử nghiệm kéo dài hơn một buổi, hoặc có thể làm hỏng luồng chính, nên bắt đầu bằng `git switch -c ten-nhanh`.

## Bài tập thực hành

Mục tiêu: tự tạo một xung đột trên file thử, đọc và giải quyết bằng tay, để lần sau gặp xung đột thật bạn không phải phó mặc cho AI. Bài tập chỉ dùng hai nhánh thử và một file ghi chú, không đụng tới `main` hay code của app.

### Việc cần làm

1. Chạy `git status` để chắc không còn thay đổi dở dang. Chạy `git switch -c thu-a`, tạo file `thu-nghiem.md` có một dòng `Phí ship: 20000`, rồi commit.
2. Chạy `git switch -c thu-b`. Sửa dòng đó thành `Phí ship: 25000`, rồi commit.
3. Chạy `git switch thu-a`. Sửa dòng đó thành `Phí ship: 30000`, rồi commit.
4. Vẫn ở `thu-a`, chạy `git merge thu-b`. Git sẽ báo conflict. Chạy `git status` và mở `thu-nghiem.md` để đọc ba dòng đánh dấu.
5. Tự sửa file: giữ một giá trị, xóa ba dòng đánh dấu, rồi `git add thu-nghiem.md` và `git commit`.
6. Chạy `git switch main` để quay về. Hai nhánh thử không ảnh hưởng gì tới `main`.

### Kết quả đúng

Ở bước 4 bạn chỉ ra được phần nào là của `thu-a` (HEAD), phần nào là của `thu-b`. Sau bước 5, `git status` báo không còn gì dang dở và tìm `<<<<<<<` trong file không ra kết quả. Sau bước 6, thư mục dự án không có `thu-nghiem.md` và `git log` của `main` không có commit thử nào.
