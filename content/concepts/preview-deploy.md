---
id: preview-deploy
title: Bản preview cho mỗi Pull Request
group: deploy
prerequisites: [pull-request, hosting-deploy, environment-variables]
priority: 2
stage: 3
format: 2
signals: ["Preview", "Production", "Deployment Protection", "VERCEL_GIT_COMMIT_SHA", "VERCEL_GIT_COMMIT_REF"]
sources:
  - title: Vercel Docs — GitHub deployments
    url: https://vercel.com/docs/git/vercel-for-github
  - title: Vercel Docs — Environments
    url: https://vercel.com/docs/deployments/environments
  - title: Vercel Docs — Environment variables
    url: https://vercel.com/docs/environment-variables
  - title: Vercel Docs — Deployment Protection
    url: https://vercel.com/docs/deployment-protection
---

## Nhắc lại

### Một PR đã mở có nghĩa là code đã hợp nhất và khách đang dùng chưa?

Chưa. PR là đề nghị nhận thay đổi vào nhánh đích. Trạng thái merge và cấu hình triển khai quyết định code nào được đưa tới môi trường phục vụ người dùng.

### Vì sao cùng code nhưng hai môi trường có thể gọi hai dịch vụ khác nhau?

Biến môi trường cung cấp cấu hình như địa chỉ dịch vụ và khóa truy cập. Cùng tên biến có thể mang giá trị khác tại máy, Preview và Production; cần kiểm nơi áp dụng, không chỉ tên biến.

## Đoán trước

Agent gửi bạn link preview của PR thêm nút gửi nhắc lịch. Bạn nghĩ chưa merge thì không ảnh hưởng khách, nên bấm thử. Email lại tới người dùng thật vì biến của Preview trỏ tới cùng dịch vụ và khóa đang dùng trên Production. Vì sao đường link riêng không ngăn được việc này?

### Đáp án

Link riêng chỉ tách bản triển khai và nơi truy cập. Nó không tự tạo database, hộp thư hay tài khoản dịch vụ thử. Nếu cấu hình Preview dùng chung đích hoặc khóa với Production, thao tác vẫn có thể chạm tài nguyên thật. Trước khi bấm, xác nhận dịch vụ thử, dữ liệu giả và phạm vi biến; chưa xác minh thì chưa chạy luồng có tác động bên ngoài.

## Ví dụ mẫu

**Preview Deployment** là bản triển khai để xem và kiểm thay đổi trước khi đưa lên môi trường chính. Với project đã kết nối GitHub và bật triển khai tự động, Vercel thường tạo preview khi push nhánh không phải nhánh Production hoặc cập nhật PR. Bạn có thể xem trang chạy thật, thử tương tác và gửi phản hồi cho người làm.

**Production** là môi trường phục vụ người dùng, thường gắn với nhánh `main` nhưng tên nhánh có thể khác. Theo thiết lập mặc định, push hoặc merge vào nhánh Production khởi động triển khai Production. Khi thành công, tên miền Production trỏ tới bản mới. Vì vậy hãy xác định nhánh thực tế, không chỉ đoán từ tên `main`.

Có ngoại lệ đáng nhớ khi bắt đầu project: deployment đầu tiên của project mới là Production và dùng biến Production, kể cả khi xuất phát từ nhánh khác. Không dựa vào câu “tôi đang ở nhánh thử” để xác định môi trường. Bài tập này dùng project thử đã có deployment ban đầu và yêu cầu đọc nhãn môi trường của bản đang mở.

```text
Project thử: demo-lich-hen, đã có deployment ban đầu
Nhánh Production đã xác nhận: main
PR thử: thu-noi-dung
Deployment đang kiểm: Preview, đúng commit của PR
URL theo nhánh: có thể đổi sang bản mới khi nhánh có cập nhật
Ghi bằng chứng: URL deployment cụ thể + commit + kết quả thử
```

