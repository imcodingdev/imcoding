---
id: forms-validation
title: Biểu mẫu và kiểm tra phía giao diện
group: frontend
prerequisites: [ui-state, control-flow]
priority: 2
stage: 2
format: 2
signals:
  - "<form"
  - "onSubmit"
  - "required"
  - "preventDefault"
  - "react-hook-form"
  - "disabled="
---

## Nhắc lại

### State của giao diện nằm ở đâu, và ai có thể thay đổi nó?

State nằm trong bộ nhớ của tab trình duyệt trên máy người dùng. Vì nằm ở máy họ nên họ can thiệp được, và nó mất khi tải lại trang. Máy chủ không được tin vào state.

### Câu lệnh điều kiện `if` làm gì trong code?

`if` kiểm tra một điều kiện đúng hay sai rồi chọn nhánh để chạy. Ví dụ: nếu số lượng nhỏ hơn 1 thì hiện thông báo lỗi, ngược lại thì gửi đơn đi.

## Đoán trước

Quán của bạn có form đặt bánh sinh nhật. AI làm rất chỉn chu: ô số lượng chỉ cho nhập từ 1 đến 10, ô số điện thoại bắt buộc, để trống thì hiện chữ đỏ và nút "Đặt bánh" không gửi được. Bạn thử đủ kiểu nhập sai, form đều chặn. Một tuần sau, trong bảng `orders` xuất hiện một đơn có số lượng `-50`, số điện thoại trống, và tổng tiền là số âm. Form đã chặn mọi kiểu nhập sai bạn nghĩ ra, vậy đơn này lọt vào bằng đường nào?

### Đáp án

Đơn đó không đi qua form. Các kiểm tra AI viết đều chạy trong trình duyệt, tức trên máy của người gửi. Ai cũng có thể mở DevTools xem form gửi dữ liệu tới địa chỉ nào (ví dụ `/api/orders`), rồi tự gửi một yêu cầu tới đúng địa chỉ đó với nội dung tùy ý. Yêu cầu này không chạm vào dòng kiểm tra nào của giao diện. Máy chủ nhận được, không kiểm lại, và ghi thẳng vào database. Kiểm tra ở giao diện là để giúp người dùng tử tế nhập đúng cho nhanh. Người chặn dữ liệu sai phải là máy chủ.

## Ví dụ mẫu

Ở quầy lễ tân phòng khám, nhân viên nhắc bạn: "Anh chưa ghi ngày sinh ạ". Việc nhắc này giúp bạn sửa ngay tại chỗ, khỏi phải quay lại. Nhưng hồ sơ gửi qua bưu điện thì không qua lễ tân. Vì vậy phòng hồ sơ bên trong vẫn phải tự soát từng tờ trước khi nhập sổ.

**Form (biểu mẫu)** là nơi người dùng nhập dữ liệu để gửi đi. **Validation (kiểm tra hợp lệ)** là việc soát dữ liệu trước khi nhận. Có hai nơi soát:

- **Phía giao diện (client-side):** chạy trong trình duyệt, phản hồi tức thì, không tốn một lượt gửi. Mục đích là sự tiện lợi cho người dùng.
- **Phía máy chủ (server-side):** chạy ở nơi người dùng không sửa được. Mục đích là bảo vệ dữ liệu. Bài "Kiểm tra đầu vào phía máy chủ" sẽ dạy kỹ phần này.

Bài này tập trung vào phía giao diện: một form tốt cần gì và AI hay làm thiếu gì.

Cách làm SAI (không báo lỗi, không khóa nút, bấm hai lần là hai đơn):

```tsx
// SAI: gửi thẳng, không kiểm tra, không chặn bấm lặp
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, quantity }),
  })
}
```

