---
id: backup-restore
title: Sao lưu và diễn tập khôi phục dữ liệu
group: deploy
prerequisites: [database-table, schema-migrations, deployment-environments]
priority: 1
stage: 3
format: 2
signals:
  - "pg_dump"
  - "supabase db dump"
  - "DELETE FROM"
  - "TRUNCATE"
  - "DROP TABLE"
  - "backup"
---

## Nhắc lại

### Một migration có lệnh `DROP COLUMN` đã chạy trên database. Bạn `git revert` commit chứa file đó. Cột và dữ liệu trong cột có trở lại không?

Không. Revert chỉ gỡ file khỏi thư mục dự án. Database đã thực hiện lệnh và không theo dõi Git. Dữ liệu trong cột đã xóa chỉ lấy lại được từ bản sao lưu.

### Vì sao máy làm việc và công cụ AI chỉ nên cầm khóa của project thử?

Vì agent đọc được `.env.local` và chạy được lệnh. Cầm khóa của project nào thì mọi lỗi rơi vào dữ liệu của project đó. Chỉ có khóa thử thì lỗi nặng nhất cũng chỉ hỏng dữ liệu thử.

## Đoán trước

Bạn nhờ agent "dọn các đơn hàng test trong database". Agent chạy một lệnh xóa với điều kiện quá rộng, mất luôn 3.000 đơn hàng thật của hai tháng gần nhất. Bạn bình tĩnh vì nhớ rằng mình commit đều đặn. Bạn hoàn tác code về hôm qua, deploy lại, rồi mở trang đơn hàng: vẫn trống. Bạn vào trang quản trị Supabase tìm mục Backups và thấy gói đang dùng không có bản sao lưu nào để chọn. Vì sao việc commit đều đặn không giúp gì ở đây, và lẽ ra bạn phải biết điều gì từ trước?

### Đáp án

Git lưu các phiên bản của file code. Đơn hàng không phải file trong dự án, chúng là các dòng nằm trong database trên máy chủ của Supabase. Hoàn tác code đưa giao diện và logic về hôm qua, còn database vẫn ở trạng thái sau lệnh xóa. Thứ duy nhất đưa dữ liệu về được là **backup (bản sao lưu)** của chính database, được tạo trước lúc xảy ra sự cố. Lẽ ra bạn phải trả lời được ba câu từ khi có khách đầu tiên: bản sao lưu nằm ở đâu, bản gần nhất tạo lúc nào, và đã có ai thử khôi phục từ nó chưa. Vụ Replit năm 2025, nơi agent xóa database thật theo tường thuật của người dùng, cho thấy đây không phải tình huống tưởng tượng.

## Ví dụ mẫu

Bạn có bản photo sổ đỏ cất ở nhà bố mẹ. Nó chỉ có giá trị nếu bạn biết chắc nó còn ở đó, còn đọc được, và là bản mới nhất. Một bản photo chưa ai mở ra xem bao giờ thì mới chỉ là hy vọng.

Dữ liệu của app nằm ở ba nơi, mỗi nơi có cách lấy lại khác nhau:

- **Code:** nằm trong Git. Lấy lại bằng hoàn tác commit.
- **Dữ liệu trong database:** lấy lại bằng bản sao lưu database. Supabase có sao lưu tự động theo ngày ở các gói trả phí, và có tùy chọn khôi phục về một thời điểm bất kỳ (point-in-time recovery) nếu bật thêm. Mục để xem là Database → Backups. Gói miễn phí có thể không có bản nào, bạn phải tự xuất.
- **File người dùng tải lên** (ảnh, tài liệu trong Storage): bản sao lưu database thường không chứa nội dung file. Cần hỏi riêng: nếu mất thì lấy lại ở đâu?

Hai con số cần biết, nói bằng lời thường: **mất tối đa bao nhiêu dữ liệu** (sao lưu mỗi ngày một lần thì có thể mất gần trọn một ngày) và **mất bao lâu để chạy lại** (chỉ biết được khi đã thử).

Tự xuất một bản sao lưu và nạp thử, chỉ làm với project thử:

```bash
# Cả hai chuỗi kết nối đều là của project THỬ
pg_dump "$DEV_DATABASE_URL" --schema=public > backup-dev.sql  # chép bảng và dữ liệu của app ra file

# Nạp vào một database TRỐNG khác để xem file có dùng được không
psql "$DRILL_DATABASE_URL" -f backup-dev.sql
```

