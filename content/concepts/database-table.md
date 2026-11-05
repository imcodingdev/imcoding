---
id: database-table
title: Cơ sở dữ liệu và bảng (Database & Table)
group: database
prerequisites: [server-code]
priority: 1
stage: 2
format: 2
signals:
  - "schema.prisma"
  - "prisma."
  - "supabase.from("
  - "CREATE TABLE"
  - "DATABASE_URL"
---

## Nhắc lại

### Vì sao các đoạn code xử lý nghiệp vụ nhạy cảm hoặc kết nối trực tiếp tới nơi lưu trữ dữ liệu bắt buộc phải nằm trong code máy chủ (Server Code)?

Vì code máy chủ chạy trên máy tính của nhà cung cấp đám mây (như Vercel), người dùng không thể mở trình duyệt xem trộm mã nguồn, sửa logic tính tiền hay lấy cắp chuỗi kết nối cơ sở dữ liệu.

### Làm sao phân biệt nhanh một file trong Next.js App Router đang chạy ở trình duyệt hay chạy trên máy chủ?

Mặc định các file trong thư mục `app/` (`page.tsx`, `layout.tsx`, `route.ts`) chạy trên máy chủ. Nếu đầu file có dòng `'use client'` thì component đó được gửi xuống chạy trên trình duyệt.

## Đoán trước

Bạn nhờ AI làm tính năng đặt hàng cho tiệm bánh. Lúc chạy thử trên máy cá nhân, bạn đặt 3 đơn hàng, bấm tải lại trang (F5) vẫn thấy đủ 3 đơn. Bạn đẩy ứng dụng lên Vercel và chạy quảng cáo. Tối đó có 20 khách báo đã đặt bánh thành công, nhưng khi mở trang quản trị thì chỉ thấy trống trơn, còn hôm sau hệ thống khởi động lại thì toàn bộ đơn hàng biến mất. Kiểm tra code máy chủ, bạn thấy AI viết `const orders: Order[] = []` ở đầu file `route.ts` rồi dùng `orders.push(newOrder)` để lưu đơn. Tại sao lúc thử trên máy bạn đơn hàng vẫn còn sau khi F5, nhưng lên thực tế lại mất sạch?

### Đáp án

Biến `const orders = []` chỉ nằm trong **bộ nhớ tạm (RAM)** của máy chủ chứ không phải **Database (cơ sở dữ liệu)**. Khi bấm F5 trên trình duyệt, chỉ trang web tải lại còn tiến trình máy chủ trên máy cá nhân vẫn chạy liên tục, nên biến `orders` chưa bị xóa. Nhưng khi tắt máy chủ, triển khai bản mới, hoặc chạy trên môi trường Serverless của Vercel (nơi các hàm máy chủ bật tắt liên tục và mỗi khách có thể chạm vào một máy chủ tạm khác nhau), mọi dữ liệu lưu trong RAM sẽ bay hơi hoàn toàn. Muốn lưu trữ bền vững và dùng chung cho mọi người, dữ liệu bắt buộc phải ghi vào cơ sở dữ liệu.

## Ví dụ mẫu

Cửa hàng nào cũng có sổ sách: sổ **khách hàng**, sổ **đơn hàng**, sổ **sản phẩm**. Mỗi cuốn kẻ cột sẵn (tên, số điện thoại, ngày mua), mỗi dòng là một lần ghi. Trong sổ đơn hàng, bạn không chép lại tên và địa chỉ khách mỗi lần mà chỉ ghi "mã khách KH015" để tra sang sổ khách hàng.

**Database (cơ sở dữ liệu)** là bộ sổ sách đó của ứng dụng, nằm trên máy chủ riêng (như Supabase, Neon). Mỗi cuốn sổ là một **bảng (table)**; mỗi cột có kiểu dữ liệu cố định (chữ, số nguyên, ngày giờ); mỗi dòng là một **bản ghi (record)** có mã định danh duy nhất (`id`) để bảng khác trỏ tới. Khác với Excel, database ép buộc đúng kiểu dữ liệu (ô số không nhận chữ), cho phép hàng nghìn người đọc ghi cùng lúc không giẫm lên nhau, và chỉ code máy chủ hoặc quy tắc phân quyền mới được truy cập.

Cách làm SAI (lưu tiền bằng số thập phân dễ sai số, chép lặp thông tin khách):