Vercel cung cấp URL preview qua tích hợp GitHub, thường trong comment của PR. URL theo nhánh hướng tới thay đổi mới nhất của nhánh; URL riêng của deployment gắn với một bản triển khai cụ thể. Khi agent push tiếp, hãy kiểm lại commit của bản đang xem. Một ảnh chụp từ preview cũ không chứng minh commit vừa thêm đã chạy đúng.

**Biến Preview và Production có phạm vi riêng.** Bạn có thể chọn môi trường áp dụng cho một biến; biến Preview còn có thể dành riêng cho một nhánh và ghi đè giá trị Preview cùng tên. Riêng phạm vi không đồng nghĩa riêng tài nguyên: hai môi trường vẫn có thể chứa cùng địa chỉ dịch vụ hoặc cùng khóa do người cấu hình sao chép.

```text
SAI: Preview dùng chung đích gửi và khóa với Production.
Tên biến: MAIL_API_KEY, DATABASE_URL
Không cần chép giá trị để ghi nhận rủi ro dùng chung.
ĐÚNG cho project thử:
Preview -> dịch vụ giả hoặc tài nguyên thử riêng, dữ liệu giả
Production của project thử -> cũng không nối dữ liệu khách
Ghi phạm vi biến, tên tài nguyên; không chép secret vào báo cáo.
```

Thay biến trên dashboard không sửa ngược deployment đã có. Giá trị mới áp dụng cho deployment mới, nên phải tạo bản mới rồi xác nhận đúng bản trước khi kiểm lại. Nếu chỉ mở lại link cũ và thấy lỗi vẫn còn, đừng vội cho agent sửa code để bù một cấu hình chưa được áp dụng.

Link preview cũng cần kiểm quyền truy cập. Trong project Vercel, mở **Settings → Deployment Protection** để xem phương thức bảo vệ và phạm vi URL được bảo vệ. **Vercel Authentication** yêu cầu người dùng Vercel có quyền phù hợp. **Standard Protection** bảo vệ các deployment trừ tên miền Production. Đọc cấu hình thật của project; đừng suy quyền truy cập từ repo private hoặc từ việc link dài khó đoán.

Bảo vệ link và tách dịch vụ là hai việc khác nhau. Người có quyền mở preview vẫn có thể bấm nút gây tác động qua khóa phía máy chủ nếu khóa đó trỏ tới hệ thống thật. Ngược lại, dữ liệu thử riêng không có nghĩa mọi người đều nên xem được bản nháp. Kiểm cả hai trước khi gửi link cho người review.

Khi PR đến từ fork, Vercel mặc định cần người có quyền cho phép triển khai để tránh lộ thông tin môi trường cho code chưa tin cậy. Không tắt bảo vệ chỉ vì agent muốn thấy link ngay. Đọc đề xuất trước; một PR hợp lệ về cú pháp vẫn có thể chứa code lấy dữ liệu cấu hình.

## Khi nào chưa cần

Dùng preview để kiểm đúng thay đổi, không nhân thêm bản triển khai khi chưa có nhu cầu.

- **Tạo project Vercel mới cho mỗi sửa câu chữ** — chưa cần khi project thử đã có deployment ban đầu và preview đúng commit; cần khi chưa có nơi thử tách khỏi dịch vụ thật.
- **Tạo biến riêng cho từng nhánh** — chưa cần khi cấu hình Preview chung đã trỏ đúng tài nguyên thử; cần khi nhánh cần cấu hình khác, rồi phải kiểm trên deployment mới.

## Tìm trong project của bạn

Khảo sát bằng cách xem metadata được phép, không thử gửi email, thanh toán hay ghi dữ liệu thật. Không đọc hoặc dán giá trị khóa vào chat; ghi tên biến và tài nguyên đích đã được xác nhận.

