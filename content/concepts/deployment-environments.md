---
id: deployment-environments
title: Môi trường thử và môi trường thật
group: deploy
prerequisites: [hosting-deploy, environment-variables, secrets]
priority: 2
stage: 3
format: 2
signals:
  - "VERCEL_ENV"
  - "NEXT_PUBLIC_SUPABASE_URL"
  - "SUPABASE_SERVICE_ROLE_KEY"
  - "DATABASE_URL"
  - ".env.production"
---

## Nhắc lại

### Sau khi sửa một biến trong Settings → Environment Variables trên Vercel, vì sao trang web đang chạy chưa nhận giá trị mới?

Vì bản đang chạy đã được build với giá trị cũ. Phải Redeploy thì bản build mới mới đọc giá trị mới. Với biến có tiền tố `NEXT_PUBLIC_`, giá trị còn được chép cứng vào JavaScript ngay lúc build.

### Một khóa bí mật đã nằm trong `.env.local` và không lên Git. Nó còn có thể lộ hoặc bị dùng sai bằng đường nào?

Bất kỳ chương trình nào chạy trên máy bạn cũng đọc được file đó, gồm cả công cụ AI viết code. Khóa cũng lộ khi bị in ra log, dán vào khung chat, hoặc gắn nhầm tiền tố `NEXT_PUBLIC_`.

## Đoán trước

Bạn nhờ agent (công cụ AI tự chạy lệnh trên máy bạn, như Claude Code hay Cursor ở chế độ agent) viết tính năng "dọn tài khoản không hoạt động". Tuần trước app trên máy bị lỗi kết nối, bạn đã chép nguyên bộ biến từ Vercel về `.env.local` cho nhanh, trong đó có `DATABASE_URL` của database thật. Agent viết xong, tự chạy script để kiểm tra rồi báo "đã chạy thử thành công, xóa 212 tài khoản". Sáng hôm sau khách nhắn không đăng nhập được. Bạn chưa hề deploy gì, vậy vì sao dữ liệu thật vẫn mất?

### Đáp án

Vì "chạy thử trên máy" không có nghĩa là "chạy trên dữ liệu thử". Code chạy ở đâu không quan trọng bằng nó đang cầm khóa của database nào. `.env.local` trỏ vào database thật, nên script trên máy bạn xóa thẳng dữ liệu của khách. Agent không phân biệt được thật với thử, nó chỉ dùng thứ đang có trong file. Chuyện này đã được kể công khai: trong vụ Replit năm 2025, theo tường thuật của người dùng, agent đã xóa database thật ngay trong lúc đang có lệnh đóng băng code. Cách phòng không phải là dặn AI cẩn thận hơn, mà là để máy làm việc không có khóa của database thật.

## Ví dụ mẫu

Một quán ăn có bếp thử món và phòng ăn của khách. Món mới được nấu, nếm, đổ đi ở bếp thử. Không ai mang nồi đang thử ra bàn khách, và phụ bếp tập sự không cầm chìa khóa két.

Trong phần mềm, **environment (môi trường)** là một bộ gồm: bản code đang chạy, các biến môi trường, và database mà nó nối tới. Vercel chia sẵn ba môi trường:

- **Development:** app chạy trên máy bạn bằng `npm run dev`.
- **Preview (bản xem trước):** mỗi lần đẩy code lên một nhánh không phải nhánh chính, Vercel build một bản riêng có đường dẫn riêng.
- **Production (bản thật):** bản build từ nhánh chính, gắn tên miền thật, khách đang dùng.

Mỗi biến trên Vercel được chọn áp cho môi trường nào. Lỗi hay gặp là AI hoặc chính bạn tích cả ba ô cho cùng một giá trị. Khi đó Preview chỉ khác bản thật ở đường dẫn, còn dữ liệu vẫn là của khách.

Cấu hình SAI (ba môi trường dùng chung một database):

```bash
# Vercel → Settings → Environment Variables
# Tên biến                    Production  Preview  Development
NEXT_PUBLIC_SUPABASE_URL      # cùng một giá trị: https://prodxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY     # cùng một khóa quản trị của project thật
# Hậu quả: bấm thử nút "Xóa" trên bản Preview là xóa dữ liệu khách
```

