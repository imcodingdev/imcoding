---
id: authorization
title: Phân quyền truy cập và RLS
group: auth
prerequisites: [authentication, data-relations]
priority: 1
stage: 3
format: 2
signals:
  - "enable row level security"
  - "create policy"
  - "auth.uid()"
  - "service_role"
  - "SUPABASE_SERVICE_ROLE_KEY"
---

## Nhắc lại

### Trong code máy chủ dùng Supabase, vì sao phải lấy danh tính người gọi bằng `supabase.auth.getUser()` thay vì nhận `userId` do trình duyệt gửi lên?

Vì mọi thứ trình duyệt gửi lên đều sửa được. `getUser()` để Supabase xác minh phiên đăng nhập rồi mới trả về người dùng, nên người gọi không tự khai mình là người khác được.

### Cột `user_id` trong một bảng dùng để làm gì?

Nó là khóa ngoại trỏ về bảng người dùng, cho biết dòng đó thuộc về ai. Bản thân cột này không chặn ai đọc, nhưng mọi quy tắc phân quyền đều dựa vào nó.

## Đoán trước

Bạn dùng Lovable dựng app quản lý hóa đơn trên Supabase. Trang nào cũng bắt đăng nhập. Mỗi khách chỉ thấy hóa đơn của mình vì code giao diện có đoạn lọc `.eq('user_id', user.id)`. Một khách rành kỹ thuật đăng nhập bằng tài khoản của chính họ, mở DevTools, thấy địa chỉ project Supabase và khóa `anon` nằm trong JavaScript của trang. Họ tự gửi yêu cầu đọc bảng `invoices`, bỏ điều kiện lọc đi, và nhận về hóa đơn của toàn bộ khách hàng. Họ không đoán mật khẩu của ai, không lấy trộm khóa bí mật nào. Vì sao database vẫn trả hết dữ liệu cho họ?

### Đáp án

Vì bảng `invoices` chưa bật **RLS**. Khóa `anon` (tên mới là publishable key) được thiết kế để nằm công khai trong trình duyệt. Thứ bảo vệ dữ liệu không phải là việc giấu khóa này mà là các quy tắc ở database. Khi bảng chưa bật RLS, ai cầm khóa công khai cũng đọc, ghi được cả bảng qua API của Supabase. Đoạn lọc `.eq('user_id', ...)` nằm trong code chạy ở trình duyệt nên người dùng bỏ đi được. Đăng nhập chỉ trả lời "bạn là ai", chưa trả lời "bạn được đụng vào dòng nào". Lỗi loại này có thật: CVE-2025-48757 ghi nhận tình trạng thiếu RLS trong các app tạo bằng Lovable, điểm CVSS 9,3, dù nhà cung cấp có tranh chấp. Trong OWASP Top 10 năm 2021, Broken Access Control (kiểm soát truy cập hỏng) đứng hạng 1.

## Ví dụ mẫu

Thẻ nhân viên cho bạn vào tòa nhà. Nó không cho bạn mở tủ hồ sơ của đồng nghiệp. Muốn vậy, **từng ngăn tủ** phải có khóa riêng và chỉ mở cho đúng chủ.

**Authorization (phân quyền)** là bước quyết định một người đã đăng nhập được xem, sửa, xóa những dòng dữ liệu nào. Trên Supabase, công cụ chính là **RLS (Row Level Security, bảo mật theo từng dòng)**: database tự kiểm tra từng dòng trước khi trả về hoặc cho sửa. Có hai việc phải làm:

1. **Bật RLS trên bảng.** Bật xong mà chưa có quy tắc nào thì khóa công khai không đọc, không ghi được dòng nào.
2. **Viết policy (quy tắc).** Mỗi policy mở một loại thao tác cho đúng những dòng thỏa điều kiện. Hàm `auth.uid()` trả về `id` của người đang gọi, lấy từ phiên đăng nhập đã được Supabase xác minh.

Cách làm SAI (AI hay viết thế này để hết lỗi "không thấy dữ liệu"):

```sql
-- SAI: có bật RLS, nhưng quy tắc cho mọi người đã đăng nhập xem mọi dòng
alter table invoices enable row level security;

create policy "Allow all" on invoices
for select to authenticated
using ( true );
```

Cách làm ĐÚNG:

