---
id: browser-devtools
title: Công cụ kiểm tra của trình duyệt (DevTools)
group: web
prerequisites: [html-css-js, http-request-response]
priority: 2
stage: 2
format: 2
signals:
  - "console.log"
  - "console.error"
  - "fetch("
  - "localStorage"
  - "res.status"
---

## Nhắc lại

### Theo bài HTML, CSS và JavaScript, với một nút bấm, lớp nào tạo khung và nội dung, lớp nào tạo màu sắc, lớp nào xử lý hành động?

HTML tạo khung và nội dung nút, CSS tạo màu sắc và bố cục, JavaScript xử lý hành động như `onClick`. Đây là vai trò của ba lớp, không phải cách kết luận nguyên nhân chỉ từ triệu chứng: nút không bấm được còn có thể do thuộc tính `disabled` của HTML.

### Máy chủ trả mã `500` nhưng màn hình vẫn hiện "Thành công". Vì sao chuyện này xảy ra được?

Vì `fetch()` chỉ tự báo lỗi khi không kết nối được. Máy chủ trả `400` hay `500` vẫn được coi là đã nhận phản hồi. Nếu code thiếu bước kiểm tra `res.ok`, giao diện đi tiếp và báo thành công.

## Đoán trước

Bạn nhờ AI làm trang "Sửa hồ sơ". Bấm Lưu, màn hình hiện "Đã lưu!". Tải lại trang thì tên vẫn như cũ. Bạn báo AI, AI trả lời "đã sửa lỗi lưu dữ liệu". Thử lại vẫn vậy. Bạn báo lần nữa, AI sửa một file khác và lại báo đã xong. Sau bốn vòng, tính năng vẫn hỏng và AI đã đụng vào sáu file. Mỗi lần bạn chỉ mô tả được một câu: "bấm Lưu không lưu". Có cách nào để chính bạn, không cần đọc code, biết được sự cố nằm ở trình duyệt, ở đường truyền hay ở máy chủ?

### Đáp án

Có. Mọi trình duyệt có sẵn bộ **DevTools (công cụ dành cho nhà phát triển)**, mở bằng phím `F12` hoặc chuột phải chọn Inspect. Tab **Network** ghi lại mọi yêu cầu trình duyệt gửi đi. Mở tab này rồi bấm Lưu, bạn sẽ rơi vào một trong ba ca. Không có dòng nào hiện ra: nút chưa gửi gì, lỗi ở JavaScript trên trình duyệt. Có dòng màu đỏ với mã `401` hay `500`: yêu cầu đã tới nhưng máy chủ từ chối. Có dòng mã `200`: phải mở nội dung phản hồi ra xem máy chủ thật sự trả lời gì. Chỉ một lần nhìn đã loại được hai phần ba khả năng.

## Ví dụ mẫu

Ô tô có bảng đồng hồ và cổng chẩn đoán. Tài xế không cần biết sửa máy, nhưng cần đọc được đèn nào đang sáng để nói với thợ cho đúng. DevTools là bảng đồng hồ của trang web. Bốn tab đáng biết:

- **Elements**: khung HTML và CSS đang hiển thị thật. Dùng khi giao diện sai hình dáng.
- **Console**: nhật ký của JavaScript trên trình duyệt. Dòng đỏ là lỗi, kèm tên file và số dòng.
- **Network**: từng yêu cầu gửi đi và phản hồi nhận về, có mã trạng thái.
- **Application**: thứ trang web đang cất trên máy bạn, gồm cookie và Local Storage.

Đọc một lỗi trong Console:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (ProductList.tsx:12:21)
```

Dòng đầu nói chuyện gì xảy ra: code định duyệt một danh sách, nhưng thứ nhận được đang rỗng. Dòng hai nói ở đâu: file `ProductList.tsx`, dòng 12. Đây là lỗi thuộc lớp ___ trong ba lớp của trang web.

Đọc một dòng trong Network sau khi bấm Lưu, rồi bấm vào dòng đó và mở tab Response:

```text
Name      Method  Status  Type   Time
profile   POST    500     fetch  412 ms