Cấu hình ĐÚNG là có hai project Supabase riêng, ví dụ `myapp-prod` và `myapp-dev`. Production nhận URL và khóa của `myapp-prod`. Preview, Development và file `.env.local` nhận URL và khóa của `myapp-dev`. Khóa quản trị của project thật chỉ nằm ở ô Production trên Vercel, không nằm trên máy nào.

Thêm một chốt chặn trong những script có thể ghi đè hoặc xóa dữ liệu:

```ts
// scripts/seed.ts: tạo dữ liệu mẫu, chỉ dành cho project thử
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const PROD_REF = 'prodxxxx' // mã project thật (ví dụ giả)

if (url.includes(PROD_REF) || process.env.VERCEL_ENV === 'production') {
  // Dừng ngay, vì script này sẽ ___ nếu chạy nhầm chỗ
  throw new Error('Từ chối chạy trên môi trường thật')
}
```

`VERCEL_ENV` là biến Vercel tự gắn, có giá trị `production`, `preview` hoặc `development`. Chốt chặn này chỉ là lớp phụ. Lớp chính vẫn là: máy làm việc không có khóa thật.

## Tìm trong project của bạn

1. **Đếm số project database:** Mở trang quản trị Supabase. Có một hay hai project? Tên có cho biết cái nào thật, cái nào thử không?
2. **Xem `.env.local` trỏ đi đâu:** Mở file, nhìn `NEXT_PUBLIC_SUPABASE_URL` và `DATABASE_URL`. So đoạn mã project trong URL với project thật. Trùng nhau là có vấn đề.
3. **Xem ô môi trường trên Vercel:** Vào Settings → Environment Variables. Với từng biến liên quan database, thanh toán, email, AI, xem nó áp cho môi trường nào. Preview và Production chung một giá trị là có vấn đề. Riêng khóa thanh toán: Preview phải dùng khóa chế độ test.
4. **Tìm nơi dùng khóa quản trị:** Tìm toàn dự án `SERVICE_ROLE` và `service_role`. Khóa này bỏ qua RLS (bộ quy tắc phân quyền từng dòng của Supabase). Ghi lại file nào dùng và có script nào chạy tay không.
5. **Xem agent được nối vào đâu:** Tìm file `.mcp.json`, `.cursor/mcp.json` hoặc phần cài đặt kết nối database của công cụ AI. Nếu agent nối thẳng vào Supabase, mã project trong đó phải là project thử.
6. **Kiểm tra ai mở được bản Preview:** Vào Settings → Deployment Protection trên Vercel xem bản Preview có bắt đăng nhập không.
7. **Ghi lại kết quả:**
   - Số project database: `[ 1 / 2 ]`
   - `.env.local` đang trỏ vào: `[ project thử / project thật ]`
   - Preview dùng chung database với Production: `[ Có / Không ]`
   - Khóa quản trị của project thật có trên máy cá nhân: `[ Có / Không ]`

## Tự giải thích

### Vì sao chỉ tạo bản Preview trên Vercel là chưa đủ để gọi là có môi trường thử?

Preview chỉ tách bản code. Nếu biến môi trường của Preview vẫn là URL và khóa của project thật, mọi thao tác thử đều ghi vào dữ liệu khách: đơn hàng giả, email gửi thật, tài khoản bị sửa. Môi trường thử chỉ có nghĩa khi nó có database riêng, khóa riêng, và các dịch vụ bên ngoài ở chế độ test.

### Vì sao không nên để khóa quản trị của database thật trong `.env.local`, kể cả khi bạn tin công cụ AI của mình?

Agent đọc được mọi file trong thư mục dự án và chạy được lệnh trong terminal. Một script kiểm tra, một lệnh migration, một lần hiểu sai yêu cầu là đủ để ghi vào dữ liệu thật, và khóa quản trị bỏ qua luôn RLS. Lòng tin không thay được giới hạn quyền. Không có khóa thì lỗi nặng nhất cũng chỉ làm hỏng dữ liệu thử.

### Nếu project thử và project thật có cấu trúc bảng khác nhau thì việc thử trên Preview còn đáng tin không?

Kém đi nhiều. Tính năng chạy tốt trên Preview có thể lỗi trên bản thật vì thiếu cột, thiếu bảng, hoặc thiếu chính sách RLS. Hai project phải được đưa về cùng cấu trúc bằng cùng một cách, không sửa tay riêng từng nơi.

