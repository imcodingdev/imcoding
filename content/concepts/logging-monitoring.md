---
id: logging-monitoring
title: Nhật ký và giám sát vận hành
group: deploy
prerequisites: [hosting-deploy, error-handling, security-boundaries]
priority: 2
stage: 4
format: 2
signals:
  - "console.error"
  - "console.log"
  - "requestId"
  - "/api/health"
  - "logger."
---

## Nhắc lại

### Sau khi `git push`, bạn xem ở đâu để biết bản mới đã thật sự chạy cho khách hay Vercel vẫn giữ bản cũ?

Xem bảng **Deployments** của project trên Vercel. Bản mới phải ở trạng thái Ready và mang nhãn Production. Nếu bước build lỗi, Vercel giữ nguyên bản cũ đang chạy.

### Khi một API route gặp lỗi và code "nuốt" lỗi trong `catch` mà không ghi lại gì, hậu quả là gì?

Người dùng thấy tính năng không chạy, còn bạn không có dấu vết nào để biết lỗi gì, ở đâu, lúc nào. Xử lý lỗi đúng gồm hai việc: trả cho người dùng một thông báo dễ hiểu và ghi lại chi tiết lỗi ở phía máy chủ.

## Đoán trước

Thứ Hai, bạn nhờ AI "dọn code cho gọn" rồi deploy. Vercel báo Ready, bạn mở trang chủ thấy bình thường nên yên tâm. Thứ Năm, một khách quen nhắn: "Shop em ba hôm nay không đặt hàng được, anh chuyển sang mua chỗ khác rồi". Bạn tự thử thì đúng thật: bấm "Đặt hàng" là báo lỗi. Ba ngày liền không ai trong nhóm biết. Trong khi đó, mỗi lần khách bấm nút, máy chủ đều ghi lại một dòng lỗi. Vì sao app hỏng ba ngày mà bạn là người biết sau cùng?

### Đáp án

Vì có nhật ký nhưng không ai đọc, và không có gì tự báo cho bạn. Trạng thái Ready của Vercel chỉ nói rằng bản build đã đóng gói xong. Nó không nói tính năng đặt hàng còn chạy. Phần lớn khách gặp lỗi sẽ lặng lẽ bỏ đi chứ không nhắn cho bạn. Muốn biết trước khách, bạn cần hai thứ: **log** (nhật ký máy chủ ghi lại việc đã xảy ra) đủ rõ để đọc, và **monitoring** (giám sát: một cơ chế tự kiểm tra rồi gửi cảnh báo) để lỗi tự tìm đến bạn.

## Ví dụ mẫu

Một quán ăn có **sổ ghi ca**: mấy giờ mất điện, đơn nào bị trả lại, vì sao. Sổ đó là log. Nhưng sổ chỉ có ích khi ai đó mở ra đọc. Vì vậy quán còn cần **chuông báo cháy**: thứ tự kêu khi có chuyện, không chờ ai đi kiểm tra. Đó là monitoring.

Với app Next.js chạy trên Vercel và Supabase, log nằm ở mấy nơi:

- **Vercel, tab Logs của project:** mọi thứ code máy chủ in ra bằng `console.log`, `console.error` (API route, Server Action, Server Component), kèm đường dẫn và mã trạng thái của từng yêu cầu. Lỗi lúc đóng gói thì nằm trong Build Logs của từng deployment.
- **Supabase, mục Logs trong dashboard:** log của API, của Postgres (database) và của Auth (đăng nhập).
- **Console của trình duyệt (F12):** những gì code chạy trên trình duyệt in ra. Phần này nằm trên máy khách, bạn không xem được từ xa.

Log tốt trả lời được: việc gì, lúc nào, của yêu cầu nào, kết quả ra sao. Log không được chứa bí mật hay dữ liệu cá nhân, vì log được lưu lại, được nhiều người xem và hay bị dán vào khung chat AI.

Cách làm SAI (AI hay viết khi gỡ lỗi rồi quên xóa):

```ts
export async function POST(req: Request) {
  const body = await req.json()
  console.log('checkout', body, process.env) // in cả địa chỉ, số điện thoại, mọi khóa
  try {
    await createOrder(body)
  } catch (e) {
    console.log('lỗi rồi') // lỗi gì? ở bước nào? của yêu cầu nào?
  }
  return Response.json({ ok: true }) // lỗi vẫn báo thành công
}
```

