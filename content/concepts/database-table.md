---
id: database-table
title: Cơ sở dữ liệu và bảng (Database & Table)
group: database
prerequisites: [server-code]
priority: 1
stage: 2
signals:
  - "schema.prisma"
  - "prisma."
  - "supabase.from("
  - "CREATE TABLE"
  - "DATABASE_URL"
---

## Giải thích đời thường

Cửa hàng nào cũng có sổ sách: một cuốn ghi **khách hàng**, một cuốn ghi **đơn hàng**, một cuốn ghi **sản phẩm**. Mỗi cuốn kẻ cột sẵn (tên, số điện thoại, ngày mua), mỗi dòng là một lần ghi. Trong sổ đơn hàng, bạn không chép lại địa chỉ khách mỗi lần; bạn chỉ ghi "mã khách KH015" để tra sang sổ khách hàng.

**Database (cơ sở dữ liệu)** là bộ sổ sách đó của ứng dụng, nằm trên máy chủ. Mỗi cuốn sổ là một **bảng (table)**; mỗi cột có kiểu dữ liệu cố định (chữ, số, ngày); mỗi dòng là một **bản ghi**. Mỗi dòng có một mã riêng (`id`) để bảng khác trỏ tới, giống "mã khách KH015".

Nghe giống Excel, nhưng khác ở chỗ: database bắt buộc đúng kiểu (ô số không nhận chữ), cho hàng nghìn người đọc ghi cùng lúc mà không giẫm lên nhau, và chỉ code máy chủ được đụng vào. Khi AI nói "thêm một cột" hay "tạo bảng mới", hãy hình dung đang kẻ thêm cột vào sổ hay mở thêm một cuốn sổ.

## Trong code trông như thế nào

AI hay dùng Prisma để mô tả bảng trong file `prisma/schema.prisma`:

```prisma
model Customer {
  id     String  @id @default(cuid())
  name   String
  phone  String  @unique
  orders Order[]
}

model Order {
  id         String   @id @default(cuid())
  total      Int      // tiền tính bằng đồng, dùng số nguyên
  createdAt  DateTime @default(now())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

Đọc và ghi bảng từ code máy chủ:

```ts
const order = await prisma.order.create({
  data: { total: 58000, customerId: 'kh_015' },
})
const recent = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
```

## Hay gặp lỗi gì

- **Tưởng biến trong code hay `localStorage` là database.** AI làm bản demo lưu đơn vào một mảng `const orders = []` hoặc vào trình duyệt. Cách nhận ra: khởi động lại server là mất hết, hoặc mỗi người dùng thấy một danh sách khác nhau.
- **Sửa `schema.prisma` mà chưa cập nhật database.** File mô tả đã có cột mới nhưng database thật thì chưa. Cách nhận ra: lỗi kiểu "The column ... does not exist". Cần cập nhật từng database bằng lệnh migrate: trên máy mình chạy `npx prisma migrate dev`; database bản thật chạy `npx prisma migrate deploy` (thường đặt trong bước build). Đừng chạy `migrate dev` vào database thật, vì lệnh này có thể đề nghị xóa sạch dữ liệu để làm lại từ đầu.
- **Lưu tiền bằng số thập phân.** Kiểu `Float` có thể làm tròn sai vài đồng khi cộng nhiều lần. Cách nhận ra: cột tiền khai báo `Float`; nên dùng `Int` (tính bằng đồng) hoặc `Decimal`.
- **Chép dữ liệu ra nhiều nơi.** Tên khách được lưu cả trong bảng `Order`, đổi tên ở bảng `Customer` thì đơn cũ vẫn tên cũ. Cách nhận ra: cùng một thông tin có ở hai bảng.

## Tự kiểm tra

### Dự án của bạn đang có những bảng nào? Tìm ở đâu?

Mở `prisma/schema.prisma` (mỗi `model` là một bảng), hoặc thư mục `supabase/migrations/` (tìm `create table`), hoặc trang quản trị của dịch vụ database bạn dùng.

### Trong bảng `Order` ở ví dụ, cột nào nối đơn hàng với khách hàng?

Cột `customerId`: nó lưu `id` của một dòng trong bảng `Customer`, giống ghi "mã khách KH015" trong sổ đơn hàng.
