---
id: authentication
title: Xác thực đăng nhập (Authentication)
group: auth
prerequisites: [api-endpoint, database-table]
priority: 1
stage: 3
format: 2
signals:
  - "auth()"
  - "next-auth"
  - "supabase.auth"
  - "proxy.ts"
  - "middleware.ts"
  - "bcrypt"
---

## Nhắc lại

### Khi trình duyệt gửi yêu cầu đến một API endpoint trong Next.js (ví dụ `app/api/orders/route.ts`), code bên trong file đó chạy ở máy người dùng hay máy chủ?

Code trong `route.ts` luôn chạy trên máy chủ (server). Trình duyệt chỉ gửi yêu cầu (request) đến `/api/orders` và chờ nhận kết quả, không nhìn thấy code xử lý bên trong.

### Trong một bảng dữ liệu (database table), cột khóa chính (`id`) dùng để làm gì và vì sao hai người dùng trùng tên vẫn không bị nhầm dữ liệu?

Cột `id` là mã định danh duy nhất cho từng dòng. Dù hai người trùng họ tên, mỗi người vẫn mang một `id` riêng, và các bảng khác (như bảng `orders`) liên kết qua cột `userId` này để phân biệt chính xác chủ sở hữu.

## Đoán trước

Bạn vừa ra mắt tính năng "Lịch sử đơn hàng". Trên giao diện trang `/orders`, bạn đã nhờ AI thêm đoạn kiểm tra: nếu chưa đăng nhập thì chuyển hướng về `/login`. Bạn mở trình duyệt ẩn danh vào `/orders`, thấy bị đẩy ngay về `/login` nên rất yên tâm. Thế nhưng hôm sau, một khách hàng phát hiện chỉ cần mở F12 hoặc gửi yêu cầu thẳng tới `/api/orders?userId=123` là tải về được toàn bộ hóa đơn, số điện thoại và địa chỉ của khách hàng có mã `123` mà không cần đăng nhập. Tại sao chặn ở trang `/orders` rồi mà dữ liệu vẫn bị lấy cắp?

### Đáp án

Chặn ở giao diện chỉ giống như **dán biển cấm trước cửa chính**, còn cửa kho lấy dữ liệu là API endpoint `/api/orders` ở máy chủ lại bỏ ngỏ. Kẻ xấu không cần đi qua giao diện mà gọi thẳng vào `/api/orders` và tự điền `userId` bất kỳ. Hơn nữa, việc máy chủ tin tưởng `userId=123` do trình duyệt gửi lên thay vì tự kiểm tra phiên đăng nhập khiến ai cũng giả mạo được người khác. Theo **OWASP Top 10 năm 2021, lỗi Kiểm soát truy cập hỏng (Broken Access Control) đứng vị trí số 1** trong các rủi ro bảo mật web nghiêm trọng nhất.

## Ví dụ mẫu

Hãy tưởng tượng một kho hàng chỉ dành cho nhân viên. Ngày đầu đi làm, bạn trình căn cước cho bảo vệ; bảo vệ đối chiếu danh sách rồi cấp cho bạn một **thẻ nhân viên** có hạn dùng. Những ngày sau, mỗi lần ra vào bạn chỉ cần quẹt thẻ, và nếu rơi thẻ thì báo quản lý khóa lại.

Trong phần mềm, **Authentication (Xác thực đăng nhập)** trả lời câu hỏi **"Bạn là ai?"**. Khi người dùng nhập đúng email và mật khẩu (hoặc đăng nhập Google), máy chủ đối chiếu với database rồi cấp một "thẻ" gọi là **Session (Phiên đăng nhập)**, thường cất trong cookie trình duyệt. Ở mọi yêu cầu tiếp theo, trình duyệt tự gửi kèm thẻ này để máy chủ nhận diện.

Lưu ý hai nguyên tắc sống còn:
1. **Xác thực khác với phân quyền:** Biết bạn là nhân viên (đã đăng nhập) chưa có nghĩa bạn được mở tủ hồ sơ phòng kế toán.
2. **Kiểm tra thẻ ở từng API endpoint và Server Action (`'use server'`):** Máy chủ phải tự đọc `userId` từ phiên đăng nhập hợp lệ, tuyệt đối không tin `userId` do trình duyệt gửi lên.