Cách làm ĐÚNG:

```ts
export async function POST(req: Request) {
  const requestId = crypto.randomUUID() // mã riêng cho từng yêu cầu
  const body = await req.json()
  try {
    const order = await createOrder(body)
    console.info('checkout.ok', { requestId, orderId: order.id })
    return Response.json({ ok: true })
  } catch (e) {
    // Dòng log dưới đây cố ý không chứa ___ . Vì sao?
    console.error('checkout.failed', { requestId, message: String(e) })
    return Response.json({ error: 'Chưa tạo được đơn', requestId }, { status: 500 })
  }
}
```

Khách chụp màn hình có `requestId`, bạn dán mã đó vào ô tìm kiếm của tab Logs là ra đúng dòng lỗi.

## Tìm trong project của bạn

1. **Tìm chỗ nuốt lỗi:** tìm toàn dự án từ khóa `catch`. Với mỗi khối `catch` trong `app/api/` và các file có `'use server'`, xem bên trong có `console.error` kèm thông tin lỗi không. Ổn: có tên việc và thông báo lỗi. Có vấn đề: `catch {}` rỗng, hoặc chỉ in một chữ như `'error'`.
2. **Tìm chỗ in thừa:** tìm `console.log(`. Có vấn đề khi thấy in nguyên `body`, `req.headers`, `user`, `session`, `process.env`, hoặc bất kỳ biến nào chứa mật khẩu, token, email, số điện thoại, địa chỉ. Ổn: chỉ in mã định danh như `orderId`, `userId`.
3. **Đọc log thật trên Vercel:** mở project, vào tab **Logs**, lọc mức Error trong 24 giờ gần nhất. Ổn: bạn hiểu từng dòng nói về việc gì. Có vấn đề: toàn dòng vô nghĩa, hoặc có lỗi lặp lại hàng chục lần mà bạn chưa từng biết.
4. **Đọc log trên Supabase:** vào mục **Logs**, xem log API và Postgres. Chú ý các yêu cầu trả mã `401`, `403`, `500` lặp lại nhiều lần.
5. **Tìm cơ chế tự báo:** tìm `health` trong thư mục `app/api/`, và hỏi chính mình: nếu trang đặt hàng hỏng lúc 2 giờ sáng, ai nhận được email hay tin nhắn?
6. **Ghi lại:**
   - Số khối `catch` không ghi log: `[ ... ]`
   - Có dòng log nào in dữ liệu cá nhân hoặc khóa không: `[ Có / Không, file: ... ]`
   - Lỗi lặp lại nhiều nhất trong log Vercel: `[ ... ]`
   - Cơ chế cảnh báo đang có: `[ Chưa có / Có: ... ]`

## Tự giải thích

### Vì sao không được in nguyên `body` của yêu cầu vào log, dù việc đó giúp gỡ lỗi nhanh hơn?

`body` thường chứa email, số điện thoại, địa chỉ, có khi cả mật khẩu hay token. Log là văn bản thuần, được lưu lại, ai có quyền vào dashboard đều đọc được, và rất hay bị chép nguyên khối vào khung chat AI hoặc diễn đàn khi hỏi lỗi. Dữ liệu đã vào log thì bạn không còn kiểm soát được nó đi đâu. Chỉ nên ghi mã định danh, rồi dùng mã đó tra trong database khi cần.

### Nếu bỏ `requestId` và chỉ ghi `console.error('checkout failed')`, bạn gặp khó khăn gì khi có 200 đơn mỗi ngày?

Bạn biết có lỗi nhưng không nối được dòng lỗi với người khách đang phàn nàn. Mười dòng `checkout failed` giống hệt nhau không cho biết dòng nào là của ai, lỗi gì, có cùng nguyên nhân hay không. `requestId` và thông báo lỗi biến log từ "có chuyện gì đó" thành "yêu cầu này hỏng ở bước này".

### Vì sao chỉ có log thôi thì chưa đủ để biết app hỏng trước khi khách báo?

Log là thứ thụ động: nó nằm yên chờ người mở ra. Monitoring chủ động: một dịch vụ kiểm tra định kỳ (uptime check) gọi vào trang hoặc đường dẫn `/api/health` vài phút một lần, hoặc một công cụ theo dõi lỗi đếm số lỗi mới, rồi gửi email hay tin nhắn khi có bất thường. Thiếu phần chủ động, thời gian phát hiện lỗi phụ thuộc vào việc khách có chịu nhắn cho bạn hay không.