```sql
alter table invoices enable row level security;

create policy "Chủ hóa đơn xem hóa đơn của mình" on invoices
for select to authenticated
using ( auth.uid() = user_id );          -- chỉ thấy dòng của mình

create policy "Chỉ tạo hóa đơn đứng tên mình" on invoices
for insert to authenticated
with check ( auth.uid() = ___ );         -- dòng mới phải ghi đúng chủ
```

Cách đọc: `using` lọc các dòng **đang có** mà người gọi được đụng tới. `with check` kiểm tra dòng **sắp ghi vào**. Mỗi thao tác `select`, `insert`, `update`, `delete` cần policy riêng. Thao tác nào không có policy thì bị chặn.

Còn một loại khóa nữa: **`service_role`** (tên mới là secret key). Khóa này **bỏ qua toàn bộ RLS**. Nó dành cho việc quản trị ở máy chủ như xử lý webhook thanh toán. Nó không bao giờ được mang tiền tố `NEXT_PUBLIC_`, không xuất hiện trong file có `'use client'`. Khi code máy chủ dùng khóa này, database không còn canh giúp nữa, nên chính đoạn code đó phải tự kiểm tra người gọi được làm gì.

## Tìm trong project của bạn

1. **Xem bảng nào chưa bật RLS.** Trên Supabase Dashboard, mở Authentication rồi Policies để thấy từng bảng và các policy của nó. Mở thêm Advisors, mục Security Advisor, xem có cảnh báo bảng chưa bật RLS không.
2. **Tìm trong code.** Tìm toàn dự án `enable row level security` và `create policy`, thường nằm trong `supabase/migrations/`. Đếm xem mỗi bảng chứa dữ liệu riêng của người dùng có đủ cả hai không.
3. **Đọc điều kiện của từng policy.** Tìm `using (true)` và `with check (true)`.
   - Ổn: điều kiện có `auth.uid()` so với cột chủ sở hữu. `using (true)` chỉ ổn với bảng thật sự công khai như danh mục sản phẩm, và chỉ cho `select`.
   - Có vấn đề: bảng dữ liệu riêng không bật RLS; policy `using (true)` trên bảng dữ liệu riêng; có policy `select` đúng nhưng `update`, `delete` mở cho mọi người.
4. **Tìm nơi dùng khóa `service_role`.** Tìm `service_role`, `SERVICE_ROLE`, `SUPABASE_SECRET`. Thấy trong file `'use client'` hoặc biến có `NEXT_PUBLIC_` là sự cố, phải thu hồi khóa. Thấy trong route máy chủ thì đọc xem đoạn đó có kiểm tra người gọi và quyền sở hữu không.
5. **Nếu project dùng Prisma hoặc Drizzle qua `DATABASE_URL`:** kết nối trực tiếp kiểu này thường không chịu RLS. Khi đó mọi câu truy vấn dữ liệu riêng phải tự có điều kiện chủ sở hữu, ví dụ `where: { id, userId: session.user.id }`.
6. **Ghi lại kết quả:**
   - Bảng dữ liệu riêng nào chưa bật RLS?: `[ ... ]`
   - Policy nào dùng `true` làm điều kiện?: `[ ... ]`
   - Khóa `service_role` được dùng ở những file nào?: `[ ... ]`

## Tự giải thích

### Vì sao lọc `.eq('user_id', user.id)` trong code giao diện không được tính là phân quyền?

Vì code đó chạy trên máy của người dùng. Họ sửa hoặc bỏ điều kiện lọc rồi gọi thẳng API của Supabase bằng khóa công khai. Phân quyền phải nằm ở nơi người dùng không sửa được: policy trong database hoặc code máy chủ.

### Bật RLS mà quên viết policy thì app sẽ thế nào, và vì sao tình trạng đó dễ dẫn tới một cách "sửa" nguy hiểm?

Truy vấn đọc bằng khóa công khai sẽ trả về danh sách rỗng, không kèm thông báo lỗi. Trông giống "mất dữ liệu". Khi bạn nhờ AI sửa, hai cách nhanh nhất làm dữ liệu hiện lại là viết policy `using (true)` hoặc chuyển sang dùng khóa `service_role`. Cả hai đều làm app chạy và đều mở dữ liệu cho sai người.

## Trắc nghiệm