Response:
{"error":"new row violates row-level security policy for table \"profiles\""}
```

Chỉ từ hai khối này, bạn đã biết: nút có gửi yêu cầu, yêu cầu tới được máy chủ, máy chủ thất bại, và lý do nằm ở chính sách bảo mật của bảng `profiles` trong database. Giao diện hiện "Đã lưu!" là một lỗi thứ hai: code không kiểm tra `res.ok`.

## Tìm trong project của bạn

Lần này bạn tìm trong trình duyệt. Mở app ở máy cá nhân hoặc bản preview, bấm `F12`.

1. **Xem Console lúc vừa tải trang.** Tải lại trang chính. Đếm số dòng đỏ. Đọc dòng đầu tiên của lỗi đỏ đầu tiên và ghi lại tên file.
2. **Ghi lại một hành động quan trọng trong Network.** Mở tab Network, chọn bộ lọc `Fetch/XHR`, tick `Preserve log` để danh sách không bị xóa khi chuyển trang. Bấm nút chính của app (Lưu, Đặt hàng, Gửi). Ghi lại tên yêu cầu, cột Method và cột Status.
3. **Mở phản hồi ra đọc.** Bấm vào dòng yêu cầu đó, xem tab Payload (thứ trình duyệt gửi đi) và tab Response (thứ máy chủ trả về).
4. **Xem app cất gì trên máy người dùng.** Mở tab Application, xem mục Local Storage và Cookies.
5. **Tìm khóa bí mật lọt xuống trình duyệt.** Mở ô tìm kiếm của DevTools (`Ctrl+Shift+F` trên Windows, `Cmd+Option+F` trên Mac), tìm `service_role`, `sk-`, `SECRET`.
6. **Phân loại:**
   - Thấy thế này là ổn: Console không có dòng đỏ khi dùng bình thường; mỗi lần bấm nút có đúng một yêu cầu với mã `2xx`; hành động sai trả mã `4xx` kèm thông báo rõ; khóa `anon` của Supabase có xuất hiện (khóa này được thiết kế để công khai, dữ liệu do RLS bảo vệ).
   - Thấy thế này là có vấn đề: bấm một lần mà gửi nhiều yêu cầu giống nhau; mã `200` nhưng Response chứa `error`; Response trả về nhiều dữ liệu hơn màn hình cần, như email của người dùng khác; tìm thấy khóa `service_role` hoặc khóa `sk-`.
7. **Ghi lại kết quả của bạn:**
   - Số lỗi đỏ trong Console lúc tải trang: `[ ... ]`
   - Yêu cầu của nút chính: `[ tên: ... - Method: ... - Status: ... ]`
   - Có khóa bí mật nào tìm thấy trong trình duyệt không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao câu "bấm Lưu không lưu" khiến AI sửa lòng vòng, còn "POST /api/profile trả 500, nội dung phản hồi là..." thì không?

Câu đầu khớp với hàng chục nguyên nhân: nút không gắn hành động, gửi sai địa chỉ, chưa đăng nhập, database từ chối, giao diện không tải lại. AI phải đoán và thường đoán cái dễ sửa nhất. Câu sau chỉ ra đúng chặng hỏng và lý do máy chủ đưa ra. Phạm vi sửa thu hẹp lại còn một file, bạn cũng dễ kiểm tra lại: sửa xong thì mã trạng thái phải đổi.

### Bạn sửa giá trong tab Elements từ 500.000đ thành 5.000đ và màn hình hiện 5.000đ. Điều này có nghĩa app bị hack không?

Chưa. Elements chỉ sửa bản sao của trang trên máy bạn, tải lại là mất. Ai cũng làm được việc này với bất kỳ trang web nào. Nó chỉ thành sự cố khi máy chủ tin con số do trình duyệt gửi lên. Cách kiểm tra: xem tab Payload của yêu cầu đặt hàng. Nếu trong đó có giá hoặc tổng tiền, hãy hỏi AI máy chủ có tự tính lại không.

### Vì sao người dùng không biết DevTools là gì cũng không làm app an toàn hơn?

Vì kẻ xấu thì biết. Mọi thứ gửi xuống trình duyệt đều đọc được: code JavaScript, nội dung phản hồi, thứ cất trong Local Storage. Giấu một nút hay một trường dữ liệu bằng CSS không che được nó trong tab Network. Quy tắc dùng khi xem DevTools: thứ gì tôi thấy được ở đây thì mọi người dùng cũng thấy được.

## Trắc nghiệm

### Bạn mở tab Network, bấm nút "Đặt hàng" ba lần. Không có dòng nào mới hiện ra, Console cũng trống. Nên báo cho AI điều gì?

- [ ] "API đặt hàng trên máy chủ đang lỗi, hãy sửa file route"
- [x] "Bấm nút không gửi yêu cầu nào; hãy kiểm tra hành động gắn với nút ở phía trình duyệt"
- [ ] "Database đang từ chối lưu đơn"
- [ ] "Mạng bị chậm, hãy tăng thời gian chờ"

**Giải thích:** Không có dòng nào trong Network nghĩa là trình duyệt chưa gửi gì. Máy chủ và database chưa hề được hỏi tới nên chưa thể là nơi lỗi. Mạng chậm thì vẫn có dòng hiện ra ở trạng thái đang chờ. Lỗi nằm ở lớp JavaScript của nút.

### Trong tab Network bạn thấy địa chỉ dự án Supabase và một khóa `anon` dài nằm trong yêu cầu. AI viết trong báo cáo: "khóa anon hiển thị ở trình duyệt là bình thường". Nhận định nào đúng?

- [ ] AI sai, mọi khóa xuất hiện trong trình duyệt đều là lộ khóa
- [ ] AI đúng, và vì thế khóa `service_role` hiện ở trình duyệt cũng không sao
- [x] AI đúng với khóa `anon`; việc cần làm là kiểm tra các bảng đã bật RLS, và khóa `service_role` tuyệt đối không được xuất hiện ở đây

**Giải thích:** Khóa `anon` được thiết kế để dùng ở trình duyệt. Thứ bảo vệ dữ liệu là chính sách RLS trên từng bảng. Khóa `service_role` bỏ qua RLS nên chỉ được nằm ở máy chủ. Thấy nó trong DevTools là sự cố cần thu hồi khóa ngay.

### Trang đơn hàng hiện đúng 3 đơn của bạn. Bạn mở Network, bấm vào yêu cầu `orders`, tab Response hiện như dưới đây. Kết luận nào đúng?

```text
[{"id":1,"user_email":"ban@example.com","total":120000},
 {"id":2,"user_email":"khach-khac@example.com","total":900000},
 {"id":3,"user_email":"ban@example.com","total":45000},
 ... thêm 212 dòng nữa]
