---
id: ai-task-context
title: Chia nhỏ việc và cấp ngữ cảnh cho AI
group: ai-git
prerequisites: [acceptance-criteria, debugging]
priority: 2
stage: 2
format: 2
signals:
  - "AGENTS.md"
  - "CLAUDE.md"
  - ".cursor/rules"
  - "git diff --stat"
  - "files changed"
---

## Nhắc lại

### Vì sao tiêu chí nghiệm thu phải được viết trước khi giao việc cho AI?

Vì tiêu chí cho AI một đích rõ ràng và cho bạn một danh sách để tự kiểm tra sau đó. Viết sau khi AI làm xong thì bạn dễ tả lại đúng thứ AI đã làm và coi đó là đúng.

### Một bản ghi lỗi tốt gồm những phần nào?

Các bước tái hiện, kết quả kỳ vọng, kết quả thực tế, bằng chứng nguyên văn (dòng lỗi ở Console, request lỗi ở Network, dòng trong log máy chủ) và trạm đang nghi ngờ.

## Đoán trước

Trang đăng nhập của bạn báo lỗi khi khách nhập email có chữ in hoa. Bạn viết cho Claude Code: "Sửa lỗi đăng nhập, tiện thể dọn code cho gọn và cập nhật mấy thư viện cũ luôn". AI làm việc 12 phút rồi báo xong. `git diff --stat` cho thấy 23 file thay đổi: đổi tên một loạt hàm, nâng phiên bản 5 thư viện, viết lại file cấu hình. Đăng nhập đã chạy. Hôm sau trang thanh toán hiện màn hình trắng. Bạn nhờ AI tìm nguyên nhân, nó sửa thêm 6 file nữa mà vẫn chưa xong. Vì sao một lỗi nhỏ lại dẫn tới tình trạng không còn biết hỏng từ đâu?

### Đáp án

Vì ba việc khác nhau đã bị gộp vào một lần giao: sửa một lỗi cụ thể, dọn code, nâng thư viện. Mỗi việc có rủi ro riêng, nhưng kết quả lại trộn chung trong 23 file. Khi trang thanh toán hỏng, bạn không tách được thay đổi nào gây ra. Bạn cũng không thể đọc hết 23 file để kiểm tra, nên thực tế là không ai kiểm tra cả. Chữ "tiện thể" đã trao cho AI quyền sửa bất cứ đâu. Nếu chỉ giao riêng lỗi đăng nhập, kèm tên file và bằng chứng, thay đổi sẽ nằm gọn trong một hai file và bạn đọc được hết.

## Ví dụ mẫu

Bạn thuê thợ sửa vòi nước bị rỉ. Nếu dặn "sửa cái vòi, tiện thể xem nhà có gì cũ thì thay luôn", lúc về bạn có thể thấy cả bếp đã bị tháo ra. Thợ không làm sai lời dặn. Lời dặn không có ranh giới.

Giao việc cho AI cũng vậy. Một lần giao việc tốt có hai đặc điểm. Thứ nhất, việc đủ nhỏ: một mục đích, kết quả là một thay đổi bạn đọc hết được trong vài phút. Thứ hai, đủ **ngữ cảnh** (context), tức những thông tin AI cần mà nó không tự biết: sửa ở đâu, không được đụng vào đâu, lỗi trông như thế nào, thế nào là xong.

Cách giao SAI:

```text
Sửa lỗi đăng nhập, tiện thể dọn code cho gọn
và cập nhật mấy thư viện cũ luôn.
```

Cách giao ĐÚNG:

```text
Mục tiêu: sửa lỗi không đăng nhập được khi email có chữ in hoa.
Phạm vi: chỉ sửa app/login/actions.ts. Cần sửa file khác thì
  dừng lại hỏi tôi trước.
Không đụng: package.json, thư mục supabase/, các file test.
Bằng chứng: nhập "An.Tran@example.com" + đúng mật khẩu
  -> POST /login trả 400 {"error":"Invalid login credentials"}
  Nhập "an.tran@example.com" thì đăng nhập được.
Xong khi: cả hai cách viết email đều đăng nhập được;
  sai mật khẩu vẫn báo lỗi như cũ.
Cách làm: nêu nguyên nhân và kế hoạch trước, chờ tôi đồng ý
  rồi mới sửa. Lý do tôi yêu cầu bước này: ___
```

