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

1. **Chạy thử đóng gói trên máy:** Mở Terminal tại thư mục dự án và chạy `npm run build`. Quan sát xem lệnh chạy trót lọt hay dừng lại báo lỗi (`Failed to compile` / `Type error`).
2. **Kiểm tra cấu hình bỏ qua lỗi:** Mở `next.config.ts` (hoặc `.mjs`, `.js`), tìm xem AI có tự ý chèn `ignoreBuildErrors: true` để giấu lỗi TypeScript không.
3. **Rà soát thao tác ghi file:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) các từ khóa `fs.writeFile`, `fs.appendFile`, `writeFileSync` xem có tính năng nào đang ghi thẳng dữ liệu người dùng vào thư mục dự án không.
4. **Đối chiếu biến môi trường và bản chạy thật:** Mở `.env.local`, đếm số biến môi trường rồi kiểm tra mục **Settings → Environment Variables** trên Vercel xem đã nhập đủ chưa. Vào mục **Deployments** xem bản `Production` hiện tại có khớp với mã commit mới nhất (`git log -n 1 --oneline`) không.
5. **Ghi lại kết quả của bạn:**
   - Lệnh `npm run build` trên máy chạy thành công hay báo lỗi?: `[ Thành công / Báo lỗi tại file: ... ]`
   - Trong code có chỗ nào dùng `fs.writeFile` lưu dữ liệu người dùng không?: `[ Có / Không - tên file: ... ]`
   - Các biến trong `.env.local` đã có đủ trên Vercel Environment Variables chưa?: `[ Đã đủ / Còn thiếu biến: ... ]`

## Tự giải thích

### Vì sao có những lúc bạn chạy `npm run dev` trên máy thấy trang web hoạt động bình thường, nhưng khi đẩy lên Vercel (hoặc chạy `npm run build`) thì lại báo lỗi không thể hoàn tất?

Chế độ `npm run dev` chỉ biên dịch từng trang khi bạn mở tới và bỏ qua nhiều bước kiểm tra nghiêm ngặt để hiển thị nhanh. Ngược lại, `npm run build` rà soát toàn bộ dự án, kiểm tra chặt chẽ kiểu dữ liệu TypeScript và tạo sẵn các trang tĩnh; chỉ cần một file có lỗi kiểu dữ liệu hoặc dùng biến không tồn tại, quá trình build sẽ dừng lại.

### Tại sao sau khi bạn vào trang Settings → Environment Variables trên Vercel để thêm hoặc sửa một biến môi trường, trang web đang chạy vẫn chưa nhận ngay giá trị mới mà bạn phải bấm Redeploy?

Mỗi bản triển khai (Deployment) trên Vercel đã được đóng băng cấu hình tại thời điểm nó build xong, đặc biệt các biến `NEXT_PUBLIC_` đã được chép cứng vào file JavaScript. Do đó, sau khi thêm hoặc sửa biến môi trường, bạn phải bấm **Redeploy** để Vercel tạo bản chạy mới nhận cấu hình vừa cập nhật.

### Vì sao trên các nền tảng đám mây như Vercel, bạn không thể lưu ảnh người dùng tải lên hoặc lưu dữ liệu đơn hàng bằng lệnh ghi file `fs.writeFile` vào thư mục dự án?

Trên Vercel, mỗi khi có truy cập, hệ thống bật lên các máy chủ tạm thời (serverless functions) chỉ tồn tại ngắn hạn rồi tự tắt, và thư mục code chỉ cho phép đọc (read-only). Mọi dữ liệu cần giữ lâu dài bắt buộc phải lưu vào Database (như Supabase) hoặc dịch vụ lưu trữ đám mây (như Supabase Storage, AWS S3, Cloudflare R2).

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
