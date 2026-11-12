---
id: schema-migrations
title: Thay đổi cấu trúc cơ sở dữ liệu (Migration)
group: database
prerequisites: [data-relations, git-commit]
priority: 2
stage: 3
format: 2
signals:
  - "supabase/migrations"
  - "prisma/migrations"
  - "ALTER TABLE"
  - "DROP COLUMN"
  - "prisma migrate"
  - "db push"
---

## Nhắc lại

### Theo bài Quan hệ dữ liệu, khi xóa một dòng khách hàng mà vẫn còn đơn hàng trỏ tới, `on delete cascade` và `on delete restrict` khác nhau thế nào?

`cascade` xóa theo các dòng đơn hàng đang tham chiếu khách đó; `restrict` chặn xóa khách khi còn dòng tham chiếu. Đây là quy tắc khi xóa một dòng, không phải lệnh xóa cả bảng hay cột. Chọn quy tắc nào phải theo nghiệp vụ, nhất là với hóa đơn cần giữ lại.

### Theo bài Git commit, sau khi đã `git add` một file rồi AI sửa tiếp file đó, dùng lệnh nào để xem đúng phần sắp commit?

`git diff --cached -- <tên-file>` cho thấy phần đã stage so với commit trước. `git diff` mặc định chỉ hiện phần chưa stage; mở file trên ổ đĩa cũng chưa cho biết chính xác bản sắp commit vì có thể chứa cả sửa đổi mới chưa stage.

## Đoán trước

Bạn bảo AI: "đổi tên cột `phone` trong bảng khách hàng thành `phone_number` cho thống nhất". AI sửa code, tạo một file thay đổi cấu trúc, chạy lệnh áp vào database và báo "đã xong, build thành công". Trang danh sách khách hàng mở lên bình thường nhưng cột số điện thoại của 800 khách đều trống. Bạn hoảng, chạy `git revert` để quay về bản code cũ. Code quay về, trang báo lỗi không tìm thấy cột `phone`, còn số điện thoại vẫn không trở lại. Vì sao hoàn tác bằng Git không cứu được?

### Đáp án

Vì có hai thứ đã thay đổi và Git chỉ quản một thứ. Code là file, hoàn tác được. Cấu trúc bảng và dữ liệu nằm trong database, lệnh đã chạy là đã chạy. Công cụ sinh lệnh không biết bạn muốn "đổi tên", nó thấy cột `phone` biến mất và cột `phone_number` xuất hiện nên sinh ra lệnh xóa cột cũ rồi thêm cột mới. Xóa cột là xóa luôn mọi giá trị trong cột đó. Muốn lấy lại chỉ còn cách khôi phục từ bản sao lưu. "Build thành công" chỉ nói code biên dịch được, không nói gì về dữ liệu.

## Ví dụ mẫu

Sửa code giống sửa bản vẽ nhà: vẽ sai thì lấy bản cũ ra dùng. Sửa cấu trúc database giống đập tường trong căn nhà đang có người ở và đầy đồ đạc. Lấy lại bản vẽ cũ không dựng lại được bức tường, cũng không trả lại đồ đã vỡ.

**Schema (cấu trúc database)** là danh sách bảng, cột, kiểu dữ liệu, khóa và quy tắc. **Migration** là một file ghi lại một lần thay đổi schema, có đánh số hoặc dấu thời gian, nằm trong Git. Với Supabase, chúng thường ở `supabase/migrations/*.sql`. Với Prisma, ở `prisma/migrations/`. Công cụ sẽ chạy các file theo thứ tự và ghi nhớ file nào đã chạy trên database nào. Nhờ vậy project thử và project thật được đưa về cùng cấu trúc bằng cùng một bộ file, và bạn đọc được chính xác lệnh sẽ chạy trước khi nó chạy.

Migration AI sinh ra cho yêu cầu "đổi tên cột", SAI:

```sql
-- supabase/migrations/20261105093000_rename_phone.sql
ALTER TABLE customers DROP COLUMN phone;            -- xóa cột và mọi số điện thoại đã lưu
ALTER TABLE customers ADD COLUMN phone_number text; -- cột mới, trống hoàn toàn
```

Migration ĐÚNG cho cùng yêu cầu:

```sql
-- Đổi tên tại chỗ, dữ liệu trong cột giữ nguyên
ALTER TABLE customers RENAME COLUMN phone TO phone_number;

-- Trước khi áp file này lên database thật, việc phải có là ___
```