Cách làm SAI (tin vào `userId` từ trình duyệt và không kiểm tra phiên đăng nhập):

```ts
// SAI: Ai gọi URL /api/orders?userId=xxx cũng lấy được đơn hàng
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') // Nguy hiểm: người gọi tự sửa số này được!
  const orders = await db.order.findMany({ where: { userId } })
  return NextResponse.json(orders)
}
```

Cách làm ĐÚNG trong `app/api/orders/route.ts` (dùng Auth.js / NextAuth):

```ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth() // Đọc thẻ phiên đăng nhập ngay trên máy chủ
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: ___ })
  }
  const orders = await db.order.findMany({ where: { userId: session.user.id } })
  return NextResponse.json(orders)
}
```

## Tìm trong project của bạn

Hãy mở dự án và kiểm tra cơ chế đăng nhập theo các bước sau:

1. **Xác định công cụ đăng nhập:** Mở `package.json`, xem dự án đang dùng thư viện nào: `next-auth` (Auth.js), `@supabase/ssr` / `@supabase/supabase-js` (Supabase Auth), `@clerk/nextjs`, hay `better-auth`.
2. **Tìm nơi kiểm tra phiên ở máy chủ:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) các từ khóa: `await auth()`, `supabase.auth.getUser()`, hoặc `currentUser()`.
3. **Rà soát API route và Server Action:** Mở các file trong `app/api/` và các file có `'use server'`. Kiểm tra xem trước khi đọc/ghi database, hàm đó có kiểm tra đăng nhập không, hay đang lấy thẳng `userId` từ `req.json()` / `searchParams`.
4. **Kiểm tra cách lưu mật khẩu (nếu tự quản lý mật khẩu):** Xem cột mật khẩu trong bảng người dùng có được băm bằng `bcrypt` / `argon2` không, hay đang lưu chữ nguyên văn (plain text).
5. **Ghi lại kết quả của bạn:**
   - Dự án đang dùng thư viện đăng nhập nào?: `[ Tên thư viện: ... ]`
   - Có API route hay hàm `'use server'` nào lấy `userId` từ trình duyệt thay vì từ phiên đăng nhập không?: `[ Có / Không - tên file: ... ]`
   - Dự án có phụ thuộc duy nhất vào `middleware.ts` / `proxy.ts` mà bỏ trống kiểm tra trong API route không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao trong API endpoint hoặc hàm `'use server'`, ta bắt buộc phải lấy `userId` từ phiên đăng nhập trên máy chủ (`session.user.id` hoặc `supabase.auth.getUser()`) chứ không được nhận `userId` từ `req.json()`?

Mọi dữ liệu trong `req.json()`, tham số URL hay biểu mẫu đều xuất phát từ trình duyệt nên kẻ xấu có thể dễ dàng sửa `userId` thành mã của người khác trước khi gửi lên. Ngược lại, phiên đăng nhập (`session`) được máy chủ ký bảo mật và xác minh trực tiếp nên người dùng không thể tự ý làm giả `userId` bên trong.

### Nếu bạn đã viết code trong file `middleware.ts` (hoặc `proxy.ts` ở Next.js mới) để chặn người chưa đăng nhập, vì sao bên trong từng API endpoint và hàm `'use server'` vẫn nên tự gọi hàm kiểm tra đăng nhập?

`middleware.ts` / `proxy.ts` chỉ là vòng lọc ngoài dựa trên cấu hình khớp đường dẫn (`matcher`), rất dễ bị sót khi dự án thêm đường dẫn mới, đổi tên thư mục hoặc gọi trực tiếp Server Action. Kiểm tra ngay tại nơi truy cập dữ liệu giúp phòng thủ nhiều lớp và lấy được đúng `userId` của người đang gọi để lọc dữ liệu.

### Tại sao khi tự thiết kế bảng người dùng trong database, việc lưu mật khẩu nguyên văn (ví dụ lưu thẳng chuỗi `"MatKhau123"`) lại cực kỳ nguy hiểm?