## Trắc nghiệm

### Bạn thấy cấu hình này trên Vercel. Điều gì đúng?

```text
DATABASE_URL    Production, Preview, Development
                postgresql://postgres:XXXX@db.prodxxxx.supabase.co:5432/postgres
```

- [ ] An toàn, vì Preview có đường dẫn riêng nên dữ liệu cũng riêng
- [ ] An toàn, miễn là không ai ngoài bạn biết đường dẫn Preview
- [x] Mọi bản Preview đang đọc và ghi vào database thật
- [ ] Vercel sẽ tự tạo một database trống cho mỗi bản Preview

**Giải thích:** Một giá trị áp cho cả ba môi trường nghĩa là cả ba nối vào cùng một database. Đường dẫn riêng chỉ tách bản code. Vercel không tự tạo database, và việc giữ kín đường dẫn không thay đổi nơi dữ liệu được ghi.

### Agent báo: "Tôi cần `SUPABASE_SERVICE_ROLE_KEY` của production trong `.env.local` để chạy script sửa dữ liệu lỗi." Cách xử lý nào hợp lý nhất?

- [x] Không đưa khóa. Cho agent viết và chạy thử script trên project thử, bạn đọc script, rồi tự chạy trên bản thật sau khi đã có bản sao lưu
- [ ] Đưa khóa, xong việc thì xóa dòng đó khỏi `.env.local`
- [ ] Đưa khóa nhưng dặn agent chỉ được đọc, không được ghi
- [ ] Thêm tiền tố `NEXT_PUBLIC_` để agent đọc được mà không cần chép file

**Giải thích:** Trong lúc khóa nằm trên máy, agent có toàn quyền với dữ liệu thật, lời dặn không phải là giới hạn kỹ thuật. Xóa dòng sau khi xong không hoàn tác được việc đã chạy. Tiền tố `NEXT_PUBLIC_` còn làm khóa lộ xuống trình duyệt.

### Bạn tạo project thử `myapp-dev`, đổi biến của Preview sang project này. Bản Preview mở lên báo lỗi `relation "orders" does not exist`. Nguyên nhân hợp lý nhất?

- [ ] Vercel chưa Redeploy nên vẫn nối vào project cũ
- [x] Project thử mới tạo chưa có các bảng, vì cấu trúc bảng chưa được áp vào đó
- [ ] Khóa của project thử không có quyền đọc bảng `orders`
- [ ] Bảng `orders` chỉ tồn tại ở môi trường Production theo quy định của Supabase

**Giải thích:** Lỗi nói bảng không tồn tại, tức app đã nối được vào project mới nhưng project đó trống. Nếu chưa Redeploy thì app vẫn chạy bình thường với project cũ. Thiếu quyền sẽ cho lỗi khác, không phải lỗi thiếu bảng.

### Dòng nào trong `.env.local` cho thấy máy bạn đang ở trạng thái rủi ro?

```bash
NEXT_PUBLIC_SUPABASE_URL="https://devxxxx.supabase.co"
STRIPE_SECRET_KEY="sk_test_XXXX"
DATABASE_URL="postgresql://postgres:XXXX@db.prodxxxx.supabase.co:5432/postgres"
```

- [ ] Dòng 1, vì URL có tiền tố `NEXT_PUBLIC_`
- [ ] Dòng 2, vì khóa Stripe không được nằm trên máy cá nhân
- [x] Dòng 3, vì chuỗi kết nối trỏ vào project thật
- [ ] Không dòng nào, vì file này không lên Git

**Giải thích:** URL của Supabase vốn là thông tin công khai, khóa `sk_test_` là khóa chế độ thử. Dòng 3 cho mọi script và lệnh migration trên máy quyền ghi thẳng vào database thật. Còn nguy hiểm hơn vì hai dòng đầu khiến bạn tưởng mình đang ở môi trường thử.

## Kiểm tra không dùng AI

### Tình huống: Bạn dùng Lovable nối với một project Supabase duy nhất, app đã có 300 người dùng thật. Bạn muốn AI làm lại toàn bộ phần đặt lịch, trong đó có đổi cấu trúc hai bảng. Hãy nêu rủi ro nếu cứ làm như cũ và các bước chuẩn bị trước khi bắt đầu, kèm lý do.

#### Đáp án

