---
id: data-relations
title: Khóa và quan hệ dữ liệu
group: database
prerequisites: [database-table]
priority: 2
stage: 3
format: 2
signals:
  - "references"
  - "@relation"
  - "user_id"
  - "primary key"
  - "on delete cascade"
---

## Nhắc lại

### Theo bài Bảng dữ liệu, vì sao đơn hàng dùng `customerId` để tra thông tin hiện tại của khách, và khi nào vẫn cần lưu bản chụp thông tin riêng?

Tra theo `customerId` giúp cập nhật thông tin khách ở một nơi là bảng khách hàng. Nhưng hóa đơn hoặc địa chỉ giao hàng tại thời điểm mua có thể cần bản chụp lịch sử riêng. Cần phân biệt thông tin hiện tại với thông tin của giao dịch cũ, không coi mọi bản chụp là dữ liệu chép lặp sai.

### Dữ liệu lưu trong biến mảng ở code máy chủ khác gì dữ liệu lưu trong bảng của database?

Biến mảng nằm trong bộ nhớ tạm, máy chủ khởi động lại là mất. Bảng trong database lưu bền vững, có cột với kiểu dữ liệu cố định, và mỗi dòng có một `id` duy nhất.

## Đoán trước

Bạn làm app ghi chú và dặn AI: "mỗi người chỉ thấy ghi chú của mình". AI thêm cột `author_name` vào bảng `notes`, lúc lưu thì ghi tên hiển thị của người dùng, lúc đọc thì lọc theo tên đó. Bạn thử bằng tài khoản của mình, mọi thứ đúng. Một tuần sau có hai chuyện xảy ra. Hai khách cùng đặt tên hiển thị là "Minh Anh" đọc được ghi chú của nhau. Một khách khác đổi tên hiển thị từ "Hùng" thành "Hùng Trần" và báo toàn bộ ghi chú cũ biến mất. Database không báo lỗi nào. Vì sao cùng một cột `author_name` lại gây ra cả hai sự cố?

### Đáp án

Tên hiển thị không phải là thứ định danh. Nó **có thể trùng** (hai người tên Minh Anh) và **có thể đổi** (Hùng thành Hùng Trần). Dùng tên để nối ghi chú với chủ của nó thì trùng tên là lẫn dữ liệu, đổi tên là đứt liên kết. Ghi chú của Hùng vẫn nằm trong bảng, chỉ là không còn dòng nào khớp với tên mới. Thứ cần lưu là mã định danh của người dùng: một giá trị duy nhất, không bao giờ đổi, do hệ thống cấp. Cột đó thường tên là `user_id`. Database không báo lỗi vì với nó `author_name` chỉ là một ô chữ bình thường, không ai khai báo rằng ô đó phải trỏ tới một người dùng có thật.

## Ví dụ mẫu

Ở phòng khám, mỗi bệnh nhân có một **mã hồ sơ** riêng. Phiếu xét nghiệm không ghi lại họ tên, địa chỉ mà chỉ ghi mã hồ sơ. Nhân viên cũng không được phép viết một mã hồ sơ không tồn tại lên phiếu.

Database có ba khái niệm tương ứng:

- **Primary key (khóa chính):** cột định danh từng dòng trong một bảng, thường là `id`. Giá trị không trùng, không rỗng, không đổi.
- **Foreign key (khóa ngoại):** cột trong bảng này chứa khóa chính của một dòng ở bảng khác. Khi được khai báo là khóa ngoại, database sẽ **từ chối** giá trị không tồn tại ở bảng kia.
- **Cột chủ sở hữu:** một khóa ngoại trỏ về bảng người dùng, thường tên `user_id` hoặc `owner_id`. Nó trả lời câu hỏi "dòng này của ai". Mọi quy tắc phân quyền về sau đều dựa vào cột này. Bảng không có nó thì không có gì để phân quyền.

Cách làm SAI:

```sql
-- SAI: không có gì nối ghi chú với một người dùng cụ thể
create table notes (
  id bigint generated always as identity primary key,
  author_name text,   -- tên có thể trùng và có thể đổi
  content text
);
```

Cách làm ĐÚNG trên Supabase (bảng người dùng do Supabase Auth quản lý là `auth.users`):

