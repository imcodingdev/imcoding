---
id: routing
title: Định tuyến trang (Routing)
group: frontend
prerequisites: [component]
priority: 1
stage: 2
format: 2
signals:
  - "app/**/page.tsx"
  - "[id]"
  - "next/link"
  - "next/navigation"
  - "useRouter"
---

## Nhắc lại

### Component và `props` trong React dùng để giải quyết vấn đề gì khi làm giao diện?

**Component** là một mẫu giao diện chuẩn có thể tái sử dụng ở nhiều nơi (sửa một lần là mọi nơi đổi theo), còn **props** là các thông tin đầu vào truyền riêng cho mỗi lần hiển thị mẫu đó (như tên sản phẩm, giá tiền).

### Khi dùng `.map()` để hiển thị một danh sách nhiều component giống nhau, vì sao bắt buộc phải truyền thuộc tính `key={item.id}`?

Vì `key` là mã định danh duy nhất giúp React phân biệt từng phần tử trong danh sách; nếu thiếu `key` hoặc dùng số thứ tự tạm, giao diện dễ bị giữ nhầm dữ liệu khi thêm, xóa hoặc đảo vị trí các mục.

## Đoán trước

Bạn vừa nhờ AI làm trang chi tiết đơn hàng để khách xem theo đường dẫn `/don-hang/1024`, `/don-hang/1025`... AI tạo đúng thư mục `app/don-hang/[id]/page.tsx`. Nhưng khi bạn mở trình duyệt vào địa chỉ `/don-hang/1024`, màn hình lại hiện dòng chữ `"Đơn hàng #undefined"` và báo không tìm thấy đơn hàng trong cơ sở dữ liệu, dù trên thanh địa chỉ rõ ràng có số `1024`. Tại sao trang web đã mở đúng file giao diện nhưng con số `1024` lại biến mất thành `undefined`?

### Đáp án

Trong các phiên bản Next.js App Router hiện tại (từ Next.js 15 trở đi), thông tin đường dẫn động `params` được truyền vào trang dưới dạng bất đồng bộ (**Promise**), tức là phải chờ giải nén bằng từ khóa `await params` thì mới lấy được giá trị `id`. Do dữ liệu huấn luyện của AI có nhiều code từ thời Next.js cũ, AI rất hay viết thẳng `params.id` mà quên `await`. Kết quả là `params.id` trả về `undefined`, khiến câu lệnh tìm đơn hàng trong database bị hỏng dù đường dẫn URL hoàn toàn đúng.

## Ví dụ mẫu

Vào siêu thị, bạn nhìn biển chỉ dẫn: *"Gian 1: Đồ uống"*, *"Gian 2: Bánh kẹo"*. Mỗi biển dẫn tới đúng một gian hàng. **Routing (Định tuyến trang)** là hệ thống biển chỉ dẫn của ứng dụng web: khi người dùng gõ hoặc bấm vào một địa chỉ (URL) như `/san-pham`, ứng dụng biết phải mở component trang nào lên.

Trong Next.js App Router, **cấu trúc thư mục bên trong `app/` chính là bản đồ đường dẫn**: thư mục `app/san-pham/` có file `page.tsx` thì địa chỉ `/san-pham` tồn tại. Những đường dẫn thay đổi theo mã số (như `/don-hang/1`, `/don-hang/2`) được gom chung vào một thư mục đặt tên trong ngoặc vuông `[id]`.

Cách làm SAI (nhầm giữa kiểu định tuyến cũ và mới, quên `await params`, và dùng thẻ `<a>` làm tải lại cả trang):

```tsx
// SAI: Lấy useRouter từ 'next/router' (kiểu Pages Router cũ, gây sập trang trong app/)
import { useRouter } from 'next/router'

export default function OrderPage({ params }: { params: { id: string } }) {
  // SAI: Đọc thẳng params.id mà không await sẽ ra undefined trên Next.js mới
  return (
    <main>
      <h1>Đơn hàng #{params.id}</h1>
      <a href="/san-pham">Quay lại mua sắm</a>
    </main>
  )
}
```

Cách làm ĐÚNG trong file `app/don-hang/[id]/page.tsx`:

```tsx
import Link from 'next/link'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ĐÚNG: Phải ___ biến params trước khi lấy id trong Next.js App Router hiện tại
  const { id } = await params
  return (
    <main className="p-4">
      <h1>Đơn hàng #{id}</h1>
      <Link href="/san-pham">Quay lại mua sắm</Link>
    </main>
  )
}
```

## Tìm trong project của bạn

Hãy lập bản đồ các trang và kiểm tra lỗi định tuyến trong dự án của bạn:

1. **Lập danh sách các trang web hiện có:** Mở thư mục `app/` và tìm tất cả các file có tên chính xác là `page.tsx`. Nhìn đường dẫn thư mục chứa nó để suy ra URL (lưu ý: thư mục bọc trong ngoặc tròn như `(marketing)` chỉ để gom nhóm, không xuất hiện trên URL; thư mục `app/api/.../route.ts` là đường dẫn API máy chủ, không phải trang giao diện).
2. **Kiểm tra lỗi `params` chưa `await`:** Bấm `Ctrl+Shift+F` / `Cmd+Shift+F`, tìm các thư mục có dấu ngoặc vuông `[` hoặc tìm chuỗi `params.` trong thư mục `app/`. Xem có file `page.tsx` nào đọc thẳng `params.id` hay `params.slug` mà thiếu `await params` không.
3. **Kiểm tra lỗi trộn lẫn bộ định tuyến cũ (`next/router`):** Tìm chuỗi `next/router` trong toàn dự án. Trong dự án dùng thư mục `app/`, mọi chỗ điều hướng phải lấy từ `next/navigation` chứ không bao giờ là `next/router`.
4. **Kiểm tra chuyển trang nội bộ bằng thẻ `<a>`:** Tìm chuỗi `<a href="/` trong các file `.tsx`. Xem có chỗ nào chuyển giữa các trang trong cùng web mà dùng `<a href="...">` thay vì `<Link href="...">` của `next/link` không.
5. **Ghi lại kết quả của bạn:**
   - Dự án của bạn đang có bao nhiêu file `page.tsx` (trang) và bao nhiêu thư mục động `[...]`?: `[ Số trang: ... / Thư mục động: ... ]`
   - Có file nào dùng `params.` trực tiếp mà thiếu `await` hoặc gọi nhầm `next/router` không?: `[ Có / Không - tên file: ... ]`
   - Có đường dẫn nội bộ nào đang dùng thẻ `<a href="/...">` thay vì `<Link>` không?: `[ Có / Không ]`

## Tự giải thích

### Khi người dùng báo lỗi giao diện ở địa chỉ `https://ten-web.com/khoa-hoc/nhap-mon-ai`, làm sao bạn biết ngay cần mở file nào trong dự án để bảo AI sửa mà không cần hỏi AI trước?

Vì Next.js App Router ánh xạ trực tiếp URL vào thư mục `app/`. Nhìn vào `/khoa-hoc/nhap-mon-ai`, bạn mở thư mục `app/khoa-hoc/`: nếu có thư mục con `nhap-mon-ai/page.tsx` thì mở file đó; nếu thấy thư mục ngoặc vuông như `app/khoa-hoc/[slug]/page.tsx` thì đó là file khuôn mẫu phục vụ mọi khóa học, nơi chuỗi `'nhap-mon-ai'` được truyền qua `params`.

### Vì sao khi tạo thêm thư mục `app/gioi-thieu/` và bỏ vào đó một file tên là `About.tsx` hoặc `index.tsx`, mở địa chỉ `/gioi-thieu` trên trình duyệt vẫn bị báo lỗi `404 This page could not be found`?

Vì trong thư mục `app/` của Next.js, tên file quy định vai trò cố định. Một thư mục chỉ biến thành đường dẫn trang web truy cập được khi bên trong nó có file đặt tên chính xác là `page.tsx` (hoặc `page.js`). Đặt tên khác như `About.tsx` hay `index.tsx` thì Next.js coi đó là file phụ trợ bình thường và không mở đường dẫn `/gioi-thieu`.

### Khác biệt thực tế giữa việc bấm vào `<a href="/san-pham">` và `<Link href="/san-pham">` khi di chuyển giữa các trang trong cùng ứng dụng Next.js là gì?