Nếu database bị lộ, kẻ tấn công sẽ đọc được ngay mật khẩu thật của toàn bộ khách hàng và chiếm đoạt luôn cả email hay tài khoản ngân hàng dùng chung mật khẩu đó. Vì vậy, mật khẩu bắt buộc phải được băm một chiều (như `bcrypt`) hoặc giao cho dịch vụ xác thực chuyên nghiệp như Supabase Auth, Clerk quản lý.

## Kiểm tra không dùng AI

### Tình huống: Bạn có một hàm Server Action dùng để xóa dự án của người dùng như bên dưới. Hãy chỉ ra lỗ hổng bảo mật nghiêm trọng trong đoạn code này và nêu cách sửa lại cho đúng kèm lý do.

```ts
'use server'
import { db } from '@/lib/db'

export async function deleteProject(projectId: string, currentUserId: string) {
  if (!currentUserId) throw new Error('Chưa đăng nhập')
  await db.project.deleteMany({
    where: { id: projectId, ownerId: currentUserId }
  })
}
```

#### Đáp án

1. **Lỗ hổng:** `deleteProject` là một Server Action (`'use server'`), trình duyệt có thể gọi trực tiếp và truyền bất kỳ tham số nào vào. Nhận `currentUserId` từ tham số đầu vào cho phép kẻ xấu truyền `projectId` và `ownerId` của người khác để xóa sạch dự án của họ mà không cần đăng nhập vào tài khoản đó.
2. **Cách sửa và lý do:**
   - Bỏ tham số `currentUserId` khỏi đầu vào, chỉ nhận `projectId`.
   - Bên trong hàm, gọi trực tiếp hàm kiểm tra phiên đăng nhập trên máy chủ (như `const session = await auth()` hoặc `supabase.auth.getUser()`), nếu không có `user.id` thì báo lỗi từ chối.
   - Khi xóa trong database, dùng `ownerId: session.user.id` lấy từ phiên đăng nhập trên máy chủ. *Lý do:* Đảm bảo chỉ người đã đăng nhập thật sự và chính là chủ sở hữu mới xóa được dự án của mình.

## Lỗi suy luận hay gặp

### "Tôi đã ẩn nút Xóa và chuyển hướng trang bằng `router.push('/login')` khi chưa đăng nhập nên ứng dụng đã an toàn"

- **Vì sao sai:** Giao diện chạy trên trình duyệt của người dùng; kẻ xấu có thể sửa giao diện bằng F12 hoặc gửi yêu cầu trực tiếp vào `/api/...` mà không cần bấm nút trên màn hình.
- **Cách sửa:** Chỉ coi việc ẩn nút và chuyển hướng ở giao diện là để hỗ trợ trải nghiệm; mọi bước kiểm tra đăng nhập bắt buộc phải nằm ở code máy chủ (API route và Server Action).

### "Người dùng đã đăng nhập rồi thì tôi truyền `userId` từ `localStorage` hoặc giao diện lên API cho tiện, đỡ phải gọi `auth()` lại"

- **Vì sao sai:** Dù đã đăng nhập vào tài khoản A, người gọi vẫn có thể mở tab Network sửa `userId` gửi lên thành tài khoản B để xem trộm hoặc sửa dữ liệu của B.
- **Cách sửa:** Không bao giờ nhận `userId` của người thao tác từ trình duyệt gửi lên; máy chủ phải tự đọc `userId` từ phiên đăng nhập (`session`) trong mỗi lần gọi.

### "Dùng Supabase Auth trên máy chủ thì gọi `supabase.auth.getSession()` để kiểm tra đăng nhập là đủ chắc chắn"

- **Vì sao sai:** Trên máy chủ, `supabase.auth.getSession()` chỉ đọc dữ liệu từ cookie mà không xác minh lại chữ ký và trạng thái tài khoản với máy chủ Auth của Supabase, nên có nguy cơ bị qua mặt nếu cookie bị can thiệp.
- **Cách sửa:** Trên máy chủ, luôn dùng `await supabase.auth.getUser()` để Supabase xác minh lại tính hợp lệ của phiên đăng nhập trước khi truy cập dữ liệu nhạy cảm.
