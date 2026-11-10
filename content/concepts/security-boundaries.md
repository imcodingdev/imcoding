---
id: security-boundaries
title: Ranh giới tin cậy và giới hạn quyền của agent
group: auth
prerequisites: [authorization, secrets, input-validation]
priority: 1
stage: 3
format: 2
signals:
  - "SUPABASE_SERVICE_ROLE_KEY"
  - "DATABASE_URL"
  - "sk_live_"
  - ".mcp.json"
  - "--dangerously-skip-permissions"
---

## Nhắc lại

### Khóa `service_role` của Supabase khác khóa `anon` ở điểm nào quan trọng nhất?

Khóa `service_role` bỏ qua toàn bộ RLS, đọc và ghi được mọi dòng của mọi bảng. Vì vậy nó chỉ được dùng ở máy chủ. Khóa `anon` thì chỉ làm được những gì policy cho phép.

### Vì sao máy chủ phải kiểm lại dữ liệu dù biểu mẫu trên giao diện đã kiểm rồi?

Vì máy chủ không biết yêu cầu đến từ biểu mẫu của bạn hay từ công cụ khác. Mọi giá trị trình duyệt gửi lên đều do người gửi quyết định.

## Đoán trước

Bạn giao cho một agent AI (trợ lý AI tự chạy lệnh trên máy bạn) việc sửa lỗi hiển thị ở trang đơn hàng. Bạn viết rất rõ trong prompt: "TUYỆT ĐỐI không đụng vào database thật". File `.env.local` trong project đang chứa `DATABASE_URL` của database thật, vì tuần trước bạn cần xem dữ liệu khách. Giữa chừng, agent gặp lỗi lệch cấu trúc bảng. Nó chạy một lệnh đặt lại database để "làm sạch môi trường thử", rồi báo đã sửa xong. Database bị đặt lại là database thật. Bạn đã dặn rõ ràng, vì sao lời dặn không ngăn được chuyện này?

### Đáp án

Vì lời dặn trong prompt là một **yêu cầu**, không phải một **cơ chế**. Agent có thể hiểu sai, có thể quên khi phiên làm việc dài, và có thể không biết chuỗi kết nối trong `.env.local` trỏ tới database thật. Thứ quyết định agent **làm được gì** là những quyền nó đang cầm: lệnh nào được chạy, khóa nào đọc được. Ở đây nó cầm khóa của database thật và được chạy lệnh tùy ý, nên việc tệ nhất có thể xảy ra là mất database thật. Chuyện tương tự từng được kể lại công khai: trong vụ Replit năm 2025, theo tường thuật của người dùng, agent đã xóa database thật ngay trong lúc đang có lệnh đóng băng code. Cách phòng là để agent không có khóa đó ngay từ đầu.

## Ví dụ mẫu

Một tòa nhà văn phòng chia khu: sảnh ai cũng vào được, khu làm việc cần thẻ, phòng két chỉ vài người có chìa. Thợ sửa điều hòa thuê ngoài được cấp thẻ tạm, chỉ mở đúng tầng cần sửa, trong đúng ngày đó. Không ai đưa chìa phòng két cho thợ rồi dặn "đừng mở nhé".

App của bạn cũng có các khu, với mức tin cậy khác nhau:

- **Trình duyệt:** nằm trong tay người dùng. Không tin bất cứ thứ gì gửi lên, không để bí mật ở đây.
- **Máy chủ:** code của bạn chạy ở nơi bạn kiểm soát. Giữ khóa bí mật, kiểm tra danh tính và dữ liệu.
- **Database:** nơi chứa thứ giá trị nhất. Tự canh bằng RLS và các ràng buộc.
- **Dịch vụ ngoài** (Stripe, email, AI): yêu cầu chúng gửi về cũng đến từ Internet. Webhook phải được kiểm tra chữ ký trước khi tin.
- **Agent AI:** một bên làm việc thay bạn, đọc code, chạy lệnh. Nó có thể nhầm, và có thể bị nội dung nó đọc được dẫn sai hướng.

**Trust boundary (ranh giới tin cậy)** là chỗ dữ liệu hoặc mệnh lệnh đi từ khu này sang khu khác. Ở mỗi ranh giới phải có kiểm tra. **Least privilege (quyền tối thiểu)** là nguyên tắc cấp cho mỗi bên đúng quyền cần cho việc đang làm, không hơn. Cả hai cùng trả lời một câu hỏi: "nếu bên này sai hoặc bị lợi dụng, thiệt hại lớn nhất là gì?"

