---
id: data-crud
title: Đọc, thêm, sửa, xóa dữ liệu (CRUD)
group: database
prerequisites: [database-table, api-endpoint]
priority: 2
stage: 2
format: 2
signals:
  - ".insert("
  - ".update("
  - ".delete("
  - ".select("
  - "DELETE FROM"
  - ".eq("
---

## Nhắc lại

### Trong một bảng dữ liệu, cột `id` dùng để làm gì?

`id` là mã định danh duy nhất của từng dòng. Nhờ nó, code chỉ đúng được một bản ghi cần đọc, sửa hay xóa, và bảng khác trỏ tới được bản ghi đó.

### Trong file `route.ts`, các hàm `GET`, `POST`, `PATCH`, `DELETE` khác nhau thế nào?

Mỗi hàm là một ô cửa riêng của cùng một địa chỉ, ứng với một loại hành động: `GET` để xem, `POST` để tạo mới, `PATCH` để sửa, `DELETE` để xóa. Ô cửa nào cũng phải tự kiểm tra người gọi là ai.

## Đoán trước

Bạn nhờ AI thêm nút "Hủy đơn" cho khách. AI viết xong, bạn dùng tài khoản thử, tạo một đơn rồi bấm hủy. Đơn biến mất khỏi danh sách, đúng như mong muốn. Bạn đưa lên chạy thật. Sáng hôm sau, một khách bấm hủy đơn của mình và nhân viên bếp gọi cho bạn: toàn bộ đơn đang chờ pha của mọi khách đã biến mất khỏi màn hình. Lúc bạn thử, hệ thống chỉ có đúng một đơn. Lệnh xóa đã được viết thế nào mà một lần bấm xóa được đơn của tất cả mọi người?

### Đáp án

Lệnh xóa có điều kiện lọc quá rộng. Thay vì nói "xóa đơn có `id` này", nó nói "xóa các đơn đang ở trạng thái chờ". Khi database chỉ có một đơn chờ, hai câu đó cho kết quả giống nhau, nên phép thử của bạn không phát hiện ra. Lệnh sửa và lệnh xóa tác động lên **mọi dòng khớp điều kiện**, và database không hỏi lại. Vì vậy với hai loại lệnh này, phần đáng đọc kỹ nhất là điều kiện lọc, và phép thử phải có ít nhất hai bản ghi, trong đó một bản ghi không được phép bị đụng tới.

## Ví dụ mẫu

Sổ kho của một cửa hàng chỉ có bốn việc: **ghi thêm** một dòng khi nhập hàng, **tra** xem còn bao nhiêu, **sửa** một dòng khi đếm lại, và **gạch bỏ** một dòng. Tra sổ thì không hại gì. Ghi thêm sai thì thừa một dòng. Nhưng sửa hoặc gạch nhầm dòng thì thông tin cũ mất luôn.

Trong phần mềm, bốn việc đó gọi tắt là **CRUD**: **Create** (thêm), **Read** (đọc), **Update** (sửa), **Delete** (xóa). Gần như mọi tính năng của một app đều là tổ hợp của bốn việc này trên một bảng nào đó. Bạn sẽ gặp chúng dưới ba cách viết:

| Việc | Yêu cầu HTTP | Lệnh SQL | Thư viện Supabase |
|---|---|---|---|
| Thêm | `POST` | `INSERT` | `.insert(...)` |
| Đọc | `GET` | `SELECT` | `.select(...)` |
| Sửa | `PATCH` / `PUT` | `UPDATE` | `.update(...)` |
| Xóa | `DELETE` | `DELETE` | `.delete()` |

Cách làm SAI (điều kiện lọc không chỉ đúng một đơn, không kiểm tra chủ đơn):

```ts
// SAI: xóa MỌI đơn đang chờ, của mọi khách
await supabase.from('orders').delete().eq('status', 'pending')
return NextResponse.json({ ok: true }) // báo xong mà không xem kết quả
```

Cách làm ĐÚNG trong `app/api/orders/[id]/route.ts`, sau khi đã lấy `user` bằng `supabase.auth.getUser()`:

