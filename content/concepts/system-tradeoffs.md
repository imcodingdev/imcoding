---
id: system-tradeoffs
title: Đánh đổi độ phức tạp và chi phí
group: systems
prerequisites: [business-rules, data-flow, logging-monitoring]
priority: 2
stage: 4
format: 2
signals:
  - "dependencies"
  - "package.json"
  - "redis"
  - "queue"
  - "docker-compose"
  - "vercel.json"
---

## Nhắc lại

### Quy tắc nghiệp vụ (business rules) là gì, và vì sao phải viết ra trước khi giao việc cho AI?

Là các luật riêng của việc kinh doanh mà phần mềm phải tuân theo, ví dụ "đơn dưới 200.000 đồng tính phí ship 25.000". AI không tự biết những luật này. Không viết ra thì AI tự đoán, và bạn không có căn cứ để kiểm tra kết quả.

### Theo bài Nhật ký và theo dõi, vì sao log lỗi nên có `requestId` thay vì chỉ ghi “checkout failed”?

`requestId` giúp nối phản ánh của người dùng với đúng yêu cầu và dòng log tương ứng. Nhiều dòng “checkout failed” giống nhau chỉ báo có lỗi, không cho biết dòng nào thuộc yêu cầu đang cần kiểm tra. Mã yêu cầu đi kèm thông báo lỗi giúp khoanh vùng sự cố.

## Đoán trước

App đặt lịch của bạn có khoảng 40 khách mỗi ngày. Bạn nhờ AI: "Gửi email nhắc khách trước giờ hẹn một ngày". AI làm xong trong một buổi tối và báo đã thêm: một hàng đợi công việc chạy trên Redis, một tiến trình worker chạy riêng, hai thư viện mới, một dịch vụ Redis trả phí theo tháng, và bốn biến môi trường. Mọi thứ chạy tốt. Ba tháng sau, email nhắc lịch ngừng gửi. Không có thông báo lỗi nào trên giao diện. Bạn mở code ra và không biết bắt đầu từ đâu. Vì sao một tính năng nhỏ lại để lại nhiều thứ phải lo đến vậy?

### Đáp án

Vì AI giải bài toán "làm sao gửi email đúng giờ cho hệ thống lớn" chứ không phải bài toán của bạn. Với 40 khách mỗi ngày, một tác vụ chạy theo lịch mỗi sáng là đủ. Mỗi thứ thêm vào đều kèm chi phí kéo dài: Redis có hóa đơn và có thể hết hạn gói, worker có thể dừng mà không ai biết, thư viện cần cập nhật, biến môi trường phải khai đúng ở mọi nơi. Viết ra thì nhanh, còn giữ cho chạy thì là việc của bạn hằng tháng. Tính năng hỏng im lặng vì có năm chỗ có thể hỏng và không chỗ nào được giám sát.

## Ví dụ mẫu

Quán cà phê 20 ghế không mua lò nướng công nghiệp để làm mười cái bánh mỗi ngày. Lò chạy tốt, nhưng nó tốn điện, chiếm chỗ, cần bảo dưỡng và cần người biết sửa. Thứ gì mua về cũng thành thứ phải nuôi.

Trong phần mềm, **trade-off (đánh đổi)** nghĩa là mọi lựa chọn đều có giá. Mỗi thư viện, dịch vụ, bảng, biến môi trường hay lớp code trung gian thêm vào là thêm một thứ phải cập nhật, phải trả tiền, phải bảo mật, phải giám sát, và phải hiểu khi nó hỏng. AI có xu hướng làm phức tạp quá mức (over-engineering): nó thấy nhiều kiến trúc của hệ thống lớn và viết thêm code gần như không tốn công, nên hay đề xuất giải pháp "chuẩn doanh nghiệp" cho bài toán nhỏ. Người trả phí bảo trì là bạn.

Phiên bản AI tự chọn, nhìn qua phần `dependencies` của `package.json`:

```json
{
  "dependencies": {
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0",
    "node-cron": "^3.0.0",
    "resend": "^4.0.0"
  }
}
```

Phiên bản đơn giản nhất đáp ứng nhu cầu dùng tính năng chạy theo lịch (Cron Jobs) có sẵn của Vercel, khai trong `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 1 * * *" }
  ]
}
```