Cách làm ĐÚNG ở phía giao diện:

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault() // chặn trình duyệt tự tải lại trang khi gửi form
  if (quantity < 1 || quantity > 10) {
    setError('Số lượng từ 1 đến 10') // báo lỗi cụ thể, ngay cạnh ô nhập
    return
  }
  setSubmitting(true) // nút gửi có disabled={submitting}: chặn bấm lặp
  const res = await fetch('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, quantity }),
  })
  // Máy chủ vẫn có thể từ chối. Vì giao diện không phải nơi ___
  if (!res.ok) setError('Chưa đặt được, bạn thử lại nhé')
  setSubmitting(false)
}
```

Trong phần HTML của form, các thuộc tính như `required`, `type="email"`, `min`, `max`, `maxLength` cũng là kiểm tra phía giao diện. Trình duyệt tự chặn và tự hiện lời nhắc mà không cần thêm code. Chúng tiện, nhưng cũng chỉ có tác dụng với người đi qua form.

## Tìm trong project của bạn

1. **Tìm các form:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) các chuỗi `<form`, `onSubmit`, `action=`. Ghi lại từng form và nó dùng để làm gì (đăng ký, đặt hàng, liên hệ).
2. **Xem form kiểm tra gì ở giao diện:** Trong mỗi form, tìm `required`, `min=`, `max=`, `maxLength`, `type="email"`. Nếu dự án dùng thư viện thì sẽ thấy `react-hook-form` hoặc `zod` trong `package.json`. Ổn: ô bắt buộc có đánh dấu, ô số có giới hạn. Có vấn đề: ô số lượng, số tiền, ngày tháng không có giới hạn nào.
3. **Xem lỗi hiện ra thế nào:** Thử để trống và nhập sai từng ô. Ổn: lỗi hiện gần ô sai, nói rõ cần sửa gì, dữ liệu đã nhập ở các ô khác còn nguyên. Có vấn đề: chỉ hiện "Có lỗi xảy ra", hoặc form bị xóa trắng.
4. **Thử bấm gửi liên tiếp:** Bấm nút gửi thật nhanh ba lần. Tìm trong code `disabled=` trên nút gửi. Ổn: nút mờ đi sau lần bấm đầu và chỉ có một bản ghi. Có vấn đề: sinh ra hai, ba bản ghi trùng nhau.
5. **Lần theo nơi form gửi tới:** Tìm `fetch(` hoặc tên hàm trong `action=`. Mở file máy chủ tương ứng (`app/api/.../route.ts` hoặc file có `'use server'`) và xem ở đó có kiểm tra lại các giá trị không, hay ghi thẳng vào database.
6. **Ghi lại kết quả của bạn:**
   - Form nào chưa chặn bấm lặp?: `[ Tên form: ... ]`
   - Form nào có kiểm tra ở giao diện nhưng phía máy chủ không kiểm lại?: `[ Tên form, tên file máy chủ: ... ]`
   - Thông báo lỗi có nói rõ cần sửa gì không?: `[ Có / Không ]`

## Tự giải thích

### Nếu máy chủ đằng nào cũng phải kiểm lại, vì sao vẫn nên kiểm tra ở giao diện?

Vì người dùng thật được báo lỗi ngay khi đang nhập, không phải chờ một lượt gửi đi rồi nhận về. Họ sửa nhanh hơn, ít bỏ cuộc hơn, và máy chủ đỡ phải xử lý những yêu cầu chắc chắn bị từ chối. Hai lớp phục vụ hai mục đích khác nhau: giao diện lo trải nghiệm, máy chủ lo an toàn dữ liệu.

### Bỏ dòng `setSubmitting(true)` và thuộc tính `disabled` trên nút gửi thì điều gì có thể xảy ra?

Người dùng mạng chậm thường bấm lại vì tưởng chưa ăn. Mỗi lần bấm là một yêu cầu, và mỗi yêu cầu tạo một bản ghi: hai đơn hàng, hai lần gửi email, có khi hai lần trừ tiền. Khóa nút khi đang gửi là cách chặn đơn giản nhất ở giao diện. Với thao tác liên quan tới tiền, máy chủ cũng cần tự chống trùng, vì khóa nút vẫn là thứ chạy ở trình duyệt.

### Vì sao thông báo "Có lỗi xảy ra" trên form là dấu hiệu AI làm chưa xong?

Người dùng không biết ô nào sai và sai thế nào, nên họ đoán mò hoặc bỏ đi. Một form làm xong phải chỉ đúng ô sai và nói cách sửa, ví dụ "Số điện thoại cần 10 chữ số". Thông báo chung chung thường là do AI gom mọi trường hợp vào một nhánh, và cũng làm bạn khó phân biệt lỗi do người nhập với lỗi do hệ thống.

## Trắc nghiệm

### Form đặt hàng của bạn có ô số lượng như sau. Điều nào đúng?

```tsx
<input type="number" name="quantity" min={1} max={10} required />
```

- [ ] Database sẽ không bao giờ nhận số lượng ngoài khoảng 1 đến 10
- [x] Người đi qua form bị trình duyệt chặn khi nhập ngoài khoảng, còn yêu cầu gửi thẳng tới máy chủ thì không bị ảnh hưởng
- [ ] Thuộc tính `min`, `max` cũng được Next.js tự áp dụng ở máy chủ
- [ ] Người dùng không thể sửa các thuộc tính này vì chúng nằm trong code

**Giải thích:** `min`, `max`, `required` là chỉ dẫn cho trình duyệt. Chúng chỉ có tác dụng trên trang đang mở, và người dùng sửa hoặc xóa được bằng DevTools. Máy chủ không biết gì về chúng trừ khi bạn viết code kiểm tra riêng ở đó.

### Bạn nhờ AI "thêm validation cho form đăng ký". AI báo xong và chỉ sửa file `RegisterForm.tsx` có `'use client'`. Kết luận nào hợp lý?

- [ ] Đã đủ, vì form là nơi duy nhất người dùng nhập dữ liệu
- [ ] Đã đủ nếu AI dùng thư viện `zod`
- [ ] Chưa đủ, cần thêm validation vào file CSS
- [x] Mới có lớp tiện cho người dùng; cần xem file máy chủ nhận dữ liệu đã kiểm lại chưa

**Giải thích:** File có `'use client'` chạy ở trình duyệt, nên mọi thứ AI vừa thêm đều là kiểm tra phía giao diện. Dùng `zod` không tự làm cho việc kiểm tra an toàn hơn. Điều quyết định là đoạn kiểm tra chạy ở đâu. Hãy hỏi lại AI: "phía máy chủ kiểm lại ở file nào?"

### Khách phản ánh bị tạo hai đơn giống hệt nhau cách nhau một giây. Nguyên nhân dễ gặp nhất ở phía giao diện?

- [x] Nút gửi không bị khóa trong lúc yêu cầu đang chạy, khách bấm hai lần
- [ ] Database tự nhân đôi bản ghi khi quá tải
- [ ] Trình duyệt luôn gửi mỗi form hai lần để dự phòng
- [ ] Form có quá nhiều ô bắt buộc

**Giải thích:** Mạng chậm, không có dấu hiệu đang xử lý, người dùng bấm lại. Mỗi lần bấm là một yêu cầu riêng. Cách kiểm tra: tìm `disabled=` trên nút gửi và thử bấm nhanh nhiều lần trên bản thử.

### Hàm xử lý form của bạn thiếu dòng `e.preventDefault()`. Triệu chứng thường thấy là gì?

- [ ] Dữ liệu bị gửi lên máy chủ hai lần
- [ ] Form không cho nhập chữ có dấu
- [x] Trang tự tải lại khi bấm gửi, state và thông báo lỗi biến mất trước khi kịp hiện
- [ ] Máy chủ từ chối mọi yêu cầu với mã 401

**Giải thích:** Mặc định trình duyệt xử lý việc gửi form bằng cách tải lại trang. `preventDefault()` chặn hành vi đó để code của bạn tự gửi dữ liệu và giữ nguyên màn hình. Thiếu nó, người dùng thấy trang chớp một cái và mọi thứ đã nhập bị xóa.

## Kiểm tra không dùng AI

### Tình huống: App đặt lịch cắt tóc có form chọn giờ. AI viết kiểm tra ở giao diện: chỉ cho chọn giờ từ 9:00 đến 20:00 và không cho chọn ngày đã qua. File máy chủ như dưới đây. Hãy nêu rủi ro và việc cần làm, kèm lý do.

```ts
// app/api/bookings/route.ts
export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  await supabase.from('bookings').insert(body)
  return NextResponse.json({ ok: true })
}
```

#### Đáp án

1. **Rủi ro chính:** Máy chủ ghi nguyên `body` vào database mà không kiểm lại gì. Mọi quy tắc về giờ và ngày chỉ tồn tại ở giao diện. Ai gửi yêu cầu thẳng tới `/api/bookings` đều tạo được lịch lúc 3 giờ sáng, lịch trong quá khứ, hoặc chèn cả những cột form không hề có.
2. **Rủi ro phụ:** Kết quả của lệnh `insert` không được kiểm tra, nên ghi thất bại thì máy chủ vẫn trả `ok: true` và khách tưởng đã đặt được.
3. **Việc cần làm:** Yêu cầu AI kiểm lại ở máy chủ đúng các quy tắc đó (giờ trong khung, ngày chưa qua), chỉ lấy những trường cần thiết từ `body` thay vì ghi cả khối, trả mã `400` kèm lý do khi dữ liệu sai, và kiểm tra lỗi của lệnh ghi. *Lý do:* máy chủ là nơi duy nhất người gửi không sửa được.
4. **Giữ lại gì:** Kiểm tra ở giao diện vẫn giữ nguyên, vì nó giúp khách thật chọn đúng ngay từ đầu.

## Lỗi suy luận hay gặp

### "Form đã chặn rồi thì dữ liệu sai không vào được database"

- **Vì sao sai:** Form chỉ là một trong nhiều đường tới máy chủ. Yêu cầu gửi thẳng tới API không đi qua form và không chạm vào kiểm tra nào ở giao diện.
- **Cách sửa:** Với mỗi quy tắc ở form, tìm xem quy tắc đó có được kiểm lại ở file máy chủ không. Chỉ có ở giao diện thì coi như chưa có.

### "Máy chủ kiểm rồi thì kiểm ở giao diện là thừa"

- **Vì sao sai:** Bỏ lớp giao diện, người dùng phải gửi đi rồi mới biết mình nhập sai, thường kèm thông báo khó hiểu. Form khó dùng làm mất khách thật.
- **Cách sửa:** Giữ cả hai lớp và hiểu đúng vai trò: giao diện để tiện, máy chủ để chặn.

### "AI đã thêm thư viện validation nên form an toàn"

- **Vì sao sai:** Thư viện chỉ là công cụ viết quy tắc cho gọn. Nếu quy tắc chỉ được gọi trong file `'use client'` thì vẫn là kiểm tra phía giao diện.
- **Cách sửa:** Xem đoạn kiểm tra được gọi trong file nào. Phải có một lần gọi nằm trong `route.ts` hoặc file `'use server'`.

## Bài tập thực hành

Mục tiêu: thử một form quan trọng của bạn như một người dùng vụng về, và ghi lại form xử lý ra sao. Làm trên bản chạy ở máy hoặc bản preview, với dữ liệu thử.

### Việc cần làm

1. Chọn một form quan trọng (đăng ký, đặt hàng). Mở nó trên bản thử.
2. Bấm gửi khi để trống toàn bộ. Ghi lại: lỗi hiện ở đâu, có nói rõ ô nào không.
3. Nhập sai từng loại: email thiếu `@`, số âm, chữ vào ô số, một đoạn văn rất dài vào ô tên. Ghi lại ô nào chặn, ô nào cho qua.
4. Nhập đúng rồi bấm gửi thật nhanh ba lần. Mở bảng dữ liệu thử và đếm số bản ghi mới.
5. Mở file máy chủ mà form gửi tới, đánh dấu những quy tắc có ở form nhưng không thấy ở máy chủ.

### Kết quả đúng

Bạn có một bảng ghi ba cột cho form đó: quy tắc, giao diện có chặn không, máy chủ có kiểm lại không. Bấm ba lần chỉ tạo một bản ghi. Mọi dòng mà cột máy chủ ghi "không" là việc cần giao cho AI ở bài "Kiểm tra đầu vào phía máy chủ".

### Nhờ AI rà lại

```text
Hãy liệt kê mọi form trong dự án. Với mỗi form, lập bảng:
từng trường, quy tắc kiểm tra ở giao diện, và quy tắc tương ứng
ở phía máy chủ (nêu tên file và dòng). Đánh dấu trường nào chỉ
được kiểm tra ở giao diện, và form nào chưa chặn bấm gửi lặp.
Chỉ báo cáo, không sửa file nào.
```