1. **Rủi ro:** Chỉ có một project nên mọi thay đổi AI làm đều rơi thẳng vào dữ liệu của 300 người dùng. Trong lúc AI sửa dở, bảng có thể thiếu cột hoặc mất dữ liệu, và khách thấy lỗi ngay. Hoàn tác code không trả lại dữ liệu.
2. **Tạo project Supabase thứ hai làm môi trường thử**, áp cùng cấu trúc bảng và chính sách RLS, nạp dữ liệu giả. *Lý do:* cần một nơi mà hỏng cũng không sao.
3. **Trỏ công cụ AI và bản xem trước vào project thử.** *Lý do:* AI chỉ nên cầm khóa của nơi được phép hỏng.
4. **Làm và nghiệm thu trên bản thử** cho tới khi phần đặt lịch chạy đúng.
5. **Sao lưu database thật rồi mới áp thay đổi cấu trúc**, do bạn chủ động thực hiện vào giờ vắng. *Lý do:* đây là bước duy nhất chạm vào dữ liệu thật, phải có đường lui.

## Lỗi suy luận hay gặp

### "Tôi chạy trên localhost nên chắc chắn không đụng tới dữ liệu thật"

- **Vì sao sai:** Localhost chỉ nói code chạy trên máy bạn. Dữ liệu nằm ở nơi biến môi trường trỏ tới. `.env.local` chứa URL của project thật thì localhost chính là bản thật với giao diện đang sửa dở.
- **Cách sửa:** Trước mỗi phiên làm việc với agent, nhìn mã project trong `.env.local`. Chỉ giữ khóa của project thử trên máy.

### "App còn nhỏ, tách hai môi trường là thừa, khi nào lớn hẵng làm"

- **Vì sao sai:** Rủi ro không đến từ quy mô mà từ việc AI sửa code và chạy lệnh mỗi ngày trên dữ liệu khách. Mười khách trả tiền mất dữ liệu cũng là sự cố thật. Tách càng muộn càng khó vì cấu trúc bảng đã bị sửa tay nhiều lần.
- **Cách sửa:** Tạo project thử ngay khi có người dùng thật đầu tiên.

### "Preview và Production dùng chung database thì thử mới sát thực tế"

- **Vì sao sai:** Sát thực tế là giống về cấu trúc và cấu hình, không phải dùng chung dữ liệu. Thử trên dữ liệu khách nghĩa là mỗi lỗi của bản thử thành sự cố của bản thật.
- **Cách sửa:** Giữ hai project cùng cấu trúc, dùng dữ liệu giả có hình dạng giống dữ liệu thật.

## Bài tập thực hành

Mục tiêu: lập bảng "biến nào, môi trường nào, trỏ đi đâu" cho app của bạn và biết chắc máy làm việc đang cầm khóa của project nào. Bài này chỉ đọc và ghi chép, không sửa cấu hình.

### Việc cần làm

1. Mở Vercel → Settings → Environment Variables. Chép tên từng biến và các môi trường nó áp vào một bảng. Không chép giá trị khóa.
2. Với biến liên quan database, ghi thêm mã project trong URL (đoạn chữ trước `.supabase.co`).
3. Mở `.env.local`, ghi mã project mà máy bạn đang trỏ vào.
4. Đánh dấu đỏ mọi dòng mà Preview hoặc máy cá nhân trỏ vào project thật.
5. Viết ba dòng kế hoạch: tạo project thử, đổi biến của Preview và Development, gỡ khóa thật khỏi máy.

### Kết quả đúng

Bạn có một bảng mà nhìn vào trả lời được ngay: bản Preview ghi dữ liệu vào đâu, máy bạn ghi dữ liệu vào đâu, và khóa quản trị của project thật đang nằm ở những nơi nào. Nếu không còn dòng đỏ, môi trường thử của bạn đã tách thật.

### Nhờ AI rà lại

```text
Hãy rà dự án này và CHỈ BÁO CÁO, không sửa file, không chạy lệnh ghi dữ liệu.
1. Liệt kê mọi nơi đọc biến môi trường liên quan database, thanh toán, email, AI.
2. Liệt kê script nào có thể xóa hoặc ghi đè dữ liệu và nó có chốt chặn môi trường thật không.
3. Không in giá trị của bất kỳ khóa nào, chỉ nêu tên biến và tên file.
```