```ts
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'cancelled' }) // đổi trạng thái thay vì xóa hẳn
  .eq('id', orderId)               // đúng MỘT đơn
  .eq('user_id', user.id)          // và phải là đơn của người đang đăng nhập
  .select()                        // trả về những dòng vừa đổi
if (error) {
  return NextResponse.json({ error: 'Chưa hủy được đơn' }, { status: 500 })
}
if (data.length === ___) {         // không dòng nào đổi: không được báo thành công
  return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })
}
return NextResponse.json({ ok: true })
```

Ba điều cần nhớ:

1. **Sửa và xóa phải có điều kiện lọc theo `id`.** Trong SQL thuần, `DELETE FROM orders` không kèm `WHERE` sẽ xóa cả bảng.
2. **Thư viện Supabase không ném lỗi khi lệnh hỏng.** Nó trả lỗi qua trường `error`. Code không đọc `error` thì thất bại cũng trôi qua im lặng.
3. **"Không lỗi" chưa chắc là "đã đổi".** Khi RLS (Row Level Security, quy tắc phân quyền theo từng dòng của Supabase) không cho phép, lệnh sửa hoặc xóa thường không báo lỗi mà chỉ tác động lên 0 dòng. Muốn biết thật, phải xem số dòng trả về.

## Tìm trong project của bạn

1. **Lập danh sách lệnh ghi:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) lần lượt `.insert(`, `.update(`, `.delete(`, `.upsert(`. Nếu dự án dùng Prisma, tìm `.create(`, `.updateMany(`, `.deleteMany(`. Tìm thêm `DELETE FROM` và `UPDATE ` trong các file `.sql`.
2. **Đọc điều kiện lọc của từng lệnh sửa và xóa:** Ổn: có `.eq('id', ...)` và thêm một điều kiện về chủ sở hữu như `.eq('user_id', user.id)`. Có vấn đề: chỉ lọc theo trạng thái, theo ngày, hoặc theo một giá trị do trình duyệt gửi lên mà không kèm `id`.
3. **Xem lệnh chạy ở đâu:** Lệnh nằm trong `app/api/`, file `'use server'` hay trong file `'use client'`? Nếu trình duyệt gọi thẳng Supabase thì thứ duy nhất bảo vệ bảng là RLS. Mở Supabase, vào bảng đó và xem RLS đã bật chưa.
4. **Xem kết quả có được kiểm tra không:** Ngay sau mỗi lệnh ghi, có đọc `error` không? Ổn: có `if (error)` và trả mã lỗi. Có vấn đề: `await supabase...` đứng một mình rồi trả `ok: true`.
5. **Ghi lại kết quả của bạn:**
   - Lệnh sửa hoặc xóa nào không lọc theo `id`?: `[ Tên file: ... ]`
   - Lệnh ghi nào không kiểm tra `error`?: `[ Tên file: ... ]`
   - Bảng nào được trình duyệt ghi trực tiếp, và RLS của bảng đó: `[ Tên bảng: ... - Bật / Tắt ]`

## Tự giải thích

### Vì sao phép thử với một bản ghi duy nhất không phát hiện được lệnh xóa có điều kiện lọc quá rộng?

Khi chỉ có một bản ghi, "xóa đúng bản ghi này" và "xóa mọi bản ghi giống thế này" cho cùng một kết quả. Sự khác biệt chỉ lộ ra khi có bản ghi thứ hai cũng khớp điều kiện rộng. Vì vậy phép thử cho lệnh sửa và xóa cần ít nhất hai bản ghi của hai tài khoản khác nhau, và phải kiểm tra rằng bản ghi còn lại vẫn nguyên vẹn.

### Bỏ dòng `.eq('user_id', user.id)` trong ví dụ đúng thì điều gì có thể xảy ra?

Lệnh vẫn chỉ đụng tới một đơn, nhưng là đơn của bất kỳ ai. Người gọi chỉ cần đổi mã đơn trong địa chỉ là hủy được đơn của người khác. Nếu bảng có RLS chặt thì RLS có thể chặn, nhưng không nên dựa vào một lớp duy nhất. Điều kiện về chủ sở hữu ngay trong lệnh làm ý định của code rõ ràng và dễ rà lại.

### Vì sao nên đổi trạng thái thành "đã hủy" thay vì xóa hẳn dòng?

Xóa hẳn là không lấy lại được nếu không có bản sao lưu. Đổi trạng thái thì dữ liệu còn đó: khôi phục được khi bấm nhầm, đối soát được khi khách khiếu nại, và báo cáo doanh thu không bị hụt dòng. Cái giá phải trả là mọi lệnh đọc phải nhớ lọc bỏ các dòng đã hủy.

