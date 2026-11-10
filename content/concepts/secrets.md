---
id: secrets
title: Khóa bí mật (Secrets)
group: auth
prerequisites: [environment-variables]
priority: 1
stage: 1
format: 2
signals:
  - "sk-"
  - "API_KEY"
  - "SECRET"
  - ".env"
  - "NEXT_PUBLIC_"
---

## Nhắc lại

### Khi nào một biến môi trường trong Next.js bị gửi thẳng xuống trình duyệt của người dùng?

Khi tên biến bắt đầu bằng tiền tố `NEXT_PUBLIC_`. Lúc đóng gói ứng dụng, Next.js sẽ chép trực tiếp giá trị biến đó vào code JavaScript gửi xuống trình duyệt.

### Vì sao sau khi thêm biến môi trường mới vào `.env.local` ở máy cá nhân và đẩy code lên GitHub, ứng dụng trên Vercel vẫn báo thiếu biến?

Vì `.env.local` không được đưa lên Git. Bạn phải vào Settings → Environment Variables trên Vercel để nhập thủ công tên và giá trị biến cho máy chủ thật.

## Đoán trước

Tối thứ Sáu, để thử nhanh tính năng tóm tắt văn bản bằng AI, bạn dán thẳng khóa `sk-proj-XXXX...` của OpenAI vào file code, bấm `git commit` và đẩy lên kho chứa (repository) GitHub. Hai phút sau, bạn sực nhớ ra, xóa khóa khỏi code, chuyển sang `.env.local` rồi commit thêm lần nữa với ghi chú `"Fix: xóa API key"`. Sáng hôm sau, bạn nhận được email báo tài khoản OpenAI đã bị tiêu sạch 500 USD hạn mức dù file code hiện tại trên nhánh chính không còn dòng khóa nào. Tại sao kẻ xấu vẫn lấy được khóa của bạn?

### Đáp án

Git lưu lại **toàn bộ lịch sử** mọi lần chỉnh sửa (commit). Khi bạn xóa khóa ở commit thứ hai, khóa chỉ biến mất khỏi file hiện tại nhưng vẫn còn nguyên trong lịch sử của commit đầu tiên. Trên mạng luôn có các chương trình tự động (bot) quét GitHub từng giây để săn lùng chuỗi `sk-...`. Theo báo cáo của GitGuardian năm 2025, có tới **23.770.171 secret mới bị lộ trên GitHub công khai trong năm 2024**; các kho chứa dùng công cụ AI hỗ trợ viết code có tỷ lệ lộ khóa là **6,4%, cao hơn khoảng 40% so với mức chung**. Xóa dòng code là vô tác dụng; cách duy nhất đúng là thu hồi (revoke) khóa cũ ngay lập tức.

## Ví dụ mẫu

Trong cửa hàng truyền thống, những thứ như **chìa khóa két sắt** hay **mã PIN ngân hàng** trao toàn quyền hành động nhân danh bạn. Nếu lỡ làm rơi chìa khóa két ra đường, bạn phải **đổi ổ khóa mới** ngay chứ không chỉ nhặt về cất kỹ hơn.

Trong phần mềm, **Secret (Khóa bí mật)** là những chuỗi ký tự như vậy: API key của OpenAI (ai cầm được sẽ xài AI tính tiền vào thẻ của bạn), khóa bí mật Stripe, hay mật khẩu cơ sở dữ liệu. Ba nguyên tắc sống còn: **không viết cứng vào code**, **không đẩy lên Git**, và **không gửi xuống trình duyệt**.

Cách làm SAI (hay gặp khi dán khóa vào khung chat nhờ AI sửa lỗi):

```ts
// SAI NGHIÊM TRỌNG: Viết cứng (hardcode) khóa vào file code
const openai = new OpenAI({
  apiKey: 'sk-proj-XXXX-chuoi-gia-minh-hoa-khong-dung-duoc'
})
```

