---
id: async-requests
title: Gọi API bất đồng bộ
group: api
prerequisites: [api-endpoint, json, ui-state]
priority: 2
stage: 2
format: 2
signals:
  - "fetch("
  - "await "
  - "isLoading"
  - "catch"
  - "res.ok"
  - ".then("
---

## Nhắc lại

### API endpoint là gì, và file nào trong Next.js App Router tạo ra nó?

API endpoint là một địa chỉ mà máy chủ mở ra để bên ngoài gọi tới. File `app/api/orders/route.ts` tạo ra địa chỉ `/api/orders`, mỗi hàm `GET`, `POST`, `PATCH`, `DELETE` trong đó là một ô cửa riêng.

### Vì sao không nên gọi `res.json()` ngay khi chưa biết máy chủ trả về thành công hay lỗi?

Vì khi lỗi, máy chủ có thể trả về trang HTML hoặc một dòng chữ thường, không phải JSON. Mở gói mù quáng sẽ sinh thêm một lỗi mới che mất lỗi gốc. Phải kiểm tra `res.ok` trước.

## Đoán trước

App đặt lịch của bạn có trang "Lịch hẹn của tôi". AI làm xong, bạn mở thử ở văn phòng: vòng xoay hiện nửa giây rồi danh sách hiện ra. Hôm ra mắt, một khách nhắn: "Trang của tôi quay mãi không dừng, chờ năm phút rồi." Bạn mở lại thì vẫn bình thường. Hóa ra lúc đó khách đang đi thang máy, mạng chập chờn. Cùng tối đó, phiên đăng nhập của một khách khác hết hạn và họ cũng thấy vòng xoay vô tận. Không có thông báo lỗi nào hiện ra. Vì sao khi yêu cầu thất bại, màn hình lại kẹt ở trạng thái đang tải thay vì báo lỗi?

### Đáp án

Vì code chỉ viết cho trường hợp thành công. Trước khi gọi, nó bật cờ "đang tải". Khi có dữ liệu, nó tắt cờ và hiện danh sách. Nhưng không có dòng nào nói phải làm gì khi yêu cầu thất bại, nên cờ "đang tải" không bao giờ được tắt. Đây là kiểu thiếu sót rất hay gặp ở code AI viết: AI thử trong điều kiện mạng tốt, tài khoản hợp lệ, thấy chạy và báo xong. Mọi lời gọi tới máy chủ đều có ba kết cục: **đang tải, thành công, thất bại**. Giao diện phải có câu trả lời cho cả ba.

## Ví dụ mẫu

Bạn gọi món ở quán và nhận một thẻ rung. Trong lúc chờ, bạn vẫn ngồi nói chuyện được, không phải đứng chôn chân ở quầy. Sau đó có hai khả năng: thẻ rung và bạn ra lấy món, hoặc nhân viên ra báo "hết món này rồi ạ". Tệ nhất là khả năng thứ ba: quán quên đơn và không ai nói gì, bạn ngồi chờ mãi.

**Bất đồng bộ (asynchronous)** nghĩa là gửi yêu cầu đi rồi không đứng chờ: trang vẫn hoạt động, kết quả về sau. Trong code, dấu hiệu là `async`, `await`, `fetch(` hoặc `.then(`. Giữa lúc gửi và lúc có kết quả, giao diện phải dùng state để nhớ mình đang ở đâu trong ba trạng thái.

Cách làm SAI (chỉ có đường thành công):

```tsx
// SAI: yêu cầu hỏng thì isLoading mãi là true, vòng xoay quay vô tận
async function loadBookings() {
  setIsLoading(true)
  const res = await fetch('/api/bookings')
  const data = await res.json() // máy chủ trả 401 hay 500 vẫn cố đọc
  setBookings(data)
  setIsLoading(false)
}
```

Cách làm ĐÚNG (đủ ba trạng thái):

```tsx
async function loadBookings() {
  setStatus('loading')
  try {
    const res = await fetch('/api/bookings')
    if (!res.ok) throw new Error(`Mã ${res.status}`)
    setBookings(await res.json())
    setStatus('success')
  } catch (err) {
    console.error(err) // ghi lại để còn lần ra nguyên nhân
    // Thiếu dòng dưới thì status kẹt mãi ở ___
    setStatus('error') // giao diện tắt vòng xoay, hiện lời báo và nút "Thử lại"
  }
}
```

