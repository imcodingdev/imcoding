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
2. **Tìm nơi kiểm tra phiên ở máy chủ:** Tìm `await auth()`, `supabase.auth.getUser()`, `getClaims()` hoặc `currentUser()` trong `auth.ts`, `utils/supabase/server.ts`, `src/lib/` và nơi gọi. Ổn là xác minh danh tính và chặn khi thất bại; có vấn đề là chỉ thấy cookie hoặc đọc `getSession()` rồi tin ngay dữ liệu người dùng. `getClaims()` xác minh JWT; `getUser()` hỏi máy chủ Auth để lấy người dùng hiện tại, cần chọn theo yêu cầu kiểm tra của luồng.
3. **Rà API route và Server Action:** Mở `app/api/**/route.ts`, `src/app/api/**/route.ts` và file có `'use server'`. Với dữ liệu riêng, tìm kiểm tra quyền sở hữu/role sau bước xác thực. Ổn là truy vấn bị giới hạn theo quyền người gọi; có vấn đề là xác thực xong rồi đọc toàn bộ bảng riêng tư. Endpoint công khai cần được ghi rõ phạm vi dữ liệu được phép trả.
4. **Kiểm tra mật khẩu qua code, không xem dữ liệu thật:** Nếu tự quản lý mật khẩu, tìm `bcrypt.hash`, `argon2.hash` và nơi lưu kết quả. Có vấn đề là lưu thẳng mật khẩu hoặc ghi vào log. Nếu dùng Supabase Auth, không cần mở bảng mật khẩu hoặc sao chép hash để chứng minh đã có dịch vụ xác thực.
5. **Ghi lại kết quả của bạn:**
   - Dự án đang dùng thư viện đăng nhập nào?: `[ Tên thư viện: ... ]`
   - Có API route hay hàm `'use server'` nào lấy `userId` từ trình duyệt thay vì từ phiên đăng nhập không?: `[ Có / Không - tên file: ... ]`
   - Dự án có phụ thuộc duy nhất vào `middleware.ts` / `proxy.ts` mà bỏ trống kiểm tra trong API route không?: `[ Có / Không ]`

Tìm thêm `user_metadata`, `role`, `owner_id`, `CREATE POLICY` trong code và `supabase/migrations/`. Ổn là quyền đến từ nguồn do server quản lý và RLS phù hợp; có vấn đề là dùng metadata người dùng tự sửa để cấp quyền Admin. Ghi tên file, điều kiện từ chối và nguồn quyền; không chép cookie, access token, mật khẩu hoặc thông tin tài khoản thật.

## Tự giải thích

### Vì sao trong API endpoint hoặc hàm `'use server'`, ta bắt buộc phải lấy `userId` từ phiên đăng nhập trên máy chủ (`session.user.id` hoặc `supabase.auth.getUser()`) chứ không được nhận `userId` từ `req.json()`?

Mọi dữ liệu trong `req.json()`, URL hay biểu mẫu đều có thể bị người gọi sửa. Máy chủ phải xác minh phiên bằng cơ chế của thư viện: kiểm tra token đã ký hoặc tra mã phiên trong kho phiên, rồi mới tin danh tính. Không phải mọi session đều chứa thông tin người dùng dưới dạng token có chữ ký.

### Nếu bạn đã viết code trong file `middleware.ts` (hoặc `proxy.ts` ở Next.js mới) để chặn người chưa đăng nhập, vì sao bên trong từng API endpoint và hàm `'use server'` vẫn nên tự gọi hàm kiểm tra đăng nhập?

`middleware.ts` / `proxy.ts` chỉ là vòng lọc ngoài dựa trên cấu hình khớp đường dẫn (`matcher`), rất dễ bị sót khi dự án thêm đường dẫn mới, đổi tên thư mục hoặc gọi trực tiếp Server Action. Kiểm tra ngay tại nơi truy cập dữ liệu giúp phòng thủ nhiều lớp và lấy được đúng `userId` của người đang gọi để lọc dữ liệu.

### Tại sao khi tự thiết kế bảng người dùng trong database, việc lưu mật khẩu nguyên văn (ví dụ lưu thẳng chuỗi `"MatKhau123"`) lại cực kỳ nguy hiểm?

Nếu database bị lộ, kẻ tấn công sẽ đọc được ngay mật khẩu thật của toàn bộ khách hàng và chiếm đoạt luôn cả email hay tài khoản ngân hàng dùng chung mật khẩu đó. Vì vậy, mật khẩu bắt buộc phải được băm một chiều (như `bcrypt`) hoặc giao cho dịch vụ xác thực chuyên nghiệp như Supabase Auth, Clerk quản lý.

## Trắc nghiệm

