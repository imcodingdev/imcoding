---
id: concurrent-writes
title: "Hai người cùng giành một chỗ: chống đặt trùng và bán quá số lượng"
group: database
prerequisites: [database-table, data-crud, business-rules]
priority: 1
stage: 3
format: 2
signals: ["transaction", "UNIQUE", "CHECK", "ON CONFLICT", "FOR UPDATE"]
sources:
  - title: PostgreSQL — Transactions
    url: https://www.postgresql.org/docs/current/tutorial-transactions.html
  - title: PostgreSQL — Constraints
    url: https://www.postgresql.org/docs/current/ddl-constraints.html
  - title: PostgreSQL — INSERT
    url: https://www.postgresql.org/docs/current/sql-insert.html
  - title: PostgreSQL — Explicit Locking
    url: https://www.postgresql.org/docs/current/explicit-locking.html
  - title: PostgreSQL — Transaction Isolation
    url: https://www.postgresql.org/docs/current/transaction-iso.html
---

## Nhắc lại

### Đọc dữ liệu rồi thêm một dòng có phải cùng một hành động không?

Không nhất thiết. Đọc và ghi có thể là các yêu cầu riêng, giữa chúng còn có yêu cầu của người khác. Kết quả đọc phản ánh thời điểm đọc, không giữ chỗ giúp bạn.

### “Không bán quá số lượng” cần được giữ ở đâu?

Ở máy chủ và database, không chỉ bằng nút bị khóa trên giao diện. Quy tắc phải còn đúng khi có nhiều đường gửi yêu cầu tới cùng dữ liệu.

## Đoán trước

App thử còn một chỗ học. Bạn mở hai tab, mỗi tab là một học viên giả. Cả hai cùng thấy “còn chỗ”, bấm đăng ký gần nhau và đều nhận xác nhận. Agent nói đã kiểm số chỗ tại máy chủ trước khi ghi. Vì sao vẫn có hai người được nhận?

### Đáp án

Cả hai yêu cầu có thể đọc cùng giá trị còn một chỗ trước khi yêu cầu nào ghi xong. Kiểm tại máy chủ là cần, nhưng tách bước đọc và ghi không tự ngăn chúng chen nhau. Database cần cơ chế giữ quy tắc trong lúc ghi đồng thời.

## Ví dụ mẫu

Hãy hình dung hai nhân viên cùng nhìn tờ giấy “còn một vé”. Mỗi người bán cho một khách rồi mới sửa giấy. Không ai cố ý làm sai; thông tin đúng lúc nhìn đã không còn đủ để quyết định lúc bán. **Ghi đồng thời** là nhiều yêu cầu cùng tác động dữ liệu trong những khoảng thời gian chồng lên nhau. Lỗi do thứ tự chen nhau thường gọi là race condition.

Đây là diễn tiến sai trên dữ liệu giả, không phải lệnh cần chạy:

```text
SAI: coupon thử còn 1 lượt
A đọc: còn 1; B đọc: còn 1.
A tạo lượt dùng; B cũng tạo lượt dùng.
A ghi số còn lại = 0; B cũng ghi số còn lại = 0.
Kết quả: số dư không âm nhưng đã cấp 2 lượt.
# Chỉ kiểm số dư cuối >= 0 không phát hiện đủ lỗi này.
```

**Transaction**, giao dịch database, gom nhiều bước thành “tất cả hoặc không”. Ví dụ trừ lượt còn lại và tạo bản ghi sử dụng phải cùng thành công; nếu một bước lỗi thì hủy cả phần thay đổi trong giao dịch. Trong SQL thường thấy `BEGIN`, `COMMIT`, `ROLLBACK`: bắt đầu, xác nhận, hủy giao dịch. Bạn không cần thuộc cú pháp, cần biết các bước nào phải đi cùng nhau.

Tính “tất cả hoặc không” chưa có nghĩa mọi cách đọc rồi ghi trong transaction đều chống được hai yêu cầu chen nhau. Còn phải xem ràng buộc, cách cập nhật và mức cô lập. Hai lần gọi database riêng từ máy chủ cũng không tự trở thành một transaction chỉ vì đứng cạnh nhau trong file.