Hai chi tiết đáng nhớ khi đọc:

1. **`fetch` không tự coi mã 4xx, 5xx là thất bại.** Nó chỉ ném lỗi khi không kết nối được (mất mạng, sai địa chỉ). Máy chủ trả `500` thì `fetch` vẫn chạy tiếp như bình thường. Vì vậy phải có dòng kiểm tra `res.ok`.
2. **Phần hiển thị cũng phải có ba nhánh.** Đang tải thì hiện vòng xoay hoặc khung chờ. Thất bại thì hiện lời báo dễ hiểu và cách thử lại. Thành công mà danh sách rỗng thì nói rõ "Chưa có lịch hẹn nào", đừng để màn hình trắng.

Trong Next.js App Router, nếu dữ liệu được lấy ngay trên máy chủ thì hai file đặc biệt đặt cạnh `page.tsx` đảm nhận việc này: `loading.tsx` cho lúc chờ và `error.tsx` cho lúc lỗi.

## Tìm trong project của bạn

1. **Tìm các lời gọi:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) chuỗi `fetch(`. Tìm thêm `supabase.from(` trong các file có `'use client'`. Mỗi kết quả là một lần giao diện nói chuyện với máy chủ.
2. **Kiểm tra nhánh thất bại:** Với từng lời gọi, nhìn quanh nó xem có `try` và `catch`, hoặc `.catch(` không. Với `fetch`, có dòng `res.ok` hay `res.status` không. Với Supabase, có đọc `error` trong `const { data, error } = ...` không. Ổn: có đủ. Có vấn đề: chỉ thấy `await` rồi dùng luôn kết quả.
3. **Kiểm tra cờ đang tải:** Tìm `isLoading`, `loading`, `pending`, `status`. Với mỗi chỗ bật cờ, tìm xem cờ có được tắt ở **cả** đường thành công lẫn đường thất bại không. Dấu hiệu tốt là cờ được tắt trong khối `finally` hoặc trong cả `try` và `catch`.
4. **Kiểm tra file của App Router:** Trong thư mục `app/`, xem các trang lấy dữ liệu có `loading.tsx` và `error.tsx` đi kèm không.
5. **Thử mất mạng:** Mở DevTools (F12), tab Network, chọn chế độ `Offline` ở ô chọn tốc độ mạng. Tải lại trang hoặc bấm một nút có gọi máy chủ. Sau đó chọn tốc độ chậm (`Slow 4G` hoặc `3G`) và thử lại.
6. **Ghi lại kết quả của bạn:**
   - Lời gọi nào không có nhánh thất bại?: `[ Tên file: ... ]`
   - Khi mất mạng, màn hình hiện gì?: `[ Lời báo lỗi / Vòng xoay vô tận / Màn hình trắng ]`
   - Khi mạng chậm, có dấu hiệu đang tải không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao máy chủ trả mã `500` mà khối `catch` vẫn không chạy nếu thiếu dòng kiểm tra `res.ok`?

Với `fetch`, nhận được bất kỳ phản hồi nào cũng là "gọi được", kể cả khi phản hồi đó mang mã lỗi. Nó chỉ ném lỗi khi không nhận được phản hồi. Vì vậy `catch` tự nó chỉ bắt được mất mạng. Dòng `if (!res.ok) throw ...` chủ động biến phản hồi lỗi thành một lỗi để đi vào `catch`.

### Bỏ trạng thái "đang tải" đi thì người dùng mạng chậm sẽ gặp chuyện gì?

Họ bấm nút và không thấy gì đổi. Họ tưởng app hỏng nên bấm lại nhiều lần, mỗi lần là một yêu cầu mới. Với trang danh sách, họ thấy màn hình trống và tưởng mình không có dữ liệu. Trạng thái đang tải nói với người dùng rằng yêu cầu đã được nhận, đồng thời là chỗ để khóa nút tránh gửi lặp.

### Vì sao code AI viết hay thiếu nhánh thất bại, dù AI "đã thử và thấy chạy"?

Vì lúc thử, mọi điều kiện đều thuận lợi: mạng nhanh, máy chủ đang chạy, tài khoản còn hạn, dữ liệu hợp lệ. Nhánh thất bại chỉ chạy khi một trong các điều kiện đó hỏng, nên một lần thử thuận lợi không chạm tới nó. Muốn biết nó có tồn tại không, phải cố ý làm hỏng: tắt mạng, đăng xuất ở tab khác, gửi dữ liệu sai.