Sáu dòng đầu mục này trả lời sáu câu hỏi: làm gì, ở đâu, cấm gì, bằng chứng nào, thế nào là xong, làm theo trình tự nào. Việc dọn code và nâng thư viện không biến mất. Chúng trở thành hai lần giao việc riêng, mỗi lần có commit riêng.

## Tìm trong project của bạn

1. **Đo kích thước các lần giao việc gần đây.** Chạy `git log --stat -n 5`. Mỗi commit hiện danh sách file đã đổi và một dòng tổng kết dạng `7 files changed`. Commit chỉ đổi vài file cùng phục vụ một mục đích là ổn. Commit đổi hàng chục file ở nhiều thư mục không liên quan, với lời ghi kiểu "update" hay "fix", là dấu hiệu việc được giao quá to.
2. **Tìm chữ "tiện thể".** Mở lịch sử chat với AI, tìm các từ `tiện thể`, `luôn`, `và cả`, `đồng thời`. Mỗi lần xuất hiện là một chỗ hai việc bị gộp làm một.
3. **Kiểm tra file hướng dẫn cố định.** Tìm ở thư mục gốc các file `AGENTS.md`, `CLAUDE.md`, hoặc thư mục `.cursor/rules`. Đây là nơi ghi các quy định áp dụng cho mọi lần giao việc. Có file, nội dung khớp với project hiện tại là ổn. Không có file, hoặc file do AI tự viết mà bạn chưa từng đọc, là có vấn đề.
4. **Soát yêu cầu gần nhất theo sáu phần.** Mục tiêu, phạm vi file, phần không được đụng, bằng chứng, tiêu chí xong, trình tự làm. Đánh dấu phần nào thiếu.
5. **Soát thay đổi ngoài phạm vi.** Ngay sau lần AI làm việc tiếp theo, chạy `git status` và `git diff --stat` trước khi làm gì khác. So danh sách file với phạm vi bạn đã nêu. Có file nằm ngoài phạm vi thì hỏi lý do của từng file.
6. **Ghi lại:**
   - Commit lớn nhất gần đây đổi bao nhiêu file: `[số]`
   - Project có file hướng dẫn cố định không, bạn đã đọc chưa: `[Có, đã đọc / Có, chưa đọc / Không]`
   - Yêu cầu gần nhất thiếu những phần nào trong sáu phần: `[...]`

## Tự giải thích

### Vì sao chia nhỏ việc lại giúp bạn kiểm tra tốt hơn, dù tổng lượng code AI viết không đổi?

Vì mỗi phần nhỏ có một mục đích và một bộ tiêu chí. Bạn kiểm xong, commit, rồi mới giao phần sau. Phần nào hỏng thì chỉ có một thay đổi nhỏ để xem lại hoặc hoàn tác. Gộp chung thì một lỗi ở phần này kéo theo việc bỏ cả phần kia.

### Nếu không nêu phạm vi file và phần không được đụng thì AI sẽ làm gì?

AI sửa bất kỳ file nào nó cho là liên quan. Thường nó "cải thiện" luôn những đoạn nó thấy chưa đẹp: đổi tên hàm, sắp lại cấu trúc, cập nhật cấu hình. Mỗi thay đổi thêm đó là một chỗ có thể hỏng mà bạn không yêu cầu và không biết để kiểm tra.

### Vì sao nên yêu cầu AI nêu kế hoạch trước khi sửa?

Đọc một kế hoạch năm dòng nhanh hơn nhiều so với đọc code đã sửa. Ở bước này bạn phát hiện sớm khi AI hiểu sai mục tiêu, định sửa lan sang file khác, hoặc đưa ra nguyên nhân không khớp với bằng chứng. Sửa một kế hoạch sai không tốn gì. Gỡ một thay đổi sai thì tốn.

## Trắc nghiệm

### Yêu cầu nào dưới đây nên được tách thành nhiều lần giao việc?

- [ ] "Trong `app/cart/page.tsx`, đổi chữ trên nút từ 'Mua' thành 'Thêm vào giỏ'"
- [x] "Thêm trang quản lý đơn hàng, có lọc theo ngày, xuất Excel, gửi email cho khách khi đổi trạng thái"
- [ ] "Sửa lỗi tổng tiền bị làm tròn sai trong `lib/cart.ts`, bằng chứng như sau..."

