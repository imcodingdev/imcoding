---
id: agent-scope
title: Giao một việc một lúc cho agent
group: ai-git
prerequisites: [agent-instructions, acceptance-criteria]
priority: 1
stage: 2
format: 2
signals: ["WIP", "đang làm", "bị chặn", "features.md", "phạm vi"]
sources:
  - title: Learn Harness Engineering — Lecture 07
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-07-why-agents-overreach-and-under-finish/index.md
  - title: Learn Harness Engineering — Lecture 08
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-08-why-feature-lists-are-harness-primitives/index.md
---

## Nhắc lại

### Quy tắc làm việc dùng cho nhiều phiên nên đặt ở đâu?

Đặt trong file hướng dẫn của repo, hoặc tài liệu chi tiết có đường dẫn từ file đó. Quy tắc chỉ nằm trong chat dễ mất khi đổi phiên.

### Tiêu chí nghiệm thu khác “làm cho tốt” ở điểm nào?

Tiêu chí mô tả kết quả quan sát được với đầu vào và điều kiện rõ ràng. Người khác đọc xong có thể thử và kết luận đạt hay chưa, không phải đoán ý bạn.

## Đoán trước

Bạn giao agent “hoàn thiện app bán vé: thêm bộ lọc, lưu vé yêu thích, gửi email và dọn giao diện”. Cuối buổi, màn hình có đủ nút mới. Nhưng lọc xong thì mất lựa chọn, nút yêu thích chưa lưu được, email chưa có chỗ gửi thử. Agent báo còn vài chi tiết nhỏ và đề nghị tiếp tục tất cả trong phiên sau. Vì sao nhiều thay đổi nhìn thấy được mà bạn vẫn chưa nghiệm thu được việc nào?

### Đáp án

Bạn đã mở nhiều việc cùng lúc mà không quy định việc nào phải đạt kiểm tra trước. Agent chuyển qua lại giữa các phần, để mỗi phần có một đoạn chưa nối xong. Phiên sau phải hiểu cả loạt thay đổi dở. Hãy chọn một hành vi hoàn chỉnh, như lọc vé theo ngày bằng dữ liệu giả, làm xong và kiểm trước khi bắt đầu yêu thích hay email. Các ý còn lại vẫn được giữ trong danh sách chờ.

## Ví dụ mẫu

**Phạm vi công việc** trả lời “lần này cần tạo ra hành vi nào và được sửa tới đâu?”. Một việc có thể cần sửa giao diện, xử lý dữ liệu và test cùng nhau. “Một việc” không đồng nghĩa với “một file”; điểm cốt lõi là có một kết quả người dùng kiểm được.

**WIP** là số việc đang làm dở. **WIP=1** nghĩa là tại một thời điểm chỉ có một mục đang được thực hiện: chọn việc, sửa, kiểm, ghi kết quả, commit phần đã kiểm, rồi mới lấy việc tiếp. Nó giúp bạn biết đang nghiệm thu điều gì và thay đổi nào thuộc về yêu cầu nào.

Trong repo bán vé minh họa, bạn lưu danh sách ở `docs/features.md`. Các đường dẫn test bên dưới chỉ là ví dụ cho repo đã có chúng; phải thay bằng đường dẫn thật của dự án trước khi chạy.

```markdown
| Mã | Hành vi | Cách kiểm | Trạng thái |
|---|---|---|---|
| F01 | Lọc vé theo ngày đã chọn | e2e/filter-date.spec.ts | đang làm |
| F02 | Lưu vé yêu thích | e2e/favorites.spec.ts | chưa làm |
| F03 | Xem email vé trong hộp thư giả | e2e/ticket-mail.spec.ts | bị chặn |
F03 thiếu hộp thư giả; chưa được dùng email khách thật.
F01 cần kiểm ngày có vé và ngày không có vé.
```

Lần giao hiện tại làm rõ cách dùng danh sách ấy:

```text
Chỉ làm F01: chọn ngày thì danh sách hiện đúng vé của ngày đó.
Ngày không có vé phải hiện thông báo rỗng, không giữ vé ngày cũ.
Dùng bộ vé giả ở máy; không gọi dịch vụ thật.
Phạm vi: bộ lọc, danh sách vé và test tương ứng.
Không làm F02/F03, không đổi giao diện toàn app.
Chạy kiểm theo tài liệu repo, lưu kết quả cho từng tiêu chí.
Chỉ ghi đã qua kiểm sau khi có bằng chứng và đọc diff.
Commit phần đã kiểm trước khi chọn việc tiếp theo.
```