```

- [x] Máy chủ đang gửi đơn của mọi khách xuống trình duyệt; giao diện chỉ lọc lại để hiển thị
- [ ] Không sao, vì màn hình chỉ hiện đơn của tôi
- [ ] Đây là dữ liệu mẫu do DevTools tự tạo

**Giải thích:** Response là thứ thật sự rời khỏi máy chủ. Màn hình chỉ là phần giao diện chọn để vẽ ra. Bất kỳ khách nào mở Network cũng đọc được đơn và email của người khác. Việc lọc theo người dùng phải làm ở máy chủ hoặc bằng RLS, không làm ở giao diện.

### AI báo "đã sửa lỗi trang trắng". Bạn tải lại vẫn trắng. Console hiện dòng dưới đây. Thông tin nào đáng gửi cho AI nhất?

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (ProductList.tsx:12:21)
```

- [ ] "Vẫn trắng, sửa lại đi"
- [ ] Ảnh chụp màn hình trang trắng
- [ ] Toàn bộ nội dung tab Application
- [x] Nguyên văn hai dòng lỗi, kèm thao tác bạn làm ngay trước đó

**Giải thích:** Hai dòng lỗi cho biết loại lỗi, tên file và số dòng. Kèm thao tác tái hiện thì AI có đủ dữ kiện để sửa đúng chỗ. Ảnh trang trắng không chứa thông tin gì. Tab Application chứa cookie phiên đăng nhập, không nên dán vào chat.

## Kiểm tra không dùng AI

### Tình huống: Sau khi deploy lên Vercel, trang "Đơn hàng của tôi" quay vòng tải mãi không dừng. Ở máy cá nhân vẫn chạy tốt. Bạn mở DevTools trên bản đã deploy và thấy như dưới đây. Hãy nêu bạn đọc được gì, kiểm tra thêm gì, và sẽ gửi cho AI những gì.

```text
Console: (không có dòng đỏ)

Network:
Name     Method  Status  Type   Time
orders   GET     401     fetch  88 ms

Response:
{"error":"Chưa đăng nhập"}
```

#### Đáp án

