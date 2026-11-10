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

Từ Next.js 15, `params` trong App Router chuyển sang dạng bất đồng bộ (**Promise**). Server Component cần đọc bằng `await params`; Client Component có thể dùng `use(params)` của React. AI hay lấy ví dụ cũ đọc thẳng `params.id`: Next.js 15 từng hỗ trợ chuyển tiếp, còn Next.js 16 không hỗ trợ truy cập đồng bộ này. Vì vậy tùy phiên bản, bạn có thể gặp cảnh báo, lỗi hoặc giá trị không dùng được; không phải phiên bản nào cũng chỉ hiện `undefined`. Cần kiểm tra cách đọc tham số trước khi kết luận database mất đơn.

## Ví dụ mẫu

Vào siêu thị, bạn nhìn biển chỉ dẫn: *"Gian 1: Đồ uống"*, *"Gian 2: Bánh kẹo"*. Mỗi biển dẫn tới đúng một gian hàng. **Routing (Định tuyến trang)** là hệ thống biển chỉ dẫn của ứng dụng web: khi người dùng gõ hoặc bấm vào một địa chỉ (URL) như `/san-pham`, ứng dụng biết phải mở component trang nào lên.

Trong Next.js App Router, **cấu trúc thư mục bên trong `app/` chính là bản đồ đường dẫn**: thư mục `app/san-pham/` có file `page.tsx` thì địa chỉ `/san-pham` tồn tại. Những đường dẫn thay đổi theo mã số (như `/don-hang/1`, `/don-hang/2`) được gom chung vào một thư mục đặt tên trong ngoặc vuông `[id]`.

Cách làm SAI (nhầm giữa kiểu định tuyến cũ và mới, quên `await params`, và dùng thẻ `<a>` làm tải lại cả trang):

