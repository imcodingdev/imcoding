---
id: ai-cost-limits
title: Hạn mức chi phí, quota và rate limit
group: deploy
prerequisites: [api-endpoint, security-boundaries, deployment-environments]
priority: 2
stage: 3
format: 2
signals:
  - "openai."
  - "max_output_tokens"
  - "maxDuration"
  - "Ratelimit"
  - "429"
  - "OPENAI_API_KEY"
---

## Nhắc lại

### Một API endpoint như `/api/chat` không có nút nào trên giao diện dẫn tới. Người ngoài có gọi được không?

Có. Ai biết đường dẫn đều gửi yêu cầu thẳng tới đó được, bằng công cụ hoặc bằng script, không cần qua giao diện. Việc chặn phải nằm trong code máy chủ của chính endpoint.

### Theo bài ranh giới tin cậy, dữ liệu do trình duyệt gửi lên được coi là gì?

Là dữ liệu chưa đáng tin. Máy chủ phải tự kiểm tra người gọi là ai, được làm gì và gửi lên bao nhiêu, thay vì tin vào những gì giao diện đã kiểm tra.

## Đoán trước

App của bạn có nút "Tóm tắt tài liệu" gọi API của một nhà cung cấp AI. Khóa được cất đúng chỗ trong biến môi trường của máy chủ, không lộ xuống trình duyệt, không lên Git. Tối thứ Bảy, một người lạ viết script gọi endpoint `/api/summarize` liên tục, mỗi lần dán vào một văn bản dài bằng cả cuốn sách. Sáng thứ Hai bạn nhận hóa đơn cao gấp nhiều lần cả tháng trước. Khóa không hề lộ, vậy tiền đi đâu, và lẽ ra thứ gì phải dừng chuyện này lại?

### Đáp án

Kẻ gọi không cần khóa. Endpoint của bạn cầm khóa và gọi AI thay cho bất kỳ ai gõ cửa. Nhà cung cấp tính tiền theo **token** (đơn vị đo độ dài văn bản gửi đi và nhận về), nên càng nhiều lượt và văn bản càng dài thì càng tốn. Không lớp nào dừng nó lại vì không lớp nào được đặt: không hạn mức ngân sách ở nhà cung cấp, không kiểm tra đăng nhập, không giới hạn số lượt mỗi người, không giới hạn độ dài đầu vào.

## Ví dụ mẫu

Với app gọi AI, các lớp đó là:

- **Budget (hạn mức ngân sách)** đặt ở trang quản trị của nhà cung cấp AI. Đây là lớp ngoài cùng, chặn được cả khi code của bạn có lỗi. Lưu ý đọc kỹ: tùy nhà cung cấp và tùy loại, có hạn mức chặn hẳn khi chạm trần, có loại chỉ gửi email cảnh báo.
- **Quota (hạn ngạch) theo người dùng:** mỗi tài khoản được bao nhiêu lượt một ngày hoặc một tháng, đếm trong database.
- **Rate limit (giới hạn tần suất):** mỗi người được bao nhiêu lượt trong một phút. Vượt thì trả mã `429`.
- **Giới hạn độ dài đầu vào và đầu ra:** chặn văn bản quá dài trước khi gọi AI, và đặt trần cho câu trả lời.
- **Timeout (giới hạn thời gian chờ):** quá lâu thì bỏ, không để yêu cầu treo.

Endpoint SAI, kiểu AI hay viết khi bạn chỉ yêu cầu "thêm tính năng tóm tắt":

```ts
export async function POST(req: Request) {
  const { text } = await req.json() // dài bao nhiêu cũng nhận
  const answer = await openai.responses.create({
    model: 'gpt-5-mini',
    input: text // không biết ai gọi, không đếm lượt, không có trần
  })
  return Response.json({ text: answer.output_text })
}
```

Endpoint ĐÚNG hơn, mỗi dòng chặn là một lớp:

```ts
export const maxDuration = 30 // Vercel ngắt hàm sau 30 giây
export async function POST(req: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  const { success } = await ratelimit.limit(user.id) // đếm lượt theo từng người
  if (!success) return Response.json({ error: 'Quá nhiều lượt' }, { status: ___ })
  const { text } = await req.json()
  if (typeof text !== 'string' || text.length > 4000)
    return Response.json({ error: 'Nội dung quá dài' }, { status: 400 })
  const answer = await openai.responses.create(
    { model: 'gpt-5-mini', input: text, max_output_tokens: 800 },
    { timeout: 20_000 }) // quá 20 giây thì bỏ
  return Response.json({ text: answer.output_text })
}
```