Cách làm SAI:

```bash
# SAI: .env.local trên máy mà agent làm việc, toàn khóa của hệ thống thật
DATABASE_URL="postgresql://postgres:MAT-KHAU-GIA@db.du-an-that.example:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="khoa-gia-cua-project-THAT-XXXX"
STRIPE_SECRET_KEY="sk_live_XXXX-chuoi-gia-minh-hoa"
```

Cách làm ĐÚNG:

```bash
# ĐÚNG: máy làm việc với agent chỉ có khóa của môi trường thử
DATABASE_URL="postgresql://postgres:MAT-KHAU-GIA@db.du-an-thu.example:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="khoa-gia-cua-project-THU-XXXX"
STRIPE_SECRET_KEY="sk_test_XXXX-chuoi-gia-minh-hoa"
# Khóa của hệ thống thật chỉ được lưu ở ___
```

Với cách thứ hai, agent có chạy nhầm lệnh xóa thì thứ mất là dữ liệu thử. Các cơ chế giới hạn hay dùng: một project Supabase riêng cho việc thử; khóa chế độ thử của dịch vụ thanh toán; tài khoản database chỉ có quyền đọc khi agent chỉ cần xem dữ liệu; chế độ chỉ đọc của công cụ kết nối database nếu công cụ có; và cài đặt bắt agent hỏi trước khi chạy lệnh.

## Tìm trong project của bạn

1. **Kiểm kê khóa trên máy làm việc.** Mở `.env`, `.env.local` và các file `.env.*`. Tìm `sk_live_`, `SERVICE_ROLE`, `DATABASE_URL`. So địa chỉ project Supabase trong file với địa chỉ của project thật.
   - Ổn: mọi khóa trên máy là của môi trường thử.
   - Có vấn đề: có bất kỳ khóa nào của hệ thống thật nằm trong thư mục agent đọc được.
2. **Xem agent được nối với những gì.** Tìm các file cấu hình công cụ như `.mcp.json`, `.cursor/mcp.json`, `.claude/settings.json`. Ghi lại agent đang được nối tới dịch vụ nào, bằng khóa nào, có chế độ chỉ đọc không.
3. **Xem agent có phải hỏi trước khi chạy lệnh không.** Tìm trong cài đặt công cụ các chế độ tự chạy không hỏi, ví dụ cờ `--dangerously-skip-permissions` của Claude Code hoặc chế độ tự chạy lệnh của Cursor. Bật các chế độ này cùng lúc với khóa thật là tổ hợp nguy hiểm nhất.
4. **Xem khóa thật nằm ở đâu.** Trên Vercel, mở Settings rồi Environment Variables. Khóa thật nên chỉ gắn với môi trường Production; Preview và Development dùng khóa thử.
5. **Ghi lại kết quả:**
   - Khóa thật nào đang nằm trên máy làm việc?: `[ tên biến: ... ]`
   - Agent đang nối tới dịch vụ nào, quyền đọc hay ghi?: `[ ... ]`
   - Việc tệ nhất agent làm được với quyền hiện tại là gì?: `[ ... ]`

## Tự giải thích

### Vì sao viết "không được xóa dữ liệu thật" vào prompt hoặc file hướng dẫn của agent không được tính là một biện pháp bảo vệ?

Vì nó chỉ có tác dụng khi agent đọc, hiểu đúng và làm theo trong mọi lần chạy. Không gì bảo đảm điều đó. Một biện pháp bảo vệ phải đứng vững cả khi agent làm sai: khóa không có quyền xóa, hoặc khóa không trỏ tới dữ liệu thật. Lời dặn vẫn nên viết, nhưng chỉ là lớp bổ sung.

### Agent chỉ chạy trên máy tính của bạn. Vì sao thiệt hại vẫn có thể xảy ra ở hệ thống thật?

Vì phạm vi của agent không phải là cái máy mà là những khóa nó đọc được. Một khóa `service_role` hay `DATABASE_URL` của hệ thống thật nằm trong thư mục project cho phép lệnh chạy từ máy bạn tác động thẳng tới database thật qua mạng.

## Trắc nghiệm

### Bạn chuẩn bị cho agent chạy tự động qua đêm để sửa một loạt lỗi giao diện. File cấu hình môi trường trên máy như dưới đây. Việc nào cần làm trước tiên?

