---
id: agent-handoff
title: Bàn giao giữa các phiên làm việc của agent
group: ai-git
prerequisites: [agent-instructions, git-commit]
priority: 2
stage: 2
format: 2
signals: ["PROGRESS.md", "handoff", "bàn giao", "phiên mới", "git status"]
sources:
  - title: Learn Harness Engineering — Lecture 05
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-05-why-long-running-tasks-lose-continuity/index.md
  - title: Learn Harness Engineering — Lecture 06
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-06-why-initialization-needs-its-own-phase/index.md
  - title: Learn Harness Engineering — Lecture 12
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-12-why-every-session-must-leave-a-clean-state/index.md
---

## Nhắc lại

### File hướng dẫn ngắn nên giúp phiên mới tìm những thông tin nào?

Mục đích dự án, ranh giới phải giữ, cách chạy, cách kiểm và tài liệu chi tiết. Nó cũng nên trỏ tới nơi ghi tiến độ để agent biết bắt đầu từ đâu.

### Có commit rồi thì đã biết vì sao một cách làm được chọn chưa?

Chưa chắc. Diff cho thấy điều đã đổi, nhưng lý do có thể chỉ nằm trong chat. Quyết định quan trọng cần lời giải thích trong tài liệu hoặc thông điệp commit rõ ràng.

## Đoán trước

Bạn làm app theo dõi giao hàng. Phiên trước agent đã thống nhất dùng trạng thái giả để kiểm màn hình, vì chưa được nối dịch vụ vận chuyển thật. Sang phiên mới, bạn nói “làm tiếp”. Agent thấy chưa có kết nối, cho rằng đó là phần thiếu và bắt đầu thiết kế gọi dịch vụ thật. Cả hai phiên đều tưởng mình đi đúng kế hoạch. Mẩu thông tin nào đã mất giữa hai phiên?

### Đáp án

Mất lý do dùng dữ liệu giả, giới hạn hiện tại và bước tiếp theo đã chốt. Code cho thấy có dữ liệu giả nhưng không tự nói đó là quyết định có chủ ý. Một ghi chú bàn giao cần lưu cả “đã làm gì” lẫn “vì sao”, điều chưa được phép làm và cách xác nhận trạng thái repo. Chỉ ghi “màn hình giao hàng gần xong” sẽ khiến phiên mới tiếp tục đoán.

## Ví dụ mẫu

**Bàn giao phiên** là để lại đủ thông tin trong repo cho phiên sau tiếp tục mà không phải dựng lại cả lịch sử chat. Ngữ cảnh mà agent xử lý có giới hạn; khi một công việc kéo dài, phần giải thích cũ có thể không còn đầy đủ trong phiên mới. Bản tóm tắt chat hữu ích, nhưng file được quản lý cùng code là nơi bạn chủ động kiểm và sửa được.

Với dự án chưa có nền vận hành, dành một **phiên khởi tạo** riêng: xác nhận cách chạy bản thử, chạy được một test có ý nghĩa, ghi lệnh chuẩn, tạo danh sách việc và file tiến độ, lưu mốc Git. Với repo đã có sẵn, kiểm lại nền đó và dùng quy ước hiện hành; không tự cài thêm bộ test mới chỉ vì phiên này không thấy hướng dẫn.

Mẫu bàn giao dưới đây là dữ liệu minh họa, không phải kết quả test của dự án bạn:

```markdown
# PROGRESS.md — màn hình giao hàng thử
- Phạm vi: xem trạng thái từ bộ dữ liệu giả ở máy.
- Mốc đã kiểm: DEMO_COMMIT, thay bằng mã commit thật khi ghi.
- Đã đạt: danh sách hiển thị trạng thái đúng theo dữ liệu giả.
- Quyết định: chưa nối hãng vận chuyển vì chưa có môi trường thử.
- Kiểm: test danh sách và build đã qua tại mốc nêu trên.
- Còn thiếu: trạng thái rỗng chưa có thông báo rõ.
- Bước tiếp: thêm thông báo rỗng và kiểm lại danh sách.
- Cấm: không dùng mã vận đơn hoặc tài khoản khách thật.
- Cách chạy/kiểm: xem docs/testing.md.
```

Lịch vào ca và ra ca giúp ghi chú không bị bỏ quên:

```text
Đầu phiên:
1. Đọc hướng dẫn, tiến độ và lý do quyết định liên quan.
2. Xem git status, mốc Git và cách chạy bản thử.
3. Chạy kiểm nền được tài liệu chỉ định, rồi chọn một việc.
Cuối phiên:
1. Kiểm build, test liên quan và đường chạy chuẩn.
2. Ghi kết quả, việc còn thiếu, lý do và bước tiếp theo.
3. Rà file tạm do phiên tạo; không xóa thay đổi của người khác.
4. Đọc diff, commit phần hoàn chỉnh đã kiểm và kiểm trạng thái.
```