1. **Đọc được gì:** yêu cầu có được gửi và máy chủ trả lời nhanh, nên không phải mất mạng hay sập máy chủ. Mã `401` nghĩa là máy chủ chưa nhận ra người dùng. Console không đỏ vì với `fetch`, mã `401` không phải là lỗi kết nối.
2. **Hai lỗi tách biệt:** một là máy chủ không thấy phiên đăng nhập trên bản deploy. Hai là giao diện không xử lý trường hợp `res.ok` sai nên quay vòng mãi thay vì báo lỗi hoặc chuyển về trang đăng nhập.
3. **Kiểm tra thêm:** mở tab Application, mục Cookies, xem có cookie phiên đăng nhập cho tên miền đang mở không. Thử đăng xuất rồi đăng nhập lại ngay trên bản deploy. Vì chỉ lỗi trên Vercel, đối chiếu thêm biến môi trường và cấu hình địa chỉ trang trong phần xác thực giữa hai môi trường.
4. **Gửi cho AI:** địa chỉ và Method của yêu cầu, mã `401`, nguyên văn Response, ghi chú "máy cá nhân chạy tốt, chỉ lỗi trên bản deploy", và việc cookie có hay không. Không dán giá trị cookie, token hay nội dung "Copy as cURL" vào chat, vì chúng chứa thẻ đăng nhập của bạn.

## Lỗi suy luận hay gặp

### "Console không có dòng đỏ nghĩa là không có lỗi"

- **Vì sao sai:** Console chỉ ghi lỗi của JavaScript trên trình duyệt. Máy chủ trả `401`, `500`, hoặc trả `200` kèm nội dung báo lỗi đều có thể không để lại dòng đỏ nào.
- **Cách sửa:** Luôn xem hai tab. Console cho lỗi phía trình duyệt, Network cho cuộc trao đổi với máy chủ. Với mã `200`, mở cả Response ra đọc.

### "AI nói đã sửa xong thì không cần mở DevTools nữa"

- **Vì sao sai:** AI thường kết luận dựa trên việc code đã được viết lại, không dựa trên việc trang đã chạy đúng trong trình duyệt của bạn. Khảo sát Stack Overflow 2025 ghi nhận 66% lập trình viên khó chịu vì kết quả AI "gần đúng nhưng chưa đúng".
- **Cách sửa:** Sau mỗi lần AI báo xong, làm lại đúng thao tác cũ với tab Network đang mở. Coi là xong khi mã trạng thái và nội dung phản hồi đã đổi đúng như mong đợi.

## Bài tập thực hành

Mục tiêu: tự lập một "phiếu bằng chứng" cho một hành động trong app, đủ để giao cho AI mà không cần mô tả bằng cảm giác. Làm trên máy cá nhân hoặc bản preview, với tài khoản thử.

### Việc cần làm

1. Mở app, bấm `F12`, vào tab Network, chọn bộ lọc `Fetch/XHR` và tick `Preserve log`.
2. Thực hiện một hành động có lưu dữ liệu, ví dụ sửa tên hồ sơ bằng tài khoản thử.
3. Ghi vào phiếu: tên yêu cầu, Method, Status, thời gian, nội dung Payload và nội dung Response (che đi mọi token nếu có).
4. Chuyển sang Console, ghi số dòng đỏ và nguyên văn dòng đầu tiên nếu có.
5. Cố tình làm sai một lần, ví dụ để trống ô bắt buộc rồi bấm Lưu. Ghi phiếu thứ hai.
6. So hai phiếu: lần sai có trả mã `4xx` kèm thông báo rõ ràng không, hay vẫn là `200`?

### Kết quả đúng

Bạn có hai phiếu, mỗi phiếu đủ Method, Status, Payload, Response. Bạn nói được hành động đó gửi đi đâu và máy chủ phản ứng khác nhau thế nào giữa lần đúng và lần sai. Nếu lần sai vẫn trả `200` hoặc không gửi yêu cầu nào mà giao diện cũng không báo gì, đó là việc cần giao cho AI.

### Nhờ AI rà lại

```text
Đây là bằng chứng từ DevTools khi tôi bấm [tên nút]:
- Yêu cầu: [Method] [địa chỉ], Status [mã]
- Payload: [nội dung, đã che token]
- Response: [nội dung]
- Console: [nguyên văn dòng lỗi, hoặc "không có"]
Hãy cho biết chặng nào đang hỏng (trình duyệt, máy chủ, database)
và file nào liên quan. Chỉ báo cáo, không sửa bất kỳ file nào.
```
