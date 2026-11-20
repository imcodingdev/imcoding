---
id: idempotency-retries
title: "Bấm hai lần, trừ tiền hai lần: thao tác lặp lại an toàn"
group: api
prerequisites: [http-request-response, async-requests, error-handling, forms-validation]
priority: 1
stage: 3
format: 2
signals: ["Idempotency-Key", "idempotencyKey", "event.id", "event.type", "POST"]
sources:
  - title: MDN — Idempotent
    url: https://developer.mozilla.org/en-US/docs/Glossary/Idempotent
  - title: Stripe Docs — Idempotent requests
    url: https://docs.stripe.com/api/idempotent_requests
  - title: Stripe Docs — Webhooks
    url: https://docs.stripe.com/webhooks
---

## Nhắc lại

### Hết thời gian chờ có chứng minh máy chủ chưa làm gì không?

Không. Có thể yêu cầu chưa tới, hoặc máy chủ đã làm xong nhưng phản hồi chưa về. Lỗi kết nối không tự cho biết trạng thái nghiệp vụ cuối cùng.

### Khóa nút gửi ở form bảo vệ được tới đâu?

Nó giảm bấm lặp trong giao diện đó. Máy chủ vẫn có thể nhận yêu cầu từ tab khác, lần gửi lại hoặc công cụ gọi trực tiếp, nên cần tự chống trùng.

## Đoán trước

Trong app thử, bạn bấm thanh toán. Màn hình quay rồi báo lỗi mạng. Agent sửa bằng cách “gửi lại cho tới khi thành công”. Lần sau màn hình báo trả tiền một lần, nhưng dữ liệu thử có hai giao dịch. Vì sao thử lại có thể làm sự cố nặng hơn?

### Đáp án

Lần đầu có thể đã thành công, chỉ mất phản hồi. Gửi lại như một thao tác mới tạo thêm tác động. Phải nhận ra đây là lần thử lại của cùng một ý định, rồi trả hoặc đối chiếu kết quả cũ thay vì thực hiện thêm.

## Ví dụ mẫu

Bạn đưa phiếu nhận đồ cho nhân viên rồi chưa nghe trả lời. Đưa lại bản sao phiếu không nên khiến nhân viên giao thêm một bộ đồ. Điều quan trọng là mã phiếu đại diện cho cùng một việc. Nếu đổi mã mỗi lần đưa, nhân viên có thể hiểu đó là hai đơn khác nhau.

**Idempotent** nghĩa là thực hiện cùng một yêu cầu nhiều lần có tác động dự định lên máy chủ giống như thực hiện một lần. Nó không đòi phản hồi từng lần giống hệt nhau, cũng không cấm ghi thêm nhật ký. Theo MDN, các phương thức an toàn như GET, HEAD, OPTIONS, TRACE được coi là idempotent; PUT và DELETE cũng vậy. POST và PATCH không được bảo đảm tính chất đó theo ngữ nghĩa HTTP.

Ví dụ DELETE lần đầu xóa tài nguyên, lần sau tài nguyên không còn. Mã phản hồi có thể khác, nhưng không có thêm một tài nguyên khác bị xóa. Dù dùng phương thức nào, code máy chủ vẫn phải thực hiện đúng ngữ nghĩa. Đổi tên phương thức thành PUT không tự sửa logic cộng tiền bị lặp.

**Retry**, thử lại, hữu ích khi không chắc yêu cầu đã tới. Nhưng với thao tác có tác động như tạo thanh toán, cần cơ chế nhận diện lần thử lại trước. **Idempotency key** là khóa duy nhất để dịch vụ nhận ra các lần gửi thuộc cùng yêu cầu. Nó không phải khóa bí mật để đăng nhập. Không đưa email hoặc thông tin cá nhân vào khóa.

Hai ghi chú dưới minh họa cách đọc thiết kế, không phải lệnh gọi thanh toán:

```text
SAI: cùng ý định thanh toán đơn giả DEMO-1
Lần đầu: key = demo-operation-a
Mất phản hồi; lần thử lại: key = demo-operation-b
Hai key khác nhau khiến dịch vụ có thể coi là hai việc mới.
```

```http
POST /v1/payment_intents
Idempotency-Key: demo-operation-a

# Minh họa HTTP, không chạy; chỉ dùng Stripe ở chế độ test.
# Thử lại cùng thao tác: giữ key và tham số như lần đầu.
# Một thao tác mới thực sự cần key mới, không dùng chung mọi đơn.
```

Tài liệu Stripe phân biệt phiên bản API. Với **API v1**, khi việc thực thi endpoint đã bắt đầu, Stripe lưu mã trạng thái và nội dung phản hồi của yêu cầu đầu theo key. Gửi lại cùng key trả phản hồi đã lưu, kể cả lỗi `500`. Vì vậy đừng thấy lỗi là đổi key liên tục để ép một kết quả thành công. Trước hết cần biết thao tác cũ đang ở trạng thái nào.