**Repo sạch để bàn giao** không chỉ là `git status` không hiện thay đổi. Cần build và test đạt, tiến độ đúng, artifact tạm được xử lý và đường chạy chuẩn còn dùng được. Một commit chứa code lỗi vẫn có thể làm Git trông sạch. Ngược lại, file nháp của đồng đội không phải thứ bạn được xóa chỉ để hết chữ đỏ.

Nếu buộc phải dừng khi kiểm chưa qua, hãy ghi trung thực trạng thái chưa hoàn tất, lỗi đã thấy và phần thay đổi cần bảo toàn. Đừng đánh dấu đã xong hoặc dùng lệnh dọn mạnh để tạo vẻ sạch. Người tiếp nhận cần biết đây là bàn giao có vấn đề còn mở, không phải một mốc đã nghiệm thu.

## Tìm trong project của bạn

1. Tìm `PROGRESS.md`, `docs/progress.md`, tài liệu quyết định hoặc file tương đương. Ghi `[đường dẫn, ngày hoặc mốc cập nhật]`. Không có tên chuẩn bắt buộc cho mọi repo; quan trọng là file hướng dẫn trỏ đúng tới nó.
2. Đọc một quyết định đang ảnh hưởng code. Có ghi lý do, giới hạn và điều kiện xem lại không? Ghi `[quyết định / lý do tìm thấy / còn thiếu]`, nhất là các đoạn dữ liệu giả hoặc tính năng cố ý chưa làm.
3. Chạy `git status` và `git log -n 3 --oneline` trong repo thử. So với ghi chú. Nếu có file dở chưa được nhắc tới, ghi tên và người phụ trách trước khi cho phiên mới sửa tiếp.
4. Tìm cách chạy và kiểm đã được xác nhận. Ghi `[lệnh trong tài liệu, môi trường, lần chạy gần nhất]`. Nếu thiếu dependency hoặc quyền, đó là thông tin chặn; không tự đổi môi trường hay dùng tài khoản thật để lấp chỗ trống.
5. Chỉ từ các file trên, viết ra việc tiếp theo trong một câu cùng tiêu chí đạt. Nếu phải tìm lại chat để hiểu thì bổ sung kết luận cần thiết vào ghi chú bàn giao.

Thử đọc ghi chú như một người chưa dự họp. “Đã sửa lỗi hôm qua” không đủ để hành động. “Khi danh sách rỗng, màn hình vẫn hiện trạng thái cũ; cần kiểm trường hợp rỗng bằng bộ dữ liệu giả” cho phiên sau một điểm bắt đầu cụ thể.

## Tự giải thích

### Vì sao cần tách khởi tạo khỏi phát triển tính năng trong repo mới?

Nếu chưa chạy được test mà đã viết chức năng, bạn tích lũy code chưa biết cách kiểm. Phiên khởi tạo tạo nền dùng lại được: cách chạy, kiểm, tiến độ và mốc Git. Nhờ đó phiên làm tính năng không phải vừa đoán môi trường vừa đoán nghiệp vụ.

### Vì sao ghi “đã làm gì” vẫn chưa đủ?

Phiên sau nhìn thấy code nhưng có thể hiểu sai mục đích. Lý do “dùng dữ liệu giả vì chưa có môi trường dịch vụ” ngăn nó tự nối hệ thống thật. Ghi lý do của quyết định còn hiệu lực hữu ích hơn lưu mọi lượt suy nghĩ và thử nghiệm.

### Nếu ghi chú nói test qua nhưng code hiện tại đã đổi thì tin điều gì?

Ghi chú là bằng chứng lịch sử, không bảo đảm cho thay đổi mới. So mốc và chạy lại kiểm liên quan trên trạng thái hiện tại. Nếu có sai lệch, cập nhật ghi chú để phản ánh thực tế thay vì bỏ qua lỗi nhằm giữ báo cáo cũ đúng.

## Trắc nghiệm

### Phiên mới chỉ nhận câu “tiếp tục phần còn lại”. Ghi chú nào hữu ích nhất?

- [x] Mốc code, việc đã kiểm, lỗi còn lại, lý do quyết định và bước tiếp theo
- [ ] Toàn bộ bản chat không chọn lọc, không cần file tiến độ
- [ ] Số dòng code phiên trước đã viết

**Giải thích:** Các mục có cấu trúc giúp xác định việc tiếp tục và điều chưa được đổi. Lịch sử chat dài có thể chứa phương án đã bỏ; số dòng không nói trạng thái chức năng.

### Bạn thấy hai kết quả sau. Có thể gọi đây là mốc sạch để tiếp tục tính năng mới không?

```text
git status: working tree clean
build: failed
```

- [ ] Có, vì Git xác nhận không còn thay đổi
- [ ] Có, miễn file tiến độ ghi đã commit
- [x] Chưa; cần xử lý hoặc ghi rõ build bị chặn, không coi mốc này đã kiểm đạt