`ratelimit` ở đây là một bộ đếm lưu ở kho bên ngoài (ví dụ thư viện `@upstash/ratelimit`). Bộ đếm phải nằm ngoài code vì trên Vercel, mỗi yêu cầu có thể do một bản chạy khác nhau của hàm xử lý, biến trong bộ nhớ không dùng chung được.

Còn một lớp nữa nối với bài môi trường: bản Preview và máy làm việc dùng khóa AI riêng với hạn mức thấp. Một vòng lặp lỗi do agent viết ra lúc thử sẽ không đốt ngân sách của bản thật.

## Tìm trong project của bạn

1. **Tìm mọi nơi gọi dịch vụ tính tiền:** Tìm toàn dự án `openai`, `anthropic`, `generateText`, `streamText`, `resend`, `twilio`. Ghi lại từng file. AI, email và SMS đều tính tiền theo lượt.
2. **Kiểm tra từng endpoint theo năm câu hỏi:** Có kiểm tra đăng nhập trước khi gọi không (`auth.getUser()`)? Có đếm lượt theo người không (tìm `ratelimit`, `limit(`, `429`)? Có chặn độ dài đầu vào không (tìm `.length >`, `.max(`)? Có trần đầu ra không (`max_output_tokens`, `max_tokens`, `maxOutputTokens`)? Có timeout không (`timeout`, `maxDuration`, `AbortSignal`)? Đủ cả năm là ổn. Thiếu kiểm tra đăng nhập hoặc thiếu đếm lượt là có vấn đề.
3. **Xem bộ đếm nằm ở đâu:** Nếu thấy `new Map()` hoặc một biến khai báo ngoài hàm dùng để đếm lượt, đó là bộ đếm trong bộ nhớ. Trên Vercel nó đếm thiếu.
4. **Tìm vòng lặp quanh lời gọi AI:** Tìm `while`, `for`, `retry` ở gần các lời gọi. Vòng thử lại không có số lần tối đa là thứ có thể tự đốt tiền mà không cần kẻ xấu nào.
5. **Mở trang quản trị của nhà cung cấp AI:** Tìm mục Limits, Budget hoặc Billing. Ghi lại hạn mức tháng đang đặt, loại chặn hẳn hay chỉ cảnh báo, và email nhận cảnh báo là của ai.
6. **Ghi lại kết quả:**
   - Số endpoint gọi dịch vụ tính tiền: `[ ... ]`
   - Endpoint thiếu kiểm tra đăng nhập hoặc thiếu đếm lượt: `[ tên file: ... / Không có ]`
   - Hạn mức ở nhà cung cấp: `[ số tiền: ... / chưa đặt ]`
   - Preview và Production dùng chung khóa AI: `[ Có / Không ]`

## Tự giải thích

### Vì sao đã có rate limit trong code rồi vẫn cần đặt hạn mức ngân sách ở nhà cung cấp?

Vì hai lớp chặn hai loại hỏng khác nhau. Rate limit trong code chỉ có tác dụng khi code chạy đúng và phủ hết mọi endpoint. Hạn mức ở nhà cung cấp nằm ngoài code của bạn nên vẫn đứng vững khi code sai.

### Vì sao phải đếm lượt theo tài khoản đã đăng nhập thay vì chỉ theo địa chỉ IP?

Kẻ lạm dụng đổi địa chỉ IP rất dễ, trong khi nhiều người dùng thật ở cùng văn phòng lại chung một IP và bị chặn oan. Đếm theo tài khoản gắn chi phí với một danh tính bạn kiểm soát được: khóa được, nâng hạn mức được, tính tiền được. Endpoint mở cho người chưa đăng nhập thì mới phải dựa vào IP và cần hạn mức chặt hơn nhiều.

### Nếu bỏ giới hạn độ dài đầu vào mà vẫn giữ rate limit thì điều gì có thể xảy ra?

Số lượt bị chặn nhưng giá mỗi lượt thì không. Mười lượt một phút với văn bản dài bằng cuốn sách tốn hơn nhiều lần mười lượt với một đoạn ngắn, vì tiền tính theo token. Rate limit giới hạn tần suất, giới hạn độ dài mới giới hạn giá của từng lượt.

## Trắc nghiệm

### AI viết bộ đếm lượt như dưới đây và báo "đã thêm rate limit". App chạy trên Vercel. Vấn đề là gì?

```ts
const counts = new Map<string, number>() // nằm ngoài hàm POST

export async function POST(req: Request) {
  const n = (counts.get(userId) ?? 0) + 1
  counts.set(userId, n)
  if (n > 10) return new Response('Too many', { status: 429 })
}
```

