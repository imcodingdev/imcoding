---
id: non-functional-requirements
title: "Yêu cầu phi chức năng: nhanh, ổn định, an toàn đến mức nào"
group: systems
prerequisites: [acceptance-criteria, ai-task-context]
priority: 2
stage: 2
format: 2
signals: ["SLI", "SLO", "LCP", "INP", "CLS"]
sources:
  - title: Google SRE — Service Level Objectives
    url: https://sre.google/sre-book/service-level-objectives/
  - title: web.dev — Web Vitals
    url: https://web.dev/articles/vitals
---

## Nhắc lại

### Vì sao “chạy mượt” chưa phải tiêu chí nghiệm thu?

Vì hai người có thể đánh giá khác nhau. Tiêu chí cần có điều kiện thử, thao tác và kết quả quan sát được, để bạn kiểm lời agent báo.

### Giao việc cho AI cần nêu gì ngoài tính năng?

Cần ngữ cảnh, phạm vi được sửa, điều phải giữ nguyên và cách kiểm. Những điều chưa biết phải được ghi rõ thay vì để agent tự đoán.

## Đoán trước

Bạn nhờ AI làm danh sách đơn. Agent báo có tìm kiếm, lọc và phân trang. Trên máy bạn trang mở nhanh; nhân viên dùng điện thoại lại đợi lâu, bấm nút không thấy phản hồi. Tính năng đều có, vậy yêu cầu nào còn thiếu?

### Đáp án

Thiếu yêu cầu về chất lượng khi sử dụng: nhanh tới mức nào, trên thiết bị và dữ liệu nào, khi mạng lỗi thì xử lý ra sao. Kiểm đủ nút chưa chứng minh app dùng tốt trong điều kiện của khách.

## Ví dụ mẫu

**Yêu cầu chức năng** nói app làm gì, như lọc đơn theo ngày. **Yêu cầu phi chức năng** nói chất lượng hoặc giới hạn khi app làm việc đó: tốc độ, độ ổn định, an toàn, khả năng chịu tải. Hai loại bổ sung cho nhau. Một màn hình đúng tính năng vẫn có thể quá chậm để nhân viên dùng trong giờ đông khách.

Đừng bắt đầu bằng “hãy dùng kiến trúc lớn”. Bắt đầu bằng việc người dùng cần hoàn thành và hậu quả khi việc đó bị gián đoạn. Trang giới thiệu chậm khác với đơn hàng đã báo lưu nhưng biến mất. Founder quyết định điều gì quan trọng; agent giải thích cách đo và đánh đổi để đáp ứng.

**SLI**, chỉ số mức dịch vụ, là đại lượng được định nghĩa rõ để đo dịch vụ đang hoạt động thế nào. Ví dụ: tỷ lệ yêu cầu lưu đơn hợp lệ thành công, đo tại máy chủ trong một khoảng thời gian. **SLO**, mục tiêu mức dịch vụ, là giá trị hoặc khoảng giá trị mong muốn của SLI. Chỉ số là thứ đo; mục tiêu là mức muốn đạt. Có tên chỉ số mà thiếu nơi đo, mẫu đo và khoảng thời gian vẫn chưa đủ.

Đây là ghi chú giả định cho app thử, không phải chuẩn áp dụng cho mọi sản phẩm:

```text
SAI: Làm danh sách đơn nhanh, ổn định và an toàn.
ĐÚNG: Trên điện thoại thử đã ghi cấu hình, với 100 đơn giả,
từ lúc mở trang tới khi danh sách dùng được phải dưới 3 giây.
Ghi điều kiện mạng và từng kết quả; đây là ca nghiệm thu cục bộ.
Khi mất mạng sau khi bấm Lưu, không báo thành công khi chưa xác nhận.
Khi nối lại, tra trạng thái đơn trước khi cho gửi lại.
```

Con số 3 giây và 100 đơn ở đây do nhóm giả định chọn để tập viết tiêu chí. Đó không phải ngưỡng Web Vitals hay cam kết cho mọi khách. Muốn thành mục tiêu vận hành, phải thống nhất cách tổng hợp các lần đo, thời gian theo dõi và đối tượng người dùng. Một lần chạy trên máy mạnh không đại diện cho trải nghiệm thực tế.