**Ràng buộc** là luật database tự kiểm khi lưu dữ liệu. `UNIQUE` chặn giá trị hoặc tổ hợp giá trị trùng nhau. Với lịch chia thành các khung cố định, mỗi nhân viên chỉ có một lượt đặt cho một khung, có thể cần `UNIQUE (staff_id, slot_start)`. Phải xác định đúng các cột và xử lý giá trị trống; thông thường các cột nhận diện này cũng cần `NOT NULL`.

Ràng buộc trên chỉ phù hợp khi các khung đã được chuẩn hóa và bảng biểu diễn những lượt chiếm chỗ theo đúng luật. Hai cuộc hẹn bắt đầu khác giờ nhưng thời lượng chồng nhau không bị chặn chỉ bằng cặp đó. Nếu có hủy lịch, cần nói rõ cách giải phóng chỗ. Đừng nhận một từ UNIQUE làm bằng chứng cho mọi kiểu lịch.

`CHECK` kiểm điều kiện trên dữ liệu của dòng, chẳng hạn số lượng còn lại không âm. Nó không tự đếm tổng số dòng đặt chỗ khác. Giá trị null có thể làm điều kiện CHECK được chấp nhận, nên dữ liệu bắt buộc cần cả quy tắc không rỗng. Ví dụ hai nhân viên đều ghi số dư bằng không ở trên cho thấy ngay cả CHECK đúng cũng chưa đủ chống cấp dư.

`INSERT ... ON CONFLICT` cho phép chọn cách xử lý khi thêm dòng gặp xung đột ràng buộc thích hợp. `DO NOTHING` có thể bỏ qua lần thêm bị trùng; app vẫn phải nhận ra không có dòng mới và báo hết chỗ. `DO UPDATE` cập nhật dòng xung đột, không có nghĩa tự biết phải giữ chủ đặt cũ. Không để agent dùng nó để ghi đè người đã đặt trước.

Với coupon có số lượt còn lại ở một dòng, một cách xử lý là khóa dòng trước khi quyết định. `SELECT ... FOR UPDATE` khóa những dòng được chọn để các giao dịch muốn cập nhật hoặc khóa xung đột phải chờ. Nó không chặn mọi thao tác đọc thông thường. Khóa thường được giữ tới cuối transaction; khóa xong rồi kết thúc giao dịch trước khi ghi thì không còn bảo vệ chuỗi bước sau.

```sql
-- Minh họa để nhận diện, không chạy trên database thật.
BEGIN;
SELECT remaining FROM demo_coupons WHERE id = 1 FOR UPDATE;
-- Trong cùng giao dịch: kiểm remaining còn đủ.
-- Nếu đủ: trừ lượt và tạo bản ghi sử dụng; lỗi thì ROLLBACK.
-- Nếu hết: không tạo lượt dùng, trả kết quả hết lượt.
COMMIT;
```

Đây là phác thảo, chưa có phần kiểm và cập nhật nên không phải bản sửa hoàn chỉnh. Yêu cầu agent chỉ ra mã thực hiện các bước còn thiếu. Khi A giữ khóa, B chờ; sau khi được xử lý tiếp, B phải quyết định theo dữ liệu hợp lệ lúc đó. Không dùng kết quả đọc cũ trước khi khóa.

Khóa dòng chỉ khóa dòng tìm thấy. Nếu đang kiểm “chưa có lượt đặt nào”, câu truy vấn không tìm thấy dòng không tự khóa một chỗ tưởng tượng. Trường hợp tạo lượt đặt mới thường cần ràng buộc duy nhất hoặc thiết kế khóa trên một dòng tài nguyên đã có. Agent phải giải thích chọn cơ chế nào cho đúng quy tắc.