## Trắc nghiệm

### AI viết đoạn code sau cho nút "Lưu hồ sơ". Máy chủ trả mã `500`. Người dùng thấy gì?

```tsx
async function save() {
  await fetch('/api/profile', { method: 'PATCH', body: JSON.stringify(form) })
  toast.success('Đã lưu hồ sơ')
}
```

- [ ] Một thông báo lỗi, vì `fetch` tự ném lỗi khi máy chủ trả `500`
- [ ] Không thấy gì, vì trình duyệt chặn phản hồi lỗi
- [x] Thông báo "Đã lưu hồ sơ", dù không có gì được lưu
- [ ] Trang tự tải lại để thử lần nữa

**Giải thích:** `fetch` chỉ ném lỗi khi không kết nối được. Phản hồi `500` vẫn được coi là đã gọi xong, nên dòng báo thành công chạy tiếp. Đây là kiểu "báo thành công giả" nguy hiểm vì người dùng tin rằng dữ liệu đã an toàn. Cần kiểm tra `res.ok` trước khi báo.

### Đoạn code dưới đây có vấn đề gì?

```tsx
setIsLoading(true)
try {
  const res = await fetch('/api/orders')
  if (!res.ok) throw new Error('Tải thất bại')
  setOrders(await res.json())
  setIsLoading(false)
} catch (err) {
  setError('Không tải được đơn hàng')
}
```

- [x] Khi thất bại, `isLoading` không được tắt, nên vòng xoay có thể vẫn quay bên cạnh lời báo lỗi
- [ ] Thiếu `res.ok` nên không bắt được lỗi máy chủ
- [ ] Không được dùng `try` và `catch` cùng với `await`
- [ ] `setError` phải được gọi trước `fetch`

**Giải thích:** Đường thành công tắt cờ, đường thất bại thì quên. Cách sửa gọn là đưa `setIsLoading(false)` vào khối `finally`, là khối luôn chạy dù thành công hay thất bại. Đoạn này đã có `res.ok` và dùng `try`, `catch` đúng cách.

### Bạn muốn tự kiểm tra xem trang danh sách đơn hàng có xử lý nhánh thất bại không. Cách nào trực tiếp nhất?

- [ ] Hỏi AI xem nó đã xử lý lỗi chưa
- [ ] Tải lại trang mười lần liên tiếp với mạng bình thường
- [ ] Đọc `package.json` xem có thư viện xử lý lỗi không
- [x] Bật chế độ `Offline` trong tab Network của DevTools rồi tải lại trang

**Giải thích:** Nhánh thất bại chỉ chạy khi có thất bại, nên phải tự tạo ra thất bại. Tắt mạng trong DevTools là cách an toàn và nhanh nhất. Tải lại nhiều lần với mạng tốt chỉ thử lại đường thành công. Câu trả lời của AI cần được kiểm chứng bằng chính phép thử này.

### Trang "Đơn hàng của tôi" tải xong và hiện một màn hình trắng. Khách này chưa từng mua gì. Nhận xét nào đúng?

- [ ] Đây là hành vi đúng, vì không có dữ liệu thì không có gì để hiện
- [x] Code thiếu trường hợp "thành công nhưng rỗng"; khách không phân biệt được với trang bị hỏng
- [ ] Máy chủ đã trả lỗi `404`
- [ ] Trạng thái đang tải chưa được tắt

**Giải thích:** Danh sách rỗng là một kết quả thành công, nhưng với người dùng, màn hình trắng trông giống hệt lỗi. Giao diện cần một dòng như "Bạn chưa có đơn hàng nào" kèm lối đi tiếp. Khi rà code AI viết, ngoài ba trạng thái chính, hãy hỏi thêm trường hợp rỗng.

## Kiểm tra không dùng AI

### Tình huống: Nút "Thanh toán" trong app của bạn chạy đoạn code dưới đây. Một khách báo: bấm thanh toán, nút mờ đi rồi đứng im mãi, không biết đã trừ tiền chưa. Hãy chỉ ra các thiếu sót và nêu cách sửa kèm lý do.

```tsx
async function pay() {
  setPaying(true)
  const res = await fetch('/api/checkout', { method: 'POST' })
  const { url } = await res.json()
  window.location.href = url
}
```

