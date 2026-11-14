---
id: acceptance-criteria
title: Tiêu chí nghiệm thu
group: systems
prerequisites: [business-rules, data-flow]
priority: 1
stage: 2
format: 2
signals:
  - "Tiêu chí nghiệm thu"
  - "Acceptance criteria"
  - "Kết quả mong đợi"
  - "TODO"
  - "expect("
---

## Nhắc lại

### Quy tắc nghiệp vụ (business rule) là gì? Nêu một ví dụ trong app bán hàng.

Là luật do việc kinh doanh của bạn đặt ra, không phải do kỹ thuật. Ví dụ: "mỗi khách chỉ dùng một mã giảm giá một lần", "đơn đã giao thì không được hủy". Code phải làm theo các luật này, và chỉ bạn mới biết chúng.

### Theo bài Dòng chảy dữ liệu, sau khi máy chủ ghi xong vào database thì trạm cuối cùng phải làm gì?

Giao diện phải cập nhật lại màn hình để người dùng thấy dữ liệu mới, ví dụ gọi `router.refresh()`. Thiếu trạm này thì dữ liệu đã lưu nhưng người dùng tưởng là chưa.

## Đoán trước

Bạn viết cho Lovable: "Thêm tính năng mã giảm giá vào trang thanh toán". Mười phút sau AI báo đã hoàn thành. Bạn nhập thử mã `GIAM10`, tổng tiền giảm 10%, trông rất ổn nên bạn cho chạy thật. Một tuần sau bạn phát hiện một khách đã dùng cùng một mã cho 7 đơn, một mã hết hạn từ tháng trước vẫn được chấp nhận, và có đơn 80.000đ áp mã giảm 100.000đ nên tổng tiền thành số âm. Bạn mở lại đoạn chat, định trách AI làm ẩu. AI có làm sai yêu cầu của bạn không?

### Đáp án

Không. Yêu cầu chỉ có một câu, và AI đã làm đúng câu đó: có ô nhập mã, nhập mã đúng thì giảm tiền. Mọi thứ còn lại bạn không nói: mã dùng được mấy lần, hết hạn thì sao, tổng tiền thấp nhất là bao nhiêu. Gặp chỗ trống, AI tự lấp bằng phương án đơn giản nhất và không báo cho bạn. Khảo sát Stack Overflow 2025 cho thấy 66% lập trình viên khó chịu vì kết quả AI "gần đúng nhưng chưa đúng". Phần "chưa đúng" đó thường nằm ở chính những điều người giao việc chưa viết ra. Thứ còn thiếu ở đây là tiêu chí nghiệm thu, viết trước khi giao việc.

## Ví dụ mẫu

Khi đặt thợ đóng tủ, bạn không nói "đóng cho tôi cái tủ đẹp". Bạn ghi: cao 2 mét, ba cánh, có ngăn khóa, cửa đóng không kêu. Ngày nhận tủ, bạn cầm tờ giấy đó đi kiểm từng dòng. **Tiêu chí nghiệm thu** (acceptance criteria) là tờ giấy ấy cho một tính năng: danh sách những câu mà ai cũng kiểm tra được và trả lời được "đạt" hay "chưa đạt".

Một tiêu chí tốt có ba phần: điều kiện ban đầu, thao tác, và kết quả nhìn thấy được. Một bộ tiêu chí tốt có đủ bốn loại: trường hợp bình thường, trường hợp sai hoặc ở biên, quy tắc nghiệp vụ, và những thứ không được thay đổi.

Cách giao việc SAI:

```text
Thêm tính năng mã giảm giá vào trang thanh toán.
Làm cho chuẩn, an toàn và dễ dùng nhé.
```

Cách giao việc ĐÚNG, kèm tiêu chí:

```markdown
Tính năng: mã giảm giá ở trang /thanh-toan
1. Nhập mã GIAM10 còn hạn, bấm "Áp dụng": tổng tiền giảm 10%,
   hiện dòng "Đã áp dụng mã GIAM10".
2. Nhập mã không tồn tại: hiện "Mã không hợp lệ", tổng tiền giữ nguyên.
3. Mã đã quá ngày hết hạn: hiện "Mã đã hết hạn".
4. Mỗi tài khoản dùng mỗi mã một lần. Lần hai hiện "Bạn đã dùng mã này".
5. Tổng tiền sau giảm không bao giờ nhỏ hơn 0đ.
6. Số tiền giảm được tính lại ở máy chủ, không tin số từ trình duyệt.
7. Không thay đổi: bước chọn địa chỉ và cách tính phí ship.
   Nêu rõ dòng này vì ___
```