**Mức cô lập** quy định một giao dịch nhìn thấy và tương tác với thay đổi của giao dịch khác thế nào. Mức Serializable nhằm cho kết quả như các giao dịch chạy lần lượt, nhưng database có thể từ chối một giao dịch bằng lỗi serialization khi không thể giữ bảo đảm đó. App phải hủy và thử lại toàn bộ transaction từ đầu, đọc lại dữ liệu, không chỉ gửi lại câu ghi cuối. Cần giới hạn thử lại và báo lỗi phù hợp nếu vẫn không thành công.

## Tìm trong project của bạn

Chỉ đọc code và định nghĩa bảng được phép. Không chạy SQL, thay ràng buộc hoặc thử tranh chỗ trên database thật.

1. Viết luật cụ thể: `[tài nguyên / số chỗ / điều kiện chiếm và nhả chỗ]`. “Không trùng” mà chưa biết trùng theo cột nào là chưa đủ.
2. Tìm `stock`, `remaining`, `booking` trong phần máy chủ. Đánh dấu nơi đọc và nơi ghi. Có vấn đề: đọc còn chỗ, chờ một đoạn rồi thêm mà không có cơ chế bảo vệ.
3. Tìm `UNIQUE`, `CHECK`, `ON CONFLICT` trong file mô tả schema hoặc migration. Ghi `[luật / cột / cách xử lý khi bị từ chối]`. Không tự chạy file tìm được.
4. Tìm `transaction`, `FOR UPDATE`, `BEGIN` hoặc nhờ agent chỉ giao dịch do thư viện quản lý. Ổn: đọc để quyết định và ghi nằm trong cơ chế đã giải thích; có vấn đề: khóa ở một kết nối, ghi ở giao dịch khác.
5. Hỏi “Hai người bấm cùng lúc thì sao? Nếu bị lỗi serialization thì thử lại phần nào?”. Ghi `[bằng chứng dữ liệu cuối / ca chưa thử]`, không chỉ chép lời bảo đảm của agent.

## Tự giải thích

### Vì sao transaction và UNIQUE không thay thế nhau?

Transaction giữ nhóm thay đổi cùng thành công hoặc cùng hủy. UNIQUE giữ luật không trùng trên các giá trị đã chọn. Một nhóm thay đổi có thể được lưu nguyên vẹn mà vẫn tạo lịch trùng nếu thiếu cơ chế giữ luật đó.

### Vì sao cần kiểm cả số lượt sử dụng lẫn số dư?

Hai yêu cầu có thể cùng ghi một số dư cũ đã trừ, làm số dư không âm dù cấp quá nhiều lượt. Đếm tác động nghiệp vụ mới cho biết có bán dư không. Nhìn một cột cuối dễ bỏ sót lỗi.

## Trắc nghiệm

### Cursor báo đã thêm CHECK số dư không âm. Hai yêu cầu đều đọc 1 rồi ghi 0. Bạn kết luận gì?

- [x] Vẫn có thể cấp hai lượt; cần cơ chế điều phối quyết định và ghi
- [ ] CHECK bảo đảm chỉ một người nhận lượt
- [ ] Không âm nghĩa là mọi quy tắc đã đúng
- [ ] Chỉ cần đổi số dư sang kiểu chuỗi

**Giải thích:** Hai lần ghi 0 đều qua CHECK. Luật số dư không âm chưa chứng minh số lượt đã cấp khớp với tồn ban đầu.

### Agent dùng ON CONFLICT DO NOTHING rồi luôn trả “đặt thành công”. Cần sửa cách đánh giá nào?

- [ ] Cứ không có lỗi SQL thì chắc đã có chỗ
- [x] Kiểm có dòng mới thực sự được thêm và báo đúng khi xung đột
- [ ] Đổi sang ghi đè người đặt trước cho đơn giản
- [ ] Chỉ ẩn nút ở tab thua

**Giải thích:** Bỏ qua lần thêm trùng giữ dữ liệu nhưng chưa làm thông báo đúng. Người không giành được chỗ không được nhận xác nhận thành công.

### SELECT FOR UPDATE không tìm thấy dòng đặt chỗ nào. Nó có tự giữ mọi chỗ chưa tồn tại không?