Cách làm ĐÚNG trong file máy chủ `app/api/chat/route.ts`:

```ts
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  // LƯU Ý: Dù khóa đã giấu kín, nếu thiếu bước ___ ở đây,
  // ai biết đường dẫn /api/chat cũng gọi chùa và tiêu tiền AI của bạn được!
  const { question } = await req.json()
  const answer = await openai.responses.create({
    model: 'gpt-5-mini',
    input: question
  })
  return Response.json({ text: answer.output_text })
}
```


## Tìm trong project của bạn

Hãy rà soát dự án của bạn theo các bước sau:

1. **Quét tìm khóa viết cứng trong code:** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm các chuỗi: `sk-`, `apiKey`, `SECRET`, `PASSWORD`, `Bearer `. Xem có file `.ts`, `.tsx`, `.js` nào chứa chuỗi khóa dài ngoằng không.
2. **Kiểm tra nguy cơ lộ qua trình duyệt:** Tìm `NEXT_PUBLIC_` xem có biến bí mật nào (khóa thanh toán, khóa AI, khóa quản trị database) bị gắn nhầm tiền tố này không.
3. **Kiểm tra lịch sử Git:** Mở Terminal và chạy `git log --all --full-history -- ".env*"` để xem trước đây có từng vô tình commit file `.env` hay `.env.local` lên Git không.
4. **Kiểm tra lệnh in nhật ký (log):** Tìm `console.log(process.env` xem có chỗ nào in toàn bộ biến môi trường ra màn hình hoặc nhật ký máy chủ không.
5. **Ghi lại kết quả của bạn:**
   - Có khóa nào đang nằm thẳng trong file code không?: `[ Có / Không - tên file: ... ]`
   - Lệnh kiểm tra lịch sử Git có trả về bản ghi commit nào không?: `[ Có / Không ]`
   - Các API route dùng khóa tính tiền đã có bước kiểm tra đăng nhập chưa?: `[ Đã có / Chưa có ]`

Trong `app/api/**/route.ts`, `src/lib/` và file khởi tạo SDK, ổn là `apiKey: process.env.TEN_BIEN` ở server, không trả khóa trong JSON. Có vấn đề là chuỗi khóa viết cứng, `NEXT_PUBLIC_` gắn bí mật, hoặc log/response chứa giá trị khóa. Tìm thêm `Response.json`, `Authorization` và `service_role`; chỉ ghi tên file và loại nguy cơ, không sao chép chuỗi nghi là khóa thật. Lịch sử `.env*` không có kết quả cũng chưa chứng minh chưa từng lộ khóa trong file code khác.

## Tự giải thích

### Vì sao khi phát hiện lộ API key trên GitHub hoặc trong nhóm chat, việc xóa dòng code / xóa tin nhắn là chưa đủ mà bắt buộc phải thu hồi (revoke) khóa?

Vì ngay khi khóa xuất hiện trên mạng, các bot quét tự động hoặc người khác đã có thể sao chép nó, đồng thời lịch sử Git và bộ nhớ đệm vẫn lưu bản cũ. Chỉ khi bạn vào trang quản trị của nhà cung cấp (OpenAI, Stripe, Supabase...) bấm **Revoke / Delete** thì chuỗi ký tự cũ mới bị vô hiệu hóa hoàn toàn.

### Giả sử bạn đã cất `OPENAI_API_KEY` rất kỹ trong biến môi trường của máy chủ và không hề lộ khóa. Kẻ xấu vẫn có thể làm bạn tốn tiền OpenAI bằng cách nào?

Kẻ xấu mở tab Network trên trình duyệt để xem trang web gửi yêu cầu đến địa chỉ nào (ví dụ `/api/chat`), rồi viết kịch bản tự động bắn hàng chục nghìn yêu cầu vào đó. Máy chủ của bạn sẽ dùng khóa thật để gọi OpenAI giúp họ. Do đó, API route bắt buộc phải kiểm tra người gọi là ai và giới hạn tần suất gọi.

