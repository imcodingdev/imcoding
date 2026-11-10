---
id: hosting-deploy
title: Đưa ứng dụng lên mạng (Hosting & Deploy)
group: deploy
prerequisites: [git-commit, package-dependencies]
priority: 1
stage: 3
format: 2
signals:
  - "vercel.json"
  - ".vercel"
  - "npm run build"
  - "next build"
  - ".vercel.app"
---

## Nhắc lại

### Khi bạn sửa 3 file trong dự án nhưng chỉ chạy `git add` và `git commit` cho 2 file rồi bấm `git push`, file thứ 3 có xuất hiện trên kho chứa GitHub không?

Không. Git chỉ đưa lên GitHub những thay đổi đã được đưa vào bản ghi (`git add` và `git commit`). File thứ 3 vẫn chỉ nằm trên ổ cứng máy cá nhân của bạn.

### Khi tải một dự án từ GitHub về máy mới (chưa có thư mục `node_modules`), lệnh `npm install` dựa vào file nào để biết cần tải về những thư viện nào?

Lệnh `npm install` đọc danh sách thư viện và phiên bản trong `package.json` (cùng `package-lock.json`) để tải đúng các gói phụ thuộc về máy.

## Đoán trước

Ở máy cá nhân chạy Windows, bạn tạo component tên file là `app/components/button.tsx`, nhưng trong trang thanh toán lại viết `import Button from '@/app/components/Button'`. Khi chạy `npm run dev` trên máy, mọi thứ hiển thị mượt mà. Bạn cũng cài thêm thư viện ngày tháng và thêm khóa `RESEND_API_KEY` vào `.env.local`. Tuy nhiên, ngay khi `git push` lên GitHub để Vercel tự động triển khai (deploy), quá trình lập tức dừng lại và báo lỗi: `Module not found: Can't resolve '@/app/components/Button'`. Tại sao cùng một bộ code mà máy bạn chạy tốt, lên Vercel lại hỏng?

### Đáp án

Windows không phân biệt chữ hoa và chữ thường trong tên file: `button.tsx` và `Button.tsx` là một. Nhưng máy chủ đám mây của Vercel chạy **Linux**, phân biệt tuyệt đối chữ hoa và chữ thường (`Button` khác hẳn `button`), nên khi đóng gói (build) nó không tìm thấy file. Hơn nữa, Vercel là một máy chủ hoàn toàn mới: nó chỉ nhận những file bạn đã `git commit`, tự chạy `npm install` theo `package.json`, chạy lệnh kiểm tra nghiêm ngặt `npm run build`, và chỉ đọc biến môi trường nhập trong mục Settings của Vercel chứ không biết tới file `.env.local` ở máy bạn.

## Ví dụ mẫu

Chạy ứng dụng ở `localhost` giống như **nấu thử món mới trong bếp nhà bạn**: nguyên liệu sẵn quanh bếp, chỉ người nhà nếm được. Muốn bán cho khách, bạn phải thuê **mặt bằng ngoài phố (Hosting)** như Vercel, rồi gửi **công thức nấu (Deploy)** cho đội bếp ở đó. Đội bếp trên Vercel lấy công thức từ GitHub, mua nguyên liệu theo `package.json`, nấu chín và kiểm định chất lượng (bước **Build**), rồi đón khách tại địa chỉ công khai như `ten-du-an.vercel.app`.

Vì máy chủ Vercel tách biệt hoàn toàn với máy bạn, có hai lỗi rất phổ biến khi AI viết code:
1. **Dùng ổ cứng máy chủ để lưu file lâu dài:** Máy chủ Vercel hoạt động theo mô hình hàm ngắn hạn (serverless), ổ đĩa chỉ là tạm thời nên ghi file xong sẽ mất hoặc báo lỗi.
2. **Đẩy code lên mạng mà chưa chạy thử `npm run build` ở máy:** Lúc chạy `npm run dev`, Next.js bỏ qua nhiều lỗi kiểu dữ liệu TypeScript để xem nhanh giao diện, nhưng lúc chạy `npm run build` trên Vercel, có bất kỳ lỗi nào là quá trình dừng lại ngay.

Cách làm SAI trong API route khi chạy trên Vercel (lưu file thẳng vào ổ đĩa máy chủ):

```ts
// SAI: Máy chủ Vercel không giữ lại file ghi trên ổ đĩa lúc đang chạy
import fs from 'fs/promises'

export async function POST(req: Request) {
  const data = await req.json()
  await fs.writeFile('./orders.json', JSON.stringify(data))
  return Response.json({ ok: true })
}
```