- [ ] Có, vì đã có chữ khóa
- [ ] Có, nếu truy vấn chạy từ máy chủ
- [x] Không; cần cơ chế phù hợp như UNIQUE hoặc khóa dòng tài nguyên đã có
- [ ] Có, nếu tab còn mở

**Giải thích:** Khóa dòng tác động lên dòng được chọn. Không tìm thấy dòng không tự tạo một khóa cho mọi lần thêm tương lai.

### Database báo lỗi serialization. Cách xử lý đúng về nguyên tắc là gì?

- [ ] Bỏ lỗi và báo thành công
- [ ] Chỉ gửi lại lệnh ghi cuối với số liệu cũ
- [ ] Tắt mọi ràng buộc để khỏi xung đột
- [x] Hủy giao dịch lỗi, thử lại cả giao dịch từ đầu với giới hạn phù hợp

**Giải thích:** Quyết định trước có thể dựa trên dữ liệu không còn phù hợp. Đọc lại và quyết định lại là phần thiết yếu của lần thử mới.

## Kiểm tra không dùng AI

### Hai tài khoản giả cùng nhận chiếc xe thuê cuối. Bảng xe ghi “đã thuê” nhưng có hai hợp đồng đang hiệu lực. Agent chỉ đưa ảnh bảng xe để chứng minh không còn xe trống. Bạn cần kiểm gì?

#### Đáp án

Đếm hợp đồng hiệu lực gắn với xe, kiểm cơ chế giữ luật một xe chỉ thuộc một hợp đồng tại thời điểm đó. Một trạng thái “đã thuê” không cho biết đã cấp cho bao nhiêu người. Cần ca hai yêu cầu tranh cùng xe, một thành công và một bị từ chối rõ ràng, cùng bằng chứng dữ liệu thử không có hợp đồng dư.

## Lỗi suy luận hay gặp

### “Đã chuyển kiểm tra lên máy chủ là hết race condition”

Máy chủ vẫn xử lý nhiều yêu cầu chồng nhau. Giữ kiểm tra đầu vào, đồng thời hỏi cơ chế bảo vệ đoạn quyết định và ghi tại database.

### “Có transaction thì không cần nghĩ về xung đột”

Transaction không tự chọn luật nghiệp vụ hoặc mức cô lập phù hợp. Kiểm ràng buộc, phạm vi khóa và đường xử lý khi giao dịch bị từ chối.

### “Thử hai tab không lỗi chứng minh mọi lúc đều đúng”

Hai lần bấm tay có thể chưa chen vào đúng thời điểm gây lỗi. Đây là phép thử dễ quan sát, cần bổ sung kiểm thử đồng thời có kiểm soát và rà cơ chế giữ luật.

## Bài tập thực hành

Mục tiêu: quan sát hai người tranh một tài nguyên. Chỉ dùng project và bảng thử riêng, tài khoản cùng dữ liệu giả; không chạy SQL trên database thật, không đặt lịch hoặc dùng coupon thật.

### Việc cần làm

1. Chuẩn bị một tài nguyên giả còn một chỗ trong môi trường thử đã tách biệt. Ghi số lượt và bản ghi ban đầu.
2. Mở hai tab bằng hai tài khoản thử, cùng chọn tài nguyên đó trước khi gửi. Không dùng tài khoản khách thật.
3. Gửi gần nhau, ghi thông báo của từng tab và đếm bản ghi cuối. Dùng tài nguyên giả mới cho mỗi lần thử.
4. Nhờ agent bổ sung ca kiểm thử cục bộ điều khiển hai yêu cầu cùng đọc trước khi ghi, rồi đối chiếu với cơ chế bảo vệ đã chọn.
5. Ghi một trường hợp thắng, một trường hợp bị từ chối và cách app xử lý lỗi. Nếu chưa tạo được tình huống chen nhau, ghi chưa kiểm đủ thay vì kết luận an toàn.

### Kết quả đúng

Chỉ một người có chỗ, người còn lại nhận thông báo đúng. Số bản ghi và số lượt còn lại khớp nhau, không có thay đổi dở dang. Báo cáo nêu cả giới hạn của thử tay và cơ chế database giữ quy tắc.