Những từ cần dừng lại đọc kỹ trong một migration: `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`, `ALTER COLUMN ... TYPE` (đổi kiểu dữ liệu, có thể làm hỏng hoặc cắt giá trị), và `NOT NULL` trên cột mới không có giá trị mặc định (lệnh sẽ lỗi nếu bảng đã có dòng).

Ba thói quen an toàn:

- **Thêm trước, xóa sau.** Thêm cột mới, chép dữ liệu sang, cho code dùng cột mới, chạy ổn một thời gian rồi mới xóa cột cũ bằng một migration riêng.
- **Không sửa migration đã chạy.** Muốn đổi tiếp thì tạo file mới. Sửa file cũ khiến các database lệch nhau mà không ai biết.
- **Chạy trên project thử trước,** kiểm tra dữ liệu còn nguyên, rồi mới áp lên project thật sau khi đã sao lưu.

## Tìm trong project của bạn

1. **Tìm thư mục migration:** Xem dự án có `supabase/migrations/` hoặc `prisma/migrations/` không. Có và chứa nhiều file theo thời gian là ổn. Không có thư mục nào là dấu hiệu schema đang được sửa bằng tay hoặc bằng lệnh không để lại dấu vết.
2. **Tìm lệnh nguy hiểm:** Tìm toàn dự án `DROP`, `TRUNCATE`, `DELETE FROM`, `ALTER COLUMN`. Với mỗi kết quả trong thư mục migration, tự hỏi: dữ liệu trong cột hoặc bảng đó đi đâu?
3. **Xem lệnh trong `package.json` và lịch sử chat với AI:** Tìm `db push`, `migrate dev`, `migrate reset`, `db reset`, `--accept-data-loss`. `prisma db push` sửa thẳng database mà không tạo file migration. Các lệnh có chữ `reset` dựng lại database từ đầu, tức xóa dữ liệu. Chúng chỉ được phép chạy trên project thử hoặc database trên máy.
4. **So schema với thực tế:** Mở Table Editor của Supabase ở project thật, so danh sách cột của một bảng quan trọng với file migration mới nhất hoặc `schema.prisma`. Cột có trong database mà không có trong file nào nghĩa là từng có người sửa tay trên trang quản trị.
5. **Kiểm tra migration có đi kèm commit không:** Chạy `git log --oneline -- supabase/migrations prisma/migrations`. Mỗi thay đổi schema nên có một commit nói rõ thay đổi gì.
6. **Ghi lại kết quả:**
   - Dự án có thư mục migration: `[ Có / Không ]`
   - Migration chứa lệnh xóa hoặc đổi kiểu: `[ Có / Không - tên file: ... ]`
   - Database thật có cột hoặc bảng không nằm trong file nào: `[ Có / Không ]`
   - Lệnh dạng `reset` hoặc `db push` từng chạy trên database thật: `[ Có / Không / Không rõ ]`

## Tự giải thích

### Vì sao thay đổi cấu trúc bảng nên nằm trong file migration có trong Git, thay vì bấm sửa trực tiếp trên trang quản trị Supabase?

Sửa tay không để lại gì để đọc lại, để xem xét trước, hay để lặp lại trên project khác. Project thử và project thật dần lệch nhau, tính năng chạy ở nơi này lỗi ở nơi kia. File migration cho bạn lịch sử, cho phép đọc lệnh trước khi chạy, và giúp dựng lại đúng cấu trúc ở bất kỳ project mới nào.

### Vì sao `git revert` commit chứa file migration không đưa database về trạng thái cũ?

Revert chỉ gỡ file khỏi thư mục dự án. Database đã thực hiện lệnh trong file đó và không theo dõi Git. Muốn đưa cấu trúc về như cũ phải viết một migration mới làm điều ngược lại. Còn dữ liệu đã bị xóa thì không lệnh ngược nào tạo lại được, chỉ có bản sao lưu.

### Nếu xóa cột cũ ngay trong cùng lần deploy với code mới thì rủi ro là gì?

Có một khoảng thời gian bản code cũ vẫn đang chạy trong khi cột đã mất, người dùng gặp lỗi. Nếu code mới có vấn đề và bạn phải quay lại bản cũ, bản cũ cần cột đã không còn. Giữ cột cũ thêm một thời gian là giữ đường lui.

## Trắc nghiệm

