---
id: agent-instructions
title: File hướng dẫn cho agent (AGENTS.md, CLAUDE.md)
group: ai-git
prerequisites: [ai-task-context, git-commit]
priority: 1
stage: 2
format: 2
signals: ["AGENTS.md", "CLAUDE.md", "docs/", "hướng dẫn agent", "harness"]
sources:
  - title: Learn Harness Engineering — Lecture 01
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-01-why-capable-agents-still-fail/index.md
  - title: Learn Harness Engineering — Lecture 02
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-02-what-a-harness-actually-is/index.md
  - title: Learn Harness Engineering — Lecture 03
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-03-why-the-repository-must-become-the-system-of-record/index.md
  - title: Learn Harness Engineering — Lecture 04
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-04-why-one-giant-instruction-file-fails/index.md
---

## Nhắc lại

### Một lần giao việc cần nêu gì để agent không tự đoán phạm vi?

Nêu mục tiêu, file được sửa, phần không được đụng, hiện trạng và tiêu chí xong. Quy tắc dùng cho mọi lần giao nên có chỗ lưu riêng trong repo.

### Commit giúp gì cho một quyết định viết trong tài liệu?

Commit lưu phiên bản của quyết định cùng thời điểm thay đổi. Người đọc sau có thể xem quy tắc đã đổi thế nào, thay vì dựa vào trí nhớ của người viết.

## Đoán trước

Bạn làm app đặt lịch cho phòng tập. Trong chat hôm qua, bạn đã dặn agent chỉ dùng danh sách lớp giả khi thử tính năng. Hôm nay mở phiên mới, bạn nhờ thêm bộ lọc huấn luyện viên. Agent thấy một tài liệu cũ ghi “thử trên tài khoản quản trị” và đề xuất dùng dữ liệu khách thật để kiểm. Bạn tưởng lời dặn hôm qua vẫn có hiệu lực trong trí nhớ của nó. Điều gì đã thiếu trong cách tổ chức dự án?

### Đáp án

Quyết định quan trọng chỉ nằm trong một cuộc chat, còn tài liệu trong repo đang chỉ hướng khác. Agent chỉ làm việc với ngữ cảnh, file và kết quả công cụ mà nó được tiếp cận; không nên trông chờ nó biết các cuộc trao đổi khác. Hãy ghi quy tắc dùng dữ liệu giả vào tài liệu được quản lý cùng code, cập nhật chỗ mâu thuẫn, rồi yêu cầu phiên mới chỉ ra file chứa quy tắc trước khi sửa.

## Ví dụ mẫu

**File hướng dẫn cho agent** giống tờ chỉ dẫn ở cửa một xưởng: xưởng làm gì, dụng cụ ở đâu, quy định nào bắt buộc, cần đọc sổ nào cho công việc hôm nay. `AGENTS.md` và `CLAUDE.md` là những tên file thường dùng cho mục đích này. Cách công cụ nạp file có thể khác nhau; hãy kiểm bằng việc yêu cầu agent dẫn lại đường dẫn và quy tắc đã đọc.

**Harness** là phần tổ chức quanh mô hình: hướng dẫn, công cụ, môi trường chạy, trạng thái công việc và phản hồi kiểm tra. Bạn không cần xây hệ thống điều phối mới. Với app nhỏ, các phần này có thể là tài liệu ngắn, quyền chạy lệnh trong repo thử, môi trường có sẵn, file tiến độ và kết quả test. File hướng dẫn chỉ giải quyết một phần của chúng.

Mẫu sau dành cho một repo minh họa đã có các tài liệu được nhắc tới. Đây là nội dung file, không phải lệnh để dán vào Terminal:

```markdown
# Hướng dẫn dự án đặt lịch thử
- App giúp khách xem lớp và đặt lịch.
- Chỉ dùng dữ liệu giả trong bản chạy ở máy.
- Không đổi cấu hình thanh toán trong việc giao diện.
- Cách chạy và kiểm: đọc docs/testing.md.
- Sửa quy tắc đặt lịch: đọc docs/booking-rules.md.
- Tiến độ hiện tại: đọc docs/progress.md.
- Trước khi báo xong: nêu lệnh kiểm và kết quả thật.
```

Tài liệu chi tiết giải thích một quy tắc, nơi áp dụng và lý do tồn tại:

```markdown
# docs/booking-rules.md
- Một khách không được đặt hai lớp trùng giờ.
- Áp dụng cả khi đặt mới và đổi lịch.
- Lý do: tránh giữ chỗ ở lớp khách không thể tham dự.
- Kiểm bằng hai lịch giả có giờ giao nhau.
- Khi chính sách đổi, cập nhật tài liệu cùng test liên quan.
```