### Vì sao câu lệnh `console.log(process.env)` dùng để gỡ lỗi lại tiềm ẩn rủi ro làm lộ toàn bộ khóa bí mật?

Vì `process.env` chứa tất cả biến môi trường trên máy chủ, gồm cả mật khẩu database và khóa thanh toán. Khi in ra, các khóa này sẽ nằm dạng văn bản thuần trong hệ thống lưu trữ log hoặc vô tình lọt vào ảnh chụp màn hình khi bạn gửi lỗi lên diễn đàn hỏi đáp.

## Trắc nghiệm

### AI thêm phản hồi debug vào route máy chủ. Khóa có còn kín không?

```ts
return Response.json({ debugKey: process.env.OPENAI_API_KEY })
```

- [ ] Có, vì biến không có tiền tố NEXT_PUBLIC_
- [x] Không, giá trị bị gửi cho người gọi trong phản hồi
- [ ] Có, vì JSON không phải JavaScript bundle

**Giải thích:** Không có tiền tố công khai chỉ ngăn cơ chế nhúng tự động. Tự đưa giá trị vào response vẫn làm lộ khóa, dù mã đọc nó chạy ở server.

### Cursor yêu cầu dán nguyên header Authorization để tìm lỗi. Bạn nên cung cấp gì?

- [x] Tên header, mã lỗi và mô tả đã che token
- [ ] Token thật vì chat riêng tư luôn an toàn
- [ ] URL có token thay cho header để dễ đọc

**Giải thích:** AI có thể rà cấu trúc và lỗi bằng thông tin đã che. Đổi nơi đặt token không loại bỏ bí mật khỏi dữ liệu gửi đi.

### AI dùng khóa quản trị cho tác vụ chỉ cần đọc danh mục công khai. Cần rà điều gì?

- [ ] Chỉ độ dài khóa; khóa dài luôn an toàn hơn
- [ ] Chỉ tên biến có chứa chữ SECRET không
- [x] Quyền tối thiểu cần thiết và khả năng dùng khóa có quyền hẹp hơn

**Giải thích:** Quyền rộng làm tăng hậu quả khi bị lộ hoặc dùng sai. Tên biến và độ dài không chứng minh tác vụ cần quyền quản trị.

### AI đề xuất đưa khóa vào URL như sau để tránh viết trong body. Đánh giá nào đúng?

```text
/api/demo?key=KHOA_GIA_KHONG_SU_DUNG_DUOC
```

- [ ] URL an toàn vì HTTPS che khỏi mọi nơi lưu log
- [x] Khóa thật không nên đặt vào URL vì URL có thể được lưu trong log hoặc lịch sử
- [ ] Đổi tên tham số thành id sẽ giấu được khóa

**Giải thích:** HTTPS bảo vệ đường truyền, không ngăn hệ thống đầu cuối lưu URL. Đổi tên tham số không biến bí mật thành dữ liệu công khai.

## Kiểm tra không dùng AI

### Tình huống: Khi ứng dụng lỗi thanh toán, bạn chụp ảnh màn hình Terminal (có dòng `STRIPE_SECRET_KEY=sk_live_XXXX...`) gửi lên diễn đàn công khai để hỏi. Nửa tiếng sau bạn phát hiện và xóa bài đăng. Hãy nêu trình tự các bước phải làm ngay và giải thích lý do.

#### Đáp án

1. **Bước 1 (Quan trọng nhất):** Đăng nhập ngay vào Stripe, vào mục API Keys để **thu hồi (roll / revoke)** khóa `sk_live_XXXX...` cũ và tạo khóa mới. *Lý do:* Nửa tiếng trên diễn đàn công khai là quá đủ để bot hoặc người khác lưu lại ảnh chứa khóa thật; xóa bài đăng không thu hồi được thông tin đã lộ.
2. **Bước 2:** Cập nhật khóa mới vào `.env.local` ở máy cá nhân và **Environment Variables** trên Vercel, sau đó triển khai lại (redeploy).
3. **Bước 3:** Mở lịch sử giao dịch (Logs / Events) trên Stripe kiểm tra xem nửa tiếng qua có phát sinh giao dịch hay hoàn tiền bất thường nào từ khóa cũ không.
4. **Bước 4:** Xóa dòng `console.log` đã in khóa bí mật ra Terminal để tránh lặp lại sự cố.