Quy trình ĐÚNG trên Terminal trước mỗi lần đưa code lên mạng:

```bash
# Bước 1: Kiểm tra đóng gói và bắt sớm lỗi TypeScript ngay trên máy
npm run ___

# Bước 2: Kiểm tra các file thay đổi (đảm bảo đã lưu package.json nếu có cài gói mới)
git status
git diff

# Bước 3: Lưu bản ghi và đẩy lên GitHub để Vercel tự động cập nhật
git add .
git commit -m "Thêm tính năng thanh toán"
git push
```

## Tìm trong project của bạn

Hãy kiểm tra quy trình đưa ứng dụng lên mạng của dự án theo các bước sau:

1. **Xác định bước đóng gói:** Đọc `scripts.build` trong `package.json` và log build đã có. Ghi lỗi đầu tiên kèm file, dòng, giai đoạn (`install`, `build` hay lúc chạy). Chỉ chạy `npm run build` khi đã biết script và cấu hình không gọi dịch vụ hoặc dữ liệu thật; build có thể thực thi code lấy dữ liệu, không phải chỉ kiểm tra chữ trong file.
2. **Kiểm tra cấu hình bỏ qua lỗi:** Mở `next.config.ts` (hoặc `.mjs`, `.js`), tìm xem AI có tự ý chèn `ignoreBuildErrors: true` để giấu lỗi TypeScript không.
3. **Rà soát thao tác ghi file:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) các từ khóa `fs.writeFile`, `fs.appendFile`, `writeFileSync` xem có tính năng nào đang ghi thẳng dữ liệu người dùng vào thư mục dự án không.
4. **Đối chiếu cấu hình bằng tên, không đọc bí mật:** Tìm `process.env.` trong code, ghi tên biến và phía sử dụng, không mở `.env*`. Nếu có bản ghi triển khai đã che bí mật, đối chiếu mã commit, phạm vi Preview/Production và môi trường dữ liệu. Không có bằng chứng thì ghi chưa xác minh; đếm đủ số biến không chứng minh đúng tên, giá trị hay phạm vi.
5. **Ghi lại kết quả của bạn:**
   - Lệnh `npm run build` trên máy chạy thành công hay báo lỗi?: `[ Thành công / Báo lỗi tại file: ... ]`
   - Trong code có chỗ nào dùng `fs.writeFile` lưu dữ liệu người dùng không?: `[ Có / Không - tên file: ... ]`
   - Tên biến và phạm vi môi trường đã có bằng chứng đối chiếu chưa?: `[ Đã đối chiếu / Chưa xác minh / Thiếu tên biến: ... ]`

Tìm `output`, `ignoreBuildErrors` trong `next.config.*`, `buildCommand`, `outputDirectory` trong `vercel.json` nếu có; không có file này vẫn có thể dùng cấu hình Vercel mặc định. Với nhiều ứng dụng trong một repo, kiểm tra Root Directory từ bản cấu hình triển khai đã che bí mật. Ổn là build đúng thư mục và commit dự kiến, kiểm tra kiểu vẫn bật; có vấn đề là log build ứng dụng khác hoặc Preview nối dữ liệu production. Chỉ ghi tên môi trường, không chép chuỗi kết nối.

## Tự giải thích

### Vì sao có những lúc bạn chạy `npm run dev` trên máy thấy trang web hoạt động bình thường, nhưng khi đẩy lên Vercel (hoặc chạy `npm run build`) thì lại báo lỗi không thể hoàn tất?

Chế độ `npm run dev` chỉ biên dịch từng trang khi bạn mở tới và bỏ qua nhiều bước kiểm tra nghiêm ngặt để hiển thị nhanh. Ngược lại, `npm run build` rà soát toàn bộ dự án, kiểm tra chặt chẽ kiểu dữ liệu TypeScript và tạo sẵn các trang tĩnh; chỉ cần một file có lỗi kiểu dữ liệu hoặc dùng biến không tồn tại, quá trình build sẽ dừng lại.

### Tại sao sau khi bạn vào trang Settings → Environment Variables trên Vercel để thêm hoặc sửa một biến môi trường, trang web đang chạy vẫn chưa nhận ngay giá trị mới mà bạn phải bấm Redeploy?

Mỗi bản triển khai (Deployment) trên Vercel đã được đóng băng cấu hình tại thời điểm nó build xong, đặc biệt các biến `NEXT_PUBLIC_` đã được chép cứng vào file JavaScript. Do đó, sau khi thêm hoặc sửa biến môi trường, bạn phải bấm **Redeploy** để Vercel tạo bản chạy mới nhận cấu hình vừa cập nhật.