Không chép toàn bộ hướng dẫn thanh toán, lịch sử lỗi và cách deploy vào file ở cửa. Một file quá dài khiến luật quan trọng khó thấy, các chỉ dẫn cũ dễ mâu thuẫn. Giữ file đầu ngắn như mục lục, có điều kiện “khi sửa phần nào thì đọc gì”. Đường dẫn phải tồn tại; một mục lục đẹp nhưng trỏ tới file đã chuyển chỗ vẫn làm phiên mới đi sai đường.

## Tìm trong project của bạn

1. Mở danh sách file trong repo, tìm `AGENTS.md`, `CLAUDE.md`, `README.md` và `docs/`. Chỉ đọc tài liệu dự án; không mở file chứa khóa hoặc dữ liệu khách. Ghi file đang làm cửa vào: `[đường dẫn hoặc chưa có]`.
2. Chọn một quy tắc bạn từng phải nhắc lại, chẳng hạn “chỉ chủ lịch được đổi lịch”. Tìm câu đó trong tài liệu. Ghi vị trí cụ thể: `[file, mục]`, hoặc đánh dấu “chỉ có trong chat”.
3. Theo từng đường dẫn từ file hướng dẫn. Ghi một link còn dùng được và một link thiếu hoặc lỗi thời nếu có. Kiểm xem tài liệu chạy test có khớp lệnh đã được đội dùng thành công không; đừng tự chạy lệnh lạ.
4. Tách luật bắt buộc khỏi sở thích. “Không dùng dữ liệu thật để thử” là ranh giới; “ưu tiên đặt tên ngắn” là quy ước. Ghi một cặp chỉ dẫn mâu thuẫn cần người phụ trách quyết định, không để agent tự chọn.
5. Tự trả lời từ repo: app làm gì, code chia ra sao, chạy bằng cách nào, kiểm thế nào, đang làm tới đâu? Với mỗi câu ghi `[đường dẫn bằng chứng / chưa tìm thấy]`. Chỗ trống là thông tin cần bổ sung cho phiên sau.

Một repo có thể đủ hướng dẫn nhưng chưa chạy được test vì thiếu công cụ. Hãy ghi thiếu ở phần môi trường hoặc quyền công cụ. Thêm nhiều câu dặn vào `AGENTS.md` không tự cài được dependency hay tạo ra kết quả kiểm tra.

## Tự giải thích

### Vì sao một quyết định nên nằm trong repo thay vì chỉ ghim trong nhóm chat?

Repo cho phép quyết định đi cùng phiên bản code và có đường dẫn ổn định để phiên mới đọc. Chat vẫn hữu ích để thảo luận, nhưng kết luận ảnh hưởng tới cách làm phải được đưa vào tài liệu có người chịu trách nhiệm cập nhật.

### Vì sao rút ngắn file hướng dẫn không có nghĩa là bỏ bớt quy tắc an toàn?

Ta giữ ranh giới chung ở cửa vào, chuyển chi tiết tới tài liệu liên quan và chỉ rõ lúc cần đọc. Mục tiêu là tìm đúng quy tắc dễ hơn. Nếu chuyển mà mất đường dẫn hoặc bỏ điều kiện áp dụng thì đó là làm thiếu, không phải tổ chức tốt hơn.

## Trắc nghiệm

### Codex nói không biết phải chạy test nào. `AGENTS.md` chỉ ghi “hãy kiểm kỹ”. Bạn sửa gì trước?

- [ ] Lặp lại câu “kiểm kỹ” ở cuối mỗi yêu cầu
- [x] Thêm đường dẫn tới tài liệu có lệnh kiểm đã xác nhận và phạm vi chạy
- [ ] Chép mọi file test vào file hướng dẫn

**Giải thích:** Agent cần một cách kiểm cụ thể và thực hiện được. Nhắc kỹ hơn không bổ sung thông tin đang thiếu; chép toàn bộ test làm tài liệu khó duy trì.

### Bạn thấy hai dòng sau ở hai tài liệu. Nên xử lý thế nào?

```text
AGENTS.md: Dùng dữ liệu giả khi thử đặt lịch.
docs/testing.md: Dùng danh sách khách thật để thử đặt lịch.
```

- [x] Dừng việc thử, xác nhận quy tắc đúng và cập nhật chỗ mâu thuẫn
- [ ] Để agent chọn tài liệu có ngày sửa mới hơn
- [ ] Giữ cả hai để agent có nhiều lựa chọn

**Giải thích:** Đây là xung đột ảnh hưởng dữ liệu, không phải lựa chọn tùy ý. Ngày sửa mới không chứng minh nội dung đã được duyệt; cần một quy tắc thống nhất trước khi thực hiện.