Mỗi ngày một lần, Vercel gọi vào `/api/cron/reminders`. API này đọc các lịch hẹn của ngày mai trong database rồi gửi email. Không Redis, không worker, không hàng đợi. Đường dẫn này vẫn là một API mở ra Internet, nên phải kiểm tra người gọi như mọi API khác.

Bốn câu nên hỏi AI **trước khi** cho nó viết code:

1. Phiên bản đơn giản nhất đáp ứng nhu cầu này là gì, chỉ dùng những thứ project đã có?
2. Phương án bạn định làm thêm mới những gì: thư viện, dịch vụ ngoài, biến môi trường, bảng, file cấu hình?
3. Với mỗi thứ thêm mới: nếu nó hỏng thì tôi biết bằng cách nào, và ai phải ___ ?
4. Ở quy mô nào thì phiên bản đơn giản không còn đủ?

Phức tạp hơn không phải lúc nào cũng sai. Nó chỉ đáng khi bạn chỉ ra được nhu cầu thật đang có, không phải nhu cầu "sau này biết đâu cần".

## Tìm trong project của bạn

1. **Đếm thư viện:** mở `package.json`, đếm số dòng trong `dependencies`. Với mỗi gói bạn không nhận ra, tìm tên gói đó trong toàn dự án. Ổn: gói nào cũng được dùng ở ít nhất một file và bạn nói được nó làm gì. Có vấn đề: gói không được import ở đâu, hoặc hai gói làm cùng một việc (hai thư viện ngày tháng, hai thư viện gọi HTTP, hai bộ giao diện).
2. **Đếm dịch vụ ngoài:** mở `.env.example` hoặc mục Environment Variables trên Vercel. Mỗi nhóm biến thường ứng với một dịch vụ. Ổn: mỗi dịch vụ bạn biết đăng nhập ở đâu, gói nào, ai nhận hóa đơn. Có vấn đề: có biến bạn không biết của dịch vụ nào.
3. **Tìm hạ tầng tự thêm:** tìm các từ khóa `redis`, `queue`, `worker`, `kafka`, `docker-compose`, `cache`. Với mỗi kết quả, hỏi: nhu cầu thật nào cần nó?
4. **Tìm lớp trung gian thừa:** tìm các tên có chữ `Factory`, `Provider`, `Adapter`, `Repository`, `Strategy`. Có vấn đề khi một lớp trừu tượng chỉ có đúng một cách dùng, ví dụ `PaymentProviderFactory` trong khi bạn chỉ dùng một cổng thanh toán.
5. **Ghi lại:**
   - Số thư viện trong `dependencies`: `[ ... ]`, số gói không rõ mục đích: `[ ... ]`
   - Số dịch vụ ngoài đang dùng: `[ ... ]`
   - Thứ phức tạp nhất mà bạn không giải thích được vì sao cần: `[ ... ]`

## Tự giải thích

### Vì sao "AI viết thêm cũng chẳng tốn công" không có nghĩa là thêm vào thì miễn phí?

Chi phí viết code gần bằng không, nhưng chi phí sở hữu thì không. Mỗi thành phần cần được cập nhật khi có bản vá bảo mật, cần biến môi trường đúng ở cả máy cá nhân, bản Preview và Production, cần được đọc lại mỗi lần AI sửa tính năng liên quan, và là một chỗ nữa có thể hỏng. AI viết xong là xong việc. Bạn là người ở lại với hệ thống.

### Nếu bỏ hàng đợi Redis và chỉ chạy một tác vụ theo lịch mỗi ngày, bạn mất gì và được gì?

Mất: khả năng gửi hàng chục nghìn email cùng lúc, tự thử lại từng email riêng lẻ, gửi đúng từng phút. Được: ít hơn một dịch vụ trả phí, ít hơn hai thư viện, ít hơn một tiến trình phải giám sát, và một luồng dữ liệu đủ ngắn để bạn tự lần theo khi hỏng. Với 40 khách mỗi ngày, những thứ mất đi là thứ bạn chưa cần.

## Trắc nghiệm

### Bạn nhờ AI thêm ô tìm sản phẩm cho shop có 300 sản phẩm. AI đề xuất cài một dịch vụ tìm kiếm riêng, đồng bộ dữ liệu từ Supabase sang mỗi năm phút. Câu hỏi nào nên hỏi trước tiên?