1. Từ PR, tìm liên kết deployment tương ứng. Ghi `[PR / nhánh / commit / URL bản triển khai]`. Ổn: bản đang xem khớp commit cần review. Có vấn đề: chỉ có link nhánh mà chưa biết nó đang trỏ tới bản nào.
2. Xem môi trường được ghi là Preview hay Production và nhánh Production của project. Ghi `[loại môi trường / nhánh chính]`; nếu là lần triển khai đầu tiên, đặc biệt kiểm ngoại lệ Production.
3. Xem phạm vi các biến liên quan như `DATABASE_URL`, `MAIL_API_KEY` trong cấu hình project, không ghi giá trị. Hỏi người quản lý xác nhận `[tài nguyên thử hay thật / biến riêng cho nhánh có không]`. Chưa rõ thì chưa chạy luồng ghi dữ liệu.
4. Xem Deployment Protection: ghi `[phương thức / phạm vi URL / người được phép xem]`. Repo private không đủ để kết luận link preview bị khóa.
5. Chọn tiêu chí review và ghi `[bước thử / dữ liệu giả / mong đợi / thực tế / phần chưa kiểm]`. Chỉ thử khi đã xác nhận môi trường an toàn; sau mỗi cập nhật PR, đối chiếu lại commit.

## Tự giải thích

### Vì sao preview có ích dù đã có test tự động?

Bạn có thể kiểm cách thay đổi xuất hiện trong luồng người dùng, gồm nội dung, thao tác và kết quả. Test tự động chỉ kiểm những tình huống đã viết. Preview bổ sung bằng chứng thực tế nhưng không chứng minh mọi hành vi hay cấu hình Production đều đúng.

### Vì sao sửa biến rồi mở lại cùng deployment có thể chưa thấy thay đổi?

Thay đổi biến áp dụng cho deployment mới. Bản cũ giữ cấu hình đã được dùng cho nó. Cần đối chiếu bản triển khai tạo sau lúc sửa biến, tránh dùng kết quả cũ để kết luận sửa cấu hình không có tác dụng.

### Bỏ Deployment Protection có giải quyết lỗi đăng nhập trong app không?

Không thể kết luận như vậy. Lớp bảo vệ URL của Vercel khác với đăng nhập do app xử lý. Trước tiên xác định yêu cầu bị chặn ở lớp nào; tháo bảo vệ URL có thể chỉ làm bản nháp dễ truy cập hơn mà lỗi trong app vẫn còn.

## Trắc nghiệm

### Agent ghi “Preview đã Ready, dùng cùng MAIL_API_KEY với Production”. Bạn xử lý thế nào trước khi thử gửi?

- [x] Xác nhận và tách dịch vụ thử, dữ liệu giả trước khi chạy luồng gửi
- [ ] Bấm thử vì Preview không thể gửi tới khách thật
- [ ] Chỉ đổi tên nhánh để khóa trở thành khóa thử
- [ ] Chỉ mở trình duyệt ẩn danh là đủ cách ly dịch vụ

**Giải thích:** Ready nói về deployment, không chứng minh dịch vụ đích an toàn. Tên nhánh hay trình duyệt không đổi quyền của khóa ở máy chủ.

### Cursor báo đã sửa phạm vi biến nhưng bạn đang mở deployment tạo trước lúc sửa. Cần làm gì?

- [ ] Chỉ refresh để mọi biến tự cập nhật tại chỗ
- [x] Tạo deployment mới rồi kiểm đúng phiên bản và phạm vi biến
- [ ] Đổi tên biến trong code ngay mà chưa kiểm cấu hình
- [ ] Merge để bỏ qua kiểm trên preview

**Giải thích:** Biến mới chỉ áp dụng cho bản triển khai mới. Refresh deployment cũ không thay bằng chứng về cấu hình đã dùng để tạo nó.

### Repo private và link preview dài. Điều gì chứng minh người ngoài bị chặn?

- [ ] Chỉ nhãn private của repo
- [ ] Chỉ độ dài của URL
- [x] Cấu hình Deployment Protection áp dụng cho URL đó và kiểm truy cập phù hợp
- [ ] Chỉ việc PR chưa merge