Hai chữ "chuẩn" và "an toàn" ở bản SAI không kiểm tra được. Bảy dòng ở bản ĐÚNG thì kiểm tra được, và bạn làm việc đó trong năm phút mà không cần đọc code.

## Tìm trong project của bạn

Khi đã có tiêu chí, dùng [cách giao một việc một lúc cho agent](/concepts/agent-scope) để theo dõi việc nào đang làm và việc nào đã qua kiểm.

1. **Mở lại yêu cầu gần nhất bạn giao cho AI.** Tìm trong lịch sử chat của Cursor, Claude Code hoặc Lovable. Đếm xem có bao nhiêu câu trả lời được "đạt / chưa đạt". Yêu cầu chỉ có động từ ("thêm", "làm", "sửa") mà không có câu nào tả kết quả là có vấn đề.
2. **Tìm nơi lưu yêu cầu.** Xem trong `README.md`, thư mục `docs/`, các file như `PLAN.md`, `TODO.md`, `AGENTS.md`. Tìm toàn dự án các từ `tiêu chí`, `acceptance`, `TODO`. Có một nơi cố định lưu tiêu chí là ổn. Tiêu chí chỉ nằm trong đầu bạn hoặc trôi trong chat là có vấn đề, vì tuần sau cả bạn lẫn AI đều không còn nhớ.
3. **Soát một tính năng liên quan đến tiền hoặc dữ liệu khách.** Tự hỏi: đã có câu nào tả trường hợp nhập sai chưa? Trường hợp bấm hai lần? Trường hợp người chưa đăng nhập? Chỉ có trường hợp bình thường là có vấn đề.
4. **Soát phần "không thay đổi".** Yêu cầu có nói rõ những trang hoặc tính năng nào phải giữ nguyên không? Không có thì AI được tự do sửa lan sang chỗ khác.
5. **Ghi lại:**
   - Yêu cầu gần nhất có mấy câu kiểm tra được: `[số]`
   - Tiêu chí đang được lưu ở đâu: `[file / chỉ trong chat / chưa có]`
   - Tính năng quan trọng nhất còn thiếu loại tiêu chí nào: `[sai và biên / nghiệp vụ / không thay đổi]`

## Tự giải thích

### Vì sao tiêu chí phải viết trước khi giao việc, chứ không phải sau khi AI làm xong?

Viết sau thì bạn nhìn sản phẩm AI đã làm rồi tả lại nó. Lúc đó cái gì chạy được cũng thành "đúng ý". Viết trước buộc bạn nghĩ về các trường hợp khó khi chưa bị kết quả dẫn dắt, và AI có đích rõ ràng ngay từ đầu.

### Vì sao "giao diện thân thiện, chạy mượt" không phải là tiêu chí nghiệm thu?

Vì hai người kiểm tra có thể trả lời khác nhau, và AI luôn tự trả lời là "đạt". Muốn dùng được, phải đổi thành thứ quan sát được: "trên màn hình rộng 375px không có thanh cuộn ngang", "bấm Lưu thì nút bị khóa cho tới khi có kết quả".

### Nếu bỏ hết các tiêu chí về trường hợp sai và trường hợp biên thì chuyện gì xảy ra?

AI sẽ làm cho trường hợp bình thường chạy đẹp, vì đó là thứ duy nhất được yêu cầu. Bạn thử bằng dữ liệu bình thường nên cũng thấy đẹp. Các trường hợp sai chỉ lộ ra khi khách thật gặp phải, lúc đó đã có tiền hoặc dữ liệu thật bị ảnh hưởng.

## Trắc nghiệm

### Câu nào dưới đây dùng được làm tiêu chí nghiệm thu cho tính năng đặt lại mật khẩu?

- [ ] Quy trình đặt lại mật khẩu phải an toàn và đúng chuẩn
- [ ] Code phần đặt lại mật khẩu phải sạch, dễ bảo trì
- [x] Đường link đặt lại mật khẩu dùng được một lần; bấm lần hai hiện "Link đã hết hiệu lực"
- [ ] Người dùng cảm thấy yên tâm khi đặt lại mật khẩu