### Bảng `messages` đã bật RLS và chỉ có một policy dưới đây. Người dùng A (đã đăng nhập) gửi lệnh xóa một tin nhắn của người dùng B. Kết quả là gì?

```sql
create policy "Xem tin của mình" on messages
for select to authenticated
using ( auth.uid() = user_id );
```

- [x] Không có dòng nào bị xóa, vì không có policy nào cho phép `delete`
- [ ] Tin nhắn của B bị xóa, vì policy chỉ giới hạn việc xem
- [ ] Tin nhắn của B bị xóa nếu A biết đúng `id` của tin nhắn đó
- [ ] Tin của B bị xóa vì A đã đăng nhập hợp lệ

**Giải thích:** Khi RLS đã bật, thao tác nào không có policy cho phép thì bị chặn. Ở đây chỉ `select` được mở. Hiểu lầm hay gặp là coi RLS như danh sách cấm, thật ra nó là danh sách cho phép.

### Sau khi bạn báo "trang hóa đơn trống trơn", Cursor sửa file như sau và báo đã xong. Nhận định nào đúng?

```ts
// utils/supabase/server.ts
return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // trước đây là khóa anon
)
```

- [ ] Ổn, vì khóa không có tiền tố `NEXT_PUBLIC_` nên vẫn bí mật
- [ ] Ổn, vì code máy chủ luôn được tin tưởng
- [x] Nguy hiểm, vì truy vấn qua client này giờ bỏ qua RLS, kể cả truy vấn thay mặt người dùng
- [ ] Không có gì thay đổi, vì RLS áp dụng cho mọi loại khóa

**Giải thích:** Khóa vẫn bí mật, nhưng vấn đề nằm ở quyền của nó. `service_role` bỏ qua RLS, nên route nào quên lọc theo chủ sở hữu sẽ trả dữ liệu của mọi người. Trang trống thường do thiếu policy; cách sửa đúng là viết policy, không phải đổi khóa.

### Khóa `anon` của Supabase xuất hiện trong JavaScript mà trình duyệt tải về. Bạn nên kết luận gì?

- [ ] Khóa đã lộ, phải thu hồi ngay
- [ ] Phải chuyển khóa này sang biến không có `NEXT_PUBLIC_`
- [ ] Không sao cả, khóa này không đọc được dữ liệu nào
- [x] Đây là thiết kế bình thường; an toàn hay không phụ thuộc vào RLS và policy trên từng bảng

**Giải thích:** Khóa công khai vốn dành cho trình duyệt. Nó đọc được đúng những gì policy cho phép. Bảng chưa bật RLS thì nó đọc được cả bảng. Vì vậy thứ cần kiểm tra là RLS, không phải chỗ đặt khóa này.

### Bảng `profiles` có policy `for update to authenticated using ( auth.uid() = id )`. Policy này bảo đảm được điều gì?

- [ ] Người dùng chỉ sửa được cột tên và ảnh đại diện
- [x] Người dùng chỉ sửa được dòng hồ sơ của chính mình, nhưng sửa được mọi cột trong dòng đó
- [ ] Không ai sửa được bảng `profiles`
- [ ] Người dùng sửa được hồ sơ của người khác nếu biết `id`

**Giải thích:** RLS quyết định theo dòng, không theo cột. Nếu dòng hồ sơ có cột `role` hay `credits`, chủ dòng tự sửa được chúng bằng khóa công khai. Dữ liệu người dùng không được tự sửa nên nằm ở bảng khác hoặc chỉ sửa qua code máy chủ có kiểm tra.

## Kiểm tra không dùng AI

### Tình huống: App của bạn có route đọc chi tiết hóa đơn như dưới đây. `supabaseAdmin` là client tạo bằng khóa `service_role`. Hãy nêu ai có thể lợi dụng route này, lợi dụng thế nào, và cách sửa kèm lý do.

```ts
// app/api/invoices/[id]/route.ts
export async function GET(req: Request, { params }: Ctx) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const { data } = await supabaseAdmin
    .from('invoices').select('*').eq('id', id).single()
  return Response.json(data)
}
```

#### Đáp án