### Vì sao trên các nền tảng đám mây như Vercel, bạn không thể lưu ảnh người dùng tải lên hoặc lưu dữ liệu đơn hàng bằng lệnh ghi file `fs.writeFile` vào thư mục dự án?

Trên Vercel, mỗi khi có truy cập, hệ thống bật lên các máy chủ tạm thời (serverless functions) chỉ tồn tại ngắn hạn rồi tự tắt, và thư mục code chỉ cho phép đọc (read-only). Mọi dữ liệu cần giữ lâu dài bắt buộc phải lưu vào Database (như Supabase) hoặc dịch vụ lưu trữ đám mây (như Supabase Storage, AWS S3, Cloudflare R2).

## Trắc nghiệm

### AI bảo cứ thử tạo đơn trên Preview vì không phải Production. Cấu hình đã che cho thấy gì?

```text
Deployment: Preview
Database đích: production
```

- [ ] Preview tự cô lập mọi database nên cứ thử
- [x] Preview vẫn có thể ghi dữ liệu thật; cần môi trường dữ liệu thử riêng trước khi thử tạo đơn
- [ ] Chỉ mở bằng cửa sổ ẩn danh là dữ liệu thành dữ liệu thử

**Giải thích:** Preview cô lập bản triển khai code, không tự thay database hoặc dịch vụ trong cấu hình. Trình duyệt ẩn danh cũng không đổi môi trường mà server kết nối.

### Vercel báo Ready nhưng chức năng đọc danh sách trả lỗi khi mở trang. AI kết luận không thể có lỗi server. Bạn cần xem gì?

```text
Build: thành công
GET /api/catalog: 500
```

- [x] Log lúc request chạy để tìm lỗi runtime của đúng deployment
- [ ] Chỉ xem lại dấu Ready vì nó chứng minh mọi chức năng đã được thử
- [ ] Tắt TypeScript để API không còn trả 500

**Giải thích:** Build thành công chưa kiểm chứng mọi đường chạy khi có yêu cầu thật. Cần đọc log runtime đã che bí mật; tắt kiểm tra kiểu không giải thích hoặc chữa lỗi API.

### AI đề nghị rollback bản deploy và nói cấu trúc database cũng tự quay về. Nhận định nào đúng?

- [ ] Rollback code luôn tự đảo toàn bộ migration
- [ ] Vercel tự xóa bảng mới để khớp code cũ
- [x] Database là hệ thống riêng; cần kiểm tra code cũ có tương thích cấu trúc hiện tại không

**Giải thích:** Đổi bản code phục vụ người dùng không tự hoàn tác thay đổi database. Kế hoạch rollback phải xét tương thích và dữ liệu, không được giả định có thao tác khôi phục tự động.

### Repo có hai ứng dụng. Log cho thấy Vercel đang build ứng dụng khác với trang cần sửa. Cần đối chiếu gì trước?

```text
Repo: apps/shop và apps/admin
Root Directory hiện tại: apps/admin
Trang muốn triển khai: shop
```

- [ ] Chép mọi component shop sang admin để build tìm thấy
- [x] Root Directory và lệnh build phải khớp ứng dụng shop theo cấu trúc repo
- [ ] Chỉ đổi tên miền thì Vercel tự chọn lại thư mục

**Giải thích:** Thư mục gốc triển khai quyết định ứng dụng và cấu hình được build. Tên miền không chọn lại nguồn code; cần xác minh cấu hình trước khi đề xuất thay đổi.

## Kiểm tra không dùng AI

### Tình huống: Bạn vừa nhờ AI tích hợp tính năng gửi hóa đơn qua email bằng thư viện `resend` và biến môi trường `RESEND_API_KEY`. Ở máy bạn mọi thứ chạy hoàn hảo, nhưng sau khi bạn chạy `git add app/api/send-invoice/route.ts`, `git commit` và `git push`, bản cập nhật trên Vercel không chạy được tính năng này. Hãy nêu ít nhất 2 nguyên nhân có thể gây ra sự cố trong cách làm trên và các bước khắc phục.

#### Đáp án

1. **Nguyên nhân 1: Chưa commit `package.json` và `package-lock.json`.**
   - *Giải thích:* Bạn chỉ `git add` mỗi file `route.ts` mà quên `package.json` và `package-lock.json`, nên Vercel không biết cần cài gói `resend` và báo lỗi `Module not found: Can't resolve 'resend'` lúc build.
   - *Khắc phục:* Chạy `git add package.json package-lock.json`, commit và push lên GitHub.