## Trắc nghiệm

### Bạn thêm `console.log('đã bấm nút đặt hàng')` vào một component có dòng `'use client'` ở đầu file. Sau khi deploy, dòng này hiện ở đâu khi khách bấm nút?

- [ ] Trong tab Logs của project trên Vercel
- [ ] Trong mục Logs của Supabase
- [x] Trong Console của trình duyệt trên máy từng người dùng
- [ ] Trong Build Logs của deployment

**Giải thích:** Hàm xử lý cú bấm nút trong component `'use client'` chạy trên trình duyệt, nên dòng in nằm ở Console trên máy người dùng. Tab Logs của Vercel chỉ thấy những gì code phía máy chủ in ra. Nhiều người tìm mãi trong Vercel không thấy và kết luận nhầm rằng nút không chạy.

### AI vừa thêm dòng này vào `app/api/login/route.ts` để gỡ lỗi đăng nhập. Vấn đề lớn nhất là gì?

```ts
console.log('login attempt', { email, password })
```

- [x] Mật khẩu và email của người dùng nằm dạng chữ thuần trong log, ai xem log cũng đọc được
- [ ] `console.log` làm API chạy chậm đáng kể
- [ ] Không sao, vì log trên Vercel chỉ chủ tài khoản mới xem được

**Giải thích:** Mật khẩu không bao giờ được xuất hiện ở dạng chữ thuần ngoài lúc kiểm tra đăng nhập. Log có thể được thành viên khác trong nhóm xem, được chuyển sang dịch vụ lưu log bên ngoài, hoặc bị dán vào chat AI. "Chỉ mình tôi xem được" không đúng lâu dài và không phải lý do để ghi bí mật.

### Bạn mở tab Logs trên Vercel và thấy hai kiểu dòng dưới đây. Kiểu nào giúp bạn sửa lỗi?

```text
(1) POST /api/checkout 500  Error
(2) POST /api/checkout 500  checkout.failed { requestId: "a1f3...",
    message: "new row violates row-level security policy for table orders" }
```

- [ ] Kiểu (1), vì ngắn gọn và có mã 500
- [x] Kiểu (2), vì có mã yêu cầu và nguyên nhân: chính sách RLS của bảng `orders` chặn việc thêm dòng
- [ ] Cả hai như nhau, vì đều cho biết `/api/checkout` lỗi

**Giải thích:** Cả hai đều cho biết có lỗi 500, nhưng chỉ kiểu (2) nói lỗi nằm ở đâu: RLS (Row Level Security, quy tắc phân quyền theo từng dòng của Supabase) từ chối lệnh thêm vào bảng `orders`. Với kiểu (1), bạn và AI chỉ có thể đoán.

### Cách nào giúp bạn biết trang đặt hàng hỏng trước khi khách báo?

- [ ] Mỗi sáng mở trang chủ xem có lên không
- [ ] Dặn AI "nhớ kiểm tra kỹ" trước mỗi lần deploy
- [ ] Xem trạng thái Ready ở bảng Deployments
- [x] Đặt một dịch vụ gọi định kỳ vào `/api/health` và gửi email cho bạn khi không nhận được mã 200

**Giải thích:** Chỉ phương án cuối là tự động, lặp lại và tự báo cho bạn. Mở trang chủ không kiểm tra được luồng đặt hàng và bỏ sót lúc bạn ngủ. Ready chỉ nói bản build thành công, không nói tính năng còn chạy.

## Kiểm tra không dùng AI

### Tình huống: Khách báo "không thanh toán được". Bạn nhờ AI tìm nguyên nhân. AI đề xuất thêm dòng dưới đây vào API thanh toán, deploy lên production, và bảo bạn chép toàn bộ log Vercel dán lại cho nó. Hãy nêu rủi ro và cách làm thay thế.

```ts
console.log('DEBUG', req.headers, body, process.env)
```

#### Đáp án