```tsx
// SAI: Lấy useRouter từ 'next/router' (kiểu Pages Router cũ, gây sập trang trong app/)
import { useRouter } from 'next/router'

export default function OrderPage({ params }: { params: { id: string } }) {
  // SAI: Đọc params đồng bộ, không tương thích App Router hiện tại
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

1. **Lập danh sách trang:** Mở `app/` hoặc `src/app/`, tìm `page.tsx` và `page.js`. Bỏ nhóm `(marketing)` khi suy ra URL; không tính cây `_components` là route. `route.ts` là điểm xử lý HTTP, không phải trang giao diện. Ghi một URL cụ thể dùng mã giả cho mỗi trang động.
2. **Kiểm tra cách đọc tham số:** Tìm `params.`, `await params`, `use(params)` và `useParams(`. Ổn là mở Promise đúng cách ở Server/Client Component hoặc dùng hook phù hợp; có vấn đề là đọc trực tiếp Promise như đối tượng. Biến `params` đã được giải nén hoặc nhận từ hook thì không cần `await` lần nữa. Tìm riêng `searchParams` để phân biệt phần sau dấu `?` với đoạn đường dẫn.
3. **Kiểm tra import bộ định tuyến:** Tìm `next/router` ở các component thuộc cây App Router: hook điều hướng tại đó phải dùng `next/navigation`. Nếu repo đồng thời có `pages/`, không đổi hàng loạt import của Pages Router chỉ vì tìm thấy chuỗi này.
4. **Kiểm tra chuyển trang nội bộ bằng thẻ `<a>`:** Tìm chuỗi `<a href="/` trong các file `.tsx`. Xem có chỗ nào chuyển giữa các trang trong cùng web mà dùng `<a href="...">` thay vì `<Link href="...">` của `next/link` không.
5. **Ghi lại kết quả của bạn:**
   - Dự án của bạn đang có bao nhiêu file `page.tsx` (trang) và bao nhiêu thư mục động `[...]`?: `[ Số trang: ... / Thư mục động: ... ]`
   - Có file nào dùng `params.` trực tiếp mà thiếu `await` hoặc gọi nhầm `next/router` không?: `[ Có / Không - tên file: ... ]`
   - Có đường dẫn nội bộ nào đang dùng thẻ `<a href="/...">` thay vì `<Link>` không?: `[ Có / Không ]`

Tìm thêm `href=`, `router.push(` và `layout.tsx` ở trang đã chọn. Ổn là liên kết dùng mã thật của bản ghi và layout hiển thị `children`; có vấn đề là URL chứa nguyên `[id]` hoặc layout bỏ mất nội dung trang con. Ghi file và đoạn liên quan; thẻ `<a>` có thể chủ ý dùng cho tải file hoặc tải lại toàn trang, nên không tự coi mọi kết quả tìm kiếm là lỗi.

## Tự giải thích

### Khi người dùng báo lỗi giao diện ở địa chỉ `https://ten-web.com/khoa-hoc/nhap-mon-ai`, làm sao bạn biết ngay cần mở file nào trong dự án để bảo AI sửa mà không cần hỏi AI trước?

Vì Next.js App Router ánh xạ trực tiếp URL vào thư mục `app/`. Nhìn vào `/khoa-hoc/nhap-mon-ai`, bạn mở thư mục `app/khoa-hoc/`: nếu có thư mục con `nhap-mon-ai/page.tsx` thì mở file đó; nếu thấy thư mục ngoặc vuông như `app/khoa-hoc/[slug]/page.tsx` thì đó là file khuôn mẫu phục vụ mọi khóa học, nơi chuỗi `'nhap-mon-ai'` được truyền qua `params`.

### Vì sao khi tạo thêm thư mục `app/gioi-thieu/` và bỏ vào đó một file tên là `About.tsx` hoặc `index.tsx`, mở địa chỉ `/gioi-thieu` trên trình duyệt vẫn bị báo lỗi `404 This page could not be found`?

Vì trong thư mục `app/` của Next.js, tên file quy định vai trò cố định. Một thư mục chỉ biến thành đường dẫn trang web truy cập được khi bên trong nó có file đặt tên chính xác là `page.tsx` (hoặc `page.js`). Đặt tên khác như `About.tsx` hay `index.tsx` thì Next.js coi đó là file phụ trợ bình thường và không mở đường dẫn `/gioi-thieu`.

### Khác biệt thực tế giữa việc bấm vào `<a href="/san-pham">` và `<Link href="/san-pham">` khi di chuyển giữa các trang trong cùng ứng dụng Next.js là gì?

Thẻ `<a>` thông thường tạo một lần điều hướng tài liệu đầy đủ, có thể làm mất trạng thái chỉ nằm trong bộ nhớ trang; tài nguyên đã cache không nhất thiết phải tải lại. `<Link>` hỗ trợ điều hướng phía client và tải trước khi phù hợp, thường giữ được layout dùng chung. Nó không bảo đảm mọi trạng thái đều được giữ hay trang đích luôn hiện tức thì.

## Trắc nghiệm

### AI đọc params.sort ở trang app/products/[id]/page.tsx. Với URL này, sort nằm ở đâu?

```text
/products/SP_GIA_01?sort=price
```

- [ ] Trong params cùng với id vì tất cả đều nằm trên URL
- [x] Trong searchParams; id mới là tham số của đoạn đường dẫn
- [ ] Trong tên thư mục price do Next.js tự tạo

**Giải thích:** `[id]` nhận đoạn `SP_GIA_01`; `sort=price` là tham số truy vấn sau dấu hỏi. Server page hiện tại cần giải nén `searchParams` trước khi đọc, không lấy nó từ `params`.

### Trang con không hiện, chỉ có menu. AI vừa sửa layout như dưới đây; cần rà gì trước?

```tsx
export default function ShopLayout() {
  return <nav>Menu cửa hàng</nav>
}
```

- [x] Layout có nhận và hiển thị children của trang con hay chưa
- [ ] Phải tạo lại mọi page.tsx vì có nav thì route bị xóa
- [ ] Chỉ đổi tên thư mục động thành chữ thường

**Giải thích:** Layout bao quanh các trang con nhưng phải đặt `children` vào kết quả render. Thiếu nội dung con không chứng minh route đã biến mất.

### AI tạo liên kết sau cho một sản phẩm có mã SP_GIA_01. Nhận xét nào đúng?

```tsx
<Link href="/products/[id]">Xem sản phẩm</Link>
```

- [ ] Next.js tự lấy id từ sản phẩm đang hiển thị
- [ ] Link tự hỏi database để điền id còn thiếu
- [x] Phải tạo href chứa mã cụ thể; [id] ở đây chỉ là ký tự trong URL

**Giải thích:** Ngoặc vuông là quy ước tên thư mục, không phải mẫu tự nội suy trong chuỗi `href`. Cần kiểm tra nguồn mã và tạo đường dẫn đúng ở nơi sử dụng Link.

### Có route động hợp lệ nhưng mã sản phẩm không tồn tại. AI bảo tạo thêm thư mục cho mã đó. Nên xử lý thế nào?

- [ ] Tạo một thư mục cho mỗi sản phẩm để tránh thiếu trang
- [x] Giữ route động và xử lý trường hợp không có dữ liệu, chẳng hạn gọi notFound()
- [ ] Tắt kiểm tra dữ liệu vì route tồn tại là sản phẩm tồn tại

**Giải thích:** Route quyết định khuôn trang, không bảo đảm bản ghi có trong database. `notFound()` giúp hiển thị trạng thái không tìm thấy thay vì nhân bản file cho từng mã.

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
- **Cách sửa:** Nêu đúng phiên bản Next.js và App Router khi giao việc cho AI. Hook điều hướng dùng `next/navigation`; Server Component dùng `await params`, Client Component dùng cách đọc phù hợp như `use(params)` hoặc `useParams()`.

## Bài tập thực hành

Lập bản đồ hai địa chỉ trong project và kiểm tra chúng trỏ tới trang nào bằng mã nguồn. Không mở trang production hoặc kích hoạt thao tác thanh toán.

### Việc cần làm

1. Chọn một trang tĩnh và một trang động nếu có, ghi đường dẫn file `page.tsx` hoặc `page.js`. Không tạo route mới nếu project chưa có trang động.
2. Viết URL dự kiến, bỏ nhóm `(ten-nhom)` và thay tham số động bằng mã `MA_GIA_01`; tách phần đường dẫn khỏi query nếu có.
3. Tìm một `Link` hoặc `router.push` trỏ đến mỗi trang, đối chiếu URL được tạo. Nếu không có nơi liên kết, ghi trang chỉ truy cập trực tiếp thay vì đoán.
4. Mở layout bao quanh trang, tìm `children`; với trang động, ghi cách đọc tham số và cách xử lý khi thiếu bản ghi. Chỉ đọc, không gửi mã giả tới dịch vụ thật.

### Kết quả đúng

Bảng file → URL mẫu → nơi điều hướng → layout có bằng chứng từ code. Bạn phân biệt được lỗi tạo URL, lỗi layout và thiếu dữ liệu; chưa chạy thử thì ghi rõ mới xác minh tĩnh.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa hoặc chạy lệnh. Rà bảng route và trích đoạn đã che dữ liệu tôi cung cấp theo Next.js App Router: URL, params/searchParams, href và children có khớp không? Nêu giới hạn do chưa chạy thử, không tự mở file hoặc gọi dịch vụ.
```
