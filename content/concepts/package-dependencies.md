---
id: package-dependencies
title: Gói thư viện và phụ thuộc (Packages & Dependencies)
group: deploy
prerequisites: []
priority: 1
stage: 1
format: 2
signals:
  - "package.json"
  - "package-lock.json"
  - "node_modules"
  - "npm install"
  - "dependencies"
---

## Đoán trước

Bạn bảo AI: *"Hãy thêm tính năng xuất hóa đơn ra file PDF có đóng dấu chữ ký số"*. AI lập tức viết code và hướng dẫn chạy lệnh `npm install next-pdf-signer-pro` trong Terminal. Thấy tên gói thư viện nghe rất chuyên nghiệp, bạn định copy lệnh đó chạy ngay trên máy tính chứa toàn bộ mã nguồn và khóa dự án. Có rủi ro nghiêm trọng nào đang chờ bạn nếu nhắm mắt chạy lệnh cài đặt mà AI vừa gợi ý?

### Đáp án

AI không tra cứu danh bạ thư viện thật theo thời gian thực mà ghép các từ tiếng Anh nghe hợp lý lại với nhau, dẫn đến hiện tượng **bịa tên gói thư viện (package hallucination)**. Theo nghiên cứu về lỗi này, tỷ lệ AI bịa tên package không tồn tại là **trung bình ít nhất 5,2% với model thương mại và 21,7% với model mã nguồn mở (Spracklen et al., USENIX Security 2025)**. Nguy hiểm hơn, tin tặc lợi dụng điều này bằng kỹ thuật *slopsquatting*: tìm các tên gói AI hay bịa ra rồi đăng ký trước lên kho npm với mã độc bên trong. Nếu chạy `npm install` mà không kiểm tra, bạn đang tự tay tải và chạy mã độc trên máy mình.

## Ví dụ mẫu

Một quán cà phê không tự sản xuất ly giấy hay sữa mà mua từ các **nhà cung cấp**. Để vận hành ổn định, chủ quán giữ hai thứ: **danh sách nhà cung cấp** và **sổ nhập hàng chi tiết** ghi rõ mã lô hàng đã nhận. Khi mở chi nhánh mới, chỉ cần hai tài liệu này là nhập lại được y hệt nguyên liệu cũ.

Dự án phần mềm cũng được lắp ghép từ hàng trăm **gói thư viện (packages)** viết sẵn (như Next.js làm khung web, Zod để kiểm tra dữ liệu). Những gói dự án cần để chạy gọi là **phụ thuộc (dependencies)**:

- `package.json`: Danh sách nhà cung cấp chính và khoảng phiên bản chấp nhận.
- `package-lock.json`: Sổ nhập hàng ghi **phiên bản chính xác tuyệt đối** của từng gói và các gói con kéo theo.
- `node_modules/`: Kho chứa hàng hóa đã tải về máy. Thư mục này rất nặng nên không đưa lên Git; chỉ cần hai file trên và chạy `npm install` là dựng lại được đúng kho này.

Một đoạn trong file `package.json` ở thư mục gốc:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "16.0.0",
    "react": "19.2.0",
    "zod": "^4.1.0"
  }
}
```

Khi AI viết câu lệnh sử dụng thư viện trong file code `.ts`:

```ts
// Tên gói 'zod' sau chữ from bắt buộc phải nằm trong mục ___ của file package.json.
// Nếu chưa cài mà viết dòng này, ứng dụng sẽ báo lỗi "Module not found: Can't resolve 'zod'"
import { z } from 'zod'
```


## Tìm trong project của bạn

Hãy mở dự án và kiểm kê các nhà cung cấp phần mềm theo 4 bước:

1. **Đọc danh sách nhà cung cấp:** Mở `package.json` ở thư mục gốc, tìm mục `"dependencies"` (gói cần khi web chạy thật) và `"devDependencies"` (gói hỗ trợ lúc viết code).
2. **Kiểm tra sổ nhập hàng (lockfile):** Xem ở thư mục gốc đang có những file nào trong số: `package-lock.json` (npm), `pnpm-lock.yaml` (pnpm), hoặc `yarn.lock` (yarn). Một dự án chuẩn chỉ nên có **đúng một** loại file khóa này.
3. **Tra cứu trên kho chính thức:** Chọn 1–2 tên gói lạ nhất trong `"dependencies"`, truy cập `https://www.npmjs.com/package/<tên-gói>` để xem lượt tải hằng tuần (Weekly Downloads) và ngày cập nhật gần nhất.
4. **Ghi lại kết quả của bạn:**
   - Số lượng gói đang có trong `"dependencies"`: `[ ... gói ]`
   - Tên các gói mà bạn chưa hiểu công dụng: `[ ... ]`
   - Dự án đang có mấy file khóa (lockfile) ở thư mục gốc?: `[ 1 / Nhiều hơn 1: ... ]`

## Tự giải thích

### Vì sao chúng ta phải chặn thư mục `node_modules` không cho lên Git, nhưng lại bắt buộc phải đưa file `package-lock.json` lên Git?