### Một phiên mới đọc repo và không tìm thấy lý do cấm sửa giá sau khi đơn xác nhận. Điều nào giúp lâu dài?

- [ ] Dán toàn bộ lịch sử chat của nhóm vào mỗi phiên
- [ ] Chỉ thêm câu “đừng làm sai nghiệp vụ”
- [x] Ghi quy tắc cùng lý do vào tài liệu đơn hàng, dẫn tới đó từ file hướng dẫn

**Giải thích:** Quyết định cụ thể, ở nơi dễ tìm, giúp phiên sau hiểu giới hạn. Lịch sử chat chứa nhiều nhánh thảo luận chưa được chốt và không thay thế được kết luận hiện hành.

### Agent đã đọc `CLAUDE.md` nhưng không có quyền chạy lệnh test. Có thể coi harness đã đầy đủ chưa?

- [ ] Có, file hướng dẫn là toàn bộ harness
- [x] Chưa; cần giải quyết khả năng kiểm tra trong môi trường được phép
- [ ] Có, agent đọc code và tự nhận xét thay cho test được

**Giải thích:** Hướng dẫn không thay thế công cụ và phản hồi thực thi. Cần quyền phù hợp trong môi trường thử, hoặc ghi rõ chưa kiểm được; không cần trao quyền vào hệ thống thật.

## Kiểm tra không dùng AI

### Một phiên mới sửa app thư viện và cho mượn cả sách đang được sửa chữa. Bạn tìm thấy quy định “không cho mượn sách bảo trì” chỉ trong tin nhắn của thủ thư. Hãy đề xuất cách để phiên sau tìm được quy định mà không phải đọc toàn bộ lịch sử chat.

#### Đáp án

Viết quy tắc và lý do vào tài liệu mượn sách trong repo, ghi rõ áp dụng lúc chọn sách và xác nhận mượn. Thêm đường dẫn có điều kiện đọc vào file hướng dẫn. Nhờ người phụ trách xác nhận quy tắc, rồi lưu cùng thay đổi kiểm tra bằng dữ liệu sách giả. Phiên mới phải chỉ được tài liệu và cách kiểm trạng thái bảo trì. Chỉ nhắc thêm trong chat hiện tại chưa giải quyết việc phiên sau thiếu thông tin.

## Lỗi suy luận hay gặp

### “Agent thông minh thì tự biết quy định riêng của tôi”

Nó có thể đoán một quy ước phổ biến, nhưng không biết quyết định chưa được cung cấp. Hãy tìm câu trả lời trong repo trước; nếu bạn cũng không tìm được thì cần ghi lại, thay vì yêu cầu agent đoán chính xác hơn.

### “Cứ có lỗi là thêm một đoạn vào file hướng dẫn chung”

Làm vậy dễ tích lũy luật cũ và chi tiết không liên quan. Xác định lỗi do thiếu quy tắc, thiếu môi trường hay thiếu bước kiểm. Chỉ thêm hướng dẫn đúng chỗ, đồng thời sửa hoặc bỏ chỉ dẫn đã hết hiệu lực sau khi xác nhận.

### “Đã viết cấm thì agent không thể làm”

Văn bản không phải khóa quyền. Sau công việc, vẫn xem danh sách file thay đổi và kết quả kiểm. Giới hạn quyền công cụ, dữ liệu thử và kiểm tra thực tế mới giúp phát hiện việc vượt ranh giới đã ghi.

## Bài tập thực hành

Mục tiêu: soạn một mục lục hướng dẫn đủ cho người mới hiểu một phần app. Chỉ làm bản nháp trong tài liệu trên nhánh thử, chưa thay file hướng dẫn đang được đội dùng.

### Việc cần làm

1. Chọn một tính năng không nhạy cảm và một quy tắc đã được xác nhận của nó.
2. Viết bản nháp gồm mục đích app, ranh giới dữ liệu thử, đường dẫn cách chạy, cách kiểm và tiến độ.
3. Mở từng tài liệu được trỏ tới để xác nhận tồn tại. Chỗ chưa có tài liệu thì ghi “còn thiếu”, không bịa lệnh.
4. Nhờ một người hoặc tự đọc như người mới, trả lời năm câu hỏi trong mục tìm project và ghi chỗ phải đoán.
5. Sửa bản nháp, ghi lý do của thay đổi và đọc diff trước khi đề nghị đội áp dụng.

### Kết quả đúng

Bạn có bản nháp ngắn, đường dẫn kiểm được, quy tắc không mâu thuẫn và danh sách thông tin còn thiếu. Người đọc phân biệt được luật bắt buộc với hướng dẫn tham khảo. Không có khóa, dữ liệu khách hay lệnh tác động hệ thống thật trong bản nháp.
