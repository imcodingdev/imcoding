---
id: github-access
title: Bảo vệ nhánh chính và cấp quyền cho agent
group: auth
prerequisites: [pull-request, secrets, security-boundaries]
priority: 1
stage: 3
format: 2
signals: ["Require status checks", "Require pull request reviews", "permissions", "GITHUB_TOKEN", "fine-grained", "Allow force pushes"]
sources:
  - title: GitHub Docs — About protected branches
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
  - title: GitHub Docs — Personal access tokens
    url: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
  - title: GitHub Docs — GITHUB_TOKEN in workflows
    url: https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication
  - title: GitHub Docs — Forks
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks
  - title: GitHub Docs — About Projects
    url: https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
  - title: GitHub Docs — Status checks
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks
---

## Nhắc lại

### Vì sao một lời dặn “đừng sửa ngoài phạm vi” không thay thế giới hạn quyền?

Lời dặn mô tả hành vi mong muốn; quyền quyết định agent thực sự làm được gì. Nếu công cụ vẫn có quyền sửa mọi repo hoặc cấu hình bảo vệ, một sai sót có thể vượt xa việc bạn giao.

### Approve một PR có nghĩa là mọi điều kiện merge đã đủ chưa?

Chưa. PR còn có thể thiếu kiểm bắt buộc, có xung đột hoặc phản hồi chưa xử lý. Phải đọc quy tắc áp dụng và trạng thái của phiên bản hiện tại, không chỉ một approval.

## Đoán trước

Agent cần sửa một câu chữ trong repo thử nhưng xin token truy cập mọi repo, không hết hạn, kèm quyền quản trị “để khỏi bị lỗi”. Bạn đã dặn chỉ mở PR nên định đồng ý. Nếu agent gặp kiểm đỏ rồi tự sửa cài đặt bảo vệ nhánh, lời dặn của bạn có ngăn được không?

### Đáp án

Không nên dựa vào lời dặn để ngăn hành động mà quyền đã cho phép. Chỉ cấp quyền cần cho repo và tác vụ, có hạn dùng, không cấp quản trị để né lỗi. Đồng thời bảo vệ nhánh nhận thay đổi bằng PR, review và kiểm bắt buộc; xem cả ai có quyền bỏ qua quy tắc. Nếu thiếu quyền, yêu cầu agent báo rõ thao tác bị chặn trước khi xem xét thêm quyền.

## Ví dụ mẫu

Một nhân viên giao hàng cần mở cửa kho lấy kiện hàng, không cần chìa khóa phòng kế toán. Với agent, **ít quyền nhất** nghĩa là chỉ cho truy cập tài nguyên và hành động cần để hoàn thành việc đã giao. Giới hạn repo, loại thao tác và thời gian dùng giúp thu hẹp hậu quả khi agent làm sai hoặc thông tin xác thực bị lộ.

Trên GitHub, **protected branch** là nhánh có quy tắc bảo vệ. Bạn có thể yêu cầu thay đổi đi qua PR có review, yêu cầu status checks đạt trước merge và ngăn force push. **Rulesets** là cách quản lý quy tắc khác; nguồn GitHub phân biệt chúng với branch protection vì nhiều quy tắc branch protection chồng nhau không cùng áp dụng như rulesets. Bài này tập trung đọc hiệu lực bảo vệ, không hướng dẫn cấu hình ruleset nâng cao.

Các mục cần nhận ra gồm **Require pull request reviews before merging**, **Require status checks before merging**, **Do not allow bypassing the above settings** và **Allow force pushes**. Quy tắc phải khớp đúng nhánh cần bảo vệ. Nhánh có tên `main` không tự được bảo vệ, và chỉ đặt required checks không đồng nghĩa bắt mọi thay đổi phải qua PR.

```text
Bản ghi kiểm quyền cho repo thử, không phải file cấu hình:
Nhánh được bảo vệ: thu-tich-hop
Đường nhận thay đổi: PR + review bắt buộc
Kiểm bắt buộc: tên job kiểm đã xác minh đang chạy
Force push: không cho phép
Bỏ qua quy tắc: kiểm cả quyền admin và tài khoản agent
Agent: làm ở nhánh thử, không được sửa quy tắc bảo vệ
```