**Giải thích:** Phương án thứ hai chứa ít nhất bốn tính năng, mỗi cái có dữ liệu, quyền truy cập và tiêu chí riêng. Giao một lần sẽ ra một thay đổi lớn mà bạn không kiểm nổi. Hai phương án còn lại đều có một mục đích và một nơi sửa rõ ràng.

### Bạn giao việc với dòng "Phạm vi: chỉ sửa `app/login/actions.ts`". AI báo xong, và bạn thấy kết quả sau. Bạn làm gì?

```text
$ git diff --stat
 app/login/actions.ts   |  6 +++---
 lib/supabase/server.ts | 41 ++++++++++++++++-----------
 package.json           |  4 ++--
 3 files changed, 31 insertions(+), 20 deletions(-)
```

- [ ] Commit, vì đăng nhập đã chạy được
- [ ] Bỏ qua hai file kia, vì AI chỉ sửa thêm khi thấy thật sự cần
- [ ] Bảo AI xác nhận lại rằng ba file đều an toàn rồi commit
- [x] Chưa commit; hỏi lý do sửa hai file ngoài phạm vi và đọc diff của chúng, nhất là `package.json`

**Giải thích:** Hai trong ba file nằm ngoài phạm vi đã nêu, trong đó `lib/supabase/server.ts` được nhiều trang dùng chung và `package.json` quyết định phiên bản thư viện. Đăng nhập chạy được không nói gì về các trang khác. Lời xác nhận của AI không thay được việc bạn tự xem.

### Câu nào cấp bằng chứng lỗi tốt nhất cho AI?

- [x] "Bấm Lưu ở /ho-so thì `PATCH /api/profile` trả 500. Log máy chủ: `TypeError: Cannot read properties of undefined (reading 'id')` tại `app/api/profile/route.ts:14`"
- [ ] "Trang hồ sơ bị lỗi nặng, khách phàn nàn nhiều, cần sửa gấp"
- [ ] "Tôi nghĩ lỗi do database, bạn kiểm tra lại toàn bộ phần database giúp tôi"

**Giải thích:** Phương án đầu có thao tác, request, mã lỗi, thông báo nguyên văn, tên file và số dòng. Phương án hai chỉ nêu mức độ khẩn cấp. Phương án ba đưa ra phỏng đoán của bạn thay cho bằng chứng và còn mở rộng phạm vi ra "toàn bộ".

### Bạn nhờ thêm ô "Ghi chú" vào form đặt hàng. AI trả lời như sau. Phản ứng nào hợp lý?

```text
Tôi đã thêm ô Ghi chú. Trong lúc làm, tôi thấy cấu trúc thư mục
chưa tối ưu nên đã sắp xếp lại components/ và đổi tên 9 file.
```

- [ ] Cảm ơn AI vì đã chủ động cải thiện project
- [ ] Giữ lại tất cả, miễn là trang đặt hàng vẫn mở được
- [x] Yêu cầu bỏ phần sắp xếp lại, chỉ giữ thay đổi cho ô Ghi chú; nếu muốn dọn thư mục thì làm thành một việc riêng sau
- [ ] Bảo AI sắp xếp lại luôn các thư mục còn lại cho đồng bộ

**Giải thích:** Đổi tên 9 file ảnh hưởng tới mọi nơi đang dùng chúng và nằm ngoài yêu cầu. Trang đặt hàng mở được chưa chứng minh các trang khác còn chạy. Việc dọn dẹp có thể đáng làm, nhưng phải là một lần giao riêng để kiểm tra riêng và hoàn tác riêng.

## Kiểm tra không dùng AI

### Tình huống: App đặt bàn nhà hàng của bạn có lỗi: khách đặt bàn cho 12 người vẫn được nhận, trong khi bàn lớn nhất chỉ 10 chỗ. Bạn cũng đang muốn thêm tính năng nhắc lịch qua email và đổi màu chủ đạo sang xanh lá. Bạn đã thu được: `POST /api/reservations` với `{"guests":12}` trả về 200. Hãy viết lần giao việc đầu tiên cho AI và giải thích cách bạn sắp xếp ba việc.

#### Đáp án

**Sắp xếp:** ba việc thành ba lần giao riêng. Lỗi số khách làm trước vì đang ảnh hưởng tới khách thật. Email nhắc lịch là tính năng mới, cần bộ tiêu chí riêng. Đổi màu là việc giao diện, ít rủi ro, làm sau cùng. Mỗi việc xong thì kiểm tra và commit rồi mới sang việc sau.