**Giải thích:** Quyền xem code và quyền truy cập deployment là các cấu hình khác nhau. Link khó đoán không phải cơ chế xác thực.

### Bạn tạo project Vercel mới từ nhánh thử. Có chắc deployment đầu tiên là Preview không?

- [ ] Chắc, vì nhánh không tên main
- [ ] Chắc, nếu repo chứa PR đang mở
- [ ] Chắc, nếu chưa thêm tên miền riêng
- [x] Không; deployment đầu tiên là Production, cần kiểm môi trường và cấu hình thực tế

**Giải thích:** Project mới có ngoại lệ cho lần triển khai đầu. Quy tắc preview theo nhánh áp dụng cho các lần sau; tên nhánh không đủ để nhận diện môi trường.

## Kiểm tra không dùng AI

### Bạn đã kiểm preview của trang tìm kiếm. Agent vừa push thêm thay đổi bộ lọc, rồi gửi lại đúng link theo nhánh cũ và dùng ảnh kiểm trước đó làm bằng chứng. Bạn cần xác nhận gì trước khi merge?

#### Đáp án

Kiểm deployment hiện tại thuộc commit nào, đã tạo xong chưa và có đúng cập nhật cần review không. Xác nhận tài nguyên thử vẫn tách biệt, rồi thử lại phần bộ lọc cùng hành vi bị ảnh hưởng. Ghi URL deployment cụ thể, commit, đầu vào giả và kết quả. Link theo nhánh có thể trỏ sang bản mới, nhưng ảnh cũ không trở thành bằng chứng cho code mới.

## Lỗi suy luận hay gặp

### “Preview luôn vô hại vì khách chưa thấy nó”

Khách chưa thấy giao diện mới vẫn có thể nhận email hoặc bị đổi dữ liệu nếu preview dùng tài nguyên thật. Xác nhận đích và khóa thử trước khi chạy thao tác, không dựa vào nhãn Preview.

### “Bảo vệ link rồi thì không cần tách database”

Bảo vệ link giới hạn người vào, không đổi database mà code sử dụng. Người review có quyền vẫn có thể tác động tới dữ liệu thật. Cần vừa quản lý truy cập vừa tách tài nguyên thử.

### “Preview qua thì Production chắc chắn giống hệt”

Hai môi trường có thể khác biến và tài nguyên. Kết quả preview chứng minh phiên bản đã thử trong điều kiện đã ghi. Khi phát hành vẫn phải kiểm cấu hình Production theo quy trình riêng.

## Bài tập thực hành

Mục tiêu: kiểm một thay đổi câu chữ qua preview và ghi bằng chứng đúng phiên bản. Chỉ dùng repo thử cùng project Vercel thử đã có deployment ban đầu, không khóa thật, không DB, email hay thanh toán thật.

### Việc cần làm

1. Xác nhận project thử không nối dịch vụ thật; ghi nhánh Production, phạm vi biến và bảo vệ URL. Nếu chưa có môi trường này, dùng thông tin deployment mẫu để làm bài trên giấy.
2. Chọn PR sửa câu chữ trên nhánh thử, mở deployment được liên kết. Không tạo project mới trong bài tập này.
3. Ghi môi trường Preview, nhánh, commit và URL deployment cụ thể. Nếu thấy Production hoặc không xác định được, dừng phần thử tương tác.
4. Kiểm câu chữ và thao tác điều hướng không ghi dữ liệu; đối chiếu tiêu chí, ghi mong đợi và thực tế.
5. Viết điều kiện còn cần trước khi merge. Không merge, promote, đổi cấu hình repo thật, xóa lịch sử hoặc force push để hoàn tất bài tập.

### Kết quả đúng

Bản ghi nối được PR với đúng commit và deployment, xác nhận dữ liệu thử cùng quyền xem link. Bạn phân biệt được “deployment đã tạo” với “tiêu chí đã kiểm” và nêu rõ phần chưa thử.
