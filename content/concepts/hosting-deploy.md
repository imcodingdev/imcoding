---
id: hosting-deploy
title: Đưa ứng dụng lên mạng (Hosting & Deploy)
group: deploy
prerequisites: [git-commit, package-dependencies]
priority: 1
stage: 3
signals:
  - "vercel.json"
  - ".vercel"
  - "npm run build"
  - "next build"
  - ".vercel.app"
---

## Giải thích đời thường

Bạn thử món mới trong bếp nhà mình, chỉ người nhà được nếm. Muốn bán thật, bạn thuê một **mặt bằng** ngoài phố, đưa **công thức** cho đội bếp ở đó. Họ nhập nguyên liệu theo danh sách, nấu theo công thức, rồi mở cửa đón khách ở một địa chỉ ai cũng tìm được.

`localhost` là căn bếp nhà bạn: chỉ máy bạn mở được. **Hosting** là thuê mặt bằng, ví dụ Vercel. **Deploy** là quá trình đưa công thức lên đó: Vercel lấy code từ Git, chạy `npm install` để nhập "nguyên liệu" theo `package.json`, chạy **build** để nấu sẵn (dịch và tối ưu code), rồi mở ra ở một địa chỉ như `ten-du-an.vercel.app`.

Điều cần nhớ: mặt bằng chỉ có **đúng những gì bạn gửi lên Git** cộng với cấu hình bạn nhập trên trang quản lý (như biến môi trường). File chưa commit, khóa trong `.env.local`, gói chỉ cài trên máy bạn: Vercel đều không có. Vì vậy chuyện "máy tôi chạy được mà lên mạng thì hỏng" rất hay gặp, và thường lý do nằm ở những khác biệt đó.

## Trong code trông như thế nào

Với Vercel nối sẵn với GitHub, quy trình thường là:

```bash
npm run build      # thử build trên máy mình trước, bắt lỗi sớm
git status         # xem file nào đã đổi
git diff           # xem kỹ từng dòng trước khi chọn
git add app/thanh-toan/page.tsx
git commit -m "Thêm trang thanh toán"
git push           # Vercel thấy commit mới, tự build và deploy
```

Mỗi lần push, Vercel tạo một bản deploy mới. Trên trang dự án ở Vercel, mục Deployments cho biết bản nào đang chạy, build thành công hay lỗi, và có nhật ký build để đọc khi lỗi.

## Hay gặp lỗi gì

- **Thiếu biến môi trường trên Vercel.** Cách nhận ra: build hoặc trang báo giá trị `undefined`, chỉ trên bản deploy. Kiểm tra Settings → Environment Variables; thêm hay sửa biến xong phải deploy lại mới có tác dụng.
- **`npm run dev` chạy được nhưng build thì lỗi.** Lúc build, Next.js kiểm tra kỹ hơn, ví dụ dừng lại khi có lỗi kiểu TypeScript mà lúc chạy `dev` vẫn cho qua. Cách nhận ra: nhật ký build trên Vercel đỏ; chạy `npm run build` ở máy sẽ thấy cùng lỗi.
- **Sai chữ hoa chữ thường trong tên file.** Windows coi `Button.tsx` và `button.tsx` là một, máy chủ Linux của Vercel thì không. Cách nhận ra: lỗi `Module not found` chỉ xảy ra trên Vercel, và tên trong `import` khác tên file đúng một chữ hoa.
- **Ghi file lên ổ đĩa máy chủ.** Máy chủ của Vercel không giữ lại file ghi lúc chạy. Cách nhận ra: code có `fs.writeFile` để lưu dữ liệu hay ảnh tải lên; cần dùng database hoặc dịch vụ lưu file.

## Tự kiểm tra

### Bản đang chạy trên mạng của bạn ứng với commit nào?

Mở dự án trên Vercel, mục Deployments: bản có nhãn Production ghi mã commit và lời ghi chú. So với `git log --oneline` trên máy để biết bản trên mạng có mới nhất không.

### Bạn vừa thêm `RESEND_API_KEY` vào `.env.local` và tính năng gửi email chạy tốt ở máy. Trước khi push, cần làm gì thêm?

Nhập `RESEND_API_KEY` vào Settings → Environment Variables của dự án trên Vercel, và chạy `npm run build` ở máy để chắc chắn build không lỗi.
