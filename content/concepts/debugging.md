---
id: debugging
title: Tái hiện và khoanh vùng lỗi (Debugging)
group: systems
prerequisites: [browser-devtools, data-flow, error-handling]
priority: 1
stage: 2
format: 2
signals:
  - "console.error"
  - "console.log"
  - "catch ("
  - "Error:"
  - "status: 500"
---

## Nhắc lại

### Trong DevTools của trình duyệt, tab Console và tab Network cho bạn hai loại thông tin khác nhau nào?

Console hiện các lỗi và thông báo do code chạy trên trình duyệt in ra. Network liệt kê từng request mà trang đã gửi đi, kèm mã trạng thái (200, 401, 500...) và nội dung máy chủ trả về.

### Theo bài Dòng chảy dữ liệu, một tính năng lưu dữ liệu đi qua những trạm nào?

Giao diện thu thập thông tin, gửi request lên API endpoint, API endpoint xử lý, ghi vào database rồi trả kết quả, cuối cùng giao diện cập nhật lại màn hình.

## Đoán trước

Một khách nhắn cho bạn: "Chị ơi em không đặt lịch được". Bạn dán nguyên câu đó vào Cursor và viết thêm "sửa giúp tôi". AI sửa 4 file rồi báo đã xong. Bạn thử trên máy mình thì đặt lịch được, nhưng thật ra trước đó bạn cũng đặt được. Hôm sau khách vẫn báo lỗi. Lần hai AI sửa thêm 3 file và đổi cả cách kiểm tra ô ngày giờ. Lần ba, tính năng gửi email nhắc lịch vốn đang chạy tốt lại hỏng theo. Vì sao AI sửa ba vòng mà vẫn không trúng lỗi của khách?

### Đáp án

Vì chưa ai nhìn thấy lỗi. Bạn không biết khách bấm những gì, dùng tài khoản nào, trên thiết bị nào, màn hình hiện gì. AI cũng không biết, nên nó đoán một nguyên nhân nghe hợp lý rồi sửa theo phỏng đoán đó. Mỗi lần đoán trượt là một lần code đang đúng bị sửa. Khi bạn hỏi lại khách và làm theo đúng các bước của họ, hóa ra lỗi chỉ xảy ra khi chọn khung giờ sau 22:00, và tab Network hiện rõ `POST /api/bookings` trả về mã 400. Có bằng chứng này thì việc sửa chỉ nằm trong một file. Khảo sát Stack Overflow 2025 ghi nhận 45,2% lập trình viên thấy debug code AI viết tốn thời gian hơn; sửa mò là cách nhanh nhất để rơi vào nhóm đó.

## Ví dụ mẫu

Thợ sửa xe giỏi không tháo máy ngay khi bạn nói "xe kêu lạ". Họ bảo bạn nổ máy, chạy thử, nghe xem tiếng kêu phát ra lúc nào, ở đâu. **Debugging** (gỡ lỗi) trong phần mềm cũng đi theo đúng thứ tự đó, gồm bốn việc:

1. **Tái hiện:** tìm ra các bước làm cho lỗi xuất hiện lại, lần nào cũng xuất hiện.
2. **Ghi kỳ vọng và thực tế:** đáng lẽ phải thấy gì, thực tế thấy gì.
3. **Thu bằng chứng:** chép nguyên văn dòng đỏ ở Console, request lỗi ở Network, dòng lỗi trong log (nhật ký) của máy chủ.
4. **Khoanh vùng:** dựa vào bằng chứng để biết lỗi nằm ở trạm nào trên dòng chảy dữ liệu.

Xong bốn việc này bạn mới nhờ AI. Cách nhờ SAI:

```text
Khách bảo không đặt lịch được. Sửa giúp tôi.
```

Cách nhờ ĐÚNG là gửi một bản ghi lỗi:

```text
Bước tái hiện: đăng nhập tài khoản khách thử, vào /dat-lich,
  chọn ngày mai, giờ 22:30, bấm "Xác nhận".
Kỳ vọng: hiện "Đặt lịch thành công", lịch mới có trong danh sách.
Thực tế: nút quay một giây rồi đứng yên, không có thông báo.
Console: không có dòng đỏ.
Network: POST /api/bookings -> 400
  Response: {"error":"invalid time"}
Khoanh vùng: giao diện đã gửi request đi, máy chủ từ chối.
  Vậy lỗi không nằm ở ___
Yêu cầu: giải thích nguyên nhân trước, chưa sửa gì.
```

Dòng cuối rất quan trọng. Khi AI phải nêu nguyên nhân trước, bạn có cơ hội đối chiếu lời giải thích với bằng chứng. Nếu AI nói "do nút bấm bị hỏng" trong khi Network cho thấy request đã đi, bạn biết ngay nó đang đoán.

## Tìm trong project của bạn

Chọn một lỗi bạn đang gặp, hoặc một chỗ trong app bạn thấy "thỉnh thoảng kỳ kỳ", rồi làm lần lượt:

1. **Viết các bước tái hiện.** Ghi từng thao tác từ lúc mở trang. Làm lại ba lần. Lỗi xuất hiện cả ba lần là ổn. Lúc có lúc không nghĩa là bạn chưa tìm ra điều kiện gây lỗi (tài khoản, dữ liệu, thiết bị, thời điểm).
2. **Mở Console.** Bấm `F12`, chọn tab Console, làm lại thao tác. Chép nguyên văn dòng màu đỏ đầu tiên, kể cả tên file và số dòng đi kèm.
3. **Mở Network.** Làm lại thao tác, tìm dòng có mã từ 400 trở lên. Bấm vào, xem tab Response. Không có request nào được gửi thì lỗi nằm ở giao diện. Có request và mã 4xx hoặc 5xx thì lỗi nằm phía máy chủ.
4. **Xem log máy chủ.** Khi chạy ở máy mình, log nằm trong cửa sổ terminal đang chạy `npm run dev`. Với bản đã deploy, mở mục Logs của project trên Vercel và tìm theo thời điểm bạn vừa thao tác.
5. **Tìm chỗ lỗi bị nuốt.** Tìm toàn dự án từ khóa `catch (` và `console.error`. Khối `catch` có `console.error(...)` và trả về mã lỗi rõ ràng là ổn. Khối `catch` rỗng, hoặc chỉ `return null`, là có vấn đề: lỗi xảy ra nhưng không để lại dấu vết nào.
6. **Ghi lại:**
   - Các bước tái hiện: `[...]`
   - Kỳ vọng / Thực tế: `[...]`
   - Dòng lỗi ở Console hoặc log: `[nguyên văn]`
   - Request lỗi: `[phương thức, đường dẫn, mã trạng thái]`
   - Trạm nghi ngờ: `[giao diện / request / API / database / cập nhật màn hình]`

## Tự giải thích

### Vì sao phải tái hiện được lỗi trước khi nhờ AI sửa?

Vì các bước tái hiện cũng chính là bài kiểm tra sau khi sửa. Không tái hiện được thì bạn không có cách nào biết lỗi đã hết hay chỉ tạm thời chưa xuất hiện. AI báo "đã xong" cũng không kiểm chứng được.

### Vì sao chép nguyên văn thông báo lỗi lại tốt hơn tả bằng lời của mình?

Thông báo lỗi chứa tên file, số dòng, tên hàm và loại lỗi. Khi bạn tả lại thành "nó báo lỗi gì đó về dữ liệu", các chi tiết đó mất hết và AI phải đoán. Một dòng nguyên văn thường đủ để chỉ ra đúng vị trí.

### Lỗi chỉ xảy ra trên bản đã deploy, còn ở máy bạn thì không. Bạn nghi những khác biệt nào?

Biến môi trường trên Vercel thiếu hoặc khác với `.env.local`. Dữ liệu thật khác dữ liệu thử, ví dụ có dòng bị trống một cột. Tài khoản khách có quyền khác tài khoản của bạn. Vì thế bằng chứng phải lấy từ đúng nơi lỗi xảy ra, tức là log trên Vercel chứ không phải terminal ở máy bạn.