Thẻ `<a>` thuần của HTML buộc trình duyệt xóa trắng màn hình, tải lại toàn bộ khung trang web và các file JavaScript từ đầu như mới vào web lần đầu, làm tốc độ chậm và mất trạng thái đang mở. Ngược lại, component `<Link>` của `next/link` chỉ tải nhẹ đúng phần nội dung của trang `/san-pham` và thay thế mượt mà ngay tức thì mà không làm chớp trắng màn hình.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ AI thêm nút `"Thanh toán xong -> Chuyển sang trang Cảm ơn"` cho giỏ hàng. AI viết trong một Client Component dòng lệnh `import { useRouter } from 'next/router'` rồi gọi `router.push('/cam-on')`, và tạo trang cảm ơn tại file `app/cam-on/thankyou.tsx`. Khi chạy thử, vừa mở giỏ hàng đã sập với lỗi `"NextRouter was not mounted"`, và gõ thẳng `/cam-on` trên trình duyệt cũng báo lỗi 404. Hãy chỉ ra cả 2 lỗi sai của AI và cách sửa từng lỗi.

#### Đáp án

1. **Lỗi 1 (`NextRouter was not mounted`):** AI đã dùng nhầm gói `next/router` của hệ thống định tuyến cũ (Pages Router) bên trong dự án dùng App Router (`app/`).
   - *Cách sửa:* Đổi dòng import thành `import { useRouter } from 'next/navigation'` (và đảm bảo file có `'use client'` ở dòng đầu tiên).
2. **Lỗi 2 (Vào `/cam-on` bị lỗi 404):** AI đặt sai tên file trang đích là `thankyou.tsx` nên Next.js không nhận diện được đây là một trang web.
   - *Cách sửa:* Đổi tên file `app/cam-on/thankyou.tsx` thành đúng tên chuẩn `app/cam-on/page.tsx`.

## Lỗi suy luận hay gặp

### "Cứ tạo thư mục mới trong `app/` hoặc thêm file `.tsx` bất kỳ vào `app/` là tự khắc có trang web mới"

- **Vì sao sai:** Trong App Router, thư mục chỉ định nghĩa các nhánh của đường dẫn (URL segment), còn trang web chỉ thực sự được kích hoạt khi có mặt file tên chuẩn `page.tsx` bên trong thư mục đó (hoặc `route.ts` nếu là API).
- **Cách sửa:** Khi thấy lỗi 404 ở đường dẫn mới tạo, hãy kiểm tra ngay xem file trong thư mục đó đã đặt tên đúng là `page.tsx` (viết thường toàn bộ) và có `export default function` chưa.

### "Thư mục nào nằm trong `app/` cũng đều biến thành một phần của đường dẫn URL"

- **Vì sao sai:** Next.js có hai quy ước đặt tên thư mục đặc biệt không xuất hiện trên URL: thư mục bọc trong ngoặc tròn như `app/(auth)/dang-nhap/page.tsx` chỉ dùng để gom nhóm file cho gọn, URL thật chỉ là `/dang-nhap`; còn thư mục bắt đầu bằng dấu gạch dưới như `_components` được ẩn hoàn toàn khỏi hệ thống định tuyến.
- **Cách sửa:** Khi đọc cây thư mục để tìm URL, hãy bỏ qua các thư mục nằm trong dấu ngoặc tròn `(...)`.

### "Đoạn code điều hướng của AI lấy từ tài liệu Next.js chính chủ nên chắc chắn chạy đúng"

- **Vì sao sai:** Next.js có hai thế hệ định tuyến tồn tại song song là **Pages Router** (thư mục `pages/`, cũ) và **App Router** (thư mục `app/`, mới). AI rất hay viết code trong thư mục `app/` nhưng lại gọi `next/router`, `getServerSideProps` hoặc đọc `params.id` không có `await`.
- **Cách sửa:** Khi giao việc cho AI hoặc kiểm tra code điều hướng, luôn nhắc rõ dự án đang dùng **Next.js App Router (Next.js 15+)**, chỉ dùng `next/navigation` và phải `await params`.
