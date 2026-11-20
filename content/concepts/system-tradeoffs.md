---
id: system-tradeoffs
title: Đánh đổi độ phức tạp và chi phí
group: systems
prerequisites: [business-rules, data-flow, logging-monitoring]
priority: 2
stage: 4
format: 2
sources:
  - title: MDN — CDN
    url: https://developer.mozilla.org/en-US/docs/Glossary/CDN
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

Là luật kinh doanh phần mềm phải tuân theo, ví dụ "đơn dưới 200.000 đồng tính phí ship 25.000". AI không tự biết; không viết ra thì AI đoán, bạn thiếu căn cứ kiểm tra.

### Theo bài Nhật ký và theo dõi, vì sao log lỗi nên có `requestId` thay vì chỉ ghi “checkout failed”?

`requestId` nối phản ánh của người dùng với đúng yêu cầu và dòng log để khoanh vùng sự cố. Nhiều dòng “checkout failed” giống nhau chỉ báo có lỗi, không chỉ ra yêu cầu cần kiểm tra.

## Đoán trước

App đặt lịch có 40 khách mỗi ngày. Bạn nhờ AI: "Gửi email nhắc khách trước giờ hẹn một ngày". Một tối, AI làm xong, thêm hàng đợi trên Redis, tiến trình worker riêng, hai thư viện, dịch vụ Redis trả phí theo tháng và bốn biến môi trường. Ban đầu chạy tốt. Ba tháng sau, email ngừng gửi, giao diện không báo lỗi. Mở code, bạn không biết bắt đầu từ đâu. Vì sao tính năng nhỏ để lại nhiều thứ phải lo?

### Đáp án

AI chọn lời giải gửi email đúng giờ cho hệ thống lớn, trong khi 40 khách/ngày chỉ cần tác vụ mỗi sáng. Redis phải trả tiền, có thể hết hạn; worker có thể dừng âm thầm; thư viện cần cập nhật; biến môi trường phải đúng mọi nơi. Viết nhanh nhưng bạn phải vận hành hằng tháng. Năm chỗ có thể hỏng, không chỗ nào được giám sát, nên tính năng hỏng im lặng.

## Ví dụ mẫu

Quán 20 ghế làm mười bánh/ngày chưa cần lò công nghiệp: chạy tốt nhưng tốn điện, chỗ, bảo dưỡng và người sửa.

**Trade-off (đánh đổi)**: mọi lựa chọn đều có giá. Thư viện, dịch vụ, bảng, biến môi trường, lớp code trung gian đều cần cập nhật, trả tiền, bảo mật, giám sát và hiểu khi hỏng. AI dễ làm quá mức (over-engineering): học kiến trúc lớn, viết code ít tốn công nên đề xuất "chuẩn doanh nghiệp" cho việc nhỏ. Bạn chịu phí bảo trì.

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

Mỗi ngày, Vercel gọi `/api/cron/reminders` để đọc lịch hẹn ngày mai trong database rồi gửi email, không cần Redis, worker, hàng đợi. API vẫn mở ra Internet, phải kiểm tra người gọi.

Bốn câu nên hỏi AI **trước khi** cho nó viết code:

1. Phiên bản đơn giản nhất đáp ứng nhu cầu này là gì, chỉ dùng những thứ project đã có?
2. Phương án bạn định làm thêm mới những gì: thư viện, dịch vụ ngoài, biến môi trường, bảng, file cấu hình?
3. Với mỗi thứ thêm mới: nếu nó hỏng thì tôi biết bằng cách nào, và ai phải ___ ?
4. Ở quy mô nào thì phiên bản đơn giản không còn đủ?

Phức tạp hơn chỉ đáng khi có nhu cầu thật, thay vì "sau này biết đâu cần".

**Tự xây hay dùng dịch vụ sẵn có?** Agent có thể tự code thanh toán, email, đăng nhập dù đã có dịch vụ phù hợp. Trước khi chọn, hỏi mỗi phương án đáp ứng quy tắc nào, phí sử dụng, bảo trì, nơi dữ liệu chuyển tới. Chọn theo nhu cầu và ngân sách, tính cả vận hành, không chỉ lượng code.