Sau đó ghi lại kết quả. Một bản ghi diễn tập trông như sau:

```text
Ngày diễn tập:        2026-11-10
Nguồn:                project thử myapp-dev, file backup-dev.sql
Nạp vào:              project trống myapp-drill
Số dòng customers:    nguồn 48, sau khi nạp 48
Số dòng orders:       nguồn 131, sau khi nạp 131
Thời gian từ đầu tới lúc đếm xong: 25 phút
Kết luận: bản sao lưu này ___
```

File `backup-dev.sql` chứa dữ liệu, kể cả khi chỉ là dữ liệu thử. Không commit nó lên Git, và coi file sao lưu của project thật như một khóa bí mật.

## Tìm trong project của bạn

1. **Xem trang Backups:** Vào trang quản trị Supabase của project thật, mở Database → Backups. Có danh sách bản sao lưu kèm ngày giờ là ổn. Trang báo gói hiện tại không có sao lưu là có vấn đề, vì bạn đang không có đường lui nào.
2. **Tìm lệnh có thể xóa hàng loạt:** Tìm toàn dự án `DELETE FROM`, `TRUNCATE`, `DROP TABLE`, `.delete()`, `deleteMany`. Với mỗi kết quả, xem có điều kiện lọc không (`WHERE`, `.eq(...)`, `where: {...}`). Lệnh xóa không có điều kiện, nằm trong script chạy tay, là thứ cần đánh dấu.
3. **Tìm dấu vết sao lưu trong dự án:** Tìm `pg_dump`, `db dump`, `backup` trong `package.json`, thư mục `scripts/` và tài liệu. Không có gì nghĩa là chưa ai trong dự án từng xuất dữ liệu.
4. **Kiểm tra file sao lưu có lọt vào Git không:** Chạy `git ls-files "*.sql" "*.dump"` và xem có file nào là bản xuất dữ liệu thay vì file migration. Có file dữ liệu khách trong Git là có vấn đề.
5. **Hỏi về Storage:** Nếu app cho tải file lên, ghi lại file nằm ở bucket nào và bạn có bản sao nào khác không.
6. **Ghi lại kết quả:**
   - Bản sao lưu database gần nhất: `[ ngày giờ: ... / không có ]`
   - Sao lưu tạo bằng cách nào: `[ tự động của nhà cung cấp / tự xuất / không có ]`
   - Đã từng thử khôi phục: `[ Có, ngày ... / Chưa ]`
   - File người dùng tải lên có bản sao: `[ Có / Không / App không có file ]`

## Tự giải thích

### Vì sao một bản sao lưu chưa từng được thử khôi phục thì chưa thể tin?

Vì có nhiều cách để nó vô dụng mà bạn không biết: file xuất thiếu bảng, xuất bị ngắt giữa chừng, bản mới nhất đã cũ ba tháng, hoặc không ai biết các bước nạp lại. Những lỗi này chỉ lộ ra khi nạp thử. Phát hiện lúc diễn tập thì sửa được, phát hiện lúc sự cố thì đã muộn.

### Vì sao không diễn tập khôi phục ngay trên project thật cho sát thực tế?

Khôi phục thường là ghi đè trạng thái hiện tại bằng trạng thái cũ. Làm trên project thật nghĩa là mọi dữ liệu khách tạo ra sau bản sao lưu sẽ mất, và app có thể ngừng chạy trong lúc đó. Diễn tập nhằm kiểm tra bản sao lưu và quy trình, nên nạp vào một project trống là đủ và không ai bị ảnh hưởng.

### Nếu bản sao lưu nằm trong chính tài khoản và project đang chứa dữ liệu thật thì còn thiếu gì?

Thiếu một bản nằm ngoài tầm với của cùng một sự cố. Mất quyền vào tài khoản, project bị xóa nhầm, hay một khóa quản trị bị lộ đều có thể lấy đi cả dữ liệu lẫn bản sao lưu cùng lúc. Một bản xuất định kỳ cất ở nơi khác, có kiểm soát người xem, giảm rủi ro đó.

## Trắc nghiệm

### Agent báo như dưới đây sau khi chạy nhầm một lệnh xóa trên database thật. Nhận định nào đúng?

```text
Đã phát hiện xóa nhầm 3.000 dòng trong bảng orders.
Tôi đã chạy: git revert a1b2c3d
Mọi thứ đã được khôi phục về trạng thái trước đó.
```