- [ ] Không có vấn đề, `Map` là cách chuẩn để đếm lượt
- [x] Bộ đếm nằm trong bộ nhớ của từng bản chạy, các bản khác không thấy nhau và bộ đếm mất khi bản chạy bị tắt
- [ ] Mã `429` sai, phải trả `401`
- [ ] `Map` sẽ làm lộ `userId` xuống trình duyệt

**Giải thích:** Trên nền tảng như Vercel, nhiều bản của hàm chạy song song và bị tắt mở liên tục, mỗi bản có một `Map` riêng. Ngoài ra bộ đếm này không bao giờ về 0 theo thời gian. Mã `429` là đúng, và `Map` trên máy chủ không lộ ra ngoài.

### Bạn nhận email này từ nhà cung cấp AI lúc 3 giờ sáng. Việc nào nên làm đầu tiên?

```text
Usage alert: your organization has reached 80% of its monthly budget.
Requests in the last hour: 41,200 (typical: 300)
```

- [ ] Nâng hạn mức ngân sách để app không bị gián đoạn
- [ ] Chờ tới sáng xem lượng yêu cầu có tự giảm không
- [ ] Nhờ agent tối ưu lại câu lệnh gửi cho AI để mỗi lượt rẻ hơn
- [x] Chặn nguồn tiêu thụ: tạm tắt tính năng hoặc thu hồi khóa đang bị dùng, rồi mới tìm endpoint nào bị gọi

**Giải thích:** Lượng yêu cầu gấp hơn một trăm lần bình thường là dấu hiệu lạm dụng hoặc vòng lặp lỗi, không phải tăng trưởng. Nâng hạn mức chỉ cho nó đốt thêm. Tối ưu câu lệnh không dừng được dòng yêu cầu.

### Cấu hình nào dưới đây giúp một lỗi vòng lặp ở bản Preview không ảnh hưởng tới ngân sách của bản thật?

- [ ] Dùng chung một khóa AI cho mọi môi trường để dễ theo dõi tổng chi phí
- [ ] Đặt tên biến là `NEXT_PUBLIC_OPENAI_API_KEY` ở Preview
- [x] Preview và Development dùng khóa riêng, thuộc một project riêng ở nhà cung cấp, có hạn mức thấp
- [ ] Chỉ cần ghi chú trong README rằng không được thử tính năng AI trên Preview

**Giải thích:** Khóa riêng với hạn mức riêng nghĩa là bản thử chạm trần của nó thì dừng, bản thật không bị kéo theo. Dùng chung khóa là dùng chung ngân sách. Tiền tố `NEXT_PUBLIC_` làm lộ khóa. Ghi chú không chặn được agent hay script.

### Endpoint `/api/chat` đã kiểm tra đăng nhập và giới hạn 20 lượt một phút cho mỗi người. Việc đăng ký tài khoản miễn phí, không cần xác minh email. Lỗ hổng còn lại là gì?

- [x] Kẻ xấu tạo hàng loạt tài khoản, mỗi tài khoản lại có đủ 20 lượt một phút
- [ ] Không còn lỗ hổng, vì mọi lượt gọi đều gắn với tài khoản
- [ ] Người dùng thật sẽ bị lộ mật khẩu qua endpoint này
- [ ] Rate limit làm khóa AI hết hạn nhanh hơn

**Giải thích:** Giới hạn theo tài khoản chỉ mạnh bằng độ khó của việc tạo tài khoản. Đăng ký tự do thì giới hạn nhân lên theo số tài khoản giả. Vì vậy cần thêm quota theo ngày cho tài khoản miễn phí, xác minh email, và hạn mức ngân sách tổng ở nhà cung cấp.

## Kiểm tra không dùng AI

### Tình huống: Bạn dùng Bolt làm app "trợ lý viết bài". Trang chủ có ô dùng thử không cần đăng nhập, gọi endpoint dưới đây. Tuần sau bạn chạy quảng cáo. Hãy nêu các rủi ro về chi phí và những gì bạn yêu cầu AI bổ sung, kèm lý do.

```ts
export async function POST(req: Request) {
  const { topic, length } = await req.json()
  const answer = await openai.responses.create({
    model: 'gpt-5',
    input: `Viết bài ${length} chữ về: ${topic}`
  })
  return Response.json({ text: answer.output_text })
}
```

#### Đáp án