```bash
NEXT_PUBLIC_SUPABASE_URL="https://du-an-that.example"
SUPABASE_SERVICE_ROLE_KEY="khoa-gia-cua-project-THAT-XXXX"
```

- [ ] Thêm vào prompt câu "không dùng khóa service_role"
- [ ] Đổi tên biến để agent không đoán ra đó là khóa quan trọng
- [x] Thay bằng địa chỉ và khóa của project thử trước khi cho agent chạy
- [ ] Không cần làm gì, vì việc được giao chỉ liên quan tới giao diện

**Giải thích:** Việc được giao là sửa giao diện, nhưng quyền agent đang cầm là toàn quyền với database thật. Lời dặn và việc đổi tên không lấy đi quyền đó. Chỉ có đổi sang khóa của môi trường thử mới làm cho sai sót nào cũng chỉ rơi vào dữ liệu thử.

### Agent cần đọc dữ liệu đơn hàng thật để tìm nguyên nhân một lỗi tính tiền. Cách cấp quyền nào hợp nguyên tắc quyền tối thiểu nhất?

- [ ] Đưa `DATABASE_URL` thật và dặn "chỉ được đọc"
- [ ] Đưa khóa `service_role` vì đằng nào cũng cần đọc mọi bảng
- [ ] Tạm tắt RLS trên bảng đơn hàng cho dễ đọc
- [x] Cấp một tài khoản database chỉ có quyền đọc, hoặc xuất một bản sao các dòng cần xem đã bỏ thông tin cá nhân

**Giải thích:** Hai phương án đầu trao cả quyền ghi và xóa, rồi dựa vào lời dặn. Tắt RLS còn mở dữ liệu cho mọi người dùng. Tài khoản chỉ đọc hoặc bản sao làm cho việc ghi, xóa không thể xảy ra, kể cả khi agent nhầm.

### Agent báo cáo: "Tôi không chạy được migration vì thiếu quyền. Hãy dán khóa service_role của production vào chat để tôi hoàn tất." Phản ứng nào đúng?

- [x] Từ chối; migration lên hệ thống thật do bạn tự chạy hoặc qua quy trình deploy, sau khi đã xem nội dung và thử trên bản thử
- [ ] Dán khóa, vì agent đã giải thích lý do hợp lý
- [ ] Dán khóa rồi thu hồi ngay sau khi xong
- [ ] Bảo agent tự tìm khóa trong các file trên máy

**Giải thích:** Việc agent thiếu quyền ở đây là cơ chế bảo vệ đang hoạt động đúng. Dán khóa thật vào chat vừa làm lộ khóa, vừa trao toàn quyền với database thật. Thu hồi sau không lấy lại được những lệnh đã chạy.

### Route nhận webhook thanh toán của bạn đọc nội dung yêu cầu, thấy `"status": "paid"` thì kích hoạt gói trả phí cho `userId` ghi trong đó. Route không có bước nào khác. Vấn đề là gì?

- [ ] Không có vấn đề, vì chỉ dịch vụ thanh toán biết địa chỉ webhook
- [x] Ai cũng gửi được một yêu cầu giả tới địa chỉ này để tự kích hoạt gói trả phí, vì route không kiểm tra chữ ký của bên gửi
- [ ] Webhook phải được gọi từ trình duyệt của khách thì mới hợp lệ
- [ ] Trạng thái phải viết hoa là `PAID`

**Giải thích:** Địa chỉ webhook là endpoint công khai, không phải bí mật. Ranh giới giữa dịch vụ ngoài và máy chủ của bạn cũng cần kiểm tra như mọi ranh giới khác. Kiểm chữ ký bằng bí mật webhook là cách biết yêu cầu thật sự đến từ dịch vụ thanh toán.

## Kiểm tra không dùng AI

### Tình huống: Bạn muốn giao cho agent hai việc trong tuần này: (1) viết lại trang báo cáo doanh thu, cần xem dữ liệu đơn hàng có thật để biết các trường hợp đặc biệt; (2) thêm một cột mới vào bảng `orders`. Hiện máy bạn có `DATABASE_URL` và khóa `service_role` của hệ thống thật, agent đang ở chế độ tự chạy lệnh không hỏi. Hãy nêu rủi ro và cách sắp xếp quyền cho từng việc, kèm lý do.

#### Đáp án