- [ ] Đúng, vì revert đưa toàn bộ dự án về trước thời điểm xóa
- [ ] Đúng, nếu commit `a1b2c3d` là commit chứa script xóa
- [x] Sai, revert chỉ đưa file code về, 3.000 dòng trong database vẫn mất
- [ ] Sai, phải dùng `git reset --hard` thì dữ liệu mới trở lại

**Giải thích:** Database không nằm trong Git nên không lệnh Git nào trả lại dòng đã xóa, kể cả `reset --hard`. Câu "mọi thứ đã được khôi phục" của agent chỉ đúng với code. Việc cần làm là kiểm tra bản sao lưu database.

### Trang Backups của project thật cho thấy bản sao lưu tự động gần nhất tạo lúc 02:00 sáng nay. Sự cố xóa nhầm xảy ra lúc 16:00. Nếu khôi phục từ bản này, điều gì xảy ra với các đơn hàng khách đặt từ 02:00 đến 16:00?

- [x] Chúng không có trong bản sao lưu nên sẽ mất, trừ khi còn nguồn khác để nhập lại
- [ ] Chúng được giữ lại, vì khôi phục chỉ thêm lại những dòng đã bị xóa
- [ ] Chúng được Supabase tự ghép vào sau khi khôi phục xong
- [ ] Chúng nằm trong Git nên lấy lại được bằng commit gần nhất

**Giải thích:** Bản sao lưu là ảnh chụp database tại 02:00. Khôi phục đưa database về đúng thời điểm đó, mọi thay đổi sau đó không có trong ảnh. Đây là lý do cần biết trước khoảng cách giữa hai lần sao lưu, và vì sao nhiều app bật thêm khôi phục theo thời điểm.

### Bạn thấy trong `package.json` có script sau. Điều gì cần kiểm tra trước tiên?

```json
"scripts": {
  "backup": "pg_dump $DATABASE_URL > backups/latest.sql"
}
```

- [ ] Không cần kiểm tra gì, có script này nghĩa là dự án đã được sao lưu
- [ ] Đổi tên file thành `latest.json` để dễ đọc hơn
- [ ] Thêm tiền tố `NEXT_PUBLIC_` cho `DATABASE_URL` để script đọc được
- [x] Script có thật sự được chạy định kỳ không, thư mục `backups/` có bị commit lên Git không, và file đó đã từng được nạp thử chưa

**Giải thích:** Một dòng script chỉ là khả năng sao lưu. Nó không tự chạy, mỗi lần chạy lại ghi đè bản trước, và file kết quả chứa toàn bộ dữ liệu khách nên không được lên Git. Tiền tố `NEXT_PUBLIC_` sẽ làm lộ chuỗi kết nối database xuống trình duyệt.

### App của bạn lưu ảnh hồ sơ khách trong Supabase Storage. Bạn đã thử khôi phục database thành công trên project thử. Điều gì còn chưa chắc?

- [ ] Không còn gì, vì ảnh là một phần của database
- [x] Nội dung file ảnh, vì bản sao lưu database thường chỉ chứa thông tin về file chứ không chứa chính file
- [ ] Code giao diện hiển thị ảnh, vì nó cũng nằm trong database
- [ ] Mật khẩu người dùng, vì Supabase không bao giờ sao lưu bảng người dùng

**Giải thích:** Database lưu các dòng mô tả file, còn nội dung file nằm ở kho lưu trữ riêng. Khôi phục database xong có thể được danh sách ảnh mà không mở được ảnh nào. Code nằm trong Git. Cần kiểm tra riêng phần file với nhà cung cấp.

## Kiểm tra không dùng AI

### Tình huống: Ngày mai bạn sẽ cho AI chạy một migration lớn trên database thật, có đổi kiểu hai cột và gộp hai bảng. AI nói: "Yên tâm, Supabase có backup tự động." Hãy nêu những điều bạn phải tự xác nhận trước khi cho chạy, kèm lý do.

#### Đáp án