```sql
create table notes (
  id bigint generated always as identity primary key,  -- khóa chính
  user_id uuid not null                                -- dòng này của ai
    references auth.users (id) on delete cascade,      -- khóa ngoại
  content text not null,
  created_at timestamptz not null default now()
);
-- Nếu bỏ "not null" ở cột user_id thì bảng có thể chứa ___
```

Đọc dòng khóa ngoại cần chú ý phần `on delete`. Nó quyết định chuyện gì xảy ra với dòng con khi dòng cha bị xóa. `cascade` là xóa theo: xóa tài khoản thì ghi chú của tài khoản đó cũng bị xóa. `restrict` là chặn: còn dòng con thì không cho xóa dòng cha. `set null` là giữ dòng con nhưng để trống ô liên kết. Đây là quyết định nghiệp vụ của bạn, không phải của AI. Ghi chú cá nhân thì xóa theo là hợp lý. Hóa đơn đã xuất thì thường phải giữ lại để đối chiếu sổ sách.

Quan hệ hay gặp nhất là **một nhiều**: một người dùng có nhiều ghi chú, mỗi ghi chú thuộc một người. Khi hai phía đều "nhiều" (một người thuộc nhiều nhóm, một nhóm có nhiều người), cần một **bảng trung gian** như `team_members` chứa hai khóa ngoại `team_id` và `user_id`.

Với Prisma, cùng ý đó được viết bằng `@id` cho khóa chính và `@relation(fields: [userId], references: [id])` cho khóa ngoại.

## Tìm trong project của bạn

1. **Tìm nơi khai báo bảng.** Với Supabase, mở thư mục `supabase/migrations/` và tìm `create table`. Với Prisma, mở `prisma/schema.prisma`. Nếu bảng được tạo bằng tay trên Dashboard, mở Table Editor của Supabase và xem từng bảng.
2. **Tìm khóa ngoại.** Tìm toàn dự án các từ `references`, `foreign key`, `@relation`. Trong Table Editor, cột là khóa ngoại có biểu tượng liên kết cạnh tên cột.
3. **Tìm cột chủ sở hữu.** Tìm `user_id`, `userId`, `owner_id`, `created_by`. Với từng bảng chứa dữ liệu riêng của người dùng (đơn hàng, ghi chú, hồ sơ, tệp tải lên), xác định cột nào cho biết dòng đó của ai.
4. **Đối chiếu.**
   - Ổn: cột chủ sở hữu có kiểu trùng với `id` của bảng người dùng, có `not null`, có `references`.
   - Có vấn đề: bảng dữ liệu riêng không có cột chủ sở hữu; cột chủ sở hữu là email hoặc tên; cột tên `..._id` nhưng không có `references`; cột chủ sở hữu cho phép để trống.
5. **Ghi lại kết quả:**
   - Bảng nào chứa dữ liệu riêng của từng người dùng?: `[ ... ]`
   - Bảng nào trong số đó thiếu cột chủ sở hữu hoặc thiếu khóa ngoại?: `[ ... ]`
   - Với mỗi khóa ngoại, `on delete` đang là gì và có đúng ý bạn không?: `[ ... ]`

## Tự giải thích

### Vì sao cột `customer_id` kiểu số bình thường và cột `customer_id` có khai báo `references customers (id)` lại khác nhau, dù lúc chạy thử app trông y hệt?

Cột bình thường nhận bất kỳ con số nào, kể cả mã của khách không tồn tại hoặc đã bị xóa. Cột có `references` được database canh giữ: thêm đơn với mã khách không có thật sẽ bị từ chối, xóa khách còn đơn sẽ theo đúng quy tắc `on delete`. Lúc chạy thử dữ liệu còn ít và đúng nên không thấy khác. Khác biệt chỉ lộ ra khi code có lỗi hoặc ai đó xóa dữ liệu.

### Nếu bảng `notes` không có cột `user_id`, vì sao bạn không thể sửa lỗi "ai cũng thấy ghi chú của nhau" chỉ bằng cách sửa câu truy vấn?

Vì trong dữ liệu không có thông tin để lọc. Câu truy vấn chỉ lọc được theo cột đang có. Phải thêm cột chủ sở hữu trước, và còn phải quyết định các dòng cũ thuộc về ai, rồi mới viết được điều kiện "chỉ lấy dòng của người đang đăng nhập".

## Trắc nghiệm