Rủi ro: `req.headers` chứa cookie phiên đăng nhập của khách. `body` chứa thông tin cá nhân và thông tin đơn hàng. `process.env` chứa mọi khóa bí mật của máy chủ, kể cả khóa `service_role` của Supabase và khóa cổng thanh toán. Tất cả sẽ nằm trong log production, rồi bị dán vào một dịch vụ AI bên ngoài. Một khóa đã đi qua con đường này phải coi là đã lộ và cần thu hồi.

Cách thay thế:

1. Chỉ ghi thứ cần để khoanh vùng: tên bước, `requestId`, mã trạng thái, thông báo lỗi. Không ghi header, không ghi nguyên `body`, không ghi `process.env`.
2. Nếu được, tái hiện lỗi trên bản Preview với tài khoản thử trước khi đụng vào production.
3. Khi đưa log cho AI, chỉ chép các dòng liên quan và tự đọc lại để xóa email, số điện thoại, token trước khi dán.
4. Sau khi sửa xong, gỡ dòng log gỡ lỗi tạm và kiểm tra lại tab Logs.

## Lỗi suy luận hay gặp

### "Vercel báo Ready nghĩa là app đang chạy tốt"

- **Vì sao sai:** Ready chỉ xác nhận bước build xong và bản mới đã được đưa lên. Lỗi xảy ra lúc người dùng bấm nút (database từ chối, khóa hết hạn, dịch vụ bên ngoài sập) không làm trạng thái này đổi màu.
- **Cách sửa:** Sau mỗi lần deploy, tự đi qua luồng quan trọng nhất (đăng nhập, đặt hàng, thanh toán thử) và mở tab Logs lọc mức Error trong vài phút đầu.

### "Ghi log càng nhiều càng dễ gỡ lỗi"

- **Vì sao sai:** Log nhiều mà không có cấu trúc khiến dòng quan trọng chìm giữa hàng nghìn dòng rác. In nguyên đối tượng còn kéo theo bí mật và dữ liệu cá nhân. Nền tảng cũng chỉ giữ log trong một thời gian giới hạn tùy gói.
- **Cách sửa:** Mỗi sự kiện quan trọng một dòng, có tên việc, mã yêu cầu, kết quả. Lỗi dùng `console.error`. Dòng gỡ lỗi tạm thì xóa sau khi xong.

### "Không ai phàn nàn nghĩa là không có lỗi"

- **Vì sao sai:** Đa số người gặp lỗi sẽ rời đi mà không báo. Im lặng có thể là dấu hiệu khách không dùng được chứ không phải mọi thứ ổn.
- **Cách sửa:** Đặt ít nhất một cơ chế tự báo: kiểm tra định kỳ đường dẫn quan trọng, và thói quen xem log lỗi theo lịch cố định mỗi tuần.

## Bài tập thực hành

Mục tiêu: tự tay tìm được một lỗi cụ thể trong log, và biết log của mình có đủ để khoanh vùng hay không. Làm trên bản Preview với tài khoản thử, không đụng tới production.

### Việc cần làm

1. Chọn một API route ít quan trọng. Tạo nhánh thử, rồi nhờ AI thêm vào khối `catch` của route đó một dòng `console.error` có tên việc, `requestId` và thông báo lỗi.
2. Đẩy nhánh thử lên để Vercel tạo bản Preview. Mở bản Preview bằng tài khoản thử.
3. Gây lỗi một cách an toàn: gửi thiếu một trường bắt buộc, hoặc gọi route khi chưa đăng nhập.
4. Mở tab Logs của project trên Vercel, lọc đúng bản Preview đó và tìm dòng lỗi vừa tạo.
5. Đọc lại dòng log và gạch tên mọi thông tin cá nhân hoặc bí mật nếu có.

### Kết quả đúng

Trong vòng hai phút, bạn tìm được đúng dòng lỗi mình vừa gây ra. Chỉ đọc dòng đó, bạn nói được route nào hỏng, hỏng ở bước nào, và trong dòng không có email, số điện thoại, token hay khóa nào.

### Nhờ AI rà lại

```text
Hãy rà toàn bộ code phía máy chủ (app/api, các file có 'use server').
Liệt kê: (1) khối catch không ghi log hoặc ghi log không có thông tin lỗi,
(2) dòng log có thể in mật khẩu, token, cookie, process.env hoặc dữ liệu
cá nhân. Với mỗi mục, nêu file và số dòng. Chỉ báo cáo, không tự sửa.
```