1. **Mở trang Backups và nhìn tận mắt bản gần nhất.** *Lý do:* câu "có backup tự động" phụ thuộc gói đang dùng. AI không nhìn thấy trang quản trị của bạn, nó chỉ nói điều thường đúng.
2. **Xem bản gần nhất tạo lúc nào.** Nếu đã cách nhiều giờ, tự xuất thêm một bản ngay trước khi chạy. *Lý do:* khoảng cách tới bản sao lưu chính là lượng dữ liệu có thể mất.
3. **Xác nhận đã từng nạp thử một bản sao lưu vào project trống** và biết mất bao lâu. *Lý do:* chưa thử thì chưa biết bản sao lưu dùng được.
4. **Chạy migration trên project thử trước,** đếm số dòng trước và sau.
5. **Chọn giờ vắng và quyết định trước điều kiện dừng:** thấy dấu hiệu nào thì ngừng và khôi phục. *Lý do:* lúc có sự cố không phải lúc bắt đầu nghĩ quy trình.

## Lỗi suy luận hay gặp

### "Dữ liệu nằm trên đám mây của nhà cung cấp lớn nên không thể mất"

- **Vì sao sai:** Nhà cung cấp bảo vệ bạn khỏi hỏng ổ cứng của họ. Họ không bảo vệ bạn khỏi lệnh xóa hợp lệ do chính app, script hoặc agent của bạn gửi tới. Với database, lệnh `DELETE` của bạn là yêu cầu đúng cần thực hiện.
- **Cách sửa:** Tách hai câu hỏi: hạ tầng có bền không, và tôi có quay lại được trạng thái trước sai lầm của chính mình không. Câu thứ hai cần bản sao lưu.

### "Tôi có bật sao lưu rồi, vậy là xong"

- **Vì sao sai:** Bật sao lưu mới là nửa đầu. Nửa sau là khôi phục, và đó mới là việc bạn thật sự cần khi có sự cố. Chưa thử thì không biết bản sao lưu có đủ bảng không, mất bao lâu, ai làm được.
- **Cách sửa:** Đặt lịch diễn tập khôi phục trên project thử, ghi lại ngày và kết quả. Lặp lại sau mỗi thay đổi lớn về cấu trúc.

### "Lỡ xóa nhầm thì nhờ AI viết lại dữ liệu từ log là được"

- **Vì sao sai:** Log thường chỉ ghi một phần sự kiện, không ghi đủ mọi cột của mọi dòng. Dữ liệu AI dựng lại từ mảnh vụn sẽ có chỗ đoán, và dữ liệu khách hàng đoán sai còn tệ hơn dữ liệu thiếu.
- **Cách sửa:** Coi bản sao lưu là nguồn khôi phục duy nhất đáng tin. Log chỉ để đối chiếu phần chênh lệch sau khi đã khôi phục.

## Bài tập thực hành

Mục tiêu: tự tay đi hết một vòng sao lưu rồi khôi phục để biết quy trình có chạy được không. Toàn bộ bài này chỉ làm trên project thử và một project trống mới tạo. Không dùng chuỗi kết nối của project thật ở bất kỳ bước nào.

### Việc cần làm

1. Mở `.env.local`, xác nhận mã project trong chuỗi kết nối là của project thử. Không chắc thì dừng lại.
2. Trong project thử, đếm số dòng của hai bảng quan trọng và ghi lại.
3. Xuất một bản sao lưu của project thử ra file, đặt ngoài thư mục dự án để không lỡ commit.
4. Tạo một project trống mới chỉ dùng cho diễn tập, rồi nạp file vừa xuất vào đó.
5. Đếm lại số dòng của hai bảng ở project diễn tập và so với số đã ghi.
6. Ghi bản ghi diễn tập: ngày, nguồn, nơi nạp, số dòng trước và sau, tổng thời gian, chỗ nào bị vướng.

### Kết quả đúng

Số dòng ở project diễn tập khớp với số đã ghi ở bước 2, và bạn có một bản ghi cho biết cả vòng mất bao nhiêu phút. Nếu số dòng lệch hoặc không nạp được, bài tập vẫn thành công: bạn vừa tìm ra lỗ hổng trong lúc chưa có sự cố. Ghi lại lỗi và xử lý trước khi tin vào bản sao lưu.

### Nhờ AI rà lại

```text
Hãy rà dự án này và CHỈ BÁO CÁO, không sửa file, không chạy lệnh nào lên database.
1. Liệt kê mọi script hoặc đoạn code có thể xóa nhiều dòng một lúc, và điều kiện lọc của chúng.
2. Dự án có script hay tài liệu nào về sao lưu và khôi phục không? Nếu có, nó xuất những gì và thiếu những gì.
3. Có file xuất dữ liệu nào đang nằm trong Git không? Chỉ nêu tên file, không in nội dung.
```