```prisma
// SAI: Trong prisma/schema.prisma
model Order {
  id            String @id @default(cuid())
  total         Float  // SAI: Float làm tròn sai tiền khi cộng nhiều lần
  customerName  String // SAI: Chép lặp tên khách, khách đổi tên sẽ lệch dữ liệu
  customerPhone String
}
```

Cách làm ĐÚNG (khai báo bảng trong `prisma/schema.prisma` và nối bảng qua khóa ngoại):

```prisma
model Customer {
  id     String  @id @default(cuid())
  name   String
  phone  String  @unique
  orders Order[]
}
model Order {
  id         String   @id @default(cuid())
  total      Int      // ĐÚNG: Tiền VNĐ tính bằng đồng, dùng số nguyên (Int)
  createdAt  DateTime @default(now())
  customerId String   // Lưu mã id của khách hàng (giống mã KH015)
  customer   Customer @relation(fields: [___], references: [id])
}
```

## Tìm trong project của bạn

1. **Xác định công cụ database:**
   - Tìm `prisma/schema.prisma`: Nếu có, dự án dùng Prisma quản lý bảng (mỗi khối `model TênBảng { ... }` là một bảng).
   - Tìm `supabase/migrations/` hoặc `supabase.from(`: Nếu có, dự án đang đọc/ghi bảng trên Supabase.
2. **Kiểm tra chuỗi kết nối:** Mở `.env` hoặc `.env.local`, tìm biến `DATABASE_URL` hoặc `NEXT_PUBLIC_SUPABASE_URL` để biết ứng dụng đang nối tới đâu (tuyệt đối không lộ mật khẩu trong `DATABASE_URL`).
3. **Truy tìm dữ liệu lưu tạm:** Tìm trong thư mục `app/` các từ khóa `localStorage.setItem`, `sessionStorage`, hoặc biến mảng khai báo ngoài hàm như `let items = [`, `const mockData = [`.
4. **Kiểm tra kiểu dữ liệu tiền tệ và liên kết bảng:** Xem các cột giá tiền (`price`, `total`, `amount`) đang dùng `Int` / `Decimal` hay bị dùng `Float`. Xem các bảng liên quan (`User` và `Post`, `Customer` và `Order`) đã nối với nhau bằng cột `...Id` chưa.
5. **Ghi lại kết quả:**
   - Dự án đang có những bảng nào?: `[ Liệt kê tên bảng: ... ]`
   - Có tính năng nào đang lưu tạm vào biến mảng hoặc `localStorage` không?: `[ Có / Không - tên file: ... ]`
   - Cột nối giữa hai bảng chính tên là gì?: `[ Tên cột khóa ngoại: ... ]`

## Tự giải thích

### Vì sao sau khi bạn bảo AI thêm một cột mới vào file `prisma/schema.prisma`, khi chạy ứng dụng lại bị báo lỗi `"The column ... does not exist in the current database"`?

Vì `schema.prisma` mới chỉ là **bản vẽ thiết kế** trong code, còn cơ sở dữ liệu thật chưa tự kẻ thêm cột đó. Bạn phải chạy lệnh cập nhật (migrate): ở máy cá nhân chạy `npx prisma migrate dev`, còn với database thật (production) phải chạy `npx prisma migrate deploy`. Tuyệt đối không chạy `migrate dev` trực tiếp vào database thật vì lệnh này có thể xóa sạch dữ liệu cũ để tạo lại bảng.

### Tại sao trong bảng `Order` (Đơn hàng), người ta chỉ lưu cột `customerId` chứ không lưu luôn `customerName` và `customerPhone` vào từng đơn?

Vì nếu một khách mua 50 đơn rồi đổi số điện thoại hoặc sửa tên, việc chỉ lưu `customerId` giúp bạn chỉ cần cập nhật 1 dòng trong bảng `Customer` là mọi đơn hàng đều tra ra thông tin mới nhất. Nếu chép lặp tên và số điện thoại vào từng đơn, dữ liệu sẽ lệch nhau giữa đơn cũ và đơn mới.

### Vì sao khi lưu số tiền (như giá sản phẩm, số dư ví), ta nên dùng kiểu số nguyên `Int` (hoặc `Decimal`) thay vì số thực dấu phẩy động `Float`?

