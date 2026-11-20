---
id: done-evidence
title: Bằng chứng "đã xong" của agent
group: ai-git
prerequisites: [agent-scope, automated-tests]
priority: 1
stage: 2
format: 2
signals: ["đã xong", "evidence", "end-to-end", "test passed", "exit code"]
sources:
  - title: Learn Harness Engineering — Lecture 09
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-09-why-agents-declare-victory-too-early/index.md
  - title: Learn Harness Engineering — Lecture 10
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-10-why-end-to-end-testing-changes-results/index.md
---

## Nhắc lại

### Khi nào một mục được chuyển từ “đang làm” sang “đã qua kiểm”?

Khi hành vi đã đạt tiêu chí với bằng chứng kiểm được, không chỉ vì đã viết code. Cần ghi kết quả cho đúng phiên bản trước khi chọn việc tiếp theo.

### Test tự động xanh có chứng minh mọi trường hợp đều đúng không?

Không. Test chỉ kiểm những tình huống và điều kiện đã được mô tả. Cần xem nó có chạy thật, có bị bỏ qua và có chạm đúng hành vi vừa sửa hay không.

## Đoán trước

Bạn nhờ agent thêm tải hóa đơn trong app quản lý lớp học. Nó báo “đã hoàn thành, test hàm tạo file đều xanh”. Bạn mở bản thử, bấm tải và nhận được file rỗng. Hóa ra hàm nhận danh sách khoản thu, nhưng màn hình truyền một đối tượng có tên trường khác. Test của hàm dùng dữ liệu đúng sẵn nên vẫn qua. Câu “toàn bộ test pass” còn thiếu điều gì để bạn chấp nhận tính năng?

### Đáp án

Thiếu bằng chứng chạy từ thao tác người dùng tới file kết quả. Test từng phần có thể đúng trong điều kiện riêng nhưng bỏ sót lỗi nối giữa các phần. Cần mở bản thử với dữ liệu giả, chọn hóa đơn, bấm tải và kiểm nội dung file. Báo cáo phải nói rõ đã chạy gì và chưa chạy gì, thay vì dùng kết quả của một lớp kiểm tra để kết luận cho cả luồng.

## Ví dụ mẫu

**Bằng chứng hoàn thành** là kết quả người khác có thể đối chiếu hoặc chạy lại: lệnh đã thực thi, môi trường, phiên bản code, dữ liệu thử, kết quả mong đợi và kết quả thực tế. “Tôi đã rà kỹ” chỉ là nhận xét. Một ảnh đẹp chứng minh màn hình ở thời điểm chụp, không chứng minh thao tác lưu hay tải đã hoạt động.

Nên kiểm theo các lớp phù hợp với thay đổi. Lint và kiểm kiểu dữ liệu tìm một số lỗi tĩnh. Test từng phần và kiểm khởi động cho biết thành phần chạy được trong điều kiện thử. Kiểm **end-to-end**, nghĩa là từ đầu tới cuối, đi qua luồng người dùng và xem kết quả cuối. Các lớp bổ sung cho nhau; không lớp nào chứng minh ứng dụng không còn lỗi.

Báo cáo minh họa sau cho thấy khác biệt giữa lời kết luận và bằng chứng:

```text
Báo cáo chưa đủ:
- Đã thêm nút tải hóa đơn.
- Code hợp lý, sẵn sàng dùng.
Báo cáo kiểm được:
- Bản thử ở máy, dữ liệu hóa đơn DEMO-01.
- Lệnh kiểm theo docs/testing.md: đã chạy, exit code 0.
- Chọn DEMO-01 -> tải file -> mở file: đúng các khoản thu giả.
- Danh sách trống -> thông báo chưa có hóa đơn, không tải file.
- Chưa kiểm dịch vụ lưu trữ thật; không kết luận bản thật đã đạt.
```

Đường dẫn test dưới đây là ví dụ trong repo minh họa, không phải lệnh có sẵn ở mọi app:

```text
Kiểm: e2e/invoice-export.spec.ts, bản code đang review
Bước: chọn DEMO-01, bấm Tải hóa đơn, đọc file tải về
Mong đợi: file chứa dòng "Lớp thử A"
Thực tế: file không có dòng dữ liệu
Kết quả: FAIL
Điểm cần điều tra: dữ liệu màn hình gửi vào hàm tạo file
Trạng thái việc: đang làm, chưa đủ bằng chứng hoàn thành
```

Thông tin này giúp agent sửa vào đúng chỗ hơn câu “không chạy”. Đừng bắt nó đoán nguyên nhân từ mỗi chữ FAIL. Nhưng cũng không kết luận ngay nguyên nhân khi mới có triệu chứng: ghi bước tái hiện, đầu vào giả và kết quả trước, rồi điều tra phần nối dữ liệu.