Danh sách có bốn trạng thái: **chưa làm**, **đang làm**, **bị chặn**, **đã qua kiểm**. “Bị chặn” cần lý do cụ thể và điều kiện gỡ chặn. “Đã qua kiểm” cần trỏ tới kết quả kiểm gắn với phiên bản code. Một dòng “gần xong” không cho biết còn thiếu gì, nên không dùng thay trạng thái rõ ràng.

Đây là công cụ điều khiển: nó quyết định việc nào được bắt đầu và lúc nào được chuyển tiếp. Tuy nhiên một file Markdown không tự khóa hành vi của agent. Bạn vẫn cần đối chiếu diff và kết quả, hoặc một bước kiểm tự động nếu repo đã có. Không cho phép đổi tiêu chí hay bỏ test chỉ để chuyển mục sang “đã qua kiểm”.

## Tìm trong project của bạn

1. Mở yêu cầu gần nhất và file tiến độ nếu có. Gạch chân các kết quả khác nhau như “lọc”, “xuất file”, “gửi email”. Ghi số mục đang thực hiện: `[danh sách mã việc]`.
2. Với từng mục, tìm ba phần: hành vi, cách kiểm, trạng thái. Ghi chỗ thiếu: `[F..., thiếu ...]`. Chữ “đã viết component” chưa phải hành vi hoàn chỉnh của người dùng.
3. Đọc `git status` và `git diff --stat` trong repo thử. So file thay đổi với một việc đang làm. File mới chưa theo dõi cũng cần được ghi nhận, vì diff thông thường chưa hiển thị nội dung của nó.
4. Kiểm phụ thuộc: ví dụ lưu yêu thích cần nhận biết tài khoản thử. Nếu phần trước chưa dùng được, ghi việc sau đang bị chặn hoặc chưa bắt đầu; không che bằng dữ liệu giả không phù hợp với tiêu chí.
5. Chọn một mục có thể kiểm hết trong một phiên. Ghi `[mã việc, tiêu chí, lệnh hoặc bước thử, bằng chứng cần lưu]`. Những phát hiện ngoài phạm vi đưa vào danh sách chờ riêng, không tự ghép vào lần sửa hiện tại.

Nếu đang có nhiều thay đổi dở, đừng xóa chúng để đạt WIP=1 trên giấy. Ghi đúng trạng thái, bảo toàn công việc hiện có và yêu cầu kế hoạch tách thành các phần kiểm được. Thu hẹp lần làm tiếp theo quan trọng hơn việc giả vờ repo chưa có việc dở.

## Tự giải thích

### Vì sao “chỉ làm một việc” vẫn có thể đổi vài file?

Một hành vi có thể đi qua form, máy chủ và màn hình kết quả. Cắt từng file thành việc riêng có thể để lại app không chạy được. Ranh giới tốt là một phần chức năng hoàn chỉnh, với tập file cần thiết và tiêu chí đủ rõ để bạn kiểm.

### Vì sao cần commit sau khi kiểm thay vì đợi gom cả app?

Commit nhỏ giữ một mốc có mục đích rõ và bằng chứng tương ứng. Nếu việc sau gây lỗi, bạn xác định thay đổi liên quan dễ hơn. Nhưng commit chỉ lưu trạng thái; nó không thay cho test, cũng không tự chứng minh phần code đã đúng.

### Nếu việc đang làm bị chặn thì có được chọn việc khác không?

Có thể, sau khi ghi lý do chặn, lưu bàn giao và làm rõ tình trạng thay đổi dở. Không giữ hai mục cùng “đang làm”. Chỉ chọn việc độc lập không cần phần đang bị chặn; tránh xây tiếp trên một nền chưa được kiểm.

## Trắc nghiệm

### Cursor đang sửa bộ lọc, thấy mã email hơi lặp và đề nghị tiện tay gom lại. Bạn nên làm gì?

- [ ] Đồng ý vì gom code không thay đổi chức năng
- [ ] Đổi cả hai mục thành đang làm để bảng khớp thực tế
- [x] Ghi việc email vào danh sách chờ, hoàn thành và kiểm bộ lọc trước

**Giải thích:** Refactor vẫn có thể gây lỗi và mở rộng phạm vi cần đọc. Ghi thêm một việc đang làm chỉ mô tả sự phân tán, không giải quyết nó.

### Danh sách sau thiếu gì để kiểm soát tiến độ?

```text
F04: Xuất danh sách vé. Trạng thái: đã qua kiểm.
Bằng chứng: agent nói đã hoàn thành phần code.
```

- [x] Cách kiểm hành vi và kết quả thực thi gắn với phiên bản code
- [ ] Tên mô hình đã dùng để viết code
- [ ] Số dòng code vừa thêm

**Giải thích:** Trạng thái cần bằng chứng kiểm lại được. Tên mô hình hay số dòng không nói file xuất có đúng dữ liệu, định dạng và quyền truy cập hay không.