2. **Nguyên nhân 2: Chưa thêm `RESEND_API_KEY` lên Vercel.**
   - *Giải thích:* Khóa `RESEND_API_KEY` mới chỉ nằm trong `.env.local` ở máy cá nhân (không lên Git). Trên Vercel, `process.env.RESEND_API_KEY` sẽ là `undefined` nên không gửi được email.
   - *Khắc phục:* Vào Vercel → **Settings → Environment Variables**, thêm `RESEND_API_KEY` rồi bấm **Redeploy**.
3. **Phòng ngừa:** Luôn chạy `npm run build` và `git status` trên máy trước khi push để phát hiện sớm file còn sót và lỗi đóng gói.

## Lỗi suy luận hay gặp

### "Khi `npm run build` báo lỗi TypeScript đỏ rực, chỉ cần bảo AI bật `typescript: { ignoreBuildErrors: true }` trong `next.config` cho lên mạng nhanh là được"

- **Vì sao sai:** Lỗi TypeScript lúc build chỉ ra những chỗ gọi nhầm tên thuộc tính, truyền thiếu dữ liệu hoặc biến bị `undefined`. Tắt kiểm tra chỉ giúp vượt qua bước build, nhưng khi người dùng thật bấm vào tính năng đó, ứng dụng sẽ sập ngay.
- **Cách sửa:** Không bật `ignoreBuildErrors: true`. Hãy đọc tên file và số dòng trong nhật ký build để sửa đúng nguyên nhân lệch kiểu dữ liệu.

### "Đã `git push` thành công trên Terminal nghĩa là khách hàng vào trang web đã thấy ngay bản mới nhất"

- **Vì sao sai:** `git push` chỉ mới gửi code lên GitHub. Vercel cần thêm vài phút để tải code, cài thư viện và chạy `npm run build`; nếu bước build lỗi, Vercel sẽ giữ nguyên bản cũ đang chạy.
- **Cách sửa:** Sau khi `git push`, luôn kiểm tra bảng **Deployments** của Vercel (hoặc dấu tích xanh trên GitHub) để chắc chắn bản mới đã ở trạng thái **Ready / Production**.

### "Chỉ cần sửa tên file từ `Button.tsx` sang `button.tsx` trên Windows rồi commit là trên GitHub và Vercel cũng tự đổi theo"

- **Vì sao sai:** Do Windows không phân biệt hoa thường, mặc định Git trên Windows không nhận ra việc chỉ đổi chữ `B` thành `b`, dẫn đến tên file trên GitHub và Vercel vẫn giữ nguyên và tiếp tục lỗi lúc build.
- **Cách sửa:** Dùng lệnh `git mv -f Button.tsx button.tsx` trong Terminal rồi commit, đồng thời kiểm tra lại trên GitHub xem tên file đã đổi thật sự chưa.

## Bài tập thực hành

Lập phiếu sẵn sàng triển khai từ code và log có sẵn của project. Bài này không build, push, deploy hay thay cấu hình dịch vụ.

### Việc cần làm

1. Đọc `scripts.build` trong `package.json`, `next.config.*` và `vercel.json` nếu có. Ghi lệnh build, cấu hình bỏ qua kiểm tra kiểu và điểm chưa rõ; không chạy script.
2. Chạy lệnh chỉ đọc `git log -n 1 --oneline` trong repo để ghi mã commit local. Nếu có log triển khai đã che bí mật, đối chiếu commit và ứng dụng được build; không có thì ghi chưa xác minh.
3. Tìm tên biến dùng trong code và lập bảng tên biến → server/client → môi trường cần dùng. Không mở `.env*`, không ghi giá trị; đánh dấu chưa xác minh môi trường dữ liệu của Preview nếu thiếu bằng chứng.
4. Đọc log build/runtime đã che nếu có, phân loại sự cố theo giai đoạn và file. Lập danh sách điều đã kiểm tra và điều còn thiếu, không lấy Ready làm bằng chứng mọi chức năng hoạt động.

### Kết quả đúng

Phiếu có lệnh build, commit, tên biến, bằng chứng log và các điểm chưa xác minh. Bạn biết cần thông tin gì trước khi triển khai, không kết luận Preview an toàn chỉ từ nhãn Preview, và chưa gây thay đổi lên hệ thống đang chạy.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy build, push, deploy hoặc gọi dịch vụ. Từ phiếu và log đã che bí mật tôi gửi, kiểm tra ứng dụng/commit, giai đoạn lỗi, phạm vi môi trường và bằng chứng còn thiếu. Không tự mở file hoặc yêu cầu giá trị biến môi trường.
```