Nếu test không khởi động được vì thiếu môi trường, hãy ghi “chưa chạy được” kèm lỗi. Đó là giới hạn kiểm tra, không phải test đã qua. Một báo cáo đáng tin phân biệt rõ đã đạt, đã thất bại và chưa kiểm.

## Tìm trong project của bạn

1. Lấy lần báo “đã xong” gần nhất. Chép riêng danh sách tiêu chí đã giao, không chép dữ liệu khách hay token vào ghi chú. Đánh dấu tiêu chí có bằng chứng và tiêu chí chỉ có lời khẳng định.
2. Tìm lệnh thật và output trong kết quả phiên làm việc. Ghi `[thư mục chạy, tên test, thời điểm, kết quả]`. Kiểm số test chạy và số bỏ qua; một lệnh exit code 0 nhưng không chọn được test không chứng minh hành vi.
3. Xem `git diff --stat` và diff test của thay đổi. Nếu có `.skip`, bỏ assertion hoặc đổi kỳ vọng cho khớp lỗi, hỏi lý do trước khi tin màu xanh. Không sửa test chỉ để báo cáo đẹp hơn.
4. Viết một đường đi từ thao tác đầu đến kết quả cuối bằng dữ liệu giả: `[mở trang → nhập → gửi → xem kết quả → mở lại nếu cần lưu]`. Chọn thêm một trường hợp lỗi hoặc bị cấm phù hợp tiêu chí.
5. Trên môi trường thử đã được xác nhận, tự đi theo các bước hoặc xem kết quả e2e tương ứng. Ghi `[phiên bản code, kết quả quan sát, nơi lưu bằng chứng, phần chưa kiểm]`. Không tự dùng production để bù thiếu môi trường thử.

Nếu bạn chưa biết chạy lệnh, vẫn có thể yêu cầu agent chỉ đúng lệnh trong tài liệu và giải thích output. Đừng dán nguyên một khối lệnh không hiểu vào Terminal. Việc nghiệm thu bắt đầu từ câu hỏi “kết quả này kiểm tiêu chí nào?”, không phải số lượng dòng log.

## Tự giải thích

### Vì sao test hàm tạo hóa đơn qua mà bấm nút vẫn thất bại?

Test hàm thường đưa đầu vào đã chuẩn bị sẵn, đôi khi thay phần phụ thuộc bằng đối tượng giả. Màn hình thật có thể truyền cấu trúc khác hoặc chưa gọi đúng hàm. Kiểm xuyên suốt chạm vào chỗ nối đó, nên tìm được loại lỗi mà test riêng từng phần chưa bao phủ.

### Vì sao cần ghi phiên bản code bên cạnh kết quả kiểm?

Kết quả chỉ chứng minh điều đã chạy lúc ấy. Nếu agent sửa tiếp sau khi test qua, bằng chứng có thể không còn khớp phần đang review. Ghi commit hoặc mô tả rõ trạng thái đang kiểm giúp bạn biết có cần chạy lại kiểm liên quan hay không.

### Nhờ agent khác xác nhận có thay được việc chạy thử không?

Một người hoặc phiên khác có thể chỉ ra giả định sai và trường hợp bị bỏ sót. Nhưng nếu họ chỉ đọc cùng code rồi nói “ổn”, vẫn thiếu bằng chứng thực thi. Yêu cầu kết luận gắn với tiêu chí, diff và kết quả chạy, dù ai là người kiểm.

## Trắc nghiệm

### Agent gửi output sau và kết luận đã xong. Bạn nên đọc nó thế nào?

```text
Unit tests: passed
End-to-end: not run, preview server unavailable
```

- [ ] Mọi test đều đạt vì không có dòng FAIL
- [x] Test từng phần đạt, luồng xuyên suốt chưa kiểm; cần bổ sung môi trường và bằng chứng
- [ ] Chỉ cần yêu cầu agent tự chấm lại độ tin cậy

**Giải thích:** “Không chạy” không phải “đã qua”. Tự chấm lại không tạo ra kết quả thực thi cho phần môi trường đang thiếu.

### Cursor sửa nút Lưu, báo test xanh nhưng diff có thêm `test.skip`. Việc gì cần làm?

- [ ] Chấp nhận vì test được bỏ qua chắc là không liên quan
- [ ] Chỉ yêu cầu ảnh chụp nút Lưu
- [x] Xem test nào bị bỏ, lý do và tiêu chí bị mất kiểm trước khi nghiệm thu