1. **Ai cũng gọi được, bao nhiêu lần cũng được.** Yêu cầu thêm giới hạn theo IP cho khách chưa đăng nhập, ví dụ vài lượt mỗi ngày, lưu bộ đếm ở kho bên ngoài. *Lý do:* quảng cáo kéo cả người dùng thật lẫn script tự động.
2. **`length` do trình duyệt gửi lên.** Người gọi tự đặt `length` là một triệu được. Yêu cầu máy chủ chỉ chấp nhận vài giá trị cố định và đặt `max_output_tokens`. *Lý do:* giá mỗi lượt phải do máy chủ quyết định.
3. **`topic` không giới hạn độ dài.** Yêu cầu chặn ở vài trăm ký tự. *Lý do:* đầu vào cũng tính tiền.
4. **Model đắt cho bản dùng thử.** Cân nhắc model rẻ hơn cho khách chưa đăng nhập.
5. **Không có timeout và không có hạn mức ở nhà cung cấp.** Đặt cả hai trước ngày chạy quảng cáo, kèm email cảnh báo gửi về hộp thư bạn đọc hằng ngày. *Lý do:* đây là lớp cuối cùng khi các lớp trong code có sót.

## Lỗi suy luận hay gặp

### "Khóa API không lộ thì không ai tiêu tiền của tôi được"

- **Vì sao sai:** Endpoint của bạn chính là người cầm khóa tiêu tiền thay cho người gọi.
- **Cách sửa:** Mỗi endpoint gọi dịch vụ tính tiền phải có kiểm tra đăng nhập, đếm lượt, giới hạn độ dài và trần đầu ra.

### "App chưa có mấy người dùng nên chưa cần đặt hạn mức"

- **Vì sao sai:** Hóa đơn bất ngờ hiếm khi đến từ người dùng thật. Nó đến từ script quét endpoint công khai, từ vòng lặp lỗi trong chính code của bạn, hoặc từ agent chạy thử cả đêm.
- **Cách sửa:** Đặt hạn mức ngân sách ở nhà cung cấp ngay ngày tạo khóa, ở mức bạn chấp nhận mất được.

### "Đặt cảnh báo qua email là đã có hạn mức"

- **Vì sao sai:** Cảnh báo chỉ báo tin, không dừng gì cả.
- **Cách sửa:** Phân biệt rõ loại chặn hẳn và loại chỉ báo trong trang quản trị. Nếu nhà cung cấp chỉ có cảnh báo, quota trong code của bạn phải là lớp chặn hẳn.

## Bài tập thực hành

Mục tiêu: tự thấy endpoint AI của mình phản ứng thế nào khi bị gọi dồn dập và khi nhận đầu vào quá dài. Chỉ làm trên máy cá nhân hoặc bản Preview, với khóa AI của môi trường thử.

### Việc cần làm

1. Xác nhận bản đang thử dùng khóa AI của môi trường thử và khóa đó có hạn mức thấp ở nhà cung cấp.
2. Mở tính năng AI trên bản thử, mở DevTools → tab Network, bấm gửi một lần và ghi lại đường dẫn endpoint cùng mã trạng thái.
3. Bấm gửi liên tục khoảng 15 lần trong một phút. Ghi lại: có lượt nào trả mã `429` không, từ lượt thứ mấy.
4. Dán một văn bản rất dài, khoảng 20 trang, vào ô nhập rồi gửi. Ghi lại mã trạng thái và thông báo nhận được.
5. Đăng xuất rồi thử gọi lại tính năng. Ghi lại mã trạng thái.
6. Ghi ba kết quả vào một bảng và đánh dấu lớp nào chưa có.

### Kết quả đúng

Bạn có ba dòng ghi chép. Kết quả tốt là: gọi dồn dập thì nhận `429` sau một số lượt, văn bản quá dài thì nhận `400` hoặc thông báo từ chối trước khi AI kịp chạy, chưa đăng nhập thì nhận `401`. Lượt nào vẫn trả `200` ở ba phép thử trên là một lớp còn thiếu, đưa vào danh sách cần sửa.

### Nhờ AI rà lại

```text
Hãy rà dự án này và CHỈ BÁO CÁO, không sửa file.
1. Liệt kê mọi endpoint và Server Action gọi dịch vụ tính tiền theo lượt (AI, email, SMS).
2. Với mỗi nơi, cho biết có hay không: kiểm tra đăng nhập, rate limit, quota theo người dùng,
   giới hạn độ dài đầu vào, trần đầu ra, timeout. Trình bày dạng bảng.
3. Chỉ ra bộ đếm nào đang lưu trong bộ nhớ và vòng lặp thử lại nào không có số lần tối đa.
```
