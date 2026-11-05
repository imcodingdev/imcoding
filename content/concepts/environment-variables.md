---
id: environment-variables
title: Biến môi trường (Environment Variables)
group: backend
prerequisites: [server-code]
priority: 1
stage: 1
format: 2
signals:
  - "process.env."
  - ".env.local"
  - ".env.example"
  - "NEXT_PUBLIC_"
---

## Nhắc lại

### Làm sao phân biệt nhanh một file trong Next.js App Router chạy trên máy chủ (server) hay trình duyệt (client)?

Kiểm tra dòng đầu tiên: nếu có `'use client'` thì code chạy trên trình duyệt của người dùng; nếu không có (hoặc là file `route.ts` trong `app/api/`), mặc định nó chạy trên máy chủ.

### Vì sao không được đặt logic kiểm tra quyền hoặc thông tin nhạy cảm ở code chạy trên trình duyệt?

Vì code gửi xuống trình duyệt nằm trong máy người dùng. Ai cũng có thể mở công cụ Inspect (F12) để đọc mã nguồn hoặc sửa dữ liệu trước khi gửi đi.

## Đoán trước

Bạn nhờ AI tích hợp thanh toán vào ứng dụng Next.js. Trên máy cá nhân, mọi thứ chạy trơn tru vì AI đã tạo file `.env.local` chứa `DATABASE_URL` và khóa `STRIPE_SECRET_KEY`. Bạn đẩy code lên GitHub để Vercel tự động cập nhật web thật. Nhưng khi khách bấm thanh toán trên web thật, hệ thống báo lỗi sập máy chủ `Error: Thiếu STRIPE_SECRET_KEY`, dù trên máy bạn vẫn chạy bình thường. Chuyện gì đã xảy ra?

### Đáp án

File `.env.local` chỉ nằm trên máy cá nhân và bị Git chặn lại (không đẩy lên mạng để bảo mật). Máy chủ Vercel không hề có file `.env.local` này. Vì bạn chưa vào mục **Settings → Environment Variables** trên Vercel để nhập `STRIPE_SECRET_KEY` và `DATABASE_URL`, nên khi code gọi `process.env.STRIPE_SECRET_KEY`, giá trị nhận được là `undefined` (không tồn tại) và gây lỗi.

## Ví dụ mẫu

Hãy tưởng tượng hai chi nhánh quán cà phê dùng chung một **cuốn sổ quy trình**, nhưng mỗi nơi có mật khẩu wifi và số tài khoản nhận tiền riêng dán trong phòng quản lý. Sổ quy trình không in cứng số tài khoản mà chỉ ghi: *"Tra tờ giấy trong phòng quản lý"*.

**Biến môi trường (Environment Variables)** chính là tờ giấy riêng đó. Code chỉ gọi tên biến qua `process.env.TEN_BIEN`, còn giá trị thật nằm ngoài code. Nhờ vậy, máy cá nhân dùng được database thử nghiệm, còn Vercel dùng database thật (tránh tai nạn như vụ Replit năm 2025, khi AI agent thao tác nhầm xóa mất database thật).

Trong Next.js, biến bắt đầu bằng `NEXT_PUBLIC_` sẽ được chép thẳng giá trị vào gói code gửi xuống trình duyệt lúc đóng gói (build). Do đó, chỉ dùng `NEXT_PUBLIC_` cho thông tin công khai.

File `.env.local` ở thư mục gốc (không đưa lên Git):

```bash
# Chỉ code máy chủ đọc được 2 biến này
DATABASE_URL="postgresql://user:pass_gia_123@localhost:5432/shop_test"
OPENAI_API_KEY="sk-proj-XXXX-khoa-gia-khong-dung-duoc"

# Có tiền tố NEXT_PUBLIC_ nên trình duyệt đọc được
NEXT_PUBLIC_SITE_NAME="Tiệm Cà Phê"
```

Trong file code (ví dụ `app/api/order/route.ts`):

```ts
// Trên máy chủ: đọc được mọi biến trong .env.local hoặc trên Vercel
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('Thiếu cấu hình OPENAI_API_KEY')

// Máy chủ hay trình duyệt đều đọc được vì có tiền tố ___
// (Điền vào chỗ trống: tại sao biến này hiển thị được trên giao diện khách hàng?)
const siteName = process.env.NEXT_PUBLIC_SITE_NAME
```


## Tìm trong project của bạn

Mở công cụ tìm kiếm toàn dự án (`Ctrl+Shift+F` hoặc `Cmd+Shift+F`) và thực hiện:

1. **Kiểm tra file môi trường ở thư mục gốc:** Xem dự án có `.env`, `.env.local`, `.env.example` và `.gitignore` không. Mở `.gitignore` xem đã có dòng `.env*` để chặn đẩy file cấu hình lên Git chưa.
2. **Tìm nơi đọc biến môi trường:** Tìm từ khóa `process.env.` toàn dự án.
3. **Kiểm tra biến công khai:** Tìm từ khóa `NEXT_PUBLIC_` để xem biến nào đang gửi xuống trình duyệt.
4. **Ghi lại kết quả:**
   - Tổng số tên biến `process.env.` khác nhau đang dùng: `[ ... ]`
   - Các biến có tiền tố `NEXT_PUBLIC_`: `[ ... ]` (Có biến nào chứa chữ `SECRET`, `KEY`, `PASSWORD` không?: `[ Có / Không ]`)
   - Biến có trong code nhưng chưa có tên mẫu trong `.env.example`: `[ ... ]`