**Lần giao đầu tiên** cần đủ sáu phần:

- Mục tiêu: từ chối yêu cầu đặt bàn quá 10 khách.
- Phạm vi: `app/api/reservations/route.ts` và form đặt bàn. Cần sửa file khác thì hỏi trước.
- Không đụng: phần gửi email, file cấu hình, `package.json`.
- Bằng chứng: `POST /api/reservations` với `{"guests":12}` đang trả 200 và tạo lịch đặt.
- Xong khi: 12 khách thì máy chủ trả lỗi kèm thông báo "Tối đa 10 khách"; 10 khách vẫn đặt được; 0 hoặc số âm bị từ chối.
- Trình tự: nêu nguyên nhân và kế hoạch trước, chờ đồng ý rồi sửa.

**Lý do:** tiêu chí yêu cầu chặn ở máy chủ vì chỉ chặn ở form thì ai gửi thẳng request vẫn lọt. Phạm vi hẹp giúp thay đổi đủ nhỏ để bạn đọc hết.

## Lỗi suy luận hay gặp

### "Giao một lần cho xong thì đỡ mất công hơn chia nhỏ"

- **Vì sao sai:** Thời gian gõ yêu cầu ít hơn, nhưng thời gian kiểm tra và gỡ lỗi nhiều hơn hẳn. Một thay đổi lớn gần như không ai kiểm nổi, nên lỗi nằm lại cho tới khi khách gặp.
- **Cách sửa:** Lấy khả năng kiểm tra của bạn làm thước đo. Một lần giao là vừa khi bạn đọc hết được thay đổi của nó.

### "Đưa càng nhiều thông tin thì AI càng làm tốt"

- **Vì sao sai:** Dán cả chục file và toàn bộ lịch sử chat làm thông tin quan trọng bị chìm. AI dễ bám vào một chi tiết không liên quan và sửa lan theo hướng đó.
- **Cách sửa:** Đưa đúng thứ cần cho việc này: file trong phạm vi, bằng chứng nguyên văn, tiêu chí. Quy định dùng chung cho mọi việc thì đặt vào `AGENTS.md` hoặc file tương đương.

### "Đã viết 'không được sửa file khác' thì chắc chắn AI không sửa"

- **Vì sao sai:** Lời dặn làm giảm khả năng AI sửa lan, nhưng không phải cái khóa. AI vẫn có lúc bỏ qua, nhất là trong phiên làm việc dài.
- **Cách sửa:** Sau mỗi lần AI làm việc, chạy `git diff --stat` và so danh sách file với phạm vi đã nêu. Lời dặn đi kèm kiểm tra mới có giá trị.

## Bài tập thực hành

Mục tiêu: viết lại một yêu cầu cũ thành lần giao việc đủ sáu phần và so sánh kích thước thay đổi.

### Việc cần làm

1. Chạy `git log --stat -n 10`, chọn commit đổi nhiều file nhất. Tìm lại yêu cầu bạn đã gõ cho AI trước commit đó.
2. Liệt kê các việc khác nhau bị gộp trong yêu cầu ấy.
3. Chọn một việc nhỏ bạn sắp làm thật. Viết lần giao việc theo sáu phần: mục tiêu, phạm vi file, không đụng, bằng chứng hoặc mô tả hiện trạng, tiêu chí xong, trình tự làm.
4. Chạy `git status` để chắc không còn thay đổi dở dang, rồi gửi yêu cầu cho AI. Đọc kế hoạch AI đưa ra trước khi cho phép sửa.
5. Khi AI báo xong, chạy `git diff --stat` và so danh sách file với phạm vi đã nêu.

### Kết quả đúng

Danh sách file trong `git diff --stat` nằm trong phạm vi bạn đã viết, hoặc mỗi file ngoài phạm vi đều đã được AI hỏi trước. Bạn đọc hết được thay đổi trong vài phút và kiểm được từng dòng tiêu chí.

### Nhờ AI rà lại

```text
Đây là yêu cầu tôi định giao cho bạn: [dán yêu cầu].
Chưa sửa file nào. Chỉ báo cáo:
1. Yêu cầu này có gộp nhiều việc không, nên tách thế nào.
2. Thông tin nào còn thiếu khiến bạn phải tự đoán.
3. Những file bạn dự kiến sẽ đụng tới, kể cả file ngoài phạm vi.
```