Branch protection mặc định chặn force push và xóa nhánh khớp quy tắc, nhưng có thể được cấu hình khác. Quy tắc cũng thường không áp dụng cho quản trị viên hoặc vai trò có quyền bypass nếu chưa yêu cầu áp dụng với họ. Vì vậy “repo có bảo vệ” chưa đủ: phải biết agent đang dùng danh tính nào và danh tính đó có đi vòng được không.

Status check là kết quả kiểm gắn với commit. Khi đặt required checks, cần chọn đúng kiểm và xem nó có chạy công việc cần thiết. Trạng thái `skipped` hoặc `neutral` có thể thỏa điều kiện bảo vệ theo cơ chế GitHub; một job bị bỏ qua có thể báo thành công. Kiểm tra log và phạm vi test, không dùng màu xanh làm bằng chứng duy nhất.

**Personal access token**, viết tắt PAT, là thông tin xác thực gắn với người tạo. Token không trao quyền vượt quá quyền người đó có, nhưng việc bạn có quyền rộng không có nghĩa token cũng cần rộng. Khi trường hợp sử dụng được hỗ trợ, GitHub khuyến nghị **fine-grained PAT** để giới hạn chủ tài nguyên, repo và quyền cụ thể.

Khi xem cấu hình token, chú ý **Resource owner**, **Repository access**, **Permissions** và **Expiration**. Chọn đúng chủ sở hữu, repo cần làm, quyền tối thiểu và hạn dùng phù hợp thời gian công việc. Token vẫn có quyền đọc các repo public; giới hạn repo ở đây không có nghĩa khóa mọi khả năng đọc công khai. Không dán giá trị token vào issue, chat, code hoặc báo cáo.

Fine-grained PAT không hỗ trợ mọi trường hợp; chính sách tổ chức cũng có thể yêu cầu phê duyệt. Token ở trạng thái `pending` chưa được quyền với tài nguyên riêng của tổ chức cho tới khi được duyệt. Đừng chữa lỗi quyền bằng cách xin token không giới hạn. Xác định thao tác, quyền và chính sách đang thiếu trước; dùng cơ chế tích hợp được tổ chức chấp nhận.

**GITHUB_TOKEN** là token tích hợp để workflow GitHub Actions xác thực, khác với PAT cá nhân đưa cho công cụ ngoài workflow. Dùng khóa `permissions` trong workflow hoặc từng job để giới hạn nó. Ví dụ một job chỉ cần đọc nội dung repo có thể khai báo:

```yaml
# Trích phần quyền của job, không phải workflow hoàn chỉnh
permissions:
  contents: read
```

Action có thể truy cập token qua ngữ cảnh `github.token` ngay cả khi workflow không truyền token thành đầu vào rõ ràng. Vì vậy vẫn phải giới hạn permissions và kiểm action đang dùng; đừng suy rằng không thấy dòng truyền token là action không có quyền. Không lấy token của workflow để dán sang chat cho agent.

**Fork** là repo riêng bắt đầu từ repo gốc, vẫn có liên hệ với repo gốc và có thiết lập, quyền riêng; branch chỉ là nhánh trong một repo. Fork hữu ích khi muốn đề xuất thay đổi mà không cần quyền ghi vào repo gốc: sửa trong fork rồi gửi PR nếu chính sách cho phép. Fork của repo public cũng public; không dùng fork làm két chứa bí mật. Chính sách repo và tổ chức có thể giới hạn việc fork.

**Projects** là bảng, board hoặc roadmap để sắp xếp issue và PR. Nó giúp theo dõi công việc; chuyển thẻ sang “xong” không thay review, kiểm bắt buộc hay quyền truy cập. Docker nằm ngoài phạm vi cụm bài này vì bộ nguồn không có tài liệu chính thức để dạy.

## Tìm trong project của bạn

Chỉ xem cấu hình bạn được phép xem; không đổi quyền repo thật, không tạo token thật để thử. Nếu thiếu quyền xem, ghi chưa xác minh và nhờ người quản lý cung cấp thông tin đã che giá trị bí mật.