## Trắc nghiệm

### AI viết lệnh sau cho tính năng "Đổi tên hiển thị". Sau khi một khách đổi tên, điều gì xảy ra?

```ts
await supabase.from('profiles').update({ display_name: newName })
  .eq('role', 'customer')
```

- [ ] Chỉ khách đó được đổi tên, vì lệnh chạy trong phiên đăng nhập của họ
- [x] Lệnh nhắm tới mọi hồ sơ có `role` là `customer`; nếu không có gì chặn lại, tất cả cùng mang tên mới
- [ ] Lệnh báo lỗi vì thiếu `.select()`
- [ ] Không hồ sơ nào đổi, vì `update` cần có `id`

**Giải thích:** Điều kiện lọc quyết định dòng nào bị tác động, không phải việc ai đang đăng nhập. `role = customer` khớp với mọi khách. RLS chặt có thể giới hạn thiệt hại, nhưng lệnh vẫn sai ý định. Điều kiện đúng phải là `id` của chính người đang đăng nhập, lấy từ phiên ở máy chủ.

### Khách bấm "Lưu địa chỉ", app báo "Đã lưu", nhưng tải lại thì địa chỉ vẫn như cũ. Console không có lỗi. Code như sau. Nguyên nhân hợp lý nhất?

```ts
await supabase.from('addresses').update({ street }).eq('id', addressId)
toast.success('Đã lưu')
```

- [ ] Trình duyệt lưu đệm nên hiện dữ liệu cũ
- [ ] Database cần vài phút để cập nhật
- [ ] Lệnh `update` chỉ dùng được ở máy chủ
- [x] Lệnh không ghi được (thất bại, hoặc bị RLS giới hạn còn 0 dòng) nhưng code không kiểm tra kết quả nên vẫn báo thành công

**Giải thích:** Thư viện Supabase không ném lỗi, nên dòng báo thành công luôn chạy. Khi RLS không cho sửa, lệnh thường kết thúc êm với 0 dòng thay đổi. Cần đọc `error` và thêm `.select()` để đếm số dòng đã đổi rồi mới báo.

### Bạn cần AI thêm tính năng "Xóa khách hàng" cho trang quản trị. Yêu cầu nào giúp bạn an toàn nhất?

- [x] "Đánh dấu khách đã xóa bằng cột `deleted_at`, lọc theo `id`, kiểm tra quyền quản trị ở máy chủ, và trả lỗi nếu không có dòng nào thay đổi"
- [ ] "Xóa khách hàng khỏi bảng `customers` cho gọn database"
- [ ] "Ẩn khách hàng khỏi danh sách trên giao diện bằng state"
- [ ] "Xóa khách và mọi đơn hàng liên quan trong một lệnh để khỏi sót"

**Giải thích:** Yêu cầu đầu nêu đủ bốn điều: không mất dữ liệu, đúng một dòng, đúng người có quyền, và có kiểm tra kết quả. Xóa hẳn kèm mọi đơn hàng làm mất dữ liệu doanh thu và không lấy lại được. Chỉ ẩn bằng state thì tải lại trang là khách hiện lại.

### Trong bốn việc CRUD, vì sao sửa và xóa cần được rà kỹ hơn thêm và đọc?

- [ ] Vì chúng chạy chậm hơn nên dễ gây quá tải
- [ ] Vì chỉ hai việc này mới cần đăng nhập
- [x] Vì chúng ghi đè hoặc loại bỏ dữ liệu đang có, và tác động lên mọi dòng khớp điều kiện lọc
- [ ] Vì Supabase tính phí cao hơn cho hai việc này

**Giải thích:** Đọc sai thì hiển thị sai, thêm sai thì thừa dòng, cả hai đều còn dữ liệu gốc để sửa. Sửa và xóa sai thì giá trị cũ mất. Việc đọc và thêm vẫn cần kiểm tra quyền, nhưng hậu quả của một điều kiện lọc sai ở lệnh sửa và xóa là khó khắc phục nhất.

## Kiểm tra không dùng AI

### Tình huống: AI viết Server Action dưới đây cho nút "Đánh dấu tất cả thông báo là đã đọc". Hãy chỉ ra vấn đề, hậu quả có thể xảy ra, và cách sửa kèm lý do.