Google SRE khuyên không đặt mục tiêu mọi lúc đều đạt 100%. Mục tiêu tuyệt đối dễ khiến nhóm đầu tư quá mức, chậm thay đổi mà vẫn không loại bỏ được mọi sự cố. Chọn mức phù hợp với nhu cầu, theo dõi phần không đạt và điều chỉnh khi có bằng chứng. Điều này không cho phép coi mất đơn hoặc lộ dữ liệu là chuyện chấp nhận tùy ý. Quy tắc đúng dữ liệu và quyền truy cập vẫn phải nêu riêng, có kiểm thử riêng.

Với trang web, **Core Web Vitals** gồm ba chỉ số trải nghiệm. **LCP** (Largest Contentful Paint) phản ánh tốc độ tải nội dung lớn nhất trong vùng nhìn thấy; ngưỡng tốt là không quá 2,5 giây. **INP** (Interaction to Next Paint) phản ánh khả năng phản hồi tương tác; ngưỡng tốt là không quá 200 mili giây. **CLS** (Cumulative Layout Shift) phản ánh độ ổn định bố cục; ngưỡng tốt là không quá 0,1. CLS không có đơn vị giây.

Theo web.dev, đánh giá các ngưỡng này tại phân vị 75, tách thiết bị di động và máy tính. Hiểu đơn giản: xét mức mà khoảng ba phần tư số lần đo không vượt quá, thay vì chỉ lấy lần nhanh nhất. Muốn đạt Core Web Vitals phải đạt cả ba chỉ số ở mức đánh giá đó. Đừng nhầm thời gian API trả lời với LCP, hay coi LCP tốt là đủ chứng minh nút bấm phản hồi tốt.

Đo trong môi trường thử giúp tìm lỗi trước khi đưa ra dùng. Đo từ người dùng thực phản ánh thiết bị, mạng và cách tương tác đa dạng hơn. Kết quả thử cục bộ chưa thay thế dữ liệu thực địa. Trong bài tập này chỉ đo bản thử; không cần cài công cụ theo dõi lên app thật để hoàn thành bài.

Câu “mất kết nối thì không mất đơn” cũng cần làm rõ. Nếu máy chủ đã lưu mà phản hồi bị mất, app phải tra lại kết quả. Nếu chưa gửi được, app cần giữ bản nháp theo thiết kế đã duyệt hoặc báo chưa lưu để người dùng biết. Không thể hứa đơn đã nằm trên máy chủ khi yêu cầu chưa tới. Hãy yêu cầu agent mô tả từng trạng thái và bằng chứng lưu thành công.

## Khi nào chưa cần

Chọn mức chất lượng theo nhu cầu và bằng chứng, không theo số lượng công cụ.

- **Theo dõi mọi chỉ số** — chưa cần khi vài chỉ số đã trả lời được câu hỏi về luồng quan trọng; cần khi có câu hỏi thực tế chưa được đo.
- **Đổi kiến trúc để chịu tải lớn** — chưa cần khi chưa đo được giới hạn; cần khi thử bằng dữ liệu giả cho thấy chỗ nghẽn và thay đổi nhỏ hơn chưa đáp ứng mục tiêu.

## Tìm trong project của bạn

Chỉ đọc tài liệu và code được phép xem; chưa thay cấu hình hay thử gây lỗi trên app thật.