### AI tạo file migration này cho yêu cầu "cho phép ghi chú đơn hàng dài hơn". Bạn nên phản ứng thế nào?

```sql
ALTER TABLE orders DROP COLUMN note;
ALTER TABLE orders ADD COLUMN note text;
```

- [ ] Chấp nhận, vì kết quả cuối vẫn là có cột `note` kiểu `text`
- [x] Dừng lại, vì mọi ghi chú đã lưu sẽ mất. Yêu cầu AI đổi kiểu cột tại chỗ và thử trên project thử trước
- [ ] Chấp nhận nếu `npm run build` không báo lỗi
- [ ] Sửa tay cột trên trang quản trị Supabase rồi xóa file migration này đi

**Giải thích:** Xóa cột rồi tạo lại cho ra cột cùng tên nhưng trống. Cấu trúc cuối giống nhau không có nghĩa dữ liệu còn. Build chỉ kiểm tra code. Sửa tay rồi xóa file làm database và Git lệch nhau.

### Terminal hiện thông báo này khi agent chạy lệnh cập nhật database. Thông báo đang nói điều gì?

```text
⚠ We need to reset the "public" schema at "db.prodxxxx.supabase.co:5432"
All data will be lost. Do you want to continue? (y/N)
```

- [ ] Công cụ sẽ sao lưu rồi tạo lại bảng, dữ liệu được nạp lại sau
- [ ] Chỉ các bảng liên quan tới thay đổi mới bị ảnh hưởng
- [ ] Đây là cảnh báo chung, chọn `y` thì công cụ vẫn giữ dữ liệu cũ
- [x] Toàn bộ dữ liệu trong database ở địa chỉ đó sẽ bị xóa, và địa chỉ này là project thật

**Giải thích:** "Reset" nghĩa là xóa hết rồi dựng lại cấu trúc từ các file migration, không có bước sao lưu nào đi kèm. Địa chỉ trong thông báo chứa mã của project thật. Việc đúng là chọn `N`, rồi xem vì sao máy làm việc lại cầm chuỗi kết nối của project thật.

### Bạn thêm cột `is_vip` bằng Table Editor trên project thật vì đang vội. Hai tuần sau, tính năng VIP chạy tốt trên bản thật nhưng bản Preview báo `column "is_vip" does not exist`. Vì sao?

- [x] Thay đổi chỉ có ở project thật, không có file migration nào để áp cho project thử
- [ ] Bản Preview dùng bản code cũ chưa có tính năng VIP
- [ ] RLS ở project thử đang chặn cột `is_vip`
- [ ] Vercel chưa đồng bộ database giữa hai môi trường

**Giải thích:** Sửa tay chỉ thay đổi đúng database đó. Project thử không biết về cột mới vì không có file nào ghi lại. Vercel không đồng bộ database. RLS chặn theo dòng và cho lỗi về quyền, không cho lỗi thiếu cột.

### Bạn cần thêm cột `country` bắt buộc phải có giá trị vào bảng `customers` đang có 2.000 dòng. Cách nào ít rủi ro nhất?

- [ ] Thêm thẳng cột `country text NOT NULL` trong một migration
- [ ] Xóa bảng, tạo lại bảng có cột mới, rồi nhập lại dữ liệu
- [x] Thêm cột cho phép trống, điền giá trị cho các dòng cũ, sau đó mới đặt ràng buộc bắt buộc
- [ ] Thêm cột trên trang quản trị để khỏi phải viết migration

**Giải thích:** Hai nghìn dòng cũ chưa có giá trị cho cột mới, nên ràng buộc `NOT NULL` đặt ngay sẽ khiến lệnh thất bại. Chia ba bước giữ được dữ liệu và kiểm tra được từng bước. Xóa bảng tạo lại là thao tác rủi ro nhất, và bảng khác có thể đang trỏ khóa ngoại vào nó.

## Kiểm tra không dùng AI

### Tình huống: Agent đề xuất migration dưới đây cho yêu cầu "gộp họ và tên thành một cột `full_name`". App đang có 1.500 khách. Hãy nêu vấn đề và cách bạn yêu cầu làm lại, kèm lý do.

```sql
ALTER TABLE customers ADD COLUMN full_name text NOT NULL;
ALTER TABLE customers DROP COLUMN first_name;
ALTER TABLE customers DROP COLUMN last_name;
```

#### Đáp án