1. Xác định nhánh nhận code và quy tắc áp dụng. Ghi `[nhánh / bắt PR / bắt review / tên required checks]`. Có vấn đề: quy tắc nhắm nhánh khác hoặc có check nhưng không bắt buộc.
2. Xem force push và ngoại lệ bypass. Ghi `[force push bị chặn / danh tính agent / có ngoại lệ không]`. Không thử force push để kiểm, chỉ đọc cấu hình và bằng chứng do quản trị cung cấp.
3. Xem metadata kết nối agent: `[chủ tài nguyên / repo được chọn / loại quyền / hạn dùng]`. Không xem hay chép chuỗi token. Đánh dấu quyền quản trị hoặc quyền với repo ngoài nhiệm vụ cần được giải thích.
4. Trong repo được phép đọc, xem `.github/workflows/`, tìm `permissions`, `contents`, `GITHUB_TOKEN` và các action được gọi. Ghi `[job nào cần quyền ghi / lý do]`, không đọc giá trị secret.
5. Ghi các mục chưa xác minh và người có thể xác nhận. “Chưa xem được” không có nghĩa “chưa cấu hình”, cũng không đủ để kết luận an toàn.

## Tự giải thích

### Vì sao giới hạn token vẫn cần thiết khi đã bảo vệ nhánh?

Bảo vệ nhánh kiểm soát một đường thay đổi code. Token rộng có thể tác động tới repo khác hoặc cấu hình ngoài đường đó. Hai cơ chế bổ sung nhau: quyền hẹp giảm việc agent có thể làm, quy tắc nhánh đặt điều kiện nhận code.

### Vì sao không dùng PAT cá nhân cho mọi workflow?

Workflow có sẵn GITHUB_TOKEN và có thể giới hạn quyền theo job. Nếu nó đáp ứng tác vụ thì không cần mang thêm một thông tin xác thực cá nhân vào. Khi không đáp ứng, phải xem cơ chế phù hợp và quyền cụ thể, không tự mặc định tăng phạm vi.

### Fork có giúp người khác tự ghi vào repo gốc không?

Không. Fork là nơi họ sửa độc lập rồi đề xuất qua PR; người có quyền ở repo gốc quyết định nhận. Quyền và phạm vi hiển thị vẫn cần kiểm, nhất là repo private có chính sách hạn chế fork.

## Trắc nghiệm

### Agent xin mọi repo và không hết hạn để sửa README trong repo thử. Phản hồi nào phù hợp?

- [x] Giới hạn repo, thao tác và thời hạn theo công việc; hỏi rõ quyền còn thiếu
- [ ] Đồng ý vì đã dặn chỉ sửa README
- [ ] Cấp thêm quản trị để agent không bị chặn
- [ ] Chỉ đổi tên token thành “an toàn”

**Giải thích:** Tên token và lời dặn không thu hẹp quyền thực tế. Tác vụ nhỏ không biện minh cho quyền lâu dài trên mọi repo.

### Agent báo “main có protection, tôi dùng tài khoản admin nên không cần xem bypass”. Bạn xử lý thế nào?

- [ ] Chấp nhận vì admin luôn bị chặn giống mọi tài khoản
- [x] Kiểm quy tắc có áp dụng cho admin và quyền bypass của danh tính agent không
- [ ] Tắt protection để cấu hình đơn giản hơn
- [ ] Chỉ xem tên nhánh có phải main không

**Giải thích:** Branch protection mặc định có ngoại lệ cho admin và vai trò bypass. Phải đọc hiệu lực với đúng danh tính, không chỉ sự tồn tại của quy tắc.

### Job chỉ đọc repo nhưng agent đề xuất thêm quyền ghi rộng. Cách chọn là gì?

- [ ] Cấp ghi vì mọi action đều cần ghi
- [ ] Bỏ permissions để không action nào có token
- [x] Giữ quyền tối thiểu cần thiết, chẳng hạn contents: read nếu phù hợp job
- [ ] Dán PAT cá nhân vào file workflow cho tiện

**Giải thích:** Quyền phải theo tác vụ. Action có thể dùng token qua ngữ cảnh, nên không khai báo truyền token không chứng minh nó không có quyền.

### Required check hiện xanh nhưng log nói job bị skipped. Kết luận nào đúng?

- [ ] Toàn bộ test chắc chắn đã chạy
- [ ] Quy tắc branch protection đã bị GitHub xóa
- [ ] Chỉ cần thêm một approval là có bằng chứng test
- [x] Cần xem lý do bỏ qua và phần kiểm còn thiếu trước khi nhận code