1. Tìm `acceptance`, `SLO`, `SLI` trong `docs/`, README hoặc ghi chú giao việc. Ghi `[luồng quan trọng / điều kiện đo / mức mong muốn]`. Chỉ có “nhanh, bảo mật” là còn mơ hồ.
2. Tìm `LCP`, `INP`, `CLS` trong báo cáo hiệu năng nếu có. Ghi `[nguồn đo / thiết bị / thời gian]`. Không có báo cáo thì ghi chưa đo, không tự kết luận tốt.
3. Tìm nơi lưu đơn ở `app/api/` hoặc file máy chủ. Nhờ agent chỉ cách xử lý mất phản hồi. Ổn: phân biệt chưa xác nhận với thành công; có vấn đề: cứ hết chờ là báo đã lưu.
4. Ghi câu hỏi tăng tải: “Khi nhiều người dùng hơn, bước nào chậm trước, đo bằng gì, thay đổi nào cần làm và cái gì CHƯA cần?”. Yêu cầu lý do gắn với luồng của bạn, không nhận danh sách công nghệ chung.
5. Chốt `[tiêu chí cần bổ sung / cách thử an toàn / bằng chứng cần nhận]`. Nếu chưa biết mức hợp lý, đo bản thử trước rồi đề xuất, không để agent tự công bố cam kết.

## Tự giải thích

### Vì sao có SLO vẫn cần tiêu chí nghiệm thu?

SLO theo dõi chất lượng qua một tập lần sử dụng trong thời gian xác định. Tiêu chí nghiệm thu giúp kiểm một thay đổi cụ thể trước khi nhận. Hai thứ liên quan nhưng một lần thử đạt chưa chứng minh mục tiêu vận hành đã đạt lâu dài.

### Vì sao không chọn mọi chỉ số đo được?

Bạn sẽ khó biết chỉ số nào cần hành động. Chọn vài chỉ số gắn với việc khách cần làm, giải thích khi không đạt thì ai xử lý. Thêm chỉ số khi có câu hỏi thực tế cần trả lời.

## Trắc nghiệm

### Cursor báo “API nhanh nên điện thoại chắc chắn mượt”. Bạn yêu cầu gì?

- [x] Đo trải nghiệm trình duyệt trên điều kiện thiết bị đã thống nhất
- [ ] Chấp nhận vì API quyết định toàn bộ tốc độ trang
- [ ] Chỉ đo lại API trên máy mạnh hơn
- [ ] Bỏ kiểm giao diện nếu máy chủ không báo lỗi

**Giải thích:** Trình duyệt còn tải và xử lý nội dung. API nhanh không chứng minh trang hiện nhanh hay phản hồi tương tác tốt.

### Agent gửi báo cáo “LCP tốt trong một lần chạy thử”. Kết luận nào hợp lý?

- [ ] Mọi người dùng đều đạt cả ba Core Web Vitals
- [x] Đây là bằng chứng thử hẹp; còn cần INP, CLS và dữ liệu đúng phạm vi đánh giá
- [ ] Có thể bỏ điều kiện mạng khỏi tiêu chí
- [ ] SLO vận hành đã được chứng minh mãi mãi

**Giải thích:** Một lần đo một chỉ số chưa đại diện cho cả tập trải nghiệm. Web.dev xét ba chỉ số tại phân vị 75, tách di động và máy tính.

### “Tỷ lệ yêu cầu hợp lệ lưu thành công trong tháng” là gì khi chưa đặt mức mong muốn?

- [ ] Một cam kết chắc chắn không có lỗi
- [ ] Một yêu cầu thêm nút mới
- [x] Một SLI cần định nghĩa rõ cách thu thập, chưa phải SLO đầy đủ
- [ ] Bằng chứng mọi đơn đều đúng

**Giải thích:** Chỉ số mô tả thứ đo. SLO cần thêm mục tiêu; gọi tên tỷ lệ chưa bảo đảm kết quả.

### Nhóm định ghi “100% luôn nhanh” để agent làm kỹ. Nên sửa thế nào?

- [ ] Giữ nguyên vì mục tiêu càng tuyệt đối càng tốt
- [ ] Bỏ mọi mục tiêu chất lượng
- [ ] Chỉ yêu cầu thêm máy chủ
- [x] Chọn mục tiêu có điều kiện đo, nhu cầu rõ và cách xử lý khi không đạt

**Giải thích:** Mục tiêu tuyệt đối không hướng dẫn đánh đổi. Thêm hạ tầng khi chưa biết chỗ chậm cũng chưa giải quyết đúng vấn đề.

## Kiểm tra không dùng AI