### AI tạo bảng bình luận như dưới đây và báo "đã xong". Vấn đề nào chắc chắn tồn tại?

```sql
create table comments (
  id bigint generated always as identity primary key,
  post_id bigint,
  author_email text,
  body text
);
```

- [ ] Bảng thiếu khóa chính nên các bình luận sẽ bị trùng nhau
- [ ] Kiểu `bigint` không dùng được cho cột `id`
- [x] `post_id` không phải khóa ngoại nên database chấp nhận bình luận trỏ tới bài viết không tồn tại
- [ ] Cột `body` phải đặt tên là `content` thì Supabase mới đọc được

**Giải thích:** Bảng có khóa chính là `id`. Nhưng `post_id` chỉ là một ô số, không có `references`, nên database không kiểm tra bài viết có thật hay không. Ngoài ra `author_email` cũng không phải mã định danh ổn định. Tên cột `body` hay `content` là tùy bạn.

### Một khách đổi email đăng nhập. Bảng `orders` của bạn nối đơn hàng với khách bằng cột `customer_email`. Chuyện gì dễ xảy ra nhất?

- [x] Các đơn cũ vẫn mang email cũ nên không còn hiện trong tài khoản của khách
- [ ] Database tự cập nhật email mới vào mọi đơn hàng cũ
- [ ] Khách không thể đổi email vì database chặn lại
- [ ] Đơn hàng cũ bị xóa tự động

**Giải thích:** `customer_email` chỉ là ô chữ. Database không biết nó liên quan tới tài khoản nào nên không tự cập nhật, không chặn, cũng không xóa. Đơn cũ nằm nguyên với email cũ và đứt liên kết. Nối bằng `user_id` thì khách đổi email bao nhiêu lần liên kết vẫn giữ.

### Bạn thấy dòng `references customers (id) on delete cascade` trong bảng `invoices`. Điều này có nghĩa gì?

- [ ] Xóa một hóa đơn thì khách hàng tương ứng cũng bị xóa
- [x] Xóa một khách hàng thì mọi hóa đơn của khách đó cũng bị xóa theo
- [ ] Hóa đơn không bao giờ xóa được
- [ ] Chỉ quản trị viên mới xóa được khách hàng

**Giải thích:** `cascade` lan từ dòng cha (khách hàng) xuống dòng con (hóa đơn), không lan ngược lại. Nó không liên quan tới việc ai có quyền xóa. Với hóa đơn, bạn nên cân nhắc `restrict` để không mất chứng từ khi xóa nhầm khách.

### App có tính năng "nhóm làm việc": một người tham gia nhiều nhóm, một nhóm có nhiều người. Cách lưu nào đúng?

- [ ] Thêm cột `team_id` vào bảng người dùng
- [ ] Thêm cột `member_names` kiểu chữ vào bảng nhóm, các tên cách nhau bằng dấu phẩy
- [ ] Mỗi nhóm tạo một bảng riêng
- [x] Tạo bảng trung gian `team_members` với hai khóa ngoại `team_id` và `user_id`

**Giải thích:** Một cột `team_id` trong bảng người dùng chỉ cho mỗi người thuộc một nhóm. Chuỗi tên cách nhau bằng dấu phẩy thì database không kiểm tra hay lọc được. Bảng trung gian lưu mỗi cặp người và nhóm thành một dòng, và sau này dùng được để kiểm tra "người này có thuộc nhóm này không".

## Kiểm tra không dùng AI

### Tình huống: App đặt lịch của bạn có bảng `bookings` do AI tạo như dưới đây. Sau khi dọn vài tài khoản thử, trang quản trị báo lỗi vì có lịch hẹn mang `customer_id` không khớp với khách nào. Hãy chỉ ra các thiếu sót trong cách khai báo bảng, hậu quả của từng thiếu sót, và hướng sửa.

```sql
create table bookings (
  id bigint generated always as identity primary key,
  customer_id uuid,
  staff_name text,
  starts_at timestamptz
);
```

#### Đáp án