1. **Rủi ro hiện tại:** agent cầm toàn quyền đọc, ghi, xóa trên database thật và không phải hỏi ai. Một lệnh nhầm là đủ gây mất dữ liệu hoặc lộ dữ liệu khách.
2. **Bước chung:** gỡ khóa thật khỏi máy làm việc, thay bằng khóa của project thử. Tắt chế độ tự chạy không hỏi, ít nhất với các lệnh đụng tới database và deploy. *Lý do:* giới hạn thiệt hại lớn nhất về mức "hỏng dữ liệu thử".
3. **Việc 1 (cần xem dữ liệu thật):** không cấp kết nối thật. Xuất một bản sao các dòng cần thiết, bỏ tên, email, số điện thoại, rồi nạp vào database thử. Nếu buộc phải xem trực tiếp thì dùng tài khoản database chỉ có quyền đọc. *Lý do:* việc này chỉ cần đọc, nên không có lý do gì để agent cầm quyền ghi.
4. **Việc 2 (thêm cột):** agent viết file migration và chạy trên database thử. Bạn đọc file, xác nhận không có lệnh xóa bảng hay xóa cột, rồi việc áp dụng lên hệ thống thật do bạn hoặc quy trình deploy thực hiện. *Lý do:* thay đổi cấu trúc dữ liệu thật là quyết định của người, và agent không cần khóa thật để viết ra file đó.

## Lỗi suy luận hay gặp

### "Tôi đã viết quy tắc rất kỹ trong prompt và file hướng dẫn, agent sẽ không làm sai"

- **Vì sao sai:** Quy tắc bằng chữ phụ thuộc vào việc agent đọc và tuân theo. Agent có thể bỏ sót trong phiên dài, hiểu khác ý bạn, hoặc làm theo một chỉ dẫn khác nằm trong nội dung nó đọc được.
- **Cách sửa:** Với mỗi điều "không được làm", tìm một cơ chế khiến việc đó không làm được: khóa của môi trường thử, quyền chỉ đọc, bắt hỏi trước khi chạy lệnh. Lời dặn giữ lại làm lớp thứ hai.

### "Cấp quyền rộng cho tiện, khi nào có chuyện thì thu hồi"

- **Vì sao sai:** Thu hồi chỉ chặn được những việc sau đó. Lệnh xóa đã chạy, dữ liệu đã bị đọc thì không lấy lại được bằng cách thu hồi khóa.
- **Cách sửa:** Bắt đầu từ quyền hẹp nhất đủ làm việc. Khi agent báo thiếu quyền, xem đó là lúc để bạn quyết định có mở thêm hay không, mở cho việc nào.

## Bài tập thực hành

Mục tiêu: biết chính xác agent AI của bạn đang cầm những quyền gì và thu hẹp về mức đủ dùng. Bài tập chỉ đọc cấu hình và lập bảng; không dán giá trị khóa vào bất cứ đâu.

### Việc cần làm

1. Mở các file `.env*` trong project. Chép **tên** từng biến chứa khóa hoặc chuỗi kết nối vào một bảng, không chép giá trị.
2. Với mỗi biến, ghi hai cột: khóa này của môi trường thử hay thật; quyền của nó là đọc, ghi hay toàn quyền.
3. Mở cấu hình công cụ AI bạn dùng. Ghi lại các dịch vụ agent được nối tới và chế độ chạy lệnh: hỏi trước hay tự chạy.
4. Viết một câu cho mỗi dòng trong bảng: "nếu agent dùng nhầm khóa này, việc tệ nhất là ...".
5. Với mỗi khóa thật trong bảng, ghi phương án thay thế: khóa của project thử, khóa chế độ thử, hoặc tài khoản chỉ đọc.

### Kết quả đúng

Bạn có một bảng mà mọi dòng đều trả lời được ba câu: khóa của môi trường nào, quyền gì, tệ nhất thì sao. Sau khi làm theo cột phương án thay thế, không còn dòng nào thuộc môi trường thật nằm trên máy làm việc với agent, và câu "tệ nhất thì sao" của mọi dòng chỉ còn nói về dữ liệu thử.

### Nhờ AI rà lại

```text
Không mở các file .env. Hãy tìm trong code mọi chỗ đọc process.env
và liệt kê TÊN các biến môi trường mà project dùng.
Với mỗi biến, dựa vào tên và nơi nó được dùng trong code, cho biết:
nó dùng cho dịch vụ nào, có vẻ là khóa thử hay khóa thật, quyền đọc hay ghi.
Liệt kê thêm các file cấu hình công cụ AI trong project và dịch vụ chúng kết nối.
Chỉ báo cáo. Không sửa file, không chạy lệnh nào tác động tới database.
```