### App điểm danh lớp học hiện “Đã lưu” ngay khi bấm, kể cả lúc mất mạng. Hãy viết tiêu chí chất lượng và cách kiểm an toàn, khác với chỉ yêu cầu có nút điểm danh.

#### Đáp án

Trên project thử với danh sách học viên giả, ngắt mạng rồi bấm: giao diện phải báo chưa xác nhận, không báo đã lưu. Nối lại thì kiểm trạng thái trước khi gửi tiếp; kết quả cuối đúng một lần điểm danh. Ghi bằng chứng ở giao diện và dữ liệu thử. Tiêu chí này kiểm độ tin cậy của kết quả, còn “có nút điểm danh” chỉ kiểm tính năng tồn tại.

## Lỗi suy luận hay gặp

### “Phi chức năng là phần làm đẹp sau cùng”

Độ tin cậy và quyền truy cập có thể quyết định app có dùng được hay không. Nêu chúng ngay khi giao việc, ưu tiên theo hậu quả thay vì đợi khách gặp lỗi.

### “Muốn tăng người dùng phải đổi kiến trúc ngay”

Chưa đo thì chưa biết giới hạn nằm ở đâu. Hỏi agent bằng chứng, cách đo tải bằng dữ liệu giả và thay đổi nhỏ nhất cần thiết trước khi nhận một thiết kế phức tạp.

### “Đạt tốc độ nghĩa là an toàn”

Chỉ số tốc độ không đo quyền xem dữ liệu. Với app thử, thêm ca tài khoản A không đọc được đơn của B, kể cả gửi yêu cầu trực tiếp; không lấy điểm hiệu năng thay kiểm quyền.

## Bài tập thực hành

Mục tiêu: biến một yêu cầu mơ hồ thành bộ tiêu chí kiểm được. Chỉ dùng project thử, tài khoản và dữ liệu giả, không gây lỗi hoặc thay cấu hình trên hệ thống thật.

### Việc cần làm

1. Chọn luồng danh sách và lưu đơn trên project thử; ghi thiết bị, điều kiện mạng, lượng dữ liệu giả.
2. Viết một tiêu chí tốc độ với mốc bắt đầu, kết thúc và mức giả định do bạn chọn; ghi rõ đây là mục tiêu thử.
3. Viết ca mất kết nối, phân biệt chưa gửi được với đã lưu nhưng mất phản hồi; chỉ thử trên môi trường đã tách khỏi dữ liệu thật.
4. Viết ca tài khoản thử không xem được dữ liệu giả của nhau, nêu kết quả máy chủ cần trả thay vì chỉ ẩn nút.
5. Chạy từng ca đã có cách thử an toàn, ghi kết quả; ca chưa thử ghi chưa thử. Thêm câu hỏi điều gì đổi khi tải tăng và điều gì chưa cần làm.

### Kết quả đúng

Mỗi tiêu chí có điều kiện, thao tác và kết quả quan sát được. Bạn phân biệt được mục tiêu thử với SLO vận hành, chỉ số với mục tiêu, và không dùng lời agent tự nhận làm bằng chứng.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy lệnh ghi/xóa/push, không đọc hay in khóa bí mật. Không mở .env* hoặc gọi dịch vụ.
Chỉ rà tiêu chí và bản ghi thử đã che tôi cung cấp.
1. Tốc độ: cách kiểm: chỉ thiết bị, mạng, dữ liệu giả, mốc đo và ngưỡng; phân biệt mục tiêu thử với SLO vận hành.
2. Mất kết nối: cách kiểm: đối chiếu hai ca chưa gửi và đã lưu mất phản hồi với trạng thái cùng dữ liệu cuối.
3. Quyền truy cập: cách kiểm: đối chiếu ca hai tài khoản giả với phản hồi máy chủ, không chỉ nút bị ẩn.
4. Tải tăng: cách kiểm: chỉ câu hỏi, bằng chứng chỗ nghẽn và điều chưa cần làm; đánh dấu ca chưa thử.
Báo cáo từng điểm: đạt / chưa đạt / chưa xác minh, kèm bằng chứng và phần còn thiếu.
```