1. **`customer_id` không có `references`.** Database không biết cột này phải trỏ tới một khách có thật, nên cho phép xóa khách trong khi lịch hẹn vẫn còn. Đó là các dòng mồ côi gây lỗi ở trang quản trị. Hướng sửa: khai báo khóa ngoại trỏ về bảng người dùng và chọn `on delete` theo nghiệp vụ, ví dụ `restrict` nếu lịch hẹn cần giữ.
2. **`customer_id` cho phép để trống.** Có thể tồn tại lịch hẹn không của ai. Khi viết quy tắc "khách chỉ thấy lịch của mình", những dòng này không thuộc về ai cả. Hướng sửa: thêm `not null` sau khi đã xử lý các dòng đang trống.
3. **`staff_name` là chữ.** Hai nhân viên trùng tên sẽ lẫn lịch, nhân viên đổi tên sẽ mất lịch cũ. Hướng sửa: dùng `staff_id` là khóa ngoại trỏ về bảng nhân viên.
4. **Trước khi sửa cấu trúc:** phải tìm và quyết định số phận các dòng mồ côi đang có. Thêm khóa ngoại khi dữ liệu còn dòng trỏ sai sẽ bị database từ chối. Việc này làm trên bản thử trước, không làm thẳng trên database thật.

## Lỗi suy luận hay gặp

### "Cột đã đặt tên là `user_id` thì database hiểu đó là khóa ngoại"

- **Vì sao sai:** Tên cột chỉ là nhãn cho người đọc. Database chỉ canh giữ liên kết khi có khai báo `references` (hoặc `@relation` trong Prisma). Không có khai báo thì `user_id` nhận giá trị nào cũng được.
- **Cách sửa:** Với mỗi cột `..._id`, mở chỗ khai báo bảng và tìm đúng từ `references` hoặc `@relation` đi kèm.

### "Có cột `user_id` rồi thì mỗi người tự động chỉ thấy dữ liệu của mình"

- **Vì sao sai:** Cột `user_id` chỉ ghi lại dòng đó của ai. Nó không chặn ai đọc. Muốn chặn phải có thêm quy tắc phân quyền dùng cột này, ví dụ RLS trên Supabase hoặc điều kiện lọc trong code máy chủ.
- **Cách sửa:** Coi cột chủ sở hữu là điều kiện cần. Sau khi có cột, kiểm tra tiếp xem quy tắc phân quyền đã được viết và đã được thử chưa. Bài tiếp theo nói về việc này.

## Bài tập thực hành

Mục tiêu: vẽ được sơ đồ quan hệ giữa các bảng trong app của bạn và biết bảng nào chưa trả lời được câu hỏi "dòng này của ai". Bài tập chỉ đọc, không sửa gì.

### Việc cần làm

1. Liệt kê mọi bảng của app ra giấy hoặc một file ghi chú. Trên Supabase, vào Database rồi mở Schema Visualizer để xem sơ đồ có sẵn.
2. Với mỗi bảng, ghi tên cột khóa chính.
3. Với mỗi bảng, ghi các cột khóa ngoại và bảng mà nó trỏ tới. Vẽ mũi tên từ bảng con sang bảng cha.
4. Đánh dấu sao cho những bảng chứa dữ liệu riêng của từng người dùng. Bên cạnh mỗi bảng ghi tên cột chủ sở hữu, hoặc ghi "KHÔNG CÓ".
5. Với mỗi mũi tên, ghi quy tắc `on delete` hiện tại và viết một câu: "xóa dòng cha thì tôi muốn dòng con thế nào".

### Kết quả đúng

Bạn có một sơ đồ mà mỗi bảng đều có khóa chính, mỗi mũi tên đều ứng với một khai báo `references` hoặc `@relation` tìm được trong code hay trên Dashboard, và mỗi bảng có dấu sao đều có tên cột chủ sở hữu. Chỗ nào ghi "KHÔNG CÓ" hoặc quy tắc `on delete` trái ý bạn là danh sách việc cần giao cho AI sửa, làm trên bản thử trước.

### Nhờ AI rà lại

```text
Hãy đọc toàn bộ khai báo bảng trong project này (thư mục migrations, file schema).
Lập bảng gồm: tên bảng, khóa chính, từng khóa ngoại và bảng được trỏ tới,
quy tắc on delete, cột cho biết bản ghi thuộc về người dùng nào.
Đánh dấu bảng chứa dữ liệu riêng của người dùng mà thiếu cột chủ sở hữu,
và cột tên dạng ..._id nhưng không khai báo khóa ngoại.
Chỉ báo cáo. Không sửa file, không chạy lệnh thay đổi database.
```