#### Đáp án

1. **Không có nhánh thất bại:** Mất mạng thì `fetch` ném lỗi, hàm dừng giữa chừng và `paying` mãi là `true`. Nút bị khóa vĩnh viễn và không có lời báo nào.
2. **Không kiểm tra `res.ok`:** Máy chủ trả `401` (hết phiên) hoặc `500` thì code vẫn cố đọc `url`. Giá trị này không tồn tại, nên khách bị chuyển tới một địa chỉ vô nghĩa hoặc gặp lỗi khó hiểu.
3. **Cách sửa:** Bọc trong `try` và `catch`. Kiểm tra `res.ok` trước khi đọc kết quả. Khi thất bại: tắt `paying`, hiện lời báo rõ ràng rằng thanh toán chưa được thực hiện và mời thử lại. *Lý do:* với thao tác liên quan tới tiền, người dùng cần biết chắc kết quả. Im lặng khiến họ bấm lại nhiều lần hoặc bỏ đi.
4. **Cách kiểm chứng:** Bật `Offline` trong DevTools rồi bấm nút trên bản thử. Nút phải hoạt động trở lại và có lời báo.

## Lỗi suy luận hay gặp

### "Tôi thử thấy chạy rồi nên phần gọi API đã ổn"

- **Vì sao sai:** Bạn mới thử đường thành công, trong điều kiện tốt nhất. Người dùng thật có mạng yếu, phiên hết hạn, và bấm nhanh hơn bạn nghĩ.
- **Cách sửa:** Với mỗi màn hình có gọi máy chủ, thử thêm ít nhất hai lần: một lần tắt mạng, một lần mạng chậm.

### "Có `try` và `catch` rồi thì mọi lỗi đều được bắt"

- **Vì sao sai:** `catch` chỉ bắt được lỗi được ném ra. Phản hồi `400`, `401`, `500` của `fetch` không tự ném lỗi. Tương tự, thư viện Supabase trả lỗi qua trường `error` chứ không ném.
- **Cách sửa:** Tìm dòng kiểm tra `res.ok` hoặc `error` ngay sau mỗi lời gọi. Không có thì nhánh thất bại chưa đủ.

### "Không thấy thông báo lỗi nghĩa là không có lỗi"

- **Vì sao sai:** Nếu code không có nhánh thất bại thì lỗi xảy ra cũng không có gì hiện lên. Sự im lặng có thể là dấu hiệu của việc thiếu xử lý.
- **Cách sửa:** Mở tab Console và Network của DevTools khi thử. Dòng đỏ ở đó cho thấy những gì giao diện không nói.

## Bài tập thực hành

Mục tiêu: xác nhận một màn hình quan trọng của bạn trả lời được cả ba trạng thái. Làm trên bản chạy ở máy hoặc bản preview, với tài khoản thử.

### Việc cần làm

1. Chọn một màn hình có lấy dữ liệu từ máy chủ (danh sách đơn, lịch hẹn) và một nút có gửi dữ liệu (lưu, đặt).
2. Mở DevTools, tab Network, chọn tốc độ chậm. Tải lại trang và bấm nút. Ghi lại: có dấu hiệu đang tải không, nút có bị khóa trong lúc chờ không.
3. Chọn `Offline`. Tải lại trang và bấm nút. Ghi lại màn hình hiện gì.
4. Bật mạng lại. Ghi lại: có cách thử lại mà không cần tải lại cả trang không.
5. Đăng nhập bằng một tài khoản thử chưa có dữ liệu và xem trang danh sách hiện gì.

### Kết quả đúng

Bạn có bảng bốn dòng cho màn hình đó: đang tải, thành công, thất bại, rỗng. Mỗi dòng ghi rõ người dùng nhìn thấy gì. Không dòng nào là "vòng xoay vô tận", "màn hình trắng" hoặc "báo thành công dù thất bại".

### Nhờ AI rà lại

```text
Hãy liệt kê mọi lời gọi fetch và mọi lời gọi Supabase trong các
file 'use client'. Với mỗi lời gọi, cho biết: có kiểm tra res.ok
hoặc error không, cờ đang tải có được tắt ở cả đường thành công
và thất bại không, người dùng thấy gì khi thất bại và khi rỗng.
Chỉ báo cáo theo bảng, không sửa file nào.
```