### Mục “thêm bảng”, “thêm nút”, “thêm route” đều xong nhưng người dùng chưa lưu được ghi chú. Cách chia nào tốt hơn?

- [ ] Giữ ba mục và đánh dấu cả tính năng đã xong
- [x] Gom thành hành vi “lưu ghi chú giả và mở lại thấy nội dung”, có kiểm xuyên suốt
- [ ] Chỉ nghiệm thu nút vì người dùng nhìn thấy nút

**Giải thích:** Một lát chức năng cần đi tới kết quả dùng được. Chia theo thành phần kỹ thuật dễ bỏ phần nối giữa chúng; nhìn thấy nút không chứng minh dữ liệu đã lưu.

### F05 cần dịch vụ thử chưa được cấp. Trạng thái và hành động nào hợp lý?

- [ ] Đã qua kiểm, vì lỗi thuộc môi trường
- [ ] Đang làm, rồi đồng thời bắt đầu F06
- [x] Bị chặn, ghi điều kiện cần bổ sung và bàn giao trước khi chọn việc độc lập

**Giải thích:** Thiếu môi trường là lý do chặn, không phải bằng chứng đạt. Ghi rõ giúp phiên sau tránh thử lại vô ích và giữ đúng một việc đang thực hiện.

## Kiểm tra không dùng AI

### Bạn làm app quản lý câu lạc bộ. Agent được giao nhập danh sách thành viên từ file giả, đổi ảnh bìa và thêm điểm danh. Sau một phiên, import báo lỗi ở dòng trống, ảnh bìa chưa lưu, điểm danh chỉ có nút. Hãy chọn việc tiếp theo và cách ghi hai việc còn lại.

#### Đáp án

Chọn một hành vi import hoàn chỉnh: nhập file giả hợp lệ thì xem được danh sách, dòng trống được xử lý theo tiêu chí đã chốt. Ghi import là đang làm, hai mục còn lại chưa tiếp tục và ghi rõ phần đã viết nhưng chưa kiểm. Bảo toàn thay đổi dở, yêu cầu tách phạm vi nếu chúng đang trộn nhau. Sau khi kiểm import, đọc diff, ghi bằng chứng và commit phần đó mới chọn mục khác. Không gọi cả ba “sắp xong” rồi mở thêm chức năng mới.

## Lỗi suy luận hay gặp

### “Một prompt lớn tiết kiệm hơn nhiều lần giao nhỏ”

Bạn có thể tiết kiệm lúc gõ nhưng nhận lại một diff khó đọc và nhiều việc chưa nối xong. Chọn kích thước theo khả năng nghiệm thu: bạn đọc hết phạm vi và thử hết tiêu chí được thì lần giao mới đủ nhỏ.

### “Bảng tiến độ chỉ để báo cáo cho đẹp”

Nếu bảng không ảnh hưởng việc agent được làm tiếp, nó dễ thành nhật ký tự khen. Hãy dùng trạng thái và bằng chứng làm điều kiện chuyển việc, đồng thời đối chiếu bảng với code thực tế sau mỗi lần làm.

### “Đã qua kiểm thì không bao giờ cần xem lại”

Bằng chứng thuộc về một phiên bản cụ thể. Thay đổi sau có thể gây lỗi trở lại. Giữ lịch sử kiểm cũ, ghi phát hiện mới và mở việc sửa phù hợp; không dùng nhãn cũ để phủ nhận lỗi hiện tại.

## Bài tập thực hành

Mục tiêu: biến một yêu cầu rộng thành danh sách có thể điều khiển. Bài tập chỉ viết kế hoạch trong tài liệu nháp, không cho agent sửa app hoặc thao tác dữ liệu thật.

### Việc cần làm

1. Chọn một yêu cầu có vài kết quả khác nhau, loại bỏ tên khách và dữ liệu riêng khỏi bản nháp.
2. Chia thành các hành vi người dùng quan sát được, mỗi hành vi có mã riêng.
3. Viết cách kiểm bằng dữ liệu giả, trạng thái ban đầu và phụ thuộc của từng mục.
4. Chọn đúng một mục làm trước; với các mục bị chặn, ghi rõ thiếu gì và ai quyết định.
5. Viết câu giao việc có phạm vi, điều kiện đạt, bước ghi bằng chứng và commit trước khi chuyển tiếp.

### Kết quả đúng

Danh sách không có nhiều hơn một mục đang làm. Mỗi mục có hành vi, cách kiểm và trạng thái; không còn “gần xong” thiếu giải thích. Bạn nêu được vì sao mục đầu độc lập đủ để nghiệm thu, và chỉ ra những việc agent phải để lại cho lần sau.