- [ ] "Dịch vụ tìm kiếm nào nhanh nhất hiện nay?"
- [x] "Một câu truy vấn lọc theo tên ngay trong bảng sản phẩm hiện có đã đủ cho 300 sản phẩm chưa?"
- [ ] "Đồng bộ mỗi một phút thay vì năm phút được không?"

**Giải thích:** Với vài trăm dòng, lọc theo tên ngay trong database hiện có là đủ nhanh và không thêm dịch vụ, khóa hay bước đồng bộ nào. Hai câu còn lại đã mặc nhiên chấp nhận phương án phức tạp rồi chỉ tinh chỉnh nó.

### Sau một yêu cầu nhỏ "thêm nút xuất danh sách đơn ra file", `git diff` của `package.json` hiện như dưới đây. Bạn nên làm gì?

```diff
+    "exceljs": "^4.4.0",
+    "lodash": "^4.17.21",
+    "moment": "^2.30.1",
+    "pdfkit": "^0.15.0",
```

- [ ] Chấp nhận, vì AI biết tính năng cần những gì
- [ ] Xóa cả bốn dòng khỏi `package.json` rồi deploy
- [ ] Chỉ cần kiểm tra bốn gói này có nhiều lượt tải là được
- [x] Hỏi AI từng gói dùng cho việc gì trong yêu cầu này, gói nào thay được bằng thứ đã có, rồi mới quyết định giữ gói nào

**Giải thích:** Bạn chỉ yêu cầu xuất file, vậy mà có cả thư viện PDF, thư viện ngày tháng và thư viện tiện ích. Có thể một phần là thừa. Tự xóa dòng trong `package.json` khi code vẫn import sẽ làm build lỗi. Lượt tải cao cho thấy gói phổ biến, không cho thấy bạn cần nó.

### AI đề xuất tách app của bạn thành ba dịch vụ riêng (đơn hàng, người dùng, thông báo) "để sau này dễ mở rộng". Hiện app có một người phát triển là bạn và vài chục người dùng. Nhận định nào đúng?

- [x] Chưa có nhu cầu thật nào đòi hỏi việc tách; ba dịch vụ nghĩa là ba nơi deploy, ba bộ log, ba bộ biến môi trường phải giữ khớp nhau
- [ ] Nên tách sớm, vì để sau này mới tách thì không làm được nữa
- [ ] Tách ra thì mỗi phần nhỏ hơn nên chắc chắn ít lỗi hơn

**Giải thích:** "Sau này dễ mở rộng" là lợi ích chưa chắc xảy ra, còn chi phí vận hành ba dịch vụ thì bắt đầu ngay hôm nay. Tách ra còn sinh thêm loại lỗi mới ở chỗ các dịch vụ gọi nhau. Khi có nhu cầu thật, bạn vẫn tách được.

### Trường hợp nào thêm một dịch vụ ngoài là đánh đổi hợp lý?

- [ ] AI nói đây là cách làm chuẩn của các công ty lớn
- [ ] Dịch vụ có gói miễn phí nên không mất gì
- [x] Tự viết phần đó rủi ro cao và khó làm đúng, ví dụ xử lý thẻ thanh toán, nên dùng cổng thanh toán chuyên nghiệp
- [ ] Thêm vào để app trông chuyên nghiệp hơn với nhà đầu tư

**Giải thích:** Đánh đổi hợp lý khi dịch vụ gánh thay bạn một phần việc khó và rủi ro mà bạn đang thật sự cần. Gói miễn phí vẫn tốn công tích hợp, bảo mật khóa và theo dõi. "Chuẩn công ty lớn" là lời giải cho bài toán của công ty lớn.

## Kiểm tra không dùng AI

### Tình huống: Trang danh sách sản phẩm của bạn tải mất khoảng 3 giây. AI đề xuất: thêm Redis làm bộ nhớ đệm (cache), thêm một thư viện quản lý cache, và viết thêm cơ chế xóa cache mỗi khi sản phẩm đổi giá. Hãy nêu chi phí của phương án này và những gì bạn cần kiểm tra trước khi đồng ý.

#### Đáp án