## Lỗi suy luận hay gặp

### "Kho chứa (repo) GitHub của tôi để chế độ riêng tư (Private) nên viết thẳng khóa vào code cũng không sao"

- **Vì sao sai:** Repo riêng tư vẫn có thể lộ khi mời thêm người, cài công cụ bên thứ ba, tải về nhiều máy, hoặc chuyển nhầm sang công khai. Ngoài ra, khi copy code dán vào khung chat AI để hỏi lỗi, khóa cũng bị gửi đi.
- **Cách sửa:** Dù dự án riêng tư hay thử nghiệm, khóa bí mật luôn phải nằm trong biến môi trường, không bao giờ nằm trong file code.

### "Đã xóa file `.env` rồi commit đè lên là khóa trên GitHub đã được dọn sạch"

- **Vì sao sai:** Mọi commit trước đó đều được Git lưu vĩnh viễn trong thư mục lịch sử `.git`. Bất kỳ ai xem lịch sử commit (Commits history) đều mở lại được nội dung file `.env` lúc chưa xóa.
- **Cách sửa:** Coi mọi khóa từng chạm vào Git là **đã bị lộ hoàn toàn**. Hãy thu hồi và tạo khóa mới ngay thay vì chỉ xóa file trong Git.

### "Chỉ cần không lộ API key ra trình duyệt là không ai xài chùa tiền AI của mình được"

- **Vì sao sai:** Giấu API key ở máy chủ chỉ ngăn người ngoài lấy cắp chìa khóa, nhưng các đường dẫn `/api/...` của bạn vẫn mở tự do nếu thiếu bước kiểm tra ở cửa.
- **Cách sửa:** Với mọi API route gọi dịch vụ tốn phí (AI, SMS, email), luôn kiểm tra xác thực đăng nhập và giới hạn số lần gọi (rate limiting).

## Bài tập thực hành

Rà một luồng sử dụng khóa trong mã nguồn project và tạo bản mô tả đã che thông tin nhạy cảm. Không cần tạo hay thu hồi khóa thật.

### Việc cần làm

1. Chọn file khởi tạo SDK ở máy chủ, tìm `apiKey` hoặc tên biến có `SECRET`; không mở `.env*`.
2. Theo dõi từ tên biến đến lời gọi SDK, log và `Response.json`. Nếu gặp giá trị nghi là khóa thật, không chép, không chụp ảnh hoặc gửi cho AI.
3. Ghi đường đi bằng tên biến và tên file. Trong ghi chú dùng duy nhất chuỗi giả `KHOA_GIA_KHONG_SU_DUNG_DUOC` thay mọi giá trị nhạy cảm.
4. Đánh dấu nơi cần rà thêm và tự kiểm tra ghi chú không có token, mật khẩu, URL chứa khóa hay dữ liệu khách hàng. Không gọi dịch vụ để thử khóa.

### Kết quả đúng

Có sơ đồ nguồn cấu hình → SDK → phản hồi/log và kết luận có bằng chứng. Ghi chú chỉ chứa tên biến, file và chuỗi giả; không kết luận toàn bộ project an toàn chỉ vì đã rà một luồng.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy lệnh hoặc gọi dịch vụ. Rà sơ đồ đã che bí mật tôi cung cấp: khóa có thể ra response, URL hoặc log ở đâu? Chỉ dùng dữ liệu đã che trong tin nhắn, không tự mở thêm file. Nêu giới hạn của kết luận.
```