Trong máy tính, kiểu `Float` biểu diễn số thập phân theo hệ nhị phân nên hay bị sai số lẻ (ví dụ `0.1 + 0.2` thành `0.30000000000000004`). Khi cộng hàng nghìn giao dịch, sai số này tích tụ làm lệch sổ sách. Với tiền VNĐ, dùng số nguyên `Int` (như `58000`) là chính xác tuyệt đối; với ngoại tệ có xu/cent, ta đổi ra đơn vị nhỏ nhất dạng `Int` hoặc dùng kiểu `Decimal`.

## Kiểm tra không dùng AI

### Tình huống: Bạn đang chạy ứng dụng thật trên Vercel kết nối với database Supabase chứa 500 khách hàng đang trả phí. Hôm nay bạn thêm tính năng lưu ngày sinh của khách nên sửa `schema.prisma` thêm cột `birthDate DateTime?`. Khi bạn gõ lệnh ở Terminal máy cá nhân (đang trỏ nhầm `DATABASE_URL` vào database thật), công cụ hiện cảnh báo: `"We need to reset the PostgreSQL database... Do you want to continue? All data will be lost."` Bạn phải làm gì ngay lúc đó và quy trình đúng để thêm cột cho database thật là gì?

#### Đáp án

1. **Hành động ngay lập tức:** Bấm **No (`n` hoặc `Ctrl+C`)** để hủy lệnh ngay. Nếu bấm Yes, toàn bộ 500 khách hàng thật sẽ bị xóa trắng.
2. **Nguyên nhân:** Bạn đang trỏ nhầm `DATABASE_URL` của database thật ở máy cá nhân và chạy `npx prisma migrate dev` (hoặc `db push --force-reset`).
3. **Quy trình sửa đúng:**
   - Bước 1: Đổi `DATABASE_URL` trong `.env.local` ở máy cá nhân về database thử nghiệm (local hoặc nhánh dev riêng).
   - Bước 2: Chạy `npx prisma migrate dev --name add_birth_date` trên database thử nghiệm để sinh file SQL trong `prisma/migrations/`.
   - Bước 3: Kiểm tra file SQL vừa tạo chỉ chứa `ALTER TABLE ... ADD COLUMN` (không có `DROP`), rồi commit lên Git và dùng `npx prisma migrate deploy` để áp dụng lên database thật mà không mất dữ liệu.

## Lỗi suy luận hay gặp

### "Lưu vào `localStorage` của trình duyệt cũng là có cơ sở dữ liệu rồi, đỡ phải cài đặt Supabase hay Prisma"

- **Vì sao sai:** `localStorage` chỉ nằm riêng trên trình duyệt từng thiết bị. Khách đăng nhập bằng điện thoại sẽ không thấy dữ liệu nhập trên máy tính, xóa lịch sử duyệt web là mất sạch, và chủ ứng dụng cũng không thấy được dữ liệu của khách.
- **Cách sửa:** Chỉ dùng `localStorage` cho tùy chỉnh giao diện nhỏ (như chế độ sáng/tối). Mọi dữ liệu nghiệp vụ (tài khoản, đơn hàng, bài viết) bắt buộc lưu vào database trên máy chủ.

### "Sửa xong file `schema.prisma` là database đã tự có bảng mới và cột mới"

- **Vì sao sai:** File `schema.prisma` chỉ là văn bản mô tả cấu trúc trong code. Cơ sở dữ liệu nằm ở máy chủ riêng và không tự đổi cấu trúc nếu chưa chạy lệnh đồng bộ (migration).
- **Cách sửa:** Mỗi khi sửa `schema.prisma`, luôn chạy `npx prisma migrate dev` ở môi trường phát triển để tạo lịch sử thay đổi và chạy `npx prisma migrate deploy` khi đưa lên môi trường thật.

### "Gom hết mọi thông tin (khách hàng, sản phẩm, đơn hàng, thanh toán) vào chung một bảng khổng lồ cho dễ lấy"

- **Vì sao sai:** Nếu gộp chung một bảng, khi khách mua 10 món hàng bạn phải lặp lại tên, email, mật khẩu 10 lần; còn sản phẩm chưa ai mua thì không biết lưu vào đâu nếu chưa có đơn hàng.
- **Cách sửa:** Tách mỗi loại đối tượng (Khách hàng, Sản phẩm, Đơn hàng) thành một bảng riêng có `id` riêng và liên kết bằng cột khóa ngoại (`customerId`, `productId`).