### AI dùng metadata của Supabase để mở trang quản trị như dưới đây. Điểm cần rà là gì?

```ts
if (user.user_metadata.role === 'admin') {
  return readAdminReport()
}
```

- [ ] Đã có user thì mọi trường bên trong đều đáng tin để phân quyền
- [x] user_metadata có thể do người dùng sửa; quyền quản trị cần nguồn do server kiểm soát
- [ ] Đổi tên role thành secretRole sẽ ngăn người dùng thay đổi

**Giải thích:** Xác minh tài khoản không biến mọi thông tin hồ sơ thành quyền đáng tin. Phân quyền phải dựa trên dữ liệu được bảo vệ, như bảng quyền có kiểm soát ghi; đổi tên trường không tạo cơ chế bảo vệ.

### Supabase bật xác nhận email. Sau signUp không lỗi, kết quả có user nhưng session là null. AI cho vào màn hình riêng ngay; nên sửa suy luận nào?

- [x] Tạo tài khoản chưa đồng nghĩa có phiên; cần hoàn tất xác nhận và kiểm tra đăng nhập
- [ ] Có user là luôn có phiên hợp lệ dù session null
- [ ] Tắt xác nhận email là cách duy nhất xử lý trạng thái này

**Giải thích:** Đăng ký có thể thành công trong khi người dùng vẫn phải xác nhận email. Giao diện cần thông báo bước tiếp theo; không nên bỏ kiểm soát tài khoản chỉ để đi qua màn hình.

### AI lấy tham số next để chuyển hướng sau đăng nhập. Với URL này cần kiểm tra điều gì?

```text
/login?next=https://vi-du-khong-tin-cay.invalid
```

- [ ] Đăng nhập thành công thì mọi địa chỉ next đều an toàn
- [ ] Chỉ cần địa chỉ bắt đầu bằng https là được
- [x] Chỉ cho phép đích điều hướng đã được xác thực, thường là đường dẫn nội bộ hợp lệ

**Giải thích:** Tin URL do người gọi đưa vào có thể dẫn họ sang trang giả sau đăng nhập. HTTPS không chứng minh đích thuộc ứng dụng; việc kiểm tra URL cần chặt chẽ, không chỉ nhìn ký tự đầu.

### Hai tài khoản thử đều đăng nhập được. AI kết luận phân quyền đã đạt. Còn cần bằng chứng nào?

- [ ] Chỉ cần cả hai cùng thấy tên mình trên menu
- [x] Tài khoản chỉ đọc bị từ chối thao tác đặc quyền, dù nó có phiên hợp lệ
- [ ] Chỉ cần token của hai tài khoản có độ dài khác nhau

**Giải thích:** Kiểm tra đăng nhập mới chứng minh danh tính. Phải đối chiếu quyền với hành động cụ thể; nội dung menu hoặc độ dài token không chứng minh máy chủ chặn hành động vượt quyền.

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

## Bài tập thực hành

Lập bảng quyền cho một chức năng riêng tư bằng chứng từ code project. Không tạo tài khoản thật, không đổi quyền hoặc thử xóa dữ liệu.

### Việc cần làm

1. Chọn một API hoặc Server Action đọc dữ liệu riêng, ghi đường dẫn file và nhiệm vụ của nó. Không chọn luồng gửi email, thanh toán hoặc xóa dữ liệu để chạy thử.
2. Theo hàm xác thực được gọi ở server; ghi điều kiện từ chối, không ghi giá trị cookie/token. Nếu chỉ có kiểm tra ở giao diện, đánh dấu chưa thấy bảo vệ server.
3. Ghi nguồn quyền và điều kiện giới hạn truy vấn: chủ sở hữu, thành viên nhóm hoặc role. Với Supabase, đọc policy trong migration nếu có, không vào dashboard lấy dữ liệu thật.
4. Lập ba dòng giả định: chưa đăng nhập, đúng chủ sở hữu, người khác đã đăng nhập. Ghi kết quả mong đợi và đoạn code bảo đảm từng kết quả; thiếu đoạn bảo vệ thì ghi chưa chứng minh, không tự thử trên production.

### Kết quả đúng

Có bảng tình huống → quyền mong đợi → bằng chứng server/RLS, phân biệt xác thực với phân quyền. Đây là rà soát tĩnh một luồng, không thay thế kiểm thử runtime hoặc chứng nhận toàn bộ ứng dụng an toàn.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không gọi API, tạo tài khoản hay chạy lệnh. Rà bảng quyền và đoạn code đã che bí mật tôi gửi: mỗi kết luận được bảo đảm ở đâu trên server/RLS? Phân biệt danh tính với quyền, đánh dấu thiếu bằng chứng; không tự mở thêm file hoặc yêu cầu token thật.
```