**Giải thích:** Job skipped có thể không chặn merge. Approval không tạo kết quả thực thi; phải xác nhận kiểm cần thiết đã thực sự chạy.

## Kiểm tra không dùng AI

### Một cộng tác viên muốn sửa tài liệu công khai nhưng không có quyền ghi repo gốc. Họ đề nghị bạn gửi token quản trị qua chat. Hãy đề xuất cách phối hợp và nêu giới hạn.

#### Đáp án

Không gửi token quản trị. Có thể dùng fork nếu chính sách cho phép, làm trên nhánh riêng rồi gửi PR về repo gốc. Người có quyền review và nhận thay đổi theo quy tắc. Fork của repo public vẫn public, không đưa bí mật vào; fork không cấp quyền bỏ qua bảo vệ của repo gốc.

## Lỗi suy luận hay gặp

### “Có quyền admin thì agent xử lý nhanh hơn, không có hại”

Quyền đó có thể cho sửa cài đặt hoặc bỏ qua hàng rào bạn đang dựa vào. Chỉ cấp quyền cho nhiệm vụ; lỗi bị chặn cần được giải thích, không tự động giải quyết bằng quản trị.

### “Token có hạn dùng nên không cần giới hạn repo”

Trong thời gian còn hiệu lực, phạm vi rộng vẫn có thể gây hậu quả rộng. Hạn dùng giới hạn thời gian, lựa chọn repo và permissions giới hạn tài nguyên cùng hành động. Cần cả hai.

### “Projects đánh dấu xong nghĩa là PR đủ điều kiện merge”

Trạng thái công việc phục vụ theo dõi, không thay bằng chứng và quy tắc nhánh. Mở PR, xem diff, review và checks trước khi quyết định nhận code.

## Bài tập thực hành

Mục tiêu: lập bản cấp quyền tối thiểu cho agent. Chỉ dùng repo thử và nhánh thử hoặc cấu hình giả trên giấy; không sửa bảo vệ repo thật, không tạo hay chia sẻ token thật.

### Việc cần làm

1. Ghi tác vụ giả: sửa một đoạn hướng dẫn trong repo thử, mở PR vào nhánh thử, chưa merge.
2. Lập phiếu gồm Resource owner, Repository access, Permissions và Expiration bằng tên giả; giải thích mỗi quyền dự kiến cần cho thao tác nào.
3. Ghi quy tắc nhánh thử: bắt PR, review, kiểm cụ thể, chặn force push và xem ngoại lệ bypass. Không tự áp dụng lên repo thật.
4. Với job chỉ đọc repo, viết phần permissions dự kiến và giải thích vì sao chưa cần quyền ghi; không chạy workflow hay gọi dịch vụ.
5. Tự kiểm phiếu có repo ngoài nhiệm vụ, quyền quản trị hoặc token thật không. Không thử phá quy tắc bằng push, không xóa lịch sử hay force push.

### Kết quả đúng

Phiếu gắn từng quyền với một nhu cầu, có hạn dùng và danh sách repo rõ ràng. Bạn phân biệt được PAT, GITHUB_TOKEN, fork và quy tắc nhánh, đồng thời chỉ ra phần cần người quản lý xác nhận trước khi cấp quyền thật.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy lệnh ghi/xóa/push, không đọc hay in khóa bí mật. Không mở .env* hoặc gọi dịch vụ.
Chỉ rà phiếu quyền và cấu hình giả tôi cung cấp, không tạo token hay gọi GitHub.
1. Phạm vi quyền: cách kiểm: đối chiếu Resource owner, Repository access, Permissions, Expiration với tác vụ sửa hướng dẫn và mở PR thử.
2. Quy tắc nhánh: cách kiểm: chỉ dòng yêu cầu PR, review, checks, chặn force push và ngoại lệ bypass; đánh dấu phần cần quản lý xác nhận.
3. Job chỉ đọc: cách kiểm: chỉ dòng permissions dự kiến, giải thích vì sao quyền ghi thừa; phân biệt GITHUB_TOKEN với PAT và quyền của PR từ fork.
Báo cáo từng điểm: đạt / chưa đạt / chưa xác minh, kèm bằng chứng và phần còn thiếu.
```