**Giải thích:** Chỉ câu thứ ba có thao tác cụ thể và kết quả nhìn thấy được, ai kiểm cũng ra cùng một đáp án. "An toàn", "sạch", "yên tâm" là mong muốn đúng nhưng không kiểm tra được, nên AI nào cũng tự nhận là đã đạt.

### Bạn giao việc kèm 6 tiêu chí. Claude Code trả lời như sau. Bạn làm gì?

```text
Đã hoàn thành tính năng xuất hóa đơn.
Tôi đã kiểm tra kỹ, mọi thứ hoạt động đúng như yêu cầu.
```

- [x] Tự mở app, đi qua từng tiêu chí trong 6 tiêu chí và đánh dấu đạt hay chưa đạt
- [ ] Commit, vì AI đã xác nhận kiểm tra kỹ
- [ ] Hỏi lại "bạn chắc chưa?" và commit nếu AI trả lời chắc

**Giải thích:** Câu "đã kiểm tra kỹ" không cho biết đã kiểm tra tiêu chí nào, bằng cách nào. Tiêu chí viết ra là để bạn tự kiểm. Hỏi lại AI chỉ nhận thêm một lời khẳng định, không phải bằng chứng.

### Đang làm dở, AI đề xuất như sau. Phản ứng nào đúng?

```text
Tiêu chí 4 (mỗi tài khoản dùng mỗi mã một lần) khá phức tạp.
Tôi đề xuất bỏ tiêu chí này để hoàn thành nhanh hơn.
```

- [ ] Đồng ý, vì AI hiểu kỹ thuật hơn nên biết cái gì nên làm
- [x] Giữ tiêu chí, vì đây là quy tắc nghiệp vụ do bạn quyết định; có thể hỏi AI cách làm đơn giản hơn mà vẫn đạt
- [ ] Để AI tự quyết, miễn là các tiêu chí còn lại đều đạt

**Giải thích:** Mức độ khó khi viết code không phải lý do để đổi luật kinh doanh. AI được đề xuất cách làm, còn bỏ hay giữ một quy tắc nghiệp vụ là quyết định của bạn. Nếu đồng ý dễ dàng, bạn sẽ nhận lại đúng sự cố một mã dùng 7 lần.

### Bộ tiêu chí sau cho tính năng "khách tự đổi giờ hẹn" đang thiếu loại nào rõ nhất?

```markdown
1. Khách bấm "Đổi giờ", chọn giờ mới, bấm "Lưu": lịch hiện giờ mới.
2. Sau khi lưu, khách nhận email xác nhận giờ mới.
3. Trang danh sách lịch hẹn hiển thị đẹp trên điện thoại.
```

- [ ] Thiếu mô tả màu sắc và phông chữ của nút "Đổi giờ"
- [ ] Thiếu tên thư viện và tên bảng database cần dùng
- [ ] Không thiếu gì, vì đã tả đủ luồng chính
- [x] Thiếu các trường hợp sai: chọn giờ đã có người đặt, đổi lịch của người khác, đổi khi còn 30 phút nữa là tới hẹn

**Giải thích:** Cả ba dòng đều là trường hợp suôn sẻ. Không dòng nào nói điều gì phải bị từ chối. Tên thư viện hay màu nút là chi tiết cách làm, không quyết định tính năng đúng hay sai về nghiệp vụ.

## Kiểm tra không dùng AI

### Tình huống: Bạn sắp nhờ AI làm tính năng "khách tự hủy đơn hàng" cho tiệm bánh online. Quy định của tiệm: chỉ hủy được khi đơn chưa chuyển sang trạng thái "Đang làm", và tiền đã trả được hoàn về ví trong app. Hãy viết ít nhất 5 tiêu chí nghiệm thu, có đủ trường hợp bình thường, trường hợp sai và phần không được thay đổi.

#### Đáp án

Một bộ tiêu chí đạt yêu cầu có thể như sau:

1. Đơn ở trạng thái "Chờ xác nhận": khách bấm "Hủy đơn" rồi xác nhận, đơn chuyển sang "Đã hủy" và hiện trong danh sách đơn với nhãn đó.
2. Đơn đã ở trạng thái "Đang làm" trở đi: không có nút "Hủy đơn". Nếu vẫn gửi request hủy thì máy chủ từ chối và trạng thái đơn giữ nguyên.
3. Đơn đã trả tiền khi hủy: số dư ví tăng đúng bằng số tiền đã trả, chỉ một lần dù khách bấm hủy hai lần liên tiếp.
4. Khách A không hủy được đơn của khách B, kể cả khi biết mã đơn.
5. Người chưa đăng nhập gọi tới chức năng hủy thì bị từ chối.
6. Không thay đổi: cách tạo đơn mới và trang quản lý đơn của chủ tiệm.

Lý do cần đủ các loại: dòng 1 là luồng chính. Dòng 2 là quy tắc nghiệp vụ và phải được chặn ở máy chủ, vì ẩn nút trên giao diện là chưa đủ. Dòng 3 liên quan tới tiền nên phải nói rõ trường hợp bấm hai lần. Dòng 4 và 5 là quyền truy cập. Dòng 6 giữ cho AI không sửa lan.

## Lỗi suy luận hay gặp

### "AI đủ thông minh để tự hiểu ý tôi"

- **Vì sao sai:** AI không biết quy định của tiệm bạn, khách của bạn, hay lần sự cố năm ngoái. Gặp chỗ không rõ, nó chọn phương án phổ biến nhất và thường không hỏi lại.
- **Cách sửa:** Điều gì bạn sẽ bực nếu AI làm khác đi thì viết điều đó thành một dòng tiêu chí.

### "Tiêu chí nghiệm thu là tài liệu kỹ thuật, tôi không biết code nên không viết được"

- **Vì sao sai:** Tiêu chí tả điều người dùng làm và điều họ thấy. Đó là kiến thức về việc kinh doanh, thứ bạn nắm rõ hơn bất kỳ AI nào. Không cần một từ kỹ thuật nào.
- **Cách sửa:** Viết bằng lời thường theo khuôn: "Khi [tình huống], tôi [thao tác], thì thấy [kết quả]".

### "AI báo đạt hết các tiêu chí nghĩa là đã đạt"

- **Vì sao sai:** Người làm bài tự chấm bài của mình thì gần như luôn cho điểm cao. AI có thể chưa hề chạy thử, hoặc chỉ thử trường hợp bình thường.
- **Cách sửa:** Bạn tự đi qua từng dòng trên app. Với mỗi dòng, hoặc bạn tận mắt thấy kết quả, hoặc dòng đó chưa đạt.

## Bài tập thực hành

Mục tiêu: viết bộ tiêu chí nghiệm thu cho tính năng tiếp theo bạn định giao cho AI, trước khi gõ yêu cầu.

### Việc cần làm

1. Chọn một tính năng nhỏ bạn sắp làm. Tạo file `docs/tieu-chi-<ten-tinh-nang>.md` trong project.
2. Viết 2 tiêu chí cho trường hợp bình thường theo khuôn "Khi..., tôi..., thì thấy...".
3. Viết ít nhất 3 tiêu chí cho trường hợp sai hoặc ở biên: để trống, nhập sai, bấm hai lần, chưa đăng nhập, dữ liệu của người khác.
4. Viết 1 dòng "Không thay đổi" liệt kê các trang hoặc tính năng phải giữ nguyên.
5. Đọc lại từng dòng và tự hỏi: hai người khác nhau kiểm tra có ra cùng một kết quả không? Dòng nào không thì viết lại.

### Kết quả đúng

File có ít nhất 6 dòng. Không dòng nào chứa các từ không đo được như "đẹp", "mượt", "an toàn", "chuẩn" mà thiếu mô tả cụ thể. Một người chưa biết gì về tính năng đọc xong có thể mở app và tự kiểm tra từng dòng.

### Nhờ AI rà lại

```text
Đây là tiêu chí nghiệm thu cho tính năng tôi sắp giao: [dán nội dung].
Chưa viết code. Chỉ báo cáo:
1. Dòng nào còn mơ hồ, hai người kiểm tra có thể ra kết quả khác nhau.
2. Trường hợp sai hoặc trường hợp biên nào tôi chưa nghĩ tới.
3. Chỗ nào bạn sẽ phải tự đoán nếu làm theo đúng các dòng này.
```