Với API v1, key có thể được loại bỏ khi đã ít nhất 24 giờ tuổi. Dùng lại sau khi bản cũ đã bị loại bỏ có thể tạo yêu cầu mới. Đây không phải sổ chống trùng tồn tại mãi. Hệ thống của bạn vẫn cần lưu mối liên hệ giữa đơn và thao tác để đối chiếu khi người dùng quay lại muộn.

Stripe so sánh tham số của yêu cầu gửi lại với yêu cầu gốc; cùng key mà đổi tham số thì báo lỗi. Nếu khách đổi nội dung đơn, phải xác định đó có phải một thao tác mới và giải quyết trạng thái thao tác cũ trước. Không dùng một key cố định cho mọi đơn, cũng không tự tạo key mới mỗi lần mạng lỗi.

API v1 chỉ lưu kết quả sau khi endpoint bắt đầu thực thi. Nếu tham số không hợp lệ hoặc xung đột với yêu cầu đang chạy đồng thời, kết quả idempotent chưa được lưu và có thể thử lại theo hướng dẫn xử lý lỗi. Tất cả yêu cầu POST của API v1 nhận idempotency key; gửi key trong GET hoặc DELETE không có tác dụng. API v2 có hành vi thử lại khác, nên yêu cầu agent xác nhận phiên bản đang tích hợp trước khi áp dụng quy tắc lưu phản hồi này.

**Webhook** là thông báo dịch vụ gửi về máy chủ của bạn khi có sự kiện. Stripe có thể gửi cùng một sự kiện nhiều lần. Ghi lại **event ID** đã xử lý và bỏ qua việc xử lý lại ID đó. Đừng dùng thời điểm tạo làm mã chống trùng; các sự kiện khác nhau có thể cùng thời điểm. Cũng không dựa vào thứ tự nhận để quyết định chắc chắn trạng thái.

Có trường hợp hai Event riêng biệt biểu diễn thông báo trùng về đối tượng. Tài liệu Stripe hướng dẫn nhận diện bằng ID trong `data.object` kết hợp `event.type`. Cần xác định quy tắc nghiệp vụ phù hợp, không bỏ qua mọi sự kiện của một đơn chỉ vì đã thấy đơn đó trước đây.

Idempotency key cho yêu cầu gửi đi và event ID cho webhook nhận về giải quyết hai đường khác nhau. Có key không tự ngăn webhook cộng quyền hai lần. Khi rà thiết kế, hỏi agent việc ghi dấu đã xử lý và cập nhật nghiệp vụ có thể bị chen ngang hoặc bị ngắt giữa chừng không. Một câu “đã có bảng event” chưa chứng minh toàn bộ luồng an toàn.

## Tìm trong project của bạn

Chỉ đọc code và tài liệu được phép; không mở file khóa hoặc gửi yêu cầu thanh toán thật.

1. Tìm `POST`, `payment`, `Idempotency-Key`, `idempotencyKey` trong phần máy chủ gọi dịch vụ. Ghi `[thao tác / nơi tạo key / nơi giữ key qua lần thử lại]`.
2. Đọc nhánh xử lý lỗi mạng. Ổn: cùng ý định giữ key, có đối chiếu trạng thái. Có vấn đề: mỗi retry tự sinh key mới hoặc luôn tạo đơn mới.
3. Tìm `webhook`, `event.id`, `event.type` trong route nhận thông báo. Ghi `[nơi lưu event ID đã xử lý / cách nhận bản gửi lại]`. Chỉ ghi log ra màn hình chưa phải cơ chế tra chống trùng bền vững.
4. Hỏi agent phiên bản Stripe API và cách xử lý cùng key khác tham số, key đã hết thời gian lưu, yêu cầu đang xử lý. Không tìm thấy thì ghi chưa rõ, không suy rằng thư viện tự lo hết.
5. Lập bảng `[lần gửi / ý định nghiệp vụ / key giả / số tác động cuối]` bằng dữ liệu thử. Tách luồng gửi yêu cầu khỏi luồng nhận webhook để không bỏ sót một phía.

## Tự giải thích

### Vì sao không cứ có lỗi là cho phép thử lại ngay?

Lỗi quan sát được có thể chỉ là mất phản hồi. Nếu chưa biết thao tác đã xảy ra chưa, thử lại như việc mới có thể làm thêm tác động. Cần giữ nhận diện thao tác và kiểm trạng thái, đồng thời cho người dùng biết đang chờ xác nhận.

### Vì sao chống trùng không có nghĩa cấm khách mua lần thứ hai?

Hai lần mua thực sự là hai ý định khác nhau. Cơ chế cần chặn bản gửi lại của cùng một việc, không chặn mọi việc giống nhau. Gắn key với thao tác cụ thể thay vì chỉ tên khách hoặc nội dung giỏ hàng.

## Trắc nghiệm

### Cursor thêm “tạo key mới” trong mỗi lần retry sau lỗi mạng. Bạn nhận xét gì?

- [x] Có thể tạo tác động mới; cùng thao tác cần giữ key và đối chiếu trạng thái
- [ ] Đúng vì key càng mới càng chống trùng tốt
- [ ] Chỉ cần khóa nút lâu hơn là đủ
- [ ] Chỉ đổi POST thành PUT là giải quyết xong

