---
id: package-dependencies
title: Gói thư viện và phụ thuộc (Packages & Dependencies)
group: deploy
prerequisites: []
priority: 1
stage: 1
signals:
  - "package.json"
  - "package-lock.json"
  - "node_modules"
  - "npm install"
  - "dependencies"
---

## Giải thích đời thường

Quán cà phê không tự trồng cà phê, không tự làm ly giấy. Quán mua từ **nhà cung cấp**. Chủ quán giữ một **danh sách nhà cung cấp** (cà phê của ai, sữa của hãng nào) và một **sổ nhập hàng** ghi chính xác từng lô đã nhận. Đến chi nhánh mới, chỉ cần đưa danh sách đó là nhập lại đúng nguyên liệu.

Phần mềm cũng vậy. Dự án của bạn dùng hàng trăm **gói (package)** do người khác viết sẵn: Next.js, React, thư viện vẽ biểu đồ, thư viện kiểm tra dữ liệu... Những gói dự án cần gọi là **phụ thuộc (dependencies)**.

- `package.json` là danh sách nhà cung cấp: tên gói và khoảng phiên bản chấp nhận được.
- `package-lock.json` là sổ nhập hàng: phiên bản chính xác của từng gói, kể cả các gói mà gói khác kéo theo.
- `node_modules/` là cái kho chứa hàng đã nhập về. Thư mục này rất nặng, không đưa lên Git; ai có hai file trên chỉ cần chạy `npm install` là có lại.

Mỗi gói thêm vào là thêm một nhà cung cấp bạn phải tin tưởng, nên đừng để AI thêm tùy tiện.

## Trong code trông như thế nào

Một đoạn `package.json`:

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

Dấu `^` nghĩa là chấp nhận bản mới hơn miễn cùng số đầu (`4.x`). Thêm một gói và dùng nó:

```bash
npm install zod
```

```ts
import { z } from 'zod' // tên trong ngoặc phải có trong package.json
```

## Hay gặp lỗi gì

- **Gói AI gợi ý không có thật hoặc đã bỏ hoang.** AI có thể bịa tên gói nghe rất hợp lý; kẻ xấu còn đăng gói trùng tên bịa đó để cài mã độc. Cách nhận ra: tra tên gói trên npmjs.com, xem số lượt tải hằng tuần và lần cập nhật gần nhất trước khi cài.
- **"Module not found" sau khi kéo code về.** Code mới dùng gói mà máy bạn chưa cài. Cách nhận ra: lỗi `Can't resolve 'tên-gói'`; chạy `npm install`.
- **Xung đột phiên bản.** Lỗi `ERESOLVE unable to resolve dependency tree`. AI hay gợi ý thêm `--force` cho qua. Cách nhận ra: lệnh có `--force` hoặc `--legacy-peer-deps`; hãy hỏi AI gói nào xung đột trước khi ép.
- **Lẫn nhiều công cụ cài gói.** Dự án có cùng lúc `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`. Cách nhận ra: thấy hơn một file khóa ở thư mục gốc; chỉ giữ một.

## Tự kiểm tra

### Mở `package.json` của bạn. Dự án đang phụ thuộc vào bao nhiêu gói, và bạn biết mỗi gói dùng để làm gì không?

Đếm các dòng trong `dependencies` (gói dùng khi chạy) và `devDependencies` (gói chỉ dùng khi phát triển). Gói nào không rõ công dụng thì hỏi AI hoặc tra trên npmjs.com; gói không dùng nữa nên gỡ bằng `npm uninstall`.

### Vì sao không đưa `node_modules` lên Git, nhưng phải đưa `package-lock.json` lên?

`node_modules` dựng lại được từ hai file kia bằng `npm install`. Còn `package-lock.json` đảm bảo máy bạn và máy chủ deploy cài đúng cùng phiên bản.