Chi phí: một dịch vụ mới phải trả tiền và giữ khóa, một thư viện mới phải cập nhật, và một loại lỗi mới rất khó thấy. Khi cơ chế xóa cache sót một trường hợp, khách nhìn thấy giá cũ trong khi database đã có giá mới. Lỗi kiểu này không hiện thông báo đỏ nào.

Việc cần kiểm tra trước:

1. Chậm ở trạm nào? Mở tab Network xem yêu cầu nào tốn 3 giây, rồi xem log máy chủ để biết thời gian nằm ở truy vấn database hay ở chỗ khác.
2. Nguyên nhân đơn giản có thể là: lấy toàn bộ bảng thay vì phân trang, lấy mọi cột khi chỉ cần ba cột, gọi database trong vòng lặp cho từng sản phẩm, ảnh quá nặng.
3. Hỏi AI: "Phiên bản đơn giản nhất để trang này tải dưới 1 giây là gì, không thêm dịch vụ mới?" Thường là sửa câu truy vấn, thêm phân trang, hoặc dùng cơ chế cache có sẵn của Next.js.
4. Chỉ cân nhắc Redis khi đã sửa các nguyên nhân trên, đo lại mà vẫn chậm.

## Lỗi suy luận hay gặp

### "Cứ làm sẵn cho quy mô lớn, sau này đỡ phải làm lại"

- **Vì sao sai:** Bạn trả chi phí vận hành của hệ thống lớn ngay từ hôm nay cho một quy mô có thể không bao giờ tới. Khi quy mô lớn thật sự đến, nhu cầu thường khác với thứ đã đoán, nên phần làm sẵn vẫn phải làm lại.
- **Cách sửa:** Xây cho nhu cầu hiện tại cộng một bước gần nhất mà bạn nhìn thấy rõ. Ghi lại dấu hiệu cho biết đã tới lúc nâng cấp, ví dụ "khi tác vụ nhắc lịch chạy quá một phút".

### "AI đề xuất nhiều thành phần chứng tỏ nó hiểu sâu, nên theo"

- **Vì sao sai:** AI lặp lại các mẫu kiến trúc phổ biến trong dữ liệu nó học, phần lớn đến từ hệ thống lớn. Nó không biết bạn có 40 hay 4 triệu khách trừ khi bạn nói, và nó không chịu hậu quả khi hệ thống khó bảo trì.
- **Cách sửa:** Luôn cho AI biết quy mô thật và yêu cầu ít nhất hai phương án, trong đó có một phương án không thêm thành phần mới, kèm thứ mất đi ở mỗi phương án.

### "Đơn giản nghĩa là làm ẩu, bỏ cả kiểm tra đăng nhập và sao lưu cho nhanh"

- **Vì sao sai:** Đơn giản là bớt thành phần không phục vụ nhu cầu thật. Bảo mật, phân quyền, sao lưu và log là nhu cầu thật của mọi app có người dùng. Bỏ chúng không làm hệ thống đơn giản hơn, chỉ làm sự cố đắt hơn.
- **Cách sửa:** Khi cắt giảm, chỉ cắt thứ bạn chỉ ra được là chưa ai cần. Giữ nguyên các lớp bảo vệ dữ liệu và tiền.

## Bài tập thực hành

Mục tiêu: lập bảng kê những thứ app của bạn đang phụ thuộc, để lần đầu nhìn thấy toàn bộ chi phí bảo trì ở một chỗ. Bài tập chỉ đọc và ghi chép, không sửa code.

### Việc cần làm

1. Tạo một bảng ba cột: "Thành phần", "Phục vụ nhu cầu nào", "Nếu hỏng thì tôi biết bằng cách nào".
2. Điền mọi dịch vụ ngoài đang dùng (hosting, database, email, thanh toán, AI...) dựa trên danh sách biến môi trường.
3. Điền mười thư viện trong `dependencies` mà bạn ít hiểu nhất.
4. Đánh dấu những dòng mà cột hai hoặc cột ba bạn không điền được.
5. Chọn một dòng đã đánh dấu và hỏi AI bằng bốn câu hỏi ở phần Ví dụ mẫu. Chưa cho AI sửa gì.

### Kết quả đúng

Bạn có một bảng kê mà dòng nào cũng có lý do tồn tại, hoặc được đánh dấu rõ là "chưa biết vì sao cần". Bạn nêu được ít nhất một thành phần có thể bỏ hoặc thay bằng thứ đã có, kèm lý do.