**Giải thích:** Key mới có thể đại diện yêu cầu mới. Khóa nút không kiểm soát lần thử lại ở máy chủ, còn phương thức HTTP không tự sửa logic.

### Log thử có hai lần nhận cùng `event.id`; agent nói key gửi đi đã bảo vệ rồi. Cần gì?

- [ ] Tin key vì mọi đường đều dùng chung cơ chế
- [x] Kiểm nơi lưu event ID đã xử lý và bỏ qua tác động của bản gửi lại
- [ ] Cộng quyền lần nữa vì mỗi lần nhận là một giao dịch mới
- [ ] Chỉ dùng giờ nhận làm mã chống trùng

**Giải thích:** Webhook là luồng nhận riêng. Key của yêu cầu gửi đi không tự khiến bộ xử lý webhook nhận ra bản trùng.

### Cùng key Stripe API v1 nhưng số tiền trong tham số đổi. Điều nào đúng?

- [ ] Stripe luôn hiểu đây là sửa đơn cũ
- [ ] Cứ gửi cho tới khi được chấp nhận
- [x] Stripe báo lỗi khác tham số; cần xác định lại ý định và trạng thái thao tác
- [ ] Key chỉ áp dụng cho GET

**Giải thích:** So sánh tham số giúp tránh dùng nhầm key. Đổi key mù quáng có thể bỏ qua việc cũ đã thực hiện.

### Key API v1 đã bị loại bỏ sau thời gian lưu. Gửi lại key ấy có bảo đảm trả kết quả cũ không?

- [ ] Có, key được giữ vĩnh viễn
- [ ] Có, miễn nút vẫn bị khóa
- [ ] Có, nếu nội dung giống lần trước
- [x] Không; có thể thành yêu cầu mới, cần đối chiếu hồ sơ thao tác của app

**Giải thích:** Stripe cho phép loại bỏ key khi đã ít nhất 24 giờ tuổi. Cơ chế đó không thay sổ theo dõi nghiệp vụ lâu dài của bạn.

## Kiểm tra không dùng AI

### App tặng lượt học nhận lại cùng thông báo hoàn thành đơn, rồi cộng thêm lượt lần nữa. Nút thanh toán đã khóa và yêu cầu gửi đi có key. Chỉ ra phần thiếu và bằng chứng cần kiểm.

#### Đáp án

Thiếu chống xử lý lặp ở đường nhận thông báo. Kiểm nơi lưu event ID đã hoàn tất và việc tra bản gửi lại trước tác động. Trong project thử, phát lại cùng sự kiện giả rồi đếm lượt học: chỉ tăng một lần. Cần xem dữ liệu cuối, không chỉ thông báo “đã bỏ qua” trong log. Key gửi đi bảo vệ thao tác phía dịch vụ, không tự bảo vệ lần cộng lượt trong app.

## Lỗi suy luận hay gặp

### “Không nhận được phản hồi nghĩa là chưa thanh toán”

Máy chủ có thể đã xử lý xong. Hiển thị trạng thái chưa xác nhận và đối chiếu kết quả trước, không mời khách tạo thêm giao dịch mới ngay.

### “Có key là mọi tác động đều đúng một lần”

Key có phạm vi và thời gian lưu; webhook và cập nhật dữ liệu riêng vẫn có thể lặp. Yêu cầu agent chỉ từng nơi tạo tác động và cách bảo vệ tương ứng.

### “Thử lại vô hạn rồi cũng thành công”

Lỗi tham số không biến mất vì gửi nhiều hơn. Phân loại lỗi, giới hạn lần thử và có đường kiểm trạng thái hoặc báo cần hỗ trợ, tránh vòng gửi không dừng.

## Bài tập thực hành

Mục tiêu: kiểm cùng một ý định có tạo tác động lặp không. Chỉ dùng project thử tách biệt, dữ liệu giả và bộ mô phỏng cục bộ; nếu tích hợp Stripe thì bắt buộc chế độ test, không tài khoản thanh toán thật, tiền thật hay khóa thật trong chat.

### Việc cần làm

1. Chọn thao tác thử tạo đơn giả, ghi ID và key giả tương ứng. Xác nhận môi trường không kết nối dữ liệu thật.
2. Nhờ agent chuẩn bị ca mất phản hồi sau xử lý trong bộ mô phỏng; thử gửi lại cùng thao tác và cùng key.
3. Đếm tác động cuối trong dữ liệu thử, rồi thử một ý định mới với key mới để bảo đảm không chặn nhầm.
4. Phát lại cùng webhook giả với cùng event ID; kiểm việc cấp quyền hoặc cộng lượt chỉ xảy ra một lần.
5. Ghi các ca chưa kiểm được, gồm khác tham số và key đã bị loại bỏ. Không tạo giao dịch thật để hoàn tất bài tập.

### Kết quả đúng

Bảng kết quả phân biệt yêu cầu gửi đi với webhook nhận về. Cùng ý định chỉ tạo một tác động trong ca đã thử; ý định mới vẫn hoạt động. Có dữ liệu cuối làm bằng chứng và ghi rõ phần mô phỏng chưa thay thế kiểm tích hợp ở chế độ test.