```ts
'use server'
export async function markAllRead() {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
}
```

#### Đáp án

1. **Vấn đề:** Điều kiện lọc là "mọi thông báo chưa đọc", không có điều kiện về người nhận. Chữ "tất cả" trong tên tính năng nghĩa là tất cả của **tôi**, còn lệnh thì nhắm tới tất cả của **mọi người**.
2. **Hậu quả:** Nếu bảng chưa bật RLS hoặc quy tắc lỏng, một người bấm nút là thông báo chưa đọc của toàn bộ người dùng biến thành đã đọc. Họ bỏ lỡ thông báo quan trọng mà không ai biết vì sao.
3. **Thiếu kiểm tra:** Hàm không lấy người dùng hiện tại và không đọc `error`, nên thất bại cũng không ai biết.
4. **Cách sửa:** Gọi `supabase.auth.getUser()` ở đầu hàm, từ chối nếu chưa đăng nhập. Thêm `.eq('user_id', user.id)` vào lệnh. Đọc `error` và báo lại khi lệnh hỏng. *Lý do:* điều kiện lọc phải nói đúng phạm vi mà tính năng muốn, và không được trông cậy hoàn toàn vào RLS.
5. **Cách kiểm chứng:** Dùng hai tài khoản thử, mỗi bên có thông báo chưa đọc. Bấm nút ở tài khoản thứ nhất rồi xem tài khoản thứ hai còn nguyên không.

## Lỗi suy luận hay gặp

### "Tôi thử xóa và nó xóa đúng, vậy lệnh xóa đã đúng"

- **Vì sao sai:** Bạn mới chứng minh nó xóa được thứ cần xóa. Bạn chưa chứng minh nó **không** xóa thứ khác.
- **Cách sửa:** Mỗi lần thử lệnh sửa hoặc xóa, tạo sẵn một bản ghi "không được đụng tới" của một tài khoản khác và kiểm tra nó sau khi thử.

### "Không có lỗi nghĩa là dữ liệu đã được ghi"

- **Vì sao sai:** Thư viện Supabase trả lỗi qua `error` chứ không ném, và RLS có thể làm lệnh sửa, xóa tác động lên 0 dòng mà không báo gì.
- **Cách sửa:** Yêu cầu code kiểm tra `error` và số dòng thay đổi. Tự bạn thì tải lại trang hoặc mở Table Editor của Supabase để nhìn dữ liệu thật.

## Bài tập thực hành

Mục tiêu: lập bản đồ CRUD cho bảng quan trọng nhất của bạn và thử một lệnh sửa bằng hai tài khoản. Chỉ làm trên bản chạy ở máy hoặc bản preview nối với database thử. Bài này không yêu cầu xóa gì.

### Việc cần làm

1. Chọn bảng quan trọng nhất (ví dụ `orders`). Kẻ bảng bốn dòng: Thêm, Đọc, Sửa, Xóa.
2. Tìm trong code các lệnh tác động lên bảng đó. Ở mỗi dòng, ghi tên file, điều kiện lọc, và lệnh chạy ở máy chủ hay trình duyệt.
3. Tạo hai tài khoản thử A và B. Dùng mỗi tài khoản tạo một bản ghi thử.
4. Đăng nhập A, sửa bản ghi của A. Tải lại trang để xác nhận đã lưu.
5. Mở Table Editor của database thử và xem bản ghi của B. Ghi lại nó có thay đổi không.

### Kết quả đúng

Bạn có bảng bốn dòng với đủ ba thông tin ở mỗi dòng. Mọi lệnh sửa và xóa đều lọc theo `id` và chủ sở hữu. Sau bước 4, bản ghi của A đổi và còn nguyên sau khi tải lại. Bản ghi của B không đổi một chữ nào.

### Nhờ AI rà lại

```text
Hãy liệt kê mọi lệnh insert, update, delete, upsert trong dự án
theo từng bảng. Với mỗi lệnh, nêu: tên file và dòng, điều kiện lọc,
có lọc theo id và chủ sở hữu không, có kiểm tra error và số dòng
thay đổi không, chạy ở máy chủ hay trình duyệt.
Đánh dấu lệnh nào có thể tác động lên nhiều dòng hơn ý định.
Chỉ báo cáo, không sửa file và không chạy lệnh nào trên database.
```