**Giải thích:** Git sạch chỉ nói không có thay đổi chưa commit. Nó không kiểm khả năng build hay khởi động; commit không biến lỗi thành trạng thái dùng được.

### Agent định xóa mọi file chưa theo dõi trước khi bàn giao. Bạn nên yêu cầu gì?

- [ ] Cho xóa vì file ngoài Git đều là file tạm
- [x] Liệt kê, xác định file của phiên và bảo toàn những file chưa rõ chủ sở hữu
- [ ] Thêm tất cả vào commit để khỏi phải xem

**Giải thích:** File mới có thể là công việc thật của người khác. Cả xóa hàng loạt lẫn commit hàng loạt đều bỏ qua bước xác định mục đích và phạm vi.

### Trong repo mới, agent muốn viết cả đăng nhập lẫn tìm kiếm khi chưa có lệnh kiểm chạy được. Bước nào hợp lý?

- [x] Hoàn thành nền chạy/kiểm và tài liệu khởi tạo trước, rồi chọn một tính năng
- [ ] Viết hết code, cuối dự án mới cấu hình test
- [ ] Chỉ viết tài liệu lệnh kiểm, chưa cần chạy thử vì framework đã có

**Giải thích:** Nền kiểm chứng được giúp phát hiện lỗi sớm. Có framework và tài liệu chưa chứng minh lệnh chạy thành công; cần kết quả thực thi trước khi tích lũy tính năng chưa kiểm.

## Kiểm tra không dùng AI

### App đặt phòng đang dùng lịch giả theo múi giờ cố định để kiểm hiển thị. Phiên trước chọn như vậy để tránh thay đổi theo máy người chạy, nhưng chỉ ghi “đã làm lịch”. Phiên sau đề nghị đổi sang giờ máy. Hãy viết những thông tin cần bổ sung trước khi tiếp tục.

#### Đáp án

Ghi quyết định dùng múi giờ cố định, lý do kiểm có thể lặp lại, dữ liệu giả nào được dùng và phạm vi chỉ là môi trường thử. Ghi mốc code, lệnh kiểm đã chạy, kết quả và phần chưa kiểm về múi giờ người dùng thật. Bước tiếp phải nói rõ đang kiểm điều gì, chưa đổi chính sách giờ. Phiên sau đối chiếu ghi chú với code và xác nhận kiểm nền trước khi sửa. Không cần chép cả cuộc thảo luận, cần lưu kết luận và lý do còn hiệu lực.

## Lỗi suy luận hay gặp

### “Agent có nhớ chat nên không cần bàn giao”

Không nên phụ thuộc vào khả năng nhớ của một phiên hay một công cụ. File trong repo là thứ bạn và phiên sau cùng xem được. Lưu phần quyết định và trạng thái cần thiết giúp đổi người, đổi phiên mà vẫn có điểm tựa.

### “Cuối phiên quá bận, phiên sau sẽ tự dọn”

Phiên sau không biết đoạn nào là thử nghiệm và đoạn nào đã duyệt. Dành thời gian ghi tiến độ, kiểm và xử lý artifact của mình trong mỗi phiên. Nếu chưa kịp, ghi rõ việc còn mở để tránh bị coi là hoàn thành.

### “Ghi càng nhiều log thì bàn giao càng tốt”

Log dài không có chỉ dẫn khiến phiên sau phải đọc lại từ đầu. Giữ kết luận ngắn với đường dẫn tới bằng chứng cần thiết, che thông tin nhạy cảm và ghi một bước tiếp theo rõ ràng. Không đưa khóa hay dữ liệu thật vào tài liệu theo dõi.

## Bài tập thực hành

Mục tiêu: tạo một ghi chú để tự tiếp nhận được công việc mà không mở chat cũ. Chỉ dùng bản sao tài liệu hoặc nhánh thử, không dọn file của người khác và không thay môi trường.

### Việc cần làm

1. Chọn một thay đổi nhỏ đã hoàn tất, ghi mốc Git và những kiểm tra thực sự đã chạy.
2. Viết bản nháp bàn giao gồm phạm vi, kết quả, một lý do quyết định, phần chưa kiểm và bước tiếp.
3. Dẫn tới tài liệu chạy/kiểm hiện có; nếu chưa có thì ghi thiếu, không bịa lệnh.
4. Đóng chat cũ, chỉ đọc bản nháp và repo rồi tự trả lời: đang ở đâu, vì sao như vậy, tiếp theo làm gì?
5. Sửa những chỗ phải đoán, đối chiếu với `git status` và kết quả kiểm trước khi đề nghị lưu bản chính.

### Kết quả đúng

Bạn tiếp nhận được việc chỉ từ repo, phân biệt rõ đã kiểm với chưa kiểm và biết quyết định nào không được tự ý đổi. Ghi chú khớp mốc code, không chứa dữ liệu riêng và không tuyên bố sạch chỉ dựa vào trạng thái Git.