1. **Ai lợi dụng được:** bất kỳ người dùng nào đã đăng nhập, kể cả tài khoản vừa đăng ký miễn phí.
2. **Cách lợi dụng:** route có kiểm tra đăng nhập nhưng không kiểm tra hóa đơn thuộc về ai. Truy vấn chạy bằng `supabaseAdmin` nên RLS bị bỏ qua. Người gọi chỉ cần đổi `id` trên đường dẫn, ví dụ từ `/api/invoices/101` thành `/api/invoices/102`, là đọc được hóa đơn của người khác.
3. **Cách sửa:** dùng client mang phiên của người dùng (`supabase`) cho truy vấn này, để policy `auth.uid() = user_id` tự lọc. Nếu buộc phải dùng `supabaseAdmin`, thêm điều kiện `.eq('user_id', user.id)` và trả `404` khi không tìm thấy.
4. **Lý do:** đăng nhập chỉ xác nhận danh tính. Quyền với từng dòng phải được kiểm ở nơi người dùng không sửa được, và khóa `service_role` đã tắt lớp kiểm tra của database.

## Lỗi suy luận hay gặp

### "Trang nào cũng bắt đăng nhập rồi nên dữ liệu an toàn"

- **Vì sao sai:** Người dễ khai thác lỗi nhất chính là một người dùng hợp lệ tò mò về dữ liệu của người khác. Họ qua được bước đăng nhập bằng tài khoản của họ.
- **Cách sửa:** Với mỗi bảng và mỗi route, hỏi thêm câu thứ hai: "người đã đăng nhập này có quyền với đúng dòng này không, và chỗ nào trong database hoặc code máy chủ kiểm điều đó?"

### "AI báo đã thêm RLS và app vẫn chạy bình thường, vậy là đúng"

- **Vì sao sai:** App chạy bình thường với tài khoản của bạn chỉ chứng minh bạn xem được dữ liệu của mình. Nó không chứng minh người khác bị chặn. Lỗi phân quyền không làm app hỏng nên không tự lộ ra.
- **Cách sửa:** Phép thử của phân quyền là phép thử từ chối: dùng tài khoản B cố đọc, sửa, xóa dữ liệu của A và thấy thất bại.

## Bài tập thực hành

Mục tiêu: tự kiểm chứng rằng tài khoản B không đọc, không sửa được dữ liệu của tài khoản A. Chỉ dùng hai tài khoản thử do bạn tạo và dữ liệu thử do chúng tạo ra, tốt nhất trên bản preview hoặc project thử.

### Việc cần làm

1. Tạo hai tài khoản thử A và B bằng hai email của chính bạn.
2. Đăng nhập A trong cửa sổ thường. Tạo một bản ghi thử, ví dụ hóa đơn tên "THU-A". Mở trang chi tiết và chép lại đường dẫn có chứa `id` của bản ghi.
3. Mở cửa sổ ẩn danh, đăng nhập B. Xem trang danh sách: "THU-A" có xuất hiện không?
4. Vẫn ở B, dán đường dẫn chi tiết của "THU-A" vào thanh địa chỉ. Ghi lại app hiện gì.
5. Nếu app có API riêng, vẫn ở B, mở đường dẫn API chứa `id` của "THU-A" (ví dụ `/api/invoices/<id>`). Ghi lại kết quả.
6. Lặp lại bước 2 đến 5 cho mỗi loại dữ liệu riêng mà app có.

### Kết quả đúng

Ở tài khoản B: danh sách không có "THU-A"; đường dẫn chi tiết báo không tìm thấy hoặc trang trống; đường dẫn API trả lỗi hoặc dữ liệu rỗng. Chỉ cần một bước cho B thấy nội dung "THU-A" là phân quyền đang hỏng ở loại dữ liệu đó. Ghi lại bảng nào, đường dẫn nào, rồi mới giao cho AI sửa và thử lại đúng các bước trên.

### Nhờ AI rà lại

```text
Hãy rà phân quyền của project này và chỉ báo cáo, không sửa file,
không chạy lệnh thay đổi database.
1. Liệt kê từng bảng: đã bật RLS chưa, có những policy nào, điều kiện là gì.
2. Chỉ ra policy dùng điều kiện true và bảng dữ liệu riêng chưa bật RLS.
3. Liệt kê mọi nơi dùng khóa service_role; với mỗi nơi, nêu đoạn code
   có tự kiểm tra người gọi và quyền sở hữu bản ghi hay không.
4. Liệt kê route và Server Action nhận id bản ghi từ người gọi
   mà không lọc theo người dùng đang đăng nhập.
```