1. **Vấn đề thứ nhất:** Dòng đầu thêm cột bắt buộc có giá trị vào bảng đã có 1.500 dòng mà không có giá trị mặc định, lệnh sẽ lỗi.
2. **Vấn đề thứ hai, nặng hơn:** Không có bước nào chép họ và tên cũ sang `full_name`. Nếu sửa cho dòng đầu chạy được, hai dòng sau xóa sạch họ tên của mọi khách.
3. **Yêu cầu làm lại theo từng bước:** thêm `full_name` cho phép trống; viết lệnh `UPDATE` ghép `last_name` và `first_name` vào `full_name`; kiểm tra không còn dòng nào trống; cho code đọc cột mới; để hai cột cũ lại.
4. **Xóa cột cũ ở một migration riêng, sau này.** *Lý do:* khi mọi thứ đã chạy ổn và có bản sao lưu, việc xóa mới không còn là canh bạc.
5. **Chạy toàn bộ trên project thử trước** và đếm số dòng có `full_name` so với tổng số khách.

## Lỗi suy luận hay gặp

### "Có Git rồi nên thay đổi nào cũng quay lại được"

- **Vì sao sai:** Git quay lại được file. Database không nằm trong Git. Lệnh xóa cột, xóa bảng, đổi kiểu đã chạy thì dữ liệu đã đổi, bất kể bạn revert bao nhiêu commit.
- **Cách sửa:** Coi mỗi migration có lệnh xóa hoặc đổi kiểu là thao tác một chiều. Sao lưu trước, thử trên project thử trước.

### "AI báo migration chạy thành công nghĩa là dữ liệu vẫn ổn"

- **Vì sao sai:** "Thành công" nghĩa là database chấp nhận lệnh. Lệnh xóa cột chạy thành công chính là lúc dữ liệu mất. AI thường không kiểm tra số dòng hay giá trị trước và sau.
- **Cách sửa:** Tự đếm. Trước và sau migration, so số dòng và xem vài giá trị của các cột bị đụng tới.

### "Sửa trên trang quản trị nhanh hơn, lát bổ sung migration sau"

- **Vì sao sai:** "Lát nữa" thường không đến. Lần tới AI sinh migration dựa trên các file cũ, không biết thay đổi tay của bạn, và có thể ghi đè hoặc xung đột với nó.
- **Cách sửa:** Thay đổi nào với schema cũng bắt đầu bằng một file migration, kể cả thay đổi nhỏ. Lỡ sửa tay thì ghi lại ngay thành file trong cùng ngày.

## Bài tập thực hành

Mục tiêu: đọc được một migration thật trong dự án và tự phân loại nó là an toàn hay một chiều. Bài này chỉ đọc file, không chạy lệnh nào lên database.

### Việc cần làm

1. Mở thư mục migration của dự án, chọn ba file mới nhất.
2. Với mỗi file, viết một câu tiếng Việt mô tả nó thay đổi gì: thêm bảng, thêm cột, đổi tên, đổi kiểu, hay xóa.
3. Gạch dưới mọi dòng có `DROP`, `TRUNCATE`, `DELETE FROM`, `ALTER COLUMN ... TYPE`, `NOT NULL`.
4. Với mỗi dòng đã gạch, trả lời: dữ liệu cũ đi đâu, và nếu sai thì lấy lại bằng cách nào?
5. Chạy `git log --oneline -- <đường dẫn file>` để xem file thuộc commit nào và ghi chú commit có nói đúng nội dung không.

### Kết quả đúng

Bạn có một bảng ba dòng, mỗi dòng gồm tên file, mô tả một câu, nhãn "chỉ thêm" hoặc "có thao tác một chiều", và commit tương ứng. Nếu dự án không có file migration nào, kết quả đúng là ghi nhận điều đó và đưa việc lập migration vào danh sách cần làm.

### Nhờ AI rà lại

```text
Hãy đọc các file migration của dự án và CHỈ BÁO CÁO, không sửa file, không chạy lệnh nào lên database.
1. Liệt kê mọi lệnh có thể làm mất hoặc biến đổi dữ liệu đã lưu, kèm tên file và số dòng.
2. Với mỗi lệnh, nói rõ dữ liệu nào bị ảnh hưởng và có bước chép dữ liệu đi trước hay không.
3. Chỉ ra chỗ nào schema trong code có vẻ lệch với các file migration.
```