## Trắc nghiệm

### Bạn bấm "Thanh toán" và thấy các dòng sau. Nên xem tiếp ở đâu?

```text
Network:  POST /api/orders   500
Console:  Failed to load resource: the server responded
          with a status of 500
```

- [ ] File giao diện chứa nút "Thanh toán", vì dòng đỏ hiện ở Console của trình duyệt
- [x] Log của máy chủ tại thời điểm đó, vì mã 500 nghĩa là code phía máy chủ gặp lỗi
- [ ] Cài đặt mạng của máy mình, vì request không tới nơi

**Giải thích:** Mã 500 do máy chủ trả về, tức request đã tới nơi và code máy chủ bị lỗi khi xử lý. Console chỉ thuật lại việc đó. Chi tiết thật sự nằm trong log máy chủ: terminal khi chạy ở máy, hoặc mục Logs trên Vercel.

### AI trả lời: "Đã sửa xong. Lỗi do cache, bạn hãy xóa cache trình duyệt." Việc đầu tiên bạn làm là gì?

- [x] Làm lại đúng các bước tái hiện đã ghi để xem lỗi còn hay hết
- [ ] Commit ngay để lưu lại bản đã sửa
- [ ] Nhắn khách rằng lỗi đã được khắc phục
- [ ] Hỏi lại AI xem nó có chắc không

**Giải thích:** Chỉ có các bước tái hiện mới cho biết lỗi còn hay hết. "Do cache" là lời giải thích AI hay đưa ra khi không tìm được nguyên nhân. Hỏi AI có chắc không thì gần như luôn nhận được câu "chắc".

### AI viết đoạn code sau trong API lưu đơn hàng. Khi database từ chối ghi, người dùng thấy gì?

```ts
try {
  await saveOrder(data)
} catch (e) {}
return Response.json({ ok: true })
```

- [ ] Trang báo lỗi 500 và log ghi lại nguyên nhân
- [ ] Trình duyệt tự gửi lại request cho tới khi lưu được
- [x] Giao diện báo thành công nhưng đơn không được lưu, log không có gì

**Giải thích:** Khối `catch` rỗng nuốt mất lỗi, sau đó code vẫn trả `ok: true`. Đây là kiểu lỗi khó tìm nhất vì không nơi nào báo. Trình duyệt không tự gửi lại request khi máy chủ đã trả lời thành công.

### Lỗi mất giỏ hàng chỉ thỉnh thoảng xảy ra và bạn chưa tái hiện được. Cách làm nào hợp lý nhất?

- [ ] Bảo AI viết lại toàn bộ phần giỏ hàng cho chắc
- [ ] Bảo AI thêm `try/catch` ở mọi nơi để lỗi không hiện ra nữa
- [ ] Đợi tới khi lỗi xảy ra thường xuyên hơn rồi xử lý
- [x] Ghi lại mỗi lần lỗi xảy ra (giờ, tài khoản, thao tác) và nhờ AI thêm log ở các trạm để tìm điều kiện chung

**Giải thích:** Lỗi thỉnh thoảng mới có nghĩa là còn một điều kiện bạn chưa biết. Việc cần làm là thu thêm dữ liệu để tìm điều kiện đó. Viết lại toàn bộ có thể xóa lỗi cũ một cách may rủi và sinh lỗi mới. Thêm `try/catch` khắp nơi chỉ che lỗi đi.

## Kiểm tra không dùng AI

### Tình huống: Học viên báo bấm nút "Đăng ký khóa học" trên điện thoại thì không có gì xảy ra. Trên máy tính của bạn nút vẫn chạy. AI đề xuất "viết lại form bằng một thư viện khác cho ổn định". Bạn làm gì trước khi trả lời AI, và vì sao?

#### Đáp án