## Tự giải thích

### Vì sao trong `.gitignore` cần dòng `.env*`, nhưng lại nên thêm `!.env.example` ngay bên dưới?

Dòng `.env*` chặn mọi file chứa giá trị nhạy cảm (`.env`, `.env.local`) không bị đẩy lên GitHub. Còn `.env.example` chỉ lưu danh sách tên biến để trống giá trị (như `OPENAI_API_KEY=`) giúp người khác biết dự án cần những biến nào, nên dùng `!.env.example` để cho phép đưa riêng file mẫu này lên Git.

### Chuyện gì xảy ra nếu đọc biến KHÔNG có tiền tố `NEXT_PUBLIC_` (như `process.env.OPENAI_API_KEY`) trong component `'use client'`?

Trên trình duyệt, biến đó sẽ có giá trị `undefined` chứ Next.js không tự làm lộ khóa, khiến tính năng bị hỏng. Sai lầm nguy hiểm nhất là nghe AI đổi tên thành `NEXT_PUBLIC_OPENAI_API_KEY` để code chạy được, vì làm vậy là phơi bày khóa bí mật ra trình duyệt của mọi người dùng.

### Vì sao khi sửa giá trị biến `NEXT_PUBLIC_...` trong Settings của Vercel, trang web đang chạy vẫn hiện giá trị cũ?

Vì biến `NEXT_PUBLIC_` được chép cứng giá trị vào file JavaScript ngay lúc đóng gói (build). Sau khi sửa trong Settings, bạn phải bấm **Redeploy** trên Vercel để đóng gói lại thì giá trị mới mới được cập nhật.

## Kiểm tra không dùng AI

### Tình huống: AI viết một component `'use client'` gọi bản đồ và đặt trong `.env.local` hai biến: `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (khóa công khai giới hạn theo tên miền) và `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (khóa quyền quản trị tối cao của database). Cấu hình này có rủi ro gì và phải sửa thế nào?

#### Đáp án

- **Rủi ro:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` có tiền tố `NEXT_PUBLIC_` nên khóa quản trị tối cao của Supabase bị chép thẳng xuống trình duyệt. Ai mở Inspect cũng lấy được khóa này để xóa hoặc đánh cắp toàn bộ database. (Còn `NEXT_PUBLIC_GOOGLE_MAPS_KEY` dùng cho trình duyệt và đã giới hạn tên miền thì hợp lệ).
- **Cách xử lý:**
  1. Vào Supabase **thu hồi / đổi khóa** `service_role` mới ngay (khóa cũ coi như đã lộ).
  2. Bỏ `NEXT_PUBLIC_`, đổi tên thành `SUPABASE_SERVICE_ROLE_KEY`.
  3. Chuyển code dùng khóa này sang chạy trên máy chủ (Server Action hoặc `app/api/...`), không gọi trực tiếp từ `'use client'`.

## Lỗi suy luận hay gặp

### "Biến môi trường nào cũng là bí mật và an toàn tuyệt đối"

- **Vì sao sai:** Biến môi trường chỉ tách cấu hình khỏi code, không đồng nghĩa luôn được giấu kín. Nếu gắn `NEXT_PUBLIC_`, Next.js sẽ nhúng thẳng giá trị thật vào gói code tải xuống trình duyệt.
- **Cách sửa:** Mọi thông tin nhạy cảm (mật khẩu, secret key, quyền admin) tuyệt đối không gắn `NEXT_PUBLIC_` và chỉ đọc ở code máy chủ.

### "Sửa file `.env.local` trên máy xong rồi `git push` là web trên Vercel tự nhận cấu hình mới"

- **Vì sao sai:** `.env.local` bị `.gitignore` chặn nên `git push` chỉ đẩy code chứ không đẩy biến môi trường. Máy chủ Vercel không biết bạn vừa thêm hay sửa biến gì ở máy cá nhân.
- **Cách sửa:** Khi thêm hoặc đổi biến trong `.env.local`, hãy cập nhật tên biến vào `.env.example`, đồng thời vào Vercel → **Settings → Environment Variables** nhập giá trị tương ứng rồi Redeploy.

### "Biến ra `undefined` ở giao diện nghĩa là bị lỗi đọc file, cứ thêm `NEXT_PUBLIC_` vào là sửa được"

- **Vì sao sai:** Next.js cố tình trả về `undefined` trên trình duyệt cho các biến thường để bảo vệ cấu hình máy chủ. Thêm `NEXT_PUBLIC_` chỉ để hết lỗi `undefined` sẽ làm lộ dữ liệu mật.
- **Cách sửa:** Khi biến trả về `undefined` trong file `'use client'`, nếu đó là thông tin nhạy cảm, phải chuyển đoạn xử lý về file chạy trên máy chủ (như `route.ts`), rồi giao diện chỉ gọi kết quả về.