Thư mục `node_modules` chứa hàng chục nghìn file rất nặng, đưa lên Git sẽ làm kho chứa bị chậm. Trong khi đó, `package.json` thường ghi khoảng phiên bản linh hoạt (như `^4.1.0` là chấp nhận mọi bản `4.x` mới hơn). Nếu thiếu `package-lock.json` trên Git, máy bạn hôm nay cài bản `4.1.0`, nhưng tháng sau máy chủ Vercel lại tự tải bản `4.2.0` mới ra mắt có lỗi, khiến ứng dụng chạy ở máy thì đúng nhưng lên Vercel thì sập.

### Vì sao mỗi khi AI đề xuất lệnh `npm install <tên-gói>`, bạn không nên chạy ngay mà phải kiểm tra trên trang npmjs.com trước?

Vì hai lý do: Thứ nhất, AI hay bịa tên gói không có thật với tỷ lệ trung bình ít nhất 5,2% với model thương mại và 21,7% với model mã nguồn mở (Spracklen et al., USENIX Security 2025), và kẻ gian có thể tạo sẵn gói giả trùng tên đó để phát tán mã độc lấy cắp biến môi trường. Thứ hai, dù gói có thật, nó có thể đã bị tác giả bỏ hoang nhiều năm, không còn tương thích với Next.js hiện tại.

### Chuyện gì xảy ra nếu trong dự án của bạn xuất hiện cùng lúc cả `package-lock.json` và `yarn.lock` (hoặc `pnpm-lock.yaml`)?

Đó là dấu hiệu dự án đang dùng lẫn lộn nhiều công cụ quản lý gói (lúc chạy `npm install`, lúc chạy `yarn add`). Các file khóa này không đồng bộ với nhau, khiến máy cá nhân đọc một file khóa, còn máy chủ Vercel khi đóng gói lại đọc file khóa kia, gây lỗi lệch phiên bản rất khó tìm nguyên nhân.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ AI cài thư viện biểu đồ. Khi chạy `npm install`, màn hình báo lỗi `ERESOLVE unable to resolve dependency tree` vì thư viện này chỉ hỗ trợ React 18, còn dự án đang dùng React 19. AI bảo bạn chạy lại kèm cờ `--force` để bỏ qua lỗi. Làm theo lời AI có rủi ro gì và bạn nên xử lý thế nào?

#### Đáp án

- **Rủi ro:** Lỗi `ERESOLVE` là cảnh báo an toàn của npm rằng hai gói thư viện xung đột phiên bản với nhau. Dùng cờ `--force` (hoặc `--legacy-peer-deps`) chỉ ép tải file về chứ không giải quyết xung đột, khiến trang biểu đồ có thể bị trắng trang, sập ứng dụng, hoặc lỗi khi đóng gói (build) trên Vercel.
- **Cách xử lý đúng:**
  1. Không chạy `--force` một cách mù quáng.
  2. Lên `npmjs.com` kiểm tra xem thư viện đó đã có bản mới hỗ trợ React 19 chưa.
  3. Nếu thư viện đã bị bỏ hoang, yêu cầu AI đổi sang thư viện biểu đồ khác tương thích chuẩn với React 19.

## Lỗi suy luận hay gặp

### "Cứ gói nào có trên npmjs.com và cài không báo lỗi nghĩa là gói đó an toàn, chuẩn chỉnh"

- **Vì sao sai:** Bất kỳ ai cũng có thể đăng gói lên kho npm trong vài phút. Gói cài thành công vẫn có thể là gói rác, bị bỏ hoang, hoặc gói giả mạo (slopsquatting) do tin tặc giăng bẫy chờ AI gợi ý.
- **Cách sửa:** Trước khi chạy `npm install` gói lạ, luôn mở `npmjs.com` kiểm tra 3 chỉ số: **Weekly Downloads** (lượt tải hàng tuần có đủ lớn không), **Last publish** (lần cập nhật gần nhất), và kho GitHub đi kèm có uy tín không.

### "Gặp lỗi xung đột `ERESOLVE` thì cứ thêm `--force` hoặc `--legacy-peer-deps` như AI chỉ là xong"

- **Vì sao sai:** AI thường ưu tiên làm cho câu lệnh hiện tại chạy qua được ngay, nhưng không chịu trách nhiệm khi hệ thống phát sinh lỗi ngầm lúc vận hành thật.
- **Cách sửa:** Coi lỗi `ERESOLVE` là báo động rằng AI đang chọn thư viện cũ kỹ, lệch đời với dự án. Hãy bắt AI giải thích gói nào đang xung đột và đổi sang giải pháp tương thích tự nhiên.

### "Thư mục `node_modules` bị lỗi thì cứ sửa trực tiếp code bên trong `node_modules` cho nhanh"

- **Vì sao sai:** `node_modules` không được lưu lên Git. Mọi chỉnh sửa trong đó sẽ mất sạch khi cài thêm gói mới, và máy chủ Vercel cũng chỉ tải lại `node_modules` gốc từ mạng chứ không có phần bạn sửa.
- **Cách sửa:** Không bao giờ sửa file trong `node_modules`. Nếu gói có lỗi, hãy nâng cấp phiên bản trong `package.json` hoặc đổi sang gói khác.