1. **Chưa đồng ý viết lại.** Chưa ai biết nguyên nhân, nên viết lại là sửa mò ở quy mô lớn. Lỗi có thể vẫn còn, kèm thêm lỗi mới.
2. **Tái hiện đúng điều kiện.** Mở trang bằng điện thoại, hoặc bật chế độ giả lập thiết bị di động trong DevTools, đăng nhập bằng một tài khoản học viên thử và bấm nút.
3. **Thu bằng chứng.** Xem Network khi bấm. Không có request nào: lỗi ở giao diện, ví dụ nút bị một lớp khác che trên màn hình hẹp, hoặc Console có dòng đỏ. Có request với mã lỗi: xem Response và log máy chủ.
4. **Gửi bản ghi lỗi cho AI.** Nêu bước tái hiện, kỳ vọng, thực tế, bằng chứng, và yêu cầu AI giải thích nguyên nhân trước khi sửa. Lý do: phạm vi sửa sẽ thu về một hai file, và bạn có sẵn bài kiểm tra để xác nhận sau khi sửa.

## Lỗi suy luận hay gặp

### "AI đọc được toàn bộ code nên nó tự tìm ra lỗi"

- **Vì sao sai:** AI không nhìn thấy màn hình của khách, dữ liệu thật trong database hay log trên Vercel. Nhiều lỗi không nằm trong code mà nằm ở dữ liệu hoặc cấu hình. Thiếu bằng chứng, AI chỉ đưa ra phỏng đoán nghe trôi chảy.
- **Cách sửa:** Bạn là người thu bằng chứng. Luôn gửi kèm bước tái hiện, dòng lỗi nguyên văn và request lỗi.

### "Hết dòng đỏ là hết lỗi"

- **Vì sao sai:** Cách nhanh nhất để dòng đỏ biến mất là bọc code trong `try/catch` rồi bỏ qua lỗi. Thông báo mất, sự cố vẫn còn, và giờ còn khó thấy hơn.
- **Cách sửa:** Kiểm tra bằng kết quả kỳ vọng chứ không bằng việc hết thông báo. Đơn có thật sự nằm trong database không? Email có thật sự tới không?

### "Sửa nhiều chỗ một lượt cho nhanh"

- **Vì sao sai:** Khi lỗi hết, bạn không biết thay đổi nào có tác dụng, thay đổi nào thừa. Khi lỗi còn, bạn không biết thay đổi nào vừa làm hỏng thêm.
- **Cách sửa:** Commit trước khi sửa. Mỗi lần chỉ thử một giả thuyết, kiểm tra lại bằng các bước tái hiện, rồi mới đi tiếp.

## Bài tập thực hành

Mục tiêu: viết một bản ghi lỗi hoàn chỉnh cho một lỗi thật trong app của bạn mà chưa sửa dòng code nào.

### Việc cần làm

1. Chọn một lỗi đang có. Nếu chưa có, chọn một thao tác dễ sai như gửi form khi để trống một ô bắt buộc.
2. Chạy app ở máy mình hoặc mở bản preview, dùng tài khoản thử, không thao tác trên dữ liệu khách thật.
3. Viết các bước tái hiện và làm lại ba lần để chắc lỗi lặp lại.
4. Chép nguyên văn dòng lỗi ở Console, request lỗi ở Network và dòng tương ứng trong log máy chủ. Che đi mọi khóa bí mật nếu có.
5. Viết một câu khoanh vùng: lỗi nằm ở trạm nào, dựa vào bằng chứng nào.

### Kết quả đúng

Bạn đưa bản ghi cho một người khác, hoặc tự đọc lại vào hôm sau, và làm theo là thấy đúng lỗi đó. Bản ghi có đủ năm phần: bước tái hiện, kỳ vọng, thực tế, bằng chứng, trạm nghi ngờ. `git status` cho thấy bạn chưa sửa file nào.

### Nhờ AI rà lại

```text
Đây là bản ghi lỗi của tôi: [dán bản ghi].
Hãy đọc code liên quan và chỉ báo cáo, không sửa file nào:
1. Nguyên nhân có khả năng nhất và bằng chứng nào ủng hộ nó.
2. Bản ghi của tôi còn thiếu thông tin gì để kết luận chắc hơn.
3. Nếu sửa thì sẽ đụng tới những file nào.
```