**Giải thích:** Test bị bỏ có thể che lỗi đúng ở luồng vừa sửa. Ảnh của nút không chứng minh dữ liệu đã lưu; cần biết bộ kiểm còn bảo vệ điều gì.

### API lưu địa chỉ giả trả thành công nhưng tải lại trang vẫn hiện địa chỉ cũ. Bằng chứng nào đang thiếu?

- [x] Luồng lưu rồi đọc lại qua giao diện, gồm việc dữ liệu mới có được giữ hay không
- [ ] Một lần lint nữa để chứng minh lưu thành công
- [ ] Lời giải thích rằng API đã trả mã thành công

**Giải thích:** Phản hồi thành công chưa chứng minh dữ liệu đi tới nơi và hiển thị lại đúng. Lint không kiểm trạng thái lúc ứng dụng chạy.

### Agent chạy kiểm, sau đó sửa thêm cách ánh xạ tên cột trong file xuất. Có dùng nguyên kết quả cũ không?

- [ ] Có, chỉ đổi tên cột nên không ảnh hưởng
- [x] Cần kiểm lại phần bị ảnh hưởng và gắn kết quả với code sau sửa
- [ ] Có, vì đã lưu thay đổi mới vào cùng một commit

**Giải thích:** Thay ánh xạ có thể làm mất hoặc sai dữ liệu. Kết quả cũ thuộc code trước sửa; commit chỉ lưu thay đổi, không tự chạy kiểm cho phần vừa thêm.

## Kiểm tra không dùng AI

### Trong app đăng ký hội thảo, agent báo đã làm danh sách chờ. Bạn chỉ nhận ảnh giao diện và log test kiểm số chỗ. Hãy đề xuất một phép thử xuyên suốt với dữ liệu giả và nói rõ giới hạn của bằng chứng hiện có.

#### Đáp án

Ảnh chỉ cho thấy giao diện, test số chỗ chỉ kiểm phần tính toán được chọn. Trên bản thử, tạo hội thảo giả hết chỗ, dùng người tham dự giả gửi đăng ký, kiểm thông báo vào danh sách chờ rồi mở lại danh sách để thấy đúng người và trạng thái. Thử hội thảo còn chỗ để phân biệt với đăng ký được nhận. Ghi phiên bản, các bước và kết quả. Chưa có các kiểm này thì chưa kết luận toàn luồng đạt; cũng không suy từ bản giả rằng cấu hình hệ thống thật đã đúng.

## Lỗi suy luận hay gặp

### “Agent viết báo cáo rất chi tiết nên chắc đã chạy”

Độ dài báo cáo không thay thế output. Yêu cầu lệnh, kết quả và tiêu chí tương ứng; những gì chưa chạy phải ghi riêng. Một kế hoạch kiểm tra viết bằng thì tương lai không phải bằng chứng đã thực hiện.

### “Có e2e rồi thì bỏ test nhỏ được”

E2e thường chậm hơn và khó chỉ ra lỗi chính xác ở đâu. Test nhỏ giúp phát hiện nhanh các trường hợp biên, còn e2e kiểm việc kết nối thành luồng. Chọn cả hai theo rủi ro; không dùng một lớp làm lý do bỏ lớp kia.

### “Đã chạy luồng chính thì app an toàn”

Luồng chính thường dùng dữ liệu hợp lệ và tài khoản có quyền. Nó chưa kiểm dữ liệu sai, tài khoản không được phép hay lỗi dịch vụ. Thêm trường hợp liên quan tới tiêu chí, và luôn nói rõ những giới hạn còn lại.

## Bài tập thực hành

Mục tiêu: lập bảng bằng chứng cho một thay đổi nhỏ trên bản thử có dữ liệu giả. Không tạo giao dịch, gửi email thật hoặc sửa dữ liệu production.

### Việc cần làm

1. Chọn một thay đổi đã có tiêu chí, ghi phiên bản code và môi trường thử được phép dùng.
2. Với mỗi tiêu chí, ghi bằng chứng hiện có và đánh dấu đạt, thất bại hoặc chưa kiểm.
3. Chọn một luồng từ thao tác đầu tới kết quả cuối, cùng một trường hợp không hợp lệ.
4. Thực hiện trên dữ liệu giả nếu môi trường sẵn sàng; nếu bị chặn, ghi lỗi và bước chưa thực hiện.
5. So kết quả với lời agent báo, viết kết luận có giới hạn và việc còn cần kiểm.

### Kết quả đúng

Mỗi kết luận đều trỏ tới kết quả quan sát hoặc output, không có ô “đạt” chỉ vì agent nói vậy. Bạn chỉ ra được bằng chứng nào thuộc test nhỏ, bằng chứng nào thuộc toàn luồng, và phần nào vẫn chưa đủ để nghiệm thu.