App có thể lớn dần theo bậc. Bậc đầu, một máy chủ hoặc nền tảng host cộng **CDN** có thể đủ lâu nếu vẫn đáp ứng nhu cầu đã đo; chưa cần tách dịch vụ. CDN là mạng máy chủ phân bố nhiều nơi, giữ bản sao nội dung để phục vụ từ nơi gần người dùng, giảm tải máy chủ gốc. Nó không giải quyết mọi nút thắt. Bậc tiếp theo, khi đo thấy chậm, sửa đúng chỗ nghẽn và tăng tài nguyên nếu cần; chưa cần chia toàn bộ app. Chỉ ở bậc có phần cần vận hành hoặc mở rộng độc lập mới cân nhắc tách phần đó; chưa cần tách mọi phần. Agent đề xuất **microservices**, nhiều dịch vụ nhỏ vận hành riêng, ngay từ đầu là dấu hiệu cần hỏi lại: nhu cầu nào buộc phải tách, bằng chứng ở đâu?

## Khi nào chưa cần

Yêu cầu agent chỉ ra nhu cầu thật trước khi thêm thành phần:

- **Tách microservices** — chưa cần khi một app vẫn đủ; cần khi một phần phải vận hành hoặc mở rộng độc lập.
- **Thêm hàng đợi/cache riêng** — chưa cần khi tác vụ theo lịch hoặc truy vấn hiện tại đủ; cần khi tải công việc hoặc độ trễ đo được vẫn vượt yêu cầu sau tối ưu.
- **Tự dựng hạ tầng thay nền tảng host** — chưa cần khi nền tảng đáp ứng nhu cầu, ngân sách; cần khi giới hạn đã đo buộc chuyển và có người chịu trách nhiệm vận hành.

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

Viết code ít tốn công; sở hữu vẫn tốn phí. Mỗi thành phần cần vá bảo mật, biến môi trường đúng ở máy cá nhân, Preview, Production và đọc lại khi AI sửa tính năng liên quan. Nó thêm một chỗ có thể hỏng mà bạn phải vận hành sau khi AI viết xong.

### Nếu bỏ hàng đợi Redis và chỉ chạy một tác vụ theo lịch mỗi ngày, bạn mất gì và được gì?

Mất: gửi hàng chục nghìn email cùng lúc, thử lại riêng từng email, gửi đúng phút. Được: bớt một dịch vụ trả phí, hai thư viện, một tiến trình cần giám sát; luồng dữ liệu ngắn, dễ lần theo khi hỏng. Với 40 khách/ngày, phần mất đi chưa cần.

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

Mục tiêu: kê các thành phần app phụ thuộc để thấy toàn bộ chi phí bảo trì. Chỉ đọc và ghi chép, không sửa code.

### Việc cần làm

1. Tạo một bảng ba cột: "Thành phần", "Phục vụ nhu cầu nào", "Nếu hỏng thì tôi biết bằng cách nào".
2. Điền mọi dịch vụ ngoài đang dùng (hosting, database, email, thanh toán, AI...) dựa trên danh sách biến môi trường.
3. Điền mười thư viện trong `dependencies` mà bạn ít hiểu nhất.
4. Đánh dấu những dòng mà cột hai hoặc cột ba bạn không điền được.
5. Chọn một dòng đã đánh dấu và hỏi AI bằng bốn câu hỏi ở phần Ví dụ mẫu. Chưa cho AI sửa gì.

### Kết quả đúng

Bạn có một bảng kê mà dòng nào cũng có lý do tồn tại, hoặc được đánh dấu rõ là "chưa biết vì sao cần". Bạn nêu được ít nhất một thành phần có thể bỏ hoặc thay bằng thứ đã có, kèm lý do.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy lệnh ghi/xóa/push, không đọc hay in khóa bí mật. Không mở .env* hoặc gọi dịch vụ.
Chỉ rà bảng kê, tên biến và code đã chỉ định; không mở cấu hình chứa giá trị bí mật.
1. Dịch vụ ngoài và mười thư viện: cách kiểm: đối chiếu bảng với danh sách tên dịch vụ đã che và dependencies trong package.json.
2. Lý do và phát hiện sự cố: cách kiểm: chỉ từng ô còn thiếu trong hai cột, không tự điền bằng phỏng đoán.
3. Thành phần được chọn: cách kiểm: đối chiếu bốn câu trả lời về phương án đơn giản, thành phần thêm, chi phí, người vận hành và dấu hiệu cần nâng cấp; nêu file/dòng dùng nó nếu có.
Báo cáo từng điểm: đạt / chưa đạt / chưa xác minh, kèm bằng chứng và phần còn thiếu.
```
